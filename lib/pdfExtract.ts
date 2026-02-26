// lib/pdfExtract.ts
export async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // ✅ PDF.js on serverless: disable worker (prevents fake worker error)
  const uint8 = new Uint8Array(buf);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    disableWorker: true
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
