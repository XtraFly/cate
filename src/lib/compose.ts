export type FrameStyle = "grail" | "paper" | "fill";

export type OverlayFlags = {
  horns: boolean;
  glasses: boolean;
  aviators: boolean;
  chain: boolean;
};

export type OverlayKey = keyof OverlayFlags;

export const OVERLAY_KEYS: OverlayKey[] = ["horns", "glasses", "aviators", "chain"];


export type ComposeOptions = {
  image: CanvasImageSource | null;
  imageWidth: number;
  imageHeight: number;
  size: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  goldWash: number;
  cOpacity: number;
  cScale: number;
  frame: FrameStyle;
  rimText: boolean;
  overlays: OverlayFlags;
  stickerScale: number;
  stickerX: number;
  stickerY: number;
};

const C_START = (38 * Math.PI) / 180;
const C_END = (322 * Math.PI) / 180;

function coinRadius(size: number, frame: FrameStyle) {
  if (frame === "fill") return size * 0.492;
  return size * 0.445;
}

function coverSize(imgW: number, imgH: number, diameter: number) {
  const aspect = imgW / Math.max(1, imgH);
  if (aspect >= 1) return { dw: diameter * aspect, dh: diameter };
  return { dw: diameter, dh: diameter / aspect };
}

function fillBackground(ctx: CanvasRenderingContext2D, size: number, frame: FrameStyle) {
  if (frame === "paper") {
    const g = ctx.createRadialGradient(size * 0.5, size * 0.4, size * 0.08, size * 0.5, size * 0.55, size * 0.82);
    g.addColorStop(0, "#fff6dc");
    g.addColorStop(0.55, "#f3e4bc");
    g.addColorStop(1, "#e2c888");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return;
  }
  const g = ctx.createRadialGradient(size * 0.5, size * 0.48, size * 0.12, size * 0.5, size * 0.52, size * 0.78);
  g.addColorStop(0, "#243044");
  g.addColorStop(0.45, "#101826");
  g.addColorStop(1, "#070b12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
}

function cBandPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  start: number,
  end: number,
) {
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, start, end, false);
  ctx.arc(cx, cy, innerR, end, start, true);
  ctx.closePath();
}

function cMetrics(r: number, cScale: number) {
  const k = Math.max(0.45, Math.min(1.05, cScale));
  const t = k / 0.85;
  return {
    mid: r * 0.55 * t,
    housing: r * 0.168 * t,
    start: C_START,
    end: C_END,
  };
}

function drawIvoryRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, ringW: number) {
  ctx.save();
  ctx.shadowColor = "rgba(255, 196, 70, 0.42)";
  ctx.shadowBlur = r * 0.28;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#0a1018";
  ctx.fill();
  ctx.restore();

  const band = ctx.createLinearGradient(cx - r, cy - r, cx + r * 0.6, cy + r);
  band.addColorStop(0, "#fff8e4");
  band.addColorStop(0.22, "#f3e2b6");
  band.addColorStop(0.55, "#e6cc8c");
  band.addColorStop(0.82, "#c9a45a");
  band.addColorStop(1, "#a47c32");

  ctx.save();
  ctx.lineWidth = ringW;
  ctx.strokeStyle = band;
  ctx.beginPath();
  ctx.arc(cx, cy, r - ringW * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = ringW * 0.2;
  const bevel = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  bevel.addColorStop(0, "#f0c14a");
  bevel.addColorStop(0.5, "#c49218");
  bevel.addColorStop(1, "#7a560e");
  ctx.strokeStyle = bevel;
  ctx.beginPath();
  ctx.arc(cx, cy, r - ringW + ringW * 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = Math.max(1.5, r * 0.01);
  ctx.strokeStyle = "rgba(90, 62, 16, 0.45)";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGoldDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, innerR: number) {
  const gold = ctx.createRadialGradient(cx - innerR * 0.18, cy - innerR * 0.22, innerR * 0.05, cx, cy, innerR);
  gold.addColorStop(0, "#f0d56a");
  gold.addColorStop(0.28, "#d7a428");
  gold.addColorStop(0.62, "#c08a14");
  gold.addColorStop(1, "#8a5e0c");
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = gold;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip();
  const sheen = ctx.createLinearGradient(cx - innerR, cy - innerR, cx + innerR, cy + innerR);
  sheen.addColorStop(0, "rgba(255, 240, 180, 0.18)");
  sheen.addColorStop(0.45, "rgba(255, 240, 180, 0)");
  sheen.addColorStop(1, "rgba(80, 50, 0, 0.18)");
  ctx.fillStyle = sheen;
  ctx.fillRect(cx - innerR, cy - innerR, innerR * 2, innerR * 2);
  ctx.restore();
}

function drawPortrait(
  ctx: CanvasRenderingContext2D,
  opt: ComposeOptions,
  cx: number,
  cy: number,
  innerR: number,
) {
  if (!opt.image || opt.imageWidth < 1) return;
  const diameter = innerR * 2 * opt.scale;
  const { dw, dh } = coverSize(opt.imageWidth, opt.imageHeight, diameter);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx + opt.offsetX * innerR, cy + opt.offsetY * innerR);
  ctx.rotate((opt.rotation * Math.PI) / 180);
  ctx.drawImage(opt.image, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  if (opt.goldWash > 0.005) {
    const t = opt.goldWash;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = `rgba(165, 112, 12, ${t * 0.92})`;
    ctx.fill();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(255, 196, 48, ${t * 0.88})`;
    ctx.fill();
    ctx.restore();
  }
}

const STICKER_SRC: Record<OverlayKey, string> = {
  horns: "/stickers/horns.png?v=14",
  glasses: "/stickers/glasses.png?v=14",
  aviators: "/stickers/aviators.png?v=14",
  chain: "/stickers/chain.png?v=14",
};

const STICKER_LAYOUT: Record<OverlayKey, { y: number; w: number; alpha: number }> = {
  horns: { y: -0.59, w: 1.8, alpha: 1 },
  glasses: { y: -0.06, w: 0.8, alpha: 1 },
  aviators: { y: -0.045, w: 0.9, alpha: 1 },
  chain: { y: 0.55, w: 0.52, alpha: 1 },
};

const stickerCache: Partial<Record<OverlayKey, HTMLImageElement>> = {};

export function preloadStickers(onReady?: () => void) {
  if (typeof Image === "undefined") return;
  for (const key of OVERLAY_KEYS) {
    let img = stickerCache[key];
    if (!img || !img.src.includes(STICKER_SRC[key])) {
      img = new Image();
      stickerCache[key] = img;
    }
    if (img.complete && img.naturalWidth > 1) {
      onReady?.();
      continue;
    }
    img.decoding = "async";
    img.onload = () => onReady?.();
    img.src = STICKER_SRC[key];
  }
}

function stickerOf(key: OverlayKey) {
  const img = stickerCache[key];
  if (!img?.complete || img.naturalWidth < 2) return null;
  return img;
}

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  opt: ComposeOptions,
  cx: number,
  cy: number,
  innerR: number,
) {
  const on = OVERLAY_KEYS.some((k) => opt.overlays[k]);
  if (!on) return;
  const s = Math.max(0.4, Math.min(2.4, opt.stickerScale ?? 1));
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(cx + (opt.stickerX ?? 0) * innerR, cy + (opt.stickerY ?? 0) * innerR);
  ctx.scale(s, s);

  for (const key of OVERLAY_KEYS) {
    if (!opt.overlays[key]) continue;
    const img = stickerOf(key);
    if (!img) continue;
    const layout = STICKER_LAYOUT[key];
    const w = innerR * layout.w;
    const h = w * (img.naturalHeight / img.naturalWidth);
    ctx.save();
    ctx.globalAlpha = layout.alpha;
    ctx.drawImage(img, -w / 2, layout.y * innerR - h / 2, w, h);
    ctx.restore();
  }

  ctx.restore();
}



/** Off-white C, square-cut ends, carved 3D. One color, no tube, no second-color outline. */
function drawChiseledC(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  cScale: number,
  opacity: number,
) {
  if (opacity < 0.01) return;
  const { mid, housing, start, end } = cMetrics(r, cScale);
  const outer = mid + housing / 2;
  const inner = Math.max(2, mid - housing / 2);
  const body = "#efe6d0";

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.save();
  ctx.shadowColor = "rgba(18, 10, 2, 0.42)";
  ctx.shadowBlur = r * 0.02;
  ctx.shadowOffsetX = r * 0.012;
  ctx.shadowOffsetY = r * 0.018;
  cBandPath(ctx, cx, cy, outer, inner, start, end);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.restore();

  cBandPath(ctx, cx, cy, outer, inner, start, end);
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  cBandPath(ctx, cx, cy, outer, inner, start, end);
  ctx.clip();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";

  ctx.beginPath();
  ctx.arc(cx, cy, inner + housing * 0.1, start, end, false);
  ctx.strokeStyle = "rgba(92, 72, 42, 0.28)";
  ctx.lineWidth = housing * 0.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, outer - housing * 0.1, start, end, false);
  ctx.strokeStyle = "rgba(255, 252, 246, 0.32)";
  ctx.lineWidth = housing * 0.16;
  ctx.stroke();

  ctx.strokeStyle = "rgba(62, 44, 18, 0.28)";
  ctx.lineWidth = Math.max(1.2, r * 0.007);
  for (const a of [start, end]) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function drawRimText(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, size: number) {
  const phrase = "In $CATE We Trust";
  const text = `${phrase}   ·   ${phrase}   ·   ${phrase}   ·   `;
  const chars = [...text];
  const fontSize = Math.max(10, size * 0.019);
  ctx.save();
  ctx.font = `700 ${fontSize}px Cinzel, "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ring = r * 0.935;
  const n = chars.length;
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * ring, cy + Math.sin(angle) * ring);
    ctx.rotate(angle + Math.PI / 2);
    ctx.lineWidth = Math.max(1.2, fontSize * 0.18);
    ctx.strokeStyle = "rgba(255, 236, 190, 0.7)";
    ctx.strokeText(chars[i], 0, 0);
    ctx.fillStyle = "#3a240c";
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

export function composeCatePfp(ctx: CanvasRenderingContext2D, opt: ComposeOptions) {
  const { size, frame } = opt;
  const cx = size / 2;
  const cy = size / 2;
  const r = coinRadius(size, frame);
  const ringW = r * 0.125;
  const innerR = r - ringW;
  const cScale = opt.cScale ?? 0.85;
  const cOpacity = opt.cOpacity ?? 1;

  ctx.clearRect(0, 0, size, size);
  fillBackground(ctx, size, frame);
  drawIvoryRing(ctx, cx, cy, r, ringW);
  drawGoldDisc(ctx, cx, cy, innerR);
  drawPortrait(ctx, opt, cx, cy, innerR);
  drawOverlays(ctx, opt, cx, cy, innerR);
  drawChiseledC(ctx, cx, cy, r, cScale, cOpacity);
  if (opt.rimText) drawRimText(ctx, cx, cy, r, size);
}


export async function exportCatePfp(opt: ComposeOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = opt.size;
  canvas.height = opt.size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not export.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  composeCatePfp(ctx, opt);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Export failed."));
    }, "image/png");
  });
}

export const SAMPLES = [
  { id: "tabby", src: "/samples/tabby.jpg?v=20", label: "Cate" },
  { id: "poorgoat", src: "/samples/poorgoat.jpg?v=3", label: "@PoorGoat_" },
  { id: "criptow", src: "/samples/criptow.jpg?v=14", label: "@criptow_" },
] as const;

export const CA = "Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump";
export const PUMP_URL = `https://pump.fun/coin/${CA}`;
export const DEX_URL = `https://dexscreener.com/solana/${CA}`;
export const SITE_URL = "https://cate.meme";
export const TELEGRAM_URL = "https://t.me/catecoin_telegram";
export const TIKTOK_URL = "https://www.tiktok.com/@poorgoat__";
export const CATE_X_URL = "https://x.com/CateonSol_";
export const FOMO_REF_URL = "https://fomo.family/r/criptow_";
export const FOMO_TOKEN_URL = `https://fomo.family/tokens/solana/${CA}`;
export const JUPITER_REFERRAL = "DqVTMB1feWifoqbNpE1KBh7VhiGDuHsML7gY1hjVivgs";
export const JUPITER_SWAP_URL = `https://jup.ag/swap/SOL-${CA}?referrer=${JUPITER_REFERRAL}`;


export function shareCaption(appUrl?: string) {
  const lines = [
    "Just stamped my $CATE grail.",
    "",
    "$CATE to a Trilly — DOGE's sister.",
    "",
    "PFP overlayer by @criptow_ · coin by @PoorGoat_",
  ];
  if (appUrl) lines.push("", `Make yours: ${appUrl}`);
  else lines.push("", "Make yours — search CATE Grail.");
  return lines.join("\n");
}

