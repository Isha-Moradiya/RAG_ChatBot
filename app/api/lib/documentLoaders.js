import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { Buffer } from "buffer";
import fs from "fs/promises";
import path from "path";
import { extractTextFromImage, extractTextFromImages } from "./imageLoader";
import { extractImagesFromPdf } from "../utils/pdfImageExtractor";
import { extractImagesFromDocx } from "../utils/docxImageExtractor";

const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function loadDocument(buffer, mimeType, originalName) {
  try {
    // Validate input
    if (!Buffer.isBuffer(buffer)) throw new Error("Invalid buffer");
    if (!SUPPORTED_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    // 🖼️ For images
    if (mimeType.startsWith("image/")) {
      const text = await extractTextFromImage(buffer);
      return [
        {
          pageContent: text,
          metadata: { source: originalName, mimeType },
        },
      ];
    }

    // 📄 For plain text
    if (mimeType === "text/plain") {
      const text = buffer.toString("utf-8");
      return [
        {
          pageContent: text,
          metadata: { source: originalName, mimeType },
        },
      ];
    }

    // 🛠️ Create temp file
    const tempDir = "./tmp";
    await fs.mkdir(tempDir, { recursive: true });
    const tempPath = path.join(
      tempDir,
      `temp_${Date.now()}${getExtension(mimeType)}`
    );
    await fs.writeFile(tempPath, buffer);

    // Select appropriate loader
    let docs;
    let images = [];

    try {
      switch (mimeType) {
        case "application/pdf": {
          const loader = new PDFLoader(tempPath);
          docs = await loader.load();
          images = await extractImagesFromPdf(buffer);
          break;
        }

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
          const loader = new DocxLoader(tempPath);
          docs = await loader.load();
          images = await extractImagesFromDocx(buffer);
          break;
        }

        default:
          throw new Error(`No loader available for mimeType: ${mimeType}`);
      }
    } finally {
      // Always clean up temp file
      await fs
        .unlink(tempPath)
        .catch((err) => console.error("Failed to delete temp file:", err));
    }

    // Process images in parallel
    const imageTexts =
      images.length > 0 ? await extractTextFromImages(images) : [];

    return [
      ...docs.map((doc) => ({
        pageContent: doc.pageContent,
        metadata: { ...doc.metadata, source: originalName, mimeType },
      })),
      ...imageTexts
        .filter((text) => text.trim())
        .map((text, idx) => ({
          pageContent: `[Image ${idx + 1}]: ${text}`,
          metadata: {
            source: originalName,
            mimeType: "image",
            imageIndex: idx,
            originalMimeType: mimeType,
          },
        })),
    ];
  } catch (error) {
    console.error(`Document loading failed (${mimeType}):`, error);
    throw error;
  }
}

function getExtension(mimeType) {
  const extensionMap = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "text/plain": ".txt",
  };
  return extensionMap[mimeType] || "";
}
