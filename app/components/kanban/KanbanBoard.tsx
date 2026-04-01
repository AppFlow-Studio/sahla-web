"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { defaultColumns, type Column, type KanbanCard, type Stage } from "./types";
import MasjidCard from "./MasjidCard";
import Modal from "@/app/components/Modal";

const VALID_STAGES = new Set<Stage>([
  "lead",
  "contacted",
  "demo",
  "contract",
  "onboarding",
  "live",
]);

function isStage(id: string | number): id is Stage {
  return VALID_STAGES.has(id as Stage);
}

type Props = {
  cards: KanbanCard[];
};

type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

const STAGE_DROP_BORDER_CLASS: Record<Stage, string> = {
  lead: "border-gray-400/80",
  contacted: "border-blue-500/80",
  demo: "border-purple-500/80",
  contract: "border-amber-500/80",
  onboarding: "border-green-500/80",
  live: "border-emerald-500/80",
};

function DraggableMasjidCard({ card }: { card: KanbanCard }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(card.id),
    data: { card },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none ${isDragging ? "opacity-50" : ""}`}
    >
      <MasjidCard card={card} />
    </div>
  );
}

function DroppableColumn({
  column,
  columnCards,
  dragging,
}: {
  column: Column;
  columnCards: KanbanCard[];
  dragging: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { stage: column.id },
  });

  const laneBg = isOver ? "var(--bg-4, #152018)" : "var(--bg-3)";
  const showDropHere = dragging && columnCards.length === 0;

  return (
    <section className="flex min-w-[320px] shrink-0 flex-col">
      <header className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${column.dotClass}`} aria-hidden />
        <h2 className="text-sm font-medium text-foreground">{column.title}</h2>
        <span className="ml-auto rounded-full bg-foreground/10 px-2 py-0.5 text-xs tabular-nums text-tan-muted">
          {columnCards.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={` rounded-[10px] border p-2 transition-[border-color,background-color] duration-200 ${
          isOver
            ? `border-dashed border-2 ${STAGE_DROP_BORDER_CLASS[column.id]}`
            : "border border-white/5"
        }`}
        style={{ background: laneBg }}
      >
        {columnCards.length === 0 ? (
          <div className="flex min-h-[140px] items-center justify-center px-2 py-6 text-sm text-tan-muted">
            {showDropHere ? "Drop here" : "Empty"}
          </div>
        ) : (
          <div className="flex w-full flex-col gap-[5px] self-start">
            {columnCards.map((card) => (
              <DraggableMasjidCard key={String(card.id)} card={card} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function KanbanBoard({ cards }: Props) {
  const router = useRouter();
  const [localCards, setLocalCards] = useState(cards);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);

  useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  function pushToast(message: string, tone: Toast["tone"]) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }

  const buckets = useMemo(() => {
    const next: Record<Stage, KanbanCard[]> = {
      lead: [],
      contacted: [],
      demo: [],
      contract: [],
      onboarding: [],
      live: [],
    };
    const stages: Stage[] = [
      "lead",
      "contacted",
      "demo",
      "contract",
      "onboarding",
      "live",
    ];
    for (const card of localCards) {
      const stage = stages.includes(card.stage) ? card.stage : "lead";
      next[stage].push(card);
    }
    for (const stage of stages) {
      next[stage].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    return next;
  }, [localCards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const dragCard = event.active.data.current?.card as KanbanCard | undefined;
    setActiveCard(dragCard ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const cardId = String(active.id);
    if (!isStage(over.id)) return;

    const newStage = over.id;

    const movingCard = localCards.find((c) => String(c.id) === cardId);
    if (!movingCard || movingCard.stage === newStage) return;

    const previousStage = movingCard.stage;
    const nowIso = new Date().toISOString();

    // Optimistic update for fast UI.
    setLocalCards((prev) =>
      prev.map((c) =>
        String(c.id) === cardId
          ? {
              ...c,
              stage: newStage,
              updatedAt: nowIso,
            }
          : c
      )
    );

    const mosqueIdPayload = String(
      movingCard.mosqueId ?? movingCard.id
    ).trim();
    if (!mosqueIdPayload) {
      pushToast("Missing mosque id — cannot save move.", "error");
      setLocalCards((prev) =>
        prev.map((c) =>
          String(c.id) === cardId
            ? { ...c, stage: previousStage }
            : c
        )
      );
      return;
    }

    try {
      const res = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mosqueId: mosqueIdPayload,
          newStage,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to move mosque.");
      }

      pushToast(`${movingCard.mosqueName} moved to ${newStage}.`, "success");
    } catch (error) {
      // Revert optimistic change on failure.
      setLocalCards((prev) =>
        prev.map((c) =>
          String(c.id) === cardId
            ? {
                ...c,
                stage: previousStage,
              }
            : c
        )
      );
      const message =
        error instanceof Error ? error.message : "Failed to move mosque.";
      pushToast(message, "error");
    }
  }

  function handleDragCancel() {
    setActiveCard(null);
  }

  function handleAddLeadSuccess(mosqueName: string) {
    setIsAddLeadOpen(false);
    pushToast(`${mosqueName} account created.`, "success");
    router.refresh();
  }

  const dragging = activeCard !== null;

  return (
    <div className="pipeline-kanban flex min-h-screen flex-col p-4">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setIsAddLeadOpen(true)}
          className="rounded-lg border border-[#161C22] bg-black px-4 py-2 text-white"
        >
          + Create account
        </button>
      </div>
      <Modal
        open={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={handleAddLeadSuccess}
      />

      <div className="mt-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex items-start gap-4 overflow-x-auto pb-8">
            {defaultColumns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                columnCards={buckets[column.id]}
                dragging={dragging}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <div className="cursor-grabbing shadow-lg">
                <MasjidCard card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[320px] max-w-[90vw] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md border px-3 py-2 text-sm shadow-lg ${
              t.tone === "success"
                ? "border-green-500/35 bg-green-900/80 text-green-100"
                : "border-red-500/35 bg-red-900/80 text-red-100"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
