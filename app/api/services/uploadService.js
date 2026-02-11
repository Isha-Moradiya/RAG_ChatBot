import { processFile } from "./embedService";
import { loadDocument } from "../lib/documentLoaders";
import { extractTextFromImage } from "../lib/imageLoader";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const supportedDocumentTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const supportedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const uploadService = async (file, userId) => {
  try {
    // Validate file
    if (!file || !file.buffer || !file.name) {
      throw new Error("Invalid file object provided");
    }

    const { buffer, type: mimeType, name: fileName, size } = file;
    const isImage = mimeType.startsWith("image/");
    const isSupportedDocument = supportedDocumentTypes.includes(mimeType);
    // const isSupportedImage = supportedImageTypes.includes(mimeType);

    // if (!isSupportedDocument && !isSupportedImage) {
    //   throw new Error(
    //     "Unsupported file type. Please upload PDF, DOCX, TXT, HTML files or images (JPEG, PNG, GIF, WebP)."
    //   );
    // }

    // Process based on file type
    let processingResult;

    if (isImage) {
      processingResult = await processImageFile(
        buffer,
        mimeType,
        fileName,
        userId
      );
      // response.image = imageResult;
    } else if (isSupportedDocument) {
      processingResult = await processDocumentFile(
        buffer,
        mimeType,
        fileName,
        userId
      );
      // response.embedding = documentResult;
    } else {
      throw new Error("Unsupported file type for processing");
    }

    return {
      success: true,
      file: {
        name: fileName,
        size,
        type: mimeType,
        isImage,
      },
      ...processingResult,
      processedAt: new Date().toISOString(),
      userId,
    };
  } catch (error) {
    console.error("Upload Service Error:", error);
    throw new Error(error.message);
  }
};

const processImageFile = async (buffer, mimeType, fileName, userId) => {
  try {
    // Extract text using OCR
    const imageText = await extractTextFromImage(buffer);

    if (!imageText?.trim()) {
      throw new Error(
        "Image uploaded but no text could be extracted. Please ensure the image contains readable text."
      );
    }

    // Process image for embeddings (if needed for future RAG)
    const imageResult = await processFile(buffer, mimeType, fileName, userId);

    return {
      success: true,
      extractedText: imageText.trim(),
      textLength: imageText.trim().length,
      documentId: imageResult.success ? imageResult.documentId : null,
      chunksCount: imageResult.success ? imageResult.chunksCount : 0,
      message: "Image processed successfully with OCR text extraction",
    };
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

const processDocumentFile = async (buffer, mimeType, fileName, userId) => {
  try {
    // Extract text using LangChain document loaders
    const docs = await loadDocument(buffer, mimeType, fileName);

    if (!docs || docs.length === 0) {
      throw new Error("Document uploaded but no content could be extracted");
    }

    const extractedText = docs.map((doc) => doc.pageContent).join("\n\n");

    if (!extractedText?.trim()) {
      throw new Error("Document uploaded but no text content found");
    }

    // Process document for embeddings
    const embeddingResult = await processFile(
      buffer,
      mimeType,
      fileName,
      userId
    );

    if (!embeddingResult.success) {
      throw new Error(`Document embedding failed: ${embeddingResult.message}`);
    }

    return {
      success: true,
      documentId: embeddingResult.documentId,
      chunksCount: embeddingResult.chunksCount,
      extractedText: extractedText.trim(),
      textLength: extractedText.trim().length,
      pages: docs.length,
      message: embeddingResult.message,
    };
  } catch (error) {
    console.error("Document processing error:", error);
    throw new Error(`Document processing failed: ${error.message}`);
  }
};

export const validateFile = (file) => {
  if (!file || !file.buffer || !file.name) {
    return { valid: false, message: "Invalid file object" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, message: "File too large. Maximum size is 10MB." };
  }

  const mimeType = file.type || "application/octet-stream";
  const isImage = mimeType.startsWith("image/");
  const isSupportedDocument = supportedDocumentTypes.includes(mimeType);
  const isSupportedImage = supportedImageTypes.includes(mimeType);

  if (!isSupportedDocument && !isSupportedImage) {
    return {
      valid: false,
      message:
        "Unsupported file type. Please upload PDF, DOCX, TXT, HTML files or images (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG).",
    };
  }

  return { valid: true };
};
