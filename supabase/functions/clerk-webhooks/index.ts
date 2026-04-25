// supabase/functions/clerk-webhooks/index.ts
// ============================================================================
// Clerk Webhook Handler — Supabase Edge Function
// ============================================================================
//
// Receives webhook events from Clerk and syncs data to Supabase.
//
// Events handled:
//   user.created              → Insert profiles row
//   user.updated              → Update profiles row
//   user.deleted              → Delete profiles + cascade cleanup
//   organizationMembership.created  → Log to activity_log, init user preferences
//   organizationMembership.updated  → Log role change to activity_log
//   organizationMembership.deleted  → Log removal, cleanup mosque-scoped user data
//   session.created           → Log admin login (for health score admin_activity)
//
// Setup:
//   1. Set CLERK_WEBHOOK_SIGNING_SECRET in Supabase Dashboard → Edge Functions → Secrets
//   2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (auto-set by Supabase)
//   3. In Clerk Dashboard → Webhooks → Add Endpoint:
//      URL: https://<project-ref>.supabase.co/functions/v1/clerk-webhooks
//      Events: user.created, user.updated, user.deleted,
//              organizationMembership.created, organizationMembership.updated,
//              organizationMembership.deleted, session.created
//
// ============================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/svix@1.21.0";
// ── Supabase client (service role — bypasses RLS) ──
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Clerk webhook secret for Svix verification ──
const webhookSecret = Deno.env.get("CLERK_WEBHOOK_SIGNING_SECRET")!;

// ── Sahla HQ org ID (cached on cold start) ──
// Used to distinguish Sahla team org events from mosque org events.
// Membership events for the Sahla HQ org should NOT create mosque user data.
let _sahlaOrgId: string | null = null;

async function getSahlaOrgId(): Promise<string | null> {
  if (_sahlaOrgId) return _sahlaOrgId;
  const { data } = await supabase
    .from("sahla_config")
    .select("org_id")
    .eq("id", "singleton")
    .single();
  _sahlaOrgId = data?.org_id ?? null;
  return _sahlaOrgId;
}

/** Check if an org ID is the Sahla HQ org (not a mosque) */
async function isSahlaOrg(orgId: string): Promise<boolean> {
  const sahlaOrgId = await getSahlaOrgId();
  return sahlaOrgId !== null && orgId === sahlaOrgId;
}


// ============================================================================
// TYPES
// ============================================================================

interface ClerkUser {
  id: string;                         // e.g. "user_2abc123"
  first_name: string | null;
  last_name: string | null;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id: string | null;
  phone_numbers: Array<{
    id: string;
    phone_number: string;
  }>;
  primary_phone_number_id: string | null;
  image_url: string | null;
  created_at: number;                 // Unix timestamp ms
  updated_at: number;
}

interface ClerkOrganizationMembership {
  id: string;
  organization: {
    id: string;                       // Clerk org ID = our mosque_id
    name: string;
    slug: string;
  };
  public_user_data: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    identifier: string;               // email
    image_url: string | null;
  };
  role: string;                       // e.g. "org:admin", "org:member"
  created_at: number;
  updated_at: number;
}

interface ClerkSession {
  id: string;
  user_id: string;
  last_active_organization_id: string | null;
  created_at: number;
}

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
  object: string;
}


// ============================================================================
// HELPERS
// ============================================================================

/** Extract primary email from Clerk user object */
function getPrimaryEmail(user: ClerkUser): string | null {
  if (!user.primary_email_address_id || !user.email_addresses?.length) {
    return user.email_addresses?.[0]?.email_address ?? null;
  }
  const primary = user.email_addresses.find(
    (e) => e.id === user.primary_email_address_id
  );
  return primary?.email_address ?? user.email_addresses[0]?.email_address ?? null;
}

/** Extract primary phone from Clerk user object */
function getPrimaryPhone(user: ClerkUser): string | null {
  if (!user.primary_phone_number_id || !user.phone_numbers?.length) {
    return user.phone_numbers?.[0]?.phone_number ?? null;
  }
  const primary = user.phone_numbers.find(
    (p) => p.id === user.primary_phone_number_id
  );
  return primary?.phone_number ?? user.phone_numbers[0]?.phone_number ?? null;
}

/** Log an event to the activity_log table */
async function logActivity(params: {
  mosque_id?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("activity_log").insert({
    mosque_id: params.mosque_id ?? null,
    actor_id: params.actor_id ?? null,
    actor_name: params.actor_name ?? null,
    action: params.action,
    entity_type: params.entity_type ?? null,
    entity_id: params.entity_id ?? null,
    entity_name: params.entity_name ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error(`Failed to log activity [${params.action}]:`, error.message);
  }
}

/** Build a display name from first + last */
function displayName(first: string | null, last: string | null): string {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}

/**
 * Resolve a Clerk org ID to the actual mosques.id primary key.
 * Supports both patterns:
 *   - Legacy: mosques.id = Clerk org ID (create-account flow)
 *   - New:    mosques.clerk_org_id = Clerk org ID (graduated leads)
 * Falls back to the raw Clerk org ID if no mosque is found yet
 * (e.g., the row hasn't been inserted by the API route yet).
 */
async function resolveMosqueId(clerkOrgId: string): Promise<string> {
  const { data } = await supabase
    .from("mosques")
    .select("id")
    .or(`clerk_org_id.eq.${clerkOrgId},id.eq.${clerkOrgId}`)
    .limit(1)
    .single();
  return data?.id ?? clerkOrgId;
}

async function fetchTableData(){
  try {
    const {data, error} = await supabase.from("sahla_team").select("*");
    if (error) { throw error;}
    return data;
  }
  catch (error) {
    console.error("Failed to fetch table data:", error.message);
    return [];
  }

}
// ============================================================================
// EVENT HANDLERS
// ============================================================================

// ── user.created ────────────────────────────────────────────────────────
// Clerk fires this when a new user signs up (in any mosque app or CRM).
// We create their global profiles row.
async function handleUserCreated(user: ClerkUser) {
  const email = getPrimaryEmail(user);
  const phone = getPrimaryPhone(user);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_email: email,
      phone_number: phone,
      profile_pic: user.image_url,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Failed to create profile:", error.message);
    throw error;
  }

  console.log(`Profile created: ${user.id} (${email})`);
}


// ── user.updated ────────────────────────────────────────────────────────
// Clerk fires this when user updates their profile (name, email, pic, etc.).
// We mirror the changes to our profiles table.
async function handleUserUpdated(user: ClerkUser) {
  const email = getPrimaryEmail(user);
  const phone = getPrimaryPhone(user);

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: user.first_name,
      last_name: user.last_name,
      profile_email: email,
      phone_number: phone,
      profile_pic: user.image_url,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update profile:", error.message);
    throw error;
  }

  console.log(`Profile updated: ${user.id}`);
}


// ── user.deleted ────────────────────────────────────────────────────────
// Clerk fires this when a user account is deleted.
// We delete their profile — CASCADE handles downstream cleanup on tables
// that FK to profiles.id. For tables without FK (user_id TEXT without FK),
// we clean up explicitly.
async function handleUserDeleted(user: { id: string }) {
  // 1. Deactivate push tokens (don't delete — keep for audit)
  await supabase
    .from("push_tokens")
    .update({ is_active: false })
    .eq("user_id", user.id);

  // 2. Delete profile (CASCADE handles: user_preferences, user_islamic_interests,
  //    user_islamic_goals, user_content_interactions, recommendation_log,
  //    capacity_alert_subscribers, business_ads_submissions, jummah_notifications)
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (error) {
    console.error("Failed to delete profile:", error.message);
    throw error;
  }

  // 3. Clean up tables that use user_id TEXT without FK to profiles
  const orphanTables = [
    "saved_content",
    "liked_lectures",
    "user_cart",
    "content_notifications",
    "content_notification_settings",
    "content_notification_schedule",
    "prayer_notification_settings",
    "prayer_notification_schedule",
    "user_continue_read",
    "user_bookmarked_surahs",
    "user_bookmarked_ayahs",
    "user_liked_surahs",
    "user_liked_ayahs",
    "user_playlist",
  ];

  for (const table of orphanTables) {
    const { error: cleanupError } = await supabase
      .from(table)
      .delete()
      .eq("user_id", user.id);

    if (cleanupError) {
      console.warn(`Cleanup warning [${table}]:`, cleanupError.message);
    }
  }

  console.log(`Profile deleted + cleanup complete: ${user.id}`);
}


// ── organizationMembership.created ──────────────────────────────────────
// Clerk fires this when a user is added to an organization (mosque).
// This happens when:
//   - Mosque admin invites a user
//   - User signs up through a mosque app (auto-joined to that org)
//   - CRM creates a new mosque and invites the admin
//
// We:
//   1. Log to activity_log (Pulse feed: "New user joined {Mosque}")
//   2. Initialize empty user_preferences for this mosque (so recs work)
async function handleMembershipCreated(membership: ClerkOrganizationMembership) {
  const clerkOrgId = membership.organization.id;
  const userId = membership.public_user_data.user_id;
  const userName = displayName(
    membership.public_user_data.first_name,
    membership.public_user_data.last_name
  );
  const mosqueName = membership.organization.name;

  // ── Guard: skip Sahla HQ org (not a mosque) ──
  // When a team member is added to the Sahla HQ org, we don't create
  // mosque user data (user_preferences, etc.) — they're a platform admin.
  if (await isSahlaOrg(clerkOrgId)) {
    console.log(`Skipping Sahla HQ org membership for ${userName} — not a mosque`);

    // Still ensure profile exists (they need a profiles row for RLS)
    await supabase.from("profiles").upsert(
      {
        id: userId,
        first_name: membership.public_user_data.first_name,
        last_name: membership.public_user_data.last_name,
        profile_email: membership.public_user_data.identifier,
        profile_pic: membership.public_user_data.image_url,
      },
      { onConflict: "id" }
    );

    // Insert into sahla_team so role updates/deactivation have a row to target
    const { error: teamError } = await supabase.from("sahla_team").upsert(
      {
        user_id: userId,
        clerk_org_role: membership.role,
        is_active: true,
      },
      { onConflict: "user_id" }
    );

    if (teamError) {
      console.error("Failed to upsert sahla_team:", teamError.message);
      throw teamError;
    }

    // Log as team event, not user_signup
    await logActivity({
      actor_id: userId,
      actor_name: userName,
      action: "team_member_added",
      entity_type: "sahla_team",
      entity_id: userId,
      entity_name: userName,
      metadata: { role: membership.role },
    });
    return;
  }

  // ── Normal mosque membership flow ──
  const mosqueId = await resolveMosqueId(clerkOrgId);

  // Ensure profile exists (in case webhook ordering is weird)
  await supabase.from("profiles").upsert(
    {
      id: userId,
      first_name: membership.public_user_data.first_name,
      last_name: membership.public_user_data.last_name,
      profile_email: membership.public_user_data.identifier,
      profile_pic: membership.public_user_data.image_url,
    },
    { onConflict: "id" }
  );

  // Log to activity feed
  await logActivity({
    mosque_id: mosqueId,
    actor_id: userId,
    actor_name: userName,
    action: "user_signup",
    entity_type: "user",
    entity_id: userId,
    entity_name: userName,
    metadata: {
      role: membership.role,
      mosque_name: mosqueName,
    },
  });

  // Initialize user_preferences stub (so recommendation engine has a row to update)
  const { error: prefError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        mosque_id: mosqueId,
      },
      { onConflict: "user_id,mosque_id" }
    );

  if (prefError) {
    console.warn("Could not init user_preferences:", prefError.message);
  }

  console.log(
    `Membership created: ${userName} → ${mosqueName} (${membership.role})`
  );
}


// ── organizationMembership.updated ──────────────────────────────────────
// Clerk fires this when a user's role changes within an organization.
// e.g., member promoted to admin.
async function handleMembershipUpdated(membership: ClerkOrganizationMembership) {
  const userName = displayName(
    membership.public_user_data.first_name,
    membership.public_user_data.last_name
  );

  // ── Guard: Sahla HQ org role changes are team-level, not mosque-level ──
  const clerkOrgId = membership.organization.id;
  if (await isSahlaOrg(clerkOrgId)) {
    // Update sahla_team.clerk_org_role if applicable
    await supabase
      .from("sahla_team")
      .update({ clerk_org_role: membership.role })
      .eq("user_id", membership.public_user_data.user_id);

    console.log(`Sahla team role updated: ${userName} → ${membership.role}`);
    return;
  }

  const mosqueId = await resolveMosqueId(clerkOrgId);
  await logActivity({
    mosque_id: mosqueId,
    actor_name: userName,
    action: "role_changed",
    entity_type: "user",
    entity_id: membership.public_user_data.user_id,
    entity_name: userName,
    metadata: {
      new_role: membership.role,
      mosque_name: membership.organization.name,
    },
  });

  console.log(
    `Membership updated: ${userName} → ${membership.role} at ${membership.organization.name}`
  );
}


// ── organizationMembership.deleted ──────────────────────────────────────
// Clerk fires this when a user leaves or is removed from an organization.
// We clean up their mosque-scoped data and deactivate push tokens.
async function handleMembershipDeleted(membership: ClerkOrganizationMembership) {
  const clerkOrgId = membership.organization.id;
  const userId = membership.public_user_data.user_id;
  const userName = displayName(
    membership.public_user_data.first_name,
    membership.public_user_data.last_name
  );

  // ── Guard: Sahla HQ org removal = deactivate team member, not mosque cleanup ──
  if (await isSahlaOrg(clerkOrgId)) {
    await supabase
      .from("sahla_team")
      .update({ is_active: false })
      .eq("user_id", userId);

    await logActivity({
      actor_name: userName,
      action: "team_member_removed",
      entity_type: "sahla_team",
      entity_id: userId,
      entity_name: userName,
    });

    console.log(`Sahla team member deactivated: ${userName}`);
    return;
  }

  // ── Normal mosque membership removal ──
  const mosqueId = await resolveMosqueId(clerkOrgId);

  // Deactivate push tokens for this mosque (don't delete — other mosques unaffected)
  await supabase
    .from("push_tokens")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("mosque_id", mosqueId);

  // Clean up notification opt-ins for this mosque
  const notifTables = [
    "content_notifications",
    "content_notification_settings",
    "prayer_notification_settings",
    "jummah_notifications",
  ];

  for (const table of notifTables) {
    await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("mosque_id", mosqueId);
  }

  // Delete pending (unsent) notification schedule rows
  await supabase
    .from("content_notification_schedule")
    .delete()
    .eq("user_id", userId)
    .eq("mosque_id", mosqueId)
    .eq("is_sent", false);

  await supabase
    .from("prayer_notification_schedule")
    .delete()
    .eq("user_id", userId)
    .eq("mosque_id", mosqueId)
    .eq("is_sent", false);

  // Log to activity feed
  await logActivity({
    mosque_id: mosqueId,
    actor_name: userName,
    action: "user_removed",
    entity_type: "user",
    entity_id: userId,
    entity_name: userName,
    metadata: {
      mosque_name: membership.organization.name,
      role: membership.role,
    },
  });

  console.log(
    `Membership deleted: ${userName} removed from ${membership.organization.name}`
  );
}


// ── session.created ─────────────────────────────────────────────────────
// Clerk fires this when a user starts a new session (logs in).
// We only care about CRM admin logins — these feed the health score's
// "admin_activity" component (days since last admin login).
//
// We check: does this user have an active org? And is their role admin+?
// If so, log it. Regular app user sessions are ignored.
async function handleSessionCreated(session: ClerkSession) {
  const userId = session.user_id;
  const orgId = session.last_active_organization_id;

  // Only log if there's an active organization (CRM/admin context)
  if (!orgId) {
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .single();

  const name = profile
    ? displayName(profile.first_name, profile.last_name)
    : userId;

  // ── Guard: Sahla HQ org logins are platform events, not mosque events ──
  // Don't log as admin_login (which feeds mosque health scores).
  if (await isSahlaOrg(orgId)) {
    await logActivity({
      actor_id: userId,
      actor_name: name,
      action: "sahla_login",
      entity_type: "session",
      entity_id: session.id,
      metadata: {},
    });
    console.log(`Sahla HQ login: ${name}`);
    return;
  }

  // ── Normal mosque admin login ──
  // This feeds the health score's admin_activity component.
  const mosqueId = await resolveMosqueId(orgId);
  await logActivity({
    mosque_id: mosqueId,
    actor_id: userId,
    actor_name: name,
    action: "admin_login",
    entity_type: "session",
    entity_id: session.id,
    metadata: {},
  });

  console.log(`Mosque admin login logged: ${name} → org ${orgId}`);
}


// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── Verify webhook signature using Svix ──
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers");
    return new Response("Missing webhook signature headers", { status: 400 });
  }

  const body = await req.text();

  let event: WebhookEvent;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid webhook signature", { status: 401 });
  }

  // ── Route event to handler ──
  const startTime = Date.now();
  console.log(`\n→ Clerk webhook: ${event.type}`);

  try {
    switch (event.type) {
      // User lifecycle
      case "user.created":
        await handleUserCreated(event.data as unknown as ClerkUser);
        break;

      case "user.updated":
        await handleUserUpdated(event.data as unknown as ClerkUser);
        break;

      case "user.deleted":
        await handleUserDeleted(event.data as unknown as { id: string });
        break;

      // Organization membership
      case "organizationMembership.created":
        await handleMembershipCreated(
          event.data as unknown as ClerkOrganizationMembership
        );
        break;

      case "organizationMembership.updated":
        await handleMembershipUpdated(
          event.data as unknown as ClerkOrganizationMembership
        );
        break;

      case "organizationMembership.deleted":
        await handleMembershipDeleted(
          event.data as unknown as ClerkOrganizationMembership
        );
        break;

      // Session tracking (admin activity for health scores)
      case "session.created":
        await handleSessionCreated(
          event.data as unknown as ClerkSession
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    const duration = Date.now() - startTime;
    console.log(`✓ ${event.type} processed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        event: event.type,
        duration_ms: duration,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`✗ ${event.type} failed after ${duration}ms:`, error);

    // Return 200 even on processing errors to prevent Clerk from retrying
    // (we've received and acknowledged the webhook — the error is on our side).
    // If we return 4xx/5xx, Clerk will retry and potentially create duplicate data.
    return new Response(
      JSON.stringify({
        success: false,
        event: event.type,
        error: error instanceof Error ? error.message : "Unknown error",
        duration_ms: duration,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});