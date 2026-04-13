"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanMosque } from "./mosque-kanban-types";

function getOnboardingPct(progress: Record<string, unknown> | null): number {
  if (!progress) return 0;
  const vals = Object.values(progress);
  if (!vals.length) return 0;
  return Math.round((vals.filter((v) => v === true).length / vals.length) * 100);
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function MosqueKanbanCard({
  mosque,
  dimmed = false,
  overlay = false,
}: {
  mosque: KanbanMosque;
  /** Faded out because it doesn't match the search */
  dimmed?: boolean;
  /** Used in the DragOverlay — disables the draggable wiring + Link */
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: mosque.id,
    data: { mosque },
    disabled: overlay,
  });

  const stage = mosque.pipeline_stages?.[0]?.stage || "lead";
  const contactName = mosque.pipeline_stages?.[0]?.contact_name || null;
  const stageUpdatedAt = mosque.pipeline_stages?.[0]?.updated_at || null;

  const isOnboarding = stage === "onboarding";
  const isLive = stage === "live";
  const isPipelineStage =
    stage === "lead" || stage === "contacted" || stage === "demo" || stage === "contract";

  const onboardingPct = isOnboarding ? getOnboardingPct(mosque.onboarding_progress) : 0;
  const daysInStage = isPipelineStage ? daysSince(stageUpdatedAt ?? mosque.created_at) : null;

  const cardClass = cn(
    "block bg-white rounded-lg border border-stone-200 p-3 shadow-sm transition-all",
    !overlay && "hover:shadow-md cursor-pointer",
    isDragging && !overlay && "opacity-30",
    overlay && "scale-[1.03] shadow-lg",
    dimmed && !isDragging && !overlay && "opacity-30"
  );

  const inner = (
    <>
      <p className="line-clamp-1 text-sm font-medium text-stone-900 leading-tight">
        {mosque.name}
      </p>
      {mosque.city && (
        <p className="mt-0.5 truncate text-xs text-stone-400">{mosque.city}</p>
      )}
      {contactName && (
        <p className="mt-1.5 truncate text-xs text-stone-500">{contactName}</p>
      )}

      {isOnboarding && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${onboardingPct}%` }}
            />
          </div>
          <span className="text-[10px] font-medium tabular-nums text-stone-400">
            {onboardingPct}%
          </span>
        </div>
      )}

      {isLive && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-stone-400">
          <Users size={12} />
          <span>Active</span>
        </div>
      )}

      {isPipelineStage && daysInStage !== null && (
        <p className="mt-2 text-[10px] text-stone-400">
          {daysInStage}d in stage
        </p>
      )}
    </>
  );

  if (overlay) {
    return <div className={cardClass}>{inner}</div>;
  }

  return (
    <Link
      ref={setNodeRef}
      href={`/mosques/${mosque.id}`}
      className={cardClass}
      {...listeners}
      {...attributes}
    >
      {inner}
    </Link>
  );
}
