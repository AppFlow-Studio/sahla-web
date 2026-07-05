import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmInvoice = {
  id: string;
  number: string | null;
  amountPaid: number;
  status: string;
  date: string;
  hostedInvoiceUrl: string | null;
  pdfUrl: string | null;
};

export type CrmCard = {
  brand: string | null;
  last4: string | null;
};

export type CrmSubscriptionResponse = {
  tier: "core" | "core_crm" | "complete" | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  invoices: CrmInvoice[];
  primaryCard: CrmCard | null;
  backupCard: CrmCard | null;
  // True when the stored backup card is currently the subscription default
  // (i.e. it has already been promoted), so the UI can hide "Make primary".
  backupIsPrimary: boolean;
};

const EMPTY: CrmSubscriptionResponse = {
  tier: null,
  status: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  hasStripeCustomer: false,
  invoices: [],
  primaryCard: null,
  backupCard: null,
  backupIsPrimary: false,
};

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  // HQ preview — return a stub so the page renders without leaking
  // any other mosque's billing data.
  if (access.isHQ) {
    return NextResponse.json({
      ...EMPTY,
      tier: "core_crm",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      hasStripeCustomer: false,
    } satisfies CrmSubscriptionResponse);
  }

  const supabase = createAdminSupabaseClient();
  const { data: mosque, error } = await supabase
    .from("mosques")
    .select(
      "subscription_tier, subscription_status, saas_stripe_customer_id, saas_stripe_subscription_id, current_period_end, saas_backup_payment_method_id, saas_backup_card_brand, saas_backup_card_last4"
    )
    .eq("id", access.mosqueId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!mosque?.saas_stripe_customer_id) {
    return NextResponse.json({
      ...EMPTY,
      tier: (mosque?.subscription_tier as CrmSubscriptionResponse["tier"]) ?? null,
      status: mosque?.subscription_status ?? null,
      currentPeriodEnd: mosque?.current_period_end ?? null,
    } satisfies CrmSubscriptionResponse);
  }

  const stripe = createStripeClient();

  // Fetch live subscription + last 5 invoices in parallel.
  const [subRes, invoiceRes] = await Promise.all([
    mosque.saas_stripe_subscription_id
      ? stripe.subscriptions
          .retrieve(mosque.saas_stripe_subscription_id, {
            expand: ["default_payment_method"],
          })
          .catch(() => null)
      : Promise.resolve(null),
    stripe.invoices
      .list({ customer: mosque.saas_stripe_customer_id, limit: 5 })
      .catch(() => null),
  ]);

  // Derive currentPeriodEnd from sub if available (handles API version drift
  // where it moved from the subscription onto items).
  let currentPeriodEnd: string | null = mosque.current_period_end ?? null;
  let cancelAtPeriodEnd = false;
  if (subRes) {
    const item = subRes.items?.data?.[0] as
      | { current_period_end?: number }
      | undefined;
    const unix =
      item?.current_period_end ??
      (subRes as { current_period_end?: number }).current_period_end;
    if (unix) currentPeriodEnd = new Date(unix * 1000).toISOString();
    cancelAtPeriodEnd = !!subRes.cancel_at_period_end;
  }

  // Primary card = the subscription's current default payment method.
  const defaultPm = subRes?.default_payment_method;
  const defaultPmId =
    typeof defaultPm === "string" ? defaultPm : defaultPm?.id ?? null;
  const primaryCard: CrmCard | null =
    defaultPm && typeof defaultPm !== "string" && defaultPm.card
      ? { brand: defaultPm.card.brand ?? null, last4: defaultPm.card.last4 ?? null }
      : null;

  // Backup card is denormalized on the mosque row (captured by the webhook).
  const backupCard: CrmCard | null = mosque.saas_backup_payment_method_id
    ? {
        brand: mosque.saas_backup_card_brand ?? null,
        last4: mosque.saas_backup_card_last4 ?? null,
      }
    : null;
  const backupIsPrimary =
    !!mosque.saas_backup_payment_method_id &&
    mosque.saas_backup_payment_method_id === defaultPmId;

  const invoices: CrmInvoice[] = (invoiceRes?.data ?? []).map((inv) => ({
    id: inv.id ?? "",
    number: inv.number ?? null,
    amountPaid: Math.round((inv.amount_paid ?? 0)) / 100,
    status: inv.status ?? "unknown",
    date: new Date((inv.created ?? 0) * 1000).toISOString(),
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    pdfUrl: inv.invoice_pdf ?? null,
  }));

  return NextResponse.json({
    tier: (mosque.subscription_tier as CrmSubscriptionResponse["tier"]) ?? null,
    status: subRes?.status ?? mosque.subscription_status ?? null,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    hasStripeCustomer: true,
    invoices,
    primaryCard,
    backupCard,
    backupIsPrimary,
  } satisfies CrmSubscriptionResponse);
}
