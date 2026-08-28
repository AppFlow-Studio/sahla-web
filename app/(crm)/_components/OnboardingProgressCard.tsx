"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ALL_TASKS } from "@/app/(masjid)/components/onboarding-tasks";
import { useMosque } from "../_lib/mock-mosque";

/**
 * Where each onboarding task is managed once the mosque is inside the CRM.
 * The onboarding wizard itself is closed to shipped mosques (the (masjid)
 * layout redirects them here), so "Next" has to point at the CRM equivalent.
 * Tasks with no CRM home are listed without a link.
 */
const TASK_DESTINATIONS: Record<string, string> = {
  mosque_profile: "/settings/profile",
  app_branding: "/setup/theme",
  prayer_times: "/setup/prayer-times",
  jummah_setup: "/content/jummah",
  speakers: "/people/speakers",
  categories: "/setup/program-cards",
  programs: "/content/programs",
  events: "/content/events",
  reels: "/content/reels",
  stripe_connect: "/settings/subscription",
  donations: "/money/donations",
  ads_config: "/money/business-ads",
  invite_admins: "/settings/team",
  launch_materials: "/settings/sahla-support",
};

function formatStarted(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OnboardingProgressCard() {
  const mosque = useMosque();
  const progress = mosque.onboardingProgress ?? {};

  // The HQ preview has no real mosque behind it, so its empty progress map
  // would render a misleading 0%.
  if (mosque.isHQ) return null;

  const total = ALL_TASKS.length;
  const completed = ALL_TASKS.filter((t) => progress[t.id] === true).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = ALL_TASKS.filter((t) => progress[t.id] !== true);
  // `go_live` is handled by the launch flow, not from inside the CRM.
  const nextTask = remaining.find((t) => t.id !== "go_live") ?? null;
  const isComplete = completed === total;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6 rounded-2xl border border-[#0A261E]/8 bg-white p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-[#0A261E]">Setup progress</p>
          {isComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 size={11} />
              Complete
            </span>
          )}
        </div>
        <span className="text-[20px] font-semibold tabular-nums text-teal-600">
          {pct}%
        </span>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#0A261E]/6">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex gap-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A261E]/40">
            Started
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-[#0A261E]">
            {formatStarted(mosque.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A261E]/40">
            Tasks
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-[#0A261E]">
            {completed}/{total}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A261E]/40">
            Remaining
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-[#0A261E]">
            {remaining.length}
          </p>
        </div>
      </div>

      {isComplete ? (
        <div className="mt-5 border-t border-[#0A261E]/8 pt-4">
          <p className="text-[12.5px] text-[#0A261E]/55">
            Every setup task is done — everything below is live in your app.
          </p>
        </div>
      ) : (
        nextTask && (
          <div className="mt-5 border-t border-[#0A261E]/8 pt-4">
            {TASK_DESTINATIONS[nextTask.id] ? (
              <Link
                href={TASK_DESTINATIONS[nextTask.id]}
                className="group inline-flex items-center gap-2 text-[13px]"
              >
                <span className="font-medium text-[#0A261E]/45">Next:</span>
                <span className="font-medium text-[#0A261E] group-hover:underline">
                  {nextTask.label}
                </span>
                <ArrowRight
                  size={13}
                  className="text-[#0A261E]/30 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium text-[#0A261E]/45">Next:</span>
                <span className="font-medium text-[#0A261E]">{nextTask.label}</span>
              </div>
            )}
          </div>
        )
      )}
    </motion.section>
  );
}
