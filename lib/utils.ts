export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function safeNumber(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function sanitizeFileName(name: string): string {
  return (name || "")
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = (hex || "").trim();
  const m = /^#?([0-9a-fA-F]{6})$/.exec(h);
  if (!m) return null;
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return { r, g, b };
}

/** small random jitter in points */
export function jitter(maxAbs: number) {
  return (Math.random() * 2 - 1) * maxAbs;
}

export function pickLineSpacing(paperType: "blank" | "single_ruled" | "multi_ruled", fontSize: number) {
  // Keep a stable handwriting look across paper types
  if (paperType === "multi_ruled") return Math.max(18, Math.floor(fontSize * 1.45));
  if (paperType === "single_ruled") return Math.max(22, Math.floor(fontSize * 1.55));
  return Math.max(20, Math.floor(fontSize * 1.6));
}
