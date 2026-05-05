"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import NumberFlow from "@number-flow/react";

export default function RevenueFlip() {
  const [sponsors, setSponsors] = useState(5);
  const ratePerSponsor = 100;
  const subscription = 300;
  const revenue = sponsors * ratePerSponsor;
  const net = subscription - revenue;

  return (
    <section className="relative overflow-hidden bg-[#fffbf2] py-16 sm:py-[100px]">
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#9a7b2e]">The Revenue Flip</p>
            <h2 className="mb-5 font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] leading-[1.08] text-dark-green">
              Your app pays for itself.
            </h2>
            <p className="mb-6 max-w-[480px] text-[16px] leading-[1.7] text-dark-green/55">
              Local businesses sponsor ad space in your mosque&apos;s app at $100/month each. You keep 100% of recurring ad revenue — Sahla takes $0. At just 3 sponsors, your app is free. At 4+, it&apos;s generating surplus for your masjid.
            </p>
            <p className="mb-8 max-w-[480px] text-[14px] leading-[1.7] text-dark-green/40">
              Most mosque platforms charge $99&ndash;149/month with a fee on every donation. Sahla charges $300/month flat and takes nothing from your donations or recurring ad revenue.
            </p>
            <Link
              href="/pricing"
              className="inline-flex rounded-full bg-dark-green px-7 py-3.5 text-[13px] font-semibold text-sand transition-all duration-300 hover:bg-dark-green/90"
            >
              See Full Pricing
            </Link>
          </motion.div>

          {/* Right — calculator */}
          <motion.div
            className="overflow-hidden rounded-[24px] border border-dark-green/[0.08] bg-white p-5 shadow-[0_20px_60px_-20px_rgba(10,38,30,0.08)] sm:p-8"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <p className="mb-6 text-[12px] font-semibold tracking-[0.2em] uppercase text-dark-green/40">Revenue Calculator</p>

            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] text-dark-green/60">Local sponsors</span>
                <span className="font-[family-name:var(--font-display)] text-[28px] text-dark-green">
                  <NumberFlow value={sponsors} trend={1} />
                </span>
              </div>
              {/* Custom styled range slider */}
              <div className="relative h-10 w-full">
                <input
                  type="range"
                  min={0}
                  max={15}
                  value={sponsors}
                  onChange={(e) => setSponsors(Number(e.target.value))}
                  className="revenue-slider w-full"
                  style={{ "--fill": `${(sponsors / 15) * 100}%` } as React.CSSProperties}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[11px] text-dark-green/30">
                <span>0</span>
                <span>15</span>
              </div>
            </div>

            <div className="space-y-4 border-t border-dark-green/[0.06] pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-dark-green/60">Sahla subscription</span>
                <span className="text-[16px] font-semibold text-dark-green">${subscription}/mo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-dark-green/60">Sponsor revenue ({sponsors} x ${ratePerSponsor})</span>
                <span className="text-[16px] font-semibold text-[#1a6b42]">
                  -$<NumberFlow value={revenue} />/mo
                </span>
              </div>
              <div className="border-t border-dark-green/[0.06] pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-dark-green">Net cost to mosque</span>
                  <span
                    className="font-[family-name:var(--font-display)] text-[32px] leading-none transition-colors duration-300"
                    style={{ color: net <= 0 ? "#1a6b42" : "#0A261E" }}
                  >
                    {net <= 0 ? "+$" : "$"}<NumberFlow value={Math.abs(net)} />
                    <span className="text-[14px] font-normal text-dark-green/40">/mo</span>
                  </span>
                </div>
                {net <= 0 && (
                  <p className="mt-2 text-right text-[13px] font-medium text-[#1a6b42]">
                    {net === 0 ? "Your app is free!" : "Your app is generating surplus for the masjid."}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
