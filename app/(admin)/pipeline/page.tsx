import KanbanBoard from "@/app/components/kanban/KanbanBoard";
import type { KanbanCard, Stage } from "@/app/components/kanban/types";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
// For P1 we can keep this as a server component and
// pass plain data into the client KanbanBoard.
export default async function PipelinePage() {
  const supabase = await createClerkSupabaseClient();
  const VALID_STAGES = new Set<Stage>([
    "lead",
    "contacted",
    "demo",
    "contract",
    "onboarding",
    "live",
  ]);
  const normalizeStage = (stage: string | null | undefined): Stage => {
    const s = (stage ?? "lead").toLowerCase();
    return VALID_STAGES.has(s as Stage) ? (s as Stage) : "lead";
  };
  type MosqueEmbed = {
    id: string | null;
    name: string | null;
    city: string | null;
    state: string | null;
    onboarding_progress: number | null | Record<string, unknown>;
  };
  type PipelineRow = {
    id: string;
    mosque_id: string | null;
    stage: string | null;
    contact_name: string | null;
    updated_at: string | null;
    mosques: MosqueEmbed | MosqueEmbed[] | null;
  };

  function unwrapMosque(m: PipelineRow["mosques"]): MosqueEmbed | null {
    if (!m) return null;
    return Array.isArray(m) ? (m[0] ?? null) : m;
  }

  const { data, error: pipelineError } = await supabase
    .from("pipeline_stages")
    .select(
      `
    id,
    mosque_id,
    stage,
    contact_name,
    updated_at,
    mosques (
      id,
      name,
      city,
      state,
      onboarding_progress
    )
  `
    )
    .order("updated_at", { ascending: false });

  if (pipelineError) {
    return (
      <div className="-m-8 min-h-[100dvh] bg-tan p-8 text-green">
        <h1 className="font-display text-3xl text-green">Pipeline</h1>
        <p className="mt-4 rounded-xl border border-highlight/40 bg-white p-4 text-sm text-green">
          Could not load pipeline data: {pipelineError.message}
        </p>
      </div>
    );
  }

  const cards: KanbanCard[] = ((data ?? []) as PipelineRow[]).map((row) => {
    const mosque = unwrapMosque(row.mosques);
    const mosqueId = row.mosque_id ?? mosque?.id ?? "";

    return {
      id: mosqueId || row.id,
      mosqueId,
      mosqueName: mosque?.name ?? "Unknown mosque",
      city: mosque?.city ?? "",
      state: mosque?.state ?? null,
      contactName: row.contact_name ?? "—",
      stage: normalizeStage(row.stage),
      onboardingProgress:
        typeof mosque?.onboarding_progress === "number"
          ? mosque.onboarding_progress
          : null,
      updatedAt: row.updated_at ?? new Date(0).toISOString(),
    };
  });

  return (
    <div className="-m-8 min-h-[100dvh] bg-tan p-8 text-green">
      <h1 className="font-display text-3xl text-green">Pipeline</h1>
      <p className="mt-2 max-w-2xl text-sm text-green/75">
        Mosque onboarding pipeline. Track leads and progress here.
      </p>
      <div className="mt-6">
        <KanbanBoard cards={cards} />
      </div>
    </div>
  );
}
