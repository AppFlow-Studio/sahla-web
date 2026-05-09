"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Repeat,
  DollarSign,
  Mic2,
  Bell,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ConfirmInline from "../../_components/ConfirmInline";
import {
  useContent,
  useContentItem,
  useContentRsvps,
} from "../../_hooks/useContent";
import { formatUsd, relativeShort } from "../../_lib/format";
import type { ContentRsvp } from "../../_mock/programs";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "rsvps", label: "RSVPs" },
  { id: "notifications", label: "Notifications" },
  { id: "capacity", label: "Capacity" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function ContentDetailClient({ id }: { id: string }) {
  const item = useContentItem(id);
  const router = useRouter();
  const { remove } = useContent();
  const [tab, setTab] = useState<TabId>("overview");
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!item) {
    return (
      <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-12 text-center">
        <h2 className="font-display text-2xl text-[#0A261E]">Not found</h2>
        <p className="mt-2 text-[14px] text-[#0A261E]/60">
          That program or event isn't in your library.
        </p>
        <div className="mt-6">
          <Link href="/content/programs">
            <Button variant="outline">
              <ArrowLeft size={14} />
              Back to Programs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(item.startsAt);
  const isPast = startDate.getTime() < Date.now();
  const fillPct = Math.round((item.currentCount / item.maxCapacity) * 100);
  const backHref = item.kind === "program" ? "/content/programs" : "/content/events";

  return (
    <>
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[#0A261E]/55 hover:text-[#0A261E]"
        >
          <ArrowLeft size={13} />
          Back to {item.kind === "program" ? "Programs" : "Events"}
        </Link>
      </div>

      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-[#0A261E]/8 bg-white">
        <div
          className="relative aspect-[3/1] w-full bg-[#fffbf2]"
          style={{
            backgroundImage: `url(${item.imageUrl}?auto=format&fit=crop&w=1400&q=85)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#0A261E]">
                {item.category}
              </span>
              {item.isPaid && item.priceUsd ? (
                <span className="rounded-full bg-[#B8922A] px-2.5 py-0.5 text-[10.5px] font-semibold text-white">
                  {formatUsd(item.priceUsd)}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/95 px-2.5 py-0.5 text-[10.5px] font-semibold text-white">
                  Free
                </span>
              )}
              {isPast ? (
                <span className="rounded-full bg-[#0A261E]/85 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white">
                  Past
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 font-display text-3xl leading-tight text-white drop-shadow md:text-[36px]">
              {item.name}
            </h1>
            <p className="mt-1 text-[13px] text-white/85">
              with {item.speakerName}
            </p>
          </div>
        </div>
      </div>

      {/* Quick facts */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Fact icon={Calendar} label="When" value={startDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} />
        <Fact icon={Clock} label="Time" value={`${startDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · ${item.durationMin} min`} />
        <Fact icon={Users} label="Capacity" value={`${item.currentCount} / ${item.maxCapacity}`} accent={fillPct >= 80 ? "warm" : "default"} />
        <Fact
          icon={item.recurrence === "none" ? DollarSign : Repeat}
          label={item.recurrence === "none" ? "Price" : "Repeats"}
          value={
            item.recurrence === "weekly"
              ? "Weekly"
              : item.recurrence === "monthly"
              ? "Monthly"
              : item.isPaid && item.priceUsd
              ? formatUsd(item.priceUsd)
              : "Free"
          }
        />
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-[#0A261E]/8">
        <div className="flex gap-1">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative px-3 py-2.5 text-[13px] font-medium transition-colors",
                  active ? "text-[#0A261E]" : "text-[#0A261E]/55 hover:text-[#0A261E]/85"
                )}
              >
                {t.label}
                {active ? (
                  <motion.span
                    layoutId="content-detail-tab"
                    className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-[#0A261E]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab body */}
      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {tab === "overview" ? (
              <OverviewTab description={item.description} speakerName={item.speakerName} />
            ) : tab === "rsvps" ? (
              <RsvpsTab itemId={id} />
            ) : tab === "notifications" ? (
              <NotificationsTab itemName={item.name} />
            ) : (
              <CapacityTab
                current={item.currentCount}
                max={item.maxCapacity}
                fillPct={fillPct}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Danger zone */}
      <div className="mt-12 rounded-2xl border border-red-200 bg-red-50/40 p-5">
        <h3 className="text-[13px] font-semibold text-red-800">Danger zone</h3>
        <p className="mt-1 text-[12.5px] text-red-700/70">
          Removing this {item.kind} cancels every RSVP and stops scheduled
          notifications. Cannot be undone.
        </p>
        <div className="mt-4">
          {confirmRemove ? (
            <ConfirmInline
              open
              message={`Delete "${item.name}" and all ${item.currentCount} RSVPs?`}
              onConfirm={() => {
                remove(item.id);
                toast.success(`${item.name} removed`);
                router.push(backHref);
              }}
              onCancel={() => setConfirmRemove(false)}
            />
          ) : (
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 size={14} />
              Remove this {item.kind}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  accent = "default",
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  accent?: "default" | "warm";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-white p-4",
        accent === "warm" ? "border-amber-200 bg-amber-50/50" : "border-[#0A261E]/8"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          accent === "warm" ? "bg-amber-200/60 text-amber-700" : "bg-[#0A261E]/8 text-[#0A261E]/65"
        )}
      >
        <Icon size={15} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-[#0A261E]">{value}</p>
      </div>
    </div>
  );
}

function OverviewTab({
  description,
  speakerName,
}: {
  description: string;
  speakerName: string;
}) {
  return (
    <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B8922A]">
        Description
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#0A261E]/80">
        {description || "No description was added when this was published."}
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-[#0A261E]/6 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A261E]/8">
          <Mic2 size={15} className="text-[#0A261E]/65" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
            Speaker
          </p>
          <p className="text-[14px] font-semibold text-[#0A261E]">{speakerName}</p>
        </div>
      </div>
    </div>
  );
}

function RsvpsTab({ itemId }: { itemId: string }) {
  const rsvps = useContentRsvps(itemId);
  const [filter, setFilter] = useState<ContentRsvp["status"] | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? rsvps : rsvps.filter((r) => r.status === filter)),
    [rsvps, filter]
  );

  const counts = useMemo(() => {
    const c: Record<ContentRsvp["status"] | "all", number> = {
      all: rsvps.length,
      reserved: 0,
      paid: 0,
      attended: 0,
      waitlisted: 0,
      canceled: 0,
    };
    for (const r of rsvps) c[r.status] += 1;
    return c;
  }, [rsvps]);

  return (
    <div className="rounded-2xl border border-[#0A261E]/8 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#0A261E]/6 p-2">
        {[
          { id: "all" as const, label: "All" },
          { id: "reserved" as const, label: "Reserved" },
          { id: "paid" as const, label: "Paid" },
          { id: "attended" as const, label: "Attended" },
          { id: "waitlisted" as const, label: "Waitlist" },
          { id: "canceled" as const, label: "Canceled" },
        ].map((opt) => {
          const active = filter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilter(opt.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                active
                  ? "bg-[#0A261E] text-white"
                  : "text-[#0A261E]/65 hover:bg-[#0A261E]/[0.05]"
              )}
            >
              {opt.label}
              <span className={cn("ml-1.5 tabular-nums", active ? "text-white/60" : "text-[#0A261E]/40")}>
                {counts[opt.id]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="px-6 py-12 text-center text-[13px] text-[#0A261E]/55">
          {filter === "all"
            ? "No RSVPs yet — share the link in your community to get the first signups."
            : `No ${filter} RSVPs.`}
        </p>
      ) : (
        <ul className="divide-y divide-[#0A261E]/6">
          {filtered.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#fffbf2]/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A261E]/8 text-[11.5px] font-semibold text-[#0A261E]/70">
                {r.memberInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-[#0A261E]">
                  {r.memberName}
                </p>
                <p className="text-[11.5px] text-[#0A261E]/55">
                  Reserved {relativeShort(r.reservedAt)}
                </p>
              </div>
              <RsvpStatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RsvpStatusBadge({ status }: { status: ContentRsvp["status"] }) {
  const map: Record<
    ContentRsvp["status"],
    { label: string; cls: string; icon: React.ReactNode }
  > = {
    reserved: {
      label: "Reserved",
      cls: "bg-[#0A261E]/[0.06] text-[#0A261E]/70",
      icon: <CircleDashed size={11} />,
    },
    paid: {
      label: "Paid",
      cls: "bg-emerald-50 text-emerald-700",
      icon: <DollarSign size={11} />,
    },
    attended: {
      label: "Attended",
      cls: "bg-emerald-50 text-emerald-700",
      icon: <CheckCircle2 size={11} />,
    },
    waitlisted: {
      label: "Waitlist",
      cls: "bg-amber-50 text-amber-700",
      icon: <CircleDashed size={11} />,
    },
    canceled: {
      label: "Canceled",
      cls: "bg-red-50 text-red-600",
      icon: <XCircle size={11} />,
    },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        m.cls
      )}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function NotificationsTab({ itemName }: { itemName: string }) {
  const [title, setTitle] = useState(`Reminder: ${itemName}`);
  const [body, setBody] = useState(
    `Just a friendly reminder — see you soon, in shaa Allah.`
  );

  return (
    <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
        <h3 className="text-[14px] font-semibold text-[#0A261E]">
          Send a reminder to RSVPs
        </h3>
        <p className="mt-1 text-[12.5px] text-[#0A261E]/55">
          Pings every member who has RSVP&apos;d (and isn&apos;t canceled). Auto-saved.
        </p>
        <div className="mt-4 space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
          />
          <Textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body"
          />
          <div className="flex justify-end">
            <Button
              onClick={() =>
                toast.success(
                  "Notification queued — would send to RSVPs now (demo).",
                  { description: title }
                )
              }
            >
              <Bell size={14} />
              Send now
            </Button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
        <h3 className="text-[13px] font-semibold text-[#0A261E]">Auto-reminders</h3>
        <p className="mt-1 text-[11.5px] text-[#0A261E]/55">
          Scheduled before each occurrence.
        </p>
        <ul className="mt-3 space-y-2 text-[12.5px] text-[#0A261E]/75">
          <li className="flex items-center justify-between rounded-lg bg-[#fffbf2] px-3 py-2">
            24h before <span className="text-[#0A261E]/45">On</span>
          </li>
          <li className="flex items-center justify-between rounded-lg bg-[#fffbf2] px-3 py-2">
            1h before <span className="text-[#0A261E]/45">On</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function CapacityTab({
  current,
  max,
  fillPct,
}: {
  current: number;
  max: number;
  fillPct: number;
}) {
  const remaining = Math.max(0, max - current);
  return (
    <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Stat label="Reserved" value={`${current}`} />
        <Stat label="Remaining" value={`${remaining}`} />
        <Stat label="Filled" value={`${fillPct}%`} />
      </div>
      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-[#0A261E]/[0.06]">
          <motion.div
            className={cn(
              "h-full rounded-full",
              fillPct >= 100
                ? "bg-amber-500"
                : fillPct >= 80
                ? "bg-emerald-500"
                : "bg-[#0A261E]/40"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, fillPct)}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </div>
        <p className="mt-3 text-[12px] text-[#0A261E]/55">
          {fillPct >= 100
            ? "At capacity — new RSVPs join the waitlist."
            : fillPct >= 80
            ? "Filling up. Consider increasing capacity if you can."
            : "Plenty of room. Promote in your community to fill seats."}
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
        {label}
      </p>
      <p className="mt-1 font-display text-[28px] leading-none text-[#0A261E]">
        {value}
      </p>
    </div>
  );
}
