import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

export async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({ data: buf });
  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const strings = content.items.map((item: any) => item.str);
    fullText += strings.join(" ") + "\n\n";
  }

  return fullText.trim();
}
