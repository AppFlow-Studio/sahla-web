"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, AlertTriangle, Check, Clock, Trash2 } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { StatusBadge } from "../../components/StatusBadge";
import PrayerTimesPanel from "./PrayerTimesPanel";
import type { IqamahConfig } from "@/lib/prayer/types";
import { ONBOARDING_CATEGORIES, ALL_TASKS } from "@/app/(masjid)/components/onboarding-tasks";
import { cn } from "@/lib/utils";

type Note = { id: string; mosque_id: string; author_id: string | null; author_name: string | null; content: string; created_at: string };
type PipelineStage = { id: string; mosque_id: string; stage: string; contact_name: string | null; contact_email: string | null; contact_phone: string | null; notes: unknown; updated_at: string };
type Mosque = {
  id: string; name: string; city: string | null; state: string | null; address: string | null;
  subscription_status: string | null; onboarding_status: string | null; onboarding_progress: Record<string, boolean> | null;
  launched_at: string | null; created_at: string; updated_at: string; brand_color: string | null;
  calculation_method: number | null; school: number | null;
};

const TABS = ["Overview", "Tasks", "Notes", "Prayer Times"] as const;
type Tab = (typeof TABS)[number];

const AVATAR_PALETTE = ["#64748b", "#6366f1", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0d9488"];
function nameToColor(name: string) { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]; }

function getStats(progress: Record<string, boolean> | null) {
  if (!progress) return { completed: 0, total: ALL_TASKS.length, pct: 0 };
  const c = ALL_TASKS.filter((t) => progress[t.id] === true).length;
  return { completed: c, total: ALL_TASKS.length, pct: Math.round((c / ALL_TASKS.length) * 100) };
}
function fmtDate(d: string | null) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null; }
function timeAgo(d: string) { const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000); if (s < 60) return "just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; if (s < 604800) return `${Math.floor(s / 86400)}d ago`; return fmtDate(d) || "—"; }
function daysSince(d: string) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }
function showToast(msg: string, type: "success" | "error") { type === "success" ? toast.success(msg) : toast.error(msg); }

export default function MosqueDetail({ mosque, notes: initialNotes, pipelineStage, iqamahConfig }: { mosque: Mosque; notes: Note[]; pipelineStage: PipelineStage | null; iqamahConfig: IqamahConfig[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const stage = pipelineStage?.stage || "lead";
  const color = mosque.brand_color || nameToColor(mosque.name || "M");

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/mosques" className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-bold ring-2 ring-white shadow-sm" style={{ backgroundColor: `${color}18`, color }}>
            {mosque.name?.charAt(0).toUpperCase() || "M"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 leading-tight">{mosque.name}</h1>
            <p className="mt-0.5 text-[13px] text-stone-500">
              {[mosque.city, pipelineStage?.contact_name, pipelineStage?.contact_email].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
        <StatusBadge stage={stage} size="md" />
      </div>

      {/* ── Tabs ── */}
      <div className="relative mb-6 flex gap-1 border-b border-stone-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-4 pb-3 pt-1 text-[13px] font-medium transition-colors",
              activeTab === tab ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gold" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {activeTab === "Overview" && <OverviewTab mosque={mosque} stage={stage} pipeline={pipelineStage} />}
          {activeTab === "Tasks" && <TasksTab progress={mosque.onboarding_progress} />}
          {activeTab === "Notes" && <NotesTab mosqueId={mosque.id} initial={initialNotes} />}
          {activeTab === "Prayer Times" && (
            <PrayerTimesPanel mosque={{ id: mosque.id, address: mosque.address, calculation_method: mosque.calculation_method, school: mosque.school }} existingConfig={iqamahConfig} showToast={showToast} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════ OVERVIEW ════════════════════════════ */

function OverviewTab({ mosque, stage, pipeline }: { mosque: Mosque; stage: string; pipeline: PipelineStage | null }) {
  const isLive = stage === "live";
  const isOnboarding = stage === "onboarding";
  const stats = getStats(mosque.onboarding_progress);
  const stuck = isOnboarding ? daysSince(mosque.updated_at) : 0;

  return (
    <div className="space-y-5">
      {isLive && (
        <div className="grid grid-cols-4 gap-4">
          {[{ l: "Users", v: "—" }, { l: "WAU", v: "—" }, { l: "Programs", v: "—" }, { l: "Events", v: "—" }].map((m) => (
            <div key={m.l} className="rounded-xl border border-stone-200 bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{m.l}</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-stone-900">{m.v}</p>
            </div>
          ))}
        </div>
      )}

      {isOnboarding && (
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] font-semibold text-stone-900">Onboarding Progress</p>
            <span className="text-[13px] font-bold tabular-nums text-teal-600">{stats.pct}%</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-stone-100">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${stats.pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
          <div className="flex gap-6">
            {[
              { l: "Started", v: fmtDate(mosque.created_at) || "—" },
              { l: "Tasks", v: `${stats.completed}/${stats.total}` },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{s.l}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-stone-900">{s.v}</p>
              </div>
            ))}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Stuck</p>
              {stuck > 3 ? (
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <AlertTriangle size={11} /> {stuck}d
                </span>
              ) : (
                <p className="mt-0.5 text-[13px] font-semibold text-stone-900">{stuck}d</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="mb-5 text-[14px] font-semibold text-stone-900">Details</p>
        <div className="grid grid-cols-2 gap-x-8">
          {[
            { l: "Contact", v: pipeline?.contact_name },
            { l: "Email", v: pipeline?.contact_email },
            { l: "Phone", v: pipeline?.contact_phone },
            { l: "City", v: mosque.city },
            { l: "Stage", v: stage, cap: true },
            { l: "Status", v: mosque.subscription_status, cap: true },
            ...(isLive ? [{ l: "Launched", v: fmtDate(mosque.launched_at) }, { l: "Last Activity", v: fmtDate(mosque.updated_at) }] : []),
          ].map((r) => (
            <div key={r.l} className="border-b border-stone-100 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{r.l}</p>
              <p className={cn("mt-0.5 text-[13px]", r.v ? "font-medium text-stone-900" : "italic text-stone-300", r.cap && "capitalize")}>
                {r.v || "Not provided"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ TASKS ════════════════════════════ */

const CAT_COLORS: Record<string, string> = {
  Foundation: "bg-blue-500", "Prayer & Worship": "bg-emerald-500", Content: "bg-violet-500",
  Revenue: "bg-amber-500", Team: "bg-cyan-500", Launch: "bg-rose-500",
};

function TasksTab({ progress }: { progress: Record<string, boolean> | null }) {
  const stats = getStats(progress);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (stats.pct / 100) * circumference;

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 flex items-center gap-5 rounded-xl border border-stone-200 bg-white p-5">
        <svg width={48} height={48} className="-rotate-90">
          <circle cx={24} cy={24} r={18} fill="none" stroke="#f1f0ee" strokeWidth={4} />
          <motion.circle
            cx={24} cy={24} r={18} fill="none" stroke="#0891b2" strokeWidth={4} strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeDasharray={circumference}
          />
        </svg>
        <div>
          <p className="text-xl font-bold tabular-nums text-stone-900">{stats.completed}/{stats.total}</p>
          <p className="text-[12px] text-stone-500">tasks complete</p>
        </div>
      </div>

      {/* Categories */}
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
        {ONBOARDING_CATEGORIES.map((cat) => {
          const dotColor = CAT_COLORS[cat.label] || "bg-stone-400";
          const done = cat.tasks.filter((t) => progress?.[t.id] === true).length;
          return (
            <div key={cat.id} className="mb-7">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{cat.label}</span>
                <span className="text-[10px] font-semibold tabular-nums text-stone-300">{done}/{cat.tasks.length}</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                {cat.tasks.map((task, i) => {
                  const isDone = progress?.[task.id] === true;
                  return (
                    <motion.div
                      key={task.id}
                      variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 transition-colors hover:bg-stone-50",
                        i < cat.tasks.length - 1 && "border-b border-stone-100",
                        isDone && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </motion.div>
                        ) : (
                          <div className="h-5 w-5 rounded-md border-2 border-stone-300 transition-colors hover:border-stone-400" />
                        )}
                        <span className={cn("text-[13px] font-medium", isDone ? "text-stone-400 line-through" : "text-stone-800")}>{task.label}</span>
                      </div>
                      <Tooltip.Provider delayDuration={200}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <span className={cn("cursor-default rounded-full px-2 py-0.5 text-[9px] font-bold",
                              task.badge === "REQ" ? "bg-red-50 text-red-600" : "bg-stone-100 text-stone-500"
                            )}>{task.badge}</span>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs text-white shadow-lg"
                              sideOffset={5}
                            >
                              {task.badge === "REQ" ? "Required for launch" : "Recommended but optional"}
                              <Tooltip.Arrow className="fill-stone-900" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ════════════════════════════ NOTES ════════════════════════════ */

function NotesTab({ mosqueId, initial }: { mosqueId: string; initial: Note[] }) {
  const [notes, setNotes] = useState(initial);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!input.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: input, authorName: "Admin" }) });
      if (!res.ok) throw new Error();
      const note = await res.json();
      setNotes((p) => [note, ...p]);
      setInput("");
      toast.success("Note added");
    } catch { toast.error("Failed to add note"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      {/* Input */}
      <div className="mb-6">
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); add(); } }}
          placeholder="Write a note..." rows={3} disabled={saving}
          className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] text-stone-900 shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-200"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={add} disabled={saving || !input.trim()}
            className={cn("rounded-lg px-5 py-2 text-[13px] font-semibold transition-all",
              input.trim() ? "bg-ink text-sand shadow-sm hover:shadow-md active:scale-[0.98]" : "bg-stone-100 text-stone-400 cursor-not-allowed"
            )}>
            {saving ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>

      {/* Notes */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <MessageSquare size={48} className="mb-4 text-stone-200" strokeWidth={1} />
          <p className="text-[15px] font-medium text-stone-500">No notes yet</p>
          <p className="mt-1 text-[13px] text-stone-400">Add the first note above</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {notes.map((n) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="group relative rounded-xl border border-stone-200 bg-white px-5 py-4 transition-colors hover:bg-stone-50">
                <button className="absolute right-3 top-3 rounded-md p-1 text-stone-300 opacity-0 transition-all hover:bg-stone-200 hover:text-stone-600 group-hover:opacity-100">
                  <Trash2 size={14} />
                </button>
                <p className="text-[14px] leading-relaxed text-stone-800">{n.content}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600">
                    {n.author_name || "Admin"}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-stone-400">
                    <Clock size={11} /> {timeAgo(n.created_at)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
