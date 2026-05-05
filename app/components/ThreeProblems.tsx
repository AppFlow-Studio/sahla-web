"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const VisibilityGlobe = dynamic(() => import("./VisibilityGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-green/10 border-t-dark-green/40" />
    </div>
  ),
});

export default function ThreeProblems() {
  return (
    <section className="relative overflow-hidden bg-[#fffbf2] py-16 sm:py-[100px]">
      <motion.div
        className="relative mx-auto max-w-[1200px] px-5 sm:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-16 text-center">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#9a7b2e]">The Problem</p>
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,52px)] text-dark-green">
            How visible is your mosque?
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-[1.65] text-dark-green/45">
            See the difference a dedicated app makes for your community&rsquo;s reach.
          </p>
        </div>

        <Suspense>
          <VisibilityGlobe />
        </Suspense>
      </motion.div>
    </section>
  );
}
