// lib/pdfExtract.ts
export async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // ✅ Convert Buffer -> Uint8Array (required)
  const uint8 = new Uint8Array(buf);

  // ✅ Hard-disable workers (prevents fake-worker and prevents worker bundling)
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    disableWorker: true,
  });

  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const strings = content.items
      .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
      .filter(Boolean);

    fullText += strings.join(" ") + "\n\n";
  }

  return fullText.trim();
}
