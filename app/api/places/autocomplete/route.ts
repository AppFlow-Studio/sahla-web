import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Server-side proxy for Google Places Autocomplete (New). The API key stays
// on the server — never shipped to the browser — and we only forward the
// minimal prediction fields the client combobox needs.
//
// A `sessionToken` (generated client-side per address-editing session) is
// passed through here and on to the details endpoint so Google bills the
// pair as one autocomplete session rather than per keystroke.

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

  const { input, sessionToken } = (await request.json()) as {
    input?: string;
    sessionToken?: string;
  };

  if (!input || input.trim().length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["us"],
      ...(sessionToken ? { sessionToken } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Places autocomplete failed", res.status, detail);
    return NextResponse.json(
      { error: "Address lookup failed" },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId: string;
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
        text?: { text?: string };
      };
    }>;
  };

  const suggestions = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
    .map((p) => ({
      placeId: p.placeId,
      primaryText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));

  return NextResponse.json({ suggestions });
}
