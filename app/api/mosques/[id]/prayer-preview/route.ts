import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { parseAlAdhanTime, buildAlAdhanQuery } from "@/lib/prayer/utils";
import { localDay } from "@/lib/prayer/timezone";
import type { PrayerName } from "@/lib/prayer/types";

const PRAYER_MAP: Record<string, PrayerName> = {
  Fajr: "fajr",
  Dhuhr: "dhuhr",
  Asr: "asr",
  Maghrib: "maghrib",
  Isha: "isha",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const method = searchParams.get("method") || "2";
  const school = searchParams.get("school") || "0";
  const midnightMode = searchParams.get("midnightMode");
  const latitudeAdjustmentMethod = searchParams.get("latitudeAdjustmentMethod");
  const tune = searchParams.get("tune");
  const shafaq = searchParams.get("shafaq");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  // Preview "today" in the mosque's zone, not the server's — otherwise an
  // admin previewing in the evening is shown tomorrow's times.
  const { data: mosque } = await createAdminSupabaseClient()
    .from("mosques")
    .select("timezone")
    .eq("id", mosqueId)
    .single();
  const today = localDay(mosque?.timezone);

  const qs = buildAlAdhanQuery(address, {
    method: Number(method),
    school: Number(school),
    midnightMode: midnightMode != null ? Number(midnightMode) : undefined,
    latitudeAdjustmentMethod: latitudeAdjustmentMethod != null ? Number(latitudeAdjustmentMethod) : undefined,
    tune,
    shafaq: shafaq || undefined,
  });
  const url = `https://api.aladhan.com/v1/timingsByAddress/${today.aladhan}?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch prayer times from AlAdhan" },
      { status: 502 }
    );
  }

  const json = await res.json();

  if (json.code !== 200 || !json.data?.timings) {
    return NextResponse.json(
      { error: "Invalid response from AlAdhan" },
      { status: 502 }
    );
  }

  const timings: Record<PrayerName, string> = {} as Record<PrayerName, string>;
  for (const [aladhanKey, prayerName] of Object.entries(PRAYER_MAP)) {
    timings[prayerName] = parseAlAdhanTime(json.data.timings[aladhanKey]);
  }

  return NextResponse.json({
    timings,
    date: json.data.date,
    meta: json.data.meta,
  });
}
