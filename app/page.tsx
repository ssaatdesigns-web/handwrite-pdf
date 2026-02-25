"use client";

import { useMemo, useState } from "react";

type PaperType = "blank" | "single_ruled" | "multi_ruled";
type HandStyle = "caveat" | "patrick_hand" | "indie_flower";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [paperType, setPaperType] = useState<PaperType>("single_ruled");
  const [borderEnabled, setBorderEnabled] = useState(true);
  const [borderThickness, setBorderThickness] = useState(2);
  const [borderMargin, setBorderMargin] = useState(48);

  const [penPreset, setPenPreset] = useState<"black" | "blue" | "red" | "custom">("black");
  const [penHex, setPenHex] = useState("#000000");

  const [handStyle, setHandStyle] = useState<HandStyle>("caveat");
  const [fontSize, setFontSize] = useState(16);

  const [fileName, setFileName] = useState("handwritten-output");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const penColor = useMemo(() => {
    if (penPreset === "black") return "#111111";
    if (penPreset === "blue") return "#0a3cff";
    if (penPreset === "red") return "#d11a2a";
    return penHex;
  }, [penPreset, penHex]);

  async function onConvert() {
    setErr(null);
    if (!file) {
      setErr("Please upload a PDF file.");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("pdf", file);

      fd.append("paperType", paperType);
      fd.append("borderEnabled", String(borderEnabled));
      fd.append("borderThickness", String(borderThickness));
      fd.append("borderMargin", String(borderMargin));
      fd.append("penColor", penColor);
      fd.append("handStyle", handStyle);
      fd.append("fontSize", String(fontSize));
      fd.append("fileName", fileName);

      const res = await fetch("/api/convert", { method: "POST", body: fd });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Conversion failed.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName || "handwritten-output"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="card">
      <div className="grid">
        <div>
          <label>Upload text-based PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="note">
            Tip: If your PDF is scanned (image-only), convert it to text first using OCR before using this tool.
          </div>

          <hr className="sep" />

          <div className="grid">
            <div>
              <label>Paper type</label>
              <select value={paperType} onChange={(e) => setPaperType(e.target.value as PaperType)}>
                <option value="blank">Blank</option>
                <option value="single_ruled">Single ruled</option>
                <option value="multi_ruled">Multiple ruled</option>
              </select>
            </div>

            <div>
              <label>Handwriting style</label>
              <select value={handStyle} onChange={(e) => setHandStyle(e.target.value as HandStyle)}>
                <option value="caveat">Caveat</option>
                <option value="patrick_hand">Patrick Hand</option>
                <option value="indie_flower">Indie Flower</option>
              </select>
            </div>

            <div>
              <label>Font size</label>
              <input
                type="number"
                min={10}
                max={30}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>

            <div>
              <label>Output filename (no .pdf)</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="handwritten-output"
              />
            </div>
          </div>
        </div>

        <div>
          <label>Border</label>
          <div className="row">
            <input
              id="borderEnabled"
              type="checkbox"
              checked={borderEnabled}
              onChange={(e) => setBorderEnabled(e.target.checked)}
            />
            <label htmlFor="borderEnabled" style={{ margin: 0 }}>
              Enable border
            </label>
          </div>

          <div className="grid" style={{ marginTop: 10 }}>
            <div>
              <label>Border thickness</label>
              <input
                type="number"
                min={1}
                max={8}
                value={borderThickness}
                onChange={(e) => setBorderThickness(Number(e.target.value))}
              />
            </div>
            <div>
              <label>Border margin (px)</label>
              <input
                type="number"
                min={24}
                max={96}
                value={borderMargin}
                onChange={(e) => setBorderMargin(Number(e.target.value))}
              />
            </div>
          </div>

          <hr className="sep" />

          <label>Pen color</label>
          <div className="grid">
            <div>
              <select value={penPreset} onChange={(e) => setPenPreset(e.target.value as any)}>
                <option value="black">Black</option>
                <option value="blue">Blue</option>
                <option value="red">Red</option>
                <option value="custom">Custom (hex)</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                value={penHex}
                onChange={(e) => setPenHex(e.target.value)}
                disabled={penPreset !== "custom"}
                placeholder="#123ABC"
              />
            </div>
          </div>

          <div className="note">
            Pen color supports <code>#RRGGBB</code>. Example: <code>#1a1a1a</code>.
          </div>

          <hr className="sep" />

          {err && (
            <div className="note" style={{ color: "#ff9aa5" }}>
              {err}
            </div>
          )}

          <button className="btn" onClick={onConvert} disabled={loading || !file}>
            {loading ? "Converting..." : "Convert & Download"}
          </button>

          <div className="note">
            Vercel serverless has size/time limits. Keep PDFs moderate (e.g., under ~5–10 MB and not hundreds of pages).
          </div>
        </div>
      </div>
    </main>
  );
}
