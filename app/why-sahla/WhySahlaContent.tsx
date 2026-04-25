"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparison = [
  {
    question: "Where your mosque appears",
    shared: "Inside another company's app, alongside hundreds of other mosques",
    sahla: "Standalone in the App Store, listed under your mosque's name",
  },
  {
    question: "What your congregants see",
    shared: "Generic platform branding with your mosque as a sub-listing",
    sahla: "Your colors, your logo, your identity — start to finish",
  },
  {
    question: "Who owns the congregant data",
    shared: "The platform owns it; you get a partial export",
    sahla: "You own it; we hold it on your behalf and you can export anytime",
  },
  {
    question: "Revenue from sponsors",
    shared: "Either none, or the platform takes 10%+",
    sahla: "100% goes to your mosque; we take $0 of recurring ad revenue",
  },
  {
    question: "What happens if you leave",
    shared: "Your congregants stay in the platform's app",
    sahla: "Your app is yours; we hand over the keys",
  },
];

export default function WhySahlaContent() {
  return (
    <>
      {/* Hero */}
      <section className="bg-dark-green pt-36 pb-20">
        <div className="mx-auto max-w-[800px] px-8 text-center">
          <motion.p
            className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Why Sahla
          </motion.p>
          <motion.h1
            className="mb-6 font-[family-name:var(--font-display)] text-[clamp(40px,5vw,64px)] leading-[1.06] text-sand"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Your mosque, in your community&apos;s pocket.
          </motion.h1>
          <motion.p
            className="mx-auto max-w-[580px] text-[16px] leading-[1.7] text-sand/50"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Most mosque platforms put your masjid inside their app. Sahla builds <em>your</em> app — under your mosque&apos;s name, with your branding, in the App Store as a real, separate listing.
          </motion.p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-[#fffbf2] py-[80px]">
        <div className="mx-auto max-w-[1000px] px-8">
          <motion.h2
            className="mb-12 text-center font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,42px)] text-dark-green"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Shared mosque apps vs. Sahla.
          </motion.h2>

          {/* Table header */}
          <div className="mb-4 hidden grid-cols-[1.2fr_1fr_1fr] gap-4 lg:grid">
            <div />
            <div className="rounded-t-[12px] bg-dark-green/[0.03] px-5 py-3 text-center text-[12px] font-semibold tracking-[0.15em] uppercase text-dark-green/40">
              Shared Apps
            </div>
            <div className="rounded-t-[12px] bg-[#1a6b42]/[0.06] px-5 py-3 text-center text-[12px] font-semibold tracking-[0.15em] uppercase text-[#1a6b42]">
              Sahla
            </div>
          </div>

          {/* Table rows */}
          <div className="space-y-3">
            {comparison.map((row, i) => (
              <motion.div
                key={i}
                className="grid gap-4 rounded-[16px] border border-dark-green/[0.06] bg-white p-5 lg:grid-cols-[1.2fr_1fr_1fr] lg:items-center"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <p className="text-[15px] font-semibold text-dark-green">{row.question}</p>

                <div className="flex items-start gap-2.5">
                  <X size={16} className="mt-0.5 shrink-0 text-red-400/70" />
                  <span className="text-[14px] leading-[1.6] text-dark-green/50">{row.shared}</span>
                </div>

                <div className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0 text-[#1a6b42]" />
                  <span className="text-[14px] leading-[1.6] text-dark-green/70">{row.sahla}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Identity section */}
      <section className="bg-dark-green py-[80px]">
        <div className="mx-auto max-w-[720px] px-8 text-center">
          <motion.h2
            className="mb-5 font-[family-name:var(--font-display)] text-[clamp(28px,3.5vw,42px)] text-sand"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Your app. Your brand. Your community.
          </motion.h2>
          <motion.p
            className="mx-auto mb-10 max-w-[540px] text-[15px] leading-[1.7] text-sand/45"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            When your congregant searches for your mosque in the App Store, they find <em>your</em> app — not a generic platform with hundreds of mosques crammed inside. That&apos;s what white-label means.
          </motion.p>
        </div>
      </section>
    </>
  );
}
