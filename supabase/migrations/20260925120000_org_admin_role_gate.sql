-- ============================================================================
-- Require the Clerk org ADMIN role for mosque-admin access
-- ----------------------------------------------------------------------------
-- Two defects, one fix.
--
-- 1. Every app user is a member of their mosque's Clerk org. The mobile app
--    calls the `join-org` edge function on sign-in, sign-up, create-account,
--    forgot-password AND two-factor; it adds the user as `org:member` and the
--    app then setActive()s that org. So "member of the mosque's Clerk org"
--    describes the entire congregation, not the mosque's staff. (Staging proof:
--    Masjid Al Firdaus had 15 org members, 11 of them `org:member`.)
--
-- 2. Nothing checked the role. Mosque-admin policies were scoped to
--    `mosque_id = requesting_mosque_uuid()` / `requesting_mosque_id()`, which
--    only asks WHICH org the caller is in, never WHAT they are in it — no
--    policy read `org_role` at all. Net effect: any congregant could update the
--    mosque row, manage reels, read the activity log and other members' RSVPs,
--    and write notification rows (i.e. push to the whole congregation).
--
-- The auto-join itself is load-bearing and stays: per-user policies
-- (user_preferences, bookmarks, goals, …) are scoped
-- `mosque_id = requesting_mosque_id()`, so a congregant needs the mosque org
-- active to use the app at all. The fix is to gate on the ROLE instead.
--
-- Also finishes what 20260504180540 started. That migration taught
-- `requesting_mosque_id()` and `is_sahla_team()` to read the Clerk v2 claim
-- shape (`o.id`) as well as v1 (`org_id`), but `is_mosque_admin()` (rewritten
-- later, in 20260523180204), `requesting_mosque_uuid()` and `is_sahla_org()`
-- still read v1 only — so under the v2 tokens this instance issues they return
-- false/NULL, hiding the in-app admin portal from real mosque admins and
-- denying all 14 `requesting_mosque_uuid()` policies. The web CRM never noticed
-- because it writes with the service-role client, bypassing RLS; only the
-- mobile app hits RLS as the user.
--
-- Congregant reads are unaffected: every table touched here keeps either a
-- `*_public_read` (USING true) or a `*_org_select` policy, and `rsvps` gains a
-- user-scoped SELECT to replace the org-wide one.
--
-- Applied to staging (rpepxdgdiqeirdqsazuc) only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Part 1: claim readers
-- ---------------------------------------------------------------------------

-- Clerk v1 carries the active org role at `org_role` ("org:admin"); v2 nests it
-- at `o.rol` ("admin"). Read both, the way requesting_mosque_id() does for the
-- org id. Whichever shape carries the id carries the role, so the pair is safe.
CREATE OR REPLACE FUNCTION public.requesting_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true)::json->>'org_role', ''),
    NULLIF(current_setting('request.jwt.claims', true)::json#>>'{o,rol}', '')
  )
$$;

-- Is the caller an ADMIN of their active Clerk org (not merely a member)?
-- COALESCE to false so a missing claim reads as "not an admin" rather than NULL.
CREATE OR REPLACE FUNCTION public.is_org_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
AS $$
  SELECT COALESCE(
    public.requesting_user_role() = ANY (ARRAY['admin', 'org:admin']),
    false
  )
$$;

-- Resolve the caller's active org to mosques.id, reading both claim shapes.
CREATE OR REPLACE FUNCTION public.requesting_mosque_uuid()
  RETURNS text
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT id FROM mosques
  WHERE clerk_org_id = public.requesting_mosque_id()
  LIMIT 1
$$;

-- The in-app admin gate: Sahla HQ anywhere, or an ADMIN of a mosque's own org.
CREATE OR REPLACE FUNCTION public.is_mosque_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT (
    -- Sahla HQ team members can access any masjid's admin
    is_sahla_team()
    OR
    -- An admin — not just any member — of a mosque's own Clerk org
    (
      public.is_org_admin()
      AND EXISTS (
        SELECT 1 FROM mosques
        WHERE clerk_org_id = public.requesting_mosque_id()
      )
    )
  )
$$;

-- Same v1-only claim bug, for consistency.
CREATE OR REPLACE FUNCTION public.is_sahla_org()
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sahla_config
    WHERE id = 'singleton'
      AND org_id = public.requesting_mosque_id()
  )
$$;

-- ---------------------------------------------------------------------------
-- Part 2: policies scoped on requesting_mosque_uuid()
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "ad_payments_mosque_read" ON public.ad_payments;
CREATE POLICY "ad_payments_mosque_read" ON public.ad_payments
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_uuid() AND is_org_admin());

DROP POLICY IF EXISTS "ad_subscriptions_mosque_read" ON public.ad_subscriptions;
CREATE POLICY "ad_subscriptions_mosque_read" ON public.ad_subscriptions
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_uuid() AND is_org_admin());

DROP POLICY IF EXISTS "approved_ads_mosque_all" ON public.approved_business_ads;
CREATE POLICY "approved_ads_mosque_all" ON public.approved_business_ads
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "business_ads_mosque_read" ON public.business_ads_submissions;
CREATE POLICY "business_ads_mosque_read" ON public.business_ads_submissions
  FOR SELECT TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "business_ads_mosque_update" ON public.business_ads_submissions;
CREATE POLICY "business_ads_mosque_update" ON public.business_ads_submissions
  FOR UPDATE TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "content_items_mosque_write" ON public.content_items;
CREATE POLICY "content_items_mosque_write" ON public.content_items
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "iqamah_config_mosque_write" ON public.iqamah_config;
CREATE POLICY "iqamah_config_mosque_write" ON public.iqamah_config
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "jummah_mosque_write" ON public.jummah;
CREATE POLICY "jummah_mosque_write" ON public.jummah
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "prayer_display_config_mosque_write" ON public.prayer_display_config;
CREATE POLICY "prayer_display_config_mosque_write" ON public.prayer_display_config
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "prayers_mosque_write" ON public.prayers;
CREATE POLICY "prayers_mosque_write" ON public.prayers
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "program_categories_mosque_write" ON public.program_categories;
CREATE POLICY "program_categories_mosque_write" ON public.program_categories
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() AND is_org_admin())
  WITH CHECK (mosque_id = requesting_mosque_uuid() AND is_org_admin());

DROP POLICY IF EXISTS "pcc_mosque_write" ON public.program_category_content;
CREATE POLICY "pcc_mosque_write" ON public.program_category_content
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_uuid() AND is_org_admin())
  WITH CHECK (mosque_id = requesting_mosque_uuid() AND is_org_admin());

DROP POLICY IF EXISTS "speaker_data_mosque_write" ON public.speaker_data;
CREATE POLICY "speaker_data_mosque_write" ON public.speaker_data
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "todays_prayers_mosque_write" ON public.todays_prayers;
CREATE POLICY "todays_prayers_mosque_write" ON public.todays_prayers
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

-- ---------------------------------------------------------------------------
-- Part 3: admin-intent policies scoped on requesting_mosque_id()
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "mosques_admin_update" ON public.mosques;
CREATE POLICY "mosques_admin_update" ON public.mosques
  FOR UPDATE TO public
  USING ((clerk_org_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((clerk_org_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "mos_mosque_update" ON public.mosque_onboarding_steps;
CREATE POLICY "mos_mosque_update" ON public.mosque_onboarding_steps
  FOR UPDATE TO public
  USING ((mosque_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "mos_mosque_select" ON public.mosque_onboarding_steps;
CREATE POLICY "mos_mosque_select" ON public.mosque_onboarding_steps
  FOR SELECT TO public
  USING ((mosque_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "automated_notification_templates_mosque_all" ON public.automated_notification_templates;
CREATE POLICY "automated_notification_templates_mosque_all" ON public.automated_notification_templates
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_id() AND is_org_admin());

DROP POLICY IF EXISTS "notification_templates_mosque_all" ON public.notification_templates;
CREATE POLICY "notification_templates_mosque_all" ON public.notification_templates
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_id() AND is_org_admin());

DROP POLICY IF EXISTS "scheduled_notifications_mosque_all" ON public.scheduled_notifications;
CREATE POLICY "scheduled_notifications_mosque_all" ON public.scheduled_notifications
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_id() AND is_org_admin());

DROP POLICY IF EXISTS "reels_admin_all" ON public.reels;
CREATE POLICY "reels_admin_all" ON public.reels
  FOR ALL TO public
  USING (mosque_id = requesting_mosque_id() AND is_org_admin());

DROP POLICY IF EXISTS "rsvps_admin_update" ON public.rsvps;
CREATE POLICY "rsvps_admin_update" ON public.rsvps
  FOR UPDATE TO public
  USING (mosque_id = requesting_mosque_id() AND is_org_admin());

-- Attendee lists are congregant PII: admins only. `rsvps_user_insert` and
-- `rsvps_user_update` already scope writes to the owner; this restores the
-- matching read, which the org-wide policy had been standing in for.
DROP POLICY IF EXISTS "rsvps_mosque_select" ON public.rsvps;
CREATE POLICY "rsvps_mosque_select" ON public.rsvps
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id() AND is_org_admin());

DROP POLICY IF EXISTS "rsvps_user_select" ON public.rsvps;
CREATE POLICY "rsvps_user_select" ON public.rsvps
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

DROP POLICY IF EXISTS "activity_log_mosque_select" ON public.activity_log;
CREATE POLICY "activity_log_mosque_select" ON public.activity_log
  FOR SELECT TO public
  USING (mosque_id = requesting_mosque_id() AND is_org_admin());
