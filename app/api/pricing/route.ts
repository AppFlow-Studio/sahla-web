import { NextResponse } from "next/server";
import { getPlanPricing } from "@/lib/pricing";

// Public endpoint that client components read to display live plan prices.
// getPlanPricing is itself cached (5 min); the Cache-Control header lets the
// CDN/browser reuse the response too.
export async function GET() {
  const pricing = await getPlanPricing();
  return NextResponse.json(pricing, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
