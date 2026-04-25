import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
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
    account = await stripe.accounts.retrieve(mosque.stripe_account_id);
  } catch {
    return NextResponse.json({ status: "not_connected" });
  }

  let status: string;
  if (account.charges_enabled) {
    status = "connected";
    await markOnboardingStep(supabase, mosqueId, "stripe_connect");
  } else if (account.requirements?.past_due?.length) {
    status = "issues";
  } else {
    status = "pending";
  }

  return NextResponse.json({
    status,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    requirements: {
      currently_due: account.requirements?.currently_due ?? [],
      past_due: account.requirements?.past_due ?? [],
    },
    business_profile: {
      name: account.business_profile?.name ?? null,
    },
  });
}
