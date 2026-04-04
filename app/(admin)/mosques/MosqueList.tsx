"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge, STAGE_COLORS } from "../components/StatusBadge";

type Mosque = {
  id: string;
  name: string;
  city: string | null;
  onboarding_status: string | null;
  onboarding_progress: Record<string, unknown> | null;
  pipeline_stages: {
    stage: string;
    contact_name: string | null;
  }[] | null;
};

const STAGES = [
  "lead",
  "contacted",
  "demo",
  "contract",
  "onboarding",
  "live",
] as const;

function getOnboardingPercentage(progress: Record<string, unknown> | null): number {
  if (!progress || typeof progress !== "object") return 0;
  const values = Object.values(progress);
  if (values.length === 0) return 0;
  const completed = values.filter((v) => v === true).length;
  return Math.round((completed / values.length) * 100);
}

export default function MosqueList({ mosques }: { mosques: Mosque[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => setDebouncedSearch(value), 200);
  }

  const displayList = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return mosques.filter((m) => {
      const stage = m.pipeline_stages?.[0]?.stage || "lead";
      if (statusFilter !== "all" && stage !== statusFilter) return false;
      if (!q) return true;
      const name = (m.name || "").toLowerCase();
      const city = (m.city || "").toLowerCase();
      const contact = (m.pipeline_stages?.[0]?.contact_name || "").toLowerCase();
      return name.includes(q) || city.includes(q) || contact.includes(q);
    });
  }, [mosques, debouncedSearch, statusFilter]);

  return (
    <div>
      {/* Search + Filter Bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, city, or contact..."
            className="w-full rounded-lg border border-edge bg-card py-2.5 pl-10 pr-10 text-sm text-ink placeholder:text-faint focus:border-edge-bold focus:outline-none"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gold hover:text-ink"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-edge bg-card px-4 py-2.5 text-sm text-ink focus:border-edge-bold focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {STAGES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Mosque List */}
      {displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {mosques.length === 0 ? (
            <>
              <p className="text-lg font-medium text-ink">Add your first mosque</p>
              <p className="mt-1 text-sm text-faint">
                Get started by adding a mosque to your pipeline.
              </p>
            </>
          ) : (
            <p className="text-sm text-faint">No mosques match your search</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayList.map((mosque, i) => {
              const stage = mosque.pipeline_stages?.[0]?.stage || "lead";
              const borderColor = STAGE_COLORS[stage]?.border || "border-l-zinc-500";
              const isOnboarding = stage === "onboarding";
              const isLive = stage === "live";
              const onboardingPct = isOnboarding
                ? getOnboardingPercentage(mosque.onboarding_progress)
                : 0;

              return (
                <motion.div
                  key={mosque.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Link
                    href={`/mosques/${mosque.id}`}
                    className={`flex items-center justify-between rounded-lg border border-edge border-l-[3px] ${borderColor} bg-card px-4 py-3 transition-colors duration-150 hover:border-edge-bold`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        {mosque.name}
                      </p>
                      <p className="text-[11.5px] text-subtle">
                        {[mosque.city, mosque.pipeline_stages?.[0]?.contact_name]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {isOnboarding && (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/10">
                            <div
                              className="h-full rounded-full bg-cyan-400 transition-all"
                              style={{ width: `${onboardingPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium tabular-nums text-cyan-300">
                            {onboardingPct}%
                          </span>
                        </div>
                      )}
                      {isLive && (
                        <span className="text-[11px] font-medium tabular-nums text-emerald-300">
                          — users
                        </span>
                      )}
                      <StatusBadge stage={stage} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
