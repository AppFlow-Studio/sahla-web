"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
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
import AddLeadModal from "@/app/components/AddLeadModal";
import CreateAccountModal from "@/app/components/Modal";
import OnboardingInviteModal from "./OnboardingInviteModal";

type OnboardingPrompt = {
  mosqueId: string;
  mosqueName: string;
  contactName: string | null;
  contactEmail: string | null;
};

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

/** Matches MasjidCard left accent per stage when dragging over a column */
const STAGE_DROP_BORDER_CLASS: Record<Stage, string> = {
  lead: "border-slate-400",
  contacted: "border-sky-500",
  demo: "border-violet-500",
  contract: "border-amber-500",
  onboarding: "border-cyan-600",
  live: "border-lime-500",
};

const STAGE_ORDER: Stage[] = ["lead", "contacted", "demo", "contract", "onboarding", "live"];

function DraggableMasjidCard({ card, onMoveNext, onNoteAdded, onContactEdited, onCreateAccount }: { card: KanbanCard; onMoveNext: () => void; onNoteAdded: (note: string) => void; onContactEdited: (name: string, email: string) => void; onCreateAccount?: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(card.id),
    data: { card },
  });

  // dnd-kit's internal aria-describedby counter drifts between SSR and CSR.
  // Skip spreading dnd attributes until after hydration to avoid the mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      ref={setNodeRef}
      {...(mounted ? listeners : {})}
      {...(mounted ? attributes : {})}
      className={`touch-none ${isDragging ? "opacity-50" : ""}`}
    >
      <MasjidCard card={card} onMoveNext={onMoveNext} onNoteAdded={onNoteAdded} onContactEdited={onContactEdited} onCreateAccount={onCreateAccount} />
    </div>
  );
}

function DroppableColumn({
  column,
  columnCards,
  dragging,
  onMoveNext,
  onNoteAdded,
  onContactEdited,
  onCreateAccount,
}: {
  column: Column;
  columnCards: KanbanCard[];
  dragging: boolean;
  onMoveNext: (card: KanbanCard) => void;
  onNoteAdded: (card: KanbanCard, note: string) => void;
  onContactEdited: (card: KanbanCard, name: string, email: string) => void;
  onCreateAccount: (card: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { stage: column.id },
  });
  const [animateRef] = useAutoAnimate({ duration: 200 });

  const showDropHere = dragging && columnCards.length === 0;

  return (
    <section className="flex min-w-[320px] shrink-0 flex-col">
      <header className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${column.dotClass}`} aria-hidden />
        <h2 className="text-sm font-semibold text-green">{column.title}</h2>
        <span className="ml-auto rounded-full bg-green/10 px-2 py-0.5 text-xs tabular-nums text-green/80">
          {columnCards.length}
        </span>
      </header>
      <div
        ref={setNodeRef}
        className={`rounded-xl border p-2 transition-[border-color,box-shadow,background-color] duration-200 ${
          isOver
            ? `border-dashed border-2 bg-tan/80 ${STAGE_DROP_BORDER_CLASS[column.id]}`
            : "border border-green/10 bg-white"
        }`}
      >
        {columnCards.length === 0 ? (
          <div className="flex min-h-[140px] items-center justify-center px-2 py-6 text-sm text-green/50">
            {showDropHere ? "Drop here" : "Empty"}
          </div>
        ) : (
          <div ref={animateRef} className="flex w-full flex-col gap-[5px] self-start">
            {columnCards.map((card) => (
              <DraggableMasjidCard key={String(card.id)} card={card} onMoveNext={() => onMoveNext(card)} onNoteAdded={(note) => onNoteAdded(card, note)} onContactEdited={(name, email) => onContactEdited(card, name, email)} onCreateAccount={() => onCreateAccount(card)} />
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
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [graduatingMosqueId, setGraduatingMosqueId] = useState<string | null>(null);
  const [onboardingPrompt, setOnboardingPrompt] =
    useState<OnboardingPrompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");

  useEffect(() => {
    setLocalCards(cards);
  }, [cards]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    for (const card of localCards) {
      if (card.state) states.add(card.state);
    }
    return Array.from(states).sort();
  }, [localCards]);

  const filteredCards = useMemo(() => {
    let result = localCards;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.mosqueName.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          (c.contactEmail && c.contactEmail.toLowerCase().includes(q))
      );
    }

    if (stateFilter !== "all") {
      result = result.filter((c) => c.state === stateFilter);
    }

    return result;
  }, [localCards, searchQuery, stateFilter]);

  const stats = useMemo(() => {
    const total = filteredCards.length;
    const live = filteredCards.filter((c) => c.stage === "live").length;
    const value = live * 300;
    return {
      totalMosques: total,
      liveMosques: live,
      pipelineValue: value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }),
    };
  }, [filteredCards]);

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
    for (const card of filteredCards) {
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
  }, [filteredCards]);

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

      if (newStage === "onboarding") {
        setOnboardingPrompt({
          mosqueId: mosqueIdPayload,
          mosqueName: movingCard.mosqueName,
          contactName: movingCard.contactName || null,
          contactEmail: movingCard.contactEmail ?? null,
        });
      }
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

  async function handleMoveNext(card: KanbanCard) {
    const idx = STAGE_ORDER.indexOf(card.stage);
    if (idx === -1 || idx >= STAGE_ORDER.length - 1) {
      pushToast(`${card.mosqueName} is already at the last stage.`, "error");
      return;
    }

    const newStage = STAGE_ORDER[idx + 1];
    const previousStage = card.stage;
    const cardId = String(card.id);
    const nowIso = new Date().toISOString();

    setLocalCards((prev) =>
      prev.map((c) =>
        String(c.id) === cardId ? { ...c, stage: newStage, updatedAt: nowIso } : c
      )
    );

    const mosqueIdPayload = String(card.mosqueId ?? card.id).trim();
    if (!mosqueIdPayload) {
      pushToast("Missing mosque id — cannot save move.", "error");
      setLocalCards((prev) =>
        prev.map((c) => (String(c.id) === cardId ? { ...c, stage: previousStage } : c))
      );
      return;
    }

    try {
      const res = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mosqueId: mosqueIdPayload, newStage }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to move mosque.");
      }
      pushToast(`${card.mosqueName} moved to ${newStage}.`, "success");
    } catch (error) {
      setLocalCards((prev) =>
        prev.map((c) => (String(c.id) === cardId ? { ...c, stage: previousStage } : c))
      );
      const message = error instanceof Error ? error.message : "Failed to move mosque.";
      pushToast(message, "error");
    }
  }

  function handleNoteAdded(card: KanbanCard, note: string) {
    const cardId = String(card.id);
    setLocalCards((prev) =>
      prev.map((c) =>
        String(c.id) === cardId ? { ...c, referredBy: note } : c
      )
    );
    pushToast(`Note added to ${card.mosqueName}.`, "success");
  }

  function handleContactEdited(card: KanbanCard, name: string, email: string) {
    const cardId = String(card.id);
    setLocalCards((prev) =>
      prev.map((c) =>
        String(c.id) === cardId
          ? { ...c, contactName: name, contactEmail: email || null }
          : c
      )
    );
    pushToast(`Contact updated for ${card.mosqueName}.`, "success");
  }

  function handleLeadSaved(mosqueName: string) {
    setIsLeadModalOpen(false);
    pushToast(`${mosqueName} added to pipeline.`, "success");
    router.refresh();
  }

  function handleCreateAccountForCard(card: KanbanCard) {
    setGraduatingMosqueId(String(card.mosqueId ?? card.id));
    setIsCreateAccountModalOpen(true);
  }

  function handleAccountCreated(mosqueName: string) {
    setIsCreateAccountModalOpen(false);
    setGraduatingMosqueId(null);
    pushToast(`${mosqueName} account created.`, "success");
    router.refresh();
  }

  const dragging = activeCard !== null;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsLeadModalOpen(true)}
          className="rounded-full border border-green/15 bg-white px-4 py-2 text-sm font-medium text-green shadow-sm transition hover:border-green/25 hover:bg-tan/50"
        >
          + Add lead
        </button>
      </div>
      <AddLeadModal
        open={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={handleLeadSaved}
      />
      <CreateAccountModal
        open={isCreateAccountModalOpen}
        onClose={() => { setIsCreateAccountModalOpen(false); setGraduatingMosqueId(null); }}
        onSuccess={handleAccountCreated}
        existingMosqueId={graduatingMosqueId}
      />
      <OnboardingInviteModal
        open={onboardingPrompt !== null}
        mosqueName={onboardingPrompt?.mosqueName ?? ""}
        contactName={onboardingPrompt?.contactName ?? null}
        contactEmail={onboardingPrompt?.contactEmail ?? null}
        onSkip={() => setOnboardingPrompt(null)}
        onSend={async () => {
          if (!onboardingPrompt) return;
          const { mosqueId, mosqueName, contactName, contactEmail } = onboardingPrompt;
          if (!contactEmail) throw new Error("No contact email on file.");

          const res = await fetch("/api/pipeline/create-account", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              mosqueId,
              mosqueName,
              contactName: contactName ?? "",
              contactEmail,
            }),
          });

          const body = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
          };

          if (res.status === 409) {
            // Mosque already has a Clerk org — treat as info, not error.
            pushToast(`${mosqueName} already has an active invitation.`, "success");
            setOnboardingPrompt(null);
            router.refresh();
            return;
          }

          if (!res.ok || body.ok === false) {
            throw new Error(body.error ?? `Failed to send invitation (${res.status}).`);
          }

          pushToast(`Invitation sent to ${contactEmail}.`, "success");
          setOnboardingPrompt(null);
          router.refresh();
        }}
      />

      {/* Stats bar */}
      <div className="mt-2 mb-5 grid grid-cols-3 gap-4">
        {[
          { label: "Total Mosques", value: stats.totalMosques },
          { label: "Pipeline Value", value: `${stats.pipelineValue}/mo` },
          { label: "Live Mosques", value: stats.liveMosques },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-xl border border-green/10 bg-white px-5 py-4"
          >
            <p className="text-xs font-medium text-green/50">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-green">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & state filter */}
      <div className="mt-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-80">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mosques or contacts..."
            className="w-full rounded-full border border-green/12 bg-white py-2 pl-9 pr-3 text-sm text-green placeholder:text-green/40 outline-none transition focus:border-green/30 focus:ring-1 focus:ring-green/15"
          />
        </div>

        <div className="relative min-w-35">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full appearance-none rounded-full border border-green/12 bg-white py-2 pl-3 pr-8 text-sm text-green outline-none transition cursor-pointer focus:border-green/30 focus:ring-1 focus:ring-green/15"
          >
            <option value="all">All States</option>
            {uniqueStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-green/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div>
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
                onMoveNext={handleMoveNext}
                onNoteAdded={handleNoteAdded}
                onContactEdited={handleContactEdited}
                onCreateAccount={handleCreateAccountForCard}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <motion.div
                className="cursor-grabbing"
                initial={{ scale: 1, rotate: 0, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                animate={{ scale: 1.03, rotate: 1.5, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.06)" }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ borderRadius: 12 }}
              >
                <MasjidCard card={activeCard} />
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div className="pointer-events-none fixed top-4 right-4 z-60 flex w-[320px] max-w-[90vw] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg ${
                t.tone === "success"
                  ? "border-green/15 bg-white text-green"
                  : "border-highlight/50 bg-white text-green"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
