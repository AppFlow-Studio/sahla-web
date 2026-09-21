/**
 * Address → coordinates, via Google's Geocoding API.
 *
 * We already pay for Google on the autocomplete step, and AlAdhan's own
 * geocoder is unreliable — it answers 503 ("Geocoding is temporarily
 * unavailable") for anything outside its cache, which is most real street
 * addresses. Resolving coordinates ourselves and calling AlAdhan's lat/lng
 * endpoints takes their geocoder out of the critical path entirely.
 *
 * Note this is the Geocoding API, which is enabled separately from the Places
 * API used by app/api/places/details — a key can work for one and not the
 * other.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodeResult = Coordinates & {
  /** Google's canonical one-line address, worth storing over the admin's typing. */
  formattedAddress: string;
};

/** Raised when the key or project is misconfigured, as opposed to the address
 * simply not matching anything. Callers should surface this rather than fall
 * back to a default location — a silent fallback is how a mosque ends up
 * showing another city's prayer times. */
export class GeocodingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeocodingConfigError";
  }
}

type AddressParts = {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

/**
 * Builds one geocodable line out of the parts we store in separate columns.
 *
 * `mosques.address` is frequently just a street line ("200 Vesey Street"),
 * which no geocoder can place, while city/state sit in their own columns. Parts
 * already present in the street line are not repeated, so a full formatted
 * address passes through unchanged.
 */
export function composeAddress(parts: AddressParts): string | null {
  const street = parts.address?.trim() || "";
  const segments: string[] = street ? [street] : [];

  for (const part of [parts.city, parts.state, parts.postalCode, parts.country]) {
    const value = part?.trim();
    if (!value) continue;
    // Case-insensitive containment check so "…, Sterling, VA" doesn't become
    // "…, Sterling, VA, Sterling, VA".
    const alreadyPresent = segments.some(
      (s) => s.toLowerCase().includes(value.toLowerCase())
    );
    if (!alreadyPresent) segments.push(value);
  }

  const composed = segments.join(", ").trim();
  return composed || null;
}

/**
 * Resolves an address to coordinates. Returns null when Google has no match
 * (a typo, or a mosque with only a vague location on file); throws
 * {@link GeocodingConfigError} when the key itself is the problem.
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new GeocodingConfigError("GOOGLE_MAPS_API_KEY is not configured");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Google Geocoding returned HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    status?: string;
    error_message?: string;
    results?: {
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }[];
  };

  if (json.status === "ZERO_RESULTS") return null;

  // REQUEST_DENIED covers a disabled API, a restricted key, and — the one that
  // bit us — billing switched off on the Cloud project.
  if (json.status === "REQUEST_DENIED" || json.status === "OVER_QUERY_LIMIT") {
    throw new GeocodingConfigError(
      `Google Geocoding ${json.status}: ${json.error_message ?? "no detail"}`
    );
  }

  if (json.status !== "OK" || !json.results?.length) {
    throw new Error(
      `Google Geocoding ${json.status ?? "unknown"}: ${json.error_message ?? "no detail"}`
    );
  }

  const top = json.results[0];
  const lat = top.geometry?.location?.lat;
  const lng = top.geometry?.location?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return {
    latitude: lat,
    longitude: lng,
    formattedAddress: top.formatted_address ?? address,
  };
}
