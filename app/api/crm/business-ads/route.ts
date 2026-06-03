import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmBusinessAd = {
  id: string;
  businessName: string;
  businessAddress: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactName: string | null;
  placement: string | null;
  durationMonths: number | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
};

type AdRow = {
  submission_id: string;
  business_name: string | null;
  business_address: string | null;
  personal_full_name: string | null;
  personal_email: string | null;
  personal_phone: string | null;
  business_flyer_img: string | null;
  placement: string | null;
  duration_months: number | null;
  status: string | null;
  created_at: string;
};

function rowToAd(row: AdRow): CrmBusinessAd {
  return {
    id: row.submission_id,
    businessName: row.business_name ?? "Untitled ad",
    businessAddress: row.business_address ?? null,
    contactEmail: row.personal_email ?? null,
    contactPhone: row.personal_phone ?? null,
    contactName: row.personal_full_name ?? null,
    placement: row.placement ?? null,
    durationMonths: row.duration_months ?? null,
    imageUrl: row.business_flyer_img ?? null,
    status: row.status ?? "approved",
    createdAt: row.created_at,
  };
}

const SELECT_COLS =
  "submission_id, business_name, business_address, personal_full_name, personal_email, personal_phone, business_flyer_img, placement, duration_months, status, created_at";

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ ads: [] satisfies CrmBusinessAd[] });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("business_ads_submissions")
    .select(SELECT_COLS)
    .eq("mosque_id", access.mosqueId)
    // Hide abandoned checkouts that never completed payment.
    .neq("status", "pending_payment")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ads = ((data as AdRow[] | null) ?? []).map(rowToAd);
  return NextResponse.json({ ads });
}

type CreateBody = {
  businessName?: string;
  businessAddress?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  placement?: string;
  durationMonths?: number;
  imageUrl?: string;
};

export async function POST(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  if (!body?.businessName?.trim()) {
    return NextResponse.json(
      { error: "Business name is required" },
      { status: 400 }
    );
  }
  if (!body.imageUrl?.trim()) {
    return NextResponse.json(
      { error: "Ad image is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("business_ads_submissions")
    .insert({
      mosque_id: access.mosqueId,
      user_id: access.userId,
      business_name: body.businessName.trim(),
      business_address: body.businessAddress?.trim() || null,
      personal_full_name: body.contactName?.trim() || null,
      personal_email: body.contactEmail?.trim() || null,
      personal_phone: body.contactPhone?.trim() || null,
      placement: body.placement?.trim() || null,
      duration_months:
        typeof body.durationMonths === "number" ? body.durationMonths : null,
      business_flyer_img: body.imageUrl.trim(),
      status: "approved",
    })
    .select(SELECT_COLS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mirror into approved_business_ads so the mobile-app reads pick it up.
  void supabase.from("approved_business_ads").insert({
    submission_id: (data as AdRow).submission_id,
    mosque_id: access.mosqueId,
  });

  return NextResponse.json({ ad: rowToAd(data as AdRow) });
}

type PatchBody = CreateBody & {
  id?: string;
  approve?: boolean;
  action?: "decline" | "cancel";
};

export async function PATCH(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  // Decline (reject submitted) / cancel (take down approved) → proxy to the
  // admin-ad-decision edge function, which also stops Stripe billing.
  if (body.action === "decline" || body.action === "cancel") {
    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-ad-decision`;
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      },
      body: JSON.stringify({
        mosque_id: access.mosqueId,
        submission_id: body.id,
        action: body.action,
      }),
    });
    const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !out.ok) {
      return NextResponse.json({ error: out.error ?? "Action failed" }, { status: 500 });
    }
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("business_ads_submissions")
      .select(SELECT_COLS)
      .eq("submission_id", body.id)
      .single();
    return NextResponse.json({ ad: data ? rowToAd(data as AdRow) : null });
  }

  // Approve a (paid) submission → mark approved + mirror into
  // approved_business_ads so the mobile app starts showing it.
  if (body.approve === true) {
    const supabase = createAdminSupabaseClient();
    updates.status = "approved";
    const { data, error } = await supabase
      .from("business_ads_submissions")
      .update(updates)
      .eq("submission_id", body.id)
      .eq("mosque_id", access.mosqueId)
      .select(SELECT_COLS)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: existing } = await supabase
      .from("approved_business_ads")
      .select("id")
      .eq("submission_id", body.id)
      .maybeSingle();
    if (!existing) {
      await supabase
        .from("approved_business_ads")
        .insert({ submission_id: body.id, mosque_id: access.mosqueId });
    }
    return NextResponse.json({ ad: rowToAd(data as AdRow) });
  }
  if (typeof body.businessName === "string")
    updates.business_name = body.businessName.trim();
  if (typeof body.businessAddress === "string")
    updates.business_address = body.businessAddress.trim() || null;
  if (typeof body.contactName === "string")
    updates.personal_full_name = body.contactName.trim() || null;
  if (typeof body.contactEmail === "string")
    updates.personal_email = body.contactEmail.trim() || null;
  if (typeof body.contactPhone === "string")
    updates.personal_phone = body.contactPhone.trim() || null;
  if (typeof body.placement === "string")
    updates.placement = body.placement.trim() || null;
  if (typeof body.durationMonths === "number")
    updates.duration_months = body.durationMonths;
  if (typeof body.imageUrl === "string" && body.imageUrl.trim())
    updates.business_flyer_img = body.imageUrl.trim();

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("business_ads_submissions")
    .update(updates)
    .eq("submission_id", body.id)
    .eq("mosque_id", access.mosqueId)
    .select(SELECT_COLS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ad: rowToAd(data as AdRow) });
}

export async function DELETE(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "id query param required" },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  await supabase
    .from("approved_business_ads")
    .delete()
    .eq("submission_id", id)
    .eq("mosque_id", access.mosqueId);

  const { error } = await supabase
    .from("business_ads_submissions")
    .delete()
    .eq("submission_id", id)
    .eq("mosque_id", access.mosqueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
