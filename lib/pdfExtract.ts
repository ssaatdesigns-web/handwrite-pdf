import pdfParse from "pdf-parse";

/**
 * Extract text from a text-based PDF buffer.
 * Note: This will NOT OCR scanned/image PDFs.
 */
export async function extractTextFromPdfBuffer(buf: Buffer): Promise<string> {
  const data = await pdfParse(buf);

  const raw = (data.text || "").replace(/\r/g, "");

  // Keep paragraph structure but remove excessive blank lines
  return raw.replace(/\n{3,}/g, "\n\n").trim();
}
