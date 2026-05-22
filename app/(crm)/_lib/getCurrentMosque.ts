import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

/**
 * Mosque profile shipped from the server layout down to the client tree.
 * Whitelist only what the CRM UI actually displays — never ship Stripe
 * IDs, webhook secrets, or other internals across the boundary.
 */
export type MosqueProfile = {
  id: string;
  name: string;
  city: string;
  state: string;
  tier: "core" | "core_crm" | "complete";
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  logoInitials: string;
  onboardingStatus: string;
  hasCrmAccess: boolean;
  /** True when the signed-in user is browsing as Sahla HQ (QA mode). */
  isHQ: boolean;
};

export type CurrentMosqueResult =
  | { kind: "ok"; mosque: MosqueProfile }
  | { kind: "no-auth" }
  | { kind: "no-mosque" }
  | { kind: "no-access"; mosque: MosqueProfile };

// HQ admins get a hard-coded placeholder so the CRM shell renders for
// QA without depending on which org they happen to be browsing.
const HQ_PLACEHOLDER: MosqueProfile = {
  id: "hq_preview",
  name: "Sahla HQ Preview",
  city: "Brooklyn",
  state: "NY",
  tier: "core_crm",
  primaryColor: "#0A261E",
  accentColor: "#B8922A",
  logoUrl: null,
  logoInitials: "SH",
  onboardingStatus: "live",
  hasCrmAccess: true,
  isHQ: true,
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Resolve the current request's mosque profile + CRM access status.
 *
 * Used by `app/(crm)/layout.tsx` to gate access and seed the client
 * tree's `MosqueProvider`. Wrapped in `cache()` so a single request
 * shares one Supabase round-trip across nested server components.
 */
export const getCurrentMosque = cache(async (): Promise<CurrentMosqueResult> => {
  const session = await auth();
  if (!session.userId) return { kind: "no-auth" };

  // Sahla HQ → render the placeholder profile for previewing the CRM.
  if (SAHLA_HQ_ORG_ID && session.orgId === SAHLA_HQ_ORG_ID) {
    return { kind: "ok", mosque: HQ_PLACEHOLDER };
  }

  if (!session.orgId) return { kind: "no-mosque" };

  const supabase = createAdminSupabaseClient();
  const { data: mosque, error: mosqueErr } = await supabase
    .from("mosques")
    .select(
      "id, name, city, state, brand_color, accent_color, logo_url, subscription_tier, onboarding_status"
    )
    .eq("clerk_org_id", session.orgId)
    .maybeSingle();

  if (mosqueErr) {
    console.error("getCurrentMosque: mosques lookup failed", mosqueErr.message);
    return { kind: "no-mosque" };
  }
  if (!mosque) return { kind: "no-mosque" };

  const { data: flags } = await supabase
    .from("mosque_feature_flags")
    .select("has_crm_access")
    .eq("mosque_id", mosque.id)
    .maybeSingle();

  const profile: MosqueProfile = {
    id: mosque.id,
    name: mosque.name ?? "Your mosque",
    city: mosque.city ?? "",
    state: mosque.state ?? "",
    tier: (mosque.subscription_tier as MosqueProfile["tier"]) ?? "core",
    primaryColor: mosque.brand_color ?? "#0A261E",
    accentColor: mosque.accent_color ?? "#B8922A",
    logoUrl: mosque.logo_url ?? null,
    logoInitials: initialsFrom(mosque.name ?? "Mosque"),
    onboardingStatus: mosque.onboarding_status ?? "in_progress",
    hasCrmAccess: !!flags?.has_crm_access,
    isHQ: false,
  };

  if (!profile.hasCrmAccess) {
    return { kind: "no-access", mosque: profile };
  }

  return { kind: "ok", mosque: profile };
});
