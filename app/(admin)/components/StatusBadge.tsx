type StageStyle = { bg: string; border: string; color: string; dot: string };

const STAGE_STYLES: Record<string, StageStyle> = {
  lead:       { bg: "#fafaf9", border: "#e7e5e4", color: "#57534e", dot: "#a8a29e" },
  contacted:  { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", dot: "#3b82f6" },
  demo:       { bg: "#fffbeb", border: "#fde68a", color: "#b45309", dot: "#f59e0b" },
  contract:   { bg: "#f5f3ff", border: "#ddd6fe", color: "#6d28d9", dot: "#8b5cf6" },
  onboarding: { bg: "#f0fdfa", border: "#99f6e4", color: "#0f766e", dot: "#14b8a6" },
  live:       { bg: "#ecfdf5", border: "#a7f3d0", color: "#047857", dot: "#10b981" },
};

export const STAGE_COLORS = STAGE_STYLES;

export function StatusBadge({
  stage,
  size = "sm",
}: {
  stage: string;
  size?: "sm" | "md";
}) {
  const s = STAGE_STYLES[stage] || STAGE_STYLES.lead;
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md text-[11px] font-semibold uppercase tracking-wide ${padding}`}
      style={{
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {stage}
    </span>
  );
}
