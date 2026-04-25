"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-dark-green py-20 sm:py-[140px]">
      {/* Gradient blobs — static, no blur filter */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[200px] -right-[180px] h-[640px] w-[640px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(26,107,66,0.9), transparent 60%)" }} />
        <div className="absolute -bottom-[180px] -left-[160px] h-[520px] w-[520px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(184,146,42,0.9), transparent 60%)" }} />
      </div>

      {/* Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      <motion.div
        className="relative mx-auto max-w-[780px] px-5 text-center sm:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-5 flex items-center justify-center gap-3.5">
          <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(217,196,160,0.5))" }} />
          <div className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <div className="h-[1px] w-12" style={{ background: "linear-gradient(90deg, rgba(217,196,160,0.5), transparent)" }} />
        </div>

        <h2 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(28px,6vw,68px)] leading-[1.08] text-sand">
          Your community is waiting for{" "}
          <em
            className="font-[family-name:var(--font-display)] not-italic"
            style={{ color: "#d4af37" }}
          >their app.</em>
        </h2>

        <p className="mx-auto mt-[22px] mb-10 max-w-[520px] text-[16px] leading-[1.7] text-sand/45">
          Join MAS Staten Island and mosques across the country. Book a 15-minute demo and see what Sahla can build for your masjid.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/demo"
            className="group relative overflow-hidden rounded-full bg-sand px-[30px] py-[15px] text-[13px] font-semibold tracking-[0.02em] text-dark-green shadow-[0_20px_40px_-16px_rgba(255,251,242,0.18)] transition-all duration-300 hover:-translate-y-px hover:shadow-[0_24px_50px_-16px_rgba(255,251,242,0.28)]"
          >
            <span className="relative z-10">Book a Demo</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-sand/15 px-7 py-[15px] text-[13px] font-semibold tracking-[0.02em] text-sand transition-all duration-300 hover:border-sand/30 hover:bg-sand/[0.04]"
          >
            See Pricing
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
