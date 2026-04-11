"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Building2, X, ChevronDown } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Dropdown } from "../components/Dropdown";
import { cn } from "@/lib/utils";

type Mosque = {
  id: string;
  name: string;
  city: string | null;
  brand_color: string | null;
  onboarding_status: string | null;
  onboarding_progress: Record<string, unknown> | null;
  pipeline_stages: {
    stage: string;
    contact_name: string | null;
  }[] | null;
};

const STAGES = ["lead", "contacted", "demo", "contract", "onboarding", "live"] as const;

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

export default function MosqueList({ mosques }: { mosques: Mosque[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function onSearch(v: string) {
    setSearch(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(v), 200);
  }

  const list = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return mosques.filter((m) => {
      const stage = m.pipeline_stages?.[0]?.stage || "lead";
      if (statusFilter !== "all" && stage !== statusFilter) return false;
      if (!q) return true;
      return [m.name, m.city, m.pipeline_stages?.[0]?.contact_name]
        .filter(Boolean)
        .some((s) => s!.toLowerCase().includes(q));
    });
  }, [mosques, debouncedSearch, statusFilter]);

  return (
    <div>
      {/* ── Unified filter bar ── */}
      <div className="mb-4 flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1.5">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search mosques..."
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
        <Dropdown
          value={statusFilter}
          onChange={(v) => setStatusFilter(String(v))}
          options={[
            { value: "all", label: "All stages" },
            ...STAGES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
          ]}
          minWidth={160}
          align="right"
          renderTrigger={(selected) => (
            <div className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] font-medium text-stone-700 transition-colors hover:text-stone-900">
              <span>{selected?.label || "All stages"}</span>
              <ChevronDown size={14} className="text-stone-400" />
            </div>
          )}
        />
      </div>

      {/* ── Count ── */}
      <p className="mb-3 text-[12px] text-subtle">
        Showing <span className="font-semibold text-ink">{list.length}</span> mosque{list.length !== 1 ? "s" : ""}
      </p>

      {/* ── List ── */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          {mosques.length === 0 ? (
            <>
              <Building2 size={48} className="mb-4 text-stone-300" strokeWidth={1} />
              <p className="text-[15px] font-medium text-stone-600">Add your first mosque</p>
              <p className="mt-1 text-[13px] text-stone-400">Get started by adding a mosque to your pipeline.</p>
            </>
          ) : (
            <>
              <Search size={40} className="mb-4 text-stone-300" strokeWidth={1} />
              <p className="text-[14px] text-stone-500">No mosques match your filters</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          {list.map((mosque, i) => {
            const stage = mosque.pipeline_stages?.[0]?.stage || "lead";
            const isOnboarding = stage === "onboarding";
            const pct = isOnboarding ? getOnboardingPct(mosque.onboarding_progress) : 0;
            const color = mosque.brand_color || nameToColor(mosque.name || "M");

            return (
              <motion.div
                key={mosque.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.2) }}
              >
                <Link
                  href={`/mosques/${mosque.id}`}
                  className={cn(
                    "group flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-stone-50/80",
                    i < list.length - 1 && "border-b border-stone-100"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {mosque.name?.charAt(0).toUpperCase() || "M"}
                  </div>

                  {/* Name + city */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-stone-900">{mosque.name}</p>
                    <p className="truncate text-[12px] text-stone-500">
                      {[mosque.city, mosque.pipeline_stages?.[0]?.contact_name].filter(Boolean).join(" · ") || (
                        <span className="italic text-stone-300">No city</span>
                      )}
                    </p>
                  </div>

                  {/* Onboarding mini bar */}
                  {isOnboarding && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-stone-200">
                        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-medium tabular-nums text-teal-600">{pct}%</span>
                    </div>
                  )}

                  {/* Badge */}
                  <StatusBadge stage={stage} />

                  {/* Chevron */}
                  <ChevronRight size={16} className="shrink-0 text-stone-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-stone-500" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
