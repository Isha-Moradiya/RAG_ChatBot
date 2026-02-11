import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { loadDocument } from "../lib/documentLoaders";

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

const getNamespace = (userId) => `chatbot-files-${userId}`;

const filterMatches = (matches, { userId, documentId }) =>
  matches.filter(
    (match) =>
      match.metadata?.uploadedBy === String(userId) &&
      (!documentId || match.metadata?.documentId === String(documentId))
  );

// Process and embed a file
export const processFile = async (fileBuffer, fileType, fileName, userId) => {
  try {
    const documents = await loadDocument(fileBuffer, fileType, fileName);
    if (!documents?.length) {
      return { success: false, message: "Failed to load document content" };
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitDocuments(documents);
    if (!chunks.length) {
      return { success: false, message: "No content chunks generated" };
    }

    const documentId = `${userId}_${Date.now()}_${fileName.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}`;

    const chunksWithMetadata = chunks.map(
      (chunk, index) =>
        new Document({
          pageContent: chunk.pageContent,
          metadata: {
            uploadedBy: String(userId),
            documentId: String(documentId),
            chunkIndex: index,
            totalChunks: chunks.length,
          },
        })
    );

    await PineconeStore.fromDocuments(chunksWithMetadata, embeddings, {
      pineconeIndex: index,
      namespace: getNamespace(userId),
    });

    return {
      success: true,
      message: "File processed and embedded successfully",
      documentId,
      chunksCount: chunks.length,
    };
  } catch (error) {
    console.error("Error processing file:", error);
    return {
      success: false,
      message: "Failed to process file",
      error: error.message || "Unknown error",
    };
  }
};

// Search for similar documents
export const searchDocuments = async (
  query,
  userId,
  limit = 5,
  documentId = null
) => {
  try {
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: getNamespace(userId),
    });

    const filter = documentId ? { documentId: String(documentId) } : undefined;
    return await vectorStore.similaritySearch(query, limit, { filter });
  } catch (error) {
    console.error("Error searching documents:", error);
    throw error;
  }
};

// Delete document embeddings
export const deleteDocument = async (documentId, userId) => {
  try {
    const queryResponse = await index.query({
      vector: Array(768).fill(0),
      topK: 1000,
      includeMetadata: true,
      namespace: getNamespace(userId),
    });

    const matchesToDelete = filterMatches(queryResponse.matches || [], {
      userId,
      documentId,
    });

    if (matchesToDelete.length) {
      const idsToDelete = matchesToDelete.map((match) => match.id);
      await index.namespace(getNamespace(userId)).deleteMany(idsToDelete);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Get document statistics
export const getDocumentStats = async (userId) => {
  try {
    const queryResponse = await index.query({
      vector: Array(768).fill(0),
      topK: 1000,
      includeMetadata: true,
      namespace: getNamespace(userId),
    });

    const matches = filterMatches(queryResponse.matches || [], { userId });

    const documents = new Set(matches.map((m) => m.metadata?.documentId));
    return {
      totalDocuments: documents.size,
      totalChunks: matches.length,
    };
  } catch (error) {
    console.error("Error getting document stats:", error);
    throw error;
  }
};
