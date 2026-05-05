"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ToastProvider";

type TaskStatus = {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
};

type GoLiveData = {
  mosqueId: string;
  mosqueName: string | null;
  tasks: TaskStatus[];
};

const TIERS = [
  { id: "core", label: "Sahla Core", price: "$300/mo" },
  { id: "complete", label: "Sahla Complete", price: "$350/mo" },
] as const;

export default function GoLivePanel({ data }: { data: GoLiveData }) {
  const { showToast } = useToast();
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [selectedTier, setSelectedTier] = useState("complete");
  const [openingPortal, setOpeningPortal] = useState(false);

  const requiredTasks = data.tasks.filter((t) => t.required);
  const optionalTasks = data.tasks.filter((t) => !t.required);
  const requiredComplete = requiredTasks.filter((t) => t.completed).length;
  const optionalComplete = optionalTasks.filter((t) => t.completed).length;
  const totalComplete = data.tasks.filter((t) => t.completed).length;
  const allRequiredDone = requiredComplete === requiredTasks.length;

  const progressPercent = data.tasks.length > 0
    ? Math.round((totalComplete / data.tasks.length) * 100)
    : 0;

  // SVG progress ring
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  async function handleGoLive() {
    if (!allRequiredDone) {
      showToast("Complete all required tasks first", "error");
      return;
    }

    setLaunching(true);
    try {
      const res = await fetch(`/api/mosques/${data.mosqueId}/go-live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to launch");
      }

      const result = await res.json();

      // If we get a Stripe checkout URL, redirect
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }

      // Otherwise, show celebration
      setLaunched(true);
      showToast("Your mosque is live!", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to go live", "error");
    } finally {
      setLaunching(false);
    }
  }

  async function handleManageSubscription() {
    setOpeningPortal(true);
    try {
      const res = await fetch(`/api/mosques/${data.mosqueId}/stripe/billing-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to open billing portal");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to open portal", "error");
    } finally {
      setOpeningPortal(false);
    }
  }

  // Celebration screen
  if (launched) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 text-center"
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-200">
            <svg className="h-8 w-8 text-emerald-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-emerald-900">
            {data.mosqueName || "Your Mosque"} is Live!
          </h2>
          <p className="mt-2 text-[14px] text-emerald-700">
            Your app is being submitted to the App Store and Google Play.
            Admin invitations have been sent. Welcome to Sahla.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <p className="mb-3 text-[13px] font-semibold text-stone-800">What Happens Next</p>
          <div className="space-y-3 text-left">
            {[
              { step: "1", text: "Our team receives your submission and prepares the App Store build" },
              { step: "2", text: "Admin team members will receive email invitations to join the dashboard" },
              { step: "3", text: "Your app typically goes live within 3-5 business days" },
              { step: "4", text: "You'll receive a notification when your app is approved" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
                  {item.step}
                </div>
                <p className="text-[12px] text-stone-600 pt-0.5">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleManageSubscription}
          disabled={openingPortal}
          className="w-full rounded-xl border border-stone-200 bg-white py-3 text-[13px] font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:opacity-60"
        >
          {openingPortal ? "Opening portal..." : "Manage Subscription"}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Ring */}
      <div className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-8">
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#f5f5f4"
              strokeWidth="8"
            />
            <motion.circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={allRequiredDone ? "#10b981" : "#0d7c5f"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-bold tabular-nums text-stone-900">
              {progressPercent}%
            </span>
            <span className="text-[11px] text-stone-400">complete</span>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-stone-500">
          {totalComplete} of {data.tasks.length} tasks completed
        </p>
      </div>

      {/* Required Tasks */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-stone-800">Required</p>
          <span className="text-[11px] tabular-nums text-stone-400">
            {requiredComplete}/{requiredTasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {requiredTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 py-1.5">
              {task.completed ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-stone-200" />
              )}
              <span className={`text-[12px] ${task.completed ? "text-stone-400 line-through" : "text-stone-700"}`}>
                {task.label}
              </span>
              {!task.completed && (
                <span className="ml-auto text-[9px] font-bold rounded px-1.5 py-0.5 bg-amber-100 text-amber-700">
                  REQ
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Optional Tasks */}
      {optionalTasks.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-stone-800">Recommended</p>
            <span className="text-[11px] tabular-nums text-stone-400">
              {optionalComplete}/{optionalTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {optionalTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 py-1.5">
                {task.completed ? (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-5 w-5 shrink-0 rounded-full border-2 border-stone-200" />
                )}
                <span className={`text-[12px] ${task.completed ? "text-stone-400 line-through" : "text-stone-700"}`}>
                  {task.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier Selection */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <p className="mb-4 text-[13px] font-semibold text-stone-800">Select Your Plan</p>
        <div className="space-y-2">
          {TIERS.map((tier) => (
            <label
              key={tier.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                selectedTier === tier.id
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <input
                type="radio"
                name="tier"
                value={tier.id}
                checked={selectedTier === tier.id}
                onChange={() => setSelectedTier(tier.id)}
                className="sr-only"
              />
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  selectedTier === tier.id ? "border-emerald-600" : "border-stone-300"
                }`}
              >
                {selectedTier === tier.id && (
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                )}
              </div>
              <span className="flex-1 text-[13px] font-medium text-stone-800">{tier.label}</span>
              <span className="text-[13px] font-semibold text-stone-600">{tier.price}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Go Live Button */}
      <AnimatePresence>
        {!allRequiredDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
          >
            <p className="text-[12px] text-amber-800">
              Complete all required tasks to unlock the Go Live button. You have{" "}
              <span className="font-semibold">{requiredTasks.length - requiredComplete}</span> remaining.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleGoLive}
        disabled={!allRequiredDone || launching}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[15px] font-bold transition-all ${
          allRequiredDone
            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200"
            : "bg-stone-100 text-stone-400 cursor-not-allowed"
        } disabled:opacity-60`}
      >
        {launching ? (
          "Preparing checkout..."
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
            Go Live — {TIERS.find((t) => t.id === selectedTier)?.price ?? "$350/mo"}
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-stone-400">
        Clicking Go Live opens Stripe Checkout for the Sahla subscription.
        Upon payment, admin invites are sent and your app is submitted for review.
      </p>
    </div>
  );
}
