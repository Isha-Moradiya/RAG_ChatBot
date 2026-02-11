import dbConnect from "../lib/mongodb";
import ChatMessage from "../models/ChatMessage";
import ChatSession from "../models/ChatSession";
import { chatWithGemini } from "./geminiService";
import { searchDocuments } from "./embedService";
import { extractTextFromImage } from "../lib/imageLoader";
import { loadDocument } from "../lib/documentLoaders";

export const enhancedChatService = async (
  messages,
  userId,
  sessionId = null,
  contextType = "document",
  documentId = null
) => {
  try {
    await dbConnect();

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      throw new Error("Invalid or missing userId");
    }

    const currentMessage = messages[messages.length - 1];
    const userMessage = currentMessage.content || currentMessage.text || "";
    const attachments = currentMessage.attachments || [];

    let contextContent = "";
    let extractedImageText = "";
    let extractedDocumentText = "";
    let documentsUsedArr = [];

    // Process stored documents from Pinecone (for document and both context types)
    if (contextType === "document" || contextType === "both") {
      const docs = await searchDocuments(userMessage, userId, 3, documentId);

      if (docs.length) {
        contextContent = docs
          .map((doc, i) => {
            const { fileName, chunkIndex, totalChunks, documentId } =
              doc.metadata;
            // Collect metadata for documentsUsed
            documentsUsedArr.push({ fileName, documentId, chunkIndex });
            return `[Document ${i + 1}: ${fileName} (Chunk ${
              chunkIndex + 1
            }/${totalChunks})]\n${doc.pageContent.trim()}`;
          })
          .join("\n\n");
      }
    }

    // Process current message attachments
    if (attachments.length > 0) {
      await Promise.all(
        attachments.map(async (attachment) => {
          try {
            const buffer = Buffer.from(attachment.data, "base64");

            if (attachment.mimeType?.startsWith("image/")) {
              if (contextType === "image" || contextType === "both") {
                const imageText = await extractTextFromImage(buffer);
                if (imageText?.trim()) {
                  extractedImageText += `\n\n[Image OCR - ${
                    attachment.name
                  }]:\n${imageText.trim()}`;
                }
              }
            } else if (
              [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain",
              ].includes(attachment.mimeType)
            ) {
              if (contextType === "document" || contextType === "both") {
                const docs = await loadDocument(
                  buffer,
                  attachment.mimeType,
                  attachment.name
                );
                if (docs?.length) {
                  const docText = docs
                    .map((doc) => doc.pageContent)
                    .join("\n\n");
                  if (docText?.trim()) {
                    extractedDocumentText += `\n\n[Uploaded Document - ${
                      attachment.name
                    }]:\n${docText.trim()}`;
                  }
                }
              }
            }
          } catch (error) {
            console.error(
              `Error processing attachment ${attachment.name}:`,
              error
            );
            if (attachment.mimeType?.startsWith("image/")) {
              extractedImageText += `\n\n[Image OCR - ${attachment.name}]:\nError: Could not process this image.`;
            } else {
              extractedDocumentText += `\n\n[Uploaded Document - ${attachment.name}]:\nError: Could not extract text from this document.`;
            }
          }
        })
      );
    }

    // Build enhanced message with context
    let enhancedMessage = userMessage;
    if (contextContent || extractedImageText || extractedDocumentText) {
      enhancedMessage = `Context:\n\n${contextContent}\n${extractedDocumentText}\n${extractedImageText}\n\nUser Question: ${userMessage}`;
    }

    const formattedMessage = {
      role: "user",
      parts: enhancedMessage,
      text: enhancedMessage,
      attachments,
    };

    const reply = await chatWithGemini(
      [formattedMessage],
      attachments,
      sessionId
    );
    if (!reply) throw new Error("Gemini did not return a response.");

    // Handle chat session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId });
      if (!session) throw new Error("Session not found");
    } else {
      session = await ChatSession.create({
        userId,
        name: `${
          contextType.charAt(0).toUpperCase() + contextType.slice(1)
        } Chat ${new Date().toLocaleDateString()}`,
      });
    }

    // Clean attachments for storage
    const cleanAttachments = attachments.map((att) => ({
      id: att.id || "",
      name: att.name || "Unknown File",
      size: typeof att.size === "number" ? att.size : 0,
      type: att.type || att.mimeType || "application/octet-stream",
      url: att.url || "",
      isImage: att.isImage || att.mimeType?.startsWith("image/") || false,
    }));

    // Save user message
    await ChatMessage.create({
      userId,
      sessionId: session._id,
      role: "user",
      text: userMessage,
      attachments: cleanAttachments,
      contextType,
      documentContext: {
        documentsUsed: documentsUsedArr,
        contextProvided: !!(
          contextContent ||
          extractedDocumentText ||
          extractedImageText
        ),
      },
      documentsReferenced: !!(contextContent || extractedDocumentText),
      timestamp: new Date(),
    });

    // Save model response
    await ChatMessage.create({
      userId,
      sessionId: session._id,
      role: "model",
      text: typeof reply === "string" ? reply : JSON.stringify(reply),
      timestamp: new Date(),
      documentContext: {
        documentsUsed: documentsUsedArr,
        contextProvided: !!(
          contextContent ||
          extractedDocumentText ||
          extractedImageText
        ),
      },
    });

    // Update session
    await ChatSession.findByIdAndUpdate(session._id, {
      $inc: { messageCount: 2 },
      updatedAt: new Date(),
    });

    return {
      success: true,
      reply,
      sessionId: session._id,
      sessionName: session.name,
      documentsUsed: documentsUsedArr,
      contextType,
      hasImageContent: !!extractedImageText,
      hasDocumentContent: !!(contextContent || extractedDocumentText),
    };
  } catch (err) {
    console.error("Enhanced Chat Error:", err);
    throw new Error(err.message);
  }
};

export const getChatHistoryWithDocuments = async (
  userId,
  sessionId = null,
  limit = 50
) => {
  try {
    await dbConnect();
    const query = { userId };
    if (sessionId) query.sessionId = sessionId;

    const messages = await ChatMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    return messages.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw new Error("Failed to fetch chat history");
  }
};
