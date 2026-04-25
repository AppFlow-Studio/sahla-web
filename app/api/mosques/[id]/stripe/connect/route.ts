import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();
  const stripe = createStripeClient();

  // Check if mosque already has a Stripe account
  const { data: mosque } = await supabase
    .from("mosques")
    .select("stripe_account_id, name, clerk_org_id")
    .eq("id", mosqueId)
    .single();

  if (session.orgId && session.orgId !== mosqueId && session.orgId !== mosque?.clerk_org_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  let accountId = mosque.stripe_account_id;

  // Create new Stripe account if none exists
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "standard",
      metadata: { mosque_id: mosqueId },
    });
    accountId = account.id;

    await supabase
      .from("mosques")
      .update({ stripe_account_id: accountId })
      .eq("id", mosqueId);
  }

  // Check if already fully connected
  const existing = await stripe.accounts.retrieve(accountId);
  if (existing.charges_enabled) {
    return NextResponse.json({ already_connected: true });
  }

  // Create Account Link for onboarding/continuation
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/stripe_connect?stripe=refresh`,
    return_url: `${baseUrl}/stripe_connect?stripe=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
