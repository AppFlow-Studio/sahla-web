"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";

export type OnboardingAdsConfig = {
  enabled: boolean;
  onboardingFee: number;
  monthlyRate: number;
};

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function BusinessAdsConfigSummary({
  config,
}: {
  config: OnboardingAdsConfig;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(config.enabled);
  const [togglingEnabled, setTogglingEnabled] = useState(false);
  const [onboardingFee, setOnboardingFee] = useState(String(config.onboardingFee));
  const [monthlyRate, setMonthlyRate] = useState(String(config.monthlyRate));

  async function toggleEnabled() {
    const next = !enabled;
    setTogglingEnabled(true);
    setEnabled(next); // optimistic
    try {
      const res = await fetch("/api/crm/business-ads/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "Failed to update");
      }
      toast.success(next ? "Business ads enabled" : "Business ads disabled");
      router.refresh();
    } catch (err) {
      setEnabled(!next); // revert
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingEnabled(false);
    }
  }

  const feeNum = parseFloat(onboardingFee) || 0;
  const monthlyNum = parseFloat(monthlyRate) || 0;
  const annualPerFive = editing
    ? feeNum * 5 + monthlyNum * 5 * 12
    : config.onboardingFee * 5 + config.monthlyRate * 5 * 12;

  function cancelEdit() {
    setOnboardingFee(String(config.onboardingFee));
    setMonthlyRate(String(config.monthlyRate));
    setEditing(false);
  }

  async function save() {
    if (feeNum < 0 || monthlyNum < 0) {
      toast.error("Prices can't be negative");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/crm/business-ads/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingFee: feeNum, monthlyRate: monthlyNum }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "" }));
        throw new Error(error || "Failed to save");
      }
      toast.success("Ad pricing updated");
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save pricing");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 overflow-hidden rounded-3xl border border-[#0A261E]/8 bg-white"
    >
      <div className="flex items-center justify-between border-b border-[#0A261E]/6 px-6 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            What advertisers pay
          </p>
          <h3 className="mt-0.5 font-display text-[18px] text-[#0A261E]">
            Your Business Ads pricing
          </h3>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A261E]/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#0A261E]/70 transition-colors hover:bg-[#0A261E]/[0.03] disabled:opacity-50"
            >
              <X size={12} />
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A261E] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#0A261E]/90 disabled:opacity-50"
            >
              <Check size={12} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0A261E]/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#0A261E]/70 transition-colors hover:bg-[#0A261E]/[0.03]"
          >
            <Pencil size={12} />
            Edit prices
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px bg-[#0A261E]/6 md:grid-cols-4">
        <div className="bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            Status
          </p>
          <button
            onClick={toggleEnabled}
            disabled={togglingEnabled}
            className="mt-2 inline-flex items-center gap-2 disabled:opacity-60"
          >
            <span
              className={`relative h-5 w-9 rounded-full transition-colors ${
                enabled ? "bg-emerald-500" : "bg-[#0A261E]/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  enabled ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
            <span
              className={`text-[15px] font-semibold ${
                enabled ? "text-emerald-700" : "text-[#0A261E]/55"
              }`}
            >
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </button>
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            Tap to {enabled ? "turn off" : "turn on"} ads
          </p>
        </div>

        <div className="bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            Onboarding fee
          </p>
          {editing ? (
            <div className="mt-2 flex items-center gap-1">
              <span className="font-display text-[20px] text-[#0A261E]/40">$</span>
              <input
                type="number"
                min={0}
                value={onboardingFee}
                onChange={(e) => setOnboardingFee(e.target.value)}
                className="w-24 rounded-lg border border-[#0A261E]/15 px-2 py-1 font-display text-[20px] text-[#0A261E] focus:border-[#0A261E]/40 focus:outline-none"
              />
            </div>
          ) : (
            <p className="mt-2 font-display text-[24px] leading-none text-[#0A261E]">
              {dollars.format(config.onboardingFee)}
            </p>
          )}
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            One-time per business
          </p>
        </div>

        <div className="bg-white px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/50">
            Monthly rate
          </p>
          {editing ? (
            <div className="mt-2 flex items-center gap-1">
              <span className="font-display text-[20px] text-[#0A261E]/40">$</span>
              <input
                type="number"
                min={0}
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                className="w-24 rounded-lg border border-[#0A261E]/15 px-2 py-1 font-display text-[20px] text-[#0A261E] focus:border-[#0A261E]/40 focus:outline-none"
              />
            </div>
          ) : (
            <p className="mt-2 font-display text-[24px] leading-none text-[#0A261E]">
              {dollars.format(config.monthlyRate)}
            </p>
          )}
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            Per business per month
          </p>
        </div>

        <div className="bg-[#fffbf2] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B8922A]">
            5-business projection
          </p>
          <p className="mt-2 font-display text-[24px] leading-none text-[#0A261E]">
            {dollars.format(annualPerFive)}
          </p>
          <p className="mt-1 text-[11px] text-[#0A261E]/45">
            Annual revenue estimate
          </p>
        </div>
      </div>
    </motion.section>
  );
}
