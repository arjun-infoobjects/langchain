import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";



dotenv.config();

const app = express();
const PORT = 8000;
const corsOptions = {
    origin: "http://localhost:5173",
    methods: "GET, POST, PUT, PATCH, DELETE",
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server started on the PORT ${PORT}.`);
});

app.post("/api/data", async (req, res) => {
    console.log("POST request executed.");
    console.log(req.body);
    let isReject = false;
        const addTool = tool(
            async ({ a, b }) => {
                return `The sum of ${a} and ${b} is ${a + b}`;
            },
            {
                name: "add_numbers",
                description: "Add two numbers together",
                schema: z.object({
                    a: z.number(),
                    b: z.number(),
                }),
            }
        );

        
        const weatherTool = tool(
            async ({ city }) => {
                
                const res = await axios.get(
                    `https://api.weatherapi.com/v1/current.json?key=b665263ac95944e5927115520262801&q=${city}&aqi=yes`
                );
                return `Weather in ${city}: ${res.data.current.temp_c}°C, ${res.data.current.condition.text}`;
            },
            {
                name: "get_weather",
                description: "Get current weather of a city",
                schema: z.object({
                    city: z.string(),
                }),
            }
        );

        const tools = [addTool, weatherTool];

        
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-2.5-flash", 
            temperature: 0,
        }).bindTools(tools);

        
        function shouldReject(state) {
            const lastMsg = state.messages[state.messages.length - 1];

            
            if (!lastMsg.tool_calls || lastMsg.tool_calls.length === 0) {
                return "reject";
            }
            return "tools";
        }

        
        async function rejectNode(state) {
            isReject = true;
            return {
                messages: [
                    new AIMessage("Sorry, I can't help you with that."),
                ],
            };
        }

        
        const toolNode = new ToolNode(tools);

        const graph = new StateGraph(MessagesAnnotation)
            .addNode("agent", async (state) => {
                const response = await model.invoke(state.messages);
                return { messages: [response] };
            })
            .addNode("tools", toolNode)
            .addNode("reject", rejectNode)
            .addConditionalEdges("agent", shouldReject)
            .addEdge("tools", "agent") 
            .setEntryPoint("agent")
            .compile();

        
        async function chat(userInput) {
            
            const result = await graph.invoke({
                messages: [new HumanMessage(userInput)],
            });

            const finalMessage = result.messages[result.messages.length - 1];
            console.log("In chat :", finalMessage.content);
            return finalMessage.content;
        }

        
        const llmResponse = await chat(req.body.query);
        console.log("llmResponse :", llmResponse);
        console.log("isReject :", isReject);
        return res.json({llmResponse: llmResponse, isReject: isReject});
        
})

