"use client";

import { motion } from "framer-motion";

export default function CrescentMoon() {
  return (
    <div className="pointer-events-none absolute top-6 right-6 z-[5] sm:top-10 sm:right-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
        className="relative"
      >
        {/* Moon glow */}
        <div
          className="absolute -inset-16 rounded-full opacity-10 blur-[50px]"
          style={{
            background:
              "radial-gradient(circle, #d9c4a0 0%, #c4a87a 30%, transparent 70%)",
          }}
        />

        <svg
          width="140"
          height="140"
          viewBox="0 0 100 100"
          className="relative drop-shadow-[0_0_15px_rgba(217,196,160,0.2)]"
        >
          <defs>
            <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d9c4a0" />
              <stop offset="50%" stopColor="#c4a87a" />
              <stop offset="100%" stopColor="#a08960" />
            </linearGradient>
            <mask id="crescentMask">
              <circle cx="45" cy="50" r="32" fill="white" />
              <circle cx="58" cy="42" r="26" fill="black" />
            </mask>
          </defs>

          {/* Crescent */}
          <circle
            cx="45"
            cy="50"
            r="32"
            fill="url(#moonGradient)"
            mask="url(#crescentMask)"
          />

          {/* Star beside crescent */}
          <motion.g
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon
              points="75,38 77.5,44 84,44.5 79,48.5 80.5,55 75,51 69.5,55 71,48.5 66,44.5 72.5,44"
              fill="#d9c4a0"
            />
            <circle cx="75" cy="46" r="8" fill="none" opacity="0.1"
              style={{ filter: "blur(4px)", fill: "#d9c4a0" }}
            />
          </motion.g>
        </svg>

        {/* Smaller decorative stars around the moon */}
        {[
          { x: -25, y: 15, size: 2.5, delay: 0 },
          { x: 150, y: 90, size: 2, delay: 1.5 },
          { x: -15, y: 120, size: 1.5, delay: 0.8 },
          { x: 155, y: 20, size: 1.5, delay: 2 },
        ].map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#d9c4a0]"
            style={{
              left: s.x,
              top: s.y,
              width: s.size,
              height: s.size,
              boxShadow: `0 0 ${s.size * 3}px rgba(217,196,160,0.3)`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: s.delay,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
