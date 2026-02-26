// lib/pdfExtract.ts
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

export async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buf);

  const loadingTask = (pdfjsLib as any).getDocument({
    data: uint8,
    disableWorker: true // ✅ critical for Vercel
  });

  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const strings = content.items
      .map((item: any) => (typeof item?.str === "string" ? item.str : ""))
      .filter(Boolean);

    fullText += strings.join(" ") + "\n\n";
  }

  return fullText.trim();
}
