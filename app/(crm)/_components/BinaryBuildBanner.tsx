"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, X, ArrowUpRight } from "lucide-react";
import { useMosque } from "../_lib/mock-mosque";

/**
 * Top-of-shell banner shown to mosque admins whose `onboarding_status === "ready"`.
 * Hidden once the Sahla team flips to "live", and when an HQ admin is previewing.
 *
 * Per-session dismissible (sessionStorage). We don't persist dismissal — a fresh
 * tab should re-show the banner since the state is genuinely transient.
 */
const DISMISS_KEY = "sahla.crm.binary_build_banner.dismissed";

export default function BinaryBuildBanner() {
  const mosque = useMosque();
  // Start `false` on both server and client so the first client render matches
  // the SSR output (reading sessionStorage during render causes a hydration
  // mismatch). The real dismissal state is applied in the effect below.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
  }, []);

  const shouldShow =
    !mosque.isHQ && mosque.onboardingStatus === "ready" && !dismissed;

  function dismiss() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    }
    setDismissed(true);
  }

  return (
    <AnimatePresence initial={false}>
      {shouldShow ? (
        <motion.div
          key="binary-build-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 overflow-hidden bg-[#0A261E] text-[#fffbf2]"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 md:px-6">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#B8922A]/15 text-[#B8922A]">
              <Hammer size={13} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1 text-[12.5px] leading-tight">
              <p className="font-semibold text-[#E8D5B0]">
                Your app is being built by the Sahla team.
              </p>
              <p className="mt-0.5 text-[#fffbf2]/65">
                Usually ready in 5–7 days. Edits you make now go live the moment your app launches.
              </p>
            </div>
            <Link
              href="/settings/sahla-support"
              className="hidden items-center gap-1 rounded-md px-2.5 py-1 text-[11.5px] font-medium text-[#fffbf2]/75 transition-colors hover:bg-white/[0.06] hover:text-[#fffbf2] md:inline-flex"
            >
              Track progress
              <ArrowUpRight size={11} />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[#fffbf2]/55 transition-colors hover:bg-white/[0.06] hover:text-[#fffbf2]"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
