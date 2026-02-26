// lib/pdfExtract.ts
export async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // ✅ Hard-disable workers (global + per-document)
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";   // prevents pdf.worker.mjs lookup
    pdfjsLib.GlobalWorkerOptions.workerPort = null;
  }

  const uint8 = new Uint8Array(buf);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    disableWorker: true,
    useWorkerFetch: false
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
