"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "../../components/ToastProvider";

type AdsConfig = {
  enabled: boolean;
  onboardingFee: string;
  monthlyRate: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function BusinessAdsPanel({
  mosqueId,
  initialConfig,
}: {
  mosqueId: string;
  initialConfig: AdsConfig | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [enabled, setEnabled] = useState(initialConfig?.enabled ?? false);
  const [onboardingFee, setOnboardingFee] = useState(initialConfig?.onboardingFee ?? "200");
  const [monthlyRate, setMonthlyRate] = useState(initialConfig?.monthlyRate ?? "50");

  const fee = parseInt(onboardingFee) || 0;
  const monthly = parseInt(monthlyRate) || 0;
  const projectedAnnual5 = (fee * 5) + (monthly * 5 * 12);

  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastSavedRef = useRef<string>(
    JSON.stringify({
      enabled: initialConfig?.enabled ?? false,
      onboardingFee: initialConfig?.onboardingFee ?? "200",
      monthlyRate: initialConfig?.monthlyRate ?? "50",
    })
  );
  const debounceRef = useRef<number | null>(null);
  // If the config has been saved before we assume the task is already
  // marked complete; only fire markComplete once per fresh session.
  const alreadyMarkedRef = useRef(!!initialConfig);
  const hasSavedOnceRef = useRef(false);

  // Auto-save on any change, debounced. On the very first change from
  // defaults we also fire `markComplete` so the sidebar checks off Business
  // Ads without the admin pressing anything. `keepalive: true` keeps the
  // save alive across a Next-button navigation.
  useEffect(() => {
    const snapshot = JSON.stringify({ enabled, onboardingFee, monthlyRate });
    if (snapshot === lastSavedRef.current) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setStatus("saving");
      try {
        const shouldMarkComplete = !alreadyMarkedRef.current;
        const config: AdsConfig = {
          enabled,
          onboardingFee: onboardingFee.trim(),
          monthlyRate: monthlyRate.trim(),
        };
        const res = await fetch(`/api/mosques/${mosqueId}/ads-config`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config,
            ...(shouldMarkComplete ? { markComplete: "ads_config" } : {}),
          }),
          keepalive: true,
        });
        if (!res.ok) throw new Error("Failed to save");
        lastSavedRef.current = snapshot;
        hasSavedOnceRef.current = true;
        if (shouldMarkComplete) {
          alreadyMarkedRef.current = true;
          router.refresh();
        }
        setStatus("saved");
      } catch {
        setStatus("error");
        showToast("Couldn't save ad config", "error");
      }
    }, 700);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [enabled, onboardingFee, monthlyRate, mosqueId, router, showToast]);

  // If the admin lands here and never touches anything, still mark the task
  // complete on unmount / next-navigation. Defaults are a valid answer.
  useEffect(() => {
    if (alreadyMarkedRef.current) return;
    return () => {
      if (alreadyMarkedRef.current || hasSavedOnceRef.current) return;
      const config: AdsConfig = {
        enabled,
        onboardingFee: onboardingFee.trim(),
        monthlyRate: monthlyRate.trim(),
      };
      void fetch(`/api/mosques/${mosqueId}/ads-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, markComplete: "ads_config" }),
        keepalive: true,
      });
    };
  }, [enabled, onboardingFee, monthlyRate, mosqueId]);

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-stone-800">Enable Business Ads</p>
            <p className="mt-0.5 text-[12px] text-stone-400">
              Let local businesses advertise in your mosque app. A new revenue stream for your community.
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              enabled ? "bg-emerald-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                enabled ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            {/* Pricing */}
            <div className="rounded-xl border border-stone-200 bg-white p-6">
              <p className="mb-4 text-[13px] font-semibold text-stone-800">Pricing</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-600">
                    Onboarding Fee
                  </label>
                  <p className="mb-2 text-[11px] text-stone-400">
                    One-time fee per business
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-stone-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={onboardingFee}
                      onChange={(e) => setOnboardingFee(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="200"
                      className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-7 pr-3 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-600">
                    Monthly Rate
                  </label>
                  <p className="mb-2 text-[11px] text-stone-400">
                    Per business per month
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-stone-400">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="50"
                      className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-7 pr-3 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Projection */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
              <p className="mb-3 text-[13px] font-semibold text-emerald-900">Revenue Projection</p>
              <div className="space-y-3">
                {[3, 5, 10].map((count) => {
                  const annual = (fee * count) + (monthly * count * 12);
                  return (
                    <div key={count} className="flex items-center justify-between">
                      <span className="text-[12px] text-emerald-700">
                        {count} businesses
                      </span>
                      <span className="text-[13px] font-semibold tabular-nums text-emerald-900">
                        ${annual.toLocaleString()}/year
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-emerald-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-emerald-800">5 businesses =</span>
                  <span className="text-[15px] font-bold tabular-nums text-emerald-900">
                    ${projectedAnnual5.toLocaleString()}/year
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-save status */}
      <div className="flex items-center justify-end text-[11.5px] text-stone-500">
        {status === "saving" ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            Saving…
          </span>
        ) : status === "saved" ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <Check size={12} strokeWidth={2.5} />
            Saved
          </span>
        ) : status === "error" ? (
          <span className="text-red-600">Couldn&apos;t save — check your connection.</span>
        ) : (
          <span className="text-stone-400">Changes save automatically.</span>
        )}
      </div>
    </div>
  );
}
