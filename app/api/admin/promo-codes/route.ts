import { NextResponse } from "next/server";
import { createStripeClient } from "@/lib/stripe";
import { requireHQ } from "@/lib/auth/requireHQ";
import type Stripe from "stripe";

export type PromoCodeSummary = {
  id: string;
  code: string;
  active: boolean;
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: string | null; // ISO
  coupon: {
    percentOff: number | null;
    amountOff: number | null; // cents
    currency: string | null;
    duration: string; // once | forever | repeating
    durationInMonths: number | null;
  };
};

/** In this API version the coupon lives at promotionCode.promotion.coupon (expanded). */
function couponFrom(pc: Stripe.PromotionCode): Stripe.Coupon | null {
  const promo = pc.promotion;
  if (promo && promo.type === "coupon" && promo.coupon && typeof promo.coupon !== "string") {
    return promo.coupon;
  }
  return null;
}

function summarize(pc: Stripe.PromotionCode): PromoCodeSummary {
  const c = couponFrom(pc);
  return {
    id: pc.id,
    code: pc.code,
    active: pc.active,
    timesRedeemed: pc.times_redeemed ?? 0,
    maxRedemptions: pc.max_redemptions ?? null,
    expiresAt: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
    coupon: {
      percentOff: c?.percent_off ?? null,
      amountOff: c?.amount_off ?? null,
      currency: c?.currency ?? null,
      duration: c?.duration ?? "once",
      durationInMonths: c?.duration_in_months ?? null,
    },
  };
}

export async function GET() {
  const denied = await requireHQ();
  if (denied) return denied;

  try {
    const stripe = createStripeClient();
    const list = await stripe.promotionCodes.list({ limit: 100, expand: ["data.promotion.coupon"] });
    return NextResponse.json({ codes: list.data.map(summarize) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list promo codes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireHQ();
  if (denied) return denied;

  const body = (await request.json().catch(() => ({}))) as {
    code?: string;
    type?: "percent" | "amount";
    value?: number;
    duration?: "once" | "forever" | "repeating";
    durationInMonths?: number;
    maxRedemptions?: number;
    expiresAt?: string; // ISO date
  };

  const { type, value, duration } = body;

  // ── Validate ──
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

  const maxRedemptions =
    body.maxRedemptions != null ? Math.round(body.maxRedemptions) : undefined;
  if (maxRedemptions != null && maxRedemptions < 1) {
    return NextResponse.json({ error: "maxRedemptions must be >= 1" }, { status: 400 });
  }

  let expiresAtUnix: number | undefined;
  if (body.expiresAt) {
    const t = new Date(body.expiresAt).getTime();
    if (Number.isNaN(t)) {
      return NextResponse.json({ error: "expiresAt is not a valid date" }, { status: 400 });
    }
    if (t <= Date.now()) {
      return NextResponse.json({ error: "expiresAt must be in the future" }, { status: 400 });
    }
    expiresAtUnix = Math.floor(t / 1000);
  }

  const code = body.code?.trim().toUpperCase() || undefined;

  try {
    const stripe = createStripeClient();
    const currency = "usd";

    const coupon = await stripe.coupons.create({
      duration,
      ...(durationInMonths ? { duration_in_months: durationInMonths } : {}),
      ...(type === "percent"
        ? { percent_off: value }
        : { amount_off: Math.round(value * 100), currency }),
      name:
        type === "percent"
          ? `${value}% off (${duration}${durationInMonths ? ` ${durationInMonths}mo` : ""})`
          : `$${value} off (${duration}${durationInMonths ? ` ${durationInMonths}mo` : ""})`,
      metadata: { created_by: "hq_admin" },
    });

    const promo = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      ...(code ? { code } : {}),
      ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
      ...(expiresAtUnix ? { expires_at: expiresAtUnix } : {}),
      metadata: { created_by: "hq_admin" },
    });

    // Re-fetch with the coupon expanded so the response matches the list shape.
    const full = await stripe.promotionCodes.retrieve(promo.id, { expand: ["promotion.coupon"] });
    return NextResponse.json({ code: summarize(full) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create promo code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
