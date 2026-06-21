/**
 * Curated font themes a masjid admin can pick (onboarding + CRM). Mirrors the
 * app's `src/theme/fonts.ts` FONT_THEMES — keep the keys in sync. The app reads
 * `mosques.font_theme` and renders the matching pairing; here we only need the
 * key + human metadata for the picker UI.
 *
 * (No `next/font` here so this stays importable from server code / API routes.
 * The picker component loads the actual webfonts for its live preview.)
 */

export type FontThemeKey = "classic" | "modern" | "elegant";

export type FontThemeMeta = {
  key: FontThemeKey;
  label: string;
  /** One-line description of the pairing. */
  description: string;
  /** Human font-pairing label, e.g. "Playfair · Inter". */
  pairing: string;
};

export const FONT_THEMES: FontThemeMeta[] = [
  {
    key: "classic",
    label: "Classic",
    description: "Elegant serif headings with a clean, readable body.",
    pairing: "Playfair Display · Inter",
  },
  {
    key: "modern",
    label: "Modern",
    description: "Clean sans-serif throughout — crisp and contemporary.",
    pairing: "Inter · Inter",
  },
  {
    key: "elegant",
    label: "Elegant",
    description: "Refined high-contrast serif headings for a premium feel.",
    pairing: "Cormorant Garamond · Inter",
  },
];

export const DEFAULT_FONT_THEME: FontThemeKey = "classic";

export function isFontThemeKey(value: unknown): value is FontThemeKey {
  return (
    typeof value === "string" &&
    FONT_THEMES.some((t) => t.key === value)
  );
}

export function normalizeFontTheme(value: unknown): FontThemeKey {
  return isFontThemeKey(value) ? value : DEFAULT_FONT_THEME;
}
