import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

export type HqMosque = {
  id: string;
  name: string;
  city: string;
  state: string;
  onboardingStatus: string;
};

/**
 * Lists every mosque for the Sahla HQ mosque-picker. HQ-only: gated on the
 * caller having the Sahla HQ org active, mirroring requireCrmAccess's HQ branch.
 */
export async function GET() {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SAHLA_HQ_ORG_ID || session.orgId !== SAHLA_HQ_ORG_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("mosques")
    .select("id, name, city, state, onboarding_status")
    .order("name", { ascending: true });

  if (error) {
    console.error("hq/mosques: lookup failed", error.message);
    return NextResponse.json({ error: "Failed to load mosques" }, { status: 500 });
  }

  const mosques: HqMosque[] = (data ?? []).map((m) => ({
    id: m.id,
    name: m.name ?? "Unnamed mosque",
    city: m.city ?? "",
    state: m.state ?? "",
    onboardingStatus: m.onboarding_status ?? "",
  }));

  return NextResponse.json({ mosques });
}
