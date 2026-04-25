-- Baseline tables migration: full schema as of 2026-04-19

-- ============================================================
-- 1. Core tables with no FK dependencies
-- ============================================================

CREATE TABLE mosques (
  id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  city text,
  state text,
  address text,
  timezone text DEFAULT 'America/New_York',
  app_name text,
  logo_url text,
  brand_color text DEFAULT '#0D7C5F',
  accent_color text,
  secondary_color text,
  masjidal_id text,
  masjidal_sync_enabled boolean DEFAULT false,
  stripe_account_id text,
  subscription_status text DEFAULT 'setup',
  subscription_id text,
  onboarding_status text DEFAULT 'in_progress',
  onboarding_progress jsonb DEFAULT '{}',
  launched_at timestamptz,
  bundle_id text,
  package_name text,
  apple_team_id text,
  apple_merchant_id text,
  eas_project_id text,
  calculation_method integer DEFAULT 2,
  school integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  clerk_org_id text
);

CREATE TABLE profiles (
  id text NOT NULL,
  first_name text,
  last_name text,
  profile_email text,
  phone_number text,
  profile_pic text,
  stripe_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE islamic_goals (
  id bigint GENERATED ALWAYS AS IDENTITY,
  goal_key text NOT NULL,
  goal_name text NOT NULL,
  display_order integer
);

CREATE TABLE islamic_interest_categories (
  id bigint GENERATED ALWAYS AS IDENTITY,
  category_key text NOT NULL,
  category_name text NOT NULL,
  icon_name text,
  display_order integer,
  parent_category_id bigint
);

CREATE TABLE onboarding_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  category_label text NOT NULL,
  category_icon text,
  category_order integer NOT NULL,
  task_key text NOT NULL,
  task_name text NOT NULL,
  task_desc text,
  is_required boolean NOT NULL DEFAULT false,
  is_recommended boolean NOT NULL DEFAULT false,
  time_estimate text,
  display_order integer NOT NULL,
  auto_complete_condition text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sahla_config (
  id text NOT NULL DEFAULT 'singleton',
  org_id text NOT NULL,
  org_name text DEFAULT 'Sahla HQ',
  support_email text DEFAULT 'support@sahla.app',
  platform_fee_pct numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sahla_team (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  is_active boolean NOT NULL DEFAULT true,
  invited_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  org_id text,
  clerk_org_role text DEFAULT 'org:admin'
);

CREATE TABLE expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost numeric NOT NULL,
  frequency text NOT NULL,
  category text DEFAULT 'Platform',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Tables that reference mosques/profiles
-- ============================================================

CREATE TABLE activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text,
  actor_id text,
  actor_name text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  entity_name text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ad_pricing_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  pricing_model text NOT NULL,
  onboarding_fee numeric,
  recurring_fee numeric,
  one_time_fee numeric,
  duration_options jsonb,
  placement_options jsonb,
  max_active_ads integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE speaker_data (
  speaker_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  speaker_name text,
  speaker_img text,
  speaker_creds text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE display_categories (
  id bigint GENERATED ALWAYS AS IDENTITY,
  mosque_id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_items (
  id bigint GENERATED ALWAYS AS IDENTITY,
  content_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  type text NOT NULL,
  name text,
  description text,
  image text,
  speakers text[],
  days text[],
  start_date timestamptz,
  end_date timestamptz,
  start_time time,
  gender text DEFAULT 'All',
  has_lectures boolean DEFAULT false,
  is_paid boolean DEFAULT false,
  price double precision DEFAULT 0,
  is_kids boolean DEFAULT false,
  is_fourteen_plus boolean DEFAULT false,
  paid_link text,
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  max_capacity integer,
  current_count integer DEFAULT 0
);

CREATE TABLE business_ads_submissions (
  id bigint GENERATED ALWAYS AS IDENTITY,
  submission_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  personal_full_name text,
  personal_email text,
  personal_phone text,
  business_name text,
  business_address text,
  business_flyer_img text,
  placement text,
  duration_months integer,
  status text DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  stage text DEFAULT 'lead',
  contact_name text,
  contact_email text,
  contact_phone text,
  notes jsonb DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prayers (
  id bigint GENERATED ALWAYS AS IDENTITY,
  mosque_id text NOT NULL,
  "prayerData" jsonb,
  "iqamahData" jsonb
);

CREATE TABLE todays_prayers (
  id bigint GENERATED ALWAYS AS IDENTITY,
  mosque_id text NOT NULL,
  prayer_name text,
  athan_time time DEFAULT '08:00:00',
  iqamah_time time
);

CREATE TABLE iqamah_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  prayer_name text NOT NULL,
  mode text NOT NULL,
  fixed_time time,
  offset_minutes integer,
  seasonal_rules jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prayer_display_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  calculation_method integer NOT NULL,
  school integer DEFAULT 0,
  hijri_adjustment integer DEFAULT 0,
  tv_theme text DEFAULT 'masjid',
  show_sunrise boolean DEFAULT true,
  show_hijri_date boolean DEFAULT true,
  show_jummah_time boolean DEFAULT true,
  custom_message text,
  display_language text DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jummah (
  id bigint GENERATED ALWAYS AS IDENTITY,
  mosque_id text NOT NULL,
  speaker uuid,
  topic text,
  prayer_time text DEFAULT '12:15 PM',
  capacity_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jummah_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text,
  mosque_id text NOT NULL,
  jummah text,
  notification_settings text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE donations (
  id bigint GENERATED ALWAYS AS IDENTITY,
  mosque_id text NOT NULL,
  "amountGiven" double precision,
  project_donated_to text[],
  date timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  project_id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  project_name text,
  project_goal double precision,
  thumbnail text,
  project_linked_to uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mosque_notification_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  prayer_notif_enabled boolean DEFAULT true,
  program_notif_enabled boolean DEFAULT true,
  event_notif_enabled boolean DEFAULT true,
  default_reminder_min integer DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mosque_onboarding_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  checklist_item_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  completed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mosque_health_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  overall_score integer NOT NULL,
  content_freshness integer NOT NULL,
  user_engagement integer NOT NULL,
  push_coverage integer NOT NULL,
  admin_activity integer NOT NULL,
  business_ads integer NOT NULL,
  payment_health integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mosque_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  author_id text,
  author_name text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE nudge_dismissals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text,
  nudge_type text NOT NULL,
  nudge_period text NOT NULL,
  dismissed_by text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  token text NOT NULL,
  device_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE capacity_alert_subscribers (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL
);

CREATE TABLE lectures (
  id bigint GENERATED ALWAYS AS IDENTITY,
  lecture_id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  name text,
  speaker text[],
  date date,
  link text,
  image text,
  ai_summary text,
  key_notes text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'draft'
);

CREATE TABLE content_tags (
  id bigint GENERATED ALWAYS AS IDENTITY,
  mosque_id text,
  tag_key text NOT NULL,
  tag_name text NOT NULL,
  tag_type text,
  display_category_id bigint,
  maps_to_interest_id integer
);

CREATE TABLE quran_playlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  reciter uuid,
  surah text,
  youtube_id text,
  video_type text DEFAULT 'Quran',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ramadan_quran_tracker (
  id bigint GENERATED ALWAYS AS IDENTITY,
  mosque_id text NOT NULL,
  surah numeric DEFAULT 1,
  surah_name text,
  ayah_num numeric DEFAULT 1,
  num_of_ayahs numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE taraweeh_lineup (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  date text NOT NULL,
  lineup jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. Tables that reference content_items, lectures, etc.
-- ============================================================

CREATE TABLE ad_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mosque_id text NOT NULL,
  submission_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  pricing_model text,
  onboarding_amount numeric,
  recurring_amount numeric,
  onboarding_paid boolean DEFAULT false,
  status text DEFAULT 'pending',
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE approved_business_ads (
  id bigint GENERATED ALWAYS AS IDENTITY,
  submission_id uuid,
  mosque_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_forms (
  id bigint GENERATED ALWAYS AS IDENTITY,
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  question text,
  question_type text,
  radio_button_prompts text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_islamic_goals (
  content_id uuid NOT NULL,
  goal_id bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE content_islamic_interests (
  content_id uuid NOT NULL,
  interest_id bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE content_notification_schedule (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  title text,
  message text,
  notification_time timestamptz,
  push_notification_token text,
  is_sent boolean DEFAULT false
);

CREATE TABLE content_notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  notification_settings text[]
);

CREATE TABLE content_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE content_tag_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY,
  content_id uuid NOT NULL,
  tag_id bigint NOT NULL,
  relevance_weight double precision,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE liked_lectures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  lecture_id uuid NOT NULL,
  mosque_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE saved_content (
  user_id text NOT NULL,
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_cart (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  product_price real,
  product_quantity bigint DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_content_interactions (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  content_id uuid NOT NULL,
  mosque_id text NOT NULL,
  interaction_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE recommendation_log (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  content_id uuid,
  mosque_id text NOT NULL,
  recommendation_score double precision,
  score_breakdown jsonb,
  was_shown boolean,
  was_clicked boolean,
  was_added boolean,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE prayer_notification_schedule (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  prayer text,
  notification_time timestamptz,
  push_notification_token text,
  is_sent boolean DEFAULT false
);

CREATE TABLE prayer_notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  prayer text,
  notification_settings text[]
);

CREATE TABLE user_bookmarked_ayahs (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  surah_number bigint NOT NULL,
  ayah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_bookmarked_surahs (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  surah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_continue_read (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  surah_number integer,
  ayah_number integer,
  juz_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_islamic_goals (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  goal_id bigint NOT NULL,
  mosque_id text NOT NULL,
  priority integer
);

CREATE TABLE user_islamic_interests (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  interest_id bigint NOT NULL,
  mosque_id text NOT NULL,
  interest_level integer
);

CREATE TABLE user_liked_ayahs (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  surah_number bigint NOT NULL,
  ayah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_liked_surahs (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  surah_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_playlist (
  playlist_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  playlist_name text,
  playlist_img text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_playlist_lectures (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  playlist_id uuid NOT NULL,
  lecture_id uuid NOT NULL,
  mosque_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_preferences (
  id bigint GENERATED ALWAYS AS IDENTITY,
  user_id text NOT NULL,
  mosque_id text NOT NULL,
  gender text,
  birth_year integer,
  has_children boolean,
  children_ages integer[],
  is_revert boolean,
  islamic_knowledge_level text,
  preferred_days text[],
  preferred_times text[]
);

-- ============================================================
-- PRIMARY KEYS
-- ============================================================

ALTER TABLE activity_log ADD PRIMARY KEY (id);
ALTER TABLE ad_pricing_config ADD PRIMARY KEY (id);
ALTER TABLE ad_subscriptions ADD PRIMARY KEY (id);
ALTER TABLE approved_business_ads ADD PRIMARY KEY (id);
ALTER TABLE business_ads_submissions ADD PRIMARY KEY (id);
ALTER TABLE capacity_alert_subscribers ADD PRIMARY KEY (id);
ALTER TABLE content_forms ADD PRIMARY KEY (id);
ALTER TABLE content_islamic_goals ADD PRIMARY KEY (content_id, goal_id);
ALTER TABLE content_islamic_interests ADD PRIMARY KEY (content_id, interest_id);
ALTER TABLE content_items ADD PRIMARY KEY (id);
ALTER TABLE content_notification_schedule ADD PRIMARY KEY (id);
ALTER TABLE content_notification_settings ADD PRIMARY KEY (id);
ALTER TABLE content_notifications ADD PRIMARY KEY (id);
ALTER TABLE content_tag_assignments ADD PRIMARY KEY (id);
ALTER TABLE content_tags ADD PRIMARY KEY (id);
ALTER TABLE display_categories ADD PRIMARY KEY (id);
ALTER TABLE donations ADD PRIMARY KEY (id);
ALTER TABLE expenses ADD PRIMARY KEY (id);
ALTER TABLE iqamah_config ADD PRIMARY KEY (id);
ALTER TABLE islamic_goals ADD PRIMARY KEY (id);
ALTER TABLE islamic_interest_categories ADD PRIMARY KEY (id);
ALTER TABLE jummah ADD PRIMARY KEY (id);
ALTER TABLE jummah_notifications ADD PRIMARY KEY (id);
ALTER TABLE lectures ADD PRIMARY KEY (id);
ALTER TABLE liked_lectures ADD PRIMARY KEY (id);
ALTER TABLE mosque_health_scores ADD PRIMARY KEY (id);
ALTER TABLE mosque_notes ADD PRIMARY KEY (id);
ALTER TABLE mosque_notification_config ADD PRIMARY KEY (id);
ALTER TABLE mosque_onboarding_steps ADD PRIMARY KEY (id);
ALTER TABLE mosques ADD PRIMARY KEY (id);
ALTER TABLE nudge_dismissals ADD PRIMARY KEY (id);
ALTER TABLE onboarding_checklist_items ADD PRIMARY KEY (id);
ALTER TABLE pipeline_stages ADD PRIMARY KEY (id);
ALTER TABLE prayer_display_config ADD PRIMARY KEY (id);
ALTER TABLE prayer_notification_schedule ADD PRIMARY KEY (id);
ALTER TABLE prayer_notification_settings ADD PRIMARY KEY (id);
ALTER TABLE prayers ADD PRIMARY KEY (id);
ALTER TABLE profiles ADD PRIMARY KEY (id);
ALTER TABLE projects ADD PRIMARY KEY (project_id);
ALTER TABLE push_tokens ADD PRIMARY KEY (id);
ALTER TABLE quran_playlist ADD PRIMARY KEY (id);
ALTER TABLE ramadan_quran_tracker ADD PRIMARY KEY (id);
ALTER TABLE recommendation_log ADD PRIMARY KEY (id);
ALTER TABLE sahla_config ADD PRIMARY KEY (id);
ALTER TABLE sahla_team ADD PRIMARY KEY (id);
ALTER TABLE saved_content ADD PRIMARY KEY (user_id, content_id);
ALTER TABLE speaker_data ADD PRIMARY KEY (speaker_id);
ALTER TABLE taraweeh_lineup ADD PRIMARY KEY (id);
ALTER TABLE todays_prayers ADD PRIMARY KEY (id);
ALTER TABLE user_bookmarked_ayahs ADD PRIMARY KEY (id);
ALTER TABLE user_bookmarked_surahs ADD PRIMARY KEY (id);
ALTER TABLE user_cart ADD PRIMARY KEY (id);
ALTER TABLE user_content_interactions ADD PRIMARY KEY (id);
ALTER TABLE user_continue_read ADD PRIMARY KEY (id);
ALTER TABLE user_islamic_goals ADD PRIMARY KEY (id);
ALTER TABLE user_islamic_interests ADD PRIMARY KEY (id);
ALTER TABLE user_liked_ayahs ADD PRIMARY KEY (id);
ALTER TABLE user_liked_surahs ADD PRIMARY KEY (id);
ALTER TABLE user_playlist ADD PRIMARY KEY (playlist_id);
ALTER TABLE user_playlist_lectures ADD PRIMARY KEY (id);
ALTER TABLE user_preferences ADD PRIMARY KEY (id);

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================

ALTER TABLE ad_pricing_config ADD CONSTRAINT ad_pricing_config_mosque_id_key UNIQUE (mosque_id);
ALTER TABLE business_ads_submissions ADD CONSTRAINT business_ads_submissions_submission_id_key UNIQUE (submission_id);
ALTER TABLE capacity_alert_subscribers ADD CONSTRAINT capacity_alert_subscribers_user_id_mosque_id_key UNIQUE (user_id, mosque_id);
ALTER TABLE content_items ADD CONSTRAINT content_items_content_id_key UNIQUE (content_id);
ALTER TABLE content_notification_settings ADD CONSTRAINT content_notification_settings_user_id_content_id_key UNIQUE (user_id, content_id);
ALTER TABLE content_notifications ADD CONSTRAINT content_notifications_user_id_content_id_key UNIQUE (user_id, content_id);
ALTER TABLE content_tags ADD CONSTRAINT content_tags_mosque_id_tag_key_key UNIQUE (mosque_id, tag_key);
ALTER TABLE display_categories ADD CONSTRAINT display_categories_mosque_id_slug_key UNIQUE (mosque_id, slug);
ALTER TABLE iqamah_config ADD CONSTRAINT iqamah_config_mosque_id_prayer_name_key UNIQUE (mosque_id, prayer_name);
ALTER TABLE islamic_goals ADD CONSTRAINT islamic_goals_goal_key_key UNIQUE (goal_key);
ALTER TABLE islamic_interest_categories ADD CONSTRAINT islamic_interest_categories_category_key_key UNIQUE (category_key);
ALTER TABLE lectures ADD CONSTRAINT lectures_lecture_id_key UNIQUE (lecture_id);
ALTER TABLE liked_lectures ADD CONSTRAINT liked_lectures_user_id_lecture_id_key UNIQUE (user_id, lecture_id);
ALTER TABLE mosque_notification_config ADD CONSTRAINT mosque_notification_config_mosque_id_key UNIQUE (mosque_id);
ALTER TABLE mosque_onboarding_steps ADD CONSTRAINT mosque_onboarding_steps_mosque_id_checklist_item_id_key UNIQUE (mosque_id, checklist_item_id);
ALTER TABLE mosques ADD CONSTRAINT mosques_slug_key UNIQUE (slug);
ALTER TABLE nudge_dismissals ADD CONSTRAINT nudge_dismissals_mosque_id_nudge_type_nudge_period_key UNIQUE (mosque_id, nudge_type, nudge_period);
ALTER TABLE onboarding_checklist_items ADD CONSTRAINT onboarding_checklist_items_task_key_key UNIQUE (task_key);
ALTER TABLE pipeline_stages ADD CONSTRAINT pipeline_stages_mosque_id_key UNIQUE (mosque_id);
ALTER TABLE prayer_display_config ADD CONSTRAINT prayer_display_config_mosque_id_key UNIQUE (mosque_id);
ALTER TABLE prayer_notification_settings ADD CONSTRAINT prayer_notification_settings_user_id_mosque_id_prayer_key UNIQUE (user_id, mosque_id, prayer);
ALTER TABLE push_tokens ADD CONSTRAINT push_tokens_user_id_mosque_id_token_key UNIQUE (user_id, mosque_id, token);
ALTER TABLE sahla_team ADD CONSTRAINT sahla_team_user_id_key UNIQUE (user_id);
ALTER TABLE taraweeh_lineup ADD CONSTRAINT taraweeh_lineup_mosque_id_date_key UNIQUE (mosque_id, date);
ALTER TABLE user_bookmarked_ayahs ADD CONSTRAINT user_bookmarked_ayahs_user_id_mosque_id_surah_number_ayah_n_key UNIQUE (user_id, mosque_id, surah_number, ayah_number);
ALTER TABLE user_bookmarked_surahs ADD CONSTRAINT user_bookmarked_surahs_user_id_mosque_id_surah_number_key UNIQUE (user_id, mosque_id, surah_number);
ALTER TABLE user_continue_read ADD CONSTRAINT user_continue_read_user_id_mosque_id_key UNIQUE (user_id, mosque_id);
ALTER TABLE user_islamic_goals ADD CONSTRAINT user_islamic_goals_user_id_goal_id_mosque_id_key UNIQUE (user_id, goal_id, mosque_id);
ALTER TABLE user_islamic_interests ADD CONSTRAINT user_islamic_interests_user_id_interest_id_mosque_id_key UNIQUE (user_id, interest_id, mosque_id);
ALTER TABLE user_liked_ayahs ADD CONSTRAINT user_liked_ayahs_user_id_mosque_id_surah_number_ayah_number_key UNIQUE (user_id, mosque_id, surah_number, ayah_number);
ALTER TABLE user_liked_surahs ADD CONSTRAINT user_liked_surahs_user_id_mosque_id_surah_number_key UNIQUE (user_id, mosque_id, surah_number);
ALTER TABLE user_playlist_lectures ADD CONSTRAINT user_playlist_lectures_playlist_id_lecture_id_key UNIQUE (playlist_id, lecture_id);
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_mosque_id_key UNIQUE (user_id, mosque_id);

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE activity_log ADD CONSTRAINT activity_log_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE ad_pricing_config ADD CONSTRAINT ad_pricing_config_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE ad_subscriptions ADD CONSTRAINT ad_subscriptions_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE ad_subscriptions ADD CONSTRAINT ad_subscriptions_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES business_ads_submissions(submission_id);
ALTER TABLE approved_business_ads ADD CONSTRAINT approved_business_ads_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE approved_business_ads ADD CONSTRAINT approved_business_ads_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES business_ads_submissions(submission_id);
ALTER TABLE business_ads_submissions ADD CONSTRAINT business_ads_submissions_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE business_ads_submissions ADD CONSTRAINT business_ads_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE capacity_alert_subscribers ADD CONSTRAINT capacity_alert_subscribers_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE capacity_alert_subscribers ADD CONSTRAINT capacity_alert_subscribers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE content_forms ADD CONSTRAINT content_forms_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE content_forms ADD CONSTRAINT content_forms_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE content_islamic_goals ADD CONSTRAINT content_islamic_goals_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE content_islamic_goals ADD CONSTRAINT content_islamic_goals_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES islamic_goals(id);
ALTER TABLE content_islamic_interests ADD CONSTRAINT content_islamic_interests_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE content_islamic_interests ADD CONSTRAINT content_islamic_interests_interest_id_fkey FOREIGN KEY (interest_id) REFERENCES islamic_interest_categories(id);
ALTER TABLE content_items ADD CONSTRAINT content_items_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE content_notification_schedule ADD CONSTRAINT content_notification_schedule_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE content_notification_schedule ADD CONSTRAINT content_notification_schedule_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE content_notification_settings ADD CONSTRAINT content_notification_settings_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE content_notification_settings ADD CONSTRAINT content_notification_settings_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE content_notifications ADD CONSTRAINT content_notifications_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE content_notifications ADD CONSTRAINT content_notifications_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE content_tag_assignments ADD CONSTRAINT content_tag_assignments_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE content_tag_assignments ADD CONSTRAINT content_tag_assignments_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES content_tags(id);
ALTER TABLE content_tags ADD CONSTRAINT content_tags_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE content_tags ADD CONSTRAINT content_tags_display_category_id_fkey FOREIGN KEY (display_category_id) REFERENCES display_categories(id);
ALTER TABLE content_tags ADD CONSTRAINT content_tags_maps_to_interest_id_fkey FOREIGN KEY (maps_to_interest_id) REFERENCES islamic_interest_categories(id);
ALTER TABLE display_categories ADD CONSTRAINT display_categories_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE donations ADD CONSTRAINT donations_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE iqamah_config ADD CONSTRAINT iqamah_config_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE islamic_interest_categories ADD CONSTRAINT islamic_interest_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES islamic_interest_categories(id);
ALTER TABLE jummah ADD CONSTRAINT jummah_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE jummah ADD CONSTRAINT jummah_speaker_fkey FOREIGN KEY (speaker) REFERENCES speaker_data(speaker_id);
ALTER TABLE jummah_notifications ADD CONSTRAINT jummah_notifications_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE jummah_notifications ADD CONSTRAINT jummah_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE lectures ADD CONSTRAINT lectures_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE lectures ADD CONSTRAINT lectures_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE liked_lectures ADD CONSTRAINT liked_lectures_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE liked_lectures ADD CONSTRAINT liked_lectures_lecture_id_fkey FOREIGN KEY (lecture_id) REFERENCES lectures(lecture_id);
ALTER TABLE mosque_health_scores ADD CONSTRAINT mosque_health_scores_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE mosque_notes ADD CONSTRAINT mosque_notes_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE mosque_notification_config ADD CONSTRAINT mosque_notification_config_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE mosque_onboarding_steps ADD CONSTRAINT mosque_onboarding_steps_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE mosque_onboarding_steps ADD CONSTRAINT mosque_onboarding_steps_checklist_item_id_fkey FOREIGN KEY (checklist_item_id) REFERENCES onboarding_checklist_items(id);
ALTER TABLE nudge_dismissals ADD CONSTRAINT nudge_dismissals_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE pipeline_stages ADD CONSTRAINT pipeline_stages_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE prayer_display_config ADD CONSTRAINT prayer_display_config_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE prayer_notification_schedule ADD CONSTRAINT prayer_notification_schedule_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE prayer_notification_settings ADD CONSTRAINT prayer_notification_settings_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE prayers ADD CONSTRAINT prayers_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE projects ADD CONSTRAINT projects_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE projects ADD CONSTRAINT projects_project_linked_to_fkey FOREIGN KEY (project_linked_to) REFERENCES projects(project_id);
ALTER TABLE push_tokens ADD CONSTRAINT push_tokens_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE quran_playlist ADD CONSTRAINT quran_playlist_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE quran_playlist ADD CONSTRAINT quran_playlist_reciter_fkey FOREIGN KEY (reciter) REFERENCES speaker_data(speaker_id);
ALTER TABLE ramadan_quran_tracker ADD CONSTRAINT ramadan_quran_tracker_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE recommendation_log ADD CONSTRAINT recommendation_log_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE recommendation_log ADD CONSTRAINT recommendation_log_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE recommendation_log ADD CONSTRAINT recommendation_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE saved_content ADD CONSTRAINT saved_content_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE saved_content ADD CONSTRAINT saved_content_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE speaker_data ADD CONSTRAINT speaker_data_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE taraweeh_lineup ADD CONSTRAINT taraweeh_lineup_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE todays_prayers ADD CONSTRAINT todays_prayers_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_bookmarked_ayahs ADD CONSTRAINT user_bookmarked_ayahs_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_bookmarked_surahs ADD CONSTRAINT user_bookmarked_surahs_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_cart ADD CONSTRAINT user_cart_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_cart ADD CONSTRAINT user_cart_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE user_content_interactions ADD CONSTRAINT user_content_interactions_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_content_interactions ADD CONSTRAINT user_content_interactions_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(content_id);
ALTER TABLE user_content_interactions ADD CONSTRAINT user_content_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE user_continue_read ADD CONSTRAINT user_continue_read_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_islamic_goals ADD CONSTRAINT user_islamic_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE user_islamic_goals ADD CONSTRAINT user_islamic_goals_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_islamic_goals ADD CONSTRAINT user_islamic_goals_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES islamic_goals(id);
ALTER TABLE user_islamic_interests ADD CONSTRAINT user_islamic_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE user_islamic_interests ADD CONSTRAINT user_islamic_interests_interest_id_fkey FOREIGN KEY (interest_id) REFERENCES islamic_interest_categories(id);
ALTER TABLE user_islamic_interests ADD CONSTRAINT user_islamic_interests_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_liked_ayahs ADD CONSTRAINT user_liked_ayahs_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_liked_surahs ADD CONSTRAINT user_liked_surahs_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_playlist ADD CONSTRAINT user_playlist_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_playlist_lectures ADD CONSTRAINT user_playlist_lectures_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES user_playlist(playlist_id);
ALTER TABLE user_playlist_lectures ADD CONSTRAINT user_playlist_lectures_lecture_id_fkey FOREIGN KEY (lecture_id) REFERENCES lectures(lecture_id);
ALTER TABLE user_playlist_lectures ADD CONSTRAINT user_playlist_lectures_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id);
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_mosque_id_fkey FOREIGN KEY (mosque_id) REFERENCES mosques(id);
