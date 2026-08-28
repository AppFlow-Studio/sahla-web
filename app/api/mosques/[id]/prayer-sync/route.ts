import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { PRAYER_NAMES } from "@/lib/prayer/constants";
import { parseAlAdhanTime, computeIqamahTime, ALADHAN_KEY_MAP, buildAlAdhanQuery } from "@/lib/prayer/utils";
import { localDay, localCalendarDate } from "@/lib/prayer/timezone";
import type { AlAdhanDayData, IqamahConfig } from "@/lib/prayer/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  // 1. Get mosque info
  const { data: mosque, error: mosqueError } = await supabase
    .from("mosques")
    .select("id, address, calculation_method, school, timezone, midnight_mode, latitude_adjustment_method, prayer_tune, shafaq")
    .eq("id", mosqueId)
    .single();

  if (mosqueError || !mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  if (!mosque.address) {
    return NextResponse.json({ error: "Mosque address is required" }, { status: 400 });
  }

  // Everything below is anchored to the mosque's own calendar day, not the
  // server's — see lib/prayer/timezone.ts.
  const now = new Date();
  const today = localDay(mosque.timezone, now);
  const { year, month } = today;

  // 2. Fetch month from AlAdhan
  const qs = buildAlAdhanQuery(mosque.address, {
    method: mosque.calculation_method || 2,
    school: mosque.school || 0,
    midnightMode: mosque.midnight_mode,
    latitudeAdjustmentMethod: mosque.latitude_adjustment_method,
    tune: mosque.prayer_tune,
    shafaq: mosque.shafaq,
  });
  const url = `https://api.aladhan.com/v1/calendarByAddress/${year}/${month}?${qs}`;

  const aladhanRes = await fetch(url);
  if (!aladhanRes.ok) {
    return NextResponse.json({ error: "AlAdhan API failed" }, { status: 502 });
  }

  const aladhanJson = await aladhanRes.json();
  if (aladhanJson.code !== 200 || !aladhanJson.data) {
    return NextResponse.json({ error: "Invalid AlAdhan response" }, { status: 502 });
  }

  // 3. Store in prayers table (delete + insert for this mosque)
  const { error: deleteError } = await supabase.from("prayers").delete().eq("mosque_id", mosqueId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  const { error: prayerInsertError } = await supabase.from("prayers").insert({
    mosque_id: mosqueId,
    prayerData: aladhanJson.data,
  });
  if (prayerInsertError) {
    return NextResponse.json({ error: prayerInsertError.message }, { status: 500 });
  }

  // 4. Compute today's prayers
  const prayerData: AlAdhanDayData[] = aladhanJson.data;

  const todayData = prayerData.find((d) => d.date.gregorian.date === today.aladhan);
  if (!todayData) {
    return NextResponse.json({ error: "Today's data not found in response" }, { status: 500 });
  }

  // 5. Get iqamah config
  const { data: iqamahConfigs } = await supabase
    .from("iqamah_config")
    .select("*")
    .eq("mosque_id", mosqueId);

  // 6. Compute and upsert todays_prayers. Scope the delete to today's row only:
  // the sync-prayer-times cron keeps a 30-day window in this table, and a
  // mosque-wide delete would wipe it.
  const todayIsoDate = today.iso;
  await supabase
    .from("todays_prayers")
    .delete()
    .eq("mosque_id", mosqueId)
    .eq("date", todayIsoDate);

  const todaysRows = PRAYER_NAMES.map((prayer) => {
    const athanRaw = todayData.timings[ALADHAN_KEY_MAP[prayer]];
    const athanTime = parseAlAdhanTime(athanRaw);
    const config = iqamahConfigs?.find(
      (c: IqamahConfig) => c.prayer_name === prayer
    );
    const iqamahTime = config
      ? computeIqamahTime(athanTime, config as IqamahConfig, localCalendarDate(mosque.timezone, now))
      : null;

    return {
      mosque_id: mosqueId,
      prayer_name: prayer,
      athan_time: athanTime,
      iqamah_time: iqamahTime || athanTime,
      date: todayIsoDate,
    };
  });

  const { error: insertError } = await supabase
    .from("todays_prayers")
    .insert(todaysRows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, prayers: todaysRows });
}
