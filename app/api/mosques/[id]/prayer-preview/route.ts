import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { parseAlAdhanTime, buildAlAdhanQuery } from "@/lib/prayer/utils";
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

  await params; // consume params even though we don't need mosque id here

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

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const qs = buildAlAdhanQuery(address, {
    method: Number(method),
    school: Number(school),
    midnightMode: midnightMode != null ? Number(midnightMode) : undefined,
    latitudeAdjustmentMethod: latitudeAdjustmentMethod != null ? Number(latitudeAdjustmentMethod) : undefined,
    tune,
    shafaq: shafaq || undefined,
  });
  const url = `https://api.aladhan.com/v1/timingsByAddress/${dd}-${mm}-${yyyy}?${qs}`;

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
