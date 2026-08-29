#!/usr/bin/env python3
"""Chroma-key Imagine JPEGs into transparent sticker PNGs."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace")
OUT = ROOT / "public" / "stickers"
OUT.mkdir(parents=True, exist_ok=True)

MAGENTA = np.array([255.0, 0.0, 255.0])


def dist_magenta(rgb: np.ndarray) -> np.ndarray:
    return np.sqrt(((rgb - MAGENTA) ** 2).sum(axis=2))


def is_goldish(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    # minted gold / ivory / diamond white — not magenta, not blue, not green
    gold = (r > 45) & (g > 15) & (r >= g * 0.75) & (r > b * 1.1) & (g >= b * 0.45)
    diamond = (r > 170) & (g > 170) & (b > 150) & (r + g > b * 1.6)
    return gold | diamond


def flood_bg(alpha: np.ndarray, rgb: np.ndarray, edge: float) -> np.ndarray:
    h, w = alpha.shape
    d = dist_magenta(rgb)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        q.append((0, x))
        q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0))
        q.append((y, w - 1))
    while q:
        y, x = q.popleft()
        if y < 0 or x < 0 or y >= h or x >= w or visited[y, x]:
            continue
        visited[y, x] = True
        if alpha[y, x] < 8 or d[y, x] < edge:
            alpha[y, x] = 0
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    if dy or dx:
                        q.append((y + dy, x + dx))
    return alpha


def despill(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    mag = np.clip(np.minimum(r, b) - g, 0, None)
    out = rgb.copy()
    out[:, :, 0] = np.clip(r - mag * 0.9, 0, 255)
    out[:, :, 2] = np.clip(b - mag * 0.9, 0, 255)
    fringe = (alpha > 8) & (alpha < 230) & (mag > 6)
    out[:, :, 1] = np.where(fringe, np.clip(g + mag * 0.4, 0, 255), out[:, :, 1])
    return out


def crop_content(rgba: np.ndarray, pad: int = 16) -> np.ndarray:
    a = rgba[:, :, 3]
    ys, xs = np.where(a > 12)
    if len(xs) == 0:
        return rgba
    y0, y1 = max(0, int(ys.min()) - pad), min(rgba.shape[0], int(ys.max()) + pad + 1)
    x0, x1 = max(0, int(xs.min()) - pad), min(rgba.shape[1], int(xs.max()) + pad + 1)
    return rgba[y0:y1, x0:x1]


def key_image(src: Path, hard: float = 55, soft: float = 120, edge: float = 150, gold_only: bool = True) -> np.ndarray:
    im = Image.open(src).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    rgb = arr[:, :, :3]
    d = dist_magenta(rgb)
    alpha = arr[:, :, 3]
    t = np.clip((d - hard) / max(1.0, soft - hard), 0, 1)
    alpha = alpha * t
    if gold_only:
        alpha = np.where(is_goldish(rgb), alpha, 0)
    alpha = flood_bg(alpha, rgb, edge)
    rgb = despill(rgb, alpha)
    rgba = np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8)
    return crop_content(rgba, pad=18)


def punch_lens_ellipses(rgba: np.ndarray, alpha_fill: int = 38) -> np.ndarray:
    """Clear two eye holes and fill with 15% pale gold glass. Keep the metal rim."""
    h, w = rgba.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    lenses = [
        (w * 0.28, h * 0.54, w * 0.175, h * 0.34),
        (w * 0.72, h * 0.54, w * 0.175, h * 0.34),
    ]
    out = rgba.copy()
    glass = np.array([255, 236, 190, alpha_fill], dtype=np.uint8)
    for cx, cy, rx, ry in lenses:
        inner = ((xx - cx) / (rx * 0.86)) ** 2 + ((yy - cy) / (ry * 0.86)) ** 2 <= 1.0
        out[inner] = glass
    return out


def scale_nonlens_alpha(rgba: np.ndarray, factor: float, lens_alpha: int = 38) -> np.ndarray:
    out = rgba.copy()
    a = out[:, :, 3].astype(np.float32)
    lens = a <= lens_alpha + 4
    a = np.where(lens, a, np.clip(a * factor, 0, 255))
    out[:, :, 3] = a.astype(np.uint8)
    return out


def save(arr: np.ndarray, name: str) -> None:
    path = OUT / name
    Image.fromarray(arr, "RGBA").save(path, optimize=True)
    opaque = (arr[:, :, 3] > 12).mean() * 100
    print(name, arr.shape, f"opaque {opaque:.1f}%")


def main() -> None:
    horns = key_image(ROOT / "artifacts/imagine_images/530b72bc-cdc7-40b7-a4ba-ed3362c170ec.jpg")
    save(horns, "horns.png")

    glasses = key_image(ROOT / "artifacts/imagine_images/1df42a35-4f03-4453-92c7-e202fb29f701.jpg", hard=40, soft=100)
    glasses = punch_lens_ellipses(glasses, alpha_fill=38)
    glasses = scale_nonlens_alpha(glasses, 0.85, lens_alpha=38)
    save(glasses, "glasses.png")

    aviators = key_image(ROOT / "artifacts/imagine_images/30ba10de-a601-405e-850f-f083faaf61ba.jpg")
    a = aviators.copy()
    a[:, :, 3] = (a[:, :, 3].astype(np.float32) * 0.92).clip(0, 255).astype(np.uint8)
    save(a, "aviators.png")

    chain = key_image(ROOT / "artifacts/imagine_images/5eebf5af-cb3e-452c-9358-01c0ba26dacb.jpg")
    # Keep the lower U + pendant so it sits on a headshot, not a full-torso drape.
    ch = chain.shape[0]
    chain = chain[int(ch * 0.42) :]
    save(chain, "chain.png")


if __name__ == "__main__":
    main()
