"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

import { EASE_OUT_EXPO } from "@/lib/motion";

const GOLD = "#B8922A";
/** Gold deepened until small text on white clears WCAG AA. */
const GOLD_TEXT = "#8A6B1E";

const PROMISES = [
  "Prayer times that keep themselves current",
  "Donations that land in the masjid's own account",
  "Your app, under your name, in the App Store",
];

const rise = (delay: number, still: boolean) => ({
  initial: { opacity: 0, y: 14 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: {
    duration: still ? 0 : 0.7,
    delay: still ? 0 : delay,
    ease: EASE_OUT_EXPO,
  },
});

/**
 * Sign-in. Cream on the right, where the marketing site left off; dark green
 * on the left, which is the chrome of the app being unlocked. The seam between
 * the two is the point of the screen.
 *
 * Everything lands on `/launch`, which names the destination before going
 * there — HQ, an unfinished checklist, and a shipped mosque are three
 * different places, and a sign-in button that behaves identically for all
 * three is what made the old screen feel like a dead end.
 */
export default function LoginClient() {
  const reduceMotion = useReducedMotion();

  // Pointer parallax on the ornament. A few pixels, spring-damped, so the
  // panel feels lit from wherever the cursor is rather than printed on.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const dx = useSpring(px, { stiffness: 60, damping: 20, mass: 0.6 });
  const dy = useSpring(py, { stiffness: 60, damping: 20, mass: 0.6 });

  function trackPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width - 0.5) * 26);
    py.set(((e.clientY - r.top) / r.height - 0.5) * 26);
  }

  return (
    <main className="min-h-screen bg-[#fffbf2] lg:grid lg:grid-cols-[46fr_54fr]">
      {/* Left — the app you're unlocking */}
      <aside
        onPointerMove={trackPointer}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
        className="relative hidden overflow-hidden bg-[#0A261E] px-14 py-16 text-[#fffbf2] after:absolute after:inset-y-0 after:content-[''] after:right-0 after:w-px after:bg-[linear-gradient(180deg,transparent,rgba(184,146,42,0.5)_35%,rgba(184,146,42,0.5)_65%,transparent)] lg:flex lg:flex-col lg:justify-center xl:px-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 18% 12%, rgba(26,107,66,0.45) 0%, transparent 58%), radial-gradient(circle at 85% 88%, rgba(184,146,42,0.14) 0%, transparent 46%)",
          }}
        />
        {/* The seal is the panel's whole ornament: one mark at watermark
            weight, half off the edge, drifting a few pixels with the cursor. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-40 bottom-[-20%]"
          style={{ x: dx, y: dy }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 0.12, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 1.4,
            ease: EASE_OUT_EXPO,
          }}
        >
          <img
            src="/sahla-logo.png"
            alt=""
            className="w-[600px] max-w-none"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </motion.div>

        <div className="relative">
          <motion.h2
            className="max-w-[16ch] text-[clamp(30px,2.9vw,44px)] leading-[1.12] tracking-[-0.01em]"
            style={{ fontFamily: "var(--font-hero)" }}
            {...rise(0.14, !!reduceMotion)}
          >
            Everything your masjid runs on, behind one door.
          </motion.h2>

          <ul className="mt-9 space-y-0">
            {PROMISES.map((line, i) => (
              <motion.li
                key={line}
                className="flex items-center gap-3.5 border-t border-[#fffbf2]/10 py-3.5 text-[13.5px] leading-relaxed text-[#fffbf2]/65 last:border-b"
                {...rise(0.26 + i * 0.08, !!reduceMotion)}
              >
                <span
                  aria-hidden
                  className="h-[5px] w-[5px] flex-none rotate-45"
                  style={{ background: GOLD }}
                />
                {line}
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          className="absolute bottom-16 left-14 flex items-center gap-4 text-[11.5px] text-[#fffbf2]/35 xl:left-20"
          {...rise(0.5, !!reduceMotion)}
        >
          <Link
            href="/"
            className="transition-colors duration-200 hover:text-[#fffbf2]/70"
          >
            sahla.co
          </Link>
          <span aria-hidden>&middot;</span>
          <span>&copy; {new Date().getFullYear()} Sahla</span>
        </motion.div>
      </aside>

      {/* Right — the door itself */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 py-14 sm:px-10">
        <motion.div
          className="flex w-full max-w-[400px] flex-col items-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE_OUT_EXPO }}
        >
          {/* Mobile keeps the mark and the divider; the green panel is gone. */}
          <Link
            href="/"
            className="mb-5 transition-opacity duration-300 hover:opacity-70 lg:hidden"
          >
            <img src="/sahla-logo.png" alt="Sahla" className="h-11 w-auto" />
          </Link>

          <div aria-hidden className="mb-9 flex items-center gap-3.5 lg:mb-7">
            <span
              className="h-px w-11"
              style={{ background: `linear-gradient(90deg, transparent, ${GOLD}66)` }}
            />
            <span className="h-[5px] w-[5px] rotate-45" style={{ background: GOLD }} />
            <span
              className="h-px w-11"
              style={{ background: `linear-gradient(90deg, ${GOLD}66, transparent)` }}
            />
          </div>

          <div className="sahla-auth group w-full rounded-[26px] border border-[#0A261E]/[0.07] bg-white px-5 py-8 shadow-[0_1px_2px_rgba(10,38,30,0.04),0_22px_50px_-28px_rgba(10,38,30,0.22)] transition-shadow duration-300 focus-within:shadow-[0_1px_2px_rgba(10,38,30,0.05),0_28px_60px_-26px_rgba(10,38,30,0.3)] sm:px-8">
            <SignIn
              routing="path"
              path="/login"
              // Every session lands on the hand-off screen, which works out
              // where this particular admin belongs. `force` so it also wins
              // over NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL.
              forceRedirectUrl="/launch"
              fallbackRedirectUrl="/launch"
              appearance={APPEARANCE}
            />
          </div>

          <p className="mt-8 text-center text-[13px] text-[#0A261E]/50">
            Not set up yet?{" "}
            <Link
              href="/contact"
              className="font-semibold underline decoration-[1.5px] underline-offset-[3px] transition-colors duration-200 hover:text-[#0A261E]"
              style={{ color: GOLD_TEXT }}
            >
              Book a demo
            </Link>
          </p>

          <p className="mt-3 flex items-center gap-3 text-[11.5px] text-[#0A261E]/30">
            <Link href="/privacy" className="transition-colors hover:text-[#0A261E]/60">
              Privacy
            </Link>
            <span aria-hidden>&middot;</span>
            <Link href="/terms" className="transition-colors hover:text-[#0A261E]/60">
              Terms
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}

/**
 * Clerk styled as part of the page rather than a widget dropped onto it: its
 * own card chrome is stripped, and the white panel above is the only
 * container. Clerk's headers stay, because the later steps of the flow (email
 * code, password reset) rely on them to say where you are.
 *
 * Structure only. Every colour on this surface lives in the `.sahla-auth`
 * block in globals.css, which has to win against the global "everything inside
 * a Clerk surface is cream" fallback there. A colour set here would lose to
 * that stylesheet rule, so setting one would just be misleading.
 */
const APPEARANCE = {
  elements: {
    rootBox: { width: "100%" },
    cardBox: {
      width: "100%",
      border: "none",
      boxShadow: "none",
      background: "transparent",
    },
    card: {
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: 0,
      gap: "22px",
    },
    // The page renders the mark itself, above the card.
    logoBox: { display: "none" },
    header: { gap: "6px" },
    headerTitle: { fontSize: "27px" },
    socialButtons: { gap: "10px" },
    socialButtonsBlockButton: {
      height: "44px",
      borderRadius: "999px",
      borderWidth: "1px",
      transition:
        "transform 200ms cubic-bezier(0.25,1,0.5,1), border-color 200ms, box-shadow 200ms",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 10px 22px -14px rgba(10,38,30,0.45)",
      },
      "&:active": { transform: "translateY(0)" },
    },
    socialButtonsBlockButtonText: { fontWeight: 500 },
    dividerText: {
      fontSize: "10.5px",
      letterSpacing: "0.16em",
      textTransform: "uppercase",
    },
    formFieldLabel: { fontSize: "12.5px", fontWeight: 600 },
    formFieldInput: { height: "44px", borderRadius: "12px" },
    formButtonPrimary: {
      height: "46px",
      borderRadius: "999px",
      fontSize: "13.5px",
      fontWeight: 600,
      letterSpacing: "0.02em",
      textTransform: "none",
      boxShadow: "0 18px 34px -18px rgba(10,38,30,0.55)",
      transition:
        "transform 200ms cubic-bezier(0.25,1,0.5,1), box-shadow 200ms",
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 22px 42px -18px rgba(10,38,30,0.65)",
      },
      "&:active": { transform: "translateY(0)" },
    },
    identityPreview: { borderRadius: "12px", borderWidth: "1px" },
    footer: { background: "transparent", borderTop: "none" },
    // Sign-up is invitation-only, so Clerk's "create account" prompt would
    // dead-end. The page offers "Book a demo" instead.
    footerAction: { display: "none" },
  },
};
