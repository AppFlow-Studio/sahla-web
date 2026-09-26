import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The only Clerk org role Sahla grants a mosque teammate.
 *
 * Every mosque-facing gate is org-membership based, not role based: the app's
 * admin menu runs off `is_mosque_admin()` (true for any member of the mosque's
 * Clerk org) and every write policy scopes on `requesting_mosque_id()` /
 * `requesting_mosque_uuid()` — no RLS policy reads an `org_role` claim. So an
 * "editor" or "viewer" would hold exactly the same power as an admin. Until
 * something actually enforces a distinction, we only offer the role we mean.
 */
export const MOSQUE_ADMIN_ROLE = "org:admin";

export type QueuedInvite = {
  name: string;
  email: string;
  /** Always `org:admin` for new rows; older rows may carry editor/viewer. */
  role: string;
};

type ProgressRecord = Record<string, unknown>;

/** Queued invites live in `mosques.onboarding_progress._queued_invites`. */
export function readQueuedInvites(progress: unknown): QueuedInvite[] {
  const raw = (progress as ProgressRecord | null)?._queued_invites;
  if (!Array.isArray(raw)) return [];
  return (raw as QueuedInvite[]).filter(
    (i) => typeof i?.email === "string" && i.email.includes("@")
  );
}

/** A Clerk error that means the invite already exists — not a failure for us. */
function isAlreadyInvited(err: unknown): boolean {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  return (
    message.includes("already") ||
    message.includes("duplicate") ||
    message.includes("exists")
  );
}

/**
 * Promote the invites queued during onboarding's "Invite Admins" step into real
 * Clerk organization invitations.
 *
 * Accepting one makes the person a member of the mosque's Clerk org, which is
 * what grants both the in-app admin menu and the CRM (the latter only while the
 * mosque's tier includes it — `mosque_feature_flags.has_crm_access`).
 *
 * Safe to call repeatedly and from several paths at once: emails that already
 * have a pending invitation or an active membership are skipped, and only the
 * invites Clerk accepted are removed from the queue, so a failure retries on the
 * next call instead of vanishing.
 *
 * Returns null when there was nothing to do.
 */
export async function sendQueuedInvites(
  supabase: SupabaseClient,
  mosqueId: string
): Promise<{ sent: number; skipped: number; failed: number } | null> {
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id, clerk_org_id, onboarding_progress")
    .eq("id", mosqueId)
    .maybeSingle();

  const queued = readQueuedInvites(mosque?.onboarding_progress);
  if (!mosque || queued.length === 0) return null;

  const orgId = mosque.clerk_org_id as string | null;
  if (!orgId) {
    console.error(
      `sendQueuedInvites: mosque ${mosqueId} has ${queued.length} queued invite(s) but no clerk_org_id`
    );
    return null;
  }

  const client = await clerkClient();

  // Anyone Clerk already knows about — a pending invitation or a real member —
  // must not be invited again. This is what makes concurrent callers harmless.
  const known = new Set<string>();
  try {
    const [invitations, memberships] = await Promise.all([
      client.organizations.getOrganizationInvitationList({
        organizationId: orgId,
        status: ["pending"],
        limit: 100,
      }),
      client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 100,
      }),
    ]);
    for (const inv of invitations.data ?? []) {
      if (inv.emailAddress) known.add(inv.emailAddress.toLowerCase());
    }
    for (const m of memberships.data ?? []) {
      const identifier = m.publicUserData?.identifier;
      if (identifier) known.add(identifier.toLowerCase());
    }
  } catch (err) {
    // Without the dedupe lists we'd risk duplicate invitations, so stop and let
    // the next caller retry — the queue is still intact.
    console.error("sendQueuedInvites: Clerk lookup failed", err);
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const settled: string[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const invite of queued) {
    const email = invite.email.trim().toLowerCase();

    if (known.has(email)) {
      skipped += 1;
      settled.push(email);
      continue;
    }

    try {
      await client.organizations.createOrganizationInvitation({
        organizationId: orgId,
        emailAddress: email,
        // Legacy org:editor / org:viewer rows are promoted to admin: it is what
        // they were silently getting anyway (see MOSQUE_ADMIN_ROLE).
        role: MOSQUE_ADMIN_ROLE,
        redirectUrl: `${appUrl}/launch`,
      });
      sent += 1;
      settled.push(email);
    } catch (err) {
      if (isAlreadyInvited(err)) {
        skipped += 1;
        settled.push(email);
        continue;
      }
      failed += 1;
      console.error(
        `sendQueuedInvites: Clerk rejected ${email} for org ${orgId}`,
        err instanceof Error ? err.message : err
      );
    }
  }

  if (settled.length === 0) return { sent, skipped, failed };

  // Re-read before writing: reconcileSaasSubscription and the invites route
  // both rewrite this column, so the copy we loaded above may be stale.
  const { data: fresh } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .maybeSingle();

  const progress = ((fresh?.onboarding_progress ?? {}) as ProgressRecord);
  const settledSet = new Set(settled);
  const remaining = readQueuedInvites(progress).filter(
    (i) => !settledSet.has(i.email.trim().toLowerCase())
  );

  progress._queued_invites = remaining;
  progress._invites_sent_at = new Date().toISOString();

  const { error } = await supabase
    .from("mosques")
    .update({ onboarding_progress: progress })
    .eq("id", mosqueId);

  if (error) {
    // The invitations went out; only the bookkeeping failed. The dedupe above
    // keeps the next run from sending them twice.
    console.error("sendQueuedInvites: failed to clear queue", error.message);
  }

  return { sent, skipped, failed };
}
