import { ControlPanel, loadSample } from "@/components/control-panel";
import { PreviewStage } from "@/components/preview-stage";
import { GlobeLogo, TelegramLogo, TikTokLogo, XLogo, DexLogo, PumpLogo } from "@/components/social-icons";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CA,
  CATE_X_URL,
  DEX_URL,
  PUMP_URL,
  SAMPLES,
  SITE_URL,
  TELEGRAM_URL,
  TIKTOK_URL,
} from "@/lib/compose";
import { GO } from "@/lib/referrals";
import { useStudio } from "@/lib/studio-store";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Studio() {
  const sliding = useStudio((s) => s.sliding);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsInView, setControlsInView] = useState(false);
  const [exportInView, setExportInView] = useState(false);

  useEffect(() => {
    if (!useStudio.getState().image) {
      loadSample(SAMPLES[0].src, SAMPLES[0].id);
    }
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const prev = useStudio.getState().imageUrl;
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        useStudio.getState().setImage(img, url, null);
      };
      img.src = url;
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("sliding", sliding);
    return () => document.documentElement.classList.remove("sliding");
  }, [sliding]);

  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setControlsInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.08,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = document.getElementById("studio-export");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setExportInView(Boolean(entry?.isIntersecting)), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-dvh w-full min-w-0 max-w-full overflow-x-clip bg-bg text-ink">
        <header className="border-b border-line/70">
          <div className="mx-auto w-full min-w-0 max-w-6xl px-4 py-5 sm:px-8 lg:py-8">
            <p className="text-xs font-medium tracking-[0.2em] text-gold-deep uppercase">
              $CATE · Solana · DOGE's sister
            </p>
            <h1 className="mt-2 font-display text-3xl tracking-[0.08em] text-ink uppercase sm:text-4xl">
              $CATE PFP Designer
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-soft">
              Stamp a face. Chase a modest trilly. That's the whole religion.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                to="/buy"
                className="inline-flex h-10 items-center rounded-full bg-gold-deep px-4 text-sm font-medium text-cream hover:bg-gold"
              >
                Buy $CATE
              </Link>
            </div>
            <nav className="mt-4 flex min-w-0 flex-wrap gap-2" aria-label="Official $CATE socials">
              <SocialChip href={SITE_URL} label="cate.meme">
                <GlobeLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href={TELEGRAM_URL} label="Telegram">
                <TelegramLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href={CATE_X_URL} label="@CateonSol_">
                <XLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href="https://x.com/PoorGoat_" label="@PoorGoat_">
                <XLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href="https://x.com/criptow_" label="@criptow_">
                <XLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href={TIKTOK_URL} label="TikTok">
                <TikTokLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href={DEX_URL} label="Dexscreener">
                <DexLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href={PUMP_URL} label="Pump.fun">
                <PumpLogo className="size-3.5" />
              </SocialChip>
              <SocialChip href={GO.fomo} label="FOMO">
                <img src="/fomo-icon.png" alt="" className="size-3.5 rounded-sm object-cover" />
              </SocialChip>
            </nav>
          </div>
        </header>

        <main className="mx-auto grid w-full min-w-0 max-w-6xl gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.9fr)] lg:items-start lg:gap-12 lg:py-12">
          <PreviewStage live={(sliding || controlsInView) && !exportInView} />
          <div ref={controlsRef} className="min-w-0">
            <ControlPanel />
          </div>
        </main>

        <footer className="border-t border-line/70">
          <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-3 px-4 py-6 sm:px-8">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Link
                to="/buy"
                className="inline-flex h-8 items-center rounded-full bg-gold-deep px-3 text-xs font-medium text-cream hover:bg-gold"
              >
                Buy $CATE
              </Link>
              <a
                href={GO.fomo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-2.5 text-xs text-cream hover:bg-ink-soft"
              >
                <img src="/fomo-icon.png" alt="" className="size-3.5 rounded-sm object-cover" />
                FOMO
              </a>
              <FollowChip handle="criptow_" label="@criptow_" />
              <FollowChip handle="PoorGoat_" label="@PoorGoat_" />
            </div>
            <p className="max-w-xl text-xs leading-5 text-muted">
              Made by{" "}
              <a href="https://x.com/criptow_" className="underline decoration-gold-deep/80 underline-offset-4" target="_blank" rel="noreferrer">
                criptow_
              </a>
              . Coin by{" "}
              <a href="https://x.com/PoorGoat_" className="underline decoration-gold-deep/80 underline-offset-4" target="_blank" rel="noreferrer">
                PoorGoat_
              </a>
              . If the PFP slaps, follow both. Photos never leave this device. {CA.slice(0, 4)}…{CA.slice(-4)}
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

function SocialChip({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-2.5 text-xs text-ink shadow-(--shadow-border) hover:bg-cream"
    >
      {children}
      {label}
    </a>
  );
}

function FollowChip({ handle, label }: { handle: string; label: string }) {
  return (
    <a
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-2.5 text-xs text-cream hover:bg-ink-soft"
    >
      <XLogo className="size-3" />
      Follow {label}
    </a>
  );
}
