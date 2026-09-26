-- ============================================================================
-- Sahla HQ: write access on the last six mosque-admin tables
-- ----------------------------------------------------------------------------
-- 20260626152933 gave HQ the `OR is_sahla_team()` branch on the mosque-admin
-- write policies that existed then, and 20260925120000 preserved every one of
-- them while adding the org-admin role gate. Six tables were never in that set,
-- so HQ could open a masjid's admin portal and still be denied the save:
--
--   program_categories, program_category_content   (no HQ policy at all)
--   notification_templates, automated_notification_templates,
--   scheduled_notifications                        (HQ had SELECT only)
--   rsvps                                          (HQ had SELECT only)
--
-- HQ must be able to change any masjid's app — including masjids we have not
-- created an account for yet — so this closes the gap. Same shape and same
-- reasoning as 20260626152933: `is_sahla_team()` widens WHO may write, never
-- WHICH mosque the row is attributed to, because every write path sets
-- mosque_id explicitly to the active mosque.
--
-- Mosque-facing access is unchanged: the `requesting_mosque_id() AND
-- is_org_admin()` branch is carried through untouched.
--
-- Applied to staging (rpepxdgdiqeirdqsazuc) only.
-- ============================================================================

DROP POLICY IF EXISTS "program_categories_mosque_write" ON public.program_categories;
CREATE POLICY "program_categories_mosque_write" ON public.program_categories
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "pcc_mosque_write" ON public.program_category_content;
CREATE POLICY "pcc_mosque_write" ON public.program_category_content
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team())
  WITH CHECK ((mosque_id = requesting_mosque_uuid() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "notification_templates_mosque_all" ON public.notification_templates;
CREATE POLICY "notification_templates_mosque_all" ON public.notification_templates
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "automated_notification_templates_mosque_all" ON public.automated_notification_templates;
CREATE POLICY "automated_notification_templates_mosque_all" ON public.automated_notification_templates
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "scheduled_notifications_mosque_all" ON public.scheduled_notifications;
CREATE POLICY "scheduled_notifications_mosque_all" ON public.scheduled_notifications
  FOR ALL TO public
  USING ((mosque_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team());

DROP POLICY IF EXISTS "rsvps_admin_update" ON public.rsvps;
CREATE POLICY "rsvps_admin_update" ON public.rsvps
  FOR UPDATE TO public
  USING ((mosque_id = requesting_mosque_id() AND is_org_admin()) OR is_sahla_team());
