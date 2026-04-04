import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

const PRAYER_NAMES: PrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

const ALADHAN_KEY_MAP: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

// ─── Utility Functions ───

function parseAlAdhanTime(raw: string): string {
  return raw.replace(/\s*\(.*\)$/, "").trim();
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function isDateInRange(dateMMDD: string, startMMDD: string, endMMDD: string): boolean {
  if (startMMDD <= endMMDD) {
    return dateMMDD >= startMMDD && dateMMDD <= endMMDD;
  }
  return dateMMDD >= startMMDD || dateMMDD <= endMMDD;
}

interface SeasonalRule {
  start_date: string;
  end_date: string;
  mode: "fixed" | "offset";
  value: string | number;
}

interface IqamahConfigRow {
  prayer_name: PrayerName;
  mode: "fixed" | "offset" | "seasonal";
  fixed_time: string | null;
  offset_minutes: number | null;
  seasonal_rules: SeasonalRule[] | null;
}

function computeIqamahTime(
  athanTime: string,
  config: IqamahConfigRow,
  date: Date
): string | null {
  if (config.mode === "fixed") return config.fixed_time;

  if (config.mode === "offset") {
    if (config.offset_minutes == null) return null;
    return addMinutes(athanTime, config.offset_minutes);
  }

  if (config.mode === "seasonal" && config.seasonal_rules?.length) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateMMDD = `${mm}-${dd}`;
    for (const rule of config.seasonal_rules) {
      if (isDateInRange(dateMMDD, rule.start_date, rule.end_date)) {
        if (rule.mode === "fixed") return String(rule.value);
        if (rule.mode === "offset") return addMinutes(athanTime, Number(rule.value));
      }
    }
  }

  return null;
}

// ─── Core Actions ───

interface Mosque {
  id: string;
  address: string;
  calculation_method: number;
  school: number;
  timezone: string;
}

async function getActiveMosques(mosqueId?: string): Promise<Mosque[]> {
  let query = supabase
    .from("mosques")
    .select("id, address, calculation_method, school, timezone")
    .in("subscription_status", ["active", "trial"]);

  if (mosqueId) {
    query = query.eq("id", mosqueId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch mosques:", error.message);
    return [];
  }
  return (data || []).filter((m: Mosque) => m.address);
}

async function fetchMonth(mosques: Mosque[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let success = 0;
  let failed = 0;

  for (const mosque of mosques) {
    try {
      const url = `https://api.aladhan.com/v1/calendarByAddress/${year}/${month}?address=${encodeURIComponent(mosque.address)}&method=${mosque.calculation_method || 2}&school=${mosque.school || 0}`;

      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`AlAdhan failed for ${mosque.id}: ${res.status}`);
        failed++;
        continue;
      }

      const json = await res.json();
      if (json.code !== 200 || !json.data) {
        console.warn(`AlAdhan invalid response for ${mosque.id}`);
        failed++;
        continue;
      }

      // Delete existing and insert fresh
      await supabase.from("prayers").delete().eq("mosque_id", mosque.id);
      const { error } = await supabase.from("prayers").insert({
        mosque_id: mosque.id,
        prayerData: json.data,
      });

      if (error) {
        console.error(`Failed to store prayers for ${mosque.id}:`, error.message);
        failed++;
      } else {
        success++;
      }
    } catch (err) {
      console.error(`Error processing ${mosque.id}:`, err);
      failed++;
    }
  }

  return { success, failed };
}

async function computeToday(mosques: Mosque[]) {
  const now = new Date();
  let success = 0;
  let failed = 0;

  for (const mosque of mosques) {
    try {
      // Get cached prayer data
      const { data: prayerRows } = await supabase
        .from("prayers")
        .select("prayerData")
        .eq("mosque_id", mosque.id)
        .limit(1);

      if (!prayerRows?.length || !prayerRows[0].prayerData) {
        console.warn(`No prayer data cached for ${mosque.id}`);
        failed++;
        continue;
      }

      const prayerData = prayerRows[0].prayerData;
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = now.getFullYear();
      const target = `${dd}-${mm}-${yyyy}`;

      // deno-lint-ignore no-explicit-any
      const todayData = prayerData.find((d: any) => d.date?.gregorian?.date === target);
      if (!todayData) {
        console.warn(`Today's data not found for ${mosque.id} (${target})`);
        failed++;
        continue;
      }

      // Get iqamah config
      const { data: iqamahConfigs } = await supabase
        .from("iqamah_config")
        .select("*")
        .eq("mosque_id", mosque.id);

      // Compute
      const rows = PRAYER_NAMES.map((prayer) => {
        const athanRaw = todayData.timings[ALADHAN_KEY_MAP[prayer]];
        const athanTime = parseAlAdhanTime(athanRaw);
        const config = iqamahConfigs?.find(
          (c: IqamahConfigRow) => c.prayer_name === prayer
        );
        const iqamahTime = config
          ? computeIqamahTime(athanTime, config as IqamahConfigRow, now)
          : null;

        return {
          mosque_id: mosque.id,
          prayer_name: prayer,
          athan_time: athanTime,
          iqamah_time: iqamahTime || athanTime,
        };
      });

      await supabase.from("todays_prayers").delete().eq("mosque_id", mosque.id);
      const { error } = await supabase.from("todays_prayers").insert(rows);

      if (error) {
        console.error(`Failed to write todays_prayers for ${mosque.id}:`, error.message);
        failed++;
      } else {
        success++;
      }
    } catch (err) {
      console.error(`Error computing for ${mosque.id}:`, err);
      failed++;
    }
  }

  return { success, failed };
}

// ─── Main Handler ───

Deno.serve(async (req: Request) => {
  const start = Date.now();

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const action: string = body.action;
    const mosqueId: string | undefined = body.mosque_id;

    if (!action || !["fetch_month", "compute_today"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use fetch_month or compute_today" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const mosques = await getActiveMosques(mosqueId);
    console.log(`[sync-prayer-times] action=${action} mosques=${mosques.length}`);

    let result;
    if (action === "fetch_month") {
      result = await fetchMonth(mosques);
    } else {
      result = await computeToday(mosques);
    }

    const duration = Date.now() - start;
    console.log(`[sync-prayer-times] completed in ${duration}ms:`, result);

    return new Response(
      JSON.stringify({ success: true, action, duration_ms: duration, ...result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync-prayer-times] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: String(err), duration_ms: Date.now() - start }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
