import { createFileRoute, Link } from "@tanstack/react-router";
import { GO_DEST, type GoId } from "@/lib/referrals";
import { useEffect } from "react";

function isGoId(id: string): id is GoId {
  return id in GO_DEST;
}

export const Route = createFileRoute("/go/$id")({
  ssr: false,
  component: GoRedirect,
});

function GoRedirect() {
  const { id } = Route.useParams();
  const href = isGoId(id) ? GO_DEST[id] : null;

  useEffect(() => {
    if (!href) return;
    window.location.replace(href);
  }, [href]);

  if (!href) {
    return (
      <div className="min-h-dvh bg-bg px-6 py-16 text-ink">
        <p className="text-sm text-ink-soft">That link isn’t here.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-gold-deep underline underline-offset-4">
          Back to PFP Designer
        </Link>
      </div>
    );
  }

  const label = id === "fomo" ? "fomo web" : "Jupiter";

  return (
    <div className="min-h-dvh bg-bg px-6 py-16 text-ink">
      <p className="font-display text-sm tracking-[0.16em] text-gold-deep uppercase">$CATE</p>
      <p className="mt-3 text-sm text-ink-soft">Opening {label}…</p>
    </div>
  );
}
