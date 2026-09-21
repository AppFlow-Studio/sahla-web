import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { parseAlAdhanTime, buildAlAdhanCoordQuery } from "@/lib/prayer/utils";
import { localDay } from "@/lib/prayer/timezone";
import {
  geocodeAddress,
  GeocodingConfigError,
  type Coordinates,
} from "@/lib/geocode";
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
    .select("timezone, latitude, longitude")
    .eq("id", mosqueId)
    .single();
  const today = localDay(mosque?.timezone);

  // The admin is previewing an address they may not have saved yet, so geocode
  // what they typed rather than trusting the stored coordinates. Falling back
  // to the saved pair keeps the preview working when the address is unchanged
  // and Google is unavailable.
  let coordinates: Coordinates | null = null;
  try {
    const geocoded = await geocodeAddress(address);
    if (geocoded) {
      coordinates = { latitude: geocoded.latitude, longitude: geocoded.longitude };
    }
  } catch (err) {
    if (!(err instanceof GeocodingConfigError)) throw err;
    console.error("Preview geocoding unavailable:", err.message);
  }
  if (!coordinates && mosque?.latitude != null && mosque?.longitude != null) {
    coordinates = { latitude: mosque.latitude, longitude: mosque.longitude };
  }
  if (!coordinates) {
    return NextResponse.json(
      { error: `We couldn't find "${address}" on the map. Check the address.` },
      { status: 400 }
    );
  }

  const qs = buildAlAdhanCoordQuery(
    coordinates,
    {
      method: Number(method),
      school: Number(school),
      midnightMode: midnightMode != null ? Number(midnightMode) : undefined,
      latitudeAdjustmentMethod: latitudeAdjustmentMethod != null ? Number(latitudeAdjustmentMethod) : undefined,
      tune,
      shafaq: shafaq || undefined,
    },
    mosque?.timezone
  );
  const url = `https://api.aladhan.com/v1/timings/${today.aladhan}?${qs}`;

  const res = await fetch(url, { cache: "no-store" });
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
