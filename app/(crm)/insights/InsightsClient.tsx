"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Lightbulb,
  Users,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "../_components/PageHeader";
import { useCommunityInsights } from "../_hooks/useCommunityInsights";
import type {
  Bucket,
  ContentPerformance,
  Suggestion,
} from "@/app/api/crm/insights/shared";

/**
 * Community Overview.
 *
 * Written for older adults and for people whose first language isn't English:
 * one idea per line, common words, no idioms, and every number says what it
 * counts. Type sizes match the rest of the CRM; readability comes from darker
 * secondary text (/70-/80, not the /45-/55 used elsewhere) rather than from
 * scaling everything up.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const DARK = "#0A261E";
const TRACK = "#E7E1D2";
const GENDER_COLORS: Record<string, string> = {
  Male: DARK,
  Female: "var(--mosque-accent, #B8922A)",
  Other: "#7FAE94",
};

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** "No class scheduled" / "1 class scheduled" / "3 classes scheduled". */
function scheduledLabel(n: number): string {
  if (n === 0) return "No class scheduled";
  return `${n} ${plural(n, "class", "classes")} scheduled`;
}

export default function InsightsClient() {
  const { data, isLoading, isError } = useCommunityInsights();

  const genderTotal = data.gender.reduce((s, g) => s + g.count, 0);
  const ageTotal = data.ageBands.reduce((s, b) => s + b.count, 0);
  const childTotal = data.childAges.reduce((s, b) => s + b.count, 0);
  const topInterest = data.interests[0]?.members ?? 0;
  const lifeTotal = data.lifeStages.reduce((s, b) => Math.max(s, b.count), 0);
  const topSaved = data.performance.reduce((s, p) => Math.max(s, p.saved), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Community Overview"
        description="See what your community wants and what you can do next."
      />

      {isError ? (
        <Card>
          <p className="text-[14px] text-[#0A261E]/80">
            We could not load this page. Please refresh the page to try again.
          </p>
        </Card>
      ) : null}

      {/* ---- 1. What to do next. ---- */}
      <Section
        title="Suggested Next Programs"
        subtitle="Based on what your members said they want."
      >
        {isLoading ? (
          <SkeletonRows count={3} />
        ) : data.suggestions.length === 0 ? (
          <Card>
            <p className="text-[14px] leading-relaxed text-[#0A261E]/80">
              No suggestions yet. We show suggestions once at least{" "}
              <strong className="font-semibold text-[#0A261E]">5 people</strong> fill in
              their interests in the app. We hide smaller groups to protect privacy.
            </p>
          </Card>
        ) : (
          <ol className="space-y-3">
            {data.suggestions.map((s, i) => (
              <SuggestionCard key={s.id} suggestion={s} index={i} />
            ))}
          </ol>
        )}
      </Section>

      {/* ---- 2. The four headline numbers. ---- */}
      <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Total Members" value={data.totalMembers} />
        <Tile label="New Members This Month" value={data.newThisMonth} tone="gain" />
        <Tile label="Classes / Programs" value={data.programCount} />
        <Tile label="Events" value={data.eventCount} />
      </div>

      {/* ---- 3. Who they are. ---- */}
      <Section title="Who Is In Your Community" subtitle="Based on what members told the app.">
        <Card>
          <div className="grid gap-9 md:grid-cols-2">
            <div>
              <SubLabel>Age Groups</SubLabel>
              {data.ageBands.length === 0 ? (
                <NotEnough />
              ) : (
                <BarList rows={data.ageBands} total={ageTotal} color={DARK} className="mt-3" />
              )}
            </div>

            <div>
              <SubLabel>Gender</SubLabel>
              {data.gender.length === 0 ? (
                <NotEnough />
              ) : (
                <div className="mt-3">
                  <div
                    className="flex h-3.5 w-full overflow-hidden rounded-full"
                    style={{ background: TRACK }}
                  >
                    {data.gender.map((g) => (
                      <div
                        key={g.label}
                        style={{
                          width: `${pct(g.count, genderTotal)}%`,
                          background: GENDER_COLORS[g.label] ?? DARK,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                    {data.gender.map((g) => (
                      <span
                        key={g.label}
                        className="inline-flex items-center gap-1.5 text-[#0A261E]/80"
                      >
                        <Dot color={GENDER_COLORS[g.label] ?? DARK} />
                        {g.label}: {g.count} {plural(g.count, "person", "people")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-10">
                <MiniStat
                  label="Have Children"
                  display={
                    data.answeredKids > 0 ? `${pct(data.families, data.answeredKids)}%` : "Not enough data"
                  }
                  help={
                    data.answeredKids > 0
                      ? `${data.families} of ${data.answeredKids} who answered`
                      : undefined
                  }
                />
                <MiniStat
                  label="New Muslims"
                  display={
                    data.answeredRevert > 0
                      ? `${pct(data.reverts, data.answeredRevert)}%`
                      : "Not enough data"
                  }
                  help={
                    data.answeredRevert > 0
                      ? `${data.reverts} of ${data.answeredRevert} who answered`
                      : undefined
                  }
                  tone="gold"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#0A261E]/8 pt-5">
            <SubLabel>Stage Of Life</SubLabel>
            {data.lifeStages.length === 0 ? (
              <NotEnough />
            ) : (
              <BarList
                rows={data.lifeStages}
                total={lifeTotal}
                color={DARK}
                display="count"
                labelWidth="w-36"
                className="mt-3"
              />
            )}
          </div>

          {data.childAges.length > 0 ? (
            <div className="mt-6 border-t border-[#0A261E]/8 pt-5">
              <SubLabel>Ages Of Their Children</SubLabel>
              <BarList
                rows={data.childAges}
                total={childTotal}
                color="var(--mosque-accent, #B8922A)"
                className="mt-3"
              />
            </div>
          ) : null}

          <Footnote>
            This comes from what members fill in when they set up the app. We hide any
            group with fewer than 5 people to protect privacy.
          </Footnote>
        </Card>
      </Section>

      {/* ---- 4. What they want. ---- */}
      <Section title="Popular Topics" subtitle="Topics your community is interested in.">
        <Card>
          {data.interests.length === 0 ? (
            <p className="text-[14px] leading-relaxed text-[#0A261E]/80">
              {data.interestsUnanswered
                ? "Nobody has chosen their topics in the app yet. This page will fill in as members set up the app."
                : "Not enough people have chosen topics yet. We hide any group with fewer than 5 people."}
            </p>
          ) : (
            <ul className="divide-y divide-[#0A261E]/8">
              {data.interests.map((i) => (
                <li key={i.key} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <p className="text-[13.5px] font-medium text-[#0A261E]">{i.name}</p>
                    <div className="flex items-center gap-3">
                      <IconLine icon={Users} text={`${i.members} interested`} />
                      <ScheduledChip count={i.offerings} />
                    </div>
                  </div>
                  <div
                    className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
                    style={{ background: TRACK }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct(i.members, topInterest)}%` }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="h-full rounded-full"
                      style={{ background: DARK }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data.interestsTotal > data.interests.length ? (
            <p className="mt-4 border-t border-[#0A261E]/8 pt-3.5 text-[12px] text-[#0A261E]/70">
              Showing the top {data.interests.length} of {data.interestsTotal} topics.
            </p>
          ) : null}
        </Card>
      </Section>

      {/* ---- 5. How the calendar is doing. ---- */}
      <Section
        title="How Programs Are Doing"
        subtitle="See how people responded to your programs and events."
      >
        <Card>
          {data.engagementUnanswered ? (
            <p className="text-[14px] leading-relaxed text-[#0A261E]/80">
              {data.contentTotal === 0
                ? "You have no programs or events yet. Add your first one to see how people respond."
                : "Nobody has saved a program or asked for a reminder yet. This page will fill in as members use the app."}
            </p>
          ) : (
            <>
              <ul className="space-y-4">
                {data.performance.map((item) => (
                  <PerformanceRow key={item.id} item={item} topSaved={topSaved} />
                ))}
              </ul>

              {data.quietCount > 0 ? (
                <div className="mt-6 border-t border-[#0A261E]/8 pt-4">
                  <p className="text-[13.5px] font-medium text-[#0A261E]">
                    {data.quietCount} of {data.contentTotal} programs and events have no
                    interest yet.
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#0A261E]/75">
                    <Bell size={13} strokeWidth={2} className="shrink-0 text-[#0A261E]/60" />
                    Try sending a reminder.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </Section>
    </div>
  );
}

/* ----------------------------- sub-components ----------------------------- */

function SuggestionCard({ suggestion, index }: { suggestion: Suggestion; index: number }) {
  const isEvent = suggestion.kind === "event";
  const href = isEvent ? "/content/events" : "/content/programs";
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE, delay: index * 0.04 }}
      className="flex flex-col gap-3 rounded-2xl border border-[#0A261E]/8 border-l-[3px] border-l-[var(--mosque-accent,#B8922A)] bg-white p-5 sm:flex-row sm:items-center sm:gap-5"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fdf3da]"
      >
        <Lightbulb size={16} strokeWidth={2} className="text-[var(--mosque-accent,#B8922A)]" />
      </span>

      {/* One idea per line: what it is, who wants it, what is missing. */}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-[#0A261E]">
          {suggestion.title}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-[#0A261E]/80">
          <Users size={13} strokeWidth={2} className="shrink-0 text-[#0A261E]/60" />
          {suggestion.demand}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-[#0A261E]/80">
          <CalendarDays size={13} strokeWidth={2} className="shrink-0 text-[#0A261E]/60" />
          {suggestion.gap}
        </p>
      </div>

      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-[var(--mosque-primary,#0A261E)] px-3.5 py-2 text-[13px] font-medium text-[var(--mosque-primary-fg,#fffbf2)] transition-opacity hover:opacity-90 sm:self-auto"
      >
        {isEvent ? "Schedule Event" : "Schedule Class"}
        <ArrowUpRight size={14} />
      </Link>
    </motion.li>
  );
}

function PerformanceRow({
  item,
  topSaved,
}: {
  item: ContentPerformance;
  topSaved: number;
}) {
  const isEvent = item.type.toLowerCase() === "event";
  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#0A261E]">
          {item.name}
        </p>
        <TypePill type={item.type} />
      </div>

      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: TRACK }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${topSaved > 0 ? (item.saved / topSaved) * 100 : 0}%` }}
          transition={{ duration: 0.5, ease: EASE }}
          className="h-full rounded-full"
          style={{ background: DARK }}
        />
      </div>

      {/* Each number says what it counts — no bare figures. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <IconLine icon={Users} text={`${item.saved} interested`} />
        {item.reminders > 0 ? (
          <IconLine
            icon={Bell}
            text={
              item.reminders === 1
                ? "1 wants a reminder"
                : `${item.reminders} want reminders`
            }
          />
        ) : null}
        {item.dropped > 0 ? (
          <IconLine icon={UserMinus} text={`${item.dropped} removed it`} />
        ) : null}
      </div>

      {item.losingInterest ? (
        <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#fdf8ec] px-2.5 py-1.5 text-[12.5px] font-medium text-[#8a6d1f]">
          <AlertTriangle size={13} strokeWidth={2} className="shrink-0" />
          More people removed this {isEvent ? "event" : "program"} than saved it.
        </p>
      ) : null}
    </li>
  );
}

/** An icon with its meaning spelled out. The text always carries the message. */
function IconLine({
  icon: Icon,
  text,
}: {
  icon: typeof Users;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#0A261E]/80">
      <Icon size={13} strokeWidth={2} className="shrink-0 text-[#0A261E]/60" />
      {text}
    </span>
  );
}

function ScheduledChip({ count }: { count: number }) {
  const none = count === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        none ? "bg-[#fdf3da] text-[#8a6d1f]" : "bg-[#0A261E]/[0.06] text-[#0A261E]/80"
      )}
    >
      <CalendarDays size={11} strokeWidth={2.25} className="shrink-0" />
      {scheduledLabel(count)}
    </span>
  );
}

function BarList({
  rows,
  total,
  color,
  className,
  /**
   * "percent" for groups that split the members up (age, children's ages).
   * "count" for answers where one person can be in two groups, such as stage of
   * life — percentages there would add up to more than 100.
   */
  display = "percent",
  labelWidth = "w-16",
}: {
  rows: Bucket[];
  total: number;
  color: string;
  className?: string;
  display?: "percent" | "count";
  labelWidth?: string;
}) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {rows.map((b) => (
        <li key={b.label} className="flex items-center gap-3">
          <span className={cn("shrink-0 truncate text-[12px] text-[#0A261E]/75", labelWidth)}>
            {b.label}
          </span>
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full"
            style={{ background: TRACK }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct(b.count, total)}%` }}
              transition={{ duration: 0.5, ease: EASE }}
              className="h-full rounded-full"
              style={{ background: color }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-[#0A261E]/75">
            {display === "count" ? b.count : `${pct(b.count, total)}%`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-[21px] leading-tight text-[#0A261E]">{title}</h2>
      {subtitle ? (
        <p className="mb-4 mt-1 max-w-2xl text-[13.5px] leading-relaxed text-[#0A261E]/75">
          {subtitle}
        </p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 md:p-6">
      {children}
    </article>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "gain";
}) {
  return (
    <div className="rounded-2xl bg-[#f6f1e4] p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/65">
        {label}
      </p>
      <div
        className={cn(
          "mt-2 flex items-baseline font-display text-[30px] leading-none",
          tone === "gain" && value > 0 ? "text-emerald-700" : "text-[#0A261E]"
        )}
      >
        {/* No "+" on zero — "+0" reads as a change when nothing changed. */}
        {tone === "gain" && value > 0 ? <span>+</span> : null}
        <NumberFlow value={value} format={{ maximumFractionDigits: 0 }} />
      </div>
    </div>
  );
}

function TypePill({ type }: { type: string }) {
  const isEvent = type.toLowerCase() === "event";
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
        isEvent ? "bg-[#fdf3da] text-[#8a6d1f]" : "bg-emerald-50 text-emerald-800"
      )}
    >
      {isEvent ? "Event" : "Program"}
    </span>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/65">
      {children}
    </p>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-[3px]"
      style={{ background: color }}
    />
  );
}

function MiniStat({
  label,
  display,
  help,
  tone,
}: {
  label: string;
  display: string;
  help?: string;
  tone?: "gold";
}) {
  const noData = display === "Not enough data";
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/65">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display leading-none",
          noData ? "text-[13px] text-[#0A261E]/60" : "text-[24px]",
          !noData && tone === "gold" ? "text-[var(--mosque-accent,#B8922A)]" : "",
          !noData && tone !== "gold" ? "text-[#0A261E]" : ""
        )}
      >
        {display}
      </p>
      {help ? <p className="mt-1 text-[11.5px] text-[#0A261E]/70">{help}</p> : null}
    </div>
  );
}

function NotEnough() {
  return (
    <p className="mt-3 text-[13px] text-[#0A261E]/70">
      Not enough answers yet. We hide any group with fewer than 5 people.
    </p>
  );
}

function Footnote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 flex items-start gap-1.5 border-t border-[#0A261E]/8 pt-4 text-[11.5px] leading-relaxed text-[#0A261E]/70">
      <Users size={13} strokeWidth={2} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[104px] animate-pulse rounded-2xl border border-[#0A261E]/8 bg-white"
        />
      ))}
    </div>
  );
}
