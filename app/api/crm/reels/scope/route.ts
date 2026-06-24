import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

type ReelsScope = "own" | "global";

const VALID_SCOPES: ReelsScope[] = ["own", "global"];

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ scope: "own" as ReelsScope });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("mosques")
    .select("reels_scope")
    .eq("id", access.mosqueId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    scope: ((data?.reels_scope as ReelsScope | undefined) ?? "own"),
  });
}

export async function PATCH(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json(
      { error: "HQ preview can't write — sign in as a mosque admin." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { scope?: string }
    | null;
  if (!body?.scope || !VALID_SCOPES.includes(body.scope as ReelsScope)) {
    return NextResponse.json(
      { error: `scope must be one of: ${VALID_SCOPES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("mosques")
    .update({ reels_scope: body.scope })
    .eq("id", access.mosqueId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scope: body.scope });
}
