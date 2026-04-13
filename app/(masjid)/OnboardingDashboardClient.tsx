"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Category = {
  id: string;
  label: string;
  tasks: { id: string; label: string }[];
};

type Task = { id: string; label: string };

type Props = {
  mosqueName: string;
  needsOnboarding: boolean;
  completed: number;
  total: number;
  pct: number;
  nextTask: Task | null;
  categories: Category[];
  progress: Record<string, boolean>;
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function OnboardingDashboardClient({
  mosqueName,
  needsOnboarding,
  completed,
  total,
  pct,
  nextTask,
  categories,
  progress,
}: Props) {
  return (
    <motion.div
      className="mx-auto max-w-2xl py-12"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <motion.h1 variants={fadeUp} className="text-[28px] font-bold text-stone-900">
        Welcome to Sahla
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-[15px] text-stone-500">
        Let&apos;s get your app set up. Complete the tasks on the left to launch
        your mosque&apos;s app.
      </motion.p>

      {needsOnboarding && (
        <motion.div
          variants={fadeUp}
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
        >
          <p className="text-[14px] font-semibold text-amber-900">Needs Onboarding</p>
          <p className="mt-1 text-[13px] text-amber-800">
            {mosqueName} needs to be onboarded. Continue the setup tasks below.
          </p>
        </motion.div>
      )}

      {/* Progress Card */}
      <motion.div variants={fadeUp} className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-stone-900">
              Onboarding Progress
            </p>
            <p className="mt-0.5 text-[13px] text-stone-500">
              {completed} of {total} tasks complete
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-emerald-500/20">
            <span className="text-[16px] font-bold tabular-nums text-emerald-600">
              {pct}%
            </span>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Quick Actions */}
      {nextTask && (
        <motion.div variants={fadeUp} className="mt-6">
          <Link
            href={`/${nextTask.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-[14px] font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            {completed === 0 ? "Start with Mosque Profile" : `Continue: ${nextTask.label}`}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </motion.div>
      )}

      {/* Category Summary */}
      <motion.div variants={stagger} className="mt-8 space-y-3">
        {categories.map((cat) => {
          const catCompleted = cat.tasks.filter((t) => progress[t.id] === true).length;
          const catTotal = cat.tasks.length;
          const catPct = Math.round((catCompleted / catTotal) * 100);

          return (
            <motion.div
              key={cat.id}
              variants={fadeUp}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-3.5"
            >
              <div>
                <p className="text-[13px] font-semibold text-stone-800">
                  {cat.label}
                </p>
                <p className="text-[11px] text-stone-400">
                  {catCompleted}/{catTotal} tasks
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-100">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${catPct}%` }}
                    transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
                  />
                </div>
                {catCompleted === catTotal ? (
                  <motion.svg
                    className="h-5 w-5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.6 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </motion.svg>
                ) : (
                  <span className="text-[11px] tabular-nums text-stone-400">
                    {catPct}%
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
