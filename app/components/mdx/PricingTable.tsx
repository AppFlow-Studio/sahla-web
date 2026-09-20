import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type PricingPlan = {
  name: string;
  price: string;
  /** e.g. "/month". Omit for one-time or custom pricing. */
  period?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
};

export type PricingTableProps = {
  plans: PricingPlan[];
};

/** /pricing, comparison pages. */
export function PricingTable({ plans }: PricingTableProps) {
  if (plans.length === 0) return null;

  return (
    <div className="not-prose grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "flex flex-col gap-6 rounded-2xl border p-7",
            plan.highlighted ? "border-ink bg-ink" : "border-edge bg-card"
          )}
        >
          <div>
            <p
              className={cn(
                "text-[13px] font-semibold tracking-[0.05em] uppercase",
                plan.highlighted ? "text-sand/70" : "text-ink/60"
              )}
            >
              {plan.name}
            </p>
            <p className="mt-3 flex items-baseline gap-1">
              <span
                className={cn(
                  "font-[family-name:var(--font-playfair)] text-[36px] leading-none",
                  plan.highlighted ? "text-sand" : "text-ink"
                )}
              >
                {plan.price}
              </span>
              {plan.period && (
                <span className={cn("text-[13px]", plan.highlighted ? "text-sand/60" : "text-ink/50")}>
                  {plan.period}
                </span>
              )}
            </p>
          </div>

          <ul className="flex flex-1 flex-col gap-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[13px]">
                <IconCheck
                  size={15}
                  stroke={2.5}
                  className={cn("mt-0.5 shrink-0", plan.highlighted ? "text-gold" : "text-ink")}
                />
                <span className={plan.highlighted ? "text-sand/80" : "text-ink/75"}>{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={plan.ctaHref}
            className={cn(
              "rounded-full px-6 py-3 text-center text-[13px] font-semibold tracking-[0.02em] transition-transform duration-200 hover:-translate-y-px",
              plan.highlighted ? "bg-sand text-ink" : "border border-ink/15 text-ink"
            )}
          >
            {plan.ctaLabel}
          </Link>
        </div>
      ))}
    </div>
  );
}
