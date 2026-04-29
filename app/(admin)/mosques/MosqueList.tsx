"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  X,
  Wrench,
  CheckCircle2,
  Radio,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeStages, type KanbanMosque } from "./mosque-kanban-types";

type Mosque = KanbanMosque;
type Bucket = "onboarding" | "ready" | "live";
type Tab = "all" | Bucket;
type ViewMode = "grid" | "list";

const COLLAPSED_LIMIT = 24;
const VIEW_STORAGE_KEY = "sahla-mosques-view";
const TAB_STORAGE_KEY = "sahla-mosques-tab";

const AVATAR_PALETTE = ["#64748b", "#6366f1", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0d9488"];
function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getOnboardingPct(progress: Record<string, unknown> | null): number {
  if (!progress) return 0;
  const vals = Object.values(progress);
  if (!vals.length) return 0;
  return Math.round((vals.filter((v) => v === true).length / vals.length) * 100);
}

function getLatestStage(mosque: Mosque): {
  stage: string;
  contactName: string | null;
  contactEmail: string | null;
} {
  const stages = normalizeStages(mosque.pipeline_stages);
  if (stages.length === 0) return { stage: "lead", contactName: null, contactEmail: null };
  const latest = stages.reduce((best, current) => {
    const bestTs = best.updated_at ? Date.parse(best.updated_at) : 0;
    const currentTs = current.updated_at ? Date.parse(current.updated_at) : 0;
    return currentTs > bestTs ? current : best;
  }, stages[0]);
  return {
    stage: latest.stage || "lead",
    contactName: latest.contact_name ?? null,
    contactEmail: latest.contact_email ?? null,
  };
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "—";
  const days = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
  if (days < 1) return "today";
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days - years * 365) / 30);
  return remMonths > 0 ? `${years}y ${remMonths}mo` : `${years}y`;
}

function getPlanLabel(mosque: Mosque): { label: string; tone: "active" | "trial" | "off" } {
  const status = (mosque.subscription_status ?? "").toLowerCase();
  if (status === "active") return { label: "Pro", tone: "active" };
  if (status === "trialing") return { label: "Trial", tone: "trial" };
  return { label: "—", tone: "off" };
}

// Mocked sparkline + count until we wire push_tokens aggregation.
// Seeded by mosque id so the same mosque always shows the same chart.
function mockUsageSparkline(mosqueId: string): { points: number[]; total: number } {
  let h = 0;
  for (let i = 0; i < mosqueId.length; i++) h = mosqueId.charCodeAt(i) + ((h << 5) - h);
  const seed = Math.abs(h);
  const base = (seed % 80) + 20;
  const points = Array.from({ length: 8 }, (_, i) => {
    const wobble = ((seed >> i) % 17) - 8;
    return Math.max(0, base + wobble + i * ((seed % 5) - 2));
  });
  const total = Math.round(points[points.length - 1] * 12 + (seed % 200));
  return { points, total };
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 56;
  const h = 18;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => {
      const x = i * stepX;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getBucket(mosque: Mosque): Bucket | null {
  const { stage } = getLatestStage(mosque);
  if (stage === "live") return "live";
  if (stage === "onboarding") {
    return getOnboardingPct(mosque.onboarding_progress) >= 100 ? "ready" : "onboarding";
  }
  return null;
}

const SECTION_META: Record<
  Bucket,
  { title: string; subtitle: string; icon: typeof Wrench; accent: string; emptyText: string }
> = {
  onboarding: {
    title: "Onboarding",
    subtitle: "Working through setup",
    icon: Wrench,
    accent: "text-amber-700 bg-amber-50",
    emptyText: "No mosques in onboarding",
  },
  ready: {
    title: "Ready to launch",
    subtitle: "Onboarding complete",
    icon: CheckCircle2,
    accent: "text-teal-700 bg-teal-50",
    emptyText: "No mosques ready to launch",
  },
  live: {
    title: "Live",
    subtitle: "Active in production",
    icon: Radio,
    accent: "text-lime-700 bg-lime-50",
    emptyText: "No live mosques yet",
  },
};

const BUCKET_ORDER: Bucket[] = ["onboarding", "ready", "live"];

function MosqueCard({ mosque, bucket }: { mosque: Mosque; bucket: Bucket }) {
  const { contactName } = getLatestStage(mosque);
  const pct = bucket === "onboarding" ? getOnboardingPct(mosque.onboarding_progress) : 0;
  const color = mosque.brand_color || nameToColor(mosque.name || "M");

  return (
    <Link
      href={`/mosques/${mosque.id}`}
      className="group flex flex-col rounded-xl border border-stone-200 bg-white p-3.5 transition-all duration-150 hover:border-stone-300 hover:shadow-sm"
    >
      <div className="mb-2.5 flex items-start gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {mosque.name?.charAt(0).toUpperCase() || "M"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-tight text-stone-900">
            {mosque.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-stone-400">
            {mosque.city || <span className="italic">No city</span>}
          </p>
        </div>
      </div>

      {contactName && (
        <p className="mb-2.5 truncate text-[11px] text-stone-500">{contactName}</p>
      )}

      <div className="mt-auto">
        {bucket === "onboarding" && (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] font-medium tabular-nums text-amber-700">{pct}%</span>
          </div>
        )}

        {bucket === "ready" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
            <CheckCircle2 size={10} strokeWidth={2.5} />
            Ready
          </span>
        )}

        {bucket === "live" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-50 px-2 py-0.5 text-[10px] font-medium text-lime-700">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
            Live
          </span>
        )}
      </div>
    </Link>
  );
}

const ROW_GRID =
  "grid grid-cols-[minmax(220px,2fr)_120px_90px_90px_80px_minmax(160px,1.5fr)_110px_20px] items-center gap-4";

function TableHeader() {
  return (
    <div
      className={cn(
        ROW_GRID,
        "border-b border-stone-200 bg-stone-50/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-500"
      )}
    >
      <div>Mosque</div>
      <div>Users (30d)</div>
      <div>Stripe</div>
      <div>Plan</div>
      <div>Joined</div>
      <div>Admin</div>
      <div>Status</div>
      <div />
    </div>
  );
}

function MosqueRow({ mosque, bucket, isLast }: { mosque: Mosque; bucket: Bucket; isLast: boolean }) {
  const { contactName, contactEmail } = getLatestStage(mosque);
  const pct = bucket === "onboarding" ? getOnboardingPct(mosque.onboarding_progress) : 0;
  const color = mosque.brand_color || nameToColor(mosque.name || "M");
  const stripeConnected = Boolean(mosque.stripe_account_id);
  const plan = getPlanLabel(mosque);
  const joinedSince = formatRelativeTime(mosque.created_at);
  const usage = mockUsageSparkline(mosque.id);

  return (
    <Link
      href={`/mosques/${mosque.id}`}
      className={cn(
        ROW_GRID,
        "group px-5 py-4 transition-colors duration-150 hover:bg-stone-50/80",
        !isLast && "border-b border-stone-100"
      )}
    >
      {/* Mosque (avatar + name + city/contact) */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[14px] font-semibold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {mosque.name?.charAt(0).toUpperCase() || "M"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium text-stone-900">{mosque.name}</p>
          <p className="truncate text-[11.5px] text-stone-500">
            {[mosque.city, contactName].filter(Boolean).join(" · ") || (
              <span className="italic text-stone-300">No city</span>
            )}
          </p>
        </div>
      </div>

      {/* Users (sparkline + count) */}
      <div className="flex items-center gap-2 text-stone-400">
        <Sparkline points={usage.points} />
        <span className="text-[12px] font-medium tabular-nums text-stone-700">{usage.total}</span>
      </div>

      {/* Stripe */}
      <div>
        {stripeConnected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Connected
          </span>
        ) : (
          <span className="text-[12px] text-stone-300">—</span>
        )}
      </div>

      {/* Plan */}
      <div>
        {plan.tone === "off" ? (
          <span className="text-[12px] text-stone-300">—</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              plan.tone === "active" && "bg-emerald-50 text-emerald-700",
              plan.tone === "trial" && "bg-amber-50 text-amber-700"
            )}
          >
            {plan.label}
          </span>
        )}
      </div>

      {/* Joined */}
      <div className="text-[12px] tabular-nums text-stone-600">{joinedSince}</div>

      {/* Admin email */}
      <div className="min-w-0">
        {contactEmail ? (
          <p className="truncate font-mono text-[11.5px] text-stone-600">{contactEmail}</p>
        ) : (
          <span className="text-[12px] text-stone-300">—</span>
        )}
      </div>

      {/* Status */}
      <div>
        {bucket === "onboarding" && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-medium tabular-nums text-amber-700">{pct}%</span>
          </div>
        )}

        {bucket === "ready" && (
          <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
            Ready
          </span>
        )}

        {bucket === "live" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-50 px-2.5 py-0.5 text-[11px] font-medium text-lime-700">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
            Live
          </span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight size={15} className="text-stone-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-stone-500" />
    </Link>
  );
}

type TabSpec = {
  id: Tab;
  label: string;
  count: number;
  emptyText: string;
};

function TabCards({
  tabs,
  selected,
  onSelect,
}: {
  tabs: TabSpec[];
  selected: Tab;
  onSelect: (next: Tab) => void;
}) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tabs.map((tab) => {
        const isSelected = tab.id === selected;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-pressed={isSelected}
            className={cn(
              "flex flex-col items-start rounded-xl border bg-white px-4 py-3 text-left transition-all",
              isSelected
                ? "border-stone-900 ring-1 ring-stone-900"
                : "border-stone-200 hover:border-stone-300"
            )}
          >
            <span
              className={cn(
                "text-[12px] font-medium",
                isSelected ? "text-stone-900" : "text-stone-500"
              )}
            >
              {tab.label}
            </span>
            <span className="mt-1 text-[22px] font-semibold tabular-nums text-stone-900">
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MosqueListBody({
  mosques,
  viewMode,
  emptyText,
}: {
  mosques: Mosque[];
  viewMode: ViewMode;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (mosques.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/40 px-5 py-10 text-center text-[13px] text-stone-400">
        {emptyText}
      </div>
    );
  }

  const overflowing = mosques.length > COLLAPSED_LIMIT;
  const visible = expanded || !overflowing ? mosques : mosques.slice(0, COLLAPSED_LIMIT);

  return (
    <>
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((m, i) => {
            const bucket = getBucket(m) ?? "onboarding";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(i * 0.015, 0.18) }}
              >
                <MosqueCard mosque={m} bucket={bucket} />
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <div className="min-w-[1100px]">
            <TableHeader />
            {visible.map((m, i) => {
              const bucket = getBucket(m) ?? "onboarding";
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.015, 0.18) }}
                >
                  <MosqueRow mosque={m} bucket={bucket} isLast={i === visible.length - 1} />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
        >
          <ChevronDown
            size={14}
            className={cn("transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Show less" : `Show all ${mosques.length}`}
        </button>
      )}
    </>
  );
}

export default function MosqueList({ mosques }: { mosques: Mosque[] }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedTab, setSelectedTab] = useState<Tab>("all");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hydrate persisted preferences post-mount (window is undefined during SSR).
  useEffect(() => {
    try {
      const storedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (storedView === "grid" || storedView === "list") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setViewMode(storedView);
      }
      const storedTab = window.localStorage.getItem(TAB_STORAGE_KEY);
      if (storedTab === "all" || storedTab === "onboarding" || storedTab === "ready" || storedTab === "live") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTab(storedTab);
      }
    } catch {
      // localStorage unavailable — stick with defaults
    }
  }, []);

  function selectView(next: ViewMode) {
    setViewMode(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function selectTab(next: Tab) {
    setSelectedTab(next);
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function onSearch(v: string) {
    setSearch(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(v), 200);
  }

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return mosques.filter((m) => {
      if (getBucket(m) === null) return false;
      if (!q) return true;
      const { contactName } = getLatestStage(m);
      return [m.name, m.city, contactName]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
  }, [mosques, debouncedSearch]);

  const buckets = useMemo(() => {
    const next: Record<Bucket, Mosque[]> = { onboarding: [], ready: [], live: [] };
    for (const m of filtered) {
      const bucket = getBucket(m);
      if (bucket) next[bucket].push(m);
    }
    return next;
  }, [filtered]);

  const totalEligible = useMemo(
    () => mosques.filter((m) => getBucket(m) !== null).length,
    [mosques]
  );

  if (totalEligible === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white py-20">
        <Building2 size={48} className="mb-4 text-stone-300" strokeWidth={1} />
        <p className="text-[15px] font-medium text-stone-600">No active mosques yet</p>
        <p className="mt-1 max-w-md text-center text-[13px] text-stone-400">
          Mosques appear here once they reach onboarding. Move a lead through the{" "}
          <Link href="/pipeline" className="underline underline-offset-2 hover:text-stone-600">
            pipeline
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search active mosques..."
            className="w-full border-none bg-transparent py-2 pl-9 pr-8 text-[13px] text-stone-900 outline-none placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setDebouncedSearch(""); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="h-6 w-px bg-stone-200" />
        <div className="flex overflow-hidden rounded-lg border border-stone-200">
          <button
            type="button"
            onClick={() => selectView("grid")}
            aria-pressed={viewMode === "grid"}
            title="Grid view"
            className={cn(
              "flex items-center justify-center px-2.5 py-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-400 hover:text-stone-600"
            )}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => selectView("list")}
            aria-pressed={viewMode === "list"}
            title="List view"
            className={cn(
              "flex items-center justify-center px-2.5 py-1.5 transition-colors",
              viewMode === "list"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-400 hover:text-stone-600"
            )}
          >
            <LayoutList size={16} />
          </button>
        </div>
      </div>

      <TabCards
        tabs={[
          { id: "all", label: "All", count: filtered.length, emptyText: "No active mosques match your search." },
          ...BUCKET_ORDER.map((b) => ({
            id: b,
            label: SECTION_META[b].title,
            count: buckets[b].length,
            emptyText: SECTION_META[b].emptyText,
          })),
        ]}
        selected={selectedTab}
        onSelect={selectTab}
      />

      <MosqueListBody
        mosques={selectedTab === "all" ? filtered : buckets[selectedTab]}
        viewMode={viewMode}
        emptyText={
          selectedTab === "all"
            ? "No active mosques match your search."
            : SECTION_META[selectedTab].emptyText
        }
      />
    </div>
  );
}
