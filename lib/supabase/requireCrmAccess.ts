import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "./admin";
import { resolveMosqueId } from "./resolveMosqueId";
import { getHqSelectedMosqueId } from "@/lib/crm/hqMosqueSelection";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

type CrmAccessResult =
  | { ok: true; mosqueId: string; isHQ: boolean; isHQViewing: boolean; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Server-only guard for `/api/crm/**` routes. Verifies the caller is
 * either Sahla HQ (full access for QA) or a mosque admin whose mosque
 * has `has_crm_access = true` via the `mosque_feature_flags` view.
 *
 * Usage:
 *
 *   export async function GET() {
 *     const access = await requireCrmAccess();
 *     if (!access.ok) return access.response;
 *     // use access.mosqueId
 *   }
 *
 * `isHQ` (with empty `mosqueId`) marks the HQ *preview* — no mosque chosen, so
 * routes serve empty/mock data. When an HQ user picks a mosque (the
 * `hq_active_mosque` cookie), they're returned as that mosque with
 * `isHQ:false`, `isHQViewing:true`, and the real `mosqueId` — so every
 * mosque-scoped route serves that mosque's real data. Only routes that act on
 * the *Clerk org* (e.g. team management) must also treat `isHQViewing` as
 * preview, since the cookie doesn't change the active Clerk org.
 */
export async function requireCrmAccess(): Promise<CrmAccessResult> {
  const session = await auth();
  if (!session.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Sahla HQ: either previewing (no mosque picked) or viewing a chosen mosque's
  // real CRM. HQ may view any mosque regardless of its CRM plan.
  if (SAHLA_HQ_ORG_ID && session.orgId === SAHLA_HQ_ORG_ID) {
    const selectedMosqueId = await getHqSelectedMosqueId();
    if (selectedMosqueId) {
      const supabase = createAdminSupabaseClient();
      const { data: mosque } = await supabase
        .from("mosques")
        .select("id")
        .eq("id", selectedMosqueId)
        .maybeSingle();
      if (mosque) {
        return {
          ok: true,
          mosqueId: mosque.id,
          isHQ: false,
          isHQViewing: true,
          userId: session.userId,
        };
      }
    }
    return {
      ok: true,
      mosqueId: "",
      isHQ: true,
      isHQViewing: false,
      userId: session.userId,
    };
  }

  const supabase = createAdminSupabaseClient();

  if (!session.orgId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No active organization" },
        { status: 403 }
      ),
    };
  }

  const mosqueId = await resolveMosqueId(session.orgId);
  if (!mosqueId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No mosque found for this organization" },
        { status: 403 }
      ),
    };
  }

  // Canonical CRM-access check via the feature-flags view.
  const { data: flags, error } = await supabase
    .from("mosque_feature_flags")
    .select("has_crm_access")
    .eq("mosque_id", mosqueId)
    .maybeSingle();

  if (error) {
    console.error("requireCrmAccess: flags lookup failed", error.message);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Failed to verify CRM access" },
        { status: 500 }
      ),
    };
  }

  if (!flags?.has_crm_access) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "CRM access requires the Core + CRM plan" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, mosqueId, isHQ: false, isHQViewing: false, userId: session.userId };
}
