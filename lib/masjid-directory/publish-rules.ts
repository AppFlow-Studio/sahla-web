import type { Masjid } from "./types";

/**
 * Single source of truth for what a masjid directory page is allowed to show.
 * The DB agreement (only mosque_admin-confirmed rows get verification_status
 * = 'masjid_confirmed') is not enough on its own — every renderer must call
 * through here rather than re-deriving these checks inline.
 */

// A page can only show the "Verified" label when the masjid itself confirmed
// the times — never for computed (AlAdhan) or unverified rows.
export function canShowVerifiedLabel(
  masjid: Pick<Masjid, "verification_status">
): boolean {
  return masjid.verification_status === "masjid_confirmed";
}

// opted_out is also enforced by RLS (public reads exclude it), but any code
// path that already holds a row (e.g. a service-role admin query) must still
// respect it before rendering.
export function isPubliclyVisible(masjid: Pick<Masjid, "opted_out">): boolean {
  return masjid.opted_out !== true;
}

// "Claim this listing" only makes sense for masjids that aren't already a
// Sahla customer.
export function showClaimListingButton(
  masjid: Pick<Masjid, "is_sahla_customer">
): boolean {
  return !masjid.is_sahla_customer;
}

export type TimesSource = "iqamah_config" | "aladhan";

/**
 * Where a directory page should read prayer times from. Real iqamah times
 * require all three: the masjid is a Sahla customer, its directory row is
 * linked to that mosque, and the mosque opted in to the directory during
 * onboarding. Missing any of those falls back to AlAdhan-computed times.
 */
export function getTimesSource(
  masjid: Pick<Masjid, "is_sahla_customer" | "mosque_id">,
  mosqueDirectoryOptIn: boolean | null | undefined
): TimesSource {
  const showsRealTimes =
    masjid.is_sahla_customer &&
    masjid.mosque_id != null &&
    mosqueDirectoryOptIn === true;
  return showsRealTimes ? "iqamah_config" : "aladhan";
}

export function getDataSourceLabel(source: TimesSource): string {
  return source === "iqamah_config"
    ? "Times entered directly by the masjid"
    : "Times calculated by AlAdhan — not confirmed by the masjid";
}
