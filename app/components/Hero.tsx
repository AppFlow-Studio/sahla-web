"use client";

import { motion } from "framer-motion";

import Logo3D from "./Logo3D";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 18 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay },
});

type HeroProps = {
  ctaLabel?: string;
  ctaHref?: string;
};

export default function Hero({
  ctaLabel = "Book a Demo",
  ctaHref = "/contact",
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#fffbf2]" style={{ minHeight: "85vh" }}>

      <div className="relative z-[2] mx-auto flex max-w-[1400px] flex-col items-center px-5 pt-28 pb-12 sm:px-8 sm:pt-32 sm:pb-16 lg:flex-row lg:items-center lg:gap-0 lg:pt-36 lg:pb-20">
        {/* Left — Text */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-dark-green/10 bg-dark-green/[0.03] px-[18px] py-2"
            {...fade(0.1)}
          >
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-dark-green/50">Trusted by 3,500+ users</span>
          </motion.div>

          <motion.h1
            className="mb-6 font-[family-name:var(--font-hero)] text-[clamp(26px,6vw,52px)] leading-[1.08] text-dark-green"
            {...fade(0.2)}
          >
            Your mosque deserves its own app{" "}
            <span
              className="relative inline"
            >
              — not a page inside someone else&apos;s.
            </span>
          </motion.h1>

          <motion.p
            className="mb-8 max-w-[50ch] text-[15px] leading-[1.7] text-dark-green/50"
            {...fade(0.35)}
          >
            Sahla builds fully branded iOS and Android apps for mosques. Your name in the App Store. Your colors. Your community. And the opportunity to fund it through local advertisers — every dollar goes to your mosque.
          </motion.p>

          <motion.div className="flex flex-wrap items-center justify-center gap-3.5 lg:justify-start" {...fade(0.5)}>
            <a
              href="/waitlist"
              className="group relative overflow-hidden rounded-full bg-dark-green px-[30px] py-[15px] text-[13px] font-semibold tracking-[0.02em] text-sand shadow-[0_20px_40px_-16px_rgba(10,38,30,0.18)] transition-all duration-300 hover:-translate-y-px hover:shadow-[0_24px_50px_-16px_rgba(10,38,30,0.28)]"
            >
              <span className="relative z-10">Reserve Now</span>
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
            </a>
            <a
              href="#how-it-works"
              className="rounded-full border border-dark-green/20 px-[30px] py-[15px] text-[13px] font-semibold tracking-[0.02em] text-dark-green transition-all duration-300 hover:-translate-y-px hover:border-dark-green/40 hover:bg-dark-green/5"
            >
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* Right — 3D Logo */}
        <motion.div
          className="relative mt-8 h-[320px] w-[320px] flex-shrink-0 sm:mt-12 sm:h-[420px] sm:w-[420px] lg:mt-0 lg:-mr-20 lg:h-[680px] lg:w-[680px]"
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
      <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-dark-green/25 sm:flex">
        <span className="text-[10px] font-medium tracking-[0.3em] uppercase">Scroll</span>
        <div className="h-10 w-[1px] overflow-hidden bg-dark-green/12">
          <i className="block h-[40%] w-full bg-dark-green/55" style={{ animation: "tick 2s ease-in-out infinite" }} />
        </div>
      </div>
    </section>
  );
}
