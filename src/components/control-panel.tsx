import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Hint } from "@/components/ui/tooltip";
import { XLogo } from "@/components/x-logo";
import { CA, SAMPLES, exportCatePfp, shareCaption, type FrameStyle, type OverlayKey } from "@/lib/compose";
import { fetchXAvatar } from "@/lib/fetch-x-avatar";
import { studioComposeOptions } from "@/lib/studio-options";
import { hasStickers, useStudio } from "@/lib/studio-store";
import { Check, CircleHelp, Copy, Download, RotateCcw, Share2, Upload } from "lucide-react";
import { useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

function Field({
  label,
  value,
  hint,
  tip,
  children,
}: {
  label: string;
  value?: string;
  hint?: string;
  tip: string;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="flex min-w-0 items-baseline justify-between gap-2 text-xs font-medium tracking-[0.12em] text-muted uppercase">
        <span className="inline-flex min-w-0 items-center gap-1">
          {label}
          <Hint label={tip}>
            <button
              type="button"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted hover:text-ink"
              aria-label={tip}
            >
              <CircleHelp className="size-3.5" />
            </button>
          </Hint>
        </span>
        {value ? <span className="shrink-0 font-sans tracking-normal text-ink-soft">{value}</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

function TipButton({
  tip,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { tip: string }) {
  return (
    <Hint label={tip}>
      <button type="button" className={className} {...props}>
        {children}
      </button>
    </Hint>
  );
}

function loadFile(file: File) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const prev = useStudio.getState().imageUrl;
    if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
    useStudio.getState().setImage(img, url, null);
  };
  img.src = url;
}

export function loadSample(src: string, id: string) {
  const img = new Image();
  img.onload = () => useStudio.getState().setImage(img, src, id);
  img.src = src;
}

const FRAMES: { id: FrameStyle; label: string; tip: string }[] = [
  { id: "grail", label: "Grail", tip: "Navy background, ivory rim, gold disc. The classic $CATE coin." },
  { id: "fill", label: "Fill", tip: "Coin goes to the edges. Best when X crops your avatar to a circle." },
  { id: "paper", label: "Paper", tip: "Coin sitting on a cream square, like a print." },
];

const OVERLAYS: { id: OverlayKey; label: string; tip: string; src: string }[] = [
  { id: "horns", label: "Horns", tip: "Bulk gold bull horns, PoorGoat style. Pinch to resize once they're on.", src: "/stickers/horns.png?v=8" },
  { id: "glasses", label: "Glasses", tip: "Gold frames at 85% with 15% gold-glass lenses.", src: "/stickers/glasses.png?v=8" },
  { id: "aviators", label: "Aviators", tip: "Pilot gold-mirror shades, 92% opacity. Turns glasses off.", src: "/stickers/aviators.png?v=8" },
  { id: "chain", label: "Chain", tip: "Bling Cuban chain with a $CATE coin pendant and diamonds.", src: "/stickers/chain.png?v=8" },
];

export function ControlPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<"pfp" | "ca" | "share" | null>(null);
  const [share, setShare] = useState<{ url: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const [handle, setHandle] = useState("");
  const [xBusy, setXBusy] = useState(false);
  const [xError, setXError] = useState<string | null>(null);
  const studio = useStudio();
  const setSliding = useStudio((s) => s.setSliding);

  async function download() {
    if (!studio.image) return;
    setBusy(true);
    try {
      const blob = await exportCatePfp(studioComposeOptions(studio, studio.exportSize));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `cate-pfp-${studio.exportSize}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }

  async function copyPng() {
    if (!studio.image || !navigator.clipboard?.write) return;
    setBusy(true);
    try {
      const blob = await exportCatePfp(studioComposeOptions(studio, studio.exportSize));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied("pfp");
      window.setTimeout(() => setCopied(null), 1600);
    } finally {
      setBusy(false);
    }
  }

  async function shareToX() {
    if (!studio.image) return;
    setBusy(true);
    try {
      const blob = await exportCatePfp(studioComposeOptions(studio, studio.exportSize));
      if (share?.url) URL.revokeObjectURL(share.url);
      setShare({ url: URL.createObjectURL(blob), blob });
    } finally {
      setBusy(false);
    }
  }

  async function postToX() {
    if (!share) return;
    const text = shareCaption(window.location.origin);
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": share.blob })]);
      setCopied("share");
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* clipboard may be blocked */
      }
    }
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  async function copyCaption() {
    const text = shareCaption(typeof window !== "undefined" ? window.location.origin : undefined);
    await navigator.clipboard.writeText(text);
    setCopied("share");
    window.setTimeout(() => setCopied(null), 1600);
  }



  async function pullX(e: FormEvent) {
    e.preventDefault();
    setXError(null);
    const raw = handle.trim();
    if (!raw) {
      setXError("Add an X handle first.");
      return;
    }
    setXBusy(true);
    try {
      const res = await fetchXAvatar({ data: { handle: raw } });
      if (!res.ok) {
        setXError(res.error);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const prev = useStudio.getState().imageUrl;
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        useStudio.getState().setImage(img, res.dataUrl, null);
      };
      img.onerror = () => setXError("Got the file, but it wouldn't open.");
      img.src = res.dataUrl;
    } catch {
      setXError("Pull failed. Try again in a moment.");
    } finally {
      setXBusy(false);
    }
  }

  const sliderLock = {
    onDragStart: () => setSliding(true),
    onDragEnd: () => setSliding(false),
  };

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-6">
      <section className="min-w-0 rounded-xl bg-surface p-4 shadow-(--shadow-border) sm:p-5">
        <h2 className="font-display text-sm tracking-[0.18em] text-gold-deep uppercase">Photo</h2>
        <p className="mt-1 text-xs leading-5 text-muted">Your picture. Stays on this device.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            e.target.value = "";
          }}
        />
        <Hint label="Click, drop, or paste a photo. Nothing is uploaded.">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) loadFile(file);
            }}
            className="mt-3 flex min-h-20 w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-cream/60 px-4 py-5 text-center transition-colors duration-(--motion-quick) hover:border-gold-deep hover:bg-cream"
          >
            <Upload className="size-4 text-gold-deep" />
            <span className="text-sm text-ink">Drop a photo or tap to choose</span>
            <span className="text-xs text-muted">PNG, JPG, WebP · paste works too</span>
          </button>
        </Hint>

        <form onSubmit={pullX} className="mt-3 flex min-w-0 gap-2">
          <Hint label="Any X username. We'll drop their public photo into the coin, centered.">
            <Input
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value);
                if (xError) setXError(null);
              }}
              placeholder="X handle"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="X handle"
              className="min-w-0 flex-1"
            />
          </Hint>
          <Hint label="Fetch that X photo and center it in the coin.">
            <Button type="submit" disabled={xBusy} className="shrink-0 px-3">
              <XLogo className="size-4" />
              {xBusy ? "Pulling" : "Pull"}
            </Button>
          </Hint>
        </form>
        {xError ? <p className="mt-2 text-xs text-gold-deep">{xError}</p> : null}

        <p className="mt-4 text-xs font-medium tracking-[0.14em] text-muted uppercase">Examples</p>
        <div className="mt-2 grid min-w-0 grid-cols-3 gap-2">
          <SampleButton
            sample={SAMPLES[0]}
            active={studio.sampleId === SAMPLES[0].id}
            tip="Load the $CATE cat and start from there."
          />
          <SampleButton
            sample={SAMPLES[1]}
            active={studio.sampleId === SAMPLES[1].id}
            tip="Load @PoorGoat_'s real portrait, without the C."
          />
          <SampleButton
            sample={SAMPLES[2]}
            active={studio.sampleId === SAMPLES[2].id}
            tip="Load @criptow_'s real portrait, without the C."
          />
        </div>
      </section>

      <section className="min-w-0 rounded-xl bg-surface p-4 shadow-(--shadow-border) sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm tracking-[0.18em] text-gold-deep uppercase">Fit</h2>
          <Hint label="Put zoom, rotation, gold, C size, and position back to the defaults.">
            <button
              type="button"
              onClick={() => studio.resetView()}
              className="inline-flex h-9 items-center gap-1 rounded-[8px] px-2 text-xs text-ink-soft hover:bg-cream hover:text-ink"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          </Hint>
        </div>
        <div className="grid min-w-0 gap-4">
          <Field
            label="Zoom"
            value={`${Math.round(studio.scale * 100)}%`}
            hint="How big the photo sits in the disc."
            tip="Bigger fills the coin. Smaller shows more gold. Drag the coin to move. Pinch or scroll it to zoom."
          >
            <Slider min={0.6} max={2.4} step={0.01} value={[studio.scale]} onValueChange={([v]) => studio.setScale(v ?? 1)} {...sliderLock} />
          </Field>
          <Field
            label="Rotate"
            value={`${Math.round(studio.rotation)}°`}
            hint="Turn the photo. 0° is straight up."
            tip="Spin the photo in place if it landed crooked."
          >
            <Slider
              min={-180}
              max={180}
              step={1}
              value={[studio.rotation]}
              onValueChange={([v]) => studio.setRotation(v ?? 0)}
              {...sliderLock}
            />
          </Field>
          <Field
            label="Gold wash"
            value={`${Math.round(studio.goldWash * 100)}%`}
            hint="Paints the photo gold. 0% is the real picture — drag right to see it."
            tip="Tints the photo with coin gold so it looks minted into the metal. Drag the knob. At 0% nothing changes."
          >
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[studio.goldWash]}
              onValueChange={([v]) => studio.setGoldWash(v ?? 0)}
              {...sliderLock}
            />
          </Field>
          <Field
            label="C size"
            value={`${Math.round(studio.cScale * 100)}%`}
            hint="How big the C is. 85% is the sweet spot."
            tip="Grow or shrink the C. 85% leaves a gold band and room for the rim."
          >
            <Slider
              min={0.45}
              max={1.05}
              step={0.01}
              value={[studio.cScale]}
              onValueChange={([v]) => studio.setCScale(v ?? 0.85)}
              {...sliderLock}
            />
          </Field>
          <Field
            label="C fade"
            value={`${Math.round(studio.cOpacity * 100)}%`}
            hint="Hide or show the C."
            tip="Opacity of the C. 100% is fully carved. Drop it if you want the portrait to lead."
          >
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[studio.cOpacity]}
              onValueChange={([v]) => studio.setCOpacity(v ?? 1)}
              {...sliderLock}
            />
          </Field>
          {hasStickers(studio.overlays) ? (
            <Field
              label="Sticker size"
              value={`${Math.round(studio.stickerScale * 100)}%`}
              hint="Resize horns, glasses, and chain. Pinch on the coin does the same."
              tip="Only the stickers. The Zoom slider still sizes your photo."
            >
              <Slider
                min={0.45}
                max={2.4}
                step={0.01}
                value={[studio.stickerScale]}
                onValueChange={([v]) => studio.setStickerScale(v ?? 1)}
                {...sliderLock}
              />
            </Field>
          ) : null}
        </div>
      </section>

      <section className="min-w-0 rounded-xl bg-surface p-4 shadow-(--shadow-border) sm:p-5">
        <h2 className="font-display text-sm tracking-[0.18em] text-gold-deep uppercase">Coin</h2>
        <p className="mt-1 text-xs leading-5 text-muted">Frame first, stickers if you want them.</p>
        <div className="mt-3 grid min-w-0 grid-cols-3 gap-1.5">
          {FRAMES.map((f) => (
            <TipButton
              key={f.id}
              tip={f.tip}
              onClick={() => studio.setFrame(f.id)}
              className={`h-11 min-w-0 rounded-md text-sm transition-colors duration-(--motion-quick) ${
                studio.frame === f.id ? "bg-ink text-cream" : "bg-cream text-ink-soft hover:text-ink"
              }`}
            >
              {f.label}
            </TipButton>
          ))}
        </div>
        <TipButton
          tip="Stamp In $CATE We Trust around the ivory rim. On by default."
          onClick={() => studio.setRimText(!studio.rimText)}
          className={`mt-3 flex h-11 w-full min-w-0 items-center justify-center rounded-md text-sm transition-colors duration-(--motion-quick) ${
            studio.rimText ? "bg-ink text-cream" : "bg-cream text-ink-soft hover:text-ink"
          }`}
        >
          Rim legend
        </TipButton>
        <p className="mt-4 text-xs font-medium tracking-[0.14em] text-muted uppercase">Stickers</p>
        <div className="mt-2 grid min-w-0 grid-cols-2 gap-1.5">
          {OVERLAYS.map((o) => (
            <TipButton
              key={o.id}
              tip={o.tip}
              onClick={() => studio.toggleOverlay(o.id)}
              className={`flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-sm transition-colors duration-(--motion-quick) ${
                studio.overlays[o.id] ? "bg-ink text-cream" : "bg-cream text-ink-soft hover:text-ink"
              }`}
            >
              <img src={o.src} alt="" className="size-6 shrink-0 object-contain" />
              {o.label}
            </TipButton>
          ))}
        </div>
      </section>

      <section id="studio-export" className="min-w-0 rounded-xl bg-surface p-4 shadow-(--shadow-border) sm:p-5">
        <h2 className="font-display text-sm tracking-[0.18em] text-gold-deep uppercase">Export your $CATE PFP</h2>
        <p className="mt-1 text-xs leading-5 text-muted">Square PNG, built for X.</p>
        <div className="mt-3 grid min-w-0 grid-cols-3 gap-1.5">
          {(
            [
              { n: 800 as const, tip: "X's avatar size. Smallest file." },
              { n: 1024 as const, tip: "Default. Sharp on phones, still light." },
              { n: 2048 as const, tip: "Extra pixels for print or zoom." },
            ] as const
          ).map((item) => (
            <TipButton
              key={item.n}
              tip={item.tip}
              onClick={() => studio.setExportSize(item.n)}
              className={`h-11 min-w-0 rounded-md text-sm tabular-nums transition-colors duration-(--motion-quick) ${
                studio.exportSize === item.n ? "bg-ink text-cream" : "bg-cream text-ink-soft hover:text-ink"
              }`}
            >
              {item.n}
            </TipButton>
          ))}
        </div>
        <div className="mt-3">
          <Hint label="Save a square PNG to your phone or computer.">
            <Button onClick={download} disabled={!studio.image || busy} size="lg" className="h-14 w-full min-w-0 rounded-full text-base">
              <Download />
              Download Your New $CATE PFP
            </Button>
          </Hint>
        </div>
        <div className="mt-2 grid min-w-0 grid-cols-2 gap-2">
          <Hint label="Copy the PNG so you can paste it into X.">
            <Button variant="secondary" onClick={copyPng} disabled={!studio.image || busy} className="w-full min-w-0">
              {copied === "pfp" ? <Check /> : <Copy />}
              {copied === "pfp" ? "Copied" : "Copy"}
            </Button>
          </Hint>
          <Hint label="Preview the post, then open X compose with the caption. Paste the image in.">
            <Button variant="gold" onClick={shareToX} disabled={!studio.image || busy} className="w-full min-w-0">
              <Share2 />
              Share on X
            </Button>
          </Hint>
        </div>
      </section>


      <section className="min-w-0 px-1 pb-2">
        <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Contract</p>
        <Hint label="Copy the $CATE mint address on Solana.">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(CA);
              setCopied("ca");
              window.setTimeout(() => setCopied(null), 1600);
            }}
            className="mt-1 flex w-full min-w-0 items-center justify-between gap-2 rounded-md bg-surface px-3 py-2 text-left shadow-(--shadow-border)"
          >
            <span className="truncate font-mono text-xs text-ink-soft">{CA}</span>
            {copied === "ca" ? <Check className="size-3.5 shrink-0" /> : <Copy className="size-3.5 shrink-0" />}
          </button>
        </Hint>
      </section>
      {share ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-surface p-4 shadow-(--shadow-stage)">
            <h3 className="font-display text-sm tracking-[0.16em] text-gold-deep uppercase">Preview post</h3>
            <img src={share.url} alt="Your $CATE PFP" className="mt-3 aspect-square w-full rounded-lg" />
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-soft">{shareCaption(typeof window !== "undefined" ? window.location.origin : undefined)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  URL.revokeObjectURL(share.url);
                  setShare(null);
                }}
              >
                Close
              </Button>
              <Button variant="gold" onClick={postToX}>
                <XLogo className="size-4" />
                {copied === "share" ? "Paste in X" : "Post on X"}
              </Button>
            </div>
            <button type="button" onClick={copyCaption} className="mt-2 text-xs text-muted underline decoration-gold-deep/80 underline-offset-4">
              Copy caption
            </button>
            <p className="mt-2 text-xs text-muted">Opens X compose. Your PFP is copied — paste it into the post.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SampleButton({
  sample,
  active,
  tip,
}: {
  sample: (typeof SAMPLES)[number];
  active: boolean;
  tip: string;
}) {
  return (
    <Hint label={tip}>
      <button
        type="button"
        onClick={() => loadSample(sample.src, sample.id)}
        className={`flex min-w-0 flex-col items-center gap-1 rounded-md p-1.5 text-center transition-colors duration-(--motion-quick) ${
          active ? "bg-cream ring-1 ring-gold-deep" : "hover:bg-cream"
        }`}
      >
        <img
          src={sample.src}
          alt=""
          className="size-12 rounded-[8px] object-cover outline outline-1 -outline-offset-1 outline-ink/10 sm:size-14"
        />
        <span className="w-full truncate text-xs leading-4 text-ink-soft">{sample.label}</span>
      </button>
    </Hint>
  );
}
