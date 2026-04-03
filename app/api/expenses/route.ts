import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, cost, frequency, category } = body;

  if (!name || cost == null || !frequency || !category) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({ name, cost, frequency, category })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
