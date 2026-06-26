import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type CrmTeamMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "pending";
  /** ISO 8601 */
  joinedAt: string;
};

type ClerkMembership = {
  id: string;
  role: string;
  createdAt: number;
  publicUserData?: {
    userId?: string;
    firstName?: string | null;
    lastName?: string | null;
    identifier?: string | null;
  };
};

type ClerkInvitation = {
  id: string;
  emailAddress: string;
  role?: string;
  status: string;
  createdAt: number;
};

type QueuedInvite = {
  name: string;
  email: string;
  role: string;
};

async function loadQueuedInvites(mosqueId: string): Promise<QueuedInvite[]> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .maybeSingle();
  const progress = (data?.onboarding_progress as Record<string, unknown> | null) ?? {};
  const raw = progress._queued_invites;
  if (!Array.isArray(raw)) return [];
  return raw as QueuedInvite[];
}

async function removeQueuedInvite(mosqueId: string, email: string): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .maybeSingle();
  const progress = ((data?.onboarding_progress ?? {}) as Record<string, unknown>);
  const queued = Array.isArray(progress._queued_invites)
    ? (progress._queued_invites as QueuedInvite[])
    : [];
  progress._queued_invites = queued.filter(
    (q) => q.email.toLowerCase() !== email.toLowerCase()
  );
  await supabase
    .from("mosques")
    .update({ onboarding_progress: progress })
    .eq("id", mosqueId);
}

function normalizeRole(role: string | undefined): "admin" | "member" {
  if (!role) return "member";
  // Clerk org roles look like "org:admin", "org:member", or custom "org:..."
  if (role.includes("admin")) return "admin";
  return "member";
}

function nameFrom(m: ClerkMembership): string {
  const fn = m.publicUserData?.firstName?.trim() ?? "";
  const ln = m.publicUserData?.lastName?.trim() ?? "";
  const combined = `${fn} ${ln}`.trim();
  if (combined) return combined;
  return m.publicUserData?.identifier ?? "Team member";
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  const session = await auth();
  // HQ previews don't have a real org to inspect.
  // HQ preview, or an HQ user viewing a mosque by cookie (whose active Clerk org
  // is still Sahla HQ, not the mosque) — no real mosque org to manage here.
  if (access.isHQ || access.isHQViewing || !session.orgId) {
    return NextResponse.json({ members: [] satisfies CrmTeamMember[] });
  }

  try {
    const client = await clerkClient();

    const [memberships, invitations, queued] = await Promise.all([
      client.organizations.getOrganizationMembershipList({
        organizationId: session.orgId,
        limit: 100,
      }),
      client.organizations
        .getOrganizationInvitationList({
          organizationId: session.orgId,
          status: ["pending"],
          limit: 100,
        })
        .catch(() => ({ data: [] as ClerkInvitation[] })),
      loadQueuedInvites(access.mosqueId),
    ]);

    const activeMembers: CrmTeamMember[] = (
      (memberships.data ?? []) as ClerkMembership[]
    )
      .filter((m) => !!m.publicUserData?.userId)
      .map((m) => ({
        // Use the Clerk userId as our row id so DELETE can pass it
        // straight through to deleteOrganizationMembership.
        id: m.publicUserData!.userId!,
        name: nameFrom(m),
        email: m.publicUserData?.identifier ?? "",
        role: normalizeRole(m.role),
        status: "active",
        joinedAt: new Date(m.createdAt).toISOString(),
      }));

    const pendingMembers: CrmTeamMember[] = (
      (invitations.data ?? []) as ClerkInvitation[]
    ).map((inv) => ({
      id: `inv_${inv.id}`,
      name: inv.emailAddress,
      email: inv.emailAddress,
      role: normalizeRole(inv.role),
      status: "pending",
      joinedAt: new Date(inv.createdAt).toISOString(),
    }));

    // Queued invites from the onboarding "Invite Admins" step. They live in
    // `mosques.onboarding_progress._queued_invites` until the Sahla team
    // promotes them to real Clerk org invitations on launch — they should
    // still be visible (and removable) to the mosque admin.
    const queuedEmails = new Set(
      pendingMembers.map((p) => p.email.toLowerCase())
    );
    const queuedActiveEmails = new Set(
      activeMembers.map((m) => m.email.toLowerCase())
    );
    const queuedMembers: CrmTeamMember[] = queued
      .filter((q) => {
        const e = q.email.toLowerCase();
        // De-dupe: if the same email is already a Clerk pending or active
        // member, hide the queued copy.
        return !queuedEmails.has(e) && !queuedActiveEmails.has(e);
      })
      .map((q) => ({
        id: `queued_${encodeURIComponent(q.email)}`,
        name: q.name || q.email,
        email: q.email,
        role: normalizeRole(q.role),
        status: "pending",
        // No real timestamp from onboarding — leave as epoch so the
        // de-dup sort puts queued entries last within "pending".
        joinedAt: new Date(0).toISOString(),
      }));

    return NextResponse.json({
      members: [...activeMembers, ...pendingMembers, ...queuedMembers].sort(
        (a, b) => {
          // Active first, then pending; within each group, oldest first.
          if (a.status !== b.status) return a.status === "active" ? -1 : 1;
          return (
            new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          );
        }
      ),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  const session = await auth();
  // HQ preview, or an HQ user viewing a mosque by cookie (whose active Clerk org
  // is still Sahla HQ, not the mosque) — no real mosque org to manage here.
  if (access.isHQ || access.isHQViewing || !session.orgId) {
    return NextResponse.json(
      { error: "HQ preview can't invite teammates — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; role?: "admin" | "member" }
    | null;
  if (!body?.email?.trim() || !body.email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const role = body.role === "admin" ? "org:admin" : "org:member";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const client = await clerkClient();
    await client.organizations.createOrganizationInvitation({
      organizationId: session.orgId,
      emailAddress: body.email.trim(),
      role,
      inviterUserId: session.userId,
      redirectUrl: `${appUrl}/launch`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send invitation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  const session = await auth();
  // HQ preview, or an HQ user viewing a mosque by cookie (whose active Clerk org
  // is still Sahla HQ, not the mosque) — no real mosque org to manage here.
  if (access.isHQ || access.isHQViewing || !session.orgId) {
    return NextResponse.json(
      { error: "HQ preview can't remove teammates." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }

  try {
    if (id.startsWith("queued_")) {
      // Onboarding-queued invite — strip it from _queued_invites instead
      // of touching Clerk (it never had a Clerk record).
      const email = decodeURIComponent(id.slice("queued_".length));
      await removeQueuedInvite(access.mosqueId, email);
      return NextResponse.json({ ok: true });
    }

    const client = await clerkClient();
    if (id.startsWith("inv_")) {
      // Revoke a pending invitation.
      const invId = id.slice("inv_".length);
      await client.organizations.revokeOrganizationInvitation({
        organizationId: session.orgId,
        invitationId: invId,
        requestingUserId: session.userId,
      });
    } else {
      // Remove an active membership.
      await client.organizations.deleteOrganizationMembership({
        organizationId: session.orgId,
        userId: id,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to remove teammate";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
