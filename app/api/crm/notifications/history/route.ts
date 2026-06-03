import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";

export type CrmNotificationHistoryItem = {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  audienceLabel: string;
  recipientCount: number;
  openRate: number;
};

type ActivityRow = {
  id: string;
  entity_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) return NextResponse.json({ history: [] });

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("id, entity_name, metadata, created_at")
    .eq("mosque_id", access.mosqueId)
    .eq("action", "notification_sent")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const history: CrmNotificationHistoryItem[] = (
    (data as ActivityRow[] | null) ?? []
  ).map((row) => {
    const meta = row.metadata ?? {};
    return {
      id: row.id,
      title: row.entity_name ?? "Notification",
      body: (meta.body as string | undefined) ?? "",
      sentAt: row.created_at,
      audienceLabel:
        (meta.audience_label as string | undefined) ?? "Everyone",
      recipientCount: Number(meta.recipient_count ?? 0),
      openRate: Number(meta.open_rate ?? 0),
    };
  });

  return NextResponse.json({ history });
}
