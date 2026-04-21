"use client";

import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="relative z-10 overflow-hidden bg-dark-green py-32">
      {/* Gradient accents — richer layering */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-[60vh] w-[60vh] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, rgba(26,107,66,0.25) 0%, transparent 60%)" }} />
        <div className="absolute -bottom-40 -left-40 h-[50vh] w-[50vh] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, rgba(154,123,46,0.1) 0%, transparent 60%)" }} />
        <div className="absolute top-1/2 left-1/2 h-[40vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" style={{ background: "radial-gradient(ellipse, rgba(26,107,66,0.08) 0%, transparent 60%)" }} />
      </div>

      {/* Islamic geometric pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        {/* Decorative element */}
        <motion.div
          className="mb-8 flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, #B8922A30)" }} />
          <div className="h-1.5 w-1.5 rotate-45 border border-tan-gold/30" />
          <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, #B8922A30, transparent)" }} />
        </motion.div>

        <motion.p
          className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/25"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Get Started
        </motion.p>

        <motion.h2
          className="mb-7 font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.1] text-white"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Ready to Build Your Community&apos;s{" "}
          <span style={{ color: "#d4af37" }}>App?</span>
        </motion.h2>

        <motion.p
          className="mb-12 text-[16px] leading-[1.7] text-white/35"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Join 50+ community centers already using Sahla to engage their members. No code, no hassle — just results.
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a
            href="/login"
            className="group relative overflow-hidden rounded-full bg-white px-10 py-4 text-[13px] font-semibold tracking-wide text-dark-green shadow-2xl shadow-white/10 transition-all duration-500 hover:shadow-white/20"
          >
            <span className="relative z-10">Start Free</span>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </a>
          <a
            href="#showcase"
            className="rounded-full border border-white/10 px-10 py-4 text-[13px] font-semibold tracking-wide text-white/70 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.03]"
          >
            See Demo
          </a>
        </motion.div>
      </div>
    </section>
  );
}
