import type { ComposeOptions } from "@/lib/compose";
import type { StudioState } from "@/lib/studio-store";

export function studioComposeOptions(studio: StudioState, size: number): ComposeOptions {
  return {
    image: studio.image,
    imageWidth: studio.image?.naturalWidth ?? 0,
    imageHeight: studio.image?.naturalHeight ?? 0,
    size,
    offsetX: studio.offsetX,
    offsetY: studio.offsetY,
    scale: studio.scale,
    rotation: studio.rotation,
    goldWash: studio.goldWash,
    cOpacity: studio.cOpacity,
    cScale: studio.cScale,
    frame: studio.frame,
    rimText: studio.rimText,
    overlays: studio.overlays,
    stickerScale: studio.stickerScale,
    stickerX: studio.stickerX,
    stickerY: studio.stickerY,
  };
}
