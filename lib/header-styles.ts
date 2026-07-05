/**
 * Home-screen header styles a masjid admin can pick (onboarding + CRM). Mirrors
 * the app's `src/theme/header-style.ts` HEADER_STYLES — keep the keys in sync.
 * The app reads `mosques.header_style` and renders the matching home header;
 * here we only need the key + human metadata for the picker UI.
 */

export type HeaderStyleKey = "classic" | "countdown-centered" | "countdown-left";

export type HeaderStyleMeta = {
  key: HeaderStyleKey;
  label: string;
  /** One-line description of the layout. */
  description: string;
  /** Short layout hint, e.g. "Greeting + clock". */
  hint: string;
};

export const HEADER_STYLES: HeaderStyleMeta[] = [
  {
    key: "classic",
    label: "Classic",
    description: "A personalized greeting with the live clock and next-prayer time.",
    hint: "Greeting + clock",
  },
  {
    key: "countdown-centered",
    label: "Countdown · Centered",
    description: "A live countdown to the next prayer, centered under the masjid name.",
    hint: "Centered timer",
  },
  {
    key: "countdown-left",
    label: "Countdown · Left",
    description: "The same live countdown, left-aligned for a more editorial feel.",
    hint: "Left-aligned timer",
  },
];

export const DEFAULT_HEADER_STYLE: HeaderStyleKey = "classic";

export function isHeaderStyleKey(value: unknown): value is HeaderStyleKey {
  return (
    typeof value === "string" && HEADER_STYLES.some((h) => h.key === value)
  );
}

export function normalizeHeaderStyle(value: unknown): HeaderStyleKey {
  return isHeaderStyleKey(value) ? value : DEFAULT_HEADER_STYLE;
}
