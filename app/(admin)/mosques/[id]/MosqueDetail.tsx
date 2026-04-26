"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, AlertTriangle, Check, Clock, MoreHorizontal, Users, Activity, BookOpen, Calendar, Mail, Phone, ArrowRight } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { StatusBadge, STAGE_COLORS } from "../../components/StatusBadge";
import PrayerTimesPanel from "./PrayerTimesPanel";
import type { IqamahConfig } from "@/lib/prayer/types";
import { ONBOARDING_CATEGORIES, ALL_TASKS } from "@/app/(masjid)/components/onboarding-tasks";
import { cn } from "@/lib/utils";

type Note = { id: string; mosque_id: string; author_id: string | null; author_name: string | null; content: string; created_at: string };
type PipelineStage = { id: string; mosque_id: string; stage: string; contact_name: string | null; contact_email: string | null; contact_phone: string | null; notes: unknown; updated_at: string };
type Mosque = {
  id: string; name: string; city: string | null; state: string | null; country: string | null; address: string | null;
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
function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  if (s < 2592000) return `${Math.floor(s / 604800)}w ago`;
  if (s < 31536000) return `${Math.floor(s / 2592000)}mo ago`;
  return `${Math.floor(s / 31536000)}y ago`;
}
function daysSince(d: string) { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); }
function showToast(msg: string, type: "success" | "error") { type === "success" ? toast.success(msg) : toast.error(msg); }

type ContentCounts = { programs: number; events: number };

export default function MosqueDetail({ mosque, notes: initialNotes, pipelineStage, iqamahConfig, contentCounts }: { mosque: Mosque; notes: Note[]; pipelineStage: PipelineStage | null; iqamahConfig: IqamahConfig[]; contentCounts: ContentCounts }) {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full text-[18px] font-semibold ring-4 ring-white shadow-md" style={{ backgroundColor: `${color}18`, color }}>
            {mosque.name?.charAt(0).toUpperCase() || "M"}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-stone-900 leading-tight">{mosque.name}</h1>
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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {activeTab === "Overview" && <OverviewTab mosque={mosque} stage={stage} pipeline={pipelineStage} contentCounts={contentCounts} />}
          {activeTab === "Tasks" && <TasksTab progress={mosque.onboarding_progress} />}
          {activeTab === "Notes" && <NotesTab mosqueId={mosque.id} initial={initialNotes} />}
          {activeTab === "Prayer Times" && (
            <PrayerTimesPanel mosque={{ id: mosque.id, name: mosque.name, address: mosque.address, calculation_method: mosque.calculation_method, school: mosque.school }} existingConfig={iqamahConfig} showToast={showToast} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════ OVERVIEW ════════════════════════════ */

const PIPELINE_STAGES = ["lead", "contacted", "demo", "contract", "onboarding", "live"] as const;

function getNextTask(progress: Record<string, boolean> | null) {
  // First incomplete REQ task, then first incomplete any task
  const req = ALL_TASKS.find((t) => t.badge === "REQ" && progress?.[t.id] !== true);
  if (req) return req;
  return ALL_TASKS.find((t) => progress?.[t.id] !== true) || null;
}

function PipelineStepper({ currentStage }: { currentStage: string }) {
  const currentIdx = PIPELINE_STAGES.indexOf(currentStage as typeof PIPELINE_STAGES[number]);
  return (
    <div className="flex items-center justify-between">
      {PIPELINE_STAGES.map((s, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const stageColor = STAGE_COLORS[s];
        return (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition-all"
                style={{
                  backgroundColor: isCurrent ? stageColor.bg : isPast ? "#f5f5f4" : "transparent",
                  color: isCurrent ? stageColor.color : isPast ? "#a8a29e" : "#d6d3d1",
                  border: isCurrent ? `2px solid ${stageColor.dot}` : isPast ? "2px solid #e7e5e4" : "2px dashed #e7e5e4",
                }}
              >
                {isPast ? <Check size={12} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className="mt-2 text-[10px] font-semibold uppercase tracking-wider capitalize whitespace-nowrap"
                style={{
                  color: isCurrent ? stageColor.color : isPast ? "#78716c" : "#d6d3d1",
                }}
              >
                {s}
              </span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div
                className="mx-2 h-0.5 flex-1 -translate-y-3"
                style={{ backgroundColor: i < currentIdx ? "#e7e5e4" : "#f5f5f4" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OverviewTab({
  mosque,
  stage,
  pipeline,
  contentCounts,
}: {
  mosque: Mosque;
  stage: string;
  pipeline: PipelineStage | null;
  contentCounts: ContentCounts;
}) {
  const isLive = stage === "live";
  const isOnboarding = stage === "onboarding";
  const isPipeline = !isLive && !isOnboarding;
  const stats = getStats(mosque.onboarding_progress);
  const stuck = isOnboarding ? daysSince(mosque.updated_at) : 0;
  const nextTask = isOnboarding ? getNextTask(mosque.onboarding_progress) : null;

  const fadeIn = (delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, delay, ease: "easeOut" as const },
  });

  return (
    <div className="space-y-6">
      {/* ── LIVE: Metric Cards ── */}
      {isLive && (
        <motion.div {...fadeIn(0)} className="grid max-w-3xl grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { l: "Users", v: "—", Icon: Users },
            { l: "WAU", v: "—", Icon: Activity },
            { l: "Programs", v: contentCounts.programs > 0 ? String(contentCounts.programs) : "—", Icon: BookOpen },
            { l: "Events", v: contentCounts.events > 0 ? String(contentCounts.events) : "—", Icon: Calendar },
          ].map((m) => (
            <div key={m.l} className="relative rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <m.Icon size={16} className="absolute right-4 top-4 text-stone-400" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{m.l}</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-stone-900">{m.v}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── ONBOARDING: Progress Card ── */}
      {isOnboarding && (
        <motion.div {...fadeIn(0)} className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[14px] font-semibold text-stone-900">Onboarding Progress</p>
            <span className="text-[20px] font-semibold tabular-nums text-teal-600">{stats.pct}%</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-stone-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${stats.pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Started</p>
              <p className="mt-0.5 text-[13px] font-medium text-stone-900">{fmtDate(mosque.created_at) || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Tasks</p>
              <p className="mt-0.5 text-[13px] font-medium text-stone-900">{stats.completed}/{stats.total}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Stuck</p>
              {stuck > 3 ? (
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <AlertTriangle size={11} /> {stuck}d
                </span>
              ) : (
                <p className="mt-0.5 text-[13px] font-medium text-stone-900">{stuck}d</p>
              )}
            </div>
          </div>
          {nextTask && (
            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="flex items-center gap-2 text-[13px] text-stone-600">
                <span className="font-medium text-stone-400">Next:</span>
                <span className="font-medium text-stone-900">{nextTask.label}</span>
                <ArrowRight size={13} className="text-stone-300" />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── DETAILS (always shown) ── */}
      <motion.div {...fadeIn(isPipeline ? 0 : 0.1)} className="max-w-3xl overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">Details</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 px-6 py-5">
          {(() => {
            const rows = [
              { l: "Contact", v: pipeline?.contact_name },
              { l: "Email", v: pipeline?.contact_email },
              { l: "Phone", v: pipeline?.contact_phone },
              { l: "City", v: mosque.city },
              { l: "Country", v: mosque.country },
              { l: "Stage", v: stage, cap: true },
              { l: "Status", v: mosque.subscription_status, cap: true },
              ...(isLive ? [{ l: "Launched", v: fmtDate(mosque.launched_at) }, { l: "Last Activity", v: fmtDate(mosque.updated_at) }] : []),
            ];
            return rows.map((r, i) => {
              const isLastRow = i >= rows.length - 2;
              return (
                <div key={r.l} className={cn("py-3", !isLastRow && "border-b border-stone-100")}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{r.l}</p>
                  <p className={cn("mt-0.5 text-[13px]", r.v ? "font-medium text-stone-900" : "italic text-stone-300", r.cap && "capitalize")}>
                    {r.v || "Not provided"}
                  </p>
                </div>
              );
            });
          })()}
        </div>
      </motion.div>

      {/* ── PIPELINE: Stepper + Quick Actions ── */}
      {isPipeline && (
        <motion.div {...fadeIn(0.1)} className="max-w-3xl rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="mb-5 text-[14px] font-semibold text-stone-900">Pipeline Status</p>
          <PipelineStepper currentStage={stage} />

          {/* Quick Actions */}
          <div className="mt-6 border-t border-stone-100 pt-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Quick Actions</p>
            {pipeline?.contact_email || pipeline?.contact_phone ? (
              <div className="flex gap-2">
                {pipeline?.contact_email && (
                  <a
                    href={`mailto:${pipeline.contact_email}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <Mail size={13} className="text-stone-400" />
                    {pipeline.contact_email}
                  </a>
                )}
                {pipeline?.contact_phone && (
                  <a
                    href={`tel:${pipeline.contact_phone}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <Phone size={13} className="text-stone-400" />
                    {pipeline.contact_phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-[12px] italic text-stone-400">
                No contact info — add in Details above
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ════════════════════════════ TASKS ════════════════════════════ */

const CAT_DOT_COLORS: Record<string, string> = {
  Foundation: "bg-blue-500",
  "Prayer & Worship": "bg-emerald-500",
  Content: "bg-violet-500",
  Revenue: "bg-amber-500",
  Team: "bg-cyan-500",
  Launch: "bg-rose-500",
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
          <p className="text-xl font-semibold tabular-nums text-stone-900">{stats.completed}/{stats.total}</p>
          <p className="text-[12px] text-stone-500">tasks complete</p>
        </div>
      </div>

      {/* Categories */}
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }} className="space-y-8">
        {ONBOARDING_CATEGORIES.map((cat) => {
          const done = cat.tasks.filter((t) => progress?.[t.id] === true).length;
          const dotColor = CAT_DOT_COLORS[cat.label] || "bg-stone-400";
          return (
            <div key={cat.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", dotColor)} />
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
                            <span
                              className={cn(
                                "cursor-default rounded-md px-1.5 py-0.5 uppercase tracking-wider",
                                task.badge === "REQ"
                                  ? "text-[10px] font-bold"
                                  : "text-[10px] font-semibold"
                              )}
                              style={
                                task.badge === "REQ"
                                  ? { backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }
                                  : { backgroundColor: "#fafaf9", border: "1px solid #e7e5e4", color: "#a8a29e" }
                              }
                            >
                              {task.badge}
                            </span>
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
      <div>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); add(); } }}
          placeholder="Write a note..." rows={3} disabled={saving}
          className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-[14px] text-stone-900 shadow-sm outline-none transition-all placeholder:text-stone-400 focus:border-stone-300 focus:ring-2 focus:ring-stone-200"
        />
        <div className="mt-2 flex justify-end">
          <button onClick={add} disabled={saving || !input.trim()}
            className={cn("rounded-lg px-5 py-2 text-[13px] font-semibold transition-all duration-200",
              input.trim()
                ? "bg-stone-900 text-white shadow-sm cursor-pointer hover:bg-stone-800 active:scale-[0.98]"
                : "bg-stone-100 text-stone-400 cursor-not-allowed"
            )}>
            {saving ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>

      {/* Section divider */}
      {notes.length > 0 && (
        <div className="mb-4 mt-6 flex items-center gap-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-stone-400">Previous Notes</span>
          <div className="h-px flex-1 bg-stone-100" />
        </div>
      )}

      {/* Notes */}
      {notes.length === 0 ? (
        <div className="mt-6 flex flex-col items-center py-16">
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
                <button className="absolute right-3 top-3 rounded-md p-1 text-stone-400 opacity-0 transition-all hover:bg-stone-200 hover:text-stone-600 group-hover:opacity-100">
                  <MoreHorizontal size={15} />
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
