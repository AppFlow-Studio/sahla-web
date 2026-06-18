import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type AdPayment = {
  /** stripe_invoice_id — stable, unique per paid invoice. */
  id: string;
  amountCents: number;
  currency: string;
  /** "first" = onboarding + first month, "recurring" = a renewal. */
  kind: string;
  status: string;
  /** ISO timestamp the invoice was paid. */
  paidAt: string;
};

export type CrmBusinessAd = {
  id: string;
  businessName: string;
  businessAddress: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactName: string | null;
  placement: string | null;
  durationMonths: number | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
  /** Paid invoices for this ad, newest first. */
  payments: AdPayment[];
  /** Sum of every paid invoice, in cents. */
  totalPaidCents: number;
  paymentCount: number;
  /** ISO timestamp of the most recent payment, or null if never paid. */
  lastPaymentAt: string | null;
  /** Currency of the payments (lowercase ISO, e.g. "usd"), or null. */
  currency: string | null;
  /**
   * Billing state from `ad_subscriptions.status`
   * ("active" | "past_due" | "canceled" | "pending" | ...), or null when
   * the ad has no Stripe subscription (e.g. manually added by an admin).
   */
  subscriptionStatus: string | null;
  /**
   * When the subscription started (ISO) — falls back to the first paid
   * invoice when `start_date` isn't set. Drives "subscribed for …".
   */
  subscribedSince: string | null;
  /** When the subscription ended/will end (ISO), if canceled. */
  subscriptionEndsAt: string | null;
  /**
   * True when the latest invoice failed (`status = past_due`). We only
   * persist the current state, not a full failed-invoice history.
   */
  hasMissedPayment: boolean;
};

type AdRow = {
  submission_id: string;
  business_name: string | null;
  business_address: string | null;
  personal_full_name: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  business_flyer_img: string | null;
  placement: string | null;
  duration_months: number | null;
  status: string | null;
  created_at: string;
};

type PaymentRow = {
  submission_id: string | null;
  stripe_invoice_id: string;
  amount_cents: number | null;
  currency: string | null;
  kind: string | null;
  status: string | null;
  paid_at: string | null;
};

function rowToPayment(row: PaymentRow): AdPayment {
  return {
    id: row.stripe_invoice_id,
    amountCents: row.amount_cents ?? 0,
    currency: row.currency ?? "usd",
    kind: row.kind ?? "recurring",
    status: row.status ?? "paid",
    paidAt: row.paid_at ?? "",
  };
}

/** Group payment rows (already sorted newest-first) by submission id. */
function groupPaymentsBySubmission(rows: PaymentRow[]): Map<string, AdPayment[]> {
  const map = new Map<string, AdPayment[]>();
  for (const row of rows) {
    if (!row.submission_id) continue;
    const list = map.get(row.submission_id);
    if (list) list.push(rowToPayment(row));
    else map.set(row.submission_id, [rowToPayment(row)]);
  }
  return map;
}

type SubscriptionRow = {
  submission_id: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
};

function rowToAd(
  row: AdRow,
  payments: AdPayment[] = [],
  subscription: SubscriptionRow | null = null
): CrmBusinessAd {
  const paid = payments.filter((p) => p.status === "paid");
  const totalPaidCents = paid.reduce((sum, p) => sum + p.amountCents, 0);
  const subscriptionStatus = subscription?.status ?? null;
  return {
    id: row.submission_id,
    businessName: row.business_name ?? "Untitled ad",
    businessAddress: row.business_address ?? null,
    contactEmail: row.personal_email ?? null,
    contactPhone: row.personal_phone ?? null,
    contactName: row.personal_full_name ?? null,
    placement: row.placement ?? null,
    durationMonths: row.duration_months ?? null,
    imageUrl: row.business_flyer_img ?? null,
    status: row.status ?? "approved",
    createdAt: row.created_at,
    payments,
    totalPaidCents,
    paymentCount: paid.length,
    lastPaymentAt: paid[0]?.paidAt ?? null,
    currency: payments[0]?.currency ?? null,
    subscriptionStatus,
    subscribedSince:
      subscription?.start_date ?? paid[paid.length - 1]?.paidAt ?? null,
    subscriptionEndsAt: subscription?.end_date ?? null,
    hasMissedPayment: subscriptionStatus === "past_due",
  };
}

const SELECT_COLS =
  "submission_id, business_name, business_address, personal_full_name, personal_email, personal_phone, business_flyer_img, placement, duration_months, status, created_at";

const PAYMENT_COLS =
  "submission_id, stripe_invoice_id, amount_cents, currency, kind, status, paid_at";

const SUBSCRIPTION_COLS = "submission_id, status, start_date, end_date";

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ ads: [] satisfies CrmBusinessAd[] });

  const supabase = createAdminSupabaseClient();
  const [submissions, payments, subscriptions] = await Promise.all([
    supabase
      .from("business_ads_submissions")
      .select(SELECT_COLS)
      .eq("mosque_id", access.mosqueId)
      // Hide abandoned checkouts that never completed payment.
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false }),
    supabase
      .from("ad_payments")
      .select(PAYMENT_COLS)
      .eq("mosque_id", access.mosqueId)
      .order("paid_at", { ascending: false }),
    supabase
      .from("ad_subscriptions")
      .select(SUBSCRIPTION_COLS)
      .eq("mosque_id", access.mosqueId),
  ]);

  if (submissions.error) {
    return NextResponse.json({ error: submissions.error.message }, { status: 500 });
  }
  if (payments.error) {
    return NextResponse.json({ error: payments.error.message }, { status: 500 });
  }
  if (subscriptions.error) {
    return NextResponse.json({ error: subscriptions.error.message }, { status: 500 });
  }

  const paymentsBySubmission = groupPaymentsBySubmission(
    (payments.data as PaymentRow[] | null) ?? []
  );
  const subscriptionBySubmission = new Map<string, SubscriptionRow>();
  for (const sub of (subscriptions.data as SubscriptionRow[] | null) ?? []) {
    if (sub.submission_id) subscriptionBySubmission.set(sub.submission_id, sub);
  }

  const ads = ((submissions.data as AdRow[] | null) ?? []).map((row) =>
    rowToAd(
      row,
      paymentsBySubmission.get(row.submission_id) ?? [],
      subscriptionBySubmission.get(row.submission_id) ?? null
    )
  );
  return NextResponse.json({ ads });
}

type CreateBody = {
  businessName?: string;
  businessAddress?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  placement?: string;
  durationMonths?: number;
  imageUrl?: string;
};

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  if (!body?.businessName?.trim()) {
    return NextResponse.json(
      { error: "Business name is required" },
      { status: 400 }
    );
  }
  if (!body.imageUrl?.trim()) {
    return NextResponse.json(
      { error: "Ad image is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("business_ads_submissions")
    .insert({
      mosque_id: access.mosqueId,
      user_id: access.userId,
      business_name: body.businessName.trim(),
      business_address: body.businessAddress?.trim() || null,
      personal_full_name: body.contactName?.trim() || null,
      personal_email: body.contactEmail?.trim() || null,
      personal_phone: body.contactPhone?.trim() || null,
      placement: body.placement?.trim() || null,
      duration_months:
        typeof body.durationMonths === "number" ? body.durationMonths : null,
      business_flyer_img: body.imageUrl.trim(),
      status: "approved",
    })
    .select(SELECT_COLS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mirror into approved_business_ads so the mobile-app reads pick it up.
  void supabase.from("approved_business_ads").insert({
    submission_id: (data as AdRow).submission_id,
    mosque_id: access.mosqueId,
  });

  return NextResponse.json({ ad: rowToAd(data as AdRow) });
}

type PatchBody = CreateBody & {
  id?: string;
  approve?: boolean;
  action?: "decline" | "cancel";
};

export async function PATCH(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  // Decline (reject submitted) / cancel (take down approved) → proxy to the
  // admin-ad-decision edge function, which also stops Stripe billing.
  if (body.action === "decline" || body.action === "cancel") {
    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-ad-decision`;
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      },
      body: JSON.stringify({
        mosque_id: access.mosqueId,
        submission_id: body.id,
        action: body.action,
      }),
    });
    const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !out.ok) {
      return NextResponse.json({ error: out.error ?? "Action failed" }, { status: 500 });
    }
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("business_ads_submissions")
      .select(SELECT_COLS)
      .eq("submission_id", body.id)
      .single();
    return NextResponse.json({ ad: data ? rowToAd(data as AdRow) : null });
  }

  // Approve a (paid) submission → mark approved + mirror into
  // approved_business_ads so the mobile app starts showing it.
  if (body.approve === true) {
    const supabase = createAdminSupabaseClient();
    updates.status = "approved";
    const { data, error } = await supabase
      .from("business_ads_submissions")
      .update(updates)
      .eq("submission_id", body.id)
      .eq("mosque_id", access.mosqueId)
      .select(SELECT_COLS)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: existing } = await supabase
      .from("approved_business_ads")
      .select("id")
      .eq("submission_id", body.id)
      .maybeSingle();
    if (!existing) {
      await supabase
        .from("approved_business_ads")
        .insert({ submission_id: body.id, mosque_id: access.mosqueId });
    }
    return NextResponse.json({ ad: rowToAd(data as AdRow) });
  }
  if (typeof body.businessName === "string")
    updates.business_name = body.businessName.trim();
  if (typeof body.businessAddress === "string")
    updates.business_address = body.businessAddress.trim() || null;
  if (typeof body.contactName === "string")
    updates.personal_full_name = body.contactName.trim() || null;
  if (typeof body.contactEmail === "string")
    updates.personal_email = body.contactEmail.trim() || null;
  if (typeof body.contactPhone === "string")
    updates.personal_phone = body.contactPhone.trim() || null;
  if (typeof body.placement === "string")
    updates.placement = body.placement.trim() || null;
  if (typeof body.durationMonths === "number")
    updates.duration_months = body.durationMonths;
  if (typeof body.imageUrl === "string" && body.imageUrl.trim())
    updates.business_flyer_img = body.imageUrl.trim();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("business_ads_submissions")
    .update(updates)
    .eq("submission_id", body.id)
    .eq("mosque_id", access.mosqueId)
    .select(SELECT_COLS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ad: rowToAd(data as AdRow) });
}

export async function DELETE(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id query param required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  await supabase
    .from("approved_business_ads")
    .delete()
    .eq("submission_id", id)
    .eq("mosque_id", access.mosqueId);

  const { error } = await supabase
    .from("business_ads_submissions")
    .delete()
    .eq("submission_id", id)
    .eq("mosque_id", access.mosqueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
