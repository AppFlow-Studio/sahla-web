import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getPlanPricing } from "@/lib/pricing";
import {
  getSubscriptionSummary,
  type BillingRow,
} from "@/lib/subscription-summary";
import CompleteClient from "./CompleteClient";

export const metadata: Metadata = {
  title: "Setup complete · Sahla",
};

const BILLING_COLUMNS =
  "id, name, app_name, onboarding_status, subscription_tier, subscription_status, current_period_end, saas_stripe_customer_id, saas_stripe_subscription_id";

/** "Oct 6, 2026" — formatted on the server so hydration can't disagree. */
function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The terminal state of onboarding: what you set up, what plan you're on, and
 * what you actually paid. Reached from `/launching` right after checkout, and
 * permanently after that — it's the home screen for Core-plan mosques, who
 * have no CRM to be sent to.
 */
export default async function CompletePage() {
  const session = await auth();
  if (!session.orgId) redirect("/onboarding");

  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select(BILLING_COLUMNS)
    .eq("clerk_org_id", session.orgId)
    .maybeSingle();

  // This screen is a receipt. A mosque that hasn't finished and paid belongs
  // in the checklist, not looking at a confirmation for something it doesn't
  // have. `/dashboard` sends shipped mosques back here, so the two guards are
  // exact complements and can't ping-pong.
  const status = mosque?.onboarding_status;
  const shipped = status === "ready" || status === "live";
  if (!mosque || !shipped) redirect("/dashboard");

  const { data: flags } = await supabase
    .from("mosque_feature_flags")
    .select("has_crm_access")
    .eq("mosque_id", mosque.id)
    .maybeSingle();

  const [summary, pricing] = await Promise.all([
    getSubscriptionSummary(mosque as BillingRow),
    getPlanPricing().catch(() => null),
  ]);

  return (
    <CompleteClient
      mosqueId={mosque.id}
      mosqueName={mosque.name?.trim() || "Your masjid"}
      appName={mosque.app_name?.trim() || null}
      isLive={status === "live"}
      hasCrmAccess={!!flags?.has_crm_access}
      plan={{
        tier: summary.tier,
        label: summary.tierLabel,
        listPrice: summary.listPrice,
        interval: summary.interval,
        status: summary.status,
        renewsOn: formatDate(summary.renewsOn),
        cancelAtPeriodEnd: summary.cancelAtPeriodEnd,
        discounted: summary.discounted,
        card: summary.card,
        lastPayment: summary.lastPayment
          ? {
              amount: summary.lastPayment.amount,
              date: formatDate(summary.lastPayment.date) ?? "",
              receiptUrl: summary.lastPayment.receiptUrl,
              isProration: summary.lastPayment.isProration,
            }
          : null,
      }}
      crmUpgradePrice={pricing?.core_crm.formatted ?? null}
    />
  );
}
