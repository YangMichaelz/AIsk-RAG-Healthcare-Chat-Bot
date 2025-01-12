import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Header from './Header'
import ChatArea from './ChatArea'
import './App.css'

function App() {
  return(
    <body>
      <div className="h-screen w-screen bg-gradient-to-r from-[#0f172a]  to-[#334155]">
        <Header/>
        <div className="lg:ml-96 lg:mr-96 w-auto pt-36 md:pt-36 mx-auto flex flex-wrap flex-col items-center">
        <ChatArea/>
        </div>

      </div>

    </body>
  )
}

export default App
