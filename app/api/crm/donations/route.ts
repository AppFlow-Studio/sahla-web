import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

type DonationRow = {
  id: number;
  mosque_id: string;
  amountGiven: number | null;
  date: string | null;
  user_id: string | null;
  status: string | null;
  project_donated_to: string[] | null;
  project_id: string | null;
  stripe_payment_intent_id: string | null;
};

export type CrmDonation = {
  id: string;
  donorHash: string;
  amountUsd: number;
  occurredAt: string;
  status: "succeeded" | "refunded" | "pending";
  fundLabel: string;
  method: "card" | "apple_pay" | "google_pay" | "ach";
};

/**
 * Stable, anonymized display label for a donor. We hash the Clerk user_id
 * (or fall back to the payment intent if no user is on file) into a short
 * "DXXX" reference so the dashboard never shows real names.
 */
function donorHashFor(userId: string | null, fallback: string): string {
  const seed = userId || fallback;
  if (!seed) return "Anonymous";
  // Quick deterministic 3-char base36 hash. Not crypto — just a stable label.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `D${Math.abs(h).toString(36).slice(0, 4).toUpperCase()}`;
}

function normalizeStatus(s: string | null): CrmDonation["status"] {
  const v = (s ?? "").toLowerCase();
  if (v === "succeeded" || v === "paid" || v === "complete") return "succeeded";
  if (v === "refunded") return "refunded";
  return "pending";
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  // HQ preview users don't have a mosque scope — return empty so the UI
  // shows its empty state instead of mixing data across mosques.
  if (access.isHQ) {
    return NextResponse.json({ donations: [] satisfies CrmDonation[] });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      'id, mosque_id, "amountGiven", date, user_id, status, project_donated_to, project_id, stripe_payment_intent_id'
    )
    .eq("mosque_id", access.mosqueId)
    .order("date", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const donations: CrmDonation[] = (data as DonationRow[] | null ?? []).map((d) => ({
    id: String(d.id),
    donorHash: donorHashFor(d.user_id, d.stripe_payment_intent_id ?? `id_${d.id}`),
    amountUsd: Math.round((d.amountGiven ?? 0) * 100) / 100,
    occurredAt: d.date ?? new Date().toISOString(),
    status: normalizeStatus(d.status),
    fundLabel: d.project_donated_to?.[0] ?? "General Fund",
    method: "card",
  }));

  return NextResponse.json({ donations });
}
