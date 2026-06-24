"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  HeartHandshake,
  Bell,
  ArrowUpRight,
  Heart,
  UserPlus,
  CalendarPlus,
  BellRing,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import StatCard from "../_components/StatCard";
import PageHeader from "../_components/PageHeader";
import { useDonations } from "../_hooks/useDonations";
import { useMembers } from "../_hooks/useMembers";
import { useContent } from "../_hooks/useContent";
import { useNotifications } from "../_hooks/useNotifications";
import { useActivity, type ActivityEvent } from "../_hooks/useActivity";
import { useMosque } from "../_lib/mock-mosque";
import { formatUsd, relativeShort } from "../_lib/format";
import { activityMeta, TONE_BADGE } from "../_lib/activityMeta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NOW = Date.now();
const DAY = 86_400_000;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function HomeClient() {
  const { data: donations } = useDonations();
  const { data: members } = useMembers();
  const { data: programs } = useContent("program");
  const { data: events } = useContent("event");
  const { history: notifications } = useNotifications();
  const activity = useActivity(14);
  const mosque = useMosque();

  const stats = useMemo(() => {
    const donationsMtd = donations
      .filter(
        (d) =>
          d.status === "succeeded" &&
          new Date(d.occurredAt).getTime() >= NOW - 30 * DAY
      )
      .reduce((s, d) => s + d.amountUsd, 0);
    const activeMembers = members.filter(
      (m) =>
        m.lastActiveAt &&
        new Date(m.lastActiveAt).getTime() >= NOW - 30 * DAY
    ).length;
    const allContent = [...programs, ...events];
    const rsvpsThisWeek = allContent.reduce((s, c) => s + c.currentCount, 0);
    const notifsSent = notifications.length;
    return { donationsMtd, activeMembers, rsvpsThisWeek, notifsSent };
  }, [donations, members, programs, events, notifications]);

  const nudges = useMemo(() => {
    const out: Nudge[] = [];

    // 1. Capacity warning
    const fullProgram = [...programs, ...events]
      .filter((c) => c.currentCount / c.maxCapacity >= 0.85)
      .sort((a, b) => b.currentCount / b.maxCapacity - a.currentCount / a.maxCapacity)[0];
    if (fullProgram) {
      const pct = Math.round((fullProgram.currentCount / fullProgram.maxCapacity) * 100);
      out.push({
        id: "nudge-capacity",
        tone: pct >= 100 ? "warm" : "info",
        icon: pct >= 100 ? AlertTriangle : TrendingUp,
        title:
          pct >= 100
            ? `${fullProgram.name} is at capacity`
            : `${fullProgram.name} is ${pct}% full`,
        description:
          pct >= 100
            ? `Consider adding seats or enabling waitlist promotion.`
            : `Promote it in your community to fill the last spots.`,
        cta: { label: "Open it", href: `/content/${fullProgram.kind === "program" ? "programs" : "events"}/${fullProgram.id}` },
      });
    }

    // 2. Push token reminder
    const noPush = members.filter((m) => !m.hasPushToken).length;
    if (noPush > members.length * 0.2) {
      out.push({
        id: "nudge-push",
        tone: "info",
        icon: BellRing,
        title: `${noPush} members haven't enabled push`,
        description:
          "Send a one-time reminder so prayer time and event notifications actually reach them.",
        cta: { label: "Send reminder", href: "/setup/notifications" },
      });
    }

    // 3. Donation thanks
    const recentLargeDonation = donations.find(
      (d) =>
        d.status === "succeeded" &&
        d.amountUsd >= 250 &&
        NOW - new Date(d.occurredAt).getTime() < 7 * DAY
    );
    if (recentLargeDonation) {
      out.push({
        id: "nudge-donation",
        tone: "warm",
        icon: HeartHandshake,
        title: `Thank-you note pending`,
        description: `${recentLargeDonation.donorHash} gave ${formatUsd(recentLargeDonation.amountUsd)} to ${recentLargeDonation.fundLabel} ${relativeShort(recentLargeDonation.occurredAt)}.`,
        cta: { label: "Send thanks", href: "/setup/notifications" },
      });
    }

    return out.slice(0, 3);
  }, [programs, events, members, donations]);

  return (
    <>
      <PageHeader
        eyebrow={`Welcome back, ${mosque.name}`}
        title="Here's how the community is doing"
        description="A live snapshot of donations, members, and what's next on the calendar."
      />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Donations MTD"
          value={Math.round(stats.donationsMtd)}
          prefix="$"
        />
        <StatCard label="Active members 30d" value={stats.activeMembers} />
        <StatCard label="RSVPs this week" value={stats.rsvpsThisWeek} />
        <StatCard label="Notifications sent" value={stats.notifsSent} />
      </div>

      {/* Nudges */}
      {nudges.length > 0 ? (
        <section className="mb-6">
          <header className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-[#B8922A]" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
              Top focus
            </h2>
          </header>
          <div className="grid gap-3 md:grid-cols-3">
            {nudges.map((nudge, i) => (
              <NudgeCard key={nudge.id} nudge={nudge} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Activity + quick actions */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Activity feed */}
        <section className="rounded-2xl border border-[#0A261E]/8 bg-white">
          <header className="flex items-center justify-between border-b border-[#0A261E]/6 px-5 py-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[#0A261E]">
                Activity
              </h2>
              <p className="text-[11.5px] text-[#0A261E]/55">
                Donations, RSVPs, signups, notifications.
              </p>
            </div>
            <Link
              href="/people/members"
              className="inline-flex items-center gap-1 text-[11.5px] text-[#0A261E]/55 hover:text-[#0A261E]"
            >
              See all
              <ArrowUpRight size={11} />
            </Link>
          </header>
          <ul className="divide-y divide-[#0A261E]/6">
            {activity.map((event, i) => (
              <ActivityRow key={event.id} event={event} index={i} />
            ))}
          </ul>
        </section>

        {/* Quick actions */}
        <aside className="space-y-3">
          <QuickActionCard
            href="/content/programs"
            icon={CalendarPlus}
            title="Create a program"
            description="5-step wizard"
          />
          <QuickActionCard
            href="/setup/notifications"
            icon={Bell}
            title="Send a notification"
            description="Compose or pick a template"
          />
          <QuickActionCard
            href="/people/speakers"
            icon={UserPlus}
            title="Add a speaker"
            description="Reuse across programs"
          />
          <QuickActionCard
            href="/money/donations"
            icon={Heart}
            title="See donations"
            description="MTD totals + Stripe link"
          />
        </aside>
      </div>
    </>
  );
}

type Nudge = {
  id: string;
  tone: "info" | "warm";
  icon: typeof Users;
  title: string;
  description: string;
  cta: { label: string; href: string };
};

function NudgeCard({ nudge, index }: { nudge: Nudge; index: number }) {
  const Icon = nudge.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: EASE }}
      className={cn(
        "flex flex-col rounded-2xl border bg-white p-4 transition-shadow hover:shadow-[0_8px_22px_-12px_rgba(10,38,30,0.18)]",
        nudge.tone === "warm"
          ? "border-amber-200/80"
          : "border-[#0A261E]/8"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          nudge.tone === "warm"
            ? "bg-amber-100 text-amber-700"
            : "bg-[#fffbf2] text-[#B8922A]"
        )}
      >
        <Icon size={15} strokeWidth={1.7} />
      </div>
      <h3 className="mt-3 text-[13.5px] font-semibold text-[#0A261E]">
        {nudge.title}
      </h3>
      <p className="mt-1 flex-1 text-[12px] leading-relaxed text-[#0A261E]/60">
        {nudge.description}
      </p>
      <div className="mt-3">
        <Link href={nudge.cta.href}>
          <Button variant="outline" size="sm" className="w-full justify-center">
            {nudge.cta.label}
            <ArrowUpRight size={12} />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

function ActivityRow({ event, index }: { event: ActivityEvent; index: number }) {
  const meta = activityMeta(event);

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02, ease: EASE }}
      className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-[#fffbf2]/60"
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          TONE_BADGE[meta.tone]
        )}
      >
        <meta.Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[#0A261E]">
          {meta.label}
        </p>
        <p className="text-[11px] text-[#0A261E]/45">
          {relativeShort(event.occurredAt)}
        </p>
      </div>
    </motion.li>
  );
}


function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-[#0A261E]/8 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0A261E]/15 hover:shadow-[0_6px_16px_-10px_rgba(10,38,30,0.18)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fffbf2] text-[#B8922A]">
        <Icon size={16} strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#0A261E]">{title}</p>
        <p className="text-[11.5px] text-[#0A261E]/55">{description}</p>
      </div>
      <ArrowUpRight
        size={13}
        className="text-[#0A261E]/30 transition-colors group-hover:text-[#0A261E]/60"
      />
    </Link>
  );
}
