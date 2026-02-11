import { PDFDocument } from 'pdf-lib';

export async function extractImagesFromPdf(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const images = [];
    
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPage(i);
      const embeddedImages = await page.getEmbeddedImages();
      
      for (const img of embeddedImages) {
        const imageBytes = await img.image.copyBytes();
        images.push(Buffer.from(imageBytes));
      }
    }
    
    return images;
  } catch (error) {
    console.error('PDF Image Extraction Error:', error);
    return [];
  }
}