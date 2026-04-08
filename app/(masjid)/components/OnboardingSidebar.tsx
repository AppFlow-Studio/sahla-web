"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ONBOARDING_CATEGORIES } from "./onboarding-tasks";

export default function OnboardingSidebar({
  mosqueName,
  progress,
}: {
  mosqueName: string;
  progress: Record<string, boolean>;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleCategory(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalTasks = ONBOARDING_CATEGORIES.flatMap((c) => c.tasks).length;
  const completedTasks = ONBOARDING_CATEGORIES.flatMap((c) => c.tasks).filter(
    (t) => progress[t.id] === true
  ).length;
  const overallPct = Math.round((completedTasks / totalTasks) * 100);

  return (
    <aside className="flex h-full w-80 flex-col border-r border-stone-200 bg-white">
      {/* Header */}
      <div className="border-b border-stone-200 px-5 py-4">
        <p className="text-[15px] font-bold text-stone-900">{mosqueName}</p>
        <p className="mt-0.5 text-[12px] text-stone-500">App Onboarding</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-stone-500">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </div>

      {/* Task List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {ONBOARDING_CATEGORIES.map((category) => {
          const isCollapsed = collapsed[category.id] === true;
          const catCompleted = category.tasks.filter(
            (t) => progress[t.id] === true
          ).length;
          const catTotal = category.tasks.length;

          return (
            <div key={category.id} className="mb-1">
              <button
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-stone-50"
              >
                <div className="flex items-center gap-2">
                  <motion.svg
                    className="h-3.5 w-3.5 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </motion.svg>
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-stone-500">
                    {category.label}
                  </span>
                </div>
                <span className="text-[10px] tabular-nums text-stone-400">
                  {catCompleted}/{catTotal}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {category.tasks.map((task) => {
                      const isDone = progress[task.id] === true;
                      const isActive = pathname === `/${task.id}`;

                      return (
                        <Link
                          key={task.id}
                          href={`/${task.id}`}
                          className={`flex items-start gap-3 rounded-lg px-3 py-2 ml-2 transition-colors ${
                            isActive
                              ? "bg-emerald-50"
                              : "hover:bg-stone-50"
                          }`}
                        >
                          {/* Checkbox */}
                          <div className="mt-0.5">
                            {isDone ? (
                              <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500">
                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              </div>
                            ) : (
                              <div className="h-4.5 w-4.5 rounded-full border-2 border-stone-300" />
                            )}
                          </div>

                          {/* Label + Description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[13px] font-medium ${
                                  isDone ? "text-stone-400 line-through" : isActive ? "text-emerald-700" : "text-stone-700"
                                }`}
                              >
                                {task.label}
                              </span>
                              <span
                                className={`text-[9px] font-bold rounded px-1.5 py-0.5 ${
                                  task.badge === "REQ"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-stone-100 text-stone-500"
                                }`}
                              >
                                {task.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
                              {task.description}
                            </p>
                          </div>

                          {/* Time Estimate */}
                          <span className="text-[10px] text-stone-400 mt-0.5 shrink-0">
                            {task.timeEstimate}
                          </span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
