export type Id = string | number;

export type Stage =
  | "lead"
  | "contacted"
  | "demo"
  | "contract"
  | "onboarding"
  | "live";

export type Column = {
  id: Stage;
  title: string;
  /** Tailwind background class for the header stage dot */
  dotClass: string;
};

/** Mosque card on the board (P1 layout; wire to Supabase later) */
export type KanbanCard = {
  id: Id;
  mosqueId: Id;
  mosqueName: string;
  city: string;
  /** e.g. "NY" — optional; shown as "City, ST" when set */
  state?: string | null;
  contactName: string;
  /** Shown under contact name; omit row when empty */
  contactEmail?: string | null;
  /** e.g. chapter / affiliate; omit row when empty */
  organization?: string | null;
  /** Footer left line; omit when empty */
  referredBy?: string | null;
  stage: Stage;
  /** 0–100 for onboarding progress bar; omit or null when not onboarding */
  onboardingProgress?: number | null;
  updatedAt: string;
};

/** Stage dots match MasjidCard left accent per column */
export const defaultColumns: Column[] = [
  { id: "lead", title: "Lead", dotClass: "bg-slate-400" },
  { id: "contacted", title: "Contacted", dotClass: "bg-sky-500" },
  { id: "demo", title: "Demo", dotClass: "bg-violet-500" },
  { id: "contract", title: "Contract", dotClass: "bg-amber-500" },
  { id: "onboarding", title: "Onboarding", dotClass: "bg-cyan-600" },
  { id: "live", title: "Live", dotClass: "bg-lime-500" },
];
