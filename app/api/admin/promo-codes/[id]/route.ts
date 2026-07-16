import { NextResponse } from "next/server";
import { createStripeClient } from "@/lib/stripe";
import { requireHQ } from "@/lib/auth/requireHQ";

// Promotion codes can't be deleted in Stripe — only deactivated. PATCH flips
// `active` so HQ can retire a code without losing its redemption history.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireHQ();
  if (denied) return denied;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { active?: boolean };
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "active (boolean) is required" }, { status: 400 });
  }

  try {
    const stripe = createStripeClient();
    await stripe.promotionCodes.update(id, { active: body.active });
    return NextResponse.json({ ok: true, active: body.active });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update promo code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
