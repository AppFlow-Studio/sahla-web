"use client";

import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  /** One-sentence explanation. Plain English (Rule #6) */
  text: string;
  size?: number;
  className?: string;
  ariaLabel?: string;
};

/**
 * `?` icon with hover/tap tooltip — Rule #6: contextual help, not a help center.
 * Drop next to any field label or column header.
 */
export default function HelpButton({
  text,
  size = 14,
  className,
  ariaLabel = "More info",
}: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full text-[#0A261E]/35 transition-colors hover:text-[#0A261E]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A261E]/30",
          className
        )}
      >
        <HelpCircle size={size} strokeWidth={1.6} />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[260px] bg-[#0A261E] px-3 py-2 text-[12px] leading-relaxed text-[#fffbf2]"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
