import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import AdditionAndWeather from "./components/AdditionAndWeather";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <AdditionAndWeather />
      
    </>
  )
}

export default App
