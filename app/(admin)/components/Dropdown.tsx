"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
 *
 * The panel is portaled to <body> and positioned with `fixed` coordinates taken
 * from the trigger. Rendering it inline would let any ancestor with
 * `overflow-hidden` clip it — which is most of the onboarding cards.
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
  const [position, setPosition] = useState<{
    placement: "bottom" | "top";
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const estimatedPanelHeight = Math.min(options.length * 36 + 16, 300);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement =
      spaceBelow < estimatedPanelHeight && rect.top > spaceBelow ? "top" : "bottom";
    setPosition({
      placement,
      // 6px gap matches the old mt-1.5 / mb-1.5.
      top: placement === "bottom" ? rect.bottom + 6 : rect.top - 6,
      left: align === "right" ? rect.right : rect.left,
      width: rect.width,
    });
  }, [align, options.length]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
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

  // A fixed panel doesn't travel with the page, so track the trigger while open.
  useEffect(() => {
    if (!open) return;
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, measure]);

  function handleToggle() {
    if (!open) measure();
    setOpen((wasOpen) => !wasOpen);
  }

  const selected = options.find((o) => o.value === value);
  const triggerPadding = size === "sm" ? "px-3 py-1.5 text-[12px]" : "px-3.5 py-2 text-[13px]";

  return (
    <div ref={ref} className={cn("relative", className?.includes("w-full") ? "block" : "inline-block", className)}>
      {renderTrigger ? (
        <button
          type="button"
          onClick={handleToggle}
          className="outline-none"
        >
          {renderTrigger(selected)}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
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

      {open && position && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 overflow-hidden rounded-[14px] border border-stone-200 bg-white"
          style={{
            top: position.placement === "bottom" ? position.top : undefined,
            bottom:
              position.placement === "top"
                ? window.innerHeight - position.top
                : undefined,
            left: align === "right" ? undefined : position.left,
            right: align === "right" ? window.innerWidth - position.left : undefined,
            width: className?.includes("w-full") ? position.width : undefined,
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
        </div>,
        document.body
      )}
    </div>
  );
}
