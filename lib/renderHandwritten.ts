import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { splitToParagraphs, wrapParagraphToLines } from "./textWrap";
import { clamp, hexToRgb, jitter, pickLineSpacing, safeNumber } from "./utils";

type PaperType = "blank" | "single_ruled" | "multi_ruled";
type HandStyle = "caveat" | "patrick_hand" | "indie_flower";

export async function renderHandwrittenPdf(params: {
  text: string;
  options: {
    paperType: PaperType;
    borderEnabled: boolean;
    borderThickness: number;
    borderMargin: number;
    penColor: string; // hex
    handStyle: HandStyle;
    fontSize: number;
  };
}): Promise<Uint8Array> {
  const { text, options } = params;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // A4 size in points (pdf-lib uses points): 595.28 × 841.89
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const margin = clamp(safeNumber(options.borderMargin, 48), 24, 110);
  const borderThickness = clamp(safeNumber(options.borderThickness, 2), 1, 10);
  const fontSize = clamp(safeNumber(options.fontSize, 16), 10, 30);

  const penRGB = hexToRgb(options.penColor) ?? { r: 17, g: 17, b: 17 };
  const pen = rgb(penRGB.r / 255, penRGB.g / 255, penRGB.b / 255);

  const font = await embedHandwritingFont(pdfDoc, options.handStyle);
  const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const paragraphs = splitToParagraphs(text);

  // Layout
  const contentLeft = margin + 18;
  const contentRight = pageWidth - (margin + 18);
  const contentTop = pageHeight - (margin + 28);
  const contentBottom = margin + 28;
  const maxWidth = contentRight - contentLeft;

  const lineSpacing = pickLineSpacing(options.paperType, fontSize);
  const paragraphGap = Math.max(6, Math.floor(lineSpacing * 0.35));

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  drawPaper(page, {
    paperType: options.paperType,
    borderEnabled: options.borderEnabled,
    borderThickness,
    margin,
    pageWidth,
    pageHeight
  });

  let cursorY = contentTop;

  // Render paragraphs
  for (const p of paragraphs) {
    // preserve single newlines inside paragraph as forced breaks
    const hardLines = p.split("\n");

    for (let i = 0; i < hardLines.length; i++) {
      const lineBlock = hardLines[i].trimEnd();

      // wrap block
      const wrapped = wrapParagraphToLines({
        paragraph: lineBlock,
        font,
        fontSize,
        maxWidth
      });

      for (const wl of wrapped) {
        if (cursorY - lineSpacing < contentBottom) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          drawPaper(page, {
            paperType: options.paperType,
            borderEnabled: options.borderEnabled,
            borderThickness,
            margin,
            pageWidth,
            pageHeight
          });
          cursorY = contentTop;
        }

        // "Handwritten" feel: slight random x/y shifts per line.
        const x = contentLeft + jitter(0.6);
        const y = cursorY + jitter(0.9);

        page.drawText(wl.text, {
          x,
          y,
          size: fontSize,
          font,
          color: pen
        });

        cursorY -= lineSpacing;
      }

      // if there was an explicit newline in source, keep a small gap (like manual break)
      if (i < hardLines.length - 1) {
        cursorY -= Math.floor(lineSpacing * 0.2);
      }
    }

    cursorY -= paragraphGap;
  }

  // If font fails for some characters, pdf-lib will still render but some glyphs could be missing.
  // Using fallback is complex per-character; for MVP, keep it simple.

  return await pdfDoc.save();
}

async function embedHandwritingFont(pdfDoc: PDFDocument, style: HandStyle) {
  const map: Record<HandStyle, string> = {
    caveat: "/fonts/Caveat-Regular.ttf",
    patrick_hand: "/fonts/PatrickHand-Regular.ttf",
    indie_flower: "/fonts/IndieFlower-Regular.ttf"
  };

  const path = map[style];
  const res = await fetchFileFromPublic(path);
  const fontBytes = new Uint8Array(res);
  return await pdfDoc.embedFont(fontBytes, { subset: true });
}

async function fetchFileFromPublic(path: string): Promise<ArrayBuffer> {
  // In Next.js serverless runtime, "public" isn't directly a filesystem path.
  // We fetch via URL relative to the server.
  // Vercel provides the URL origin from headers is not reliable; use absolute is hard here.
  // So we embed fonts via bundling is not trivial without fs.
  // Workaround: include fonts as base64 or import as bytes would be heavier.

  // Practical approach for Vercel: load fonts via fetch to same host using process.env.VERCEL_URL when present.
  const host =
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const url = `${host}${path}`;
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(
      `Font not found at ${path}. Add the .ttf into public/fonts and redeploy.`
    );
  }
  return await r.arrayBuffer();
}

function drawPaper(
  page: any,
  params: {
    paperType: PaperType;
    borderEnabled: boolean;
    borderThickness: number;
    margin: number;
    pageWidth: number;
    pageHeight: number;
  }
) {
  const { paperType, borderEnabled, borderThickness, margin, pageWidth, pageHeight } = params;

  // light paper tint
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(1, 1, 1)
  });

  // ruled lines
  if (paperType !== "blank") {
    const spacing = paperType === "single_ruled" ? 26 : 18;
    const top = pageHeight - (margin + 36);
    const bottom = margin + 24;

    for (let y = top; y > bottom; y -= spacing) {
      page.drawLine({
        start: { x: margin + 8, y },
        end: { x: pageWidth - (margin + 8), y },
        thickness: 0.6,
        color: rgb(0.82, 0.88, 1) // faint bluish
      });
    }
  }

  // border
  if (borderEnabled) {
    page.drawRectangle({
      x: margin,
      y: margin,
      width: pageWidth - 2 * margin,
      height: pageHeight - 2 * margin,
      borderColor: rgb(0.2, 0.25, 0.35),
      borderWidth: borderThickness
    });
  }
}
