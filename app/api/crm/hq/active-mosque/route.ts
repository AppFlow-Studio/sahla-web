import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { HQ_MOSQUE_COOKIE } from "@/lib/crm/hqMosqueSelection";

const SAHLA_HQ_ORG_ID = process.env.NEXT_PUBLIC_SAHLA_ORG_ID;
const THIRTY_DAYS = 60 * 60 * 24 * 30;

async function requireHq() {
  const session = await auth();
  if (!session.userId) return { ok: false as const, status: 401, error: "Unauthorized" };
  if (!SAHLA_HQ_ORG_ID || session.orgId !== SAHLA_HQ_ORG_ID) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

/** HQ picks which mosque's CRM to view. Body: { mosqueId: string }. */
export async function POST(req: Request) {
  const gate = await requireHq();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let mosqueId: unknown;
  try {
    ({ mosqueId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (typeof mosqueId !== "string" || !mosqueId.trim()) {
    return NextResponse.json({ error: "mosqueId is required" }, { status: 400 });
  }

  // Only allow selecting a mosque that actually exists.
  const supabase = createAdminSupabaseClient();
  const { data: mosque } = await supabase
    .from("mosques")
    .select("id")
    .eq("id", mosqueId.trim())
    .maybeSingle();
  if (!mosque) {
    return NextResponse.json({ error: "Mosque not found" }, { status: 404 });
  }

  const store = await cookies();
  store.set(HQ_MOSQUE_COOKIE, mosque.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  return NextResponse.json({ ok: true, mosqueId: mosque.id });
}

/** HQ returns to the preview (clears the selection). */
export async function DELETE() {
  const gate = await requireHq();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const store = await cookies();
  store.delete(HQ_MOSQUE_COOKIE);
  return NextResponse.json({ ok: true });
}
