import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId || !session.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: mosque, error } = await supabase
    .from("mosques")
    .select("saas_stripe_customer_id")
    .eq("id", mosqueId)
    .single();

  if (error || !mosque?.saas_stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 }
    );
  }

  try {
    const stripe = createStripeClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: mosque.saas_stripe_customer_id,
      return_url: `${appUrl}/settings/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
