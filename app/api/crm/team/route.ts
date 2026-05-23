import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

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
  if (access.isHQ || !session.orgId) {
    return NextResponse.json({ members: [] satisfies CrmTeamMember[] });
  }

  try {
    const client = await clerkClient();

    const [memberships, invitations] = await Promise.all([
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

    return NextResponse.json({
      members: [...activeMembers, ...pendingMembers].sort((a, b) => {
        // Active first, then pending; within each group, oldest first.
        if (a.status !== b.status) return a.status === "active" ? -1 : 1;
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      }),
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
  if (access.isHQ || !session.orgId) {
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
  if (access.isHQ || !session.orgId) {
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
