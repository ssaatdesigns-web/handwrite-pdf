import { NextResponse } from "next/server";
import { extractTextFromPdfBuffer } from "../../../lib/pdfExtract";
import { renderHandwrittenPdf } from "../../../lib/renderHandwritten";
import { sanitizeFileName } from "../../../lib/utils";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("pdf");

    if (!(file instanceof File)) {
      return new NextResponse("Missing pdf file field (pdf).", { status: 400 });
    }

    const paperType = String(form.get("paperType") ?? "single_ruled");
    const borderEnabled = String(form.get("borderEnabled") ?? "true") === "true";
    const borderThickness = Number(form.get("borderThickness") ?? 2);
    const borderMargin = Number(form.get("borderMargin") ?? 48);
    const penColor = String(form.get("penColor") ?? "#111111");
    const handStyle = String(form.get("handStyle") ?? "caveat");
    const fontSize = Number(form.get("fontSize") ?? 16);
    const rawFileName = String(form.get("fileName") ?? "handwritten-output");

    const safeName = sanitizeFileName(rawFileName) || "handwritten-output";

    const pdfBuf = Buffer.from(await file.arrayBuffer());

    // 1) Extract text (best-effort)
    const extracted = await extractTextFromPdfBuffer(pdfBuf);
    if (!extracted.trim()) {
      return new NextResponse(
        "No text found. This looks like a scanned/image PDF. Please OCR it into a text PDF first.",
        { status: 400 }
      );
    }

    // 2) Render handwritten PDF
    const outBytes = await renderHandwrittenPdf({
      text: extracted,
      options: {
        paperType: paperType as any,
        borderEnabled,
        borderThickness,
        borderMargin,
        penColor,
        handStyle: handStyle as any,
        fontSize
      }
    });

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="${safeName}.pdf"`);

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="${safeName}.pdf"`);
    // ✅ Use Node Buffer to satisfy BodyInit typing in Node runtime
    const nodeBody = Buffer.from(outBytes);
    return new NextResponse(nodeBody, { status: 200, headers });
    
  } catch (e: any) {
    return new NextResponse(e?.message || "Server error", { status: 500 });
  }
}
