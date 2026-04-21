"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function ScrollCTA() {
  const { scrollY } = useScroll();

  // Fade out and slide down as user starts scrolling
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const y = useTransform(scrollY, [0, 200], [0, 30]);

  const handleClick = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    <motion.button
      onClick={handleClick}
      className="absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 border-0 bg-transparent"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.9 }}
      style={{ opacity, y }}
    >
      <span className="text-sm text-tan-light/50">Scroll to explore</span>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dark-green/15 transition-colors hover:border-dark-green/30 hover:bg-dark-green/5">
        <svg
          className="h-4 w-4 text-dark-green/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ animation: "bounce-down 2s ease-in-out infinite" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </motion.button>
  );
}
