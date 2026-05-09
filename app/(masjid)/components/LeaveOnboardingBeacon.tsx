"use client";

import { useEffect } from "react";

/**
 * Sends a fire-and-forget beacon to /api/onboarding/leave-notify when the
 * masjid admin closes the tab, refreshes, or navigates away from the site.
 *
 * Pairs with the explicit click handler on the OnboardingSidebar's "Back to
 * Sahla" link — together they cover both intentional exits and tab closes.
 *
 * The endpoint is idempotent (atomic claim on resume_email_sent_at), so duplicate
 * fires from both paths are harmless.
 */
export default function LeaveOnboardingBeacon() {
  useEffect(() => {
    const ping = () => {
      if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
      try {
        navigator.sendBeacon("/api/onboarding/leave-notify");
      } catch {
        // Best-effort.
      }
    };

    // pagehide fires more reliably than beforeunload on mobile + when the
    // browser puts the page in bfcache.
    window.addEventListener("pagehide", ping);
    return () => {
      window.removeEventListener("pagehide", ping);
    };
  }, []);

  return null;
}
