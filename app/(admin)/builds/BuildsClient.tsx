"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Version = {
  version: string;
  date: string;
  notes: string;
  buildNumber?: string;
};

type App = {
  id: string;
  name: string;
  mosqueName: string;
  icon: string | null;
  platform: "ios" | "android";
  currentVersion: string;
  status: "live" | "review" | "building" | "rejected";
  bundleId?: string;
  versions: Version[];
};

type StatusFilter = "all" | "live" | "review" | "building" | "rejected";

const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string; ring: string }> = {
  live: { label: "Live", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-500/20" },
  review: { label: "In Review", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-500/20" },
  building: { label: "Building", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-500/20" },
  rejected: { label: "Rejected", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", ring: "ring-red-500/20" },
};

const platformIcon = (p: string) =>
  p === "ios" ? (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z" /></svg>
  ) : (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="m14.31 2.07-1.33.55c-.78.32-1.23.8-1.31 1.38l1.82-.76c.73-.3 1.29-.1 1.29.72v.02l2.22-.93V2.5c0-1.15-.91-1.35-2.69-.43ZM3.5 11v8c0 1.38 1.12 2.5 2.5 2.5h12c1.38 0 2.5-1.12 2.5-2.5v-8H3.5Zm12-5.5L17.72 4c.17-.19.15-.47-.04-.64s-.47-.15-.64.04L14.78 5.9a7.09 7.09 0 0 0-2.78-.56c-1 0-1.94.2-2.78.56L6.96 3.4c-.19-.17-.47-.15-.64.04s-.15.47.04.64L8.5 5.5C6.69 6.63 5.5 8.65 5.5 11h13c0-2.35-1.19-4.37-3-5.5Zm-6 3a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" /></svg>
  );

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/* ── App Card ── */

function AppCard({ app, isSelected, onSelect }: { app: App; isSelected: boolean; onSelect: () => void }) {
  const s = statusConfig[app.status];
  const lastDate = app.versions[0]?.date;

  return (
    <motion.button
      onClick={onSelect}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
      whileTap={{ scale: 0.98 }}
      className={`group w-full rounded-2xl p-4 text-left transition-all duration-200 ${
        isSelected
          ? "bg-ink shadow-lg shadow-ink/20 ring-1 ring-ink"
          : "bg-white border border-edge shadow-sm hover:shadow-md hover:border-edge-bold"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] text-base font-bold ${
          isSelected
            ? "bg-gradient-to-br from-white/20 to-white/5 text-white"
            : "bg-gradient-to-br from-ink/10 to-ink/5 text-ink"
        }`}>
          {app.icon ? (
            <img src={app.icon} alt="" className="h-full w-full rounded-[14px] object-cover" />
          ) : (
            app.name.charAt(0)
          )}
          <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
            isSelected ? "border-ink bg-white/20 text-white" : "border-white bg-ink/10 text-ink/60"
          }`}>
            {platformIcon(app.platform)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate text-sm font-semibold ${isSelected ? "text-white" : "text-ink"}`}>
              {app.name}
            </p>
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
              isSelected
                ? "bg-white/15 text-white/80 ring-white/10"
                : `${s.bg} ${s.text} ${s.ring}`
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white/60" : s.dot}`} />
              {s.label}
            </span>
          </div>
          <p className={`mt-0.5 truncate text-xs ${isSelected ? "text-white/50" : "text-subtle"}`}>
            {app.mosqueName}
          </p>
          <div className={`mt-2 flex items-center gap-2 text-[11px] ${isSelected ? "text-white/40" : "text-faint"}`}>
            <span className="font-mono font-medium">v{app.currentVersion}</span>
            <span className="opacity-40">·</span>
            <span>{lastDate ? daysSince(lastDate) : "—"}</span>
            <span className="opacity-40">·</span>
            <span>{app.versions.length} release{app.versions.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ── Version Timeline ── */

function VersionRow({ v, isLatest, index }: { v: Version; isLatest: boolean; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="relative flex gap-4 pb-7 last:pb-0"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isLatest ? "bg-ink text-white shadow-sm shadow-ink/25" : "border-2 border-edge-bold bg-white"
        }`}>
          {isLatest ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            <span className="h-2 w-2 rounded-full bg-edge-bold" />
          )}
        </div>
        <div className="w-px flex-1 bg-edge" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-ink">v{v.version}</span>
          {v.buildNumber && (
            <span className="font-mono text-[10px] text-faint">#{v.buildNumber}</span>
          )}
          {isLatest && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              Current
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-faint">
          {new Date(v.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </p>
        <div className="mt-2.5 rounded-xl border border-edge bg-sand/40 px-4 py-3">
          <p className="text-[13px] leading-relaxed text-subtle">{v.notes}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Stat Cell ── */

function StatCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1.5 text-sm font-semibold text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

/* ── Main ── */

export default function BuildsClient({ apps }: { apps: App[] }) {
  const [selectedId, setSelectedId] = useState(apps[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    let result = apps;
    if (statusFilter !== "all") result = result.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q) || a.mosqueName.toLowerCase().includes(q));
    }
    return result;
  }, [apps, search, statusFilter]);

  const selected = apps.find((a) => a.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    all: apps.length,
    live: apps.filter((a) => a.status === "live").length,
    review: apps.filter((a) => a.status === "review").length,
    building: apps.filter((a) => a.status === "building").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  }), [apps]);

  const filterTabs: { label: string; value: StatusFilter; dot?: string }[] = [
    { label: "All", value: "all" },
    { label: "Live", value: "live", dot: "bg-emerald-500" },
    { label: "In Review", value: "review", dot: "bg-amber-500" },
    { label: "Building", value: "building", dot: "bg-blue-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Builds</h1>
          <p className="mt-1 text-sm text-subtle">
            App releases, version history, and deployment status.
          </p>
        </div>
        <div className="flex items-baseline gap-1.5 text-sm">
          <span className="font-mono text-2xl font-bold text-ink">{apps.length}</span>
          <span className="text-faint">apps tracked</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          const count = counts[tab.value];
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-subtle border border-edge hover:text-ink hover:border-edge-bold"
              }`}
            >
              {tab.dot && <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white/60" : tab.dot}`} />}
              {tab.label}
              {count > 0 && (
                <span className={`ml-0.5 min-w-[18px] rounded-full px-1.5 py-px text-center text-[10px] font-semibold ${
                  isActive ? "bg-white/20 text-white/80" : "bg-ink/5 text-faint"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main layout — flex with independent scroll */}
      <div className="flex gap-5" style={{ minHeight: "calc(100vh - 240px)" }}>
        {/* Left: App list */}
        <div className="w-[340px] shrink-0 space-y-3">
          {/* Search */}
          <div className="flex items-center gap-2.5 rounded-xl border border-edge bg-white px-3.5 py-2.5 shadow-sm transition-colors focus-within:border-ink/20 focus-within:shadow-md">
              <svg className="h-4 w-4 shrink-0 text-faint" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps or mosques..."
                className="flex-1 bg-transparent text-sm text-ink placeholder-faint outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="rounded-md p-0.5 text-faint transition-colors hover:bg-ink/5 hover:text-ink">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
          </div>

          {/* Cards */}
          <div className="space-y-2">
            <AnimatePresence mode="sync">
              {filtered.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isSelected={selectedId === app.id}
                  onSelect={() => setSelectedId(app.id)}
                />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-edge-bold bg-white py-16 text-center">
                <svg className="h-8 w-8 text-edge-bold" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p className="text-sm text-faint">No apps match your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden rounded-2xl border border-edge bg-white shadow-sm"
              >
                {/* Hero header */}
                <div className="relative overflow-hidden border-b border-edge bg-gradient-to-br from-ink to-ink/90 px-6 py-6">
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white backdrop-blur-sm">
                      {selected.icon ? (
                        <img src={selected.icon!} alt="" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        selected.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusConfig[selected.status].bg} ${statusConfig[selected.status].text}`}>
                          {statusConfig[selected.status].label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-white/50">{selected.mosqueName}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/35">
                        {selected.bundleId && (
                          <span className="font-mono">{selected.bundleId}</span>
                        )}
                        <span className="flex items-center gap-1.5">
                          {platformIcon(selected.platform)}
                          {selected.platform === "ios" ? "iOS" : "Android"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/[0.03]" />
                  <div className="absolute -bottom-8 -right-4 h-24 w-24 rounded-full bg-white/[0.02]" />
                </div>

                {/* Stats — 2x2 grid for better fit */}
                <div className="grid grid-cols-2 divide-x divide-edge border-b border-edge">
                  <StatCell
                    label="Current Version"
                    value={`v${selected.currentVersion}`}
                    mono
                  />
                  <StatCell
                    label="Total Releases"
                    value={String(selected.versions.length)}
                    mono
                  />
                </div>
                <div className="grid grid-cols-2 divide-x divide-edge border-b border-edge">
                  <StatCell
                    label="First Released"
                    value={new Date(selected.versions[selected.versions.length - 1].date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  />
                  <StatCell
                    label="Last Updated"
                    value={daysSince(selected.versions[0].date)}
                  />
                </div>

                {/* Version history */}
                <div className="px-6 py-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-faint">
                      Release History
                    </h3>
                    <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-semibold text-faint">
                      {selected.versions.length} version{selected.versions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div>
                    {selected.versions.map((v, i) => (
                      <VersionRow key={v.version} v={v} isLatest={i === 0} index={i} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-edge-bold bg-white"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink/5">
                  <svg className="h-8 w-8 text-faint" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-subtle">Select an app to view build details</p>
                <p className="mt-1 text-xs text-faint">Choose from the list on the left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
