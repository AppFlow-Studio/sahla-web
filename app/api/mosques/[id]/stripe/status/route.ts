import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient, ACCOUNT_INCLUDES, mapAccountStatus } from "@/lib/stripe";
import { markOnboardingStep } from "@/lib/supabase/onboarding";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: mosque } = await supabase
    .from("mosques")
    .select("stripe_account_id, clerk_org_id")
    .eq("id", mosqueId)
    .single();

  if (session.orgId && session.orgId !== mosqueId && session.orgId !== mosque?.clerk_org_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!mosque?.stripe_account_id) {
    return NextResponse.json({ status: "not_connected" });
  }

  const stripe = createStripeClient();

  let account;
  try {
    account = await stripe.v2.core.accounts.retrieve(mosque.stripe_account_id, {
      include: [...ACCOUNT_INCLUDES],
    });
  } catch {
    return NextResponse.json({ status: "not_connected" });
  }

  const result = mapAccountStatus(account);

  // Persist Connect status to the mosque row so the admin Revenue view reflects
  // it without depending on account.updated webhook delivery. This read-through
  // runs whenever the mosque returns from Stripe; the webhook remains the
  // real-time path for updates that land while they're not looking.
  await supabase
    .from("mosques")
    .update({
      stripe_charges_enabled: result.charges_enabled,
      stripe_payouts_enabled: result.payouts_enabled,
    })
    .eq("id", mosqueId);

  if (result.status === "connected") {
    await markOnboardingStep(supabase, mosqueId, "stripe_connect");
  }

  return NextResponse.json(result);
}
