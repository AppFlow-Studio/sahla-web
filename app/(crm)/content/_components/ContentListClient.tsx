"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Calendar,
  Users,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "../../_components/PageHeader";
import EmptyState from "../../_components/EmptyState";
import StatCard from "../../_components/StatCard";
import { useContent, type ContentItem } from "../../_hooks/useContent";
import { formatUsd } from "../../_lib/format";
import CreateContentWizard from "../_wizard/CreateContentWizard";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  kind: "program" | "event";
};

export default function ContentListClient({ kind }: Props) {
  const { data: items } = useContent(kind);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let rows = items;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.speakerName.toLowerCase().includes(q)
      );
    }
    return rows.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
  }, [items, query]);

  const stats = useMemo(() => {
    const upcoming = items.filter((i) => new Date(i.startsAt).getTime() > Date.now()).length;
    const totalSeats = items.reduce((acc, i) => acc + i.maxCapacity, 0);
    const totalRsvps = items.reduce((acc, i) => acc + i.currentCount, 0);
    const fillRate = totalSeats > 0 ? Math.round((totalRsvps / totalSeats) * 100) : 0;
    return { upcoming, totalRsvps, fillRate };
  }, [items]);

  const isEmpty = items.length === 0;
  const noResults = !isEmpty && filtered.length === 0;
  const isProgram = kind === "program";

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title={isProgram ? "Programs" : "Events"}
        description={
          isProgram
            ? "Recurring classes, halaqas, and study circles. Capacity, paid signup, per-class RSVPs."
            : "One-off events with RSVPs — fundraisers, dinners, eid prayers, community gatherings."
        }
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            New {kind}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Upcoming" value={stats.upcoming} />
        <StatCard label="Total RSVPs" value={stats.totalRsvps} />
        <StatCard label="Fill rate" value={stats.fillRate} suffix="%" />
      </div>

      {isEmpty ? (
        <EmptyState
          title={isProgram ? "No programs yet" : "No events scheduled"}
          description={
            isProgram
              ? "Create your first program — a 5-step wizard walks you through name, schedule, capacity, image, and review."
              : "Schedule your first event — same 5-step wizard. Members can RSVP from your app within minutes of you publishing."
          }
          ghostRowCaption={
            isProgram
              ? "Friday Halaqa · Sheikh Omar Suleiman · 60 / 80 seats"
              : "Annual Fundraiser Dinner · Sat May 18 · 200 / 250 seats"
          }
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              Create your first {kind}
            </Button>
          }
        />
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
              <div className="relative max-w-md flex-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or speaker…"
                  className="pl-9"
                />
              </div>
            </div>
            <p className="text-[12.5px] text-[#0A261E]/55">
              {filtered.length} of {items.length}
            </p>
          </div>

          {noResults ? (
            <div className="rounded-2xl border border-[#0A261E]/8 bg-white px-6 py-16 text-center">
              <p className="text-[13.5px] text-[#0A261E]/60">
                Nothing matches your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {filtered.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: EASE }}
                  >
                    <ContentCard item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      <CreateContentWizard
        open={createOpen}
        onOpenChange={setCreateOpen}
        kind={kind}
      />
    </>
  );
}

function ContentCard({ item }: { item: ContentItem }) {
  const fillPct = Math.min(
    100,
    Math.round((item.currentCount / item.maxCapacity) * 100)
  );
  const fillTone =
    fillPct >= 100
      ? "bg-amber-500"
      : fillPct >= 80
      ? "bg-emerald-500"
      : "bg-[#0A261E]/40";

  const date = new Date(item.startsAt);
  const isUpcoming = date.getTime() > Date.now();
  const detailHref = `/content/${item.kind === "program" ? "programs" : "events"}/${item.id}`;

  return (
    <Link
      href={detailHref}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(10,38,30,0.18)]"
    >
      <div
        className="relative aspect-[16/9] w-full overflow-hidden bg-[#fffbf2]"
        style={{
          backgroundImage: `url(${item.imageUrl}?auto=format&fit=crop&w=600&q=80)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {item.category ? (
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#0A261E] backdrop-blur">
              {item.category}
            </span>
          ) : null}
          {item.isPaid && item.priceUsd ? (
            <span className="rounded-full bg-[#B8922A]/95 px-2 py-0.5 text-[10.5px] font-semibold text-white">
              {formatUsd(item.priceUsd)}
            </span>
          ) : null}
        </div>
        <ArrowUpRight
          size={16}
          className="absolute right-3 top-3 text-white/0 transition-colors group-hover:text-white"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 font-display text-[18px] leading-tight text-[#0A261E] group-hover:text-[#0A261E]/85">
          {item.name}
        </h3>
        <p className="line-clamp-1 mt-0.5 text-[12px] text-[#0A261E]/55">
          with {item.speakerName}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px]">
          <Meta icon={<Calendar size={11} />} label={
            date.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          } tone={isUpcoming ? "default" : "muted"} />
          <Meta
            icon={<Clock size={11} />}
            label={date.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          />
          <Meta
            icon={<Users size={11} />}
            label={`${item.currentCount}/${item.maxCapacity}`}
          />
          <Meta
            icon={<RecurrenceIcon recurrence={item.recurrence} />}
            label={
              item.recurrence === "weekly"
                ? "Weekly"
                : item.recurrence === "monthly"
                ? "Monthly"
                : "Once"
            }
          />
        </div>

        {/* Capacity bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-[#0A261E]/45">Filled</span>
            <span className={cn(
              "font-semibold tabular-nums",
              fillPct >= 100 ? "text-amber-700" : fillPct >= 80 ? "text-emerald-700" : "text-[#0A261E]/55"
            )}>
              {fillPct}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#0A261E]/[0.06]">
            <div
              className={cn("h-full rounded-full transition-all", fillTone)}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function Meta({
  icon,
  label,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "muted";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        tone === "default" ? "text-[#0A261E]/75" : "text-[#0A261E]/40"
      )}
    >
      <span className="text-[#0A261E]/40">{icon}</span>
      {label}
    </div>
  );
}

function RecurrenceIcon({ recurrence }: { recurrence: ContentItem["recurrence"] }) {
  if (recurrence === "none") return <span aria-hidden>·</span>;
  return <span aria-hidden>↻</span>;
}
