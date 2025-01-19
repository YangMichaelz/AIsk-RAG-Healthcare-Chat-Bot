import Header from './Header'
import ChatArea from './ChatArea'
import Login from './Login';
import './App.css'

function App() {

  return(
    <body>
      <div className="h-screen w-screen bg-gradient-to-r from-[#0f172a]  to-[#334155]">
        <Header/>
        <div className="lg:ml-48 lg:mr-48 md:ml-36 md:mr-36 sm:ml-5 sm:mr-5 w-auto md:pt-30 lg:pt-12 sm:pt-8 mx-auto flex flex-wrap flex-col items-center">
          <div className="flex justify-start w-full bg-slate-300 rounded-md p-2">
            <ChatArea/>
          </div>
        <Login/>
        </div>

      </div>

    </body>
  )
}

export default App
