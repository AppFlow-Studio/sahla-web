export const STAGE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  lead: { bg: "bg-zinc-800", text: "text-zinc-300", border: "border-l-zinc-500" },
  contacted: { bg: "bg-blue-950", text: "text-blue-300", border: "border-l-blue-500" },
  demo: { bg: "bg-purple-950", text: "text-purple-300", border: "border-l-purple-500" },
  contract: { bg: "bg-amber-950", text: "text-amber-300", border: "border-l-amber-500" },
  onboarding: { bg: "bg-cyan-950", text: "text-cyan-300", border: "border-l-cyan-500" },
  live: { bg: "bg-emerald-950", text: "text-emerald-300", border: "border-l-emerald-500" },
};

export function StatusBadge({ stage }: { stage: string }) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS.lead;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${colors.bg} ${colors.text}`}
    >
      {stage}
    </span>
  );
}
