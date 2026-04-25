"use client";

import { motion } from "framer-motion";

export default function ProofBar() {
  return (
    <section className="relative border-t border-b border-[#d9c4a0]/12 bg-dark-green">
      <motion.div
        className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-5 px-5 py-6 sm:gap-8 sm:px-8 sm:py-8 lg:justify-between"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-white/[0.06]">
            <span className="text-lg font-bold text-[#d9c4a0]">M</span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-sand">MAS Staten Island</p>
            <p className="text-[12px] text-sand/40">3,000+ active app users</p>
          </div>
        </div>

        <div
          className="hidden h-8 w-[1px] lg:block"
          style={{ background: "linear-gradient(180deg, transparent, rgba(217,196,160,0.14), transparent)" }}
        />

        <blockquote className="max-w-[480px] text-center text-[14px] leading-[1.65] italic text-sand/50 lg:text-left">
          &ldquo;Sahla gave our mosque its own identity in the App Store. Our community finally has one place for everything.&rdquo;
        </blockquote>

        <div
          className="hidden h-8 w-[1px] lg:block"
          style={{ background: "linear-gradient(180deg, transparent, rgba(217,196,160,0.14), transparent)" }}
        />

        <div className="flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="h-4 w-4 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-1.5 text-[13px] font-medium text-sand/50">4.8 App Store</span>
        </div>
      </motion.div>
    </section>
  );
}
