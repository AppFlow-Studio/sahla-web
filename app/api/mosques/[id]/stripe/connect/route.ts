import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient, ACCOUNT_INCLUDES } from "@/lib/stripe";
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
    .select("stripe_account_id, name, slug, clerk_org_id")
    .eq("id", mosqueId)
    .single();

  if (session.orgId && session.orgId !== mosqueId && session.orgId !== mosque?.clerk_org_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  try {
    let accountId = mosque.stripe_account_id;

    // Create new Stripe account (Accounts v2) if none exists.
    if (!accountId) {
      const account = await stripe.v2.core.accounts.create({
        display_name: mosque.name || undefined,
        // Full Stripe dashboard access — the mosque owns and controls the account.
        dashboard: "full",
        identity: { country: "US" },
        configuration: {
          merchant: {
            mcc: "8661",
            // Request card processing so charges can be enabled.
            capabilities: { card_payments: { requested: true } },
          },
        },
        defaults: {
          profile: {
            business_url: mosque.slug
              ? `https://sahla.co/${mosque.slug}`
              : "https://sahla.co",
          },
          // Standard-equivalent: Stripe collects fees directly from the
          // connected account and the account bears its own losses.
          responsibilities: {
            fees_collector: "stripe",
            losses_collector: "stripe",
          },
        },
        metadata: { mosque_id: mosqueId },
      });
      accountId = account.id;

      await supabase
        .from("mosques")
        .update({ stripe_account_id: accountId })
        .eq("id", mosqueId);
    }

    // Check if already fully connected (card payments active).
    const existing = await stripe.v2.core.accounts.retrieve(accountId, {
      include: [...ACCOUNT_INCLUDES],
    });
    if (
      existing.configuration?.merchant?.capabilities?.card_payments?.status ===
      "active"
    ) {
      return NextResponse.json({ already_connected: true });
    }

    // Create an Account Link for hosted onboarding / continuation.
    // NOTE: v2 Account Links require HTTPS return/refresh URLs — even for
    // localhost. Set NEXT_PUBLIC_APP_URL to an https origin.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant"],
          refresh_url: `${baseUrl}/stripe_connect?stripe=refresh`,
          return_url: `${baseUrl}/stripe_connect?stripe=success`,
        },
      },
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/connect] failed to initiate connection:", message);
    return NextResponse.json(
      { error: "Failed to initiate Stripe connection", detail: message },
      { status: 500 }
    );
  }
}
