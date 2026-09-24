import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Al Adhan's key → the name we store. `todays_prayers.prayer_name` is
 * lowercase everywhere else (lib/prayer/constants.ts, the web sync route, and
 * the rows the app reads), but this function used to write "Fajr"/"Dhuhr".
 * The unique key is (mosque_id, prayer_name, date) and text comparison is
 * case-sensitive, so the two spellings coexisted as duplicate rows instead of
 * upserting over each other.
 */
const PRAYER_KEYS: [string, string][] = [
  ["Fajr", "fajr"],
  ["Dhuhr", "dhuhr"],
  ["Asr", "asr"],
  ["Maghrib", "maghrib"],
  ["Isha", "isha"],
];
const WINDOW_DAYS = 30;
const DEFAULT_TIMEZONE = "America/New_York";

type IqamahConfig = {
  prayer_name: string;
  mode: "fixed" | "offset" | "seasonal";
  fixed_time: string | null;
  offset_minutes: number | null;
  seasonal_rules:
    | { start_date: string; end_date: string; mode: string; value: string | number }[]
    | null;
};

/** "05:12" + 20 -> "05:32". Mirrors addMinutes in lib/prayer/utils.ts. */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function isDateInRange(mmdd: string, start: string, end: string): boolean {
  return start <= end
    ? mmdd >= start && mmdd <= end
    : mmdd >= start || mmdd <= end; // wraps year-end
}

/**
 * Iqamah for one prayer on one date. Previously this function wrote only
 * athan_time and left iqamah_time NULL on every row it produced, so any day
 * covered by the cron had no iqamah times at all. Mirrors computeIqamahTime in
 * lib/prayer/utils.ts (edge functions can't import from lib/).
 */
function computeIqamah(
  athan: string,
  config: IqamahConfig | undefined,
  isoDate: string,
): string | null {
  if (!config) return null;
  if (config.mode === "fixed") return config.fixed_time;
  if (config.mode === "offset") {
    return config.offset_minutes == null
      ? null
      : addMinutes(athan, config.offset_minutes);
  }
  if (config.mode === "seasonal" && config.seasonal_rules?.length) {
    const mmdd = isoDate.slice(5); // 'YYYY-MM-DD' -> 'MM-DD'
    for (const rule of config.seasonal_rules) {
      if (!isDateInRange(mmdd, rule.start_date, rule.end_date)) continue;
      if (rule.mode === "fixed") return String(rule.value);
      if (rule.mode === "offset") return addMinutes(athan, Number(rule.value));
    }
  }
  return null;
}

/**
 * 'YYYY-MM-DD' right now in an IANA zone. Al Adhan returns each day's timings
 * in mosque-local time, and this function runs on a UTC clock, so the window
 * has to be anchored per mosque — otherwise every US mosque's evening counts as
 * the next day and the cleanup below deletes the times they are still using.
 * Mirrors lib/prayer/timezone.ts (edge functions can't import from lib/).
 */
function localDateIn(tz: string | null): string {
  const zone = tz || DEFAULT_TIMEZONE;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
}

type AlAdhanDay = {
  timings: Record<string, string>;
  date: { gregorian: { date: string } };
};

/**
 * Fetches a rolling 30-day window of prayer times from Al Adhan
 * and upserts them into todays_prayers.
 *
 * Designed to run on a bi-weekly cron (1st and 15th of each month).
 * Each run fetches the next 30 days, so halfway through you still
 * have 2+ weeks of data ahead. Old rows (before today) are cleaned
 * up each run.
 *
 * Body (optional): { mosque_id: string }
 * If no mosque_id provided, syncs all mosques.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let filterMosqueId: string | null = null;
    try {
      const body = await req.json();
      filterMosqueId = body?.mosque_id ?? null;
    } catch {
      // No body — sync all mosques
    }

    // Fetch mosques
    let query = supabase
      .from("mosques")
      .select(
        "id, name, latitude, longitude, calculation_method, school, timezone",
      );
    if (filterMosqueId) {
      query = query.eq("id", filterMosqueId);
    }
    const { data: mosques, error: mosqueErr } = await query;
    if (mosqueErr) throw new Error(mosqueErr.message);
    if (!mosques || mosques.length === 0) {
      return new Response(
        JSON.stringify({ message: "No mosques found" }),
        {
          status: 200,
          headers: { ...CORS, "Content-Type": "application/json" },
        },
      );
    }

    let totalUpserted = 0;
    const windows: { from: string; to: string }[] = [];
    // Collected rather than just logged, so a run that quietly synced nothing
    // is visible in the response instead of reporting success.
    const failures: { mosque_id: string; reason: string }[] = [];

    for (const mosque of mosques) {
      // Window start/end are this mosque's own calendar days.
      const todayStr = localDateIn(mosque.timezone);
      const startDate = new Date(`${todayStr}T12:00:00Z`);
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + WINDOW_DAYS - 1);
      const endStr = endDate.toISOString().split("T")[0];
      windows.push({ from: todayStr, to: endStr });

      // Which calendar months the window spans.
      const monthsNeeded: { year: number; month: number }[] = [];
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        const y = cursor.getUTCFullYear();
        const m = cursor.getUTCMonth() + 1;
        if (!monthsNeeded.find((e) => e.year === y && e.month === m)) {
          monthsNeeded.push({ year: y, month: m });
        }
        cursor.setUTCDate(cursor.getUTCDate() + 15);
      }
      const ey = endDate.getUTCFullYear();
      const em = endDate.getUTCMonth() + 1;
      if (!monthsNeeded.find((e) => e.year === ey && e.month === em)) {
        monthsNeeded.push({ year: ey, month: em });
      }

      // Coordinates, not a city name. The previous version called
      // calendarByCity with a hardcoded country=US and fell back to
      // city "New York" whenever `city` was null — so a mosque with no city on
      // file silently received New York's prayer times, and any non-US mosque
      // could never work at all. Al Adhan's geocoder also answers 503 for most
      // real addresses, which the /calendar lat/lng endpoint avoids entirely.
      if (mosque.latitude == null || mosque.longitude == null) {
        failures.push({
          mosque_id: mosque.id,
          reason: "no coordinates on file — run the geocode backfill",
        });
        continue;
      }
      const method = mosque.calculation_method ?? 2;
      const school = mosque.school ?? 0;
      const tzParam = mosque.timezone
        ? `&timezonestring=${encodeURIComponent(mosque.timezone)}`
        : "";

      // Fetch all needed months from Al Adhan calendar API
      const allDays: AlAdhanDay[] = [];
      let monthFetchFailed = false;
      for (const { year, month } of monthsNeeded) {
        const url =
          `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${mosque.latitude}&longitude=${mosque.longitude}&method=${method}&school=${school}${tzParam}`;
        const res = await fetch(url);
        if (!res.ok) {
          // Record it. Previously this only logged and continued, so a run
          // that fetched nothing still reported success:true.
          monthFetchFailed = true;
          failures.push({
            mosque_id: mosque.id,
            reason: `Al Adhan ${res.status} for ${year}/${month}`,
          });
          continue;
        }
        const json = await res.json();
        allDays.push(...(json.data as AlAdhanDay[]));
      }
      if (allDays.length === 0) {
        if (!monthFetchFailed) {
          failures.push({
            mosque_id: mosque.id,
            reason: "Al Adhan returned no days",
          });
        }
        continue;
      }

      // This mosque's iqamah rules, so the cron writes the same shape of row
      // as the onboarding sync route rather than leaving iqamah_time NULL.
      const { data: iqamahConfigs } = await supabase
        .from("iqamah_config")
        .select("prayer_name, mode, fixed_time, offset_minutes, seasonal_rules")
        .eq("mosque_id", mosque.id);
      const configByPrayer = new Map<string, IqamahConfig>(
        (iqamahConfigs ?? []).map((
          c: IqamahConfig,
        ) => [c.prayer_name.toLowerCase(), c]),
      );

      // Filter to 30-day window and build upsert rows
      const rows: {
        mosque_id: string;
        prayer_name: string;
        athan_time: string;
        iqamah_time: string;
        date: string;
      }[] = [];

      for (const day of allDays) {
        // Al Adhan date format: DD-MM-YYYY -> YYYY-MM-DD
        const [dd, mm, yyyy] = day.date.gregorian.date.split("-");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (dateStr < todayStr || dateStr > endStr) continue;

        for (const [aladhanKey, prayerName] of PRAYER_KEYS) {
          const raw = day.timings[aladhanKey]?.replace(/\s*\(.*\)/, "") ?? "";
          if (!raw) continue;
          rows.push({
            mosque_id: mosque.id,
            prayer_name: prayerName,
            date: dateStr,
            athan_time: raw,
            // Same fallback the web route uses: with no rule configured, the
            // iqamah column mirrors athan rather than going null.
            iqamah_time:
              computeIqamah(raw, configByPrayer.get(prayerName), dateStr) ?? raw,
          });
        }
      }

      // Upsert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error: upsertErr } = await supabase
          .from("todays_prayers")
          .upsert(batch, { onConflict: "mosque_id,prayer_name,date" });
        if (upsertErr) {
          console.error(
            `Upsert error for mosque ${mosque.id}:`,
            upsertErr.message,
          );
          failures.push({ mosque_id: mosque.id, reason: upsertErr.message });
        } else {
          totalUpserted += batch.length;
        }
      }

      // Clean up rows before this mosque's own today.
      await supabase
        .from("todays_prayers")
        .delete()
        .eq("mosque_id", mosque.id)
        .lt("date", todayStr);
    }

    // A mosque can contribute more than one failure (two months, say), so
    // count distinct mosques rather than failure entries.
    const failedMosques = new Set(failures.map((f) => f.mosque_id));

    return new Response(
      JSON.stringify({
        success: failures.length === 0,
        mosques_seen: mosques.length,
        mosques_synced: mosques.length - failedMosques.size,
        rows_upserted: totalUpserted,
        windows,
        failures,
      }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sync-prayer-times error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
