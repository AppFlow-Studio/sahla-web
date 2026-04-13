"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { STAGE_COLORS } from "../components/StatusBadge";
import { cn } from "@/lib/utils";
import MosqueKanbanCard from "./MosqueKanbanCard";
import {
  STAGES,
  STAGE_LABELS,
  isStage,
  normalizeStages,
  type KanbanMosque,
  type Stage,
} from "./mosque-kanban-types";

type Props = {
  mosques: KanbanMosque[];
  /** Lowercased, trimmed search query */
  searchQuery: string;
  /** Active stage filter or "all" */
  statusFilter: string;
};

function matchesSearch(m: KanbanMosque, q: string): boolean {
  if (!q) return true;
  const stages = normalizeStages(m.pipeline_stages);
  return [m.name, m.city, stages[0]?.contact_name]
    .filter(Boolean)
    .some((s) => s!.toLowerCase().includes(q));
}

function Column({
  stage,
  mosques,
  searchQuery,
  dimmed,
}: {
  stage: Stage;
  mosques: KanbanMosque[];
  searchQuery: string;
  dimmed: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageColor = STAGE_COLORS[stage];

  return (
    <section
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-xl bg-stone-50/50 p-3 transition-opacity",
        dimmed && "opacity-40 pointer-events-none"
      )}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 border-b border-stone-200/60 bg-stone-50/50 pb-2 backdrop-blur-sm">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: stageColor.dot }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          {STAGE_LABELS[stage]}
        </span>
        <span className="ml-auto text-xs font-medium text-stone-400">
          {mosques.length}
        </span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-y-auto rounded-lg transition-colors",
          isOver && "bg-stone-100/80"
        )}
      >
        {mosques.length === 0 ? (
          <p className="py-8 text-center text-xs italic text-stone-300">
            No mosques
          </p>
        ) : (
          <motion.div
            className="space-y-2"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.03 } },
            }}
          >
            {mosques.map((mosque) => (
              <motion.div
                key={mosque.id}
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.2 }}
              >
                <MosqueKanbanCard
                  mosque={mosque}
                  dimmed={!matchesSearch(mosque, searchQuery)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function MosqueKanbanView({
  mosques,
  searchQuery,
  statusFilter,
}: Props) {
  const router = useRouter();
  const [localMosques, setLocalMosques] = useState(mosques);
  const [activeMosque, setActiveMosque] = useState<KanbanMosque | null>(null);

  // Sync from server when refreshed
  useEffect(() => {
    setLocalMosques(mosques);
  }, [mosques]);

  const buckets = useMemo(() => {
    const next: Record<Stage, KanbanMosque[]> = {
      lead: [],
      contacted: [],
      demo: [],
      contract: [],
      onboarding: [],
      live: [],
    };
    for (const m of localMosques) {
      const stages = normalizeStages(m.pipeline_stages);
      const raw = stages[0]?.stage;
      const stage = isStage(raw) ? raw : "lead";
      next[stage].push(m);
    }
    return next;
  }, [localMosques]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const m = event.active.data.current?.mosque as KanbanMosque | undefined;
    setActiveMosque(m ?? null);
  }

  function handleDragCancel() {
    setActiveMosque(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveMosque(null);
    if (!over) return;

    const mosqueId = String(active.id);
    if (!isStage(over.id)) return;
    const newStage = over.id;

    const moving = localMosques.find((m) => m.id === mosqueId);
    if (!moving) return;
    const movingStages = normalizeStages(moving.pipeline_stages);
    const previousStage =
      (movingStages[0]?.stage as Stage | undefined) || "lead";
    if (previousStage === newStage) return;

    const nowIso = new Date().toISOString();

    // Optimistic update
    setLocalMosques((prev) =>
      prev.map((m) =>
        m.id === mosqueId
          ? {
              ...m,
              pipeline_stages: [
                {
                  stage: newStage,
                  contact_name: normalizeStages(m.pipeline_stages)[0]?.contact_name ?? null,
                  updated_at: nowIso,
                },
              ],
            }
          : m
      )
    );

    try {
      const res = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mosqueId, newStage }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to move mosque.");
      }
      toast.success(`Moved ${moving.name} to ${STAGE_LABELS[newStage]}`);
      router.refresh();
    } catch (err) {
      const rollbackStages = normalizeStages(moving.pipeline_stages);
      setLocalMosques((prev) =>
        prev.map((m) =>
          m.id === mosqueId
            ? {
                ...m,
                pipeline_stages: [
                  {
                    stage: previousStage,
                    contact_name: rollbackStages[0]?.contact_name ?? null,
                    updated_at: rollbackStages[0]?.updated_at ?? null,
                  },
                ],
              }
            : m
        )
      );
      const message = err instanceof Error ? err.message : "Failed to move mosque.";
      toast.error(message);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Horizontally scrolling board with right-edge fade */}
      <div className="relative">
        <div className="scroll-smooth flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const dimmed = statusFilter !== "all" && statusFilter !== stage;
            return (
              <Column
                key={stage}
                stage={stage}
                mosques={buckets[stage]}
                searchQuery={searchQuery}
                dimmed={dimmed}
              />
            );
          })}
        </div>
        {/* Right-edge fading gradient (decorative) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#fffbf2] to-transparent" />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeMosque ? (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.04, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <MosqueKanbanCard mosque={activeMosque} overlay />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
