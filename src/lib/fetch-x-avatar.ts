import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const HANDLE = z.object({
  handle: z.string().min(1).max(80),
});

function cleanHandle(raw: string) {
  let h = raw.trim();
  h = h.replace(/^@/, "");
  h = h.replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "");
  h = h.split(/[/?#]/)[0] ?? "";
  h = h.replace(/[^A-Za-z0-9_]/g, "");
  if (h.length < 1 || h.length > 15) return null;
  return h;
}

function toBase64(buf: ArrayBuffer) {
  if (typeof Buffer !== "undefined") return Buffer.from(buf).toString("base64");
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function upgradeAvatar(url: string) {
  return url.replace(/_(?:normal|mini|bigger|reasonably_small)\.(jpg|jpeg|png|webp)(\?.*)?$/i, "_400x400.$1$2");
}

const UA = "Mozilla/5.0 (compatible; CateGrail/1.0; +https://x.com/criptow_)";

async function fetchImage(url: string) {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": UA },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  const mime = (res.headers.get("content-type") ?? "").split(";")[0]?.trim() || "image/jpeg";
  if (!mime.startsWith("image/")) return null;
  const buf = await res.arrayBuffer();
  if (buf.byteLength < 600 || buf.byteLength > 5_000_000) return null;
  return { mime, dataUrl: `data:${mime};base64,${toBase64(buf)}` };
}

async function fromFx(handle: string) {
  const res = await fetch(`https://api.fxtwitter.com/${encodeURIComponent(handle)}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { user?: { avatar_url?: string; avatar?: string } };
  const raw = json.user?.avatar_url || json.user?.avatar;
  if (!raw) return null;
  const upgraded = upgradeAvatar(raw);
  return (await fetchImage(upgraded)) ?? (await fetchImage(raw));
}

export const fetchXAvatar = createServerFn({ method: "POST" })
  .validator(HANDLE)
  .handler(async ({ data }) => {
    const handle = cleanHandle(data.handle);
    if (!handle) {
      return { ok: false as const, error: "That doesn't look like an X handle." };
    }

    try {
      const fx = await fromFx(handle);
      if (fx) return { ok: true as const, handle, dataUrl: fx.dataUrl };
    } catch {
      // try unavatar
    }

    const urls = [
      `https://unavatar.io/twitter/${handle}`,
      `https://unavatar.io/x/${handle}`,
    ];
    for (const url of urls) {
      try {
        const img = await fetchImage(url);
        if (img) return { ok: true as const, handle, dataUrl: img.dataUrl };
      } catch {
        continue;
      }
    }

    return { ok: false as const, error: `Couldn't find a photo for @${handle}.` };
  });
