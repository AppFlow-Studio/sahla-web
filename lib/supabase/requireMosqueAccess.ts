import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveMosqueId } from "./resolveMosqueId";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

type MosqueAccessResult =
  | { ok: true; mosqueId: string; isHQ: boolean; userId: string; orgId: string | null }
  | { ok: false; response: NextResponse };

/**
 * Server-only guard for `/api/mosques/[id]/**` routes.
 *
 * These routes take the mosque id from the URL and act on it with the
 * service-role Supabase client, so a `userId` check alone is not enough — it
 * lets any signed-in user operate on any mosque by guessing its id. This binds
 * the URL's mosque to the caller's Clerk org.
 *
 * Sahla HQ is allowed through for any mosque (HQ admins manage every mosque),
 * mirroring `requireCrmAccess` and the `is_sahla_team()` branch in RLS.
 *
 *   export async function POST(_req, { params }) {
 *     const { id } = await params;
 *     const access = await requireMosqueAccess(id);
 *     if (!access.ok) return access.response;
 *   }
 */
export async function requireMosqueAccess(
  mosqueId: string
): Promise<MosqueAccessResult> {
  const session = await auth();

  if (!session.userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (SAHLA_HQ_ORG_ID && session.orgId === SAHLA_HQ_ORG_ID) {
    return {
      ok: true,
      mosqueId,
      isHQ: true,
      userId: session.userId,
      orgId: session.orgId,
    };
  }

  const ownMosqueId = await resolveMosqueId(session.orgId);
  if (!ownMosqueId || ownMosqueId !== mosqueId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    mosqueId: ownMosqueId,
    isHQ: false,
    userId: session.userId,
    orgId: session.orgId ?? null,
  };
}
