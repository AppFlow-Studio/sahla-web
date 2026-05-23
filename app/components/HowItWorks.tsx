"use client";

import { motion } from "framer-motion";
import { GearSix, RocketLaunch, TrendUp } from "@phosphor-icons/react";

const steps = [
  {
    number: "01",
    Icon: GearSix,
    title: "Onboard your mosque in 30 minutes.",
    description:
      "Brand colors, logo, prayer time configuration, donation setup. We walk you through everything — no technical skills needed.",
    accent: "#1a6b42",
  },
  {
    number: "02",
    Icon: RocketLaunch,
    title: "We build and submit your apps.",
    description:
      "Your app goes to the App Store and Google Play under your mosque's name, with your branding. A real, standalone listing — not a sub-page.",
    accent: "#d4af37",
  },
  {
    number: "03",
    Icon: TrendUp,
    title: "Your community engages. Sponsors fund it.",
    description:
      "Your congregation downloads, engages with prayer times and programs, and local businesses sponsor your app — funding the whole thing. Every dollar goes to your mosque.",
    accent: "#4a8c65",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#fffbf2] py-16 sm:py-[100px]">

      <motion.div
        className="relative mx-auto max-w-[900px] px-5 sm:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-16 text-center">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#9a7b2e]">How It Works</p>
          <h2 className="mt-4 font-[family-name:var(--font-hero)] text-[clamp(32px,4vw,52px)] text-dark-green">
            Three steps to your mosque&apos;s app.
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-[1.65] text-dark-green/50">
            From onboarding to the App Store in days, not months.
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative">

          <div className="flex flex-col gap-8 sm:gap-12">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group relative flex items-start gap-5 sm:gap-10"
              >
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <div
                    className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 border-dark-green/10 bg-transparent transition-transform duration-500 group-hover:scale-110"
                  >
                    <span
                      className="font-[family-name:var(--font-hero)] text-[16px] font-bold text-dark-green/40"
                    >
                      {step.number}
                    </span>
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <div className="mb-2 flex items-center gap-3">
                    <step.Icon size={18} weight="light" className="text-dark-green/50" />
                    <h3 className="text-[17px] font-semibold text-dark-green">{step.title}</h3>
                  </div>
                  <p className="max-w-[480px] text-[14px] leading-[1.7] text-dark-green/50">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
