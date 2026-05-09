"use client";

import { type ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  /** Numeric value — animated via @number-flow */
  value: number;
  /** "$" "" "%" etc. */
  prefix?: string;
  suffix?: string;
  /** Optional change vs prior period (-1.0 to +1.0 fractional) */
  delta?: number;
  /** Override how the delta renders, e.g. "+12 today" */
  deltaLabel?: string;
  /** Mini sparkline / chart slot */
  chart?: ReactNode;
  /** Help tooltip text */
  help?: string;
  className?: string;
};

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  delta,
  deltaLabel,
  chart,
  help,
  className,
}: Props) {
  const deltaPct = typeof delta === "number" ? Math.round(delta * 100) : null;
  const deltaTone =
    deltaPct === null
      ? "neutral"
      : deltaPct > 0
      ? "up"
      : deltaPct < 0
      ? "down"
      : "neutral";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white p-5 transition-shadow duration-300 hover:shadow-[0_8px_24px_-12px_rgba(10,38,30,0.18)]",
        className
      )}
      title={help}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
        {label}
      </p>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        {prefix ? (
          <span className="font-display text-2xl text-[#0A261E]/55">{prefix}</span>
        ) : null}
        <NumberFlow
          value={value}
          format={{ maximumFractionDigits: 0 }}
          className="font-display text-[32px] leading-none text-[#0A261E]"
        />
        {suffix ? (
          <span className="font-display text-2xl text-[#0A261E]/55">{suffix}</span>
        ) : null}
      </div>

      {(deltaPct !== null || deltaLabel) ? (
        <div className="mt-2 flex items-center gap-1.5 text-[12px]">
          {deltaTone === "up" ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
              <ArrowUpRight size={12} /> {Math.abs(deltaPct ?? 0)}%
            </span>
          ) : deltaTone === "down" ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 font-semibold text-red-700">
              <ArrowDownRight size={12} /> {Math.abs(deltaPct ?? 0)}%
            </span>
          ) : deltaPct !== null ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#0A261E]/[0.06] px-1.5 py-0.5 font-semibold text-[#0A261E]/60">
              <Minus size={12} /> 0%
            </span>
          ) : null}
          {deltaLabel ? (
            <span className="text-[#0A261E]/55">{deltaLabel}</span>
          ) : (
            <span className="text-[#0A261E]/55">vs last period</span>
          )}
        </div>
      ) : null}

      {chart ? (
        <div className="mt-4 -mb-1 h-14 w-full">{chart}</div>
      ) : null}
    </motion.article>
  );
}

export function formatNumber(n: number) {
  return numberFormat.format(n);
}
