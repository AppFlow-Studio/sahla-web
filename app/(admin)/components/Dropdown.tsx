"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string | number; label: string };

type DropdownProps = {
  value: string | number;
  options: Option[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  size?: "sm" | "md";
  align?: "left" | "right";
  className?: string;
  minWidth?: number;
  renderTrigger?: (selected: Option | undefined) => ReactNode;
};

/**
 * Custom dropdown matching the Revenue page aesthetic:
 * - Rounded trigger with subtle border + shadow
 * - Floating panel with rounded-[14px], border, soft shadow
 * - List items with subtle hover background
 * - Active option bold + tinted
 */
export function Dropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  label,
  size = "md",
  align = "left",
  className,
  minWidth = 180,
  renderTrigger,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function escHandler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, []);

  const selected = options.find((o) => o.value === value);
  const triggerPadding = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-3.5 py-2 text-[13px]";

  return (
    <div ref={ref} className={cn("relative", className?.includes("w-full") ? "block" : "inline-block", className)}>
      {renderTrigger ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="outline-none"
        >
          {renderTrigger(selected)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-stone-200 bg-white font-medium text-stone-800 shadow-sm outline-none transition-all hover:border-stone-300 focus-visible:ring-2 focus-visible:ring-stone-200",
            triggerPadding,
            className?.includes("w-full") && "w-full",
            open && "border-stone-300 shadow-md"
          )}
          style={{ minWidth: minWidth || undefined }}
        >
          {label && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-400">
              {label}
            </span>
          )}
          <span className="flex-1 text-left truncate">
            {selected ? selected.label : <span className="text-stone-400">{placeholder}</span>}
          </span>
          <ChevronDown
            size={14}
            className={cn("shrink-0 text-stone-400 transition-transform", open && "rotate-180")}
          />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "absolute top-full z-30 mt-1.5 overflow-hidden rounded-[14px] border border-stone-200 bg-white",
            align === "right" ? "right-0" : "left-0",
            className?.includes("w-full") && "w-full"
          )}
          style={{
            minWidth: minWidth || undefined,
            boxShadow: "0 8px 28px rgba(0,0,0,0.12)",
          }}
        >
          <div className="max-h-[300px] overflow-y-auto py-1">
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-stone-50",
                    isActive ? "font-semibold text-stone-900" : "font-normal text-stone-600"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
