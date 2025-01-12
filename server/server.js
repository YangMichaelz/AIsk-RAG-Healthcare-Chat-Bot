import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";
import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
import { Pinecone } from "@pinecone-database/pinecone";
import express from "express";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import cors from "cors";
import env from "dotenv";

const app = express();
const corsOptions = { origin: "http://localhost:5173" };

env.config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const tvly = new TavilySearchAPIRetriever({
  apiKey: process.env.TAVILY_API_KEY,
  maxResults: 1,
  includeDomains: ["https://www.healthline.com/"],
  includeRawContent: true,
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
  temperature: 0.2,
  stop: [".", "?"],
});

const chatHistory = [];
const promptHistory = [];

const PROMPT_TEMPLATE = `You are a helpful medical assistant agent.Your role is to engage with users by discussing healthcare-related topics, primarily
focusing on the symptoms they are experiencing. You should always provide the most likely diagnoses based on the symptoms, while acknowledging that there are other possibilities. 
After suggesting possible causes, recommend steps for self-care or direct the user to appropriate healthcare professionals for deeper evaluation. Do not provide irrelevant information.
If you do not have any information available, reply politely that you do not have the information available. if the prompt seems general enough, you may use 
your own judgement. You MUST keep the response as concise as possible.
=====================================================================================================================================================================
Context: {context}
=====================================================================================================================================================================
Current conversation: {convo_history}

User: {prompt}
Assistant:`;

const PROMPT_TO_SEARCH_PROMPT = `Your job is to convert any prompt into a short and concise prompt that is used for web browsing, while maintaining the context within the prompt.
=====================================================================================================================================================================
EXAMPLE:
User: What are some of the symptoms of fever?
Assistant: Fever symptoms
User: What is the difference between type 2 diabetes and type 1 diabetes?
Assistant: Type 1 diabetes vs type 2 diabetes
=====================================================================================================================================================================
Prompt history: {convo_history}

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
  var chunks = text_splitter.splitText(searchResponse[0]["pageContent"]);
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

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const userPrompt = messages[0].content;

    const searchPrompt = await simplifyPrompt(userPrompt);

    promptHistory.push(new HumanMessage(userPrompt));
    promptHistory.push(new AIMessage(searchPrompt.content));

    const searchResponse = await tvly.invoke(searchPrompt.content);

    var context = "";
    if (searchResponse[0]?.["pageContent"] != null) {
      context = await processData(searchResponse, userPrompt);
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
    res.status(500).json({ error: error.message });
  }
});
app.listen(3000, () => console.log("Server running on port 3000"));
