"use client";

import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { FONT_THEMES, type FontThemeKey } from "@/lib/font-themes";

// Self-hosted webfonts so the preview renders in the masjid app's actual
// typefaces. These match the families bundled in the app's font themes.
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const interFont = Inter({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

type PreviewFonts = {
  /** className + weight applied to the big display sample. */
  displayClass: string;
  displayWeight: number;
  bodyClass: string;
};

const PREVIEW: Record<FontThemeKey, PreviewFonts> = {
  classic: { displayClass: playfair.className, displayWeight: 500, bodyClass: interFont.className },
  modern: { displayClass: interFont.className, displayWeight: 600, bodyClass: interFont.className },
  elegant: { displayClass: cormorant.className, displayWeight: 500, bodyClass: interFont.className },
};

export default function FontThemePicker({
  value,
  onChange,
}: {
  value: FontThemeKey;
  onChange: (key: FontThemeKey) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {FONT_THEMES.map((theme) => {
        const fonts = PREVIEW[theme.key];
        const selected = value === theme.key;
        return (
          <button
            key={theme.key}
            type="button"
            onClick={() => onChange(theme.key)}
            aria-pressed={selected}
            className={cn(
              "group relative flex flex-col rounded-xl border bg-white p-4 text-left transition-all",
              selected
                ? "border-[#0A261E] shadow-[0_0_0_2px_rgba(10,38,30,0.10)]"
                : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
            )}
          >
            {selected && (
              <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0A261E] text-white">
                <Check size={12} strokeWidth={3} />
              </span>
            )}

            {/* Real-font preview */}
            <div className="mb-3 flex h-16 items-end gap-2 border-b border-stone-100 pb-3">
              <span
                className={fonts.displayClass}
                style={{ fontWeight: fonts.displayWeight, fontSize: 38, lineHeight: 1, color: "#0A261E" }}
              >
                Aa
              </span>
              <span
                className={fonts.bodyClass}
                style={{ fontSize: 12, color: "#78716c", paddingBottom: 3 }}
              >
                Maghrib 7:48
              </span>
            </div>

            <p className="text-[13px] font-semibold text-stone-900">{theme.label}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{theme.description}</p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-stone-400">
              {theme.pairing}
            </p>
          </button>
        );
      })}
    </div>
  );
}
