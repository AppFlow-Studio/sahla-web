export type Stage =
  | "lead"
  | "contacted"
  | "demo"
  | "contract"
  | "onboarding"
  | "live";

export const STAGES: Stage[] = [
  "lead",
  "contacted",
  "demo",
  "contract",
  "onboarding",
  "live",
];

export const STAGE_LABELS: Record<Stage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  demo: "Demo",
  contract: "Contract",
  onboarding: "Onboarding",
  live: "Live",
};

export type KanbanMosque = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  brand_color: string | null;
  onboarding_status: string | null;
  onboarding_progress: Record<string, unknown> | null;
  created_at: string | null;
  pipeline_stages: {
    stage: string;
    contact_name: string | null;
    updated_at: string | null;
  }[] | null;
};

export function isStage(value: unknown): value is Stage {
  return (
    value === "lead" ||
    value === "contacted" ||
    value === "demo" ||
    value === "contract" ||
    value === "onboarding" ||
    value === "live"
  );
}
