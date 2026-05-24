"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  ExternalLink,
  TrendingUp,
  HeartHandshake,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "../../_components/PageHeader";
import StatCard from "../../_components/StatCard";
import EmptyState from "../../_components/EmptyState";
import { useDonations, type Donation } from "../../_hooks/useDonations";
import { useMosque } from "../../_lib/mock-mosque";
import { formatUsd, relativeShort } from "../../_lib/format";
import { cn } from "@/lib/utils";

const NOW = Date.now();
const DAY = 86_400_000;

type Range = "30" | "90" | "365";
const RANGE_LABELS: Record<Range, string> = {
  "30": "30 days",
  "90": "90 days",
  "365": "12 months",
};

export default function DonationsClient() {
  const { data: donations } = useDonations();
  const mosque = useMosque();
  const [range, setRange] = useState<Range>("90");

  const succeeded = useMemo(
    () => donations.filter((d) => d.status === "succeeded"),
    [donations]
  );

  const stats = useMemo(() => {
    const monthAgo = NOW - 30 * DAY;
    const yearStart = new Date(new Date(NOW).getFullYear(), 0, 1).getTime();
    const prevMonthStart = monthAgo - 30 * DAY;

    const mtd = succeeded
      .filter((d) => new Date(d.occurredAt).getTime() >= monthAgo)
      .reduce((s, d) => s + d.amountUsd, 0);

    const prevMonth = succeeded
      .filter((d) => {
        const t = new Date(d.occurredAt).getTime();
        return t >= prevMonthStart && t < monthAgo;
      })
      .reduce((s, d) => s + d.amountUsd, 0);

    const ytd = succeeded
      .filter((d) => new Date(d.occurredAt).getTime() >= yearStart)
      .reduce((s, d) => s + d.amountUsd, 0);

    const donorsMtd = new Set(
      succeeded
        .filter((d) => new Date(d.occurredAt).getTime() >= monthAgo)
        .map((d) => d.donorHash)
    ).size;

    const totalMtd = succeeded.filter(
      (d) => new Date(d.occurredAt).getTime() >= monthAgo
    ).length;
    const avg = totalMtd > 0 ? mtd / totalMtd : 0;

    const mtdDelta = prevMonth > 0 ? (mtd - prevMonth) / prevMonth : 0;

    return { mtd, ytd, donorsMtd, avg, mtdDelta, prevMonth };
  }, [succeeded]);

  const chartData = useMemo(() => {
    const days = Number(range);
    const cutoff = NOW - days * DAY;
    // Bucket donations by day
    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(NOW - i * DAY);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const d of succeeded) {
      const t = new Date(d.occurredAt).getTime();
      if (t < cutoff) continue;
      const key = new Date(d.occurredAt).toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + d.amountUsd);
    }
    return Array.from(buckets.entries()).map(([key, total]) => {
      const d = new Date(key);
      return {
        date: key,
        label: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        total: Math.round(total),
      };
    });
  }, [succeeded, range]);

  const topDonors = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of succeeded) {
      map.set(d.donorHash, (map.get(d.donorHash) ?? 0) + d.amountUsd);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([hash, total], i) => ({
        rank: i + 1,
        hash,
        total,
        // Anonymized display label
        label: `Donor ${String.fromCharCode(65 + i)}`,
      }));
  }, [succeeded]);

  const recent = donations.slice(0, 8);

  if (donations.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Money"
          title="Donations"
          description="Real-time donations dashboard."
        />
        <EmptyState
          title="No donations yet"
          description="Once your members start giving, totals, trends, and top-donor breakdowns appear here. The first donation usually arrives within a week of launch."
          ghostRowCaption="Donor A · $250 · Sadaqah · Apple Pay"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Donations"
        description="Live totals, 90-day trend, and anonymized top donors. Refunds and disputes happen in your Stripe Dashboard."
        action={
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              Open Stripe Dashboard
              <ExternalLink size={13} />
            </Button>
          </a>
        }
      />

      {/* Fundraising goal — pulled from onboarding's _donations_config */}
      {mosque.donationsConfig && mosque.donationsConfig.goalAmount > 0 ? (
        <FundraisingGoalCard
          projectName={mosque.donationsConfig.projectName}
          goalAmount={mosque.donationsConfig.goalAmount}
          ytdRaised={Math.round(stats.ytd)}
        />
      ) : null}

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="MTD"
          value={Math.round(stats.mtd)}
          prefix="$"
          delta={stats.mtdDelta}
          deltaLabel={`vs ${formatUsd(Math.round(stats.prevMonth))}`}
        />
        <StatCard
          label="YTD"
          value={Math.round(stats.ytd)}
          prefix="$"
        />
        <StatCard
          label="Donors MTD"
          value={stats.donorsMtd}
        />
        <StatCard
          label="Avg gift"
          value={Math.round(stats.avg)}
          prefix="$"
        />
      </div>

      {/* Trend chart */}
      <section className="mb-6 rounded-2xl border border-[#0A261E]/8 bg-white p-5">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[#0A261E]">
              Donation trend
            </h2>
            <p className="text-[12px] text-[#0A261E]/55">
              Total received per day. Refunds excluded.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-[#fffbf2] p-0.5">
            {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                  range === r
                    ? "bg-white text-[#0A261E] shadow-sm"
                    : "text-[#0A261E]/55 hover:text-[#0A261E]"
                )}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </header>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="donations-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0A261E" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#0A261E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 4"
                vertical={false}
                stroke="rgba(10,38,30,0.08)"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                stroke="rgba(10,38,30,0.45)"
                tick={{ fontSize: 11 }}
                tickMargin={8}
                interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="rgba(10,38,30,0.45)"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
              />
              <Tooltip
                cursor={{ stroke: "rgba(10,38,30,0.15)", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload[0]) return null;
                  const p = payload[0].payload as { label: string; total: number };
                  return (
                    <div className="rounded-lg border border-[#0A261E]/10 bg-white px-3 py-2 text-[12px] shadow-md">
                      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#0A261E]/45">
                        {p.label}
                      </p>
                      <p className="mt-0.5 font-semibold text-[#0A261E]">
                        {formatUsd(p.total)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0A261E"
                strokeWidth={2}
                fill="url(#donations-fill)"
                dot={false}
                activeDot={{ r: 4, fill: "#B8922A", stroke: "#fffbf2", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Two-column: top donors + recent activity */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Top donors */}
        <section className="rounded-2xl border border-[#0A261E]/8 bg-white">
          <header className="flex items-center justify-between border-b border-[#0A261E]/6 px-5 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#0A261E]">
                Top donors
              </h2>
              <p className="text-[11.5px] text-[#0A261E]/55">
                Anonymized — no names exported.
              </p>
            </div>
            <HeartHandshake size={16} className="text-[#B8922A]" />
          </header>
          <ol className="divide-y divide-[#0A261E]/6">
            {topDonors.map((d) => (
              <li
                key={d.hash}
                className="flex items-center gap-3 px-5 py-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A261E]/8 text-[12px] font-semibold text-[#0A261E]/65">
                  {d.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#0A261E]">
                    {d.label}
                  </p>
                  <p className="text-[11px] text-[#0A261E]/45">
                    Reference: {d.hash}
                  </p>
                </div>
                <p className="font-display text-[15px] tabular-nums text-[#0A261E]">
                  {formatUsd(d.total)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border border-[#0A261E]/8 bg-white">
          <header className="flex items-center justify-between border-b border-[#0A261E]/6 px-5 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#0A261E]">
                Recent donations
              </h2>
              <p className="text-[11.5px] text-[#0A261E]/55">
                Last 8 transactions across all funds.
              </p>
            </div>
            <TrendingUp size={16} className="text-[#0A261E]/40" />
          </header>
          <ul className="divide-y divide-[#0A261E]/6">
            {recent.map((d) => (
              <RecentDonationRow key={d.id} donation={d} />
            ))}
          </ul>
          <div className="border-t border-[#0A261E]/6 px-5 py-2.5 text-right">
            <a
              href="https://dashboard.stripe.com/payments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0A261E]/65 hover:text-[#0A261E]"
            >
              View all in Stripe
              <ArrowUpRight size={12} />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

function RecentDonationRow({ donation }: { donation: Donation }) {
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fffbf2]">
        <Heart size={13} className="text-[#B8922A]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#0A261E]">
          {donation.fundLabel}
          <span
            className={cn(
              "ml-2 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider",
              donation.status === "succeeded"
                ? "bg-emerald-50 text-emerald-700"
                : donation.status === "refunded"
                ? "bg-red-50 text-red-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {donation.status}
          </span>
        </p>
        <p className="text-[11px] text-[#0A261E]/55">
          {donation.donorHash} · {donation.method.replace("_", " ")} ·{" "}
          {relativeShort(donation.occurredAt)}
        </p>
      </div>
      <p className="font-display text-[15px] tabular-nums text-[#0A261E]">
        {formatUsd(donation.amountUsd)}
      </p>
    </li>
  );
}

function FundraisingGoalCard({
  projectName,
  goalAmount,
  ytdRaised,
}: {
  projectName: string;
  goalAmount: number;
  ytdRaised: number;
}) {
  const pct = Math.min(100, Math.round((ytdRaised / goalAmount) * 100));
  const remaining = Math.max(0, goalAmount - ytdRaised);
  return (
    <section
      aria-label="Fundraising goal"
      className="mb-6 overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-[#0A261E] p-5 text-[#fffbf2] md:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#fffbf2]/55">
            Fundraising goal
          </p>
          <h2 className="mt-1 font-display text-[22px] leading-tight text-[#E8D5B0]">
            {projectName}
          </h2>
        </div>
        <div className="text-right">
          <p className="font-display text-[24px] leading-none text-[#fffbf2]">
            {formatUsd(ytdRaised)}
            <span className="ml-1 text-[14px] font-sans font-normal text-[#fffbf2]/55">
              / {formatUsd(goalAmount)}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-[#fffbf2]/55 tabular-nums">
            {remaining > 0 ? `${formatUsd(remaining)} to go` : "Goal reached"}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "var(--mosque-accent, #B8922A)",
          }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[#fffbf2]/55">
        <span>{pct}% of goal · YTD</span>
        <span>Set during onboarding · edit anytime in Setup</span>
      </div>
    </section>
  );
}
