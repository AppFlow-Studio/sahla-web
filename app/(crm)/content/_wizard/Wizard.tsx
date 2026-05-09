"use client";

import { type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export type WizardStep = {
  id: string;
  label: string;
  /** Optional: gates "Next" button. Return true if user can advance. */
  canAdvance?: () => boolean | Promise<boolean>;
};

type Props = {
  steps: WizardStep[];
  /** Render the body for the active step */
  children: (stepIndex: number) => ReactNode;
  onComplete: () => void | Promise<void>;
  completeLabel?: string;
};

export default function Wizard({
  steps,
  children,
  onComplete,
  completeLabel = "Publish",
}: Props) {
  const [index, setIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const isLast = index === steps.length - 1;
  const current = steps[index];

  async function handleNext() {
    if (current.canAdvance) {
      const ok = await current.canAdvance();
      if (!ok) return;
    }
    if (isLast) {
      setIsCompleting(true);
      try {
        await onComplete();
      } finally {
        setIsCompleting(false);
      }
      return;
    }
    setDirection(1);
    setIndex((i) => i + 1);
  }

  function handleBack() {
    if (index === 0) return;
    setDirection(-1);
    setIndex((i) => i - 1);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Step indicator */}
      <ol className="mb-6 flex items-center gap-2 px-1">
        {steps.map((step, i) => {
          const completed = i < index;
          const active = i === index;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={i > index}
                onClick={() => {
                  if (i < index) {
                    setDirection(-1);
                    setIndex(i);
                  }
                }}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10.5px] font-semibold transition-colors",
                  completed && "border-[#0A261E] bg-[#0A261E] text-white",
                  active && "border-[#0A261E] bg-white text-[#0A261E]",
                  !completed && !active && "border-[#0A261E]/15 bg-white text-[#0A261E]/40"
                )}
                aria-current={active ? "step" : undefined}
              >
                {completed ? <Check size={11} strokeWidth={3} /> : i + 1}
              </button>
              <span
                className={cn(
                  "hidden whitespace-nowrap text-[12px] font-medium md:inline",
                  completed && "text-[#0A261E]/60",
                  active && "text-[#0A261E]",
                  !completed && !active && "text-[#0A261E]/35"
                )}
              >
                {step.label}
              </span>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "ml-1 h-px flex-1",
                    i < index ? "bg-[#0A261E]/45" : "bg-[#0A261E]/10"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 12 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 * direction }}
            transition={{ duration: 0.22, ease: EASE }}
            className="px-1"
          >
            {children(index)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#0A261E]/8 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          disabled={index === 0 || isCompleting}
        >
          <ChevronLeft size={14} />
          Back
        </Button>
        <p className="text-[11px] text-[#0A261E]/45">
          Step {index + 1} of {steps.length}
        </p>
        <Button type="button" onClick={handleNext} disabled={isCompleting}>
          {isCompleting
            ? "Publishing…"
            : isLast
            ? completeLabel
            : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
        </Button>
      </div>
    </div>
  );
}
