"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  /** Visible state — "Are you sure?" row appears when true */
  open: boolean;
  /** Plain-English target ("Delete Sarah?") */
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Auto-cancel after this many ms with no interaction (Rule #5 default 3000) */
  autoCancelMs?: number;
  /** Style variant */
  tone?: "destructive" | "warning";
  className?: string;
};

/**
 * Inline confirm-row — replaces a target row with a red bar offering Yes/Cancel.
 * Auto-cancels after `autoCancelMs` so an accidental click never hangs.
 *
 * Usage pattern:
 *   const [confirming, setConfirming] = useState(false);
 *   {confirming ? (
 *     <ConfirmInline open message="Delete Sarah?" onConfirm={...} onCancel={() => setConfirming(false)} />
 *   ) : (
 *     <Row onDelete={() => setConfirming(true)} />
 *   )}
 */
export default function ConfirmInline({
  open,
  message,
  onConfirm,
  onCancel,
  autoCancelMs = 3000,
  tone = "destructive",
  className,
}: Props) {
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setProgress(100);

    const startedAt = Date.now();
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.max(0, 100 - (elapsed / autoCancelMs) * 100);
      setProgress(next);
    }, 50);

    timeoutRef.current = window.setTimeout(() => {
      onCancel();
    }, autoCancelMs);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [open, autoCancelMs, onCancel]);

  const isDanger = tone === "destructive";

  return (
    <AnimatePresence mode="wait">
      {open ? (
        <motion.div
          key="confirm"
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={cn(
            "relative flex items-center justify-between gap-3 overflow-hidden rounded-lg px-4 py-3 text-[13px] font-medium",
            isDanger
              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
              : "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
            className
          )}
        >
          <span className="line-clamp-1 flex-1">{message}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-2.5 py-1 text-[12px] font-medium text-[#0A261E]/70 transition-colors hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-semibold text-white transition-colors",
                isDanger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              Yes, {isDanger ? "delete" : "do it"}
            </button>
          </div>
          <div
            className={cn(
              "absolute bottom-0 left-0 h-[2px] origin-left",
              isDanger ? "bg-red-400/60" : "bg-amber-400/60"
            )}
            style={{ width: `${progress}%` }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
