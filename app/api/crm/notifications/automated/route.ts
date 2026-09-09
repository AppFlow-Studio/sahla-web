import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireCrmAccess } from "@/lib/supabase/requireCrmAccess";
import {
  definitionFor,
  NOTIFICATION_CATALOGUE,
  render,
  type NotificationDefinition,
} from "@/supabase/functions/_shared/automated-notifications";

/**
 * The notifications the app sends on its own, and this masjid's wording for
 * them. The catalogue is code (shared with the senders, so the editor can't
 * offer a field nothing reads); the overrides are rows.
 *
 * A masjid with no row for a key is on the default — the response says so with
 * `customized`, and the fields come back pre-filled with the default so the
 * editor always has something to show.
 */

export type AutomatedNotification = {
  key: string;
  group: NotificationDefinition["group"];
  label: string;
  description: string;
  variables: NotificationDefinition["variables"];
  title: string;
  body: string;
  enabled: boolean;
  /** False when this masjid is still on Sahla's default wording. */
  customized: boolean;
  /** Rendered with the example values, so the editor can show what sends. */
  preview: { title: string; body: string };
};

type OverrideRow = {
  notification_key: string;
  title: string | null;
  body: string | null;
  enabled: boolean;
};

function exampleValues(def: NotificationDefinition): Record<string, string> {
  return Object.fromEntries(def.variables.map((v) => [v.name, v.example]));
}

function merge(
  def: NotificationDefinition,
  row: OverrideRow | undefined,
): AutomatedNotification {
  const title = row?.title ?? def.defaultTitle;
  const body = row?.body ?? def.defaultBody;
  const values = exampleValues(def);
  return {
    key: def.key,
    group: def.group,
    label: def.label,
    description: def.description,
    variables: def.variables,
    title,
    body,
    enabled: row?.enabled ?? true,
    customized: Boolean(row && (row.title !== null || row.body !== null)),
    preview: { title: render(title, values), body: render(body, values) },
  };
}

export async function GET() {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;

  // HQ preview has no mosque of its own — show the catalogue on defaults.
  if (access.isHQ) {
    return NextResponse.json({
      notifications: NOTIFICATION_CATALOGUE.map((def) => merge(def, undefined)),
    });
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("automated_notification_templates")
    .select("notification_key, title, body, enabled")
    .eq("mosque_id", access.mosqueId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byKey = new Map<string, OverrideRow>(
    ((data as OverrideRow[] | null) ?? []).map((r) => [r.notification_key, r]),
  );
  return NextResponse.json({
    notifications: NOTIFICATION_CATALOGUE.map((def) => merge(def, byKey.get(def.key))),
  });
}

export async function PUT(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({ error: "HQ preview can't write." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { key?: string; title?: string; body?: string; enabled?: boolean }
    | null;

  const def = payload?.key ? definitionFor(payload.key) : undefined;
  if (!def) {
    return NextResponse.json(
      { error: "Unknown notification key" },
      { status: 400 },
    );
  }

  const title = payload?.title?.trim() ?? "";
  const body = payload?.body?.trim() ?? "";
  if (!title || !body) {
    return NextResponse.json(
      { error: "Title and message can't be empty" },
      { status: 400 },
    );
  }

  // A variable that doesn't exist for this notification would ship as literal
  // "{{whatever}}" in someone's push, so it's rejected here rather than at
  // send time — the sender has no way to tell an admin about it.
  const known = new Set(def.variables.map((v) => v.name));
  const unknown = [...`${title} ${body}`.matchAll(/\{\{\s*(\w+)\s*\}\}/g)]
    .map((m) => m[1])
    .filter((name) => !known.has(name));
  if (unknown.length > 0) {
    return NextResponse.json(
      {
        error: `Unknown variable${unknown.length > 1 ? "s" : ""}: ${[...new Set(unknown)]
          .map((u) => `{{${u}}}`)
          .join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Storing null for text that matches the default keeps the masjid on the
  // default rather than freezing today's copy — if we improve the wording
  // later, they get it.
  const session = await auth();
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("automated_notification_templates")
    .upsert(
      {
        mosque_id: access.mosqueId,
        notification_key: def.key,
        title: title === def.defaultTitle ? null : title,
        body: body === def.defaultBody ? null : body,
        enabled: payload?.enabled ?? true,
        updated_by: session?.userId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mosque_id,notification_key" },
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

/** Reset one notification to Sahla's default wording. */
export async function DELETE(request: Request) {
  const access = await requireCrmAccess();
  if (!access.ok) return access.response;
  if (access.isHQ) {
    return NextResponse.json({ error: "HQ preview can't write." }, { status: 403 });
  }

  const key = new URL(request.url).searchParams.get("key");
  if (!key || !definitionFor(key)) {
    return NextResponse.json({ error: "Unknown notification key" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("automated_notification_templates")
    .delete()
    .eq("mosque_id", access.mosqueId)
    .eq("notification_key", key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
