"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, LogIn, LogOut } from "lucide-react";
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
}: {
  mosqueName: string;
  progress: Record<string, boolean>;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const { isHQ } = useIsSahlaHQ();

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
        <p className="mt-0.5 text-[12px] text-sidebar-text-muted">App Onboarding</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sidebar-active-bg">
            <motion.div
              className="h-full rounded-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[11px] font-medium tabular-nums text-sidebar-text-muted">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </div>

      {/* Task List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {ONBOARDING_CATEGORIES.map((category) => {
          const catCompleted = category.tasks.filter(
            (t) => progress[t.id] === true
          ).length;
          const catTotal = category.tasks.length;

          return (
            <div key={category.id} className="mb-3">
              {/* Category header: label ──── x/y */}
              <div className="mb-1 flex items-center gap-3 px-3 py-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-text-muted">
                  {category.label}
                </span>
                <div className="h-px flex-1 bg-sidebar-border" />
                <span className="text-[10px] tabular-nums text-sidebar-text-muted">
                  {catCompleted}/{catTotal}
                </span>
              </div>

              {category.tasks.map((task) => {
                const isDone = progress[task.id] === true;
                const isActive = pathname === `/${task.id}`;

                return (
                  <Link
                    key={task.id}
                    href={`/${task.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                      isActive
                        ? "bg-sidebar-active-bg"
                        : "hover:bg-sidebar-hover-bg"
                    )}
                  >
                    {/* Checkmark slot (reserves width to keep labels aligned) */}
                    <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                      {isDone && (
                        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-400">
                          <Check size={11} className="text-sidebar-bg" strokeWidth={3.5} />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        "flex-1 text-[13px] font-medium",
                        isDone
                          ? "text-sidebar-text-muted line-through"
                          : isActive
                          ? "text-sidebar-active-text"
                          : "text-sidebar-text"
                      )}
                    >
                      {task.label}
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
