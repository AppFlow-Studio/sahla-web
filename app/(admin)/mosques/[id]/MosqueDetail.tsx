"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "../../components/StatusBadge";

type Note = {
  id: string;
  mosque_id: string;
  author_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
};

type PipelineStage = {
  id: string;
  mosque_id: string;
  stage: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: unknown;
  updated_at: string;
};

type Mosque = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  address: string | null;
  subscription_status: string | null;
  onboarding_status: string | null;
  onboarding_progress: Record<string, boolean> | null;
  launched_at: string | null;
  created_at: string;
  updated_at: string;
  brand_color: string | null;
};

const TABS = ["Overview", "Tasks", "Notes"] as const;
type Tab = (typeof TABS)[number];

const ONBOARDING_TASKS: { key: string; label: string; category: string }[] = [
  { key: "mosque_profile", label: "Mosque Profile", category: "Foundation" },
  { key: "app_branding", label: "App Branding", category: "Foundation" },
  { key: "prayer_times", label: "Prayer Times", category: "Prayer" },
  { key: "jummah_setup", label: "Jummah Setup", category: "Prayer" },
  { key: "speakers", label: "Speakers", category: "Content" },
  { key: "programs", label: "Programs", category: "Content" },
  { key: "events", label: "Events", category: "Content" },
  { key: "lectures", label: "Lectures", category: "Content" },
  { key: "donations", label: "Donations", category: "Business" },
  { key: "ads_config", label: "Ads Configuration", category: "Business" },
  { key: "notifications", label: "Notifications", category: "Setup" },
  { key: "tv_display", label: "TV Display", category: "Setup" },
  { key: "app_store_listing", label: "App Store Listing", category: "Launch" },
  { key: "go_live", label: "Go Live", category: "Launch" },
];

function getOnboardingStats(progress: Record<string, boolean> | null) {
  if (!progress) return { completed: 0, total: ONBOARDING_TASKS.length, pct: 0 };
  const completed = ONBOARDING_TASKS.filter((t) => progress[t.key] === true).length;
  return {
    completed,
    total: ONBOARDING_TASKS.length,
    pct: Math.round((completed / ONBOARDING_TASKS.length) * 100),
  };
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function MosqueDetail({
  mosque,
  notes: initialNotes,
  pipelineStage,
}: {
  mosque: Mosque;
  notes: Note[];
  pipelineStage: PipelineStage | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  function showToast(message: string, type: "success" | "error") {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500);
  }

  const stage = pipelineStage?.stage || "lead";
  const isLive = stage === "live";
  const isOnboarding = stage === "onboarding";
  const onboardingStats = getOnboardingStats(mosque.onboarding_progress);

  return (
    <div className="relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed right-8 top-8 z-50 rounded-lg border px-4 py-2 text-sm shadow-lg ${
              toast.type === "error"
                ? "border-red-500/20 bg-red-950 text-red-200"
                : "border-green-accent/20 bg-green-deep text-tan-light"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/mosques"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-accent/20 text-tan-muted transition-colors hover:border-green-accent/40 hover:text-tan-light"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              background: `${mosque.brand_color || "#4a8c65"}22`,
              color: mosque.brand_color || "#4a8c65",
            }}
          >
            {mosque.name?.charAt(0).toUpperCase() || "M"}
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-tan-light">{mosque.name}</h1>
            <p className="text-[12px] text-tan-muted">
              {[
                mosque.city,
                pipelineStage?.contact_name,
                pipelineStage?.contact_email,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        </div>
        <StatusBadge stage={stage} />
      </div>

      {/* Tab Bar */}
      <div className="mb-6 flex gap-6 border-b border-green-accent/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              activeTab === tab ? "text-tan-light" : "text-tan-muted hover:text-tan-light"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-accent"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "Overview" && (
            <OverviewTab
              mosque={mosque}
              stage={stage}
              pipelineStage={pipelineStage}
              isLive={isLive}
              isOnboarding={isOnboarding}
              onboardingStats={onboardingStats}
            />
          )}
          {activeTab === "Tasks" && (
            <TasksTab
              progress={mosque.onboarding_progress}
              onboardingStats={onboardingStats}
            />
          )}
          {activeTab === "Notes" && (
            <NotesTab
              mosqueId={mosque.id}
              initialNotes={initialNotes}
              showToast={showToast}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Overview Tab ─── */

function OverviewTab({
  mosque,
  stage,
  pipelineStage,
  isLive,
  isOnboarding,
  onboardingStats,
}: {
  mosque: Mosque;
  stage: string;
  pipelineStage: PipelineStage | null;
  isLive: boolean;
  isOnboarding: boolean;
  onboardingStats: { completed: number; total: number; pct: number };
}) {
  const stuckDays = isOnboarding ? daysSince(mosque.updated_at) : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards (live mosques) */}
      {isLive && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Users", value: "—" },
            { label: "WAU", value: "—" },
            { label: "Programs", value: "—" },
            { label: "Events", value: "—" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-green-accent/10 bg-green-deep/20 p-4"
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-tan-muted">
                {m.label}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-tan-light">
                {m.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Onboarding Progress (onboarding mosques) */}
      {isOnboarding && (
        <div className="rounded-lg border border-green-accent/10 bg-green-deep/20 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-tan-light">Onboarding Progress</p>
            <span className="text-[12px] font-medium tabular-nums text-cyan-300">
              {onboardingStats.pct}%
            </span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-green-deep">
            <motion.div
              className="h-full rounded-full bg-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${onboardingStats.pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex gap-6 text-[12px]">
            <div>
              <span className="text-tan-muted">Started: </span>
              <span className="text-tan-light">{formatDate(mosque.created_at)}</span>
            </div>
            <div>
              <span className="text-tan-muted">Tasks: </span>
              <span className="text-tan-light">
                {onboardingStats.completed}/{onboardingStats.total}
              </span>
            </div>
            <div>
              <span className="text-tan-muted">Stuck: </span>
              <span className={stuckDays > 3 ? "font-medium text-red-400" : "text-tan-light"}>
                {stuckDays} days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="rounded-lg border border-green-accent/10 bg-green-deep/20 p-5">
        <p className="mb-4 text-sm font-medium text-tan-light">Details</p>
        <div className="grid grid-cols-2 gap-y-3 text-[12px]">
          <DetailRow label="Contact" value={pipelineStage?.contact_name} />
          <DetailRow label="Email" value={pipelineStage?.contact_email} />
          <DetailRow label="Phone" value={pipelineStage?.contact_phone} />
          <DetailRow label="City" value={mosque.city} />
          <DetailRow label="Stage" value={stage} capitalize />
          <DetailRow label="Status" value={mosque.subscription_status} capitalize />
          {isLive && (
            <>
              <DetailRow label="Launched" value={formatDate(mosque.launched_at)} />
              <DetailRow label="Last Activity" value={formatDate(mosque.updated_at)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string | null | undefined;
  capitalize?: boolean;
}) {
  return (
    <>
      <span className="text-tan-muted">{label}</span>
      <span className={`text-tan-light ${capitalize ? "capitalize" : ""}`}>
        {value || "—"}
      </span>
    </>
  );
}

/* ─── Tasks Tab ─── */

function TasksTab({
  progress,
  onboardingStats,
}: {
  progress: Record<string, boolean> | null;
  onboardingStats: { completed: number; total: number; pct: number };
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-tan-muted">
        <span className="font-medium tabular-nums text-tan-light">
          {onboardingStats.completed}/{onboardingStats.total}
        </span>{" "}
        tasks complete
      </p>
      <div className="space-y-1">
        {ONBOARDING_TASKS.map((task, i) => {
          const done = progress?.[task.key] === true;
          return (
            <motion.div
              key={task.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center justify-between rounded-lg border border-green-accent/10 bg-green-deep/20 px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                {done ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                    }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20"
                  >
                    <svg
                      className="h-3 w-3 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  </motion.div>
                ) : (
                  <div className="h-5 w-5 rounded-full border border-green-accent/30" />
                )}
                <span
                  className={`text-[13px] ${
                    done ? "text-tan-muted line-through" : "text-tan-light"
                  }`}
                >
                  {task.label}
                </span>
              </div>
              <span className="text-[11px] text-tan-muted">{task.category}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Notes Tab ─── */

function NotesTab({
  mosqueId,
  initialNotes,
  showToast,
}: {
  mosqueId: string;
  initialNotes: Note[];
  showToast: (message: string, type: "success" | "error") => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [noteInput, setNoteInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addNote() {
    if (!noteInput.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteInput, authorName: "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const newNote = await res.json();
      setNotes((prev) => [newNote, ...prev]);
      setNoteInput("");
      showToast("Note added", "success");
    } catch {
      showToast("Failed to add note", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addNote();
          }}
          placeholder="Add a note..."
          className="flex-1 rounded-lg border border-green-accent/20 bg-green-deep/30 px-4 py-2.5 text-sm text-tan-light placeholder:text-tan-muted/60 focus:border-green-accent/40 focus:outline-none"
          disabled={submitting}
        />
        <button
          onClick={addNote}
          disabled={submitting || !noteInput.trim()}
          className="rounded-lg bg-green-accent/20 px-5 py-2.5 text-sm font-medium text-green-accent transition-colors hover:bg-green-accent/30 disabled:opacity-40"
        >
          {submitting ? "..." : "Add"}
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="py-12 text-center text-sm text-tan-muted">
          No notes yet. Add the first one above.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-green-accent/10 bg-green-deep/20 px-4 py-3"
              >
                <p className="text-[13px] text-tan-light">{note.content}</p>
                <p className="mt-1.5 text-[11px] text-tan-muted">
                  {note.author_name || "Admin"} · {formatDate(note.created_at)}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
