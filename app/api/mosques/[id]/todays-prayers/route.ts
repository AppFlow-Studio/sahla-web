import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { localDay } from "@/lib/prayer/timezone";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mosqueId } = await params;
  const supabase = createAdminSupabaseClient();

  // The sync cron keeps a rolling 30-day window in this table, so the rows have
  // to be narrowed to the mosque's current calendar day — an unfiltered read
  // returns whichever date Postgres happens to hand back first.
  const { data: mosque } = await supabase
    .from("mosques")
    .select("timezone")
    .eq("id", mosqueId)
    .single();

  const { data, error } = await supabase
    .from("todays_prayers")
    .select("*")
    .eq("mosque_id", mosqueId)
    .eq("date", localDay(mosque?.timezone).iso)
    .order("prayer_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
