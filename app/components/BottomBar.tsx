"use client";

import { motion } from "framer-motion";

export default function BottomBar() {
  return (
    <motion.div
      className="relative z-20 flex items-center justify-between border-t border-dark-green/8 px-8 py-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-dark-green">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <span className="text-sm font-medium tracking-wide text-dark-green/70">
          Sahla
        </span>
      </div>
      <span className="text-xs text-tan-light/40">
        Community Center App Creation Studio
      </span>
    </motion.div>
  );
}
