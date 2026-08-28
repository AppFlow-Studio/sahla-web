/**
 * Prayer times are calendar-day data. AlAdhan returns each day's timings in the
 * mosque's own local time, so "today" has to be resolved in the mosque's
 * timezone — never from the server clock, which is UTC on Vercel and in edge
 * functions. Using the server clock rolls US mosques a day forward every
 * evening (serving tomorrow's times), and on the last night of a month it asks
 * AlAdhan for the wrong month entirely.
 */

export const DEFAULT_TIMEZONE = "America/New_York";

export type LocalDay = {
  /** 'YYYY-MM-DD' — matches the `date` column on `todays_prayers`. */
  iso: string;
  /** 'DD-MM-YYYY' — matches AlAdhan's `date.gregorian.date` and its path params. */
  aladhan: string;
  year: number;
  /** 1-12. */
  month: number;
  day: number;
};

/** True when the runtime recognises `tz` as an IANA zone name. */
export function isValidTimeZone(tz: string | null | undefined): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function partsIn(timezone: string, now: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const out: Record<string, string> = {};
  for (const p of parts) out[p.type] = p.value;
  return out;
}

/**
 * The calendar day it is *right now* in the given IANA timezone. A missing or
 * unrecognised zone falls back to {@link DEFAULT_TIMEZONE} rather than throwing —
 * a mosque with bad config should still get times, just Eastern-aligned ones.
 */
export function localDay(
  timezone: string | null | undefined,
  now: Date = new Date()
): LocalDay {
  let p: Record<string, string>;
  try {
    p = partsIn(timezone || DEFAULT_TIMEZONE, now);
  } catch {
    p = partsIn(DEFAULT_TIMEZONE, now);
  }
  const { year, month, day } = p;
  return {
    iso: `${year}-${month}-${day}`,
    aladhan: `${day}-${month}-${year}`,
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
}

/**
 * A Date whose *server-local* Y/M/D match the mosque's current calendar day, so
 * `getMonth()`/`getDate()` callers (seasonal iqamah rules) read the mosque's day
 * instead of the server's. Anchored at noon so DST shifts can't slide it.
 */
export function localCalendarDate(
  timezone: string | null | undefined,
  now: Date = new Date()
): Date {
  return new Date(`${localDay(timezone, now).iso}T12:00:00`);
}
