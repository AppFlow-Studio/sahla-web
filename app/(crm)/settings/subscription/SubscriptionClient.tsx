"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  CreditCard,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Loader2,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "../../_components/PageHeader";
import { useMosque } from "../../_lib/mock-mosque";
import { formatUsd, relativeShort } from "../../_lib/format";
import { usePlanPricing } from "@/lib/use-plan-pricing";
import type {
  CrmSubscriptionResponse,
  CrmInvoice,
} from "@/app/api/crm/subscription/route";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    id: "core" as const,
    name: "Sahla Core",
    fallback: 300,
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
    fallback: 325,
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
];

/** "visa" → "Visa", null → "Card". */
function cardBrand(brand: string | null): string {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

async function fetchSubscription(): Promise<CrmSubscriptionResponse> {
  const res = await fetch("/api/crm/subscription", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load subscription (${res.status})`);
  return (await res.json()) as CrmSubscriptionResponse;
}

export default function SubscriptionClient() {
  const mosque = useMosque();
  const pricing = usePlanPricing();
  const [portalLoading, setPortalLoading] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  const query = useQuery({
    queryKey: ["crm", "subscription", mosque.id],
    queryFn: fetchSubscription,
    staleTime: 30_000,
  });

  const sub = query.data;
  const tierId = sub?.tier ?? mosque.tier;
  const currentTier = TIERS.find((t) => t.id === tierId) ?? TIERS[1];

  // Live price from Stripe (via /api/pricing), falling back to the tier's list
  // amount until it loads or if the endpoint is unavailable.
  const priceLabel = (id: (typeof TIERS)[number]["id"]) =>
    pricing?.[id]?.formatted ??
    formatUsd(TIERS.find((t) => t.id === id)?.fallback ?? 0);
  const priceAmount = (id: (typeof TIERS)[number]["id"]) =>
    pricing?.[id]?.amount ?? TIERS.find((t) => t.id === id)?.fallback ?? 0;

  async function openPortal() {
    if (mosque.isHQ) {
      toast("HQ preview — sign in as a mosque admin to manage billing.");
      return;
    }
    setPortalLoading(true);
    try {
      const res = await fetch("/api/crm/subscription/portal", {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.url) {
        throw new Error(body.error ?? `Couldn't open portal (${res.status}).`);
      }
      window.location.href = body.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open portal.");
      setPortalLoading(false);
    }
  }

  async function addBackupCard() {
    if (mosque.isHQ) {
      toast("HQ preview — sign in as a mosque admin to manage billing.");
      return;
    }
    setBackupBusy(true);
    try {
      const res = await fetch("/api/mosques/me/backup-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: "settings" }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.checkoutUrl) {
        throw new Error(body.error ?? `Couldn't start setup (${res.status}).`);
      }
      window.location.href = body.checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add card.");
      setBackupBusy(false);
    }
  }

  async function promoteBackupCard() {
    setBackupBusy(true);
    try {
      const res = await fetch("/api/crm/subscription/backup-card/promote", {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Couldn't switch card (${res.status}).`);
      }
      toast.success("Backup card is now your primary card.");
      await query.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't switch card.");
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Subscription"
        description="Your plan, next bill, and invoices. Card and tax settings live in your Stripe customer portal."
        action={
          <Button
            variant="outline"
            onClick={openPortal}
            disabled={portalLoading || !sub?.hasStripeCustomer}
          >
            {portalLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Opening…
              </>
            ) : (
              <>
                Stripe customer portal
                <ExternalLink size={13} />
              </>
            )}
          </Button>
        }
      />

      {/* Current plan banner */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 rounded-3xl bg-[var(--mosque-primary,#0A261E)] p-6 text-[var(--mosque-primary-fg,#fffbf2)] md:p-8"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: "var(--mosque-accent, #B8922A)" }} />
              <span
                className="text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--mosque-accent, #B8922A)" }}
              >
                Current plan
              </span>
            </div>
            <h2 className="mt-2 font-display text-[28px] leading-tight text-[var(--mosque-primary-fg,#fffbf2)]">
              {currentTier.name}
            </h2>
            <p className="mt-1 max-w-md text-[13px] text-[var(--mosque-primary-fg,#fffbf2)]/65">
              {currentTier.description}
            </p>
            {sub?.cancelAtPeriodEnd ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100/15 px-2.5 py-1 text-[11.5px] font-semibold text-amber-200">
                Cancellation scheduled at period end
              </p>
            ) : sub?.status && sub.status !== "active" && sub.status !== "trialing" ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-100/15 px-2.5 py-1 text-[11.5px] font-semibold text-red-200">
                Status: {sub.status}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end md:text-right">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--mosque-primary-fg,#fffbf2)]/45">
                Monthly
              </p>
              <p className="font-display text-[36px] leading-none text-[var(--mosque-primary-fg,#fffbf2)]">
                {priceLabel(currentTier.id)}
              </p>
            </div>
            <p className="text-[11.5px] text-[var(--mosque-primary-fg,#fffbf2)]/55">
              {sub?.currentPeriodEnd ? (
                <>
                  {sub.cancelAtPeriodEnd ? "Ends" : "Renews"}:{" "}
                  {new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </>
              ) : (
                "Billing not yet active"
              )}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Tier cards */}
      <section className="mb-6">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
          Plans
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {TIERS.map((tier) => {
            const active = tier.id === currentTier.id;
            return (
              <article
                key={tier.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-white p-5 transition-shadow",
                  active
                    ? "border-[var(--mosque-accent,#B8922A)] shadow-[0_0_0_4px_rgba(184,146,42,0.08)]"
                    : "border-[#0A261E]/8 hover:border-[#0A261E]/15"
                )}
              >
                {active ? (
                  <span
                    className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                    style={{ background: "var(--mosque-accent, #B8922A)" }}
                  >
                    <Check size={10} strokeWidth={3} /> Active
                  </span>
                ) : null}
                <h4 className="font-display text-[18px] text-[#0A261E]">{tier.name}</h4>
                <p className="mt-2 font-display text-[28px] leading-none text-[#0A261E]">
                  {priceLabel(tier.id)}
                  <span className="ml-1 text-[12px] font-sans font-normal text-[#0A261E]/55">
                    /mo
                  </span>
                </p>
                <p className="mt-2 text-[12px] text-[#0A261E]/55">{tier.description}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-[12.5px] text-[#0A261E]/75">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        size={12}
                        strokeWidth={2.5}
                        className="mt-0.5 shrink-0"
                        style={{ color: "var(--mosque-accent, #B8922A)" }}
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
                      onClick={openPortal}
                      disabled={portalLoading}
                    >
                      {priceAmount(tier.id) > priceAmount(currentTier.id)
                        ? "Upgrade"
                        : "Switch"}
                      <ArrowUpRight size={12} />
                    </Button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {/* Payment methods */}
      <section className="mb-6">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
          Payment methods
        </h3>
        <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
          {/* Primary card */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--mosque-surface,#fffbf2)]">
              <CreditCard size={15} className="text-[#0A261E]/60" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#0A261E]">
                {sub?.primaryCard
                  ? `${cardBrand(sub.primaryCard.brand)} •••• ${sub.primaryCard.last4 ?? "••••"}`
                  : "Primary card"}
              </p>
              <p className="text-[11.5px] text-[#0A261E]/55">
                Charged for your subscription
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0A261E]/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#0A261E]/65">
              Primary
            </span>
          </div>

          <div className="my-4 h-px bg-[#0A261E]/6" />

          {/* Backup card */}
          {sub?.backupCard ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--mosque-surface,#fffbf2)]">
                <ShieldCheck size={15} className="text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#0A261E]">
                  {`${cardBrand(sub.backupCard.brand)} •••• ${sub.backupCard.last4 ?? "••••"}`}
                </p>
                <p className="text-[11.5px] text-[#0A261E]/55">
                  {sub.backupIsPrimary
                    ? "Currently used as your primary card"
                    : "On file — used only if you switch to it"}
                </p>
              </div>
              {sub.backupIsPrimary ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  <Check size={10} strokeWidth={3} /> In use
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={promoteBackupCard}
                  disabled={backupBusy}
                >
                  {backupBusy ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : null}
                  Make primary
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--mosque-surface,#fffbf2)]">
                <Plus size={15} className="text-[#0A261E]/50" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#0A261E]">
                  No backup card
                </p>
                <p className="text-[11.5px] text-[#0A261E]/55">
                  Add one to switch billing instantly if your primary fails.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addBackupCard}
                disabled={backupBusy || !sub?.hasStripeCustomer}
              >
                {backupBusy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : null}
                Add backup card
              </Button>
            </div>
          )}
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
          <button
            type="button"
            onClick={openPortal}
            disabled={portalLoading || !sub?.hasStripeCustomer}
            className="inline-flex items-center gap-1 text-[11.5px] text-[#0A261E]/55 hover:text-[#0A261E] disabled:opacity-50"
          >
            See all in Stripe
            <ArrowUpRight size={11} />
          </button>
        </header>
        <InvoiceList loading={query.isLoading} invoices={sub?.invoices ?? []} />
      </section>
    </>
  );
}

function InvoiceList({
  loading,
  invoices,
}: {
  loading: boolean;
  invoices: CrmInvoice[];
}) {
  if (loading) {
    return (
      <div className="px-5 py-8 text-center text-[12.5px] text-[#0A261E]/55">
        <Loader2 size={14} className="mr-1.5 inline animate-spin" />
        Loading invoices…
      </div>
    );
  }
  if (invoices.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-[12.5px] text-[#0A261E]/55">
        No invoices yet. Your first one lands after Stripe Checkout completes.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[#0A261E]/6">
      {invoices.map((inv) => (
        <li key={inv.id} className="flex items-center gap-4 px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--mosque-surface,#fffbf2)]">
            <CreditCard size={13} className="text-[#0A261E]/55" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#0A261E]">
              {inv.number ?? "Subscription invoice"}
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
          <InvoiceStatusBadge status={inv.status} />
          <p className="font-display text-[16px] tabular-nums text-[#0A261E]">
            {formatUsd(inv.amountPaid)}
          </p>
          {inv.hostedInvoiceUrl ? (
            <a
              href={inv.hostedInvoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-[#0A261E]/55 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
              aria-label="View invoice"
            >
              <ExternalLink size={12} />
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : status === "open" || status === "uncollectible"
      ? "bg-amber-50 text-amber-700"
      : "bg-[#0A261E]/[0.06] text-[#0A261E]/65";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cls
      )}
    >
      {status}
    </span>
  );
}
