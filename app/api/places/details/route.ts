import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Server-side proxy for Google Place Details (New). Resolves a placeId from
// the autocomplete step into the structured address fields the mosque
// profile form needs. Coordinates are returned too (the mosque table has no
// lat/lng column yet, so the client ignores them — but they're here when we
// want to wire prayer-time accuracy to real coordinates).

type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

/** First component whose `types` include the given type. */
function pick(components: AddressComponent[], type: string): AddressComponent | undefined {
  return components.find((c) => c.types?.includes(type));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const { placeId, sessionToken } = (await request.json()) as {
    placeId?: string;
    sessionToken?: string;
  };

  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const url = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`
  );
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "formattedAddress,addressComponents,location",
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Place details failed", res.status, detail);
    return NextResponse.json({ error: "Address lookup failed" }, { status: 502 });
  }

  const data = (await res.json()) as {
    formattedAddress?: string;
    addressComponents?: AddressComponent[];
    location?: { latitude?: number; longitude?: number };
  };

  const components = data.addressComponents ?? [];
  const streetNumber = pick(components, "street_number")?.longText ?? "";
  const route = pick(components, "route")?.longText ?? "";
  // NYC-style addresses put the borough in sublocality and "New York" in
  // locality — prefer the locality, then fall back through the common
  // city-ish component types.
  const city =
    pick(components, "locality")?.longText ??
    pick(components, "postal_town")?.longText ??
    pick(components, "sublocality_level_1")?.longText ??
    pick(components, "sublocality")?.longText ??
    "";
  const state = pick(components, "administrative_area_level_1")?.shortText ?? "";
  const country = pick(components, "country")?.shortText ?? "";
  const postalCode = pick(components, "postal_code")?.longText ?? "";

  return NextResponse.json({
    address: [streetNumber, route].filter(Boolean).join(" "),
    city,
    state,
    country,
    postalCode,
    formattedAddress: data.formattedAddress ?? "",
    lat: data.location?.latitude ?? null,
    lng: data.location?.longitude ?? null,
  });
}
