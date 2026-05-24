import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "./admin";
import { resolveMosqueId } from "./resolveMosqueId";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

type CrmAccessResult =
  | { ok: true; mosqueId: string; isHQ: boolean; userId: string }
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
 * `mosqueId` for HQ callers will be null — handle the HQ branch in your
 * route if it needs cross-mosque reads. Most CRM routes shouldn't.
 */
export async function requireCrmAccess(): Promise<CrmAccessResult> {
  const session = await auth();
  if (!session.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Sahla HQ admins get a free pass — used for QA + cross-mosque tooling.
  if (SAHLA_HQ_ORG_ID && session.orgId === SAHLA_HQ_ORG_ID) {
    return { ok: true, mosqueId: "", isHQ: true, userId: session.userId };
  }

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
  const supabase = createAdminSupabaseClient();
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

  return { ok: true, mosqueId, isHQ: false, userId: session.userId };
}
