/**
 * Backfill ad_payments from Stripe for ads that were already live before the
 * stripe-webhooks `recordAdPayment` change shipped (2026-06-18). Ad invoices
 * live on each mosque's CONNECTED account, so we list them with the
 * { stripeAccount } option, keyed by the subscription id we already store.
 *
 * Writes rows identical to the webhook's recordAdPayment(), idempotent on
 * stripe_invoice_id — so it's safe to re-run, and any invoice the webhook has
 * since recorded is skipped (ignoreDuplicates).
 *
 * Dry-run by default (prints what it would insert). Pass --apply to write.
 *
 *   cd sahla-web
 *   node --env-file=.env scripts/backfill-ad-payments.mjs          # preview
 *   node --env-file=.env scripts/backfill-ad-payments.mjs --apply  # write
 */
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing env. Need STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY.",
  );
  process.exit(1);
}

// Match the webhook's API version so invoice fields read the same way.
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// Stripe Dahlia keeps invoice.payment_intent as an id (or expanded object);
// mirror handleAdInvoicePaid's access so backfilled rows match live ones.
function invoicePaymentIntentId(invoice) {
  const pi = invoice.payment_intent;
  if (!pi) return null;
  return typeof pi === "string" ? pi : (pi.id ?? null);
}

function paidAtIso(invoice) {
  const unix = invoice.status_transitions?.paid_at ?? invoice.created;
  return new Date(unix * 1000).toISOString();
}

async function main() {
  console.log(`\nBackfill ad_payments — ${APPLY ? "APPLY (writing)" : "DRY RUN (no writes)"}\n`);

  // Every ad subscription + its mosque's connected account.
  const { data: subs, error } = await supabase
    .from("ad_subscriptions")
    .select("stripe_subscription_id, mosque_id, submission_id, mosques(stripe_account_id)")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`load ad_subscriptions: ${error.message}`);

  let totalFound = 0;
  let totalToWrite = 0;
  let totalWritten = 0;
  let skippedSubs = 0;

  for (const s of subs ?? []) {
    const subId = s.stripe_subscription_id;
    const acct = s.mosques?.stripe_account_id;
    if (!subId || !acct) {
      skippedSubs++;
      console.warn(`  ! skip sub ${subId ?? "(none)"} — missing ${!subId ? "subscription id" : "connected account"}`);
      continue;
    }

    // Paid invoices for this subscription, on the connected account.
    const invoices = [];
    for await (const inv of stripe.invoices.list(
      { subscription: subId, status: "paid", limit: 100 },
      { stripeAccount: acct },
    )) {
      invoices.push(inv);
    }

    if (invoices.length === 0) {
      console.log(`  · ${subId}: no paid invoices`);
      continue;
    }

    const rows = invoices.map((inv) => ({
      mosque_id: s.mosque_id,
      submission_id: s.submission_id,
      stripe_subscription_id: subId,
      stripe_invoice_id: inv.id,
      stripe_payment_intent_id: invoicePaymentIntentId(inv),
      amount_cents: inv.amount_paid,
      currency: inv.currency,
      kind: inv.billing_reason === "subscription_create" ? "first" : "recurring",
      status: "paid",
      paid_at: paidAtIso(inv),
    }));

    totalFound += rows.length;
    console.log(
      `  · ${subId}: ${rows.length} paid invoice(s) — ` +
        rows
          .map((r) => `${r.kind} $${(r.amount_cents / 100).toFixed(2)} @ ${r.paid_at.slice(0, 10)}`)
          .join(", "),
    );

    if (!APPLY) {
      totalToWrite += rows.length;
      continue;
    }

    // ignoreDuplicates: invoices the webhook already recorded are left as-is.
    const { data: written, error: upErr } = await supabase
      .from("ad_payments")
      .upsert(rows, { onConflict: "stripe_invoice_id", ignoreDuplicates: true })
      .select("stripe_invoice_id");
    if (upErr) throw new Error(`upsert for ${subId}: ${upErr.message}`);
    totalWritten += written?.length ?? 0;
  }

  console.log(
    `\nDone. subscriptions=${(subs ?? []).length} skipped=${skippedSubs} ` +
      `paid_invoices_found=${totalFound} ` +
      (APPLY
        ? `inserted=${totalWritten} (already_present=${totalFound - totalWritten})`
        : `would_insert<=${totalToWrite} (run with --apply to write)`) +
      "\n",
  );
}

main().catch((err) => {
  console.error("\nBackfill failed:", err.message ?? err);
  process.exit(1);
});
