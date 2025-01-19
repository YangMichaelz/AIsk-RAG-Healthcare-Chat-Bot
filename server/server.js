import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";
import { Pinecone } from "@pinecone-database/pinecone";
import express from "express";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { tavily } from "@tavily/core";
import cors from "cors";
import env from "dotenv";
import { addUser, getUserConversations, saveConversation } from "./db.js";

const app = express();
const corsOptions = { origin: "http://localhost:5173" };

env.config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
  includeMetadata: true,
});

const embedding_model = "multilingual-e5-large";

app.use(cors(corsOptions));
app.use(express.json());

const text_splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 650,
  chunkOverlap: 20,
  separators: ["\n\n", "\n", " "],
});

const ollama = new ChatOllama({
  model: "llama3.1:latest",
  temperature: 0.35,
  stop: [".", "?"],
});

var chatHistory = [];
var promptHistory = [];

const PROMPT_TEMPLATE = `You are a helpful medical assistant agent.Your role is to engage with users by discussing healthcare-related topics, primarily
focusing on the symptoms they are experiencing. You should always provide the most likely diagnoses based on the symptoms, while acknowledging that there are other possibilities. 
After suggesting possible causes, recommend steps for self-care or direct the user to appropriate healthcare professionals for deeper evaluation. Do not provide irrelevant information.
If you do not have any information available, reply politely that you do not have the information available. You MUST keep the response as concise as possible.
=====================================================================================================================================================================
Context: {context}
=====================================================================================================================================================================
Current conversation: {convo_history}

User: {prompt}
Assistant:`;

const PROMPT_TO_SEARCH_PROMPT = `Your job is to simplify any prompt for web browsing while retaining its essential point and intent. Use previous prompts for context to ensure relevance. 
Remove unnecessary details, special characters, and overly specific language, but keep key terms and phrases critical for accuracy. Prioritize clarity and brevity to optimize search engine performance.
===============================================================================================================================================================================
Context: {convo_history}
===============================================================================================================================================================================
User: {prompt}
Assistant:`;

/**
 * Call the llama3.1 model
 * @returns {string} The LLM's response
 */
let callOllama = async (prompt, promptTemplate, chatHistory, context) => {
  const promptTemp = ChatPromptTemplate.fromTemplate(promptTemplate);
  const chain = promptTemp.pipe(ollama);

  const response = await chain.invoke({
    prompt: prompt,
    context: context,
    convo_history: chatHistory,
  });

  chatHistory.push(new HumanMessage(prompt));
  chatHistory.push(new AIMessage(response.content));

  return response;
};
/**
 * Simplify the prompt, making it concise and ideal for web searching
 * @param {string} userPrompt - The user prompt
 * @returns {string} The simplified prompt
 */
let simplifyPrompt = async (userPrompt) => {
  const promptTemp = ChatPromptTemplate.fromTemplate(PROMPT_TO_SEARCH_PROMPT);
  const chain = promptTemp.pipe(ollama);

  const searchPrompt = await chain.invoke({
    prompt: userPrompt,
    convo_history: promptHistory,
  });
  return searchPrompt;
};
/**
 * Split metadata into small chunks and use vector embeddings and vector search to find top 5 relevant chunks
 * @param {string} searchResponse - Result of the search
 * @param {string} userPrompt - The user prompt
 * @returns {string} The context
 */
let processData = async (searchResponse, userPrompt) => {
  var chunks = text_splitter.splitText(searchResponse);
  var context = "";
  chunks = (await chunks).map((item, index) => ({
    id: index,
    content: item,
  }));
  const vectorDB = await pc.inference.embed(
    embedding_model,
    (await chunks).map((c) => c.content),
    { inputType: "passage", truncate: "END" }
  );

  const index = pc.index("chatbot");
  const records = (await chunks).map((d, i) => ({
    id: i.toString(),
    values: vectorDB[i].values,
    metadata: { text: d.content },
  }));

  await index.namespace("test").upsert(records);
  const query = [userPrompt];
  const queryEmbedding = await pc.inference.embed(embedding_model, query, {
    inputType: "query",
  });
  const queryResponse = await index.namespace("test").query({
    topK: 5,
    vector: queryEmbedding[0].values,
    includeValues: false,
    includeMetadata: true,
  });

  for (var i = 0; i < 5; i++) {
    if (queryResponse["matches"][i]["score"] >= 0.8) {
      context += JSON.stringify(
        queryResponse["matches"][i]["metadata"]["text"]
      );
    }
  }
  return context;
};
// POST endpoint for chat functionality
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const userPrompt = messages[0].content;
    console.log("received prompt: " + userPrompt);
    const searchPrompt = await simplifyPrompt(userPrompt);
    console.log(searchPrompt);
    promptHistory.push(new HumanMessage(userPrompt));
    promptHistory.push(new AIMessage(searchPrompt.content));
    var searchResultLink = null;
    try {
      searchResultLink = await tvly.searchContext(
        searchPrompt.content.toString(),
        {
          includeDomains: ["https://www.healthline.com/"],
          maxResults: 1,
        }
      );
    } catch (e) {
      console.log(e);
    }
    var searchResponse = null;
    if (searchResultLink) {
      const parsed = JSON.parse(JSON.parse(searchResultLink));
      const url = parsed[0]?.url;
      searchResponse = await tvly.extract([url]);
    }

    var context = "";
    if (searchResponse) {
      if (searchResponse.results[0]["rawContent"]) {
        context = await processData(
          searchResponse.results[0]["rawContent"],
          userPrompt
        );
      }
    }
    if (context != "") {
      console.log("Context found: " + context);
    }

    const response = await callOllama(
      userPrompt,
      PROMPT_TEMPLATE,
      chatHistory,
      context
    );

    res.json({ reply: response.content });
  } catch (error) {
    console.error("Detailed error:", error);
    res.json({ reply: "An error has occured, please try again" });
  }
});
// POST endpoint for saving a conversation
app.post("/api/saveConversation", async (req, res) => {
  const { body } = req.body;
  const convName = body[0].ConversationName;
  const convData = body[0].Conversation;
  const userEmail = body[0].Email;
  const flag = await saveConversation(convName, convData, userEmail);
  if (flag) {
    console.log("Saved!");
  } else {
    console.log("Failed to save");
  }
});
// POST endpoint for loading messages from mongoDB
app.post("/api/loadMessages", async (req, res) => {
  const { body } = await req.body;
  const convName = body[0].ConversationName;
  const userEmail = body[0].Email;
  const conversations = await getUserConversations(userEmail);
  const curConversation = conversations.get(convName).split("\0");
  chatHistory = [];
  promptHistory = [];
  for (let i = 0; i < curConversation.length; i++) {
    if (i % 2 == 0) {
      chatHistory.push(new HumanMessage(curConversation[i]));
      promptHistory.push(new HumanMessage(curConversation[i]));
    } else {
      chatHistory.push(new AIMessage(curConversation[i]));
    }
  }
  const messages = conversations.get(convName);
  if (messages) {
    res.json({ messages });
  } else {
    console.log("Conversation does not exist");
  }
});
// POST endpoint for loading every saved conversation
app.post("/api/loadAllConversations", async (req, res) => {
  const { body } = await req.body;
  const userEmail = body[0].Email;
  const conversations = await getUserConversations(userEmail);
  if (conversations) {
    res.json({ conversations });
  } else {
    console.log("No conversations available");
  }
});
// POST endpoint for adding new users to the DB
app.post("/api/addUser", async (req, res) => {
  const { body } = await req.body;
  const userEmail = body[0].Email;
  const username = body[0].Username;
  const addedUserToDB = await addUser(userEmail, username);
  if (addedUserToDB) {
    res.json({ reply: true });
  } else {
    res.json({ reply: false });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
