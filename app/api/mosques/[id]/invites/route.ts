import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type QueuedInvite = {
  name: string;
  email: string;
  role: "org:admin" | "org:editor" | "org:viewer";
};

const VALID_ROLES = ["org:admin", "org:editor", "org:viewer"];

async function getQueuedInvites(mosqueId: string): Promise<QueuedInvite[]> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  const progress = (data?.onboarding_progress ?? {}) as Record<string, unknown>;
  return (progress._queued_invites as QueuedInvite[]) ?? [];
}

async function setQueuedInvites(mosqueId: string, invites: QueuedInvite[], markComplete?: boolean) {
  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from("mosques")
    .select("onboarding_progress")
    .eq("id", mosqueId)
    .single();

  const progress = ((data?.onboarding_progress ?? {}) as Record<string, unknown>);
  progress._queued_invites = invites;
  if (markComplete) {
    progress.invite_admins = true;
  }

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
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const invites = await getQueuedInvites(mosqueId);
  return NextResponse.json(invites);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const body = await request.json();
  const { name, email, role } = body as { name?: string; email?: string; role?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const invites = await getQueuedInvites(mosqueId);

    if (invites.some((i) => i.email === email.trim().toLowerCase())) {
      return NextResponse.json({ error: "Email already invited" }, { status: 409 });
    }

    invites.push({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role as QueuedInvite["role"],
    });

    // Mark task complete on first invite
    await setQueuedInvites(mosqueId, invites, invites.length === 1);

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
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const invites = await getQueuedInvites(mosqueId);
    const filtered = invites.filter((i) => i.email !== email);
    await setQueuedInvites(mosqueId, filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
