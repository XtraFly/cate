import { cn } from "@/lib/utils";
import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from "react";

type SliderProps = {
  min: number;
  max: number;
  step?: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
  "aria-label"?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function snap(n: number, min: number, max: number, step: number) {
  const stepped = min + Math.round((n - min) / step) * step;
  const precision = step < 1 ? Math.ceil(-Math.log10(step)) : 0;
  return Number(clamp(stepped, min, max).toFixed(precision));
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  onDragStart,
  onDragEnd,
  className,
  "aria-label": ariaLabel,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const now = value[0] ?? min;
  const pct = ((now - min) / Math.max(0.0001, max - min)) * 100;

  const setFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const t = rect.width <= 0 ? 0 : (clientX - rect.left) / rect.width;
      onValueChange([snap(min + t * (max - min), min, max, step)]);
    },
    [max, min, onValueChange, step],
  );

  function onThumbPointerDown(e: PointerEvent<HTMLSpanElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onDragStart?.();
  }

  function onThumbPointerMove(e: PointerEvent<HTMLSpanElement>) {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  }

  function endDrag(e: PointerEvent<HTMLSpanElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onDragEnd?.();
  }

  function onKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    const key = e.key;
    let next: number | null = null;
    if (key === "ArrowRight" || key === "ArrowUp") next = now + step;
    else if (key === "ArrowLeft" || key === "ArrowDown") next = now - step;
    else if (key === "Home") next = min;
    else if (key === "End") next = max;
    else if (key === "PageUp") next = now + step * 10;
    else if (key === "PageDown") next = now - step * 10;
    if (next == null) return;
    e.preventDefault();
    onValueChange([snap(next, min, max, step)]);
  }

  return (
    <div className={cn("relative flex h-11 w-full items-center px-2.5", className)}>
      <div ref={trackRef} className="relative h-1 w-full rounded-full bg-line">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gold-deep" style={{ width: `${pct}%` }} />
        <span
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={now}
          aria-orientation="horizontal"
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-ink shadow-(--shadow-border) ring-2 ring-surface touch-none select-none hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:cursor-grabbing"
          style={{ left: `${pct}%` }}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
