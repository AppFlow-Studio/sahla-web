"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Send, Users, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemberInsights } from "../../_hooks/useMemberInsights";
import { SEGMENTS, type SegmentKey } from "@/app/api/crm/members/insights/shared";

const EASE = [0.16, 1, 0.3, 1] as const;
const DARK = "#0A261E";
const GOLD = "#B8922A";
const TRACK = "#E7E1D2";
// Dark → light greens for the age distribution.
const AGE_COLORS = ["#0A261E", "#1E4D3A", "#356A50", "#548C6E", "#83AE95", "#B4D0C0"];
// Zero-count rows so the age bar chart still renders its bands when there's no data.
const AGE_BAND_PLACEHOLDER = ["13-17", "18-24", "25-34", "35-49", "50-64", "65+"].map(
  (band) => ({ band, count: 0 })
);
const GENDER_COLORS: Record<string, string> = {
  Male: DARK,
  Female: GOLD,
  Other: "#7FAE94",
};

// Deep-link draft for the re-engagement nudge. The composer prefills from these
// params; sending happens there (read-only analytics, per spec).
const NUDGE_TITLE = "You're missing new programs";
const NUDGE_BODY =
  "Turn on program alerts in the app so you never miss a new halaqa, class, or event at the masjid.";
const NUDGE_HREF = `/setup/notifications?title=${encodeURIComponent(
  NUDGE_TITLE
)}&body=${encodeURIComponent(NUDGE_BODY)}`;

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export default function MemberInsights() {
  const [segment, setSegment] = useState<SegmentKey>("all");
  const { data, isLoading } = useMemberInsights(segment);
  const [chartMode, setChartMode] = useState<"bar" | "pie">("bar");

  const activeSegment = SEGMENTS.find((s) => s.key === segment) ?? SEGMENTS[0];
  const total = data.totalMembers;
  const genderTotal = data.gender.reduce((s, g) => s + g.count, 0);
  const ageTotal = data.ageBands.reduce((s, b) => s + b.count, 0);

  return (
    <section className="mb-10">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] leading-tight text-[#0A261E]">
            Member insights
          </h2>
          <p className="mt-1 text-[13.5px] text-[#0A261E]/60">
            What your community looks like, what it wants, and who you can reach.
          </p>
        </div>
      </div>

      {/* Group selector */}
      <div className="flex flex-wrap gap-2">
        {SEGMENTS.map((s) => {
          const selected = s.key === segment;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSegment(s.key)}
              aria-pressed={selected}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                selected
                  ? "border-[#0A261E] bg-[#0A261E] text-white"
                  : "border-[#0A261E]/15 bg-white text-[#0A261E]/75 hover:border-[#0A261E]/30 hover:text-[#0A261E]"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="mb-4 mt-2.5 text-[12.5px] text-[#0A261E]/55">
        Showing {activeSegment.label} ·{" "}
        <span className="tabular-nums">{total}</span>{" "}
        {total === 1 ? "member" : "members"}
      </p>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Members" value={total} />
        <StatTile label="New this month" value={data.newThisMonth} prefix="+" tone="gain" />
        <StatTile label="Push enabled" value={pct(data.pushEnabled, total)} suffix="%" naIf={total === 0} />
        <StatTile
          label="Profile complete"
          value={pct(data.profileComplete, total)}
          suffix="%"
          naIf={total === 0}
        />
      </div>

      {isLoading ? (
        <LoadingInsights />
      ) : (
        <div className="mt-4 space-y-4">
          {/* Who your members are */}
          <article className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-[#0A261E]">
                Who your members are
              </h3>
              <ChartToggle mode={chartMode} onChange={setChartMode} />
            </div>

            <div className="mt-5 grid gap-8 md:grid-cols-2">
              {/* Gender */}
              <div>
                <SubLabel>Gender</SubLabel>
                {chartMode === "pie" ? (
                  <div className="mt-3 flex items-center gap-5">
                    <Donut
                      size={132}
                      data={data.gender.map((g) => ({
                        value: g.count,
                        color: GENDER_COLORS[g.label] ?? DARK,
                      }))}
                    />
                    <ul className="space-y-1.5 text-[13px]">
                      {data.gender.map((g) => (
                        <LegendRow
                          key={g.label}
                          color={GENDER_COLORS[g.label] ?? DARK}
                          label={g.label}
                          value={`${pct(g.count, genderTotal)}%`}
                        />
                      ))}
                    </ul>
                  </div>
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
                          className="inline-flex items-center gap-1.5 text-[#0A261E]/75"
                        >
                          <Dot color={GENDER_COLORS[g.label] ?? DARK} /> {g.label}{" "}
                          {pct(g.count, genderTotal)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Age groups */}
              <div>
                <SubLabel>Age groups</SubLabel>
                {chartMode === "pie" ? (
                  <div className="mt-3 flex items-center gap-5">
                    <Donut
                      size={132}
                      data={data.ageBands.map((b, i) => ({
                        value: b.count,
                        color: AGE_COLORS[i % AGE_COLORS.length],
                      }))}
                    />
                    <ul className="space-y-1 text-[12.5px]">
                      {data.ageBands.map((b, i) => (
                        <LegendRow
                          key={b.band}
                          color={AGE_COLORS[i % AGE_COLORS.length]}
                          label={b.band}
                          value={`${pct(b.count, ageTotal)}%`}
                        />
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {(data.ageBands.length > 0
                      ? data.ageBands
                      : AGE_BAND_PLACEHOLDER
                    ).map((b) => (
                      <li key={b.band} className="flex items-center gap-3">
                        <span className="w-11 shrink-0 text-[12px] tabular-nums text-[#0A261E]/60">
                          {b.band}
                        </span>
                        <div
                          className="h-2.5 flex-1 overflow-hidden rounded-full"
                          style={{ background: TRACK }}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct(b.count, ageTotal)}%` }}
                            transition={{ duration: 0.5, ease: EASE }}
                            className="h-full rounded-full"
                            style={{ background: DARK }}
                          />
                        </div>
                        <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-[#0A261E]/70">
                          {pct(b.count, ageTotal)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* New Muslims / Families */}
            <div className="mt-6 flex gap-10 border-t border-[#0A261E]/8 pt-5">
              <MiniStat
                label="New Muslims"
                display={data.answeredRevert > 0 ? `${pct(data.reverts, data.answeredRevert)}%` : "N/A"}
                tone="gold"
              />
              <MiniStat
                label="Families"
                display={data.answeredKids > 0 ? `${pct(data.families, data.answeredKids)}%` : "N/A"}
              />
            </div>

            <p className="mt-5 flex items-start gap-1.5 border-t border-[#0A261E]/8 pt-4 text-[11.5px] text-[#0A261E]/45">
              <Users size={13} className="mt-px shrink-0" />
              From member personalization. Aggregated — any group under 5 is hidden.
            </p>
          </article>

          {/* Notifications — who's reachable */}
          <article className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 md:p-6">
            <h3 className="text-[15px] font-semibold text-[#0A261E]">
              Notifications — who&apos;s reachable
            </h3>
            <div className="mt-5 space-y-4">
              <ReachBar label="Program notifications on" count={data.programOn} total={total} />
              <ReachBar label="Event notifications on" count={data.eventOn} total={total} />
              <ReachBar label="Prayer notifications on" count={data.prayerOn} total={total} />
            </div>

            {data.programMissing > 0 ? (
              <div className="mt-5 flex flex-col gap-3 rounded-xl border-l-[3px] border-[#B8922A] bg-[#fdf8ec] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#8a6d1f]">
                    Members not getting program alerts
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[#0A261E]/60">
                    <span className="font-display text-[18px] text-[#0A261E]">
                      {data.programMissing}
                    </span>{" "}
                    · {pct(data.programMissing, total)}% of members
                  </p>
                </div>
                <Link
                  href={NUDGE_HREF}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#0A261E]/15 bg-white px-3.5 py-2 text-[13px] font-medium text-[#0A261E] transition-colors hover:bg-[#0A261E]/[0.04]"
                >
                  <Send size={14} />
                  Draft a nudge
                  <ArrowUpRight size={14} className="text-[#0A261E]/45" />
                </Link>
              </div>
            ) : null}
          </article>

          {/* Most popular programs & events */}
          {data.popular.length > 0 ? (
            <article className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 md:p-6">
              <h3 className="text-[15px] font-semibold text-[#0A261E]">
                Most popular programs &amp; events
              </h3>
              <ol className="mt-4 divide-y divide-[#0A261E]/6">
                {data.popular.map((item, i) => {
                  const isEvent = item.type.toLowerCase() === "event";
                  return (
                    <li key={`${item.name}-${i}`} className="flex items-center gap-3 py-2.5">
                      <span className="w-4 shrink-0 text-[12.5px] tabular-nums text-[#0A261E]/40">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] text-[#0A261E]">
                        {item.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
                          isEvent
                            ? "bg-[#fdf3da] text-[#8a6d1f]"
                            : "bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {isEvent ? "Event" : "Program"}
                      </span>
                      <span className="w-16 shrink-0 text-right text-[13px] tabular-nums text-[#0A261E]/65">
                        {item.saves} {item.saves === 1 ? "save" : "saves"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </article>
          ) : null}

        </div>
      )}
    </section>
  );
}

/* ----------------------------- sub-components ----------------------------- */

function StatTile({
  label,
  value,
  prefix = "",
  suffix = "",
  tone,
  naIf = false,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  tone?: "gain";
  naIf?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-[#f6f1e4] p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/50">
        {label}
      </p>
      <div
        className={cn(
          "mt-2 flex items-baseline font-display text-[30px] leading-none",
          tone === "gain" ? "text-emerald-700" : "text-[#0A261E]"
        )}
      >
        {naIf ? (
          <span className="text-[#0A261E]/35">N/A</span>
        ) : (
          <>
            {prefix ? <span>{prefix}</span> : null}
            <NumberFlow value={value} format={{ maximumFractionDigits: 0 }} />
            {suffix ? <span>{suffix}</span> : null}
          </>
        )}
      </div>
    </div>
  );
}

function ChartToggle({
  mode,
  onChange,
}: {
  mode: "bar" | "pie";
  onChange: (m: "bar" | "pie") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[#0A261E]/10 bg-[#f6f1e4] p-0.5">
      {(["bar", "pie"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={cn(
            "rounded-md px-3 py-1 text-[12px] font-medium capitalize transition-colors",
            mode === m ? "bg-[#0A261E] text-white" : "text-[#0A261E]/60 hover:text-[#0A261E]"
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function Donut({
  size,
  data,
}: {
  size: number;
  data: { value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const stroke = size * 0.22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total === 0 ? (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
        ) : (
          data
            .filter((d) => d.value > 0)
            .map((d, i) => {
              const frac = d.value / total;
              const dash = frac * c;
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-acc * c}
                />
              );
              acc += frac;
              return el;
            })
        )}
      </g>
    </svg>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <li className="flex items-center gap-2 text-[#0A261E]/75">
      <Dot color={color} />
      <span className="text-[#0A261E]/65">{label}</span>
      <span className="ml-auto pl-3 font-medium tabular-nums text-[#0A261E]">{value}</span>
    </li>
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

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/45">
      {children}
    </p>
  );
}

function MiniStat({
  label,
  display,
  tone,
}: {
  label: string;
  display: string;
  tone?: "gold";
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display text-[24px] leading-none",
          display === "N/A"
            ? "text-[#0A261E]/35"
            : tone === "gold"
            ? "text-[#B8922A]"
            : "text-[#0A261E]"
        )}
      >
        {display}
      </p>
    </div>
  );
}

function ReachBar({ label, count, total }: { label: string; count: number; total: number }) {
  const p = pct(count, total);
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[#0A261E]/80">{label}</span>
        <span className="tabular-nums text-[#0A261E]/70">
          <span className="font-semibold text-[#0A261E]">{count}</span> · {p}%
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ background: TRACK }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.55, ease: EASE }}
          className="h-full rounded-full"
          style={{ background: DARK }}
        />
      </div>
    </div>
  );
}

function LoadingInsights() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-[#0A261E]/12 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#f6f1e4]">
        <Users size={18} className="text-[#B8922A]" />
      </div>
      <h3 className="font-display text-[17px] text-[#0A261E]">Loading insights…</h3>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#0A261E]/55">
        Insights populate from your app as members join and personalize their
        experience.
      </p>
    </div>
  );
}
