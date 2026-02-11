import { chatWithGemini } from "../services/geminiService";
import { generatePdf } from "../lib/fileGenerator";

export async function POST(req) {
  const { messages, attachments, sessionId, generationType } = await req.json();

  // Generate text with Gemini based on prompt template
  const generatedText = await chatWithGemini(
    messages,
    attachments,
    sessionId,
    generationType
  );

  // Always convert to PDF
  const fileBuffer = await generatePdf(generatedText);
  const contentType = "application/pdf";
  const fileName = "output.pdf";

  // Return as file download
  return new Response(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
