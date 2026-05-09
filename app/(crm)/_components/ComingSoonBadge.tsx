import { cn } from "@/lib/utils";

type Props = {
  /** Brass = default, ghost = transparent on dark sidebar */
  variant?: "brass" | "ghost";
  size?: "xs" | "sm";
  className?: string;
};

export default function ComingSoonBadge({
  variant = "brass",
  size = "xs",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-semibold uppercase tracking-wider",
        size === "xs"
          ? "px-1.5 py-0.5 text-[9px]"
          : "px-2 py-0.5 text-[10px]",
        variant === "brass"
          ? "bg-[#B8922A]/15 text-[#B8922A]"
          : "border border-[#fffbf2]/15 text-[#fffbf2]/55",
        className
      )}
    >
      Soon
    </span>
  );
}
