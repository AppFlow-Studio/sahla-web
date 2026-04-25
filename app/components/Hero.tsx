"use client";

import { motion } from "framer-motion";

import Logo3D from "./Logo3D";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 18 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay },
});

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-dark-green" style={{ minHeight: "85vh" }}>
      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 65% 10%, rgba(26,107,66,0.5) 0%, transparent 55%), " +
            "radial-gradient(ellipse at 20% 100%, rgba(154,123,46,0.14) 0%, transparent 45%), " +
            "radial-gradient(circle at 82% 82%, rgba(26,107,66,0.18) 0%, transparent 40%)",
        }}
      />

      {/* Geometric pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "220px 220px",
        }}
      />

      <div className="relative z-[2] mx-auto flex max-w-[1400px] flex-col items-center px-5 pt-28 pb-12 sm:px-8 sm:pt-32 sm:pb-16 lg:flex-row lg:items-center lg:gap-0 lg:pt-36 lg:pb-20">
        {/* Left — Text */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-[18px] py-2 backdrop-blur-sm"
            {...fade(0.1)}
          >
            <div className="relative h-[7px] w-[7px]">
              <div className="absolute inset-0 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-400" style={{ animation: "ping 2s ease-out infinite" }} />
            </div>
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-sand/70">Trusted by 3,000+ users</span>
          </motion.div>

          <motion.h1
            className="mb-6 font-[family-name:var(--font-display)] text-[clamp(26px,6vw,52px)] leading-[1.08] text-sand"
            {...fade(0.2)}
          >
            Your mosque deserves its own app{" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(90deg, #d4af37, #f0d878 50%, #b8922a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              — not a page inside someone else&apos;s.
              <span
                className="absolute left-0 right-0 -bottom-1 h-[1px]"
                style={{
                  background: "linear-gradient(90deg, #d4af37, transparent)",
                  transformOrigin: "left",
                  animation: "drawLine 1.2s cubic-bezier(.16,1,.3,1) 0.8s forwards",
                  transform: "scaleX(0)",
                }}
              />
            </span>
          </motion.h1>

          <motion.p
            className="mb-8 max-w-[50ch] text-[15px] leading-[1.7] text-sand/50"
            {...fade(0.35)}
          >
            Sahla builds fully branded iOS and Android apps for mosques. Your name in the App Store. Your colors. Your community. And the opportunity to fund it through local advertisers — every dollar goes to your mosque.
          </motion.p>

          <motion.div className="flex flex-wrap items-center justify-center gap-3.5 lg:justify-start" {...fade(0.5)}>
            <a
              href="#how-it-works"
              className="group relative overflow-hidden rounded-full bg-sand px-[30px] py-[15px] text-[13px] font-semibold tracking-[0.02em] text-dark-green shadow-[0_20px_40px_-16px_rgba(255,251,242,0.18)] transition-all duration-300 hover:-translate-y-px hover:shadow-[0_24px_50px_-16px_rgba(255,251,242,0.28)]"
            >
              <span className="relative z-10">See How It Works</span>
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            </a>
          </motion.div>
        </div>

        {/* Right — 3D Logo */}
        <motion.div
          className="relative mt-8 h-[280px] w-[280px] flex-shrink-0 sm:mt-12 sm:h-[360px] sm:w-[360px] lg:mt-0 lg:-mr-20 lg:h-[580px] lg:w-[580px]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        >
          <Logo3D />

          {/* Static glow behind logo */}
          <div
            className="pointer-events-none absolute -inset-20 -z-10 rounded-full opacity-80"
            style={{
              background: "radial-gradient(circle, rgba(212,175,55,0.25), rgba(26,107,66,0.1) 45%, transparent 70%)",
            }}
          />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-sand/25 sm:flex">
        <span className="text-[10px] font-medium tracking-[0.3em] uppercase">Scroll</span>
        <div className="h-10 w-[1px] overflow-hidden bg-sand/12">
          <i className="block h-[40%] w-full bg-sand/55" style={{ animation: "tick 2s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}
