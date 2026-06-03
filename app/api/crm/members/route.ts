import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmMember = {
  id: string;
  name: string;
  email: string;
  signupAt: string;
  lastActiveAt: string | null;
  rsvpCount: number;
  hasPushToken: boolean;
  membershipKind: "new" | "regular";
};

const NEW_MEMBER_WINDOW_MS = 14 * 86_400_000;

type PrefRow = {
  user_id: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_email: string | null;
    created_at: string | null;
  } | null;
};

type CountRow = { user_id: string };

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  if (access.isHQ) {
    return NextResponse.json({ members: [] satisfies CrmMember[] });
  }

  const supabase = createAdminSupabaseClient();

  // Members are users with preferences set for this mosque. Join to profiles
  // for display name + email + signup time.
  const { data: prefRows, error: prefErr } = await supabase
    .from("user_preferences")
    .select(
      "user_id, profiles!user_preferences_user_id_fkey ( id, first_name, last_name, profile_email, created_at )"
    )
    .eq("mosque_id", access.mosqueId);

  if (prefErr) {
    return NextResponse.json({ error: prefErr.message }, { status: 500 });
  }

  const rows = (prefRows as unknown as PrefRow[] | null) ?? [];
  const userIds = rows
    .map((r) => r.profiles?.id)
    .filter((id): id is string => !!id);

  // Bulk-fetch RSVP counts + active push-token presence so we don't N+1.
  const [rsvpRes, pushRes] = await Promise.all([
    supabase
      .from("rsvps")
      .select("user_id")
      .eq("mosque_id", access.mosqueId)
      .in("user_id", userIds.length > 0 ? userIds : ["__none__"]),
    supabase
      .from("push_tokens")
      .select("user_id")
      .eq("mosque_id", access.mosqueId)
      .eq("is_active", true)
      .in("user_id", userIds.length > 0 ? userIds : ["__none__"]),
  ]);

  const rsvpCounts = new Map<string, number>();
  for (const row of ((rsvpRes.data as CountRow[] | null) ?? [])) {
    rsvpCounts.set(row.user_id, (rsvpCounts.get(row.user_id) ?? 0) + 1);
  }

  const pushSet = new Set<string>(
    ((pushRes.data as CountRow[] | null) ?? []).map((r) => r.user_id)
  );

  const now = Date.now();
  const members: CrmMember[] = rows
    .filter((r): r is PrefRow & { profiles: NonNullable<PrefRow["profiles"]> } => !!r.profiles)
    .map((r) => {
      const p = r.profiles;
      const name =
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        "Anonymous member";
      const signupAt = p.created_at ?? new Date().toISOString();
      const isNew =
        now - new Date(signupAt).getTime() < NEW_MEMBER_WINDOW_MS;
      const membershipKind: CrmMember["membershipKind"] = isNew ? "new" : "regular";
      return {
        id: p.id,
        name,
        email: p.profile_email ?? "—",
        signupAt,
        lastActiveAt: null, // No column yet — wire in a later pass when we add tracking.
        rsvpCount: rsvpCounts.get(p.id) ?? 0,
        hasPushToken: pushSet.has(p.id),
        membershipKind,
      };
    })
    .sort((a, b) => new Date(b.signupAt).getTime() - new Date(a.signupAt).getTime());

  return NextResponse.json({ members });
}
