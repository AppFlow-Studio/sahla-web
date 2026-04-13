"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ToastProvider";

type DonationConfig = {
  projectName: string;
  goalAmount: string;
  suggestedAmounts: number[];
  suggestedEnabled: boolean;
  recurringEnabled: boolean;
};

const DEFAULT_AMOUNTS = [25, 50, 100, 250];

export default function DonationsPanel({
  mosqueId,
  initialConfig,
  stripeConnected,
}: {
  mosqueId: string;
  initialConfig: DonationConfig | null;
  stripeConnected: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [projectName, setProjectName] = useState(initialConfig?.projectName ?? "");
  const [goalAmount, setGoalAmount] = useState(initialConfig?.goalAmount ?? "");
  const [suggestedAmounts, setSuggestedAmounts] = useState<number[]>(
    initialConfig?.suggestedAmounts ?? DEFAULT_AMOUNTS
  );
  const [suggestedEnabled, setSuggestedEnabled] = useState(
    initialConfig?.suggestedEnabled ?? true
  );
  const [recurringEnabled, setRecurringEnabled] = useState(
    initialConfig?.recurringEnabled ?? true
  );
  const [editingAmount, setEditingAmount] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEditAmount(index: number) {
    setEditingAmount(index);
    setEditValue(suggestedAmounts[index].toString());
  }

  function saveEditAmount() {
    if (editingAmount === null) return;
    const val = parseInt(editValue);
    if (!val || val <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    setSuggestedAmounts((prev) => {
      const next = [...prev];
      next[editingAmount] = val;
      return next.sort((a, b) => a - b);
    });
    setEditingAmount(null);
    setEditValue("");
  }

  async function handleSave(markComplete = false) {
    if (!projectName.trim()) {
      showToast("Project name is required", "error");
      return;
    }

    setSaving(true);
    try {
      const config: DonationConfig = {
        projectName: projectName.trim(),
        goalAmount: goalAmount.trim(),
        suggestedAmounts,
        suggestedEnabled,
        recurringEnabled,
      };

      const res = await fetch(`/api/mosques/${mosqueId}/donations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          ...(markComplete ? { markComplete: "donations" } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast(markComplete ? "Donations setup completed" : "Donations saved", "success");
      router.refresh();
    } catch {
      showToast("Failed to save donations config", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stripe Warning */}
      {!stripeConnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200">
              <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-amber-900">Connect Stripe First</p>
              <p className="text-[11px] text-amber-700">
                You need a connected Stripe account before donations can go live. You can still configure everything here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Project Name */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="mb-1 block text-[13px] font-semibold text-stone-800">
          Donation Project Name
        </label>
        <p className="mb-3 text-[12px] text-stone-400">
          This appears as the campaign title in the app (e.g., &quot;Ramadan Fund&quot;, &quot;Masjid Expansion&quot;).
        </p>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="e.g., General Fund"
          className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Goal Amount */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <label className="mb-1 block text-[13px] font-semibold text-stone-800">
          Goal Amount
          <span className="ml-1.5 text-[11px] font-normal text-stone-400">(optional)</span>
        </label>
        <p className="mb-3 text-[12px] text-stone-400">
          Set a fundraising goal to show a progress bar in the app. Leave blank for open-ended donations.
        </p>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-stone-400">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={goalAmount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setGoalAmount(v);
            }}
            placeholder="50,000"
            className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-7 pr-3 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Suggested Amounts */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[13px] font-semibold text-stone-800">Suggested Amounts</label>
          <button
            onClick={() => setSuggestedEnabled(!suggestedEnabled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              suggestedEnabled ? "bg-emerald-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                suggestedEnabled ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        <p className="mb-4 text-[12px] text-stone-400">
          Quick-select amounts shown to donors. Tap any amount to customize it.
        </p>
        <AnimatePresence>
          {suggestedEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-2">
                {suggestedAmounts.map((amount, i) => (
                  <div key={i}>
                    {editingAmount === i ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] text-stone-400">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ""))}
                          onBlur={saveEditAmount}
                          onKeyDown={(e) => e.key === "Enter" && saveEditAmount()}
                          autoFocus
                          className="w-full rounded-lg border border-emerald-400 bg-white px-2 py-2 text-center text-[13px] font-medium text-stone-900 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditAmount(i)}
                        className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2 text-center text-[13px] font-medium text-stone-700 hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                      >
                        ${amount}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recurring Donations */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-[13px] font-semibold text-stone-800">Recurring Donations</label>
            <p className="mt-0.5 text-[12px] text-stone-400">
              Allow donors to set up monthly recurring contributions.
            </p>
          </div>
          <button
            onClick={() => setRecurringEnabled(!recurringEnabled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              recurringEnabled ? "bg-emerald-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                recurringEnabled ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="rounded-lg border border-stone-300 px-5 py-2.5 text-[13px] font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || !projectName.trim()}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}
