import type {
  PrayerName,
  IqamahConfig,
  AlAdhanDayData,
  AlAdhanParams,
} from "./types";

/**
 * Builds AlAdhan API query string from mosque prayer settings.
 */
export function buildAlAdhanQuery(address: string, params: AlAdhanParams): string {
  const qs = new URLSearchParams({
    address,
    method: String(params.method),
    school: String(params.school),
  });
  if (params.midnightMode != null) qs.set("midnightMode", String(params.midnightMode));
  if (params.latitudeAdjustmentMethod != null) qs.set("latitudeAdjustmentMethod", String(params.latitudeAdjustmentMethod));
  if (params.tune) qs.set("tune", params.tune);
  if (params.shafaq && params.shafaq !== "general") qs.set("shafaq", params.shafaq);
  return qs.toString();
}

export const ALADHAN_KEY_MAP: Record<PrayerName, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

/**
 * Strips timezone abbreviation from AlAdhan time string.
 * "05:12 (EDT)" → "05:12"
 */
export function parseAlAdhanTime(raw: string): string {
  return raw.replace(/\s*\(.*\)$/, "").trim();
}

/**
 * Converts 24h time (HH:MM) to 12h format (h:MM AM/PM).
 * "05:12" → "5:12 AM", "19:48" → "7:48 PM"
 */
export function to12Hour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Adds minutes to a HH:MM time string. Returns HH:MM.
 */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/**
 * Checks if a date (MM-DD) falls within a seasonal rule range.
 * Handles ranges that wrap around year-end (e.g., 11-01 to 02-28).
 */
function isDateInRange(
  dateMMDD: string,
  startMMDD: string,
  endMMDD: string
): boolean {
  if (startMMDD <= endMMDD) {
    return dateMMDD >= startMMDD && dateMMDD <= endMMDD;
  }
  // Wraps around year-end
  return dateMMDD >= startMMDD || dateMMDD <= endMMDD;
}

/**
 * Computes iqamah time given an athan time and iqamah config.
 */
export function computeIqamahTime(
  athanTime: string,
  config: IqamahConfig,
  date: Date
): string | null {
  if (config.mode === "fixed") {
    return config.fixed_time;
  }

  if (config.mode === "offset") {
    if (config.offset_minutes == null) return null;
    return addMinutes(athanTime, config.offset_minutes);
  }

  if (config.mode === "seasonal") {
    if (!config.seasonal_rules?.length) return null;
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const dateMMDD = `${mm}-${dd}`;

    for (const rule of config.seasonal_rules) {
      if (isDateInRange(dateMMDD, rule.start_date, rule.end_date)) {
        if (rule.mode === "fixed") return String(rule.value);
        if (rule.mode === "offset") return addMinutes(athanTime, Number(rule.value));
      }
    }
    return null;
  }

  return null;
}

/**
 * Extracts today's 5 prayer times from AlAdhan monthly JSONB data.
 * The prayerData is the full `data` array from calendarByAddress response.
 */
export function extractTodayTimings(
  prayerData: AlAdhanDayData[],
  date: Date
): Record<PrayerName, string> | null {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const target = `${dd}-${mm}-${yyyy}`;

  const dayData = prayerData.find(
    (d) => d.date.gregorian.date === target
  );

  if (!dayData) return null;

  const result = {} as Record<PrayerName, string>;
  for (const [prayer, key] of Object.entries(ALADHAN_KEY_MAP)) {
    result[prayer as PrayerName] = parseAlAdhanTime(dayData.timings[key]);
  }
  return result;
}
