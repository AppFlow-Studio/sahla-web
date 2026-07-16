import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { requireHQ } from "@/lib/auth/requireHQ";
import type Stripe from "stripe";

// Shape the UI consumes for the current discount (null when none applied).
type DiscountSummary = {
  couponId: string;
  name: string | null;
  percentOff: number | null;
  amountOff: number | null; // cents
  currency: string | null;
  duration: string; // "once" | "forever" | "repeating"
  durationInMonths: number | null;
};

type DiscountResponse = {
  hasSubscription: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  /** Full (pre-discount) recurring amount in cents. */
  baseCents: number | null;
  currency: string;
  /** Amount actually billed after the discount, in cents. */
  netCents: number | null;
  discount: DiscountSummary | null;
};

/** The subscription's active discounts array (newer API) with a legacy fallback. */
function readDiscounts(sub: Stripe.Subscription): Stripe.Discount[] {
  const arr = (sub as unknown as { discounts?: unknown }).discounts;
  if (Array.isArray(arr)) {
    return arr.filter((d): d is Stripe.Discount => typeof d === "object" && d !== null);
  }
  const single = (sub as unknown as { discount?: Stripe.Discount | null }).discount;
  return single ? [single] : [];
}

/** In this API version the coupon lives at discount.source.coupon (expanded). */
function couponOf(discount: Stripe.Discount | undefined): Stripe.Coupon | null {
  const src = discount?.source;
  if (src && src.type === "coupon" && src.coupon && typeof src.coupon !== "string") {
    return src.coupon;
  }
  return null;
}

function summarize(discount: Stripe.Discount | undefined): DiscountSummary | null {
  const c = couponOf(discount);
  if (!c) return null;
  return {
    couponId: c.id,
    name: c.name ?? null,
    percentOff: c.percent_off ?? null,
    amountOff: c.amount_off ?? null,
    currency: c.currency ?? null,
    duration: c.duration,
    durationInMonths: c.duration_in_months ?? null,
  };
}

function netFromBase(baseCents: number | null, s: DiscountSummary | null): number | null {
  if (baseCents == null) return null;
  if (!s) return baseCents;
  if (s.percentOff != null) return Math.round(baseCents * (1 - s.percentOff / 100));
  if (s.amountOff != null) return Math.max(0, baseCents - s.amountOff);
  return baseCents;
}

/** Load the mosque's live subscription + resolve its current discount. */
async function loadSubscription(mosqueId: string): Promise<
  | { ok: true; response: DiscountResponse; subId: string }
  | { ok: false; response: DiscountResponse }
> {
  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select("saas_stripe_subscription_id, subscription_status, current_period_end")
    .eq("id", mosqueId)
    .maybeSingle();

  const empty: DiscountResponse = {
    hasSubscription: false,
    status: mosque?.subscription_status ?? null,
    currentPeriodEnd: mosque?.current_period_end ?? null,
    baseCents: null,
    currency: "usd",
    netCents: null,
    discount: null,
  };

  const subId = mosque?.saas_stripe_subscription_id;
  // Dev-bypass subs (dev_bypass_*) aren't real Stripe objects — treat as none.
  if (!subId || subId.startsWith("dev_bypass_")) {
    return { ok: false, response: empty };
  }

  const stripe = createStripeClient();
  const sub = await stripe.subscriptions
    .retrieve(subId, { expand: ["discounts.source.coupon"] })
    .catch(() => null);

  if (!sub) return { ok: false, response: empty };

  const item = sub.items?.data?.[0];
  const baseCents = item?.price?.unit_amount ?? null;
  const currency = item?.price?.currency ?? "usd";
  const discount = summarize(readDiscounts(sub)[0]);

  return {
    ok: true,
    subId,
    response: {
      hasSubscription: true,
      status: sub.status ?? mosque?.subscription_status ?? null,
      currentPeriodEnd: mosque?.current_period_end ?? null,
      baseCents,
      currency,
      netCents: netFromBase(baseCents, discount),
      discount,
    },
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireHQ();
  if (denied) return denied;

  const { id: mosqueId } = await params;
  try {
    const result = await loadSubscription(mosqueId);
    return NextResponse.json(result.response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireHQ();
  if (denied) return denied;

  const { id: mosqueId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    type?: "percent" | "amount";
    value?: number;
    duration?: "once" | "forever" | "repeating";
    durationInMonths?: number;
  };

  const { type, value, duration } = body;

  // ── Validate the deal terms before touching Stripe ──
  if (type !== "percent" && type !== "amount") {
    return NextResponse.json({ error: "type must be 'percent' or 'amount'" }, { status: 400 });
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "value must be a positive number" }, { status: 400 });
  }
  if (type === "percent" && value > 100) {
    return NextResponse.json({ error: "percent discount cannot exceed 100" }, { status: 400 });
  }
  if (duration !== "once" && duration !== "forever" && duration !== "repeating") {
    return NextResponse.json({ error: "duration must be once, forever, or repeating" }, { status: 400 });
  }
  const durationInMonths =
    duration === "repeating" ? Math.round(body.durationInMonths ?? 0) : undefined;
  if (duration === "repeating" && (!durationInMonths || durationInMonths < 1)) {
    return NextResponse.json(
      { error: "durationInMonths (>= 1) is required for a repeating discount" },
      { status: 400 }
    );
  }

  try {
    const loaded = await loadSubscription(mosqueId);
    if (!loaded.ok) {
      return NextResponse.json(
        { error: "Mosque has no active Stripe subscription to discount" },
        { status: 400 }
      );
    }

    const stripe = createStripeClient();
    const currency = loaded.response.currency || "usd";

    // Build a human-readable coupon name so it's legible in the Stripe dashboard.
    const label =
      type === "percent"
        ? `${value}% off`
        : `${(value).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() })} off`;
    const durLabel =
      duration === "forever" ? "forever" : duration === "once" ? "first invoice" : `${durationInMonths} mo`;

    const coupon = await stripe.coupons.create({
      duration,
      ...(durationInMonths ? { duration_in_months: durationInMonths } : {}),
      ...(type === "percent"
        ? { percent_off: value }
        : { amount_off: Math.round(value * 100), currency }),
      name: `Sahla deal — ${label} (${durLabel})`,
      metadata: { mosque_id: mosqueId, applied_by: "hq_admin" },
    });

    // Replace any existing discount with this one.
    await stripe.subscriptions.update(loaded.subId, {
      discounts: [{ coupon: coupon.id }],
    });

    const refreshed = await loadSubscription(mosqueId);
    return NextResponse.json(refreshed.response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to apply discount";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireHQ();
  if (denied) return denied;

  const { id: mosqueId } = await params;
  try {
    const loaded = await loadSubscription(mosqueId);
    if (!loaded.ok) {
      return NextResponse.json({ error: "Mosque has no active Stripe subscription" }, { status: 400 });
    }

    const stripe = createStripeClient();
    await stripe.subscriptions.update(loaded.subId, { discounts: [] });

    const refreshed = await loadSubscription(mosqueId);
    return NextResponse.json(refreshed.response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove discount";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export type { DiscountResponse, DiscountSummary };
