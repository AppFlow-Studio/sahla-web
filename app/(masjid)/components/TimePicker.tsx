"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "AM" | "PM";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55
const PERIODS: Period[] = ["AM", "PM"];

/** Parse a stored "HH:mm" (24h) value into 12-hour parts. */
function parse(value: string): { hour: number; minute: number; period: Period } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim());
  if (!m) return null;
  const h24 = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (h24 < 0 || h24 > 23 || minute < 0 || minute > 59) return null;
  const period: Period = h24 >= 12 ? "PM" : "AM";
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour, minute, period };
}

/** Build a stored "HH:mm" (24h) value from 12-hour parts. */
function to24(hour: number, minute: number, period: Period): string {
  let h = hour % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Format a stored "HH:mm" (24h) value as "9:30 AM"; returns null if unparseable. */
export function formatTimeLabel(value: string): string | null {
  const p = parse(value);
  if (!p) return null;
  return `${p.hour}:${String(p.minute).padStart(2, "0")} ${p.period}`;
}

export default function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Working parts — seed from the current value, or a sensible 9:00 AM default
  // that only commits once the user actually picks something.
  const parsed = useMemo(() => parse(value), [value]);
  const draft = parsed ?? { hour: 9, minute: 0, period: "AM" as Period };

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function commit(next: { hour?: number; minute?: number; period?: Period }) {
    onChange(
      to24(
        next.hour ?? draft.hour,
        next.minute ?? draft.minute,
        next.period ?? draft.period
      )
    );
  }

  const label = formatTimeLabel(value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3.5 text-sm shadow-sm outline-none transition-colors hover:border-stone-300 focus-visible:ring-2 focus-visible:ring-stone-100",
          open ? "border-stone-400 ring-2 ring-stone-100" : "border-stone-200"
        )}
      >
        <Clock size={15} className="shrink-0 text-stone-400" />
        <span
          className={cn(
            "flex-1 text-left tabular-nums",
            label ? "text-stone-900" : "text-stone-400"
          )}
        >
          {label ?? placeholder}
        </span>
        {label && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="rounded p-0.5 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-500"
            aria-label="Clear time"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-30 mt-1.5 overflow-hidden rounded-[14px] border border-stone-200 bg-white"
          style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12)" }}
        >
          <div className="flex">
            <TimeColumn
              items={HOURS}
              selected={draft.hour}
              format={(h) => String(h)}
              active={Boolean(parsed)}
              onPick={(h) => commit({ hour: h })}
            />
            <div className="w-px bg-stone-100" />
            <TimeColumn
              items={MINUTES}
              selected={draft.minute}
              format={(m) => String(m).padStart(2, "0")}
              active={Boolean(parsed)}
              onPick={(m) => commit({ minute: m })}
            />
            <div className="w-px bg-stone-100" />
            <TimeColumn
              items={PERIODS}
              selected={draft.period}
              format={(p) => p}
              active={Boolean(parsed)}
              onPick={(p) => commit({ period: p })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TimeColumn<T extends string | number>({
  items,
  selected,
  format,
  active,
  onPick,
}: {
  items: readonly T[];
  selected: T;
  format: (item: T) => string;
  /** Whether a value is actually set (vs. showing the un-committed default). */
  active: boolean;
  onPick: (item: T) => void;
}) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Bring the selected item into view when the popover opens.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div className="max-h-[196px] w-[64px] overflow-y-auto py-1">
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <button
            key={String(item)}
            ref={isSelected ? activeRef : undefined}
            type="button"
            onClick={() => onPick(item)}
            className={cn(
              "block w-full py-1.5 text-center text-[13px] tabular-nums transition-colors",
              isSelected && active
                ? "bg-stone-900 font-semibold text-white"
                : isSelected
                ? "font-semibold text-stone-900 hover:bg-stone-50"
                : "text-stone-600 hover:bg-stone-50"
            )}
          >
            {format(item)}
          </button>
        );
      })}
    </div>
  );
}
