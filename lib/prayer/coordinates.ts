import type { SupabaseClient } from "@supabase/supabase-js";
import {
  composeAddress,
  geocodeAddress,
  GeocodingConfigError,
  type Coordinates,
} from "@/lib/geocode";

/**
 * Resolving a mosque's coordinates, with the result cached on the row.
 *
 * Prayer times are computed from a point on the earth, not from a string. We
 * geocode once — at address-selection time where possible, lazily here
 * otherwise — and every AlAdhan call afterwards uses lat/lng, which needs no
 * geocoder at all.
 */

export type MosqueLocationRow = {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** The columns {@link resolveMosqueCoordinates} needs; keep route selects in sync. */
export const MOSQUE_LOCATION_COLUMNS =
  "id, address, city, state, latitude, longitude";

export type ResolveOutcome =
  | { status: "ok"; coordinates: Coordinates; cached: boolean }
  /** Nothing on the row to geocode — no address and no city. */
  | { status: "no_location" }
  /** Google had no match for the address we hold. */
  | { status: "not_found"; attempted: string }
  /** Geocoding is misconfigured (bad key, disabled API, billing off). */
  | { status: "unavailable"; reason: string };

/**
 * Returns the mosque's coordinates, geocoding and persisting them on first use.
 *
 * Deliberately never falls back to a default location: a wrong-but-plausible
 * coordinate silently serves another city's prayer times, which is worse than
 * an error the caller can report.
 */
export async function resolveMosqueCoordinates(
  supabase: SupabaseClient,
  mosque: MosqueLocationRow
): Promise<ResolveOutcome> {
  if (mosque.latitude != null && mosque.longitude != null) {
    return {
      status: "ok",
      cached: true,
      coordinates: { latitude: mosque.latitude, longitude: mosque.longitude },
    };
  }

  // Street line alone is usually not geocodable, so rebuild the full address
  // from the columns that hold the rest of it.
  const attempted = composeAddress({
    address: mosque.address,
    city: mosque.city,
    state: mosque.state,
  });
  if (!attempted) return { status: "no_location" };

  let result;
  try {
    result = await geocodeAddress(attempted);
  } catch (err) {
    if (err instanceof GeocodingConfigError) {
      return { status: "unavailable", reason: err.message };
    }
    throw err;
  }

  if (!result) return { status: "not_found", attempted };

  // Cache for every later request. A failure to write is not fatal — we still
  // have what this request needs — but it does mean we geocode again next time.
  const { error } = await supabase
    .from("mosques")
    .update({
      latitude: result.latitude,
      longitude: result.longitude,
      geocoded_at: new Date().toISOString(),
      geocode_source: "google_geocoding",
    })
    .eq("id", mosque.id);
  if (error) {
    console.error(
      `Failed to cache coordinates for mosque ${mosque.id}:`,
      error.message
    );
  }

  return {
    status: "ok",
    cached: false,
    coordinates: { latitude: result.latitude, longitude: result.longitude },
  };
}

/** Maps a non-ok outcome onto the response a route should return. */
export function coordinateErrorResponse(outcome: ResolveOutcome): {
  error: string;
  status: number;
} {
  switch (outcome.status) {
    case "no_location":
      return {
        error: "This mosque has no address on file, so prayer times can't be calculated.",
        status: 400,
      };
    case "not_found":
      return {
        error: `We couldn't find "${outcome.attempted}" on the map. Check the address.`,
        status: 400,
      };
    case "unavailable":
      return {
        error: `Address lookup is unavailable: ${outcome.reason}`,
        status: 503,
      };
    default:
      return { error: "Unknown geocoding failure", status: 500 };
  }
}
