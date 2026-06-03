"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Pencil, Power, PowerOff } from "lucide-react";

export type OnboardingAdsConfig = {
  enabled: boolean;
  onboardingFee: number;
  monthlyRate: number;
};

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function BusinessAdsConfigSummary({
  config,
}: {
  config: OnboardingAdsConfig;
}) {
  const annualPerFive =
    config.onboardingFee * 5 + config.monthlyRate * 5 * 12;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 overflow-hidden rounded-3xl border border-[#0A261E]/8 bg-white"
    >
      <div className="flex items-center justify-between border-b border-[#0A261E]/6 px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            From onboarding
          </p>
          <h3 className="mt-0.5 font-display text-[18px] text-[#0A261E]">
            Your Business Ads setup
          </h3>
        </div>
        <Link
          href="/ads_config"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A261E]/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#0A261E]/70 transition-colors hover:bg-[#0A261E]/[0.03]"
        >
          <Pencil size={12} />
          Edit in onboarding
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-px bg-[#0A261E]/6 md:grid-cols-4">
        <div className="bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            Status
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5">
            {config.enabled ? (
              <>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                  <Power size={12} className="text-emerald-700" />
                </span>
                <span className="text-[15px] font-semibold text-emerald-700">
                  Enabled
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0A261E]/[0.06]">
                  <PowerOff size={12} className="text-[#0A261E]/55" />
                </span>
                <span className="text-[15px] font-semibold text-[#0A261E]/55">
                  Disabled
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            Onboarding fee
          </p>
          <p className="mt-2 font-display text-[24px] leading-none text-[#0A261E]">
            {dollars.format(config.onboardingFee)}
          </p>
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            One-time per business
          </p>
        </div>

        <div className="bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            Monthly rate
          </p>
          <p className="mt-2 font-display text-[24px] leading-none text-[#0A261E]">
            {dollars.format(config.monthlyRate)}
          </p>
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            Per business per month
          </p>
        </div>

        <div className="bg-[#fffbf2] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B8922A]">
            5-business projection
          </p>
          <p className="mt-2 font-display text-[24px] leading-none text-[#0A261E]">
            {dollars.format(annualPerFive)}
          </p>
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            Annual revenue estimate
          </p>
        </div>
      </div>
    </motion.section>
  );
}
