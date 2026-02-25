// lib/pdfExtract.ts
export async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  // pdfjs-dist v4 uses ESM (.mjs). Import dynamically to avoid bundler issues.
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjsLib.getDocument({ data: buf });
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
