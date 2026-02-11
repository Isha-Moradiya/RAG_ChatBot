import AdmZip from "adm-zip";

export async function extractImagesFromDocx(buffer) {
  try {
    const zip = new AdmZip(buffer);
    const images = [];

    zip.getEntries().forEach((entry) => {
      if (entry.entryName.startsWith("word/media/")) {
        images.push(entry.getData());
      }
    });

    return images;
  } catch (error) {
    console.error("DOCX Image Extraction Error:", error);
    return [];
  }
}
