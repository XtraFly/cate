import { composeCatePfp, preloadStickers } from "@/lib/compose";
import { studioComposeOptions } from "@/lib/studio-options";
import { hasStickers, useStudio } from "@/lib/studio-store";
import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

function paintCanvas(canvas: HTMLCanvasElement, cssSize: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const css = Math.max(8, Math.round(cssSize));
  canvas.width = Math.round(css * dpr);
  canvas.height = Math.round(css * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  composeCatePfp(ctx, studioComposeOptions(useStudio.getState(), canvas.width));
}

function useCoinPaint(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  boxRef: RefObject<HTMLElement | null>,
) {
  const state = useStudio();

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas) return;
    const css = box?.clientWidth || canvas.clientWidth || 0;
    if (css < 8) return;
    paintCanvas(canvas, css);
  }, [boxRef, canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas) return;
    void document.fonts.ready.then(paint);
    const id = requestAnimationFrame(paint);
    const ro = new ResizeObserver(paint);
    ro.observe(box ?? canvas);
    preloadStickers(paint);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [paint, boxRef, canvasRef]);

  useEffect(() => {
    paint();
  }, [paint, state]);
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function PreviewStage({ live = false }: { live?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageBoxRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLCanvasElement>(null);
  const dockBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const sliding = useStudio((s) => s.sliding);
  const overlays = useStudio((s) => s.overlays);
  const stickersOn = hasStickers(overlays);
  const [inView, setInView] = useState(true);

  useCoinPaint(canvasRef, stageBoxRef);
  useCoinPaint(dockRef, dockBoxRef);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.58,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = useStudio.getState();
      if (hasStickers(state.overlays)) {
        state.setStickerScale(state.stickerScale * (e.deltaY > 0 ? 0.94 : 1.06));
      } else {
        state.setScale(state.scale * (e.deltaY > 0 ? 0.94 : 1.06));
      }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const state = useStudio.getState();
    const stickers = hasStickers(state.overlays);
    if (pointers.current.size >= 2) {
      drag.current = null;
      const pts = [...pointers.current.values()];
      pinch.current = {
        dist: Math.max(1, dist(pts[0], pts[1])),
        scale: stickers ? state.stickerScale : state.scale,
      };
      return;
    }
    pinch.current = null;
    drag.current = {
      x: e.clientX,
      y: e.clientY,
      ox: stickers ? state.stickerX : state.offsetX,
      oy: stickers ? state.stickerY : state.offsetY,
    };
  }

  function onPointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const state = useStudio.getState();
    const stickers = hasStickers(state.overlays);
    if (pinch.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const d = Math.max(1, dist(pts[0], pts[1]));
      const next = pinch.current.scale * (d / pinch.current.dist);
      if (stickers) state.setStickerScale(next);
      else state.setScale(next);
      return;
    }
    if (!drag.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const r = rect.width * 0.42;
    const dx = (e.clientX - drag.current.x) / r;
    const dy = (e.clientY - drag.current.y) / r;
    if (stickers) state.setStickerOffset(drag.current.ox + dx, drag.current.oy + dy);
    else state.setOffset(drag.current.ox + dx, drag.current.oy + dy);
  }

  function onPointerUp(e: PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;
  }

  const showDock = live && (sliding || !inView);

  return (
    <>
      <div ref={stageRef} className="relative mx-auto w-full min-w-0 max-w-xl lg:sticky lg:top-6">
        <div className="rounded-xl bg-well p-3 shadow-(--shadow-stage) sm:p-4">
          <div ref={stageBoxRef} className="aspect-square w-full min-w-0">
            <canvas
              ref={canvasRef}
              className="block h-full w-full max-w-full touch-none rounded-lg"
              aria-label="CATE coin preview."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </div>
        </div>
        <p className="mt-3 text-center text-xs tracking-wide text-muted">
          {stickersOn
            ? "Stickers live: pinch or drag them. Zoom slider still sizes the photo."
            : "Drag to move. Pinch or scroll the coin to zoom."}
        </p>
      </div>

      <div
        className={`pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 transition-opacity duration-(--motion-fast) ease-(--ease-out) lg:hidden ${
          showDock ? "opacity-100" : "opacity-0"
        }`}
        style={{ top: "max(4.25rem, calc(env(safe-area-inset-top) + 3rem))" }}
        aria-hidden={!showDock}
      >
        <div
          ref={dockBoxRef}
          className="aspect-square w-full max-w-80 rounded-xl bg-well p-2 shadow-(--shadow-stage)"
        >
          <canvas ref={dockRef} className="block h-full w-full rounded-lg" />
        </div>
      </div>
    </>
  );
}
