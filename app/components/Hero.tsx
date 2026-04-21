"use client";

import { motion } from "framer-motion";
import Logo3D from "./Logo3D";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 24 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay },
});

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-dark-green" style={{ minHeight: "100vh" }}>
      {/* Gradient overlay — richer, more layered */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 60% 0%, rgba(26,107,66,0.45) 0%, transparent 55%), " +
            "radial-gradient(ellipse at 20% 100%, rgba(154,123,46,0.12) 0%, transparent 45%), " +
            "radial-gradient(circle at 80% 80%, rgba(26,107,66,0.15) 0%, transparent 40%)",
        }}
      />

      {/* Islamic geometric pattern overlay — subtle tessellation */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Grain texture for depth */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-36 pb-24 lg:flex-row lg:items-center lg:gap-16 lg:pt-44 lg:pb-32">
        {/* Left — Text */}
        <div className="flex-1 text-center lg:text-left">
          {/* Beta badge */}
          <motion.div
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] px-5 py-2 backdrop-blur-sm"
            {...fade(0.1)}
          >
            <div className="relative h-2 w-2">
              <div className="absolute inset-0 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
            </div>
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/60">Now in Beta</span>
          </motion.div>

          <motion.h1
            className="mb-6 font-[family-name:var(--font-display)] text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.02] text-white"
            {...fade(0.2)}
          >
            Build Your Community&apos;s App{" "}
            <span className="relative inline-block">
              <span className="relative z-10" style={{ color: "#d4af37" }}>
                — No Code Required
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 h-[1px] w-full"
                style={{ background: "linear-gradient(90deg, #d4af37, transparent)" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
              />
            </span>
          </motion.h1>

          <motion.p
            className="mb-10 max-w-lg text-[17px] leading-[1.7] text-white/40"
            {...fade(0.35)}
          >
            The all-in-one platform for mosques and community centers to launch beautiful, custom mobile apps in minutes.
          </motion.p>

          <motion.div className="flex items-center justify-center gap-4 lg:justify-start" {...fade(0.5)}>
            <a
              href="#showcase"
              className="group relative overflow-hidden rounded-full bg-white px-9 py-4 text-[13px] font-semibold tracking-wide text-dark-green shadow-2xl shadow-white/10 transition-all duration-500 hover:shadow-white/20"
            >
              <span className="relative z-10">See It in Action</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </a>
            <a
              href="/login"
              className="rounded-full border border-white/10 px-9 py-4 text-[13px] font-semibold tracking-wide text-white/80 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.03]"
            >
              Get Started Free
            </a>
          </motion.div>

          {/* Social proof micro-line */}
          <motion.div className="mt-10 flex items-center justify-center gap-3 lg:justify-start" {...fade(0.65)}>
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-dark-green bg-gradient-to-br from-emerald-700/60 to-emerald-900/40" />
              ))}
            </div>
            <span className="text-xs text-white/30">Trusted by 50+ community centers</span>
          </motion.div>
        </div>

        {/* Right — 3D Logo */}
        <motion.div
          className="relative mt-16 h-[500px] w-[500px] flex-shrink-0 lg:mt-0 lg:-mr-20 lg:h-[850px] lg:w-[850px]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        >
          <Logo3D />

          {/* Glow behind logo — enhanced */}
          <div className="pointer-events-none absolute -inset-20 -z-10 rounded-full blur-[80px]" style={{ background: "radial-gradient(circle, rgba(26,107,66,0.3) 0%, rgba(184,146,42,0.05) 50%, transparent 70%)" }} />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-white/20">Scroll</span>
          <div className="h-10 w-[1px] overflow-hidden bg-white/10">
            <motion.div
              className="h-full w-full bg-white/40"
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>

    </section>
  );
}
