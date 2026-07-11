"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { usePreview } from "../../components/OnboardingPreviewContext";

type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Render raw digits as a comma-grouped string ("50000" → "50,000"). */
function formatWithCommas(digits: string) {
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

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
  const { updatePreview } = usePreview();

  const [projectName, setProjectName] = useState(initialConfig?.projectName ?? "");
  // Stored as raw digits ("50000"); commas are applied only for display.
  const [goalAmount, setGoalAmount] = useState(
    String(initialConfig?.goalAmount ?? "").replace(/[^0-9]/g, "")
  );

  // Keep the live phone preview's donate banner in sync with this form.
  useEffect(() => {
    updatePreview({
      donationProject: projectName.trim(),
      donationGoal: goalAmount ? Number(goalAmount) : 0,
    });
  }, [projectName, goalAmount, updatePreview]);
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

  const canComplete = projectName.trim().length > 0;

  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastSavedRef = useRef<string>(
    JSON.stringify({
      projectName: initialConfig?.projectName ?? "",
      goalAmount: String(initialConfig?.goalAmount ?? "").replace(/[^0-9]/g, ""),
      suggestedAmounts: initialConfig?.suggestedAmounts ?? DEFAULT_AMOUNTS,
      suggestedEnabled: initialConfig?.suggestedEnabled ?? true,
      recurringEnabled: initialConfig?.recurringEnabled ?? true,
    })
  );
  const debounceRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  // Auto-save on any change, debounced. When there's a project name, hit
  // the donations endpoint (which persists the config + marks complete).
  // When the admin clears the project name, un-check the task via the
  // mosque PATCH endpoint — the donations endpoint requires a non-empty
  // name so it can't handle the un-mark itself. `keepalive: true` keeps
  // the save alive across a Next-button navigation.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const snapshot = JSON.stringify({
      projectName,
      goalAmount,
      suggestedAmounts,
      suggestedEnabled,
      recurringEnabled,
    });
    if (snapshot === lastSavedRef.current) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setStatus("saving");
      try {
        if (canComplete) {
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
            body: JSON.stringify({ config, markComplete: "donations" }),
            keepalive: true,
          });
          if (!res.ok) throw new Error("Failed to save");
        } else {
          // Project name is empty — un-check the task in the sidebar.
          const res = await fetch(`/api/mosques/${mosqueId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ unmarkComplete: "donations" }),
            keepalive: true,
          });
          if (!res.ok) throw new Error("Failed to save");
        }
        lastSavedRef.current = snapshot;
        router.refresh();
        setStatus("saved");
      } catch {
        setStatus("error");
        showToast("Couldn't save donations config", "error");
      }
    }, 700);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [
    projectName,
    goalAmount,
    suggestedAmounts,
    suggestedEnabled,
    recurringEnabled,
    canComplete,
    mosqueId,
    router,
    showToast,
  ]);

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
            value={formatWithCommas(goalAmount)}
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
