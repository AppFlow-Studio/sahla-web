"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw, MessageSquareText, AlertTriangle } from "lucide-react";

/**
 * Shown when `getCurrentMosque` hits a DB error (e.g. schema drift) rather than
 * a genuine "no mosque" state. Offers a retry instead of silently bouncing an
 * onboarded mosque into onboarding.
 */
export default function CrmLoadError() {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  function retry() {
    setRetrying(true);
    // Re-run the server layout; clears the transient failure if it's resolved.
    router.refresh();
    // router.refresh() doesn't settle a promise we can await, so drop the
    // spinner shortly after to avoid it spinning forever on a repeat failure.
    setTimeout(() => setRetrying(false), 2500);
  }

  return (
    <div className="min-h-screen bg-[#fffbf2] text-[#0A261E]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #0A261E 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 py-16">
        <div className="w-full overflow-hidden rounded-3xl border border-[#0A261E]/8 bg-white shadow-[0_18px_40px_-20px_rgba(10,38,30,0.18)]">
          <div className="px-8 py-10 text-center md:px-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B8922A]/12 text-[#B8922A]">
              <AlertTriangle size={22} strokeWidth={2.2} />
            </div>
            <p className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
              Couldn’t load your CRM
            </p>
            <h1 className="mt-2 font-display text-2xl leading-tight text-[#0A261E] md:text-[28px]">
              We hit a snag reaching your mosque
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-[#0A261E]/70">
              This is a temporary problem on our side — your mosque and its
              setup are safe. Try again in a moment.
            </p>

            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0A261E] px-5 py-3 text-[13px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={retrying ? "animate-spin" : undefined}
              />
              {retrying ? "Retrying…" : "Try again"}
            </button>

            <div className="mt-6 border-t border-[#0A261E]/8 pt-5 text-[12px] text-[#0A261E]/55">
              <a
                href="mailto:support@sahla.co"
                className="inline-flex items-center gap-1.5 hover:text-[#0A261E]"
              >
                <MessageSquareText size={12} />
                Still stuck? support@sahla.co
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
