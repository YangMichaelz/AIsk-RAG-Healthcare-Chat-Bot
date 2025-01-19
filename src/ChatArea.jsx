import { useState, useEffect } from "react"
import Popup from "reactjs-popup"
import axios from 'axios';

function ChatArea(){
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [flag, setFlag] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [conversationName, setConversationName] = useState("");
  const [conversations, setConversations] = useState(new Map());

  useEffect(()=>{
      if(localStorage.getItem("email")){
          setClientEmail(localStorage.getItem("email"));
          fetchAllConversations();
      }
      
  })

  const setConvoName = (event) =>{
    fetchMessages(event.target.value);
    localStorage.setItem("current_conversation", event.target.value);
  }

  const fetchAllConversations = async () =>{
      if(clientEmail!=""){
          const response = await axios.post('http://localhost:3000/api/loadAllConversations', {
              body: [{Email: clientEmail}],
          }, {headers: { 'Content-Type': 'application/json' }});
  
          if(response.data["conversations"]){
              setConversations(new Map(Object.entries(response.data["conversations"])));
          }
      }
  }

  const saveNewConversation = async () =>{
    if(clientEmail!=""){
      var conversationInString = "";
      for(let i = 0; i < messages.length; i++){
        conversationInString+=(i==messages.length-1) ? messages[i] : messages[i]+"\0";
      }
      const response = await axios.post('http://localhost:3000/api/saveConversation', {
          body: [{Email: clientEmail, ConversationName: conversationName, Conversation: conversationInString}],
      }, {headers: { 'Content-Type': 'application/json' }});

      if(await response.data){
        console.log("Saved!");
      }else{
        console.log("Failed to save conversation");
      }
    }
  }
  const saveCurConversation = async () =>{
    if(clientEmail!=""){
      var conversationInString = "";
      for(let i = 0; i < messages.length; i++){
        conversationInString+=(i==messages.length-1) ? messages[i] : messages[i]+"\0";
      }
      const response = await axios.post('http://localhost:3000/api/saveConversation', {
          body: [{Email: clientEmail, ConversationName: localStorage.getItem("current_conversation"), Conversation: conversationInString}],
      }, {headers: { 'Content-Type': 'application/json' }});

      if(await response.data){
        console.log("Saved!");
      }else{
        console.log("Failed to save conversation");
      }
    }
  }

  function setNewConvName(event){
    setConversationName(event.target.value);
  }

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
      if(data){
        setMessages(messages => [...messages, data.reply]);
      }
      setFlag(false);
      var receiveAudio = new Audio("./src/assets/receive.mp3");
      receiveAudio.play();
    }
  }
  async function fetchMessages(convName){
    const response = await axios.post('http://localhost:3000/api/loadMessages', {
      body: [{Email: clientEmail, ConversationName: convName}],
    }, {headers: { 'Content-Type': 'application/json' }});
    const resData = await response.data;
    if(resData){
      const messageArray = resData.messages.split("\0");
      setMessages(messageArray);
    }
  }

    return(
      <div className="w-full flex transition-all">
            <div className="p-1 sm:h-[13rem] md:h-[26rem]">
              <h1 className="text-2xl">Chats</h1>
              <p1 className="text-md">Saved conversations</p1>
              <div className="overflow-y-auto h-full">
                  <ul class="list-disc rounded-l-md mt-6">
                  {[...conversations.keys()].map((convName, i)=>(
                      <li className="mt-3"><button className="text-center w-full bg-slate-800 rounded-md text-white md:p-2 sm:p-1 transition-all hover:bg-green-200" value={convName} onClick={setConvoName}>{convName}</button></li>
                  ))}
                </ul>    
              </div>
              <div className="mt-3">
              <Popup
              trigger={<button className=" bg-white text-sm rounded-2xl md:p-2 sm:p-1 transition-all hover:bg-green-200">Save current conversation</button>} 
              position="top center">
                  <div className="flex flex-col items-center bg-white p-2 rounded-2xl">
                  <input
                      className="rounded h-auto p-1 text-black transition bg-slate-200 w-full" placeholder="Name of this conversation" onChange={setNewConvName} value={conversationName}/>
                      <button className="text-left mt-3 bg-slate-200 text-sm rounded-2xl md:p-2 sm:p-1 transition-all hover:bg-green-200" onClick={saveNewConversation}>Save new</button>
                      {localStorage.getItem("current_conversation") ? 
                      <button className="text-left mt-3 bg-slate-200 text-sm rounded-2xl md:p-2 sm:p-1 transition-all hover:bg-green-200" onClick={saveCurConversation}>Save current</button>
                      : <></>}
                  </div>
              </Popup>
              </div>
          </div>
        <div className="p-2 w-full">
          <div className="bg-slate-700 flex justify-between rounded-t-2xl p-3">
            <div className="flex ">
              <div>
                <img src="./src/assets/doctor.png" alt="Avatar" class="rounded-full lg:w-16 sm:w-12 mr-3"/>
              </div>
              <div>
              <h1 className="font-medium lg:text-2xl sm:text-lg text-white">
                Assistant
              </h1>
              <p1 className="text-white lg:text-2xl sm:text-base">AI Chatbot</p1>
            </div>
          </div>

          </div>
          <div className = "sm:min-h-[14rem] sm:max-h-[14rem] md:min-h-[32rem] md:max-h-[32rem] lg:min-h-[27rem] lg:max-h-[27rem]  overflow-y-auto bg-slate-200 p-4">
                  {messages.map((message, i)=>(
                    <div>
                      {i % 2 == 0 ? <>
                        <div class="flex items-start justify-end mb-4">
                          <div class="bg-white p-3 rounded-lg text-gray-800 md:text-sm sm:text-[10px] ml-16">{message}</div>
                          <img src="./src/assets/user.png" alt="Avatar" class="lg:w-12 sm:w-10 rounded-full ml-3"></img>
                        </div>
                      </> : <>
                        <div class="flex items-start mb-4">
                          <img src="./src/assets/doctor.png" alt="Avatar" class="g:w-12 sm:w-10 rounded-full mr-3"/>
                          <div class="bg-white p-3 rounded-lg text-gray-800 md:text-sm sm:text-[10px] mr-16">{message}</div>
                        </div>
                      </>}
                    </div>
                  ))}
          </div>
        <form className="bg-opacity-0 w-full flex justify-between rounded-lg mt-8">
          <input
          className="rounded h-auto p-3 text-black transition bg-slate-200 w-full" 
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