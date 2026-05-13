"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  /** What goes in the empty area — short, plain English (Rule #4 teaches) */
  title: string;
  description: string;
  /** Brass-bordered ghost row caption — what the user should see appear */
  ghostRowCaption?: string;
  /** Action button (the primary CTA from this state) */
  action?: ReactNode;
  /** Optional 30-second video link slot */
  videoUrl?: string;
  videoLabel?: string;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  ghostRowCaption,
  action,
  videoUrl,
  videoLabel = "Watch a 30-second tour",
  className,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-2xl border border-[#0A261E]/8 bg-white px-6 py-12 md:px-10 md:py-16",
        className
      )}
    >
      <div className="mx-auto max-w-md text-center">
        <h2 className="font-display text-2xl text-[#0A261E]">{title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#0A261E]/60">
          {description}
        </p>

        {ghostRowCaption ? (
          <div className="mt-8">
            <div className="mx-auto flex h-12 max-w-sm items-center justify-between rounded-xl border-2 border-dashed border-[#B8922A]/40 bg-[#B8922A]/[0.04] px-4 text-[13px] font-medium text-[#B8922A]">
              <span className="opacity-70">{ghostRowCaption}</span>
              <span className="rounded-md bg-[#B8922A]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Sample
              </span>
            </div>
          </div>
        ) : null}

        {action ? <div className="mt-8 flex justify-center">{action}</div> : null}

        {videoUrl ? (
          <div className="mt-6">
            <Link
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[12px] font-medium text-[#0A261E]/55 transition-colors hover:text-[#0A261E]"
            >
              <Play size={12} className="fill-current" />
              {videoLabel}
              <ArrowUpRight size={12} />
            </Link>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
