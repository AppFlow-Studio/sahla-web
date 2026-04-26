/**
 * Confirmed client only: Clerk org + invite, mosque row (id = org id), onboarding pipeline stage.
 * For internal lead capture without Clerk, use POST /api/pipeline/lead.
 */
import { NextResponse } from "next/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";

type CreateAccountBody = {
  mosqueName?: string;
  city?: string;
  state?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  mosqueId?: string; // Existing lead mosque ID to graduate (skip insert, update instead)
};

type Normalized = {
  mosqueName: string;
  city: string | null;
  state: string | null;
  contactName: string | null;
  contactEmail: string | null;
  phone: string | null;
  notes: string | null;
  mosqueId: string | null;
};

function createSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mosque";
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

function normalize(body: CreateAccountBody): Normalized {
  const mosqueName = (body.mosqueName ?? "").trim();
  const city = (body.city ?? "").trim();
  const state = (body.state ?? "").trim();
  const contactName = (body.contactName ?? "").trim();
  const contactEmail = (body.contactEmail ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const notes = (body.notes ?? "").trim();
  const mosqueId = (body.mosqueId ?? "").trim();

  return {
    mosqueName,
    city: city || null,
    state: state || null,
    contactName: contactName || null,
    contactEmail: contactEmail || null,
    phone: phone || null,
    notes: notes || null,
    mosqueId: mosqueId || null,
  };
}

async function insertNote(
  supabase: Awaited<ReturnType<typeof createClerkSupabaseClient>>,
  mosqueId: string,
  noteText: string
) {
  const attempts = [
    { mosque_id: mosqueId, note: noteText },
    { mosque_id: mosqueId, content: noteText },
    { mosque_id: mosqueId, body: noteText },
    { mosque_id: mosqueId, text: noteText },
  ];

  let lastError: string | null = null;
  for (const payload of attempts) {
    const { error } = await supabase.from("mosque_notes").insert(payload);
    if (!error) return;
    lastError = error.message;
  }

  throw new Error(lastError ?? "Failed to insert mosque note.");
}

async function createClerkOrganization(
  client: Awaited<ReturnType<typeof clerkClient>>,
  name: string,
  slug: string,
  createdBy: string
) {
  const attempts: Array<{ name: string; slug?: string; createdBy?: string }> = [
    { name, slug, createdBy },
    { name, createdBy },
    { name, slug },
    { name },
  ];
  let lastError: unknown;
  for (const params of attempts) {
    try {
      return await client.organizations.createOrganization(params);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

function formatApiError(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const parts =
      error.errors?.map((e) => e.longMessage ?? e.message).filter(Boolean) ??
      [];
    if (parts.length) return parts.join(" ");
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unexpected server error.";
}

export async function POST(req: Request) {
  try {
    let parsed: CreateAccountBody;
    try {
      parsed = (await req.json()) as CreateAccountBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const lead = normalize(parsed);

    if (!lead.mosqueName) {
      return NextResponse.json(
        { error: "Mosque name is required." },
        { status: 400 }
      );
    }
    if (!lead.contactName) {
      return NextResponse.json(
        { error: "Contact name is required" },
        { status: 400 }
      );
    }
    if (!lead.contactEmail) {
      return NextResponse.json(
        { error: "Contact email is required" },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    const actorClerkUserId =
      process.env.CLERK_CREATE_ORG_USER_ID?.trim() ||
      process.env.CLERK_SYSTEM_USER_ID?.trim() ||
      userId ||
      null;
    if (!actorClerkUserId) {
      return NextResponse.json(
        {
          error:
            "Sign in to create an account, or set CLERK_SYSTEM_USER_ID in .env.local.",
        },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();
    const mosqueSlug = createSlug(lead.mosqueName);
    const client = await clerkClient();

    const org = await createClerkOrganization(
      client,
      lead.mosqueName,
      mosqueSlug,
      actorClerkUserId
    );

    await client.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: lead.contactEmail,
      role: "org:admin",
      inviterUserId: actorClerkUserId,
    });

    const updatedAt = new Date().toISOString();
    let mosqueRow: { id: string; name: string | null } | null = null;

    if (lead.mosqueId) {
      // ── Graduating an existing lead ──
      // Update the existing mosque row with the Clerk org link instead of
      // creating a duplicate row.
      const { data: existing, error: lookupError } = await supabase
        .from("mosques")
        .select("id, clerk_org_id")
        .eq("id", lead.mosqueId)
        .single();

      if (lookupError || !existing) {
        return NextResponse.json(
          { error: "Mosque not found." },
          { status: 404 }
        );
      }
      if (existing.clerk_org_id) {
        return NextResponse.json(
          { error: "Mosque already has a Clerk organization." },
          { status: 409 }
        );
      }

      const { data: updated, error: updateError } = await supabase
        .from("mosques")
        .update({
          clerk_org_id: org.id,
          onboarding_status: "in_progress",
        })
        .eq("id", lead.mosqueId)
        .select("id, name")
        .single();

      if (updateError || !updated) {
        return NextResponse.json(
          { error: updateError?.message ?? "Failed to update mosque." },
          { status: 500 }
        );
      }
      mosqueRow = updated;

      // Update existing pipeline stage
      const { error: stageError } = await supabase
        .from("pipeline_stages")
        .update({
          stage: "onboarding",
          contact_name: lead.contactName,
          contact_email: lead.contactEmail,
          updated_at: updatedAt,
        })
        .eq("mosque_id", lead.mosqueId);

      if (stageError) {
        return NextResponse.json(
          {
            error: `Mosque updated, but failed to update pipeline stage: ${stageError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      // ── Fresh create ──
      const mosqueId = org.id;

      const { data: inserted, error: mosqueError } = await supabase
        .from("mosques")
        .insert({
          id: mosqueId,
          slug: mosqueSlug,
          name: lead.mosqueName,
          city: lead.city,
          state: lead.state,
          onboarding_status: "in_progress",
          clerk_org_id: org.id,
        })
        .select("id, name")
        .single();

      if (mosqueError || !inserted) {
        return NextResponse.json(
          { error: mosqueError?.message ?? "Failed to create mosque." },
          { status: 500 }
        );
      }
      mosqueRow = inserted;

      const { error: stageError } = await supabase
        .from("pipeline_stages")
        .insert({
          mosque_id: mosqueRow.id,
          stage: "onboarding",
          contact_name: lead.contactName,
          contact_email: lead.contactEmail,
          updated_at: updatedAt,
        });

      if (stageError) {
        return NextResponse.json(
          {
            error: `Mosque created, but failed to create pipeline stage: ${stageError.message}`,
          },
          { status: 500 }
        );
      }

      const { error: notifError } = await supabase
        .from("mosque_notification_config")
        .insert({
          mosque_id: mosqueRow.id,
          prayer_notif_enabled: false,
          program_notif_enabled: false,
          event_notif_enabled: false,
          default_reminder_min: 30,
        });

      if (notifError) {
        return NextResponse.json(
          {
            error: `Mosque and pipeline created, but failed to create notification config: ${notifError.message}`,
          },
          { status: 500 }
        );
      }
    }

    if (lead.notes || lead.phone) {
      const lines: string[] = [];
      if (lead.phone) lines.push(`Phone: ${lead.phone}`);
      if (lead.notes) lines.push(lead.notes);
      const noteText = lines.join("\n");

      try {
        await insertNote(supabase, String(mosqueRow.id), noteText);
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? `Account created, but failed to save note: ${error.message}`
                : "Account created, but failed to save note.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        ok: true,
        mosqueName: mosqueRow.name ?? lead.mosqueName,
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        orgId: org.id,
        portalUrl: "crm.sahla.app",
        inviteStatus: "Invite sent via Clerk",
        updatedAt,
      },
      { status: 200 }
    );
  } catch (error) {
    const status = isClerkAPIResponseError(error) ? error.status : 500;
    const message = formatApiError(error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
