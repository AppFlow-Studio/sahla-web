-- Baseline RLS policies migration

-- Enable RLS on all tables (except islamic_goals and islamic_interest_categories)
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_business_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_ads_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_islamic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_islamic_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_notification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE display_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE iqamah_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE jummah ENABLE ROW LEVEL SECURITY;
ALTER TABLE jummah_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosque_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_display_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_notification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ramadan_quran_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE sahla_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sahla_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE taraweeh_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE todays_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarked_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarked_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_continue_read ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_islamic_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_islamic_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_liked_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_liked_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_playlist_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- activity_log
CREATE POLICY activity_log_insert ON activity_log FOR INSERT WITH CHECK (is_sahla_team());
CREATE POLICY activity_log_mosque_select ON activity_log FOR SELECT USING (mosque_id = requesting_mosque_id());
CREATE POLICY activity_log_sahla_select ON activity_log FOR SELECT USING (is_sahla_team());

-- ad_pricing_config
CREATE POLICY ad_pricing_config_sahla_select ON ad_pricing_config FOR SELECT USING (is_sahla_team());
CREATE POLICY ad_pricing_config_sahla_write ON ad_pricing_config FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- ad_subscriptions
CREATE POLICY ad_subscriptions_sahla_select ON ad_subscriptions FOR SELECT USING (is_sahla_team());
CREATE POLICY ad_subscriptions_sahla_write ON ad_subscriptions FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- approved_business_ads
CREATE POLICY approved_business_ads_sahla_select ON approved_business_ads FOR SELECT USING (is_sahla_team());
CREATE POLICY approved_business_ads_sahla_write ON approved_business_ads FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- business_ads_submissions
CREATE POLICY business_ads_submissions_sahla_select ON business_ads_submissions FOR SELECT USING (is_sahla_team());
CREATE POLICY business_ads_submissions_sahla_write ON business_ads_submissions FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- capacity_alert_subscribers
CREATE POLICY capacity_alert_subscribers_sahla_select ON capacity_alert_subscribers FOR SELECT USING (is_sahla_team());

-- content_forms
CREATE POLICY content_forms_sahla_select ON content_forms FOR SELECT USING (is_sahla_team());
CREATE POLICY content_forms_sahla_write ON content_forms FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- content_islamic_goals
CREATE POLICY content_islamic_goals_sahla_select ON content_islamic_goals FOR SELECT USING (is_sahla_team());

-- content_islamic_interests
CREATE POLICY content_islamic_interests_sahla_select ON content_islamic_interests FOR SELECT USING (is_sahla_team());

-- content_items
CREATE POLICY content_items_sahla_select ON content_items FOR SELECT USING (is_sahla_team());
CREATE POLICY content_items_sahla_write ON content_items FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- content_notification_schedule
CREATE POLICY content_notification_schedule_sahla_select ON content_notification_schedule FOR SELECT USING (is_sahla_team());
CREATE POLICY content_notification_schedule_sahla_write ON content_notification_schedule FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- content_notification_settings
CREATE POLICY content_notification_settings_sahla_select ON content_notification_settings FOR SELECT USING (is_sahla_team());

-- content_notifications
CREATE POLICY content_notifications_sahla_select ON content_notifications FOR SELECT USING (is_sahla_team());

-- content_tag_assignments
CREATE POLICY content_tag_assignments_sahla_select ON content_tag_assignments FOR SELECT USING (is_sahla_team());
CREATE POLICY content_tag_assignments_sahla_write ON content_tag_assignments FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- content_tags
CREATE POLICY content_tags_sahla_select ON content_tags FOR SELECT USING (is_sahla_team());
CREATE POLICY content_tags_sahla_write ON content_tags FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- display_categories
CREATE POLICY display_categories_sahla_select ON display_categories FOR SELECT USING (is_sahla_team());
CREATE POLICY display_categories_sahla_write ON display_categories FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- donations
CREATE POLICY donations_sahla_select ON donations FOR SELECT USING (is_sahla_team());
CREATE POLICY donations_sahla_write ON donations FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- expenses
CREATE POLICY expenses_sahla_write ON expenses FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- iqamah_config
CREATE POLICY iqamah_config_sahla_select ON iqamah_config FOR SELECT USING (is_sahla_team());
CREATE POLICY iqamah_config_sahla_write ON iqamah_config FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- jummah
CREATE POLICY jummah_sahla_select ON jummah FOR SELECT USING (is_sahla_team());
CREATE POLICY jummah_sahla_write ON jummah FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- jummah_notifications
CREATE POLICY jummah_notifications_sahla_select ON jummah_notifications FOR SELECT USING (is_sahla_team());

-- lectures
CREATE POLICY lectures_sahla_select ON lectures FOR SELECT USING (is_sahla_team());
CREATE POLICY lectures_sahla_write ON lectures FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- liked_lectures
CREATE POLICY liked_lectures_sahla_select ON liked_lectures FOR SELECT USING (is_sahla_team());

-- mosque_health_scores
CREATE POLICY mhs_insert ON mosque_health_scores FOR INSERT WITH CHECK (is_sahla_team());
CREATE POLICY mhs_select ON mosque_health_scores FOR SELECT USING (is_sahla_team());

-- mosque_notes
CREATE POLICY mosque_notes_sahla_select ON mosque_notes FOR SELECT USING (is_sahla_team());
CREATE POLICY mosque_notes_sahla_write ON mosque_notes FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- mosque_notification_config
CREATE POLICY mosque_notification_config_sahla_select ON mosque_notification_config FOR SELECT USING (is_sahla_team());
CREATE POLICY mosque_notification_config_sahla_write ON mosque_notification_config FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- mosque_onboarding_steps
CREATE POLICY mos_mosque_select ON mosque_onboarding_steps FOR SELECT USING (mosque_id = requesting_mosque_id() OR is_sahla_team());
CREATE POLICY mos_mosque_update ON mosque_onboarding_steps FOR UPDATE USING (mosque_id = requesting_mosque_id() OR is_sahla_team());
CREATE POLICY mos_sahla_delete ON mosque_onboarding_steps FOR DELETE USING (is_sahla_team());
CREATE POLICY mos_sahla_insert ON mosque_onboarding_steps FOR INSERT WITH CHECK (is_sahla_team());

-- mosques
CREATE POLICY mosques_public_read ON mosques FOR SELECT USING (true);
CREATE POLICY mosques_sahla_write ON mosques FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- nudge_dismissals
CREATE POLICY nd_insert ON nudge_dismissals FOR INSERT WITH CHECK (is_sahla_team());
CREATE POLICY nd_select ON nudge_dismissals FOR SELECT USING (is_sahla_team());

-- onboarding_checklist_items
CREATE POLICY oci_manage ON onboarding_checklist_items FOR ALL USING (is_sahla_team());
CREATE POLICY oci_select ON onboarding_checklist_items FOR SELECT USING (true);

-- pipeline_stages
CREATE POLICY pipeline_stages_sahla_select ON pipeline_stages FOR SELECT USING (is_sahla_team());
CREATE POLICY pipeline_stages_sahla_write ON pipeline_stages FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- prayer_display_config
CREATE POLICY prayer_display_config_sahla_select ON prayer_display_config FOR SELECT USING (is_sahla_team());
CREATE POLICY prayer_display_config_sahla_write ON prayer_display_config FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- prayer_notification_schedule
CREATE POLICY prayer_notification_schedule_sahla_select ON prayer_notification_schedule FOR SELECT USING (is_sahla_team());
CREATE POLICY prayer_notification_schedule_sahla_write ON prayer_notification_schedule FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- prayer_notification_settings
CREATE POLICY prayer_notification_settings_sahla_select ON prayer_notification_settings FOR SELECT USING (is_sahla_team());

-- prayers
CREATE POLICY prayers_sahla_select ON prayers FOR SELECT USING (is_sahla_team());
CREATE POLICY prayers_sahla_write ON prayers FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- profiles
CREATE POLICY profiles_sahla_select ON profiles FOR SELECT USING (is_sahla_team());

-- projects
CREATE POLICY projects_sahla_select ON projects FOR SELECT USING (is_sahla_team());
CREATE POLICY projects_sahla_write ON projects FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- push_tokens
CREATE POLICY push_tokens_sahla_select ON push_tokens FOR SELECT USING (is_sahla_team());
CREATE POLICY push_tokens_sahla_write ON push_tokens FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- quran_playlist
CREATE POLICY quran_playlist_sahla_select ON quran_playlist FOR SELECT USING (is_sahla_team());
CREATE POLICY quran_playlist_sahla_write ON quran_playlist FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- ramadan_quran_tracker
CREATE POLICY ramadan_quran_tracker_sahla_select ON ramadan_quran_tracker FOR SELECT USING (is_sahla_team());
CREATE POLICY ramadan_quran_tracker_sahla_write ON ramadan_quran_tracker FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- recommendation_log
CREATE POLICY recommendation_log_sahla_select ON recommendation_log FOR SELECT USING (is_sahla_team());

-- sahla_config
CREATE POLICY sahla_config_manage ON sahla_config FOR ALL USING (sahla_team_role() = 'super_admin');
CREATE POLICY sahla_config_select ON sahla_config FOR SELECT USING (true);

-- sahla_team
CREATE POLICY sahla_team_manage ON sahla_team FOR ALL USING (sahla_team_role() = 'super_admin');
CREATE POLICY sahla_team_select ON sahla_team FOR SELECT USING (is_sahla_team());

-- saved_content
CREATE POLICY saved_content_sahla_select ON saved_content FOR SELECT USING (is_sahla_team());

-- speaker_data
CREATE POLICY speaker_data_sahla_select ON speaker_data FOR SELECT USING (is_sahla_team());
CREATE POLICY speaker_data_sahla_write ON speaker_data FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- taraweeh_lineup
CREATE POLICY taraweeh_lineup_sahla_select ON taraweeh_lineup FOR SELECT USING (is_sahla_team());
CREATE POLICY taraweeh_lineup_sahla_write ON taraweeh_lineup FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- todays_prayers
CREATE POLICY todays_prayers_sahla_select ON todays_prayers FOR SELECT USING (is_sahla_team());
CREATE POLICY todays_prayers_sahla_write ON todays_prayers FOR ALL USING (is_sahla_team() AND sahla_team_role() = ANY (ARRAY['super_admin', 'admin']));

-- user_bookmarked_ayahs
CREATE POLICY user_bookmarked_ayahs_sahla_select ON user_bookmarked_ayahs FOR SELECT USING (is_sahla_team());

-- user_bookmarked_surahs
CREATE POLICY user_bookmarked_surahs_sahla_select ON user_bookmarked_surahs FOR SELECT USING (is_sahla_team());

-- user_cart
CREATE POLICY user_cart_sahla_select ON user_cart FOR SELECT USING (is_sahla_team());

-- user_content_interactions
CREATE POLICY user_content_interactions_sahla_select ON user_content_interactions FOR SELECT USING (is_sahla_team());

-- user_continue_read
CREATE POLICY user_continue_read_sahla_select ON user_continue_read FOR SELECT USING (is_sahla_team());

-- user_islamic_goals
CREATE POLICY user_islamic_goals_sahla_select ON user_islamic_goals FOR SELECT USING (is_sahla_team());

-- user_islamic_interests
CREATE POLICY user_islamic_interests_sahla_select ON user_islamic_interests FOR SELECT USING (is_sahla_team());

-- user_liked_ayahs
CREATE POLICY user_liked_ayahs_sahla_select ON user_liked_ayahs FOR SELECT USING (is_sahla_team());

-- user_liked_surahs
CREATE POLICY user_liked_surahs_sahla_select ON user_liked_surahs FOR SELECT USING (is_sahla_team());

-- user_playlist
CREATE POLICY user_playlist_sahla_select ON user_playlist FOR SELECT USING (is_sahla_team());

-- user_playlist_lectures
CREATE POLICY user_playlist_lectures_sahla_select ON user_playlist_lectures FOR SELECT USING (is_sahla_team());

-- user_preferences
CREATE POLICY user_preferences_sahla_select ON user_preferences FOR SELECT USING (is_sahla_team());
