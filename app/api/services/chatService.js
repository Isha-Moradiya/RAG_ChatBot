import dbConnect from "../lib/mongodb";
import ChatMessage from "../models/ChatMessage";
import ChatSession from "../models/ChatSession";
import { chatWithGemini } from "./geminiService";

export const chatService = async (messages, userId, sessionId = null) => {
  try {
    await dbConnect();

    const currentMessage = messages[messages.length - 1];
    const userText = currentMessage?.content?.trim();
    if (!userText) throw new Error("User message cannot be empty");

    // Get or create session
    const session = sessionId
      ? await ChatSession.findOne({ _id: sessionId, userId })
      : await ChatSession.create({
          userId,
          name: `Chat ${new Date().toLocaleDateString()}`,
          messageCount: 0,
        });

    if (!session) throw new Error("Session not found");

    // Format messages for Gemini
    const formattedMessages = messages.map((message) => ({
      role: message.role || "user",
      parts: message.content || "",
      attachments: message.attachments || [],
    }));

    // Get Gemini reply
    const reply = await chatWithGemini(
      formattedMessages,
      currentMessage.attachments || [],
      sessionId
    );
    if (!reply || !reply.trim())
      throw new Error("Model response text cannot be empty");

    // Save messages
    await Promise.all([
      ChatMessage.create({
        userId,
        sessionId: session._id,
        role: "user",
        text: userText,
        attachments: currentMessage.attachments || [],
      }),
      ChatMessage.create({
        userId,
        sessionId: session._id,
        role: "model",
        text: reply,
      }),
    ]);

    // Update session
    await ChatSession.findByIdAndUpdate(session._id, {
      $inc: { messageCount: 2 },
      updatedAt: new Date(),
    });

    return {
      reply,
      sessionId: session._id,
      sessionName: session.name,
    };
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    // if (err.message?.includes("Too Many Requests")) {
    //   throw new Error("Too many requests. Please try again later.");
    // }
    throw new Error(err.message || "Something went wrong");
  }
};
