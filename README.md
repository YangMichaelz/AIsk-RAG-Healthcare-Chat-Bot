# About AIsk
AIsk is a RAG (Retrieval-Augmented Generation) based healthcare chatbot developed with LangChain, Tavily, and Pinecone. This chatbot retrieves up-to-date and accurate information from trusted sources regarding any healthcare-related topic to generate context-enhanced responses. The web application is powered by MERN Stack (MongoDB, Express.js, React.js Node.js).
![Screenshot](https://github.com/user-attachments/assets/9461b0e1-ae87-4a97-b285-b4929c8a648e)

# How AIsk works
![Blank diagram](https://github.com/user-attachments/assets/928a26aa-be6f-49b5-aee4-9c282cefef3c)


# Getting started
- Clone this repository:
```
git clone https://github.com/YangMichaelz/AIsk-RAG-Healthcare-Chat-Bot
```
- Navigate to the directory of AIsk-RAG-Healthcare-Chat-Bot:
```
cd AIsk-RAG-Healthcare-Chat-Bot
```
- Install the dependencies:
```
npm install
```
- Create an ```.env``` file in the root directory and copy the contents of ```.env.example``` into ```.env```
- Update the variables in ```.env``` with your own values
- Start the frontend portion and then go to ```http://localhost:5173```
```
npm run dev
```
- Navigate to the server folder
```
cd server
```
- Start the server
```
node server
```
