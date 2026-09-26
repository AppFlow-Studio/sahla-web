import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireMosqueAccess } from "@/lib/supabase/requireMosqueAccess";
import { MOSQUE_ADMIN_ROLE, readQueuedInvites, type QueuedInvite } from "@/lib/invites";
import { NextResponse } from "next/server";

/**
 * The onboarding "Invite Admins" queue.
 *
 * Nothing is emailed here — invites sit in
 * `mosques.onboarding_progress._queued_invites` until the mosque pays, at which
 * point `sendQueuedInvites` promotes them to real Clerk org invitations.
 */

/** Read the queue plus the progress object it lives in, in one round trip. */
async function loadProgress(
  mosqueId: string
): Promise<{ progress: Record<string, unknown>; invites: QueuedInvite[] }> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .maybeSingle();

  const progress = ((data?.onboarding_progress ?? {}) as Record<string, unknown>);
  return { progress, invites: readQueuedInvites(progress) };
}

/**
 * Write the queue back. The task is complete exactly when the queue is
 * non-empty — removing the last invite has to un-complete it, or the checklist
 * claims a step the mosque never finished.
 */
async function saveInvites(
  mosqueId: string,
  progress: Record<string, unknown>,
  invites: QueuedInvite[]
) {
  const supabase = createAdminSupabaseClient();
  progress._queued_invites = invites;
  progress.invite_admins = invites.length > 0;

  const { error } = await supabase
    .from("mosques")
    .update({ onboarding_progress: progress })
    .eq("id", mosqueId);

  if (error) throw error;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mosqueId } = await params;
  const access = await requireMosqueAccess(mosqueId);
  if (!access.ok) return access.response;

  const { invites } = await loadProgress(mosqueId);
  return NextResponse.json(invites);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mosqueId } = await params;
  const access = await requireMosqueAccess(mosqueId);
  if (!access.ok) return access.response;

  const body = await request.json().catch(() => ({}));
  const { name, email } = body as { name?: string; email?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email?.trim() || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { progress, invites } = await loadProgress(mosqueId);

    if (invites.some((i) => i.email.trim().toLowerCase() === normalizedEmail)) {
      return NextResponse.json({ error: "Email already invited" }, { status: 409 });
    }

    invites.push({
      name: name.trim(),
      email: normalizedEmail,
      // Sahla grants one level of access — see MOSQUE_ADMIN_ROLE. Any role sent
      // by a client is ignored rather than honored as a narrower grant it isn't.
      role: MOSQUE_ADMIN_ROLE,
    });

    await saveInvites(mosqueId, progress, invites);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mosqueId } = await params;
  const access = await requireMosqueAccess(mosqueId);
  if (!access.ok) return access.response;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { progress, invites } = await loadProgress(mosqueId);
    const filtered = invites.filter(
      (i) => i.email.trim().toLowerCase() !== normalizedEmail
    );
    await saveInvites(mosqueId, progress, filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
