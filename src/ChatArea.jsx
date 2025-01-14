import { useState, useEffect } from "react";
import axios from 'axios';

function ChatArea(){
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [flag, setFlag] = useState(false);

  function handleOnChange(event){
      setPrompt(event.target.value);
  }
  async function fetch(){
    if(prompt.trim() != ""){
      setFlag(true);
      setMessages(messages => [...messages, prompt]);
      var sendAudio = new Audio("./src/assets/send.mp3");
      sendAudio.play();
      var promptToSend = prompt;
      setPrompt("");
      const response = await axios.post('http://localhost:3000/api/chat',{
          messages: [{role: 'user', content: promptToSend}],
      },
      {headers: { 'Content-Type': 'application/json' }});
      
      const data = await response.data;
      if(data != null){
        setMessages(messages => [...messages, data.reply]);
      }
      setFlag(false);
      var receiveAudio = new Audio("./src/assets/receive.mp3");
      receiveAudio.play();
    }
  }

    return(
      <div className="bg-slate-400 rounded-md p-1 md:w-[48rem] lg:w-[64rem] sm:w-[16rem]">
        <div className="bg-white rounded-md p-5">
        <div className="bg-slate-700 justify-start flex rounded-t-2xl p-3">
          <div>
            <img src="./src/assets/doctor.png" alt="Avatar" class="rounded-full w-16 mr-3"/>
          </div>
          <div>
          <h1 className="font-medium text-2xl md:text-3xl text-white">
            Assistant
          </h1>
          <p1 className="text-white">AI Chatbot</p1>
          </div>
        </div>
        <div className = "md:min-h-[13rem] md:max-h-[16rem] lg:min-h-[27rem] lg:max-h-[32rem] overflow-y-auto bg-slate-200 p-4">
                {messages.map((message, i)=>(
                  <div>
                    {i % 2 == 0 ? <>
                      <div class="flex items-start justify-end mb-4">
                        <div class="bg-white p-3 rounded-lg text-gray-800 text-sm ml-16">{message}</div>
                        <img src="./src/assets/user.png" alt="Avatar" class="w-12 rounded-full ml-3"></img>
                      </div>
                    </> : <>
                      <div class="flex items-start mb-4">
                        <img src="./src/assets/doctor.png" alt="Avatar" class="w-12 rounded-full mr-3"/>
                        <div class="bg-white p-3 rounded-lg text-gray-800 text-sm mr-16">{message}</div>
                      </div>
                    </>}
                  </div>
                ))}
          </div>
        <form className="bg-opacity-0 w-full flex justify-between rounded-lg mt-8">
          <input
          className="rounded w-[64rem] h-auto p-3 text-black transition bg-slate-200" 
          id="prompt"
          placeholder="Type your message here" onChange={handleOnChange} value={prompt}/>
          <button className=" bg-slate-200  hover:bg-green-500 text-black font-bold py-2 px-4 ml-8 rounded duration-300 ease-in-out"
          type="button" disabled={flag} id="SendButton" onClick={fetch}>Send</button>
        </form>
        </div>
      </div>
    )

}

export default ChatArea;