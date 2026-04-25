"use client";

import { motion } from "framer-motion";
import { Settings, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    Icon: Settings,
    title: "Onboard your mosque in 30 minutes.",
    description:
      "Brand colors, logo, prayer time configuration, donation setup. We walk you through everything — no technical skills needed.",
    accent: "#1a6b42",
  },
  {
    number: "02",
    Icon: Rocket,
    title: "We build and submit your apps.",
    description:
      "Your app goes to the App Store and Google Play under your mosque's name, with your branding. A real, standalone listing — not a sub-page.",
    accent: "#d4af37",
  },
  {
    number: "03",
    Icon: TrendingUp,
    title: "Your community engages. Sponsors fund it.",
    description:
      "Your congregation downloads, engages with prayer times and programs, and local businesses sponsor your app — funding the whole thing. Every dollar goes to your mosque.",
    accent: "#4a8c65",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-dark-green py-16 sm:py-[100px]">
      {/* Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <motion.div
        className="relative mx-auto max-w-[900px] px-5 sm:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-16 text-center">
          <div className="mb-5 flex items-center justify-center gap-3.5">
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(217,196,160,0.5))" }} />
            <div className="h-1.5 w-1.5 rotate-45 bg-gold" />
            <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, rgba(217,196,160,0.5), transparent)" }} />
          </div>
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#d9c4a0]">How It Works</p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] text-sand">
            Three steps to your mosque&apos;s app.
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-[1.65] text-sand/45">
            From onboarding to the App Store in days, not months.
          </p>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute top-0 bottom-0 left-[25px] hidden w-[1px] sm:block"
            style={{ background: "linear-gradient(180deg, rgba(217,196,160,0.25), rgba(217,196,160,0.05))" }}
          />

          <div className="flex flex-col gap-8 sm:gap-12">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group relative flex items-start gap-5 sm:gap-10"
              >
                <div className="relative z-10 flex shrink-0 flex-col items-center">
                  <div
                    className="flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 transition-transform duration-500 group-hover:scale-110"
                    style={{
                      borderColor: step.accent,
                      backgroundColor: `${step.accent}1A`,
                    }}
                  >
                    <span
                      className="font-[family-name:var(--font-display)] text-[16px] font-bold"
                      style={{ color: step.accent }}
                    >
                      {step.number}
                    </span>
                  </div>
                </div>
                <div className="flex-1 pb-2">
                  <div className="mb-2 flex items-center gap-3">
                    <step.Icon size={18} strokeWidth={1.8} style={{ color: step.accent }} />
                    <h3 className="text-[17px] font-semibold text-sand">{step.title}</h3>
                  </div>
                  <p className="max-w-[480px] text-[14px] leading-[1.7] text-sand/45">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
