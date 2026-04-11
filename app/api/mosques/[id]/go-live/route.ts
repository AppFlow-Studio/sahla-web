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

  // Verify mosque exists and get data
  const { data: mosque, error: mosqueError } = await supabase
    .from("mosques")
    .select("id, name, onboarding_progress")
    .eq("id", mosqueId)
    .single();

  if (mosqueError || !mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  const progress = (mosque.onboarding_progress as Record<string, boolean>) ?? {};

  // Verify required tasks are complete
  const requiredTasks = ["mosque_profile", "app_branding", "prayer_times", "jummah_setup", "stripe_connect", "preview_app", "go_live"];
  const incomplete = requiredTasks.filter((t) => !progress[t] && t !== "go_live");
  if (incomplete.length > 0) {
    return NextResponse.json(
      { error: `Required tasks not complete: ${incomplete.join(", ")}` },
      { status: 400 }
    );
  }

  // Create Stripe Checkout session for Sahla subscription
  try {
    const stripe = createStripeClient();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Sahla — Mosque App Platform",
              description: `Monthly subscription for ${mosque.name || "your mosque"}`,
            },
            unit_amount: 25000, // $250.00
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: {
        mosque_id: mosqueId,
        type: "sahla_subscription",
      },
      success_url: `${appUrl}/go_live?payment=success`,
      cancel_url: `${appUrl}/go_live?payment=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
