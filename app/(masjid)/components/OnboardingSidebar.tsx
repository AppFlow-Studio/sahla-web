"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { ArrowLeft, LogIn, LogOut } from "lucide-react";
import { OrganizationSwitcher, useClerk, useUser } from "@clerk/nextjs";
import { useIsSahlaHQ } from "@/lib/auth/useIsSahlaHQ";

const SWITCHER_APPEARANCE = {
  variables: {
    colorBackground: "#0e2b22",
    colorText: "#fffbf2",
    colorTextSecondary: "rgba(255,251,242,0.55)",
    colorPrimary: "#fffbf2",
    colorTextOnPrimaryBackground: "#0A261E",
    colorInputBackground: "rgba(255,251,242,0.06)",
    colorInputText: "#fffbf2",
  },
  elements: {
    rootBox: { width: "100%" },
    organizationSwitcherTrigger: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: "6px",
      color: "#fffbf2",
      backgroundColor: "transparent",
      "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
      "&:focus": { boxShadow: "none" },
    },
    organizationPreviewMainIdentifier: {
      fontSize: "12.5px",
      color: "#fffbf2",
    },
    organizationPreviewSecondaryIdentifier: {
      fontSize: "11px",
      color: "rgba(255,251,242,0.5)",
    },
  },
};
import { ONBOARDING_CATEGORIES } from "./onboarding-tasks";
import { useCompletion } from "./CompletionCelebration";
import CheckDraw from "@/app/components/CheckDraw";
import { DUR, EASE_OUT_EXPO, EASE_OUT_QUART } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Fire-and-forget ping to the leave-notify endpoint so the masjid admin gets
 * a one-time "resume your setup" email. Safe to call repeatedly — the
 * endpoint is idempotent (atomic claim on resume_email_sent_at).
 */
function pingLeaveNotify() {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  try {
    navigator.sendBeacon("/api/onboarding/leave-notify");
  } catch {
    // Beacons are best-effort — ignore failures.
  }
}

export default function OnboardingSidebar({
  mosqueName,
  progress,
  launched = false,
}: {
  mosqueName: string;
  progress: Record<string, boolean>;
  /**
   * True for a mosque whose app has shipped but has no CRM — this stays their
   * home, so the header reads as "live" rather than a setup checklist they're
   * still working through. The task links remain: without a CRM these panels
   * are their only web-side editor.
   */
  launched?: boolean;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const { isHQ } = useIsSahlaHQ();
  const { justCompleted, justCompletedCategories } = useCompletion();

  const allTasks = ONBOARDING_CATEGORIES.flatMap((c) => c.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => progress[t.id] === true).length;
  const overallPct = Math.round((completedTasks / totalTasks) * 100);

  return (
    <aside className="flex h-full w-80 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar-bg">
      {/* Header */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link
          href="/"
          onClick={pingLeaveNotify}
          className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-sidebar-text-muted transition-colors hover:text-sidebar-text"
        >
          <ArrowLeft size={12} />
          Back to Sahla
        </Link>
        <p className="font-display text-xl text-[#E8D5B0]">{mosqueName}</p>
        <p className="mt-0.5 text-[12px] text-sidebar-text-muted">
          {launched ? "Sahla Core" : "App Onboarding"}
        </p>
        {launched ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-300">
              App is live
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sidebar-active-bg">
              <motion.div
                className="h-full w-full origin-left rounded-full bg-emerald-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: overallPct / 100 }}
                transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
              />
            </div>
            <span className="flex items-center text-[11px] font-medium tabular-nums text-sidebar-text-muted">
              {/* The count that grows is the one worth reading — tick it. */}
              <NumberFlow value={completedTasks} className="text-[#E8D5B0]" />
              /{totalTasks}
            </span>
          </div>
        )}
      </div>

      {/* Task List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {ONBOARDING_CATEGORIES.map((category) => {
          const catCompleted = category.tasks.filter(
            (t) => progress[t.id] === true
          ).length;
          const catTotal = category.tasks.length;
          const catDone = catCompleted === catTotal;
          const catJustDone = justCompletedCategories.has(category.id);

          return (
            <div key={category.id} className="mb-3">
              {/* Category header: label ──── x/y, or a check once it's cleared */}
              <div className="mb-1 flex items-center gap-3 px-3 py-2">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    catDone ? "text-emerald-300/80" : "text-sidebar-text-muted"
                  )}
                >
                  {category.label}
                </span>
                <div className="h-px flex-1 bg-sidebar-border" />
                {catDone ? (
                  <motion.span
                    className="text-emerald-400"
                    initial={catJustDone ? { scale: 0.4, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: DUR.state,
                      ease: EASE_OUT_EXPO,
                      delay: catJustDone ? 0.4 : 0,
                    }}
                  >
                    <CheckDraw
                      size={11}
                      strokeWidth={3}
                      play={catJustDone}
                      delay={catJustDone ? 0.45 : 0}
                    />
                  </motion.span>
                ) : (
                  <span className="text-[10px] tabular-nums text-sidebar-text-muted">
                    {catCompleted}/{catTotal}
                  </span>
                )}
              </div>

              {category.tasks.map((task) => {
                const isDone = progress[task.id] === true;
                const isActive = pathname === `/${task.id}`;
                // Only rows that flipped to done just now animate. Everything
                // already checked off renders in its finished state.
                const isFresh = justCompleted.has(task.id);

                return (
                  <Link
                    key={task.id}
                    href={`/${task.id}`}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 transition-colors",
                      isActive
                        ? "bg-sidebar-active-bg"
                        : "hover:bg-sidebar-hover-bg"
                    )}
                  >
                    {isFresh && (
                      <motion.span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-emerald-400/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          duration: 1.1,
                          ease: EASE_OUT_QUART,
                          times: [0, 0.2, 1],
                        }}
                      />
                    )}

                    {/* Checkmark slot (reserves width to keep labels aligned) */}
                    <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                      <AnimatePresence initial={false}>
                        {isDone && (
                          <motion.span
                            key="done"
                            className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-400 text-sidebar-bg"
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{ duration: DUR.state, ease: EASE_OUT_EXPO }}
                          >
                            <CheckDraw
                              size={11}
                              strokeWidth={3.5}
                              play={isFresh}
                              delay={isFresh ? 0.1 : 0}
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Label — the cross-off line draws itself on completion */}
                    <span
                      className={cn(
                        "relative flex-1 text-[13px] font-medium transition-colors",
                        isDone
                          ? "text-sidebar-text-muted"
                          : isActive
                          ? "text-sidebar-active-text"
                          : "text-sidebar-text"
                      )}
                    >
                      <span className="relative inline-block">
                        {task.label}
                        {isDone && (
                          <motion.span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-1/2 h-px origin-left bg-current"
                            initial={{ scaleX: isFresh ? 0 : 1 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              duration: DUR.state,
                              ease: EASE_OUT_QUART,
                              delay: isFresh ? 0.18 : 0,
                            }}
                          />
                        )}
                      </span>
                    </span>

                    {/* Time Estimate */}
                    <span className="shrink-0 text-[10px] text-sidebar-text-muted">
                      {task.timeEstimate}
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-sidebar-border px-3 py-3">
        {isSignedIn ? (
          <>
            {isHQ && (
              <OrganizationSwitcher
                hidePersonal
                afterSelectOrganizationUrl="/launch"
                afterSelectPersonalUrl="/select-org"
                appearance={SWITCHER_APPEARANCE}
              />
            )}
            <button
              onClick={() => {
                pingLeaveNotify();
                signOut({ redirectUrl: "/" });
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-text-muted transition-colors hover:bg-sidebar-hover-bg hover:text-sidebar-text"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-sidebar-text-muted transition-colors hover:bg-sidebar-hover-bg hover:text-sidebar-text"
          >
            <LogIn size={14} />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
