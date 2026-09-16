"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { EASE_OUT_EXPO, EASE_OUT_QUART } from "@/lib/motion";
import type { LaunchDestination } from "@/lib/auth/launch-destination";

/** Long enough to read one line, short enough to not feel like a wait. */
const BEAT_MS = 950;
/** If the route transition stalls, give people something to click. */
const ESCAPE_MS = 2600;

/**
 * The mark inside sahla-logo.png is a circle of radius 0.349 x the file,
 * centred on the file's centre. It's the drawn circle that has to sit
 * concentric with the ring, so these are sized from that radius rather than
 * from the file box: the file's visible bounding box is much wider than the
 * mark (faint stray pixels out to the right edge) and centring by it pulls
 * the mark off to one side.
 */
const RING_PX = 180;
/** Renders the mark at 124px across, leaving ~7px to the ring all round. */
const MARK_HEIGHT_PX = 178;
/** viewBox units: a 140px stroke-centre circle with a 2px stroke, at RING_PX. */
const RING_R = (70 / RING_PX) * 100;
const RING_STROKE = (2 / RING_PX) * 100;

const EYEBROW: Record<LaunchDestination["kind"], string> = {
  "signed-out": "Sahla",
  hq: "Sahla HQ",
  setup: "Getting started",
  resume: "Setup",
  crm: "Workspace",
  receipt: "Your app",
};

const VERB: Record<LaunchDestination["kind"], string> = {
  "signed-out": "Returning to sign in",
  hq: "Opening",
  setup: "Preparing",
  resume: "Reopening",
  crm: "Opening",
  receipt: "Opening",
};

/**
 * The half-second between "signed in" and "here is your workspace".
 *
 * It exists because that destination isn't the same for everyone — HQ staff,
 * a mosque mid-checklist, and a shipped mosque all land somewhere different,
 * and the screen says which before it moves. The ornament is the same one
 * from the sign-in page at the same size, so the two reads as one gesture.
 */
export default function LaunchHandoff({ dest }: { dest: LaunchDestination }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [escaped, setEscaped] = useState(false);

  useEffect(() => {
    router.prefetch(dest.href);
  }, [router, dest.href]);

  useEffect(() => {
    // No motion preference means no reason to hold anyone here.
    const delay = reduceMotion ? 0 : BEAT_MS;
    const go = window.setTimeout(() => router.replace(dest.href), delay);
    const escape = window.setTimeout(() => setEscaped(true), ESCAPE_MS);
    return () => {
      window.clearTimeout(go);
      window.clearTimeout(escape);
    };
  }, [router, dest.href, reduceMotion]);

  // Reduced motion collapses durations rather than swapping `initial`, so the
  // server and client render the same markup either way.
  const d = (seconds: number) => (reduceMotion ? 0 : seconds);

  const pct = dest.steps
    ? Math.round((dest.steps.done / dest.steps.total) * 100)
    : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#fffbf2] px-6 text-[#0A261E]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #0A261E 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative flex flex-col items-center">
        <div
          className="relative grid place-items-center"
          style={{ height: RING_PX, width: RING_PX }}
        >
          {/* The ring is the wait: one sweep around the mark, then the route
              changes. It hugs the seal so the two read as one object. */}
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full -rotate-90"
            fill="none"
          >
            <circle
              cx="50"
              cy="50"
              r={RING_R}
              stroke="rgba(10,38,30,0.07)"
              strokeWidth={RING_STROKE}
            />
            <motion.circle
              cx="50"
              cy="50"
              r={RING_R}
              stroke="#B8922A"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: d(BEAT_MS / 1000), ease: EASE_OUT_QUART }}
            />
          </svg>

          <motion.img
            src="/sahla-logo.png"
            alt=""
            aria-hidden
            className="relative w-auto max-w-none"
            style={{ height: MARK_HEIGHT_PX }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: d(0.5), ease: EASE_OUT_EXPO }}
          />
        </div>

        <motion.div
          className="mt-8 max-w-[34ch] text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: d(0.45), delay: d(0.1), ease: EASE_OUT_EXPO }}
        >
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#B8922A]">
            {EYEBROW[dest.kind]}
          </p>
          <h1
            className="mt-2.5 text-[26px] leading-[1.15] text-[#0A261E]"
            style={{ fontFamily: "var(--font-hero)" }}
            aria-live="polite"
          >
            {VERB[dest.kind]} {dest.title}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#0A261E]/55">
            {dest.detail}
          </p>
        </motion.div>

        {pct !== null && dest.steps ? (
          <motion.div
            className="mt-7 w-[240px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: d(0.4), delay: d(0.25) }}
          >
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#0A261E]/8">
              <motion.div
                className="h-full rounded-full bg-[#B8922A]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: d(0.7), delay: d(0.25), ease: EASE_OUT_EXPO }}
              />
            </div>
            <p className="mt-2.5 text-center text-[11.5px] tracking-wide text-[#0A261E]/40">
              {dest.steps.done} of {dest.steps.total} steps done
            </p>
          </motion.div>
        ) : null}

        {escaped ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-8"
          >
            <Link
              href={dest.href}
              className="rounded-full border border-[#0A261E]/15 px-5 py-2.5 text-[12.5px] font-semibold text-[#0A261E] transition-colors duration-200 hover:border-[#0A261E]/35 hover:bg-[#0A261E]/[0.04]"
            >
              Continue
            </Link>
          </motion.div>
        ) : null}
      </div>
    </main>
  );
}
