/**
 * Translation between the CRM UI's string IDs and the AlAdhan numeric
 * codes stored in `mosques.calculation_method`. Keep this list in sync
 * with the CALCULATION_METHODS array in PrayerTimesClient.tsx — the IDs
 * are the join key.
 *
 * Codes per https://aladhan.com/calculation-methods
 */
export const CALC_METHOD_TO_NUMBER: Record<string, number> = {
  MWL: 3,
  ISNA: 2,
  EGYPT: 5,
  KARACHI: 1,
  UMM_AL_QURA: 4,
  GULF: 8,
  TEHRAN: 7,
  SINGAPORE: 11,
};

export const NUMBER_TO_CALC_METHOD: Record<number, string> = Object.fromEntries(
  Object.entries(CALC_METHOD_TO_NUMBER).map(([k, v]) => [v, k])
);

export function calcMethodToNumber(id: string): number {
  return CALC_METHOD_TO_NUMBER[id] ?? 2; // Default ISNA
}

export function calcMethodFromNumber(n: number | null | undefined): string {
  if (n == null) return "ISNA";
  return NUMBER_TO_CALC_METHOD[n] ?? "ISNA";
}

/** Shafi = 0, Hanafi = 1 per AlAdhan. */
export function schoolToNumber(id: string): number {
  return id === "hanafi" ? 1 : 0;
}

export function schoolFromNumber(n: number | null | undefined): string {
  return n === 1 ? "hanafi" : "shafi";
}
