"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimateNumber } from "motion-number";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MRR_PER_MOSQUE = 250;

type MosqueData = {
  id: string;
  name: string;
  city: string;
  state: string;
  subscriptionStatus: string;
  launchedAt: string | null;
  health: string;
};

type SortKey = "name" | "mrr" | "since" | "status" | "health";
type TimeRange = "30D" | "3M" | "6M" | "12M" | "All";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "30D", value: "30D" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "12M", value: "12M" },
  { label: "All", value: "All" },
];

function getTimeRangeMonths(range: TimeRange): number | null {
  switch (range) {
    case "30D": return 1;
    case "3M": return 3;
    case "6M": return 6;
    case "12M": return 12;
    case "All": return null;
  }
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700" },
  past_due: { label: "Past Due", className: "bg-red-50 text-red-700" },
  canceled: { label: "Canceled", className: "bg-neutral-100 text-neutral-500" },
};

const healthConfig: Record<string, { className: string }> = {
  Excellent: { className: "bg-emerald-50 text-emerald-700" },
  Good: { className: "bg-emerald-50 text-emerald-700" },
  "At Risk": { className: "bg-amber-50 text-amber-700" },
  Churned: { className: "bg-red-50 text-red-700" },
  "No Data": { className: "bg-neutral-100 text-neutral-500" },
};

function buildMrrHistory(mosques: MosqueData[]) {
  const paying = mosques.filter(
    (m) => m.subscriptionStatus === "active" && m.launchedAt
  );

  if (paying.length === 0) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        month: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        mrr: 0,
      };
    });
  }

  const launches = paying
    .map((m) => new Date(m.launchedAt!))
    .sort((a, b) => a.getTime() - b.getTime());

  const earliest = new Date(launches[0].getFullYear(), launches[0].getMonth(), 1);
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  const months: { month: string; mrr: number }[] = [];
  const cursor = new Date(earliest);
  while (cursor <= end) {
    const count = launches.filter((l) => l <= cursor).length;
    months.push({
      month: cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      mrr: count * MRR_PER_MOSQUE,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/* ── Small components ── */

function MiniChart({ data, color = "#00A870" }: { data: { month: string; mrr: number }[]; color?: string }) {
  return (
    <div style={{ height: 64 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`mini-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="mrr" stroke={color} strokeWidth={1.5} fill={`url(#mini-${color.replace("#", "")})`} dot={false} />
          <XAxis dataKey="month" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

/* ── Payments Card ── */

const PAYMENT_STATUSES = [
  { label: "Succeeded", amount: 2400, color: "#8B5CF6" },
  { label: "Uncaptured", amount: 0, color: "#3B82F6" },
  { label: "Refunded", amount: 0, color: "#06B6D4" },
  { label: "Failed", amount: 150, color: "#F97316" },
];

function PaymentsCard() {
  const total = PAYMENT_STATUSES.reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ borderRadius: 12, border: "1px solid rgba(10,38,30,0.08)", backgroundColor: "#fff", padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(10,38,30,0.6)", margin: 0 }}>Payments</p>

        {/* Stacked bar */}
        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, marginTop: 14, backgroundColor: "rgba(10,38,30,0.04)" }}>
          {PAYMENT_STATUSES.filter((p) => p.amount > 0).map((p) => (
            <div key={p.label} style={{ width: `${(p.amount / total) * 100}%`, backgroundColor: p.color, transition: "width 0.3s" }} />
          ))}
        </div>

        {/* Breakdown rows */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {PAYMENT_STATUSES.map((p) => (
            <div key={p.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#0A261E" }}>{p.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0A261E", fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
                {p.amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(10,38,30,0.06)" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#8B5CF6", cursor: "pointer" }}>View more</span>
        <span style={{ fontSize: 11, color: "rgba(10,38,30,0.3)" }}>Updated yesterday</span>
      </div>
    </div>
  );
}

/* ── Filter Bar (Airbnb-style) ── */

type FilterState = { mosqueId: string; state: string; city: string };
const emptyFilter: FilterState = { mosqueId: "", state: "", city: "" };
type Segment = "mosque" | "state" | "city" | null;

const G = "#0A261E";
const G45 = "rgba(10,38,30,0.45)";
const G40 = "rgba(10,38,30,0.4)";
const G06 = "rgba(10,38,30,0.06)";
const G08 = "rgba(10,38,30,0.08)";
const G10 = "rgba(10,38,30,0.10)";
const TAN = "#fffbf2";

const pillBase: React.CSSProperties = {
  display: "flex", flexDirection: "row", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 9999, border: "none",
  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
};
const pillActive: React.CSSProperties = { backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" };
const pillIdle: React.CSSProperties = { backgroundColor: "transparent", boxShadow: "none" };
const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: G45, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1 };
const clearBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: 8, backgroundColor: G08, cursor: "pointer", flexShrink: 0 };
const dividerStyle: React.CSSProperties = { width: 1, height: 20, backgroundColor: G10, flexShrink: 0 };
const dropStyle: React.CSSProperties = { position: "absolute", top: "100%", zIndex: 30, marginTop: 6, borderRadius: 14, border: `1px solid ${G08}`, backgroundColor: "#fff", boxShadow: "0 8px 28px rgba(0,0,0,0.12)" };
const listBtn: React.CSSProperties = { display: "block", width: "100%", padding: "8px 14px", textAlign: "left", fontSize: 13, border: "none", background: "none", cursor: "pointer", transition: "background 0.15s" };
const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "rgba(10,38,30,0.04)"; };
const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "transparent"; };

function ClearX({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <span onClick={onClick} style={clearBtn}>
      <svg style={{ width: 9, height: 9, color: "rgba(10,38,30,0.5)" }} fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
    </span>
  );
}

function FilterBar({
  mosques, filters, onApply, timeRange, onTimeRange,
}: {
  mosques: MosqueData[];
  filters: FilterState;
  onApply: (f: FilterState) => void;
  timeRange: TimeRange;
  onTimeRange: (t: TimeRange) => void;
}) {
  const [active, setActive] = useState<Segment>(null);
  const [search, setSearch] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active === "mosque") setTimeout(() => inputRef.current?.focus(), 0);
  }, [active]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (barRef.current && !barRef.current.contains(e.target as Node)) setActive(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  const allStates = useMemo(() => [...new Set(mosques.map((m) => m.state).filter((s) => s !== "—"))].sort(), [mosques]);
  const allCities = useMemo(() => {
    const src = filters.state ? mosques.filter((m) => m.state === filters.state) : mosques;
    return [...new Set(src.map((m) => m.city).filter((c) => c !== "—"))].sort();
  }, [mosques, filters.state]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return mosques.filter((m) => m.name.toLowerCase().includes(q) || m.city.toLowerCase().includes(q) || m.state.toLowerCase().includes(q)).slice(0, 6);
  }, [mosques, search]);

  const mosqueLabel = useMemo(() => {
    if (!filters.mosqueId) return null;
    return mosques.find((x) => x.id === filters.mosqueId)?.name ?? null;
  }, [mosques, filters.mosqueId]);

  const clearField = useCallback((field: "mosqueId" | "state" | "city") => {
    const next = { ...filters, [field]: "" };
    if (field === "state") next.city = "";
    onApply(next);
  }, [filters, onApply]);

  const toggle = (s: Segment) => setActive((cur) => (cur === s ? null : s));
  const isOpen = active !== null;

  return (
    <div ref={barRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Pill bar */}
      <div style={{
        display: "flex", flexDirection: "row", alignItems: "center",
        borderRadius: 9999, border: `1px solid rgba(10,38,30,${isOpen ? "0.08" : "0.12"})`,
        backgroundColor: isOpen ? "#ede8e0" : "#fff",
        boxShadow: isOpen ? "0 3px 12px rgba(0,0,0,0.10)" : "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
      }}>
        {/* Mosque */}
        <button onClick={() => toggle("mosque")} style={{ ...pillBase, minWidth: 160, ...active === "mosque" ? pillActive : pillIdle }}>
          <svg style={{ width: 14, height: 14, flexShrink: 0, color: G40 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
            <span style={labelStyle}>Where</span>
            <span style={{ fontSize: 13, fontWeight: mosqueLabel ? 600 : 400, color: mosqueLabel ? G : G40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120, marginTop: 1 }}>
              {mosqueLabel || "Search mosque"}
            </span>
          </div>
          {mosqueLabel && <ClearX onClick={(e) => { e.stopPropagation(); clearField("mosqueId"); setSearch(""); }} />}
        </button>

        <div style={dividerStyle} />

        {/* State */}
        <button onClick={() => toggle("state")} style={{ ...pillBase, minWidth: 100, ...active === "state" ? pillActive : pillIdle }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
            <span style={labelStyle}>State</span>
            <span style={{ fontSize: 13, fontWeight: filters.state ? 600 : 400, color: filters.state ? G : G40, marginTop: 1 }}>
              {filters.state || "Any"}
            </span>
          </div>
          {filters.state && <ClearX onClick={(e) => { e.stopPropagation(); clearField("state"); }} />}
        </button>

        <div style={dividerStyle} />

        {/* City */}
        <button onClick={() => toggle("city")} style={{ ...pillBase, minWidth: 100, ...active === "city" ? pillActive : pillIdle }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
            <span style={labelStyle}>City</span>
            <span style={{ fontSize: 13, fontWeight: filters.city ? 600 : 400, color: filters.city ? G : G40, marginTop: 1 }}>
              {filters.city || "Any"}
            </span>
          </div>
          {filters.city && <ClearX onClick={(e) => { e.stopPropagation(); clearField("city"); }} />}
        </button>

        <div style={dividerStyle} />

        {/* Time range */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, padding: "4px 6px" }}>
          {TIME_RANGES.map((r) => (
            <button key={r.value} onClick={() => onTimeRange(r.value)}
              style={{
                padding: "5px 10px", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 9999,
                cursor: "pointer", transition: "all 0.15s",
                backgroundColor: timeRange === r.value ? G : "transparent",
                color: timeRange === r.value ? "#fff" : G40,
              }}
            >{r.label}</button>
          ))}
        </div>
      </div>

      {/* ── Dropdowns ── */}
      {active === "mosque" && (
        <div style={{ ...dropStyle, left: 0, width: 340 }}>
          <div style={{ padding: 10 }}>
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(10,38,30,0.3)" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
              <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, city, or state..."
                style={{ width: "100%", borderRadius: 10, border: `1px solid ${G10}`, backgroundColor: TAN, padding: "7px 10px 7px 32px", fontSize: 13, color: G, outline: "none" }} />
            </div>
          </div>
          {search.trim() ? (
            <div style={{ maxHeight: 220, overflowY: "auto", borderTop: `1px solid ${G06}` }}>
              {searchResults.length === 0 ? (
                <p style={{ padding: "18px 0", textAlign: "center", fontSize: 12, color: G40 }}>No mosques found</p>
              ) : searchResults.map((m) => (
                <button key={m.id} onClick={() => { onApply({ mosqueId: m.id, state: "", city: "" }); setSearch(""); setActive(null); }}
                  style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
                  onMouseEnter={hoverIn} onMouseLeave={hoverOut}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: TAN, flexShrink: 0 }}>{m.name.charAt(0)}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: G, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: 11, color: "rgba(10,38,30,0.5)", margin: 0 }}>{m.city}{m.state !== "—" ? `, ${m.state}` : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ borderTop: `1px solid ${G06}`, padding: "10px 14px" }}>
              <p style={{ fontSize: 12, color: G40, margin: 0 }}>Type to search mosques</p>
            </div>
          )}
        </div>
      )}

      {active === "state" && (
        <div style={{ ...dropStyle, left: 168, width: 190 }}>
          <div style={{ maxHeight: 260, overflowY: "auto", padding: "3px 0" }}>
            <button onClick={() => { onApply({ ...filters, state: "", city: "", mosqueId: "" }); setActive(null); }}
              style={{ ...listBtn, fontWeight: !filters.state ? 600 : 400, color: !filters.state ? G : "rgba(10,38,30,0.6)" }}
              onMouseEnter={hoverIn} onMouseLeave={hoverOut}
            >All States</button>
            {allStates.map((s) => (
              <button key={s} onClick={() => { onApply({ ...filters, state: s, city: "", mosqueId: "" }); setActive(null); }}
                style={{ ...listBtn, fontWeight: filters.state === s ? 600 : 400, color: filters.state === s ? G : "rgba(10,38,30,0.6)" }}
                onMouseEnter={hoverIn} onMouseLeave={hoverOut}
              >{s}</button>
            ))}
            {allStates.length === 0 && <p style={{ padding: 14, textAlign: "center", fontSize: 12, color: G40 }}>No states available</p>}
          </div>
        </div>
      )}

      {active === "city" && (
        <div style={{ ...dropStyle, right: 0, width: 190 }}>
          <div style={{ maxHeight: 260, overflowY: "auto", padding: "3px 0" }}>
            <button onClick={() => { onApply({ ...filters, city: "", mosqueId: "" }); setActive(null); }}
              style={{ ...listBtn, fontWeight: !filters.city ? 600 : 400, color: !filters.city ? G : "rgba(10,38,30,0.6)" }}
              onMouseEnter={hoverIn} onMouseLeave={hoverOut}
            >All Cities</button>
            {allCities.map((c) => (
              <button key={c} onClick={() => { onApply({ ...filters, city: c, mosqueId: "" }); setActive(null); }}
                style={{ ...listBtn, fontWeight: filters.city === c ? 600 : 400, color: filters.city === c ? G : "rgba(10,38,30,0.6)" }}
                onMouseEnter={hoverIn} onMouseLeave={hoverOut}
              >{c}</button>
            ))}
            {allCities.length === 0 && <p style={{ padding: 14, textAlign: "center", fontSize: 12, color: G40 }}>{filters.state ? "No cities in this state" : "No cities available"}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ── */

export default function RevenueClient({ mosques, monthlyBurn }: { mosques: MosqueData[]; monthlyBurn: number }) {
  const [filters, setFilters] = useState<FilterState>(emptyFilter);
  const [timeRange, setTimeRange] = useState<TimeRange>("6M");
  const [sortKey, setSortKey] = useState<SortKey>("mrr");
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<"mrr" | "arr" | null>(null);

  const filtered = useMemo(() => {
    let result = mosques;
    if (filters.mosqueId) return result.filter((m) => m.id === filters.mosqueId);
    if (filters.state) result = result.filter((m) => m.state === filters.state);
    if (filters.city) result = result.filter((m) => m.city === filters.city);
    return result;
  }, [mosques, filters]);

  const paying = filtered.filter((m) => m.subscriptionStatus === "active");
  const mrr = paying.length * MRR_PER_MOSQUE;
  const arr = mrr * 12;
  const netRevenue = mrr - monthlyBurn;

  const mrrHistoryFull = useMemo(() => buildMrrHistory(filtered), [filtered]);
  const mrrHistory = useMemo(() => {
    const months = getTimeRangeMonths(timeRange);
    if (!months || mrrHistoryFull.length <= months) return mrrHistoryFull;
    return mrrHistoryFull.slice(-months);
  }, [mrrHistoryFull, timeRange]);

  const tableRows = useMemo(() =>
    filtered.filter((m) => m.subscriptionStatus !== "setup").map((m) => ({
      id: m.id, name: m.name, city: m.city,
      mrr: m.subscriptionStatus === "active" ? MRR_PER_MOSQUE : 0,
      since: m.launchedAt ? new Date(m.launchedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—",
      status: m.subscriptionStatus as "active" | "past_due" | "canceled",
      health: m.health,
    })), [filtered]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === "name"); }
  };

  const sorted = [...tableRows].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    else if (sortKey === "mrr") cmp = a.mrr - b.mrr;
    else if (sortKey === "since") cmp = a.since.localeCompare(b.since);
    else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
    else if (sortKey === "health") cmp = a.health.localeCompare(b.health);
    return sortAsc ? cmp : -cmp;
  });

  const arrow = (key: SortKey) => (sortKey === key ? (sortAsc ? " ↑" : " ↓") : "");

  const pageTitle = useMemo(() => {
    if (filters.mosqueId) { const m = mosques.find((m) => m.id === filters.mosqueId); return m ? m.name : "Revenue"; }
    return "Revenue";
  }, [mosques, filters.mosqueId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-[#0A261E]">{pageTitle}</h1>
        <p className="mt-1 text-sm text-[#0A261E]/60">
          {filters.mosqueId ? "Revenue and subscription details for this mosque." : "MRR, subscriptions, and financial health across all mosques."}
        </p>
      </div>

      {/* Unified filter + time range bar */}
      <FilterBar mosques={mosques} filters={filters} onApply={setFilters} timeRange={timeRange} onTimeRange={setTimeRange} />

      {/* Chart Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: expanded === "mrr"
          ? "1fr 0fr 0fr"
          : expanded === "arr"
            ? "0fr 1fr 0fr"
            : "1fr 1fr 1fr",
        gap: expanded ? 0 : 16,
        transition: "grid-template-columns 0.5s cubic-bezier(0.4,0,0.2,1), gap 0.5s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* MRR */}
        <div
          onClick={() => setExpanded(expanded === "mrr" ? null : "mrr")}
          style={{
            borderRadius: 12, border: expanded === "arr" ? "1px solid transparent" : "1px solid rgba(10,38,30,0.08)", backgroundColor: "#fff", 
            padding: expanded === "arr" ? 0 : 20,
            cursor: "pointer", overflow: "hidden", minWidth: 0,
            transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            opacity: expanded === "arr" ? 0 : 1,
            maxHeight: expanded === "arr" ? 0 : 500,
            boxShadow: expanded === "mrr" ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
            pointerEvents: expanded === "arr" ? "none" : "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="text-xs font-medium text-[#0A261E]/60">MRR</p>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(expanded === "mrr" ? null : "mrr"); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(10,38,30,0.10)",
                backgroundColor: expanded === "mrr" ? "rgba(10,38,30,0.05)" : "transparent",
                fontSize: 11, fontWeight: 500, color: "rgba(10,38,30,0.45)", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {expanded === "mrr" ? (
                <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" /></svg>
              ) : (
                <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
              )}
              {expanded === "mrr" ? "Collapse" : "Expand"}
            </button>
          </div>
          <div className="mt-1">
            <span className="font-mono text-2xl font-semibold text-[#16a34a]">
              <AnimateNumber format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locales="en-US" transition={{ duration: 0.8 }}>{mrr}</AnimateNumber>
            </span>
          </div>
          <div className="mt-3" style={{ height: expanded === "mrr" ? 220 : 64, transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrHistory}>
                <defs>
                  <linearGradient id="mrrExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A870" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#00A870" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {expanded === "mrr" && <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />}
                {expanded === "mrr" && <XAxis dataKey="month" tick={{ fill: "#9C9CA6", fontSize: 11 }} axisLine={false} tickLine={false} />}
                {expanded === "mrr" && <YAxis tick={{ fill: "#9C9CA6", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} width={45} />}
                {expanded === "mrr" && <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={(value) => [fmt(Number(value)), "MRR"]} />}
                <Area type="monotone" dataKey="mrr" stroke="#00A870" strokeWidth={expanded === "mrr" ? 2 : 1.5} fill="url(#mrrExpGrad)" dot={expanded === "mrr" ? { r: 3, fill: "#00A870", strokeWidth: 0 } : false} />
                {!expanded && <XAxis dataKey="month" hide />}
                {!expanded && <YAxis hide domain={["dataMin", "dataMax"]} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {expanded !== "mrr" && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#0A261E]/35">
              <span>{mrrHistory[0]?.month}</span><span>{mrrHistory[mrrHistory.length - 1]?.month}</span>
            </div>
          )}
          {expanded === "mrr" && (
            <div style={{ marginTop: 12, display: "flex", gap: 24, fontSize: 12, color: "rgba(10,38,30,0.5)" }}>
              <div><span style={{ fontWeight: 600, color: "#0A261E" }}>{paying.length}</span> paying mosques</div>
              <div>ARR <span style={{ fontWeight: 600, color: "#0A261E" }}>{fmt(arr)}</span></div>
              <div>Avg MRR/mosque <span style={{ fontWeight: 600, color: "#0A261E" }}>{paying.length > 0 ? fmt(mrr / paying.length) : "$0"}</span></div>
            </div>
          )}
        </div>

        {/* ARR */}
        <div
          onClick={() => setExpanded(expanded === "arr" ? null : "arr")}
          style={{
            borderRadius: 12, border: expanded === "mrr" ? "1px solid transparent" : "1px solid rgba(10,38,30,0.08)", backgroundColor: "#fff",
            padding: expanded === "mrr" ? 0 : 20,
            cursor: "pointer", overflow: "hidden", minWidth: 0,
            transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            opacity: expanded === "mrr" ? 0 : 1,
            maxHeight: expanded === "mrr" ? 0 : 500,
            boxShadow: expanded === "arr" ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
            pointerEvents: expanded === "mrr" ? "none" : "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="text-xs font-medium text-[#0A261E]/60">ARR</p>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(expanded === "arr" ? null : "arr"); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(10,38,30,0.10)",
                backgroundColor: expanded === "arr" ? "rgba(10,38,30,0.05)" : "transparent",
                fontSize: 11, fontWeight: 500, color: "rgba(10,38,30,0.45)", cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {expanded === "arr" ? (
                <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" /></svg>
              ) : (
                <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
              )}
              {expanded === "arr" ? "Collapse" : "Expand"}
            </button>
          </div>
          <div className="mt-1">
            <span className="font-mono text-2xl font-semibold text-[#0A261E]">
              <AnimateNumber format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locales="en-US" transition={{ duration: 0.8 }}>{arr}</AnimateNumber>
            </span>
          </div>
          <div className="mt-3" style={{ height: expanded === "arr" ? 220 : 64, transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrHistory.map((d) => ({ ...d, mrr: d.mrr * 12 }))}>
                <defs>
                  <linearGradient id="arrExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {expanded === "arr" && <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />}
                {expanded === "arr" && <XAxis dataKey="month" tick={{ fill: "#9C9CA6", fontSize: 11 }} axisLine={false} tickLine={false} />}
                {expanded === "arr" && <YAxis tick={{ fill: "#9C9CA6", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} width={50} />}
                {expanded === "arr" && <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={(value) => [fmt(Number(value)), "ARR"]} />}
                <Area type="monotone" dataKey="mrr" stroke="#6C63FF" strokeWidth={expanded === "arr" ? 2 : 1.5} fill="url(#arrExpGrad)" dot={expanded === "arr" ? { r: 3, fill: "#6C63FF", strokeWidth: 0 } : false} />
                {!expanded && <XAxis dataKey="month" hide />}
                {!expanded && <YAxis hide domain={["dataMin", "dataMax"]} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {expanded !== "arr" && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#0A261E]/35">
              <span>{mrrHistory[0]?.month}</span><span>{mrrHistory[mrrHistory.length - 1]?.month}</span>
            </div>
          )}
          {expanded === "arr" && (
            <div style={{ marginTop: 12, display: "flex", gap: 24, fontSize: 12, color: "rgba(10,38,30,0.5)" }}>
              <div><span style={{ fontWeight: 600, color: "#0A261E" }}>{paying.length}</span> paying mosques</div>
              <div>MRR <span style={{ fontWeight: 600, color: "#0A261E" }}>{fmt(mrr)}</span></div>
              <div>Growth rate <span style={{ fontWeight: 600, color: "#0A261E" }}>{mrrHistory.length >= 2 && mrrHistory[mrrHistory.length - 2].mrr > 0 ? `${(((mrrHistory[mrrHistory.length - 1].mrr - mrrHistory[mrrHistory.length - 2].mrr) / mrrHistory[mrrHistory.length - 2].mrr) * 100).toFixed(1)}%` : "—"}</span></div>
            </div>
          )}
        </div>

        {/* Paying Mosques */}
        <div
          style={{
            borderRadius: 12, border: expanded ? "1px solid transparent" : "1px solid rgba(10,38,30,0.08)", backgroundColor: "#fff",
            padding: expanded ? 0 : 20,
            overflow: "hidden", minWidth: 0,
            transition: "all 0.5s cubic-bezier(0.4,0,0.2,1)",
            opacity: expanded ? 0 : 1,
            maxHeight: expanded ? 0 : 500,
            pointerEvents: expanded ? "none" as const : "auto" as const,
          }}
        >
          <p className="text-xs font-medium text-[#0A261E]/60">Paying Mosques</p>
          <div className="mt-1">
            <span className="font-mono text-2xl font-semibold text-[#0A261E]">
              <AnimateNumber transition={{ duration: 0.8 }}>{paying.length}</AnimateNumber>
            </span>
          </div>
          <div className="mt-3"><MiniChart data={mrrHistory.map((d) => ({ ...d, mrr: d.mrr / MRR_PER_MOSQUE }))} color="#B8922A" /></div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#0A261E]/35">
            <span>{mrrHistory[0]?.month}</span><span>{mrrHistory[mrrHistory.length - 1]?.month}</span>
          </div>
        </div>
      </div>

      {/* Net Revenue + Payments */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div className="rounded-xl border border-[#0A261E]/8 bg-white p-5">
          <div>
            <p className="text-xs font-medium text-[#0A261E]/60">Net Revenue</p>
            <div className={`mt-1 font-mono text-2xl font-semibold ${netRevenue >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
              <AnimateNumber format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} locales="en-US" transition={{ duration: 0.8 }}>{netRevenue}</AnimateNumber>
            </div>
            <p className="mt-1 text-xs text-[#0A261E]/35">{fmt(mrr)} revenue − {fmt(monthlyBurn)} expenses</p>
          </div>
          <div className="mt-3" style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrHistory}>
                <defs>
                  <linearGradient id="mrrGradientLg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A870" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#00A870" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#9C9CA6", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9C9CA6", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} width={40} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, color: "#0D0D12", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={(value) => [fmt(Number(value)), "MRR"]} />
                <Area type="monotone" dataKey="mrr" stroke="#00A870" strokeWidth={1.5} fill="url(#mrrGradientLg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <PaymentsCard />
      </div>

      {/* Subscription details — only when a mosque is selected */}
      {filters.mosqueId && sorted.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#0A261E]/8 bg-white">
          <div className="border-b border-[#0A261E]/8 px-5 py-4">
            <p className="text-sm font-medium text-[#0A261E]/60">Subscription Details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#0A261E]/8 text-xs uppercase tracking-wider text-[#0A261E]/35">
                  <th className="px-5 py-3 font-medium">Mosque</th>
                  <th className="px-5 py-3 font-medium">MRR</th>
                  <th className="px-5 py-3 font-medium">Since</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Health</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const sc = statusConfig[row.status] ?? statusConfig.canceled;
                  const hc = healthConfig[row.health] ?? healthConfig["No Data"];
                  return (
                    <tr key={row.id} className="border-b border-[#0A261E]/8 transition-colors last:border-0 hover:bg-[#f5f0e8]">
                      <td className="px-5 py-3">
                        <span className="font-medium text-[#0A261E]">{row.name}</span>
                        <span className="ml-2 text-[#0A261E]/35">{row.city}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-[#0A261E]">{fmt(row.mrr)}</td>
                      <td className="px-5 py-3 text-[#0A261E]/60">{row.since}</td>
                      <td className="px-5 py-3"><Badge label={sc.label} className={sc.className} /></td>
                      <td className="px-5 py-3"><Badge label={row.health} className={hc.className} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
