import { CA, FOMO_REF_URL, JUPITER_REFERRAL } from "@/lib/compose";

/** Public paths shown in the UI. Referral codes never appear in hrefs. */
export const GO = {
  fomo: "/go/fomo",
  jup: "/go/jup",
} as const;

export type GoId = keyof typeof GO;

/**
 * Destinations used only by /go/$id. Do not put these on <a href>.
 * FOMO /r/ sets the affiliate cookie then the desktop app strips it from the URL.
 */
export const GO_DEST: Record<GoId, string> = {
  fomo: FOMO_REF_URL,
  jup: `https://jup.ag/swap/SOL-${CA}?referrer=${JUPITER_REFERRAL}`,
};
