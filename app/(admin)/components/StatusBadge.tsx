import { cn } from "@/lib/utils";

// Static class strings so Tailwind's JIT compiler can detect them at build time.
// Using dynamic string interpolation or variable lookups in `bg-${x}` breaks detection.
const BADGE_CLASSES: Record<string, string> = {
  lead: "bg-stone-100 text-stone-600",
  contacted: "bg-blue-50 text-blue-700",
  demo: "bg-amber-50 text-amber-700",
  contract: "bg-violet-50 text-violet-700",
  onboarding: "bg-teal-50 text-teal-700",
  live: "bg-emerald-50 text-emerald-700",
};

const DOT_CLASSES: Record<string, string> = {
  lead: "bg-stone-400",
  contacted: "bg-blue-500",
  demo: "bg-amber-500",
  contract: "bg-violet-500",
  onboarding: "bg-teal-500",
  live: "bg-emerald-500",
};

export const STAGE_COLORS: Record<string, { border: string }> = {
  lead: { border: "border-l-stone-400" },
  contacted: { border: "border-l-blue-500" },
  demo: { border: "border-l-amber-500" },
  contract: { border: "border-l-violet-500" },
  onboarding: { border: "border-l-teal-500" },
  live: { border: "border-l-emerald-500" },
};

export function StatusBadge({
  stage,
  size = "sm",
}: {
  stage: string;
  size?: "sm" | "md";
}) {
  const badgeClass = BADGE_CLASSES[stage] || BADGE_CLASSES.lead;
  const dotClass = DOT_CLASSES[stage] || DOT_CLASSES.lead;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium capitalize",
        badgeClass,
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      {stage}
    </span>
  );
}
