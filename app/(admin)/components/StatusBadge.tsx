import { cn } from "@/lib/utils";

export const STAGE_COLORS: Record<
  string,
  { bg: string; text: string; dot: string; border: string }
> = {
  lead:       { bg: "bg-stone-100",   text: "text-stone-600",   dot: "bg-stone-400",   border: "border-l-stone-400" },
  contacted:  { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500",    border: "border-l-blue-500" },
  demo:       { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500",   border: "border-l-amber-500" },
  contract:   { bg: "bg-violet-50",   text: "text-violet-700",  dot: "bg-violet-500",  border: "border-l-violet-500" },
  onboarding: { bg: "bg-teal-50",     text: "text-teal-700",    dot: "bg-teal-500",    border: "border-l-teal-500" },
  live:       { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500", border: "border-l-emerald-500" },
};

export function StatusBadge({
  stage,
  size = "sm",
}: {
  stage: string;
  size?: "sm" | "md";
}) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS.lead;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium capitalize",
        colors.bg,
        colors.text,
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
      {stage}
    </span>
  );
}
