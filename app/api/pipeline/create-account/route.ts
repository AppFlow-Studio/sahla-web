/**
 * Confirmed client only: Clerk org + invite, mosque row (id = org id), onboarding pipeline stage.
 * For internal lead capture without Clerk, use POST /api/pipeline/lead.
 */
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
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
  supabase: ReturnType<typeof createAdminSupabaseClient>,
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

    const supabase = createAdminSupabaseClient();
    const mosqueSlug = createSlug(lead.mosqueName);
    const client = await clerkClient();

    // ── Pre-flight: detect conflict BEFORE creating Clerk side effects ──
    // The mosqueId may refer to a mosques row OR a pipeline-only lead (no mosque yet).
    let existingMosque: { id: string; clerk_org_id: string | null } | null = null;
    let pipelineOnlyLeadId: string | null = null;

    if (lead.mosqueId) {
      const { data: mosqueHit } = await supabase
        .from("mosques")
        .select("id, clerk_org_id")
        .eq("id", lead.mosqueId)
        .maybeSingle();

      if (mosqueHit) {
        if (mosqueHit.clerk_org_id) {
          return NextResponse.json(
            { error: "Mosque already has a Clerk organization." },
            { status: 409 }
          );
        }
        existingMosque = mosqueHit;
      } else {
        // Check if it's a pipeline-only lead (no mosque row yet)
        const { data: pipelineHit } = await supabase
          .from("pipeline_stages")
          .select("id")
          .or(`id.eq.${lead.mosqueId},mosque_id.eq.${lead.mosqueId}`)
          .limit(1)
          .maybeSingle();

        if (!pipelineHit) {
          return NextResponse.json(
            { error: "Lead not found." },
            { status: 404 }
          );
        }
        pipelineOnlyLeadId = pipelineHit.id;
      }
    }

    const org = await createClerkOrganization(
      client,
      lead.mosqueName,
      mosqueSlug,
      actorClerkUserId
    );

    // Where the invited admin lands after accepting the invitation.
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin;
    const redirectUrl = `${baseUrl}/onboarding`;

    await client.organizations.createOrganizationInvitation({
      organizationId: org.id,
      emailAddress: lead.contactEmail,
      role: "org:admin",
      inviterUserId: actorClerkUserId,
      redirectUrl,
    });

    // Clerk requires a `createdBy` on org creation, which auto-adds the actor
    // as a member. Remove them so the mosque's org is empty until the invited
    // admin accepts. Log and continue on failure — the invitation still goes out.
    try {
      await client.organizations.deleteOrganizationMembership({
        organizationId: org.id,
        userId: actorClerkUserId,
      });
    } catch (membershipError) {
      console.warn(
        `Failed to remove Sahla actor from new mosque org ${org.id}:`,
        membershipError instanceof Error ? membershipError.message : membershipError
      );
    }

    const updatedAt = new Date().toISOString();
    let mosqueRow: { id: string; name: string | null } | null = null;

    if (existingMosque) {
      // ── Graduating an existing lead that already has a mosque row ──
      const { data: updated, error: updateError } = await supabase
        .from("mosques")
        .update({
          clerk_org_id: org.id,
          onboarding_status: "in_progress",
        })
        .eq("id", existingMosque.id)
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
          mosque_id: existingMosque.id,
          contact_name: lead.contactName,
          contact_email: lead.contactEmail,
          updated_at: updatedAt,
        })
        .eq("mosque_id", existingMosque.id);

      if (stageError) {
        return NextResponse.json(
          {
            error: `Mosque updated, but failed to update pipeline stage: ${stageError.message}`,
          },
          { status: 500 }
        );
      }
    } else if (pipelineOnlyLeadId) {
      // ── Graduating a pipeline-only lead (no mosque row yet) ──
      // Create the mosque row now and link the pipeline stage to it.
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

      // Link the pipeline stage to the new mosque
      const { error: stageError } = await supabase
        .from("pipeline_stages")
        .update({
          mosque_id: mosqueId,
          stage: "onboarding",
          contact_name: lead.contactName,
          contact_email: lead.contactEmail,
          updated_at: updatedAt,
        })
        .eq("id", pipelineOnlyLeadId);

      if (stageError) {
        return NextResponse.json(
          {
            error: `Mosque created, but failed to update pipeline stage: ${stageError.message}`,
          },
          { status: 500 }
        );
      }

      const { error: notifError } = await supabase
        .from("mosque_notification_config")
        .insert({
          mosque_id: mosqueId,
          prayer_notif_enabled: false,
          program_notif_enabled: false,
          event_notif_enabled: false,
          default_reminder_min: 30,
        });

      if (notifError) {
        console.error("Failed to create notification config:", notifError.message);
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
        portalUrl: "crm.sahla.co",
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
