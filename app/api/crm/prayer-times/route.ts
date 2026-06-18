import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import { fetchAthanByPrayer } from "@/lib/prayer/athan-server";
import { fixedIqamahBeforeAthan } from "@/lib/prayer/utils";
import type { IqamahConfig, PrayerName } from "@/lib/prayer/types";

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PRAYERS: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export type CrmPrayerTimesPayload = {
  calculation_method: number;
  school: number;
  iqamah: IqamahConfig[];
};

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  if (access.isHQ) {
    // HQ preview — return defaults so the UI renders.
    return NextResponse.json({
      calculation_method: 2,
      school: 0,
      iqamah: [],
    } satisfies CrmPrayerTimesPayload);
  }

  const supabase = createAdminSupabaseClient();

  const [mosqueRes, iqamahRes] = await Promise.all([
    supabase
      .from("mosques")
      .select("calculation_method, school")
      .eq("id", access.mosqueId)
      .single(),
    supabase
      .from("iqamah_config")
      .select("prayer_name, mode, fixed_time, offset_minutes, seasonal_rules")
      .eq("mosque_id", access.mosqueId),
  ]);

  if (mosqueRes.error) {
    return NextResponse.json({ error: mosqueRes.error.message }, { status: 500 });
  }
  if (iqamahRes.error) {
    return NextResponse.json({ error: iqamahRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    calculation_method: mosqueRes.data?.calculation_method ?? 2,
    school: mosqueRes.data?.school ?? 0,
    iqamah: (iqamahRes.data as IqamahConfig[] | null) ?? [],
  } satisfies CrmPrayerTimesPayload);
}

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<CrmPrayerTimesPayload>
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!Array.isArray(body.iqamah) || body.iqamah.length !== 5) {
    return NextResponse.json(
      { error: "iqamah must be an array of 5 entries" },
      { status: 400 }
    );
  }
  if (typeof body.calculation_method !== "number" || typeof body.school !== "number") {
    return NextResponse.json(
      { error: "calculation_method and school must be numbers" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();

  // Reject impossible configs: a fixed iqamah time can't fall before its athan.
  const athanByPrayer = await fetchAthanByPrayer(supabase, access.mosqueId);
  const offending = fixedIqamahBeforeAthan(body.iqamah, athanByPrayer);
  if (offending.length > 0) {
    return NextResponse.json(
      {
        error: `Iqamah can't be before athan for ${offending
          .map(titleCase)
          .join(", ")}.`,
      },
      { status: 422 }
    );
  }

  const { error: mosqueErr } = await supabase
    .from("mosques")
    .update({
      calculation_method: body.calculation_method,
      school: body.school,
    })
    .eq("id", access.mosqueId);

  if (mosqueErr) {
    return NextResponse.json({ error: mosqueErr.message }, { status: 500 });
  }

  // Delete-then-insert pattern matches the existing /api/mosques/[id]/iqamah-config route.
  const { error: delErr } = await supabase
    .from("iqamah_config")
    .delete()
    .eq("mosque_id", access.mosqueId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  const rows = body.iqamah.map((c) => {
    if (!PRAYERS.includes(c.prayer_name)) {
      throw new Error(`Unknown prayer_name: ${c.prayer_name}`);
    }
    return {
      mosque_id: access.mosqueId,
      prayer_name: c.prayer_name,
      mode: c.mode,
      fixed_time: c.mode === "fixed" ? c.fixed_time : null,
      offset_minutes: c.mode === "offset" ? c.offset_minutes : null,
      seasonal_rules: c.mode === "seasonal" ? c.seasonal_rules : null,
    };
  });

  const { error: insErr } = await supabase.from("iqamah_config").insert(rows);
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Re-sync athan times for this mosque so a calculation-method/school change
  // takes effect immediately, instead of waiting for the bi-weekly cron.
  void fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-prayer-times`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mosque_id: access.mosqueId }),
  }).catch((err) => console.error("prayer-times re-sync trigger failed:", err));

  // D3 from the CRM gap plan: surface prayer-time edits on the activity feed.
  const session = await auth();
  const actorName =
    (session?.sessionClaims?.fullName as string | undefined) ??
    (session?.sessionClaims?.email as string | undefined) ??
    "An admin";
  void supabase.from("activity_log").insert({
    mosque_id: access.mosqueId,
    actor_id: access.userId,
    actor_name: actorName,
    action: "prayer_times_updated",
    entity_type: "mosque",
    entity_id: access.mosqueId,
    entity_name: null,
    metadata: {
      calculation_method: body.calculation_method,
      school: body.school,
    },
  });

  return NextResponse.json({ success: true });
}
