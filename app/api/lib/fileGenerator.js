import PDFDocument from "pdfkit";
import getStream from "get-stream";

// Always PDF generation
export async function generatePdf(text) {
  const pdf = new PDFDocument();
  
  // Use a safe built-in font so it works in Next.js builds
  pdf.font("Times-Roman");

  // Add AI-generated text
  pdf.text(text, {
    align: "left",
    lineGap: 4
  });

  pdf.end();
  return await getStream.buffer(pdf);
}
