"use client";

import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE_OUT_QUART } from "@/lib/motion";

/**
 * A checkmark whose stroke draws itself on. The single shared "you did it"
 * gesture across onboarding: sidebar rows, wizard steppers, panel progress,
 * and the milestone card all use this one so completion always looks the same.
 *
 * `play={false}` renders the finished check with no animation — for checks
 * that were already there when the page loaded.
 */
export default function CheckDraw({
  size = 12,
  strokeWidth = 3.5,
  delay = 0,
  play = true,
  className,
}: {
  size?: number;
  strokeWidth?: number;
  delay?: number;
  play?: boolean;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const animate = play && !reduceMotion;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <motion.path
        d="M4.5 12.6 9.6 17.7 19.5 6.6"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: DUR.draw,
          delay,
          ease: EASE_OUT_QUART,
          opacity: { duration: 0.08, delay },
        }}
      />
    </svg>
  );
}
