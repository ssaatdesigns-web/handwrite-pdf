import type { PDFFont } from "pdf-lib";

export type WrappedLine = { text: string };

export function wrapParagraphToLines(params: {
  paragraph: string;
  font: PDFFont;
  fontSize: number;
  maxWidth: number;
}): WrappedLine[] {
  const { paragraph, font, fontSize, maxWidth } = params;
  const words = paragraph.split(/\s+/).filter(Boolean);
  const lines: WrappedLine[] = [];

  let current = "";
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(next, fontSize);

    if (width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push({ text: current });
      // If a single word exceeds maxWidth, hard-split it.
      if (font.widthOfTextAtSize(w, fontSize) > maxWidth) {
        const parts = hardSplitWord(w, font, fontSize, maxWidth);
        for (let i = 0; i < parts.length - 1; i++) {
          lines.push({ text: parts[i] });
        }
        current = parts[parts.length - 1];
      } else {
        current = w;
      }
    }
  }
  if (current) lines.push({ text: current });
  return lines;
}

function hardSplitWord(word: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const parts: string[] = [];
  let chunk = "";
  for (const ch of word) {
    const next = chunk + ch;
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      chunk = next;
    } else {
      if (chunk) parts.push(chunk);
      chunk = ch;
    }
  }
  if (chunk) parts.push(chunk);
  return parts;
}

/**
 * Split extracted text into paragraphs while preserving line breaks.
 * Strategy:
 * - Double newline separates paragraphs.
 * - Single newline inside a paragraph is treated as a line break.
 */
export function splitToParagraphs(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);
}
