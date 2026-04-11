type StageStyle = { bg: string; color: string; dot: string; border: string };

const STAGE_STYLES: Record<string, StageStyle> = {
  lead:       { bg: "#f5f5f4", color: "#57534e", dot: "#a8a29e", border: "#a8a29e" },
  contacted:  { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6", border: "#3b82f6" },
  demo:       { bg: "#fffbeb", color: "#b45309", dot: "#f59e0b", border: "#f59e0b" },
  contract:   { bg: "#f5f3ff", color: "#6d28d9", dot: "#8b5cf6", border: "#8b5cf6" },
  onboarding: { bg: "#f0fdfa", color: "#0f766e", dot: "#14b8a6", border: "#14b8a6" },
  live:       { bg: "#ecfdf5", color: "#047857", dot: "#10b981", border: "#10b981" },
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
  const sizeClass = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium capitalize ${sizeClass}`}
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {stage}
    </span>
  );
}
