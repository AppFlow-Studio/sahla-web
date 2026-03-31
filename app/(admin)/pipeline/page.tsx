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
  type PipelineRow = {
    id: string;
    stage: string | null;
    contact_name: string | null;
    updated_at: string | null;
    mosques: {
      id: string;
      name: string | null;
      city: string | null;
      state: string | null;
      onboarding_progress: number | null | Record<string, unknown>;
    } | null;
  };
  const { data } = await supabase
  .from("pipeline_stages")
  .select(`
    id,
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
  `)
  .order("updated_at", { ascending: false });
  console.log("FIRST ROW:", JSON.stringify(data?.[0], null, 2));
  const cards: KanbanCard[] = ((data ?? []) as PipelineRow[]).map((row) => {
    const mosque = row.mosques
  
    return {
      id: row.id,
      mosqueId: mosque?.id ?? "—",
      mosqueName: mosque?.name ?? "—",
      city: mosque?.city ?? "—",
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
    <div>
      <h1 className="font-display text-3xl text-tan-light">Pipeline</h1>
      <p className="mt-2 text-tan-muted">
        Mosque onboarding pipeline. Track leads and progress here.
      </p>
      <KanbanBoard cards={cards} />
    </div>
  );
}
