"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEADER_STYLES, type HeaderStyleKey } from "@/lib/header-styles";

const GREEN = "#0A261E";
const CREAM = "#FFFBF2";
const GOLD = "#B8922A";

/**
 * A small schematic mock of each home header, in the app's brand green — so the
 * admin can see the difference (classic greeting/clock vs centered/left-aligned
 * countdown) without a full live preview.
 */
function HeaderMock({ variant }: { variant: HeaderStyleKey }) {
  const isCountdown = variant !== "classic";
  const align =
    variant === "countdown-centered" ? "items-center" : "items-start";

  return (
    <div className="mb-3 overflow-hidden rounded-lg" style={{ background: GREEN }}>
      <div className={cn("flex flex-col gap-1.5 p-3", align)}>
        {/* Top: masjid name + bell (countdown) or greeting line (classic) */}
        {isCountdown ? (
          <div className="mb-0.5 flex w-full items-center justify-between">
            <span className="h-1.5 w-10 rounded-full" style={{ background: `${CREAM}80` }} />
            <span className="h-2 w-2 rounded-full" style={{ background: `${CREAM}80` }} />
          </div>
        ) : (
          <span className="h-1 w-12 rounded-full" style={{ background: `${CREAM}66` }} />
        )}

        {/* Countdown label (gold) */}
        {isCountdown && (
          <span className="h-1 w-12 rounded-full" style={{ background: GOLD }} />
        )}

        {/* Big number / time */}
        <span className="h-3.5 w-16 rounded" style={{ background: `${CREAM}E6` }} />

        {/* Date / subline */}
        <span className="h-1 w-20 rounded-full" style={{ background: `${CREAM}59` }} />

        {/* Prayer row (Maghrib highlighted) */}
        <div className="mt-2 flex w-full gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-3 flex-1 rounded"
              style={{ background: i === 3 ? `${GOLD}40` : `${CREAM}14` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeaderStylePicker({
  value,
  onChange,
}: {
  value: HeaderStyleKey;
  onChange: (key: HeaderStyleKey) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {HEADER_STYLES.map((style) => {
        const selected = value === style.key;
        return (
          <button
            key={style.key}
            type="button"
            onClick={() => onChange(style.key)}
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

            <HeaderMock variant={style.key} />

            <p className="text-[13px] font-semibold text-stone-900">{style.label}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{style.description}</p>
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-stone-400">
              {style.hint}
            </p>
          </button>
        );
      })}
    </div>
  );
}
