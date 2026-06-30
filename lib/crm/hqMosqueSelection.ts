import "server-only";
import { cookies } from "next/headers";

/**
 * Cookie that lets a Sahla HQ user pick which mosque's CRM they're viewing.
 *
 * HQ members belong to the Sahla HQ Clerk org, not to each mosque org, so the
 * normal `session.orgId → mosque` resolution can't target an arbitrary mosque.
 * This cookie carries the selected `mosques.id`; `requireCrmAccess` and
 * `getCurrentMosque` honor it ONLY when the caller is Sahla HQ, so a non-HQ
 * user setting it has no effect.
 */
export const HQ_MOSQUE_COOKIE = "hq_active_mosque";

/** Read the HQ-selected mosque id from the request cookie (server-only). */
export async function getHqSelectedMosqueId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(HQ_MOSQUE_COOKIE)?.value?.trim();
  return value ? value : null;
}
