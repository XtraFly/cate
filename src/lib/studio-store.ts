import { create } from "zustand";
import { OVERLAY_KEYS, type FrameStyle, type OverlayFlags, type OverlayKey } from "@/lib/compose";

export type StudioState = {
  image: HTMLImageElement | null;
  imageUrl: string | null;
  sampleId: string | null;
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
  exportSize: 800 | 1024 | 2048;
  sliding: boolean;
  setImage: (img: HTMLImageElement, url: string, sampleId?: string | null) => void;
  setOffset: (x: number, y: number) => void;
  nudgeOffset: (dx: number, dy: number) => void;
  setScale: (scale: number) => void;
  setRotation: (rotation: number) => void;
  setGoldWash: (goldWash: number) => void;
  setCOpacity: (cOpacity: number) => void;
  setCScale: (cScale: number) => void;
  setFrame: (frame: FrameStyle) => void;
  setRimText: (rimText: boolean) => void;
  toggleOverlay: (key: OverlayKey) => void;
  setStickerScale: (stickerScale: number) => void;
  setStickerOffset: (x: number, y: number) => void;
  setExportSize: (exportSize: 800 | 1024 | 2048) => void;
  setSliding: (sliding: boolean) => void;
  resetView: () => void;
};

const defaultOverlays: OverlayFlags = {
  horns: false,
  glasses: false,
  aviators: false,
  chain: false,
};

const VIEW_DEFAULTS = {
  offsetX: 0,
  offsetY: 0.05,
  scale: 1.2,
  rotation: 0,
  goldWash: 0.08,
  cOpacity: 1,
  cScale: 0.85,
  stickerScale: 1,
  stickerX: 0,
  stickerY: 0,
} as const;

export function hasStickers(overlays: OverlayFlags) {
  return OVERLAY_KEYS.some((k) => overlays[k]);
}

export const useStudio = create<StudioState>((set) => ({
  image: null,
  imageUrl: null,
  sampleId: null,
  ...VIEW_DEFAULTS,
  frame: "grail",
  rimText: true,
  overlays: defaultOverlays,
  exportSize: 1024,
  sliding: false,
  setImage: (img, url, sampleId = null) =>
    set({
      image: img,
      imageUrl: url,
      sampleId,
      offsetX: VIEW_DEFAULTS.offsetX,
      offsetY: VIEW_DEFAULTS.offsetY,
      scale: VIEW_DEFAULTS.scale,
      rotation: 0,
    }),
  setOffset: (offsetX, offsetY) =>
    set({
      offsetX: Math.max(-1.2, Math.min(1.2, offsetX)),
      offsetY: Math.max(-1.2, Math.min(1.2, offsetY)),
    }),
  nudgeOffset: (dx, dy) =>
    set((s) => ({
      offsetX: Math.max(-1.2, Math.min(1.2, s.offsetX + dx)),
      offsetY: Math.max(-1.2, Math.min(1.2, s.offsetY + dy)),
    })),
  setScale: (scale) => set({ scale: Math.max(0.6, Math.min(3, scale)) }),
  setRotation: (rotation) => set({ rotation }),
  setGoldWash: (goldWash) => set({ goldWash }),
  setCOpacity: (cOpacity) => set({ cOpacity }),
  setCScale: (cScale) => set({ cScale: Math.max(0.45, Math.min(1.05, cScale)) }),
  setFrame: (frame) => set({ frame }),
  setRimText: (rimText) => set({ rimText }),
  toggleOverlay: (key) =>
    set((s) => {
      const on = !s.overlays[key];
      const overlays: OverlayFlags = { ...s.overlays, [key]: on };
      if (key === "glasses" && on) overlays.aviators = false;
      if (key === "aviators" && on) overlays.glasses = false;
      const wasOff = !OVERLAY_KEYS.some((k) => s.overlays[k]);
      const nowOn = OVERLAY_KEYS.some((k) => overlays[k]);
      if (wasOff && nowOn) {
        return { overlays, stickerScale: 1, stickerX: 0, stickerY: 0 };
      }
      return { overlays };
    }),
  setStickerScale: (stickerScale) => set({ stickerScale: Math.max(0.45, Math.min(2.4, stickerScale)) }),
  setStickerOffset: (stickerX, stickerY) =>
    set({
      stickerX: Math.max(-1.1, Math.min(1.1, stickerX)),
      stickerY: Math.max(-1.1, Math.min(1.1, stickerY)),
    }),
  setExportSize: (exportSize) => set({ exportSize }),
  setSliding: (sliding) => set({ sliding }),
  resetView: () => set({ ...VIEW_DEFAULTS, overlays: defaultOverlays }),
}));
