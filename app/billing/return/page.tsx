import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { reconcileSaasSubscription } from "@/lib/stripe";

/**
 * Where Stripe's billing portal drops admins when they're done. Renders
 * nothing — it reconciles and redirects.
 *
 * A plan switch made in the portal only reaches us as
 * `customer.subscription.updated`, and CRM access is derived live from
 * `subscription_tier`. Waiting on that webhook means an admin who just
 * upgraded gets bounced to the "upgrade required" page for the plan they
 * have already bought. So read Stripe directly first — the same
 * payment-beats-webhook rule the Go Live path uses.
 */
export default async function BillingReturnPage() {
  const session = await auth();
  if (!session.orgId) redirect("/onboarding");

  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id, saas_stripe_customer_id, onboarding_status, onboarding_progress")
    .eq("clerk_org_id", session.orgId)
    .maybeSingle();

  if (!mosque) redirect("/dashboard");

  await reconcileSaasSubscription(supabase, {
    id: mosque.id as string,
    saas_stripe_customer_id: mosque.saas_stripe_customer_id as string | null,
    onboarding_status: mosque.onboarding_status as string | null,
    onboarding_progress: mosque.onboarding_progress as Record<string, unknown> | null,
  }).catch(() => null);

  const { data: flags } = await supabase
    .from("mosque_feature_flags")
    .select("has_crm_access")
    .eq("mosque_id", mosque.id)
    .maybeSingle();

  // Upgraded (or already had it): their billing page inside the CRM.
  // Still on Core: back to /complete, which is their home and now shows
  // whatever they just changed.
  redirect(flags?.has_crm_access ? "/settings/subscription" : "/complete");
}
