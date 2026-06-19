import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

/**
 * Full profile for a single member of the signed-in mosque. Powers the member
 * profile dialog on `people/members`. Read-only: members manage their own data
 * in the app — the CRM never writes here.
 *
 * Access is scoped: a member is only returned when they have a
 * `user_preferences` row for the caller's mosque — the SAME definition the
 * Members list uses — so an admin can never read a user from another mosque.
 */

export type MemberDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  signupAt: string;
  membershipKind: "new" | "regular";
  push: { enabled: boolean; device: string | null };
  profileStatus: "complete" | "in_progress" | "not_started";
  lastActiveAt: string | null;
  notifications: {
    program: boolean;
    event: boolean;
    prayer: boolean;
    announcements: boolean;
  };
  rsvpCount: number;
  savedProgramsCount: number;
  businessAd: { name: string; status: string } | null;
  personalization: {
    age: number | null;
    gender: "Male" | "Female" | "Other" | null;
    isRevert: boolean | null;
    hasChildren: boolean | null;
    childrenCount: number | null;
    knowledge: string | null;
    interests: string[];
    programsFor: string[];
    bestTimes: string[];
    morePrefs: string[];
    completed: boolean;
  };
};

const NEW_MEMBER_WINDOW_MS = 14 * 86_400_000;

function normalizeGender(raw: string | null): "Male" | "Female" | "Other" | null {
  if (!raw || raw.trim() === "") return null;
  const g = raw.trim().toLowerCase();
  if (g === "male" || g === "m" || g === "brother") return "Male";
  if (g === "female" || g === "f" || g === "sister") return "Female";
  return "Other";
}

/** Map a stored device_type to a member-friendly label. */
function deviceLabel(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.trim().toLowerCase();
  if (d.includes("ios") || d.includes("iphone") || d.includes("apple")) return "iPhone";
  if (d.includes("ipad")) return "iPad";
  if (d.includes("android")) return "Android";
  if (d.includes("web")) return "Web";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Title-case a free-text knowledge level, collapsing the known synonyms. */
function normalizeKnowledge(raw: string | null): string | null {
  if (!raw || raw.trim() === "") return null;
  const k = raw.trim().toLowerCase();
  if (k === "starting" || k === "new" || k.includes("new to islam")) return "New to Islam";
  if (k === "basics" || k.includes("learning the basics") || k.includes("basic")) return "Learning the basics";
  if (k === "practicing") return "Practicing";
  if (k.includes("solid")) return "Solid foundation";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function ageFrom(dateOfBirth: string | null, birthYear: number | null, currentYear: number): number | null {
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
      if (age > 0 && age < 120) return age;
    }
  }
  if (birthYear) {
    const age = currentYear - birthYear;
    if (age > 0 && age < 120) return age;
  }
  return null;
}

function cleanArray(raw: string[] | null): string[] {
  return (raw ?? []).map((s) => s?.trim()).filter((s): s is string => !!s);
}

type PrefRow = {
  gender: string | null;
  birth_year: number | null;
  is_revert: boolean | null;
  has_children: boolean | null;
  children_ages: number[] | null;
  islamic_knowledge_level: string | null;
  attendance_reasons: string[] | null;
  programs_for: string[] | null;
  additional_preferences: string[] | null;
  attendance_windows: string[] | null;
  personalization_completed_at: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  const { id } = await params;

  // HQ has no single mosque — the client falls back to the list fixture.
  if (access.isHQ) {
    return NextResponse.json({ error: "Not available in HQ preview" }, { status: 404 });
  }

  const supabase = createAdminSupabaseClient();
  const mosqueId = access.mosqueId;

  // Gate on membership: the user must have a preferences row for this mosque.
  const { data: prefRow, error: prefErr } = await supabase
    .from("user_preferences")
    .select(
      "gender, birth_year, is_revert, has_children, children_ages, islamic_knowledge_level, attendance_reasons, programs_for, additional_preferences, attendance_windows, personalization_completed_at"
    )
    .eq("mosque_id", mosqueId)
    .eq("user_id", id)
    .maybeSingle();

  if (prefErr) {
    return NextResponse.json({ error: prefErr.message }, { status: 500 });
  }
  if (!prefRow) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  const pref = prefRow as PrefRow;

  // Profile + reachability + interactions, fetched in bulk.
  const [profileRes, pushRes, notifRes, prayerRes, rsvpRes, savedRes, adRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, profile_email, phone_number, created_at, date_of_birth")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("push_tokens")
        .select("device_type")
        .eq("mosque_id", mosqueId)
        .eq("user_id", id)
        .eq("is_active", true)
        .limit(1),
      supabase
        .from("user_notification_preferences")
        .select("new_programs_enabled, event_reminders_enabled, masjid_announcements_enabled")
        .eq("mosque_id", mosqueId)
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("prayer_notification_settings")
        .select("notification_settings")
        .eq("mosque_id", mosqueId)
        .eq("user_id", id),
      supabase
        .from("rsvps")
        .select("id", { count: "exact", head: true })
        .eq("mosque_id", mosqueId)
        .eq("user_id", id),
      supabase
        .from("saved_content")
        .select("content_id")
        .eq("mosque_id", mosqueId)
        .eq("user_id", id),
      supabase
        .from("business_ads_submissions")
        .select("business_name, status")
        .eq("mosque_id", mosqueId)
        .eq("user_id", id)
        .order("id", { ascending: false })
        .limit(1),
    ]);

  const profile = (profileRes.data as {
    first_name: string | null;
    last_name: string | null;
    profile_email: string | null;
    phone_number: string | null;
    created_at: string | null;
    date_of_birth: string | null;
  } | null) ?? null;

  const name =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    "Anonymous member";
  const signupAt = profile?.created_at ?? new Date().toISOString();
  const isNew = Date.now() - new Date(signupAt).getTime() < NEW_MEMBER_WINDOW_MS;

  // Saved programs only — join the saved content_ids to their type.
  const savedIds = ((savedRes.data as { content_id: string }[] | null) ?? []).map(
    (r) => r.content_id
  );
  let savedProgramsCount = 0;
  if (savedIds.length > 0) {
    const { count } = await supabase
      .from("content_items")
      .select("content_id", { count: "exact", head: true })
      .eq("mosque_id", mosqueId)
      .eq("type", "program")
      .in("content_id", savedIds);
    savedProgramsCount = count ?? 0;
  }

  const notif = (notifRes.data as {
    new_programs_enabled: boolean | null;
    event_reminders_enabled: boolean | null;
    masjid_announcements_enabled: boolean | null;
  } | null) ?? null;

  const prayerOn = ((prayerRes.data as { notification_settings: string[] | null }[] | null) ?? [])
    .some((r) => (r.notification_settings?.length ?? 0) > 0);

  const ad = ((adRes.data as { business_name: string | null; status: string | null }[] | null) ?? [])[0];

  const completed = pref.personalization_completed_at != null;
  const hasAnyPersonalization =
    pref.gender != null ||
    pref.birth_year != null ||
    pref.islamic_knowledge_level != null ||
    cleanArray(pref.attendance_reasons).length > 0;
  const profileStatus: MemberDetail["profileStatus"] = completed
    ? "complete"
    : hasAnyPersonalization
    ? "in_progress"
    : "not_started";

  const childrenCount = pref.children_ages?.length ?? null;

  const detail: MemberDetail = {
    id,
    name,
    email: profile?.profile_email ?? "—",
    phone: profile?.phone_number ?? null,
    signupAt,
    membershipKind: isNew ? "new" : "regular",
    push: {
      enabled: ((pushRes.data as { device_type: string | null }[] | null) ?? []).length > 0,
      device: deviceLabel(
        ((pushRes.data as { device_type: string | null }[] | null) ?? [])[0]?.device_type ?? null
      ),
    },
    profileStatus,
    lastActiveAt: null, // No tracking column yet — surfaced as "Not tracked".
    notifications: {
      program: !!notif?.new_programs_enabled,
      event: !!notif?.event_reminders_enabled,
      prayer: prayerOn,
      announcements: !!notif?.masjid_announcements_enabled,
    },
    rsvpCount: rsvpRes.count ?? 0,
    savedProgramsCount,
    businessAd: ad?.business_name
      ? { name: ad.business_name, status: ad.status ?? "pending" }
      : null,
    personalization: {
      age: ageFrom(profile?.date_of_birth ?? null, pref.birth_year, new Date().getFullYear()),
      gender: normalizeGender(pref.gender),
      isRevert: pref.is_revert,
      hasChildren: pref.has_children,
      childrenCount,
      knowledge: normalizeKnowledge(pref.islamic_knowledge_level),
      interests: cleanArray(pref.attendance_reasons),
      programsFor: cleanArray(pref.programs_for),
      bestTimes: cleanArray(pref.attendance_windows),
      morePrefs: cleanArray(pref.additional_preferences),
      completed,
    },
  };

  return NextResponse.json(detail);
}
