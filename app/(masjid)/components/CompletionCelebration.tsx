"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";
import { ALL_TASKS, ONBOARDING_CATEGORIES } from "./onboarding-tasks";
import CheckDraw from "@/app/components/CheckDraw";
import {
  BURST_COLORS,
  DUR,
  EASE_OUT_EXPO,
  EASE_OUT_QUART,
  EXIT,
  scatter,
} from "@/lib/motion";

type MilestoneKind = "task" | "category" | "all";

type Milestone = {
  /** Unique per firing so AnimatePresence restarts even on repeat kinds. */
  key: string;
  kind: MilestoneKind;
  title: string;
  detail: string;
};

type CompletionValue = {
  /** Task ids that flipped to done in the most recent update. */
  justCompleted: ReadonlySet<string>;
  /** Category ids whose last remaining task just landed. */
  justCompletedCategories: ReadonlySet<string>;
  /**
   * Celebrate a task that finished outside the progress diff — a task the
   * server already marked done during a redirect (Stripe Connect), so it was
   * already true on the first render this provider ever saw.
   */
  celebrate: (taskId: string) => void;
};

const EMPTY: ReadonlySet<string> = new Set();

const CompletionContext = createContext<CompletionValue>({
  justCompleted: EMPTY,
  justCompletedCategories: EMPTY,
  celebrate: () => {},
});

/** Which items finished just now — lets the sidebar animate only what changed. */
export function useCompletion() {
  return useContext(CompletionContext);
}

/** How long the "fresh" flag stays set for sidebar row animations. */
const FRESH_MS = 1800;
/** How long each celebration stays on screen. */
const DISMISS_MS: Record<MilestoneKind, number> = {
  task: 2600,
  category: 3400,
  all: 4200,
};

export default function CompletionCelebration({
  progress,
  children,
}: {
  progress: Record<string, boolean>;
  children: React.ReactNode;
}) {
  const [justCompleted, setJustCompleted] = useState<ReadonlySet<string>>(EMPTY);
  const [justCompletedCategories, setJustCompletedCategories] =
    useState<ReadonlySet<string>>(EMPTY);
  const [milestone, setMilestone] = useState<Milestone | null>(null);

  const previousRef = useRef<Record<string, boolean> | null>(null);
  // Latest progress, readable from `celebrate()` without making the callback
  // depend on it. Seeded at first render, then kept fresh after every commit.
  const progressRef = useRef(progress);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  const announce = useCallback((freshIds: string[]) => {
    const progress = progressRef.current;
    const freshSet = new Set(freshIds);
    const doneCount = ALL_TASKS.filter((t) => progress[t.id] === true).length;
    const total = ALL_TASKS.length;

    // A category counts as "just completed" only if one of its own tasks was
    // in this batch — otherwise every later save would re-fire it.
    const freshCategories = ONBOARDING_CATEGORIES.filter(
      (c) =>
        c.tasks.some((t) => freshSet.has(t.id)) &&
        c.tasks.every((t) => progress[t.id] === true)
    );
    const categoriesDone = ONBOARDING_CATEGORIES.filter((c) =>
      c.tasks.every((t) => progress[t.id] === true)
    ).length;

    setJustCompleted(freshSet);
    setJustCompletedCategories(new Set(freshCategories.map((c) => c.id)));

    // One celebration per batch, at the highest tier earned.
    let next: Milestone;
    if (doneCount === total) {
      next = {
        key: `all-${doneCount}`,
        kind: "all",
        title: "Your app is ready",
        detail: `All ${total} setup tasks are done.`,
      };
    } else if (freshCategories.length > 0) {
      const category = freshCategories[freshCategories.length - 1];
      next = {
        key: `cat-${category.id}-${doneCount}`,
        kind: "category",
        title: `${category.label} complete`,
        detail: `${categoriesDone} of ${ONBOARDING_CATEGORIES.length} sections done`,
      };
    } else {
      const task = ALL_TASKS.find((t) => t.id === freshIds[freshIds.length - 1]);
      next = {
        key: `task-${task?.id}-${doneCount}`,
        kind: "task",
        title: `${task?.label ?? "Task"} complete`,
        detail: `${doneCount} of ${total} tasks done`,
      };
    }

    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [
      window.setTimeout(() => {
        setJustCompleted(EMPTY);
        setJustCompletedCategories(EMPTY);
      }, FRESH_MS),
      window.setTimeout(() => setMilestone(null), DISMISS_MS[next.kind]),
    ];
    setMilestone(next);
  }, []);

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = progress;

    // First render only seeds the baseline. Work finished in an earlier
    // session isn't news — nobody wants confetti for reopening a tab.
    if (!previous) return;

    const freshIds = ALL_TASKS.filter(
      (t) => progress[t.id] === true && previous[t.id] !== true
    ).map((t) => t.id);
    if (freshIds.length > 0) announce(freshIds);
  }, [progress, announce]);

  const celebrate = useCallback(
    (taskId: string) => {
      if (progressRef.current[taskId] !== true) return;
      announce([taskId]);
    },
    [announce]
  );

  const value = useMemo(
    () => ({ justCompleted, justCompletedCategories, celebrate }),
    [justCompleted, justCompletedCategories, celebrate]
  );

  return (
    // `reducedMotion="user"` makes every transform animation under onboarding
    // honour the OS setting — transforms are skipped, opacity fades stay.
    <MotionConfig reducedMotion="user">
      <CompletionContext.Provider value={value}>
        {children}
        <AnimatePresence>
          {milestone?.kind === "task" && (
            <TaskPill key={milestone.key} milestone={milestone} />
          )}
          {milestone && milestone.kind !== "task" && (
            <MilestoneCard
              key={milestone.key}
              milestone={milestone}
              onDismiss={() => setMilestone(null)}
            />
          )}
        </AnimatePresence>
      </CompletionContext.Provider>
    </MotionConfig>
  );
}

/**
 * Single task done: a quiet pill at the bottom of the screen. Errors already
 * own the top-right corner, so wins get their own side of the viewport.
 */
function TaskPill({ milestone }: { milestone: Milestone }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center">
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98, transition: EXIT }}
        transition={{ duration: DUR.reveal, ease: EASE_OUT_EXPO }}
        className="flex items-center gap-2.5 rounded-full bg-dark-green py-2 pl-2 pr-5 shadow-lg shadow-dark-green/25"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-dark-green">
          <CheckDraw size={13} strokeWidth={3.5} delay={0.12} />
        </span>
        <span className="text-[13px] font-semibold text-[#fffbf2]">
          {milestone.title}
        </span>
        <span className="text-[12px] tabular-nums text-[#fffbf2]/55">
          {milestone.detail}
        </span>
      </motion.div>
    </div>
  );
}

/**
 * A whole section (or the entire setup) done: the one moment in onboarding
 * that earns the full screen. Auto-dismisses; click or Escape closes early.
 */
function MilestoneCard({
  milestone,
  onDismiss,
}: {
  milestone: Milestone;
  onDismiss: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const isFinale = milestone.kind === "all";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-green/20 backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: EXIT }}
      transition={{ duration: DUR.state, ease: EASE_OUT_QUART }}
      onClick={onDismiss}
    >
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97, transition: EXIT }}
        transition={{ duration: DUR.reveal, ease: EASE_OUT_EXPO }}
        className="relative flex flex-col items-center rounded-2xl bg-[#fffbf2] px-12 py-10 text-center shadow-2xl ring-1 ring-dark-green/10"
      >
        <div className="relative flex h-16 w-16 items-center justify-center">
          {!reduceMotion && <Burst seed={milestone.key.length} dense={isFinale} />}
          <svg
            className="absolute inset-0 h-16 w-16 -rotate-90"
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="29" stroke="#0A261E" strokeOpacity={0.08} strokeWidth={3} />
            <motion.circle
              cx="32"
              cy="32"
              r="29"
              stroke={isFinale ? "#B8922A" : "#10B981"}
              strokeWidth={3}
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.62, ease: EASE_OUT_EXPO, delay: 0.06 }}
            />
          </svg>
          <span className={isFinale ? "text-[#B8922A]" : "text-emerald-600"}>
            <CheckDraw size={30} strokeWidth={2.6} delay={0.3} />
          </span>
        </div>

        <h2 className="mt-5 font-display text-[26px] leading-tight text-dark-green">
          {milestone.title}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-stone-500">{milestone.detail}</p>
      </motion.div>
    </motion.div>
  );
}

/** Particle scatter behind the milestone check. Skipped for reduced motion. */
function Burst({ seed, dense }: { seed: number; dense: boolean }) {
  const particles = useMemo(() => {
    const count = dense ? 22 : 14;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + scatter(i, seed) * 0.5;
      const distance = 54 + scatter(i, seed + 1) * (dense ? 78 : 52);
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        size: 4 + scatter(i, seed + 2) * 4,
        color: BURST_COLORS[i % BURST_COLORS.length],
        duration: 0.75 + scatter(i, seed + 3) * 0.45,
      };
    });
  }, [seed, dense]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            backgroundColor: p.color,
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, 1, 0.4],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: 0.24,
            ease: EASE_OUT_QUART,
            times: [0, 0.35, 1],
          }}
        />
      ))}
    </div>
  );
}
