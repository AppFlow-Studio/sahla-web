"use client";

import { motion } from "framer-motion";
import {
  Check,
  CreditCard,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "../../_components/PageHeader";
import { useMosque } from "../../_lib/mock-mosque";
import { formatUsd, relativeShort } from "../../_lib/format";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    id: "core" as const,
    name: "Sahla Core",
    price: 300,
    description: "Branded iOS + Android app, donations, prayer times.",
    features: [
      "Fully branded iOS + Android binary",
      "Stripe Connect donations",
      "Prayer times + iqamah configuration",
      "Members directory (read-only)",
    ],
  },
  {
    id: "core_crm" as const,
    name: "Sahla Core + CRM",
    price: 325,
    description:
      "Everything in Core plus the full Mosque CRM — programs, events, RSVPs, notifications, and the dashboard you're using right now.",
    features: [
      "Everything in Sahla Core",
      "Programs & Events with RSVP wizard",
      "Notifications + reusable templates",
      "Speakers registry",
      "Donations dashboard with trend chart",
      "Real-time activity feed",
    ],
  },
  {
    id: "complete" as const,
    name: "Sahla Complete",
    price: 500,
    description: "Everything plus business ads, reels, and white-glove launch.",
    features: [
      "Everything in Core + CRM",
      "Business Ads marketplace",
      "Reels (vertical video)",
      "TV Mode for the lobby",
      "White-glove launch + monthly review",
    ],
  },
];

const INVOICES = [
  { id: "inv_03", date: "2026-04-01", amount: 325, status: "paid" as const },
  { id: "inv_02", date: "2026-03-01", amount: 325, status: "paid" as const },
  { id: "inv_01", date: "2026-02-01", amount: 325, status: "paid" as const },
];

export default function SubscriptionClient() {
  const mosque = useMosque();
  const currentTier = TIERS.find((t) => t.id === mosque.tier) ?? TIERS[1];
  const nextBilling = new Date();
  nextBilling.setDate(1);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Subscription"
        description="Your plan, next bill, and invoices. Card and tax settings live in your Stripe customer portal."
        action={
          <a href="https://billing.stripe.com" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              Stripe customer portal
              <ExternalLink size={13} />
            </Button>
          </a>
        }
      />

      {/* Current plan banner */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 rounded-3xl bg-[#0A261E] p-6 text-[#fffbf2] md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#B8922A]" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#B8922A]">
                Current plan
              </span>
            </div>
            <h2 className="mt-2 font-display text-[28px] leading-tight text-[#E8D5B0]">
              {currentTier.name}
            </h2>
            <p className="mt-1 max-w-md text-[13px] text-[#fffbf2]/65">
              {currentTier.description}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#fffbf2]/45">
                Monthly
              </p>
              <p className="font-display text-[36px] leading-none text-[#fffbf2]">
                {formatUsd(currentTier.price)}
              </p>
            </div>
            <p className="text-[11.5px] text-[#fffbf2]/55">
              Next bill:{" "}
              {nextBilling.toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Tier cards */}
      <section className="mb-6">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
          Plans
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {TIERS.map((tier) => {
            const active = tier.id === currentTier.id;
            return (
              <article
                key={tier.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-white p-5 transition-shadow",
                  active
                    ? "border-[#B8922A] shadow-[0_0_0_4px_rgba(184,146,42,0.08)]"
                    : "border-[#0A261E]/8 hover:border-[#0A261E]/15"
                )}
              >
                {active ? (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#B8922A] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    <Check size={10} strokeWidth={3} /> Active
                  </span>
                ) : null}
                <h4 className="font-display text-[18px] text-[#0A261E]">
                  {tier.name}
                </h4>
                <p className="mt-2 font-display text-[28px] leading-none text-[#0A261E]">
                  {formatUsd(tier.price)}
                  <span className="ml-1 text-[12px] font-sans font-normal text-[#0A261E]/55">
                    /mo
                  </span>
                </p>
                <p className="mt-2 text-[12px] text-[#0A261E]/55">
                  {tier.description}
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-[12.5px] text-[#0A261E]/75">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        className="mt-0.5 shrink-0 text-[#B8922A]"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                {!active ? (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-center"
                      onClick={() =>
                        toast(
                          `Plan changes happen in the Stripe portal — opening shortly`
                        )
                      }
                    >
                      {tier.price > currentTier.price ? "Upgrade" : "Switch"}
                      <ArrowUpRight size={12} />
                    </Button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {/* Invoices */}
      <section className="rounded-2xl border border-[#0A261E]/8 bg-white">
        <header className="flex items-center justify-between border-b border-[#0A261E]/6 px-5 py-3">
          <div className="flex items-center gap-2">
            <Receipt size={14} className="text-[#0A261E]/55" />
            <h2 className="text-[13px] font-semibold text-[#0A261E]">
              Recent invoices
            </h2>
          </div>
          <a
            href="https://billing.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11.5px] text-[#0A261E]/55 hover:text-[#0A261E]"
          >
            See all
            <ArrowUpRight size={11} />
          </a>
        </header>
        <ul className="divide-y divide-[#0A261E]/6">
          {INVOICES.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center gap-4 px-5 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#fffbf2]">
                <CreditCard size={13} className="text-[#0A261E]/55" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#0A261E]">
                  Sahla Core + CRM
                </p>
                <p className="text-[11.5px] text-[#0A261E]/55">
                  {new Date(inv.date).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {relativeShort(inv.date)}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                Paid
              </span>
              <p className="font-display text-[16px] tabular-nums text-[#0A261E]">
                {formatUsd(inv.amount)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
