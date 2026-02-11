import { GoogleGenerativeAI } from "@google/generative-ai";
import systemPrompt from "../lib/systemPrompt";
import { loadDocument } from "../lib/documentLoaders";
import { MemoryManager } from "../lib/memoryManager";
import { researchPrompt, mcqPrompt, documentationPrompt } from "../lib/prompts";

function detectGenerationType(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes("mcq")) return "mcq";
  if (lowerPrompt.includes("research")) return "research";
  if (lowerPrompt.includes("documentation") || lowerPrompt.includes("docs"))
    return "documentation";
  return null;
}

// Setup memory store (in-memory, per session)
const memoryStore = new Map();
const getMemory = (sessionId) => {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, new MemoryManager());
  }
  return memoryStore.get(sessionId);
};

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error("GEMINI_API_KEY is not set");

const genAI = new GoogleGenerativeAI(API_KEY);

export const chatWithGemini = async (
  messages,
  attachments = [],
  sessionId,
  generationType = null
) => {
  try {
    const memory = getMemory(sessionId);

    // ✅ Get current user message
    const userMsg = messages.at(-1);
    const userContent = userMsg?.parts?.[0]?.text || userMsg?.text || "";

    // ✅ Add user message to memory
    memory.addMessage(sessionId, { role: "user", content: userContent });

    // ✅ Get full formatted history from memory
    const fullHistory = memory.getHistory(sessionId);
    const formattedHistory = fullHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const lastUserMessage = formattedHistory.at(-1);
    const previousMessages = formattedHistory.slice(0, -1);

    let extractedText = "";

    // 📄 Document context
    if (attachments.length > 0) {
      const file = attachments[0];
      const base64 = file.url.split(",")[1];
      const buffer = Buffer.from(base64, "base64");

      const docs = await loadDocument(buffer, file.type, file.name);
      extractedText = docs.map((doc) => doc.pageContent).join("\n\n");

      // lastUserMessage.parts.unshift({
      //   text: `📄 Document Context:\n${extractedText.slice(0, 10000)}`,
      // });
    }

    // 🧠 If generationType is provided, use a LangChain PromptTemplate
    let detectedType = generationType || detectGenerationType(userContent);

    if (detectedType && extractedText) {
      let promptInstance;
      if (detectedType === "research") promptInstance = researchPrompt;
      else if (detectedType === "mcq") promptInstance = mcqPrompt;
      else if (detectedType === "documentation")
        promptInstance = documentationPrompt;

      if (promptInstance) {
        const formattedPrompt = await promptInstance.format({
          context: extractedText.slice(0, 10000),
          question: userContent,
        });
        lastUserMessage.parts.unshift({ text: formattedPrompt });
      }
    } else if (extractedText) {
      lastUserMessage.parts.unshift({
        text: `📄 Document Context:\n${extractedText.slice(0, 10000)}`,
      });
    }

    // 🖼️ Image handling
    if (attachments.some((att) => att.isImage)) {
      const imageParts = attachments
        .filter((att) => att.isImage)
        .map((att) => ({
          inlineData: {
            data: att.url.split(",")[1] || att.url,
            mimeType: att.type,
          },
        }));
      lastUserMessage.parts.push(...imageParts);
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    let response;
    if (previousMessages.length === 0) {
      const result = await model.generateContent({
        contents: [lastUserMessage],
        systemInstruction: systemPrompt,
      });
      response = await result.response.text();
    } else {
      const chat = model.startChat({ history: previousMessages });
      const result = await chat.sendMessage(lastUserMessage.parts);
      response = await result.response.text();
    }

    // ✅ Add Gemini response to memory
    memory.addMessage(sessionId, { role: "model", content: response });

    return response?.trim() || null;
  } catch (error) {
    console.error("❌ Gemini Chat Error:", error);
    if (error.message?.includes("Rate limit")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(error.message || "Gemini API error occurred");
  }
};
