"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import NumberFlow from "@number-flow/react";

/* ─── types ─── */
type PipelineCounts = {
  lead: number;
  contacted: number;
  demo: number;
  contract: number;
  onboarding: number;
  live: number;
};

type SubscriptionCounts = {
  trial: number;
  active: number;
  canceled: number;
  other: number;
};

type TaskCompletion = { completed: number; total: number };

type ActivityEntry = {
  action: string;
  actorName: string;
  entityName: string | null;
  mosqueName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type Alert = {
  severity: "critical" | "warning";
  message: string;
  mosqueId?: string;
};

type PrayerMosqueStatus = {
  mosqueId: string;
  name: string;
  hasIqamahConfig: boolean;
  iqamahCount: number;
  hasCachedMonth: boolean;
  hasTodaysPrayers: boolean;
};

type PrayerSystemStats = {
  totalActive: number;
  withIqamahConfig: number;
  withIncompleteIqamah: number;
  withCachedMonth: number;
  withTodaysPrayers: number;
  problemMosques: PrayerMosqueStatus[];
};

type StripeHealthStats = {
  mrr: number;
  totalDonations: number;
  connectedAccounts: number;
  pendingVerification: number;
  liveWithoutStripe: number;
  canceledSubscriptions: number;
};

type ContentStats = {
  totalSpeakers: number;
  totalPrograms: number;
  totalEvents: number;
  mosquesWithContent: number;
  mosquesWithSpeakers: number;
  mosquesWithZeroContent: { id: string; name: string }[];
  activeMosqueCount: number;
};

type BuildsStats = {
  total: number;
  live: number;
  building: number;
  pendingReview: number;
  rejected: number;
  totalReleases: number;
};

type UserGrowthStats = {
  signupsThisMonth: number;
  topGrowingMosques: { mosqueId: string; name: string; signups: number }[];
};

type AttentionItem = {
  mosqueId: string;
  name: string;
  reasons: string[];
  severity: "critical" | "warning" | "info";
};

type BuildAction = {
  id: string;
  name: string;
  mosqueName: string;
  status: string;
  lastDate: string | null;
};

type Props = {
  totalMosques: number;
  totalUsers: number;
  onboardingStatusCounts: { pipeline: number; in_progress: number; live: number };
  pipelineCounts: PipelineCounts;
  subscriptionCounts: SubscriptionCounts;
  taskCompletionRates: Record<string, TaskCompletion>;
  recentActivity: ActivityEntry[];
  alerts: Alert[];
  prayerSystemStats: PrayerSystemStats;
  stripeHealthStats: StripeHealthStats;
  contentStats: ContentStats;
  buildsStats: BuildsStats;
  userGrowthStats: UserGrowthStats;
  attentionQueue: AttentionItem[];
  buildsNeedingAction: BuildAction[];
};

/* ─── helpers ─── */
const TASK_CATEGORIES: { category: string; tasks: { key: string; label: string; required: boolean }[] }[] = [
  {
    category: "Foundation",
    tasks: [
      { key: "mosque_profile", label: "Mosque Profile", required: true },
      { key: "app_branding", label: "App Branding", required: true },
    ],
  },
  {
    category: "Prayer & Worship",
    tasks: [
      { key: "prayer_times", label: "Prayer Times", required: true },
      { key: "jummah_setup", label: "Jummah Setup", required: true },
    ],
  },
  {
    category: "Content",
    tasks: [
      { key: "speakers", label: "Speakers", required: false },
      { key: "programs", label: "Programs", required: false },
      { key: "events", label: "Events", required: false },
    ],
  },
  {
    category: "Revenue",
    tasks: [
      { key: "stripe_connect", label: "Stripe Connect", required: true },
      { key: "donations", label: "Donations", required: false },
      { key: "ads_config", label: "Business Ads", required: false },
    ],
  },
  {
    category: "Team & Launch",
    tasks: [
      { key: "invite_admins", label: "Invite Admins", required: false },
      { key: "preview_app", label: "Preview App", required: true },
      { key: "launch_materials", label: "Launch Materials", required: false },
      { key: "go_live", label: "Go Live", required: true },
    ],
  },
];

type ActionConfig = {
  verb: string;
  iconBg: string;
  iconColor: string;
  icon: (props: { className: string }) => React.ReactNode;
  badge?: string;
  badgeStyle?: string;
};

const ACTION_CONFIG: Record<string, ActionConfig> = {
  user_signup: {
    verb: "joined",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
      </svg>
    ),
    badge: "Signup",
    badgeStyle: "bg-emerald-50 text-emerald-700",
  },
  user_removed: {
    verb: "was removed from",
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
      </svg>
    ),
    badge: "Removed",
    badgeStyle: "bg-red-50 text-red-600",
  },
  role_changed: {
    verb: "role changed at",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
      </svg>
    ),
    badge: "Role",
    badgeStyle: "bg-sky-50 text-sky-700",
  },
  admin_login: {
    verb: "logged in to",
    iconBg: "bg-ink/[0.06]",
    iconColor: "text-ink/40",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
      </svg>
    ),
  },
  sahla_login: {
    verb: "logged in to Sahla",
    iconBg: "bg-gold/10",
    iconColor: "text-gold",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    badge: "HQ",
    badgeStyle: "bg-gold/10 text-gold",
  },
  team_member_added: {
    verb: "added to team",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    badge: "Team",
    badgeStyle: "bg-emerald-50 text-emerald-700",
  },
  team_member_removed: {
    verb: "removed from team",
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    badge: "Removed",
    badgeStyle: "bg-red-50 text-red-600",
  },
  stripe_account_updated: {
    verb: "Stripe updated for",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
    badge: "Stripe",
    badgeStyle: "bg-violet-50 text-violet-700",
  },
  payment_succeeded: {
    verb: "payment received at",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    badge: "Payment",
    badgeStyle: "bg-emerald-50 text-emerald-700",
  },
};

const DEFAULT_ACTION_CONFIG: ActionConfig = {
  verb: "action",
  iconBg: "bg-ink/[0.04]",
  iconColor: "text-subtle",
  icon: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
  ),
};

type ParsedActivity = {
  who: string;
  verb: string;
  where: string;
  detail: string | null;
  config: ActionConfig;
};

function parseActivity(entry: ActivityEntry): ParsedActivity {
  const config = ACTION_CONFIG[entry.action] ?? { ...DEFAULT_ACTION_CONFIG, verb: entry.action };
  const who = entry.actorName;
  const where = entry.mosqueName ?? entry.entityName ?? "";

  let detail: string | null = null;
  if (entry.action === "payment_succeeded" && entry.metadata.amount) {
    detail = `$${entry.metadata.amount}`;
  }
  if (entry.action === "role_changed" && entry.metadata.new_role) {
    detail = (entry.metadata.new_role as string).replace("org:", "");
  }

  return { who, verb: config.verb, where, detail, config };
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const PIPELINE_STAGES: { key: keyof PipelineCounts; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "bg-ink/15" },
  { key: "contacted", label: "Contacted", color: "bg-amber-400" },
  { key: "demo", label: "Demo", color: "bg-sky-400" },
  { key: "contract", label: "Contract", color: "bg-violet-400" },
  { key: "onboarding", label: "Onboarding", color: "bg-cyan-400" },
  { key: "live", label: "Live", color: "bg-emerald-500" },
];

const card = "rounded-2xl border border-edge bg-white shadow-sm";
const sectionTitle = "text-[11px] font-bold uppercase tracking-wider text-faint";

type ActivityFilter = "all" | "auth" | "payments" | "team";
const ACTIVITY_FILTERS: { value: ActivityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "auth", label: "Auth" },
  { value: "payments", label: "Payments" },
  { value: "team", label: "Team" },
];
const ACTIVITY_FILTER_MAP: Record<ActivityFilter, string[]> = {
  all: [],
  auth: ["user_signup", "admin_login", "sahla_login"],
  payments: ["stripe_account_updated", "payment_succeeded"],
  team: ["team_member_added", "team_member_removed", "user_removed", "role_changed"],
};

function groupByDate(entries: ActivityEntry[]): { label: string; items: ActivityEntry[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const groups: Record<string, ActivityEntry[]> = {};
  const order: string[] = [];

  for (const entry of entries) {
    const t = new Date(entry.createdAt).getTime();
    let label: string;
    if (t >= today) label = "Today";
    else if (t >= yesterday) label = "Yesterday";
    else if (t >= weekAgo) label = "This Week";
    else label = "Earlier";

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(entry);
  }

  return order.map((label) => ({ label, items: groups[label] }));
}

/* ─── sub-components ─── */

function MetricCard({
  label,
  value,
  sub,
  accent,
  i,
  prefix,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  i: number;
  prefix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(10,38,30,0.06)" }}
      className={card + " px-5 py-5 transition-shadow"}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</p>
      <div className={`mt-2 font-display text-3xl tracking-tight ${accent ?? "text-ink"}`}>
        {typeof value === "number" ? (
          <>
            {prefix && <span>{prefix}</span>}
            <NumberFlow
              value={inView ? value : 0}
              transformTiming={{ duration: 800, easing: "ease-out" }}
              spinTiming={{ duration: 800, easing: "ease-out" }}
            />
          </>
        ) : (
          <span>{value}</span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-subtle">{sub}</p>}
    </motion.div>
  );
}

function FadeInSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(10,38,30,0.06)" strokeWidth={3} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={pct === 100 ? "#16a34a" : pct >= 50 ? "#06b6d4" : "#B8922A"}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ─── main ─── */
export default function OverviewClient({
  totalMosques,
  totalUsers,
  onboardingStatusCounts,
  pipelineCounts,
  subscriptionCounts,
  taskCompletionRates,
  recentActivity,
  alerts,
  prayerSystemStats,
  stripeHealthStats,
  contentStats,
  buildsStats,
  userGrowthStats,
  attentionQueue,
  buildsNeedingAction,
}: Props) {
  const pipelineTotal = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [activityLimit, setActivityLimit] = useState(10);

  const toggle = (key: string) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  const filteredActivity =
    activityFilter === "all"
      ? recentActivity
      : recentActivity.filter((e) => ACTIVITY_FILTER_MAP[activityFilter].includes(e.action));
  const visibleActivity = filteredActivity.slice(0, activityLimit);
  const activityGroups = groupByDate(visibleActivity);
  const hasMore = filteredActivity.length > activityLimit;

  return (
    <div className="space-y-6">
      {/* ── hero metrics ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total Mosques" value={totalMosques} i={0} />
        <MetricCard
          label="Total Users"
          value={totalUsers}
          sub={userGrowthStats.signupsThisMonth > 0 ? `+${userGrowthStats.signupsThisMonth} this month` : undefined}
          i={1}
        />
        <MetricCard
          label="Live Mosques"
          value={onboardingStatusCounts.live}
          sub={`${onboardingStatusCounts.in_progress} onboarding · ${onboardingStatusCounts.pipeline} pipeline`}
          accent="text-emerald-600"
          i={2}
        />
        <MetricCard
          label="Est. MRR"
          value={stripeHealthStats.mrr}
          prefix="$"
          sub={`${subscriptionCounts.active} active · ${subscriptionCounts.trial} trial`}
          accent="text-ink"
          i={3}
        />
      </div>

      {/* ── quick links ── */}
      <div className="flex items-center gap-2">
        {([
          { label: "Supabase", href: "https://supabase.com/dashboard" },
          { label: "Clerk", href: "https://dashboard.clerk.com" },
          { label: "Stripe", href: "https://dashboard.stripe.com" },
          { label: "Vercel", href: "https://vercel.com/dashboard" },
        ] as const).map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-full border border-edge bg-white px-3.5 py-2 text-xs font-medium text-subtle shadow-sm transition-all hover:border-edge-bold hover:text-ink hover:shadow-md"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink/[0.04] text-[10px] font-bold text-ink transition-colors group-hover:bg-ink/[0.08]">
              {link.label.charAt(0)}
            </span>
            {link.label}
            <svg className="h-3 w-3 text-faint transition-colors group-hover:text-ink" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        ))}
      </div>

      {/* ── alerts banner ── */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${card} overflow-hidden`}
        >
          <button
            onClick={() => toggle("alerts")}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-sand/40"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${criticalCount > 0 ? "bg-red-500" : "bg-amber-500"}`}>
              {alerts.length}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">
                {criticalCount > 0
                  ? `${criticalCount} critical issue${criticalCount > 1 ? "s" : ""} need attention`
                  : `${alerts.length} warning${alerts.length > 1 ? "s" : ""} to review`}
              </p>
              <p className="text-xs text-faint">Click to expand</p>
            </div>
            <motion.svg
              className="h-4 w-4 text-faint"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              animate={{ rotate: expandedSection === "alerts" ? 180 : 0 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {expandedSection === "alerts" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 border-t border-edge px-5 py-4">
                  {alerts.map((alert, i) => (
                    <div
                      key={`${alert.mosqueId}-${i}`}
                      className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
                        alert.severity === "critical"
                          ? "bg-red-50"
                          : "bg-amber-50/60"
                      }`}
                    >
                      <span className={`mt-px h-1.5 w-1.5 shrink-0 rounded-full ${
                        alert.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                      }`} />
                      <p className="text-[13px] leading-snug text-ink">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── attention queue ── */}
      {attentionQueue.length > 0 && (
        <div className={card + " overflow-hidden"}>
          <button
            onClick={() => toggle("attention")}
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-sand/40"
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
              attentionQueue.some((a) => a.severity === "critical") ? "bg-red-500" : "bg-amber-500"
            }`}>
              {attentionQueue.length}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Needs your attention</p>
              <p className="text-xs text-faint">
                {attentionQueue.length} mosque{attentionQueue.length !== 1 ? "s" : ""} flagged
                {attentionQueue.filter((a) => a.severity === "critical").length > 0 &&
                  ` · ${attentionQueue.filter((a) => a.severity === "critical").length} critical`}
              </p>
            </div>
            <motion.svg
              className="h-4 w-4 text-faint"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              animate={{ rotate: expandedSection === "attention" ? 180 : 0 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {expandedSection === "attention" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="border-t border-edge divide-y divide-edge/40">
                  {attentionQueue.map((item) => {
                    const borderColor =
                      item.severity === "critical" ? "border-l-red-500" :
                      item.severity === "warning" ? "border-l-amber-500" :
                      "border-l-ink/10";
                    return (
                      <div
                        key={item.mosqueId}
                        className={`border-l-[3px] ${borderColor} px-5 py-3.5`}
                      >
                        <p className="text-[13px] font-semibold text-ink">{item.name}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {item.reasons.map((reason, j) => {
                            const isAdmin = reason.toLowerCase().includes("admin") || reason.toLowerCase().includes("login");
                            const isStripe = reason.toLowerCase().includes("stripe");
                            const isPrayer = reason.toLowerCase().includes("prayer") || reason.toLowerCase().includes("sync") || reason.toLowerCase().includes("iqamah");
                            const isContent = reason.toLowerCase().includes("content");
                            const isCritical = reason.toLowerCase().includes("live but") || reason.toLowerCase().includes("missing");

                            let tagStyle = "bg-ink/[0.04] text-subtle";
                            if (isCritical) tagStyle = "bg-red-50 text-red-700";
                            else if (isStripe) tagStyle = "bg-violet-50 text-violet-700";
                            else if (isPrayer) tagStyle = "bg-sky-50 text-sky-700";
                            else if (isAdmin) tagStyle = "bg-amber-50 text-amber-700";
                            else if (isContent) tagStyle = "bg-ink/[0.04] text-subtle";

                            return (
                              <span
                                key={j}
                                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${tagStyle}`}
                              >
                                {reason}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── two-column layout: pipeline + activity ── */}
      <FadeInSection className="grid gap-5 lg:grid-cols-5">
        {/* Pipeline — takes 3 cols */}
        <div className="space-y-5 lg:col-span-3">
          {/* Pipeline funnel */}
          <div className={card + " p-5"}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={sectionTitle}>Pipeline</h3>
              <span className="text-xs tabular-nums text-faint">{pipelineTotal} total</span>
            </div>
            <div className="space-y-2.5">
              {PIPELINE_STAGES.map((stage) => {
                const count = pipelineCounts[stage.key];
                const pct = pipelineTotal > 0 ? (count / pipelineTotal) * 100 : 0;
                return (
                  <div key={stage.key} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs font-medium text-subtle">{stage.label}</span>
                    <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-ink/[0.03]">
                      <motion.div
                        className={`absolute inset-y-0 left-0 rounded-lg ${stage.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 2)}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-sm font-semibold text-ink">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscriptions row */}
          <div className={card + " p-5"}>
            <h3 className={sectionTitle + " mb-4"}>Subscriptions</h3>
            <div className="grid grid-cols-4 gap-3">
              {([
                { label: "Active", value: subscriptionCounts.active, color: "text-emerald-600" },
                { label: "Trial", value: subscriptionCounts.trial, color: "text-ink" },
                { label: "Canceled", value: subscriptionCounts.canceled, color: "text-red-500" },
                { label: "Other", value: subscriptionCounts.other, color: "text-faint" },
              ] as const).map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity feed — takes 2 cols */}
        <div className={card + " flex flex-col overflow-hidden lg:col-span-2"}>
          <div className="border-b border-edge px-5 py-4">
            <div className="flex items-center justify-between">
              <h3 className={sectionTitle}>Activity</h3>
              <span className="text-[11px] tabular-nums text-faint">
                {filteredActivity.length} event{filteredActivity.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 flex gap-1.5">
              {ACTIVITY_FILTERS.map((f) => {
                const count = f.value === "all"
                  ? recentActivity.length
                  : recentActivity.filter((e) => ACTIVITY_FILTER_MAP[f.value].includes(e.action)).length;
                return (
                  <button
                    key={f.value}
                    onClick={() => { setActivityFilter(f.value); setActivityLimit(10); }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                      activityFilter === f.value
                        ? "bg-ink text-white shadow-sm"
                        : "bg-ink/[0.03] text-subtle hover:bg-ink/[0.07] hover:text-ink"
                    }`}
                  >
                    {f.label}
                    <span className={`min-w-[16px] rounded-full px-1 text-center text-[9px] font-bold ${
                      activityFilter === f.value
                        ? "bg-white/20 text-white/70"
                        : "bg-ink/[0.06] text-faint"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
            {filteredActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.03]">
                  <svg className="h-6 w-6 text-faint" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-subtle">No activity to show</p>
                <p className="mt-1 text-xs text-faint">Try a different filter</p>
              </div>
            ) : (
              <div>
                {activityGroups.map((group) => (
                  <div key={group.label}>
                    <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-edge/30 bg-white/90 px-5 py-2 backdrop-blur-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-faint">
                        {group.label}
                      </span>
                      <span className="h-px flex-1 bg-edge/50" />
                      <span className="text-[10px] tabular-nums text-faint">{group.items.length}</span>
                    </div>
                    {group.items.map((entry, i) => {
                      const parsed = parseActivity(entry);
                      const Icon = parsed.config.icon;
                      return (
                        <div
                          key={`${entry.createdAt}-${i}`}
                          className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-sand/30"
                        >
                          <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${parsed.config.iconBg}`}>
                            <Icon className={`h-3.5 w-3.5 ${parsed.config.iconColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] leading-snug text-ink">
                              <span className="font-semibold">{parsed.who}</span>
                              <span className="text-subtle"> {parsed.verb} </span>
                              {parsed.where && <span className="font-medium">{parsed.where}</span>}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[11px] tabular-nums text-faint">
                                {timeAgo(entry.createdAt)}
                              </span>
                              {parsed.detail && (
                                <>
                                  <span className="h-0.5 w-0.5 rounded-full bg-faint" />
                                  <span className="font-mono text-[11px] font-semibold text-ink">
                                    {parsed.detail}
                                  </span>
                                </>
                              )}
                              {parsed.config.badge && (
                                <>
                                  <span className="h-0.5 w-0.5 rounded-full bg-faint" />
                                  <span className={`rounded px-1.5 py-px text-[9px] font-bold uppercase ${parsed.config.badgeStyle}`}>
                                    {parsed.config.badge}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 pt-1 text-[11px] tabular-nums text-faint opacity-0 transition-opacity group-hover:opacity-100">
                            {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {hasMore && (
                  <button
                    onClick={() => setActivityLimit((l) => l + 10)}
                    className="flex w-full items-center justify-center gap-2 border-t border-edge py-3.5 text-xs font-medium text-subtle transition-colors hover:bg-sand/40 hover:text-ink"
                  >
                    Show more
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </FadeInSection>

      {/* ── onboarding completion ── */}
      <FadeInSection>
      <div className={card + " overflow-hidden"}>
        <button
          onClick={() => toggle("onboarding")}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-sand/40"
        >
          <div className="flex-1">
            <h3 className={sectionTitle}>Onboarding Completion</h3>
          </div>
          {taskCompletionRates[Object.keys(taskCompletionRates)[0]]?.total > 0 && (
            <span className="text-xs tabular-nums text-faint">
              {taskCompletionRates[Object.keys(taskCompletionRates)[0]].total} mosques
            </span>
          )}
          <motion.svg
            className="h-4 w-4 text-faint"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            animate={{ rotate: expandedSection === "onboarding" ? 180 : 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </motion.svg>
        </button>
        <AnimatePresence>
          {expandedSection === "onboarding" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-edge px-5 py-5">
                {taskCompletionRates[Object.keys(taskCompletionRates)[0]]?.total === 0 ? (
                  <p className="text-sm text-faint">No mosques in onboarding yet.</p>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {TASK_CATEGORIES.map((cat) => (
                      <div key={cat.category}>
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-faint">
                          {cat.category}
                        </p>
                        <div className="space-y-3">
                          {cat.tasks.map((task) => {
                            const rate = taskCompletionRates[task.key];
                            if (!rate) return null;
                            const pct = rate.total > 0 ? Math.round((rate.completed / rate.total) * 100) : 0;
                            return (
                              <div key={task.key} className="flex items-center gap-3">
                                <ProgressRing pct={pct} size={32} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-medium text-ink">{task.label}</span>
                                    {task.required && (
                                      <span className="rounded bg-ink/[0.06] px-1 py-px text-[9px] font-bold uppercase text-ink/50">
                                        req
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] tabular-nums text-faint">
                                    {rate.completed}/{rate.total} — {pct}%
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </FadeInSection>

      {/* ── system health grid — row 1 ── */}
      <FadeInSection className="grid gap-5 lg:grid-cols-2">
        {/* Prayer system */}
        <div className={card + " flex flex-col overflow-hidden"}>
          <div className="border-b border-edge px-5 py-4">
            <div className="flex items-center justify-between">
              <h3 className={sectionTitle}>Prayer System</h3>
              {prayerSystemStats.problemMosques.length === 0 && prayerSystemStats.totalActive > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Healthy
                </span>
              )}
              {prayerSystemStats.problemMosques.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {prayerSystemStats.problemMosques.length} issue{prayerSystemStats.problemMosques.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          {prayerSystemStats.totalActive === 0 ? (
            <p className="p-5 text-sm text-faint">No active mosques.</p>
          ) : (
            <div className="flex-1 p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  { label: "Iqamah Config", value: prayerSystemStats.withIqamahConfig, total: prayerSystemStats.totalActive },
                  { label: "Monthly Cache", value: prayerSystemStats.withCachedMonth, total: prayerSystemStats.totalActive },
                  { label: "Today's Prayers", value: prayerSystemStats.withTodaysPrayers, total: prayerSystemStats.totalActive },
                  { label: "Incomplete Iqamah", value: prayerSystemStats.withIncompleteIqamah, total: prayerSystemStats.totalActive },
                ] as const).map((s) => {
                  const isLast = s.label === "Incomplete Iqamah";
                  const allGood = isLast ? s.value === 0 : s.value === s.total;
                  return (
                    <div key={s.label} className="rounded-xl bg-ink/[0.02] px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">{s.label}</p>
                      <p className={`mt-1 font-mono text-lg font-bold tabular-nums ${allGood ? "text-emerald-600" : "text-ink"}`}>
                        {s.value}
                        <span className="text-xs font-normal text-faint">/{s.total}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
              {prayerSystemStats.problemMosques.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {prayerSystemStats.problemMosques.slice(0, 3).map((m) => {
                    const issues: string[] = [];
                    if (m.iqamahCount < 5) issues.push(`${m.iqamahCount}/5 iqamah`);
                    if (!m.hasCachedMonth) issues.push("no cache");
                    if (!m.hasTodaysPrayers) issues.push("no today");
                    return (
                      <div key={m.mosqueId} className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2">
                        <span className="text-xs font-medium text-ink">{m.name}</span>
                        <span className="text-[10px] text-amber-700">{issues.join(" · ")}</span>
                      </div>
                    );
                  })}
                  {prayerSystemStats.problemMosques.length > 3 && (
                    <p className="text-center text-[11px] text-faint">
                      +{prayerSystemStats.problemMosques.length - 3} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Revenue & Stripe */}
        <div className={card + " flex flex-col overflow-hidden"}>
          <div className="border-b border-edge px-5 py-4">
            <h3 className={sectionTitle}>Revenue & Stripe</h3>
          </div>
          <div className="flex-1 p-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-ink/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Donations</p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">
                  ${stripeHealthStats.totalDonations.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-ink/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Connected</p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">{stripeHealthStats.connectedAccounts}</p>
              </div>
              <div className="rounded-xl bg-ink/[0.02] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">Pending</p>
                <p className={`mt-1 font-mono text-lg font-bold ${stripeHealthStats.pendingVerification > 0 ? "text-amber-600" : "text-ink"}`}>
                  {stripeHealthStats.pendingVerification}
                </p>
              </div>
            </div>
            {(stripeHealthStats.liveWithoutStripe > 0 || stripeHealthStats.canceledSubscriptions > 0) && (
              <div className="mt-4 space-y-1.5">
                {stripeHealthStats.liveWithoutStripe > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50/60 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="text-xs text-ink">
                      {stripeHealthStats.liveWithoutStripe} live without Stripe
                    </span>
                  </div>
                )}
                {stripeHealthStats.canceledSubscriptions > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50/60 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span className="text-xs text-ink">
                      {stripeHealthStats.canceledSubscriptions} canceled
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </FadeInSection>

      {/* ── system health grid — row 2 ── */}
      <FadeInSection className="grid gap-5 lg:grid-cols-3">
        {/* User Growth */}
        <div className={card + " overflow-hidden"}>
          <div className="border-b border-edge px-5 py-4">
            <div className="flex items-center justify-between">
              <h3 className={sectionTitle}>User Growth</h3>
              <span className="text-[11px] text-faint">Last 30 days</span>
            </div>
          </div>
          <div className="p-5">
            <p className="font-mono text-2xl font-bold text-ink">
              +{userGrowthStats.signupsThisMonth}
              <span className="ml-1.5 text-sm font-normal text-faint">signups</span>
            </p>
            {userGrowthStats.topGrowingMosques.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-faint">Top Growing</p>
                {userGrowthStats.topGrowingMosques.map((m, i) => (
                  <div key={m.mosqueId} className="flex items-center justify-between rounded-lg bg-ink/[0.02] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink/[0.06] text-[9px] font-bold text-ink/50">
                        {i + 1}
                      </span>
                      <span className="text-xs font-medium text-ink">{m.name}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-emerald-600">+{m.signups}</span>
                  </div>
                ))}
              </div>
            )}
            {userGrowthStats.signupsThisMonth === 0 && (
              <p className="mt-2 text-xs text-faint">No new signups in the last 30 days.</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={card + " overflow-hidden"}>
          <div className="border-b border-edge px-5 py-4">
            <h3 className={sectionTitle}>Content</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4">
              {([
                { label: "Speakers", value: contentStats.totalSpeakers },
                { label: "Programs", value: contentStats.totalPrograms },
                { label: "Events", value: contentStats.totalEvents },
              ] as const).map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-mono text-xl font-bold text-ink">{s.value}</p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-faint">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-ink/[0.02] px-3 py-2.5">
              <span className="text-xs text-subtle">Mosques with content</span>
              <span className="font-mono text-sm font-bold text-ink">
                {contentStats.mosquesWithContent}
                <span className="text-xs font-normal text-faint">/{contentStats.activeMosqueCount}</span>
              </span>
            </div>
            {contentStats.mosquesWithZeroContent.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {contentStats.mosquesWithZeroContent.slice(0, 4).map((m) => (
                  <span key={m.id} className="rounded-md bg-amber-50/80 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    {m.name}
                  </span>
                ))}
                {contentStats.mosquesWithZeroContent.length > 4 && (
                  <span className="rounded-md bg-ink/[0.03] px-2 py-0.5 text-[10px] font-medium text-faint">
                    +{contentStats.mosquesWithZeroContent.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Builds */}
        <div className={card + " overflow-hidden"}>
          <div className="border-b border-edge px-5 py-4">
            <div className="flex items-center justify-between">
              <h3 className={sectionTitle}>Builds</h3>
              <span className="font-mono text-xs font-bold text-ink">{buildsStats.totalReleases} releases</span>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4">
              {([
                { label: "Live", value: buildsStats.live, dot: "bg-emerald-500" },
                { label: "Building", value: buildsStats.building, dot: "bg-violet-500" },
                { label: "Review", value: buildsStats.pendingReview, dot: "bg-amber-500" },
              ] as const).map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  <span className="font-mono text-sm font-bold text-ink">{s.value}</span>
                  <span className="text-[10px] text-faint">{s.label}</span>
                </div>
              ))}
            </div>
            {buildsNeedingAction.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {buildsNeedingAction.map((b) => {
                  const statusColors: Record<string, { dot: string; bg: string; text: string; label: string }> = {
                    building: { dot: "bg-violet-500", bg: "bg-violet-50/60", text: "text-violet-700", label: "Building" },
                    pending_review: { dot: "bg-amber-500", bg: "bg-amber-50/60", text: "text-amber-700", label: "Pending" },
                    rejected: { dot: "bg-red-500", bg: "bg-red-50/60", text: "text-red-700", label: "Rejected" },
                  };
                  const sc = statusColors[b.status] ?? statusColors.building;
                  return (
                    <div key={b.id} className={`rounded-lg ${sc.bg} px-3 py-2.5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-ink">{b.name}</span>
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc.text} bg-white/60`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-subtle">{b.mosqueName}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {buildsStats.rejected > 0 && buildsNeedingAction.every((b) => b.status !== "rejected") && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50/60 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                <span className="text-xs text-ink">{buildsStats.rejected} rejected</span>
              </div>
            )}
          </div>
        </div>
      </FadeInSection>
    </div>
  );
}
