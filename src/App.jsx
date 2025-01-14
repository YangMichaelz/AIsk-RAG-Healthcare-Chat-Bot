import Header from './Header'
import ChatArea from './ChatArea'
import { useEffect } from 'react';
import './App.css'

function App() {

  useEffect(() => {
    const unloadCallback = (event) => {
      event.preventDefault();
      return;
    };
  
    window.addEventListener("beforeunload", unloadCallback);
    return () => window.removeEventListener("beforeunload", unloadCallback);
  }, []);
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
