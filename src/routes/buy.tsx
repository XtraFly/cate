import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CA,
  CATE_X_URL,
  DEX_URL,
  JUPITER_REFERRAL,
  PUMP_URL,
  SITE_URL,
  TELEGRAM_URL,
  TIKTOK_URL,
} from "@/lib/compose";
import { GO } from "@/lib/referrals";
import { DexLogo, GlobeLogo, PumpLogo, TelegramLogo, TikTokLogo, XLogo } from "@/components/social-icons";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export const Route = createFileRoute("/buy")({ component: BuyPage });

const SOL = "So11111111111111111111111111111111111111112";

declare global {
  interface Window {
    Jupiter?: { init: (opts: Record<string, unknown>) => void };
  }
}

function BuyPage() {
  useEffect(() => {
    const hostId = "jupiter-plugin";
    let cancelled = false;

    function init() {
      if (cancelled || !window.Jupiter?.init) return;
      const host = document.getElementById(hostId);
      if (!host) return;
      if (host.childElementCount > 0) return;
      window.Jupiter.init({
        displayMode: "integrated",
        integratedTargetId: hostId,
        defaultExplorer: "Solscan",
        formProps: {
          initialInputMint: SOL,
          initialOutputMint: CA,
        },
        referralAccount: JUPITER_REFERRAL,
        referralFee: 50,
        branding: { name: "$CATE" },
      });
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-jup-plugin]");
    if (window.Jupiter?.init) {
      init();
    } else if (existing) {
      existing.addEventListener("load", init);
    } else {
      const script = document.createElement("script");
      script.src = "https://plugin.jup.ag/plugin-v1.js";
      script.async = true;
      script.dataset.jupPlugin = "1";
      script.onload = init;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-dvh w-full bg-bg text-ink">
      <header className="border-b border-line/70">
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-3 px-4 py-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Back to PFP Designer
          </Link>
          <p className="text-xs font-medium tracking-[0.2em] text-gold-deep uppercase">$CATE · Solana</p>
          <h1 className="font-display text-3xl tracking-[0.12em] text-ink uppercase">Buy $CATE</h1>
          <p className="max-w-xl text-sm leading-6 text-ink-soft">
            Swap SOL for $CATE on Jupiter. Same mint the army uses. Destination a modest trilly.
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8">
        <div className="min-h-[560px] w-full overflow-hidden rounded-xl bg-ink shadow-(--shadow-border)">
          <div id="jupiter-plugin" className="h-[620px] w-full min-w-0" />
        </div>

        <a
          href={GO.jup}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          <ExternalLink className="size-3.5" />
          Open this swap on Jupiter
        </a>

        <a
          href={GO.fomo}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-xl bg-ink px-4 py-4 text-cream hover:bg-ink-soft"
        >
          <img src="/fomo-icon.png" alt="" className="size-12 rounded-lg bg-cream object-cover" />
          <span className="min-w-0">
            <span className="block font-display text-sm tracking-[0.14em] uppercase">Create a FOMO account</span>
            <span className="mt-1 block text-sm text-cream/80">Follow & Copy the Best Traders for Free!</span>
            <span className="mt-1 block text-xs text-cream/55">Opens fomo web</span>
          </span>
        </a>

        <nav className="flex min-w-0 flex-wrap gap-2" aria-label="Official $CATE socials">
          <BuyChip href={SITE_URL} label="cate.meme">
            <GlobeLogo className="size-3.5" />
          </BuyChip>
          <BuyChip href={TELEGRAM_URL} label="Telegram">
            <TelegramLogo className="size-3.5" />
          </BuyChip>
          <BuyChip href={CATE_X_URL} label="@CateonSol_">
            <XLogo className="size-3.5" />
          </BuyChip>
          <BuyChip href={TIKTOK_URL} label="TikTok">
            <TikTokLogo className="size-3.5" />
          </BuyChip>
          <BuyChip href={DEX_URL} label="Dexscreener">
            <DexLogo className="size-3.5" />
          </BuyChip>
          <BuyChip href={PUMP_URL} label="Pump.fun">
            <PumpLogo className="size-3.5" />
          </BuyChip>
          <BuyChip href={GO.fomo} label="FOMO">
            <img src="/fomo-icon.png" alt="" className="size-3.5 rounded-sm object-cover" />
          </BuyChip>
        </nav>

        <p className="text-xs leading-5 text-muted">
          Mint {CA.slice(0, 6)}…{CA.slice(-4)}. Official site{" "}
          <a href={SITE_URL} className="underline decoration-gold-deep/80 underline-offset-4" target="_blank" rel="noreferrer">
            cate.meme
          </a>
          .
        </p>
      </main>
    </div>
  );
}

function BuyChip({ href, label, children }: { href: string; label: string; children: ReactNode }) {
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
