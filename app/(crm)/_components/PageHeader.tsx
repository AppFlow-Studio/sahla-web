import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Required, plain English (Rule #2) */
  title: string;
  /** One-sentence context for the page */
  description?: string;
  /** Single primary action only (Rule #1). Render a Button. */
  action?: ReactNode;
  /** Optional eyebrow text above the title (e.g. "Mosque Setup") */
  eyebrow?: string;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-3 border-b border-[#0A261E]/8 pb-6 md:flex-row md:items-end md:justify-between md:gap-6",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl leading-tight tracking-tight text-[#0A261E] md:text-[34px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-[#0A261E]/60">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
