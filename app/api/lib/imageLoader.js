import { createWorker } from "tesseract.js";

// Single worker instance for better performance
let worker = null;

export async function extractTextFromImage(buffer, options = {}) {
  try {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error("Input must be a Buffer");
    }

    if (!worker) {
      worker = await createWorker("eng", {
        logger: (m) => console.log(m),
      });
    }

    const { data } = await worker.recognize(buffer, {
      ...options,
      rotateAuto: true,
      preserveInterwordSpaces: true,
    });

    return data.text?.trim() || "";
  } catch (error) {
    console.error("OCR Processing Error:", error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

export async function extractTextFromImages(images) {
  if (!images.length) return [];

  try {
    if (!worker) {
      worker = await createWorker();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
    }

    const results = await Promise.all(
      images.map((img) => extractTextFromImage(img))
    );
    return results;
  } catch (error) {
    console.error("Batch OCR Processing Error:", error);
    return [];
  }
}

// Call this when your application is shutting down
export async function cleanupOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
