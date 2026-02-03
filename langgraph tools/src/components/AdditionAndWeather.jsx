import "../styles/addition-and-weather.css";
import {useState} from "react";
import axios from "axios";



const AdditionAndWeather =  () => {
    const [queryData, setQueryData] = useState({
        query: ""
    });
    const [AIData, setAIData] = useState();
    const [reject, setReject] = useState();
    const [flag, setFlag] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await axios.post("http://localhost:8000/api/data", queryData);
        
        setAIData(result.data.llmResponse);
        setReject(result.data.isReject);
        setFlag(true);
        setQueryData({...queryData, query: ""});
    }
    
    
    return (
        <>
        <h1>What can I help with?</h1>
        <form onSubmit = {handleSubmit}>
        <div className = "input-container">
            <div className = "input-box">
                <input type = "text" placeholder = "Ask anything" value = {queryData.query} onChange = {(e) => setQueryData({...queryData, query: e.target.value})} />
                <button type = "submit">
                    Send
                </button>
            </div>
        </div>
        </form>

        {flag && (
            <>
                    <div className="data-container">
                        <div className={reject ? "data-content-rejected" : "data-content"}>
                            {AIData}
                        </div>
                    </div>

            </>
        )}

        
        </>
    )
}

export default AdditionAndWeather;