import { googleLogout } from "@react-oauth/google";
import { useState, useEffect } from "react"


function Header() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [userName, setUserName] = useState("Guest");

    useEffect(() =>{
      if(localStorage.getItem("email")){
        setLoggedIn(true);
        setUserName(localStorage.getItem("username"));
      }
    })
    
    const logout = () => {
      googleLogout();
      localStorage.removeItem("email");
      localStorage.removeItem("username");
      window.location.reload(false);
    }
    

    return(
        <div className="w-full container mx-auto max-h-screen ">
        <div className="w-full flex items-center justify-center p-4">
          <a className="flex items-center text-white no-underline hover:no-underline font-bold text-2xl lg:text-4xl">
            AI<span className="text-yellow-400">sk</span>
          </a>
        </div>
        <div className="flex justify-center">
          {loggedIn ? 
            <>
            <h1 className="text-2xl text-white">Welcome {userName}</h1> 
            </>
            : 
            <h1 className="text-2xl text-white">Welcome Guest</h1>}
        </div>
        <div className="flex justify-center">
        {loggedIn ? <button className=" bg-slate-20 font-bold bg-opacity-0 text-white rounded duration-300 ease-in-out"
            type="button" onClick={logout}>Logout</button> : <></>}
        </div>
      </div>
    )
}

export default Header
