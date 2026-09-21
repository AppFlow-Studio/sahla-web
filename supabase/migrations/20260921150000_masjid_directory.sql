-- =============================================================================
-- Masjid Directory (SAHLA-WEB-12)
--
-- Public directory of masjids on sahla.co, seeded with ~213 NYC masjids.
-- This is NOT the `mosques` table — `mosques` rows are paying customers with
-- Clerk orgs. A `masjids_directory` row is public information about a masjid,
-- most of which are not customers. A customer's directory row links back to
-- their `mosques` row via `mosque_id` once they opt in during onboarding.
--
-- Reviewed by Temur (schema approved before this migration runs).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Part 1: Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS masjids_directory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  name_ar text,
  address text,
  city text,
  state text,
  zip text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  email text,
  calculation_method integer DEFAULT 2,
  school integer DEFAULT 0,
  is_sahla_customer boolean NOT NULL DEFAULT false,
  mosque_id text REFERENCES mosques(id),
  verification_status text NOT NULL DEFAULT 'unverified',
  last_verified_at timestamptz,
  verified_by text,
  data_source text,
  opted_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT masjids_directory_slug_key UNIQUE (slug),
  CONSTRAINT masjids_directory_verification_status_check
    CHECK (verification_status IN ('unverified', 'computed', 'masjid_confirmed')),
  -- A customer listing must be linkable back to its mosques row — otherwise
  -- there's nowhere to read real iqamah times from.
  CONSTRAINT masjids_directory_customer_requires_mosque_id_check
    CHECK (NOT is_sahla_customer OR mosque_id IS NOT NULL)
);

COMMENT ON TABLE public.masjids_directory IS
  'Public masjid directory (sahla.co). Distinct from mosques (paying customers). Most rows here are not customers.';
COMMENT ON COLUMN public.masjids_directory.mosque_id IS
  'Set only when is_sahla_customer = true. Links to mosques.id so real iqamah times can be read from iqamah_config.';
COMMENT ON COLUMN public.masjids_directory.verification_status IS
  'unverified: no times set yet. computed: AlAdhan athan times shown, not confirmed by the masjid. masjid_confirmed: the masjid confirmed the times shown. The "Verified" label on a directory page requires masjid_confirmed — enforced in lib/masjid-directory/publish-rules.ts, not just by convention.';
COMMENT ON COLUMN public.masjids_directory.data_source IS
  'Where this row''s times/info came from, e.g. aladhan, mosque_admin, manual_import, google_places. Shown on the page per the accuracy requirement.';
COMMENT ON COLUMN public.masjids_directory.opted_out IS
  'Set true when a masjid asks to be removed from the directory. Hides the row from public reads immediately.';

CREATE TABLE IF NOT EXISTS jummah_directory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  masjid_id uuid NOT NULL REFERENCES masjids_directory(id) ON DELETE CASCADE,
  session_number integer NOT NULL DEFAULT 1,
  time time without time zone NOT NULL,
  khateeb text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT jummah_directory_masjid_id_session_number_key UNIQUE (masjid_id, session_number)
);

COMMENT ON TABLE public.jummah_directory IS
  'Jummah sessions for a directory masjid. Not used for iqamah — customer iqamah times are read from iqamah_config via masjids_directory.mosque_id.';

-- Directory opt-in, captured on the mosque onboarding flow. Gates whether a
-- customer's real iqamah_config times may appear on their directory page —
-- without it, a customer masjid's directory row (if any) still falls back to
-- computed AlAdhan times.
ALTER TABLE mosques ADD COLUMN IF NOT EXISTS directory_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.mosques.directory_opt_in IS
  'Mosque opted in during onboarding to "Show our masjid in the Sahla public directory." Required (alongside masjids_directory.is_sahla_customer + mosque_id) before their real iqamah times can be shown on a directory page — see lib/masjid-directory/publish-rules.ts.';

-- ---------------------------------------------------------------------------
-- Part 2: Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_masjids_directory_city ON masjids_directory (city);
CREATE INDEX IF NOT EXISTS idx_masjids_directory_opted_out ON masjids_directory (opted_out);
CREATE INDEX IF NOT EXISTS idx_masjids_directory_mosque_id ON masjids_directory (mosque_id) WHERE mosque_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jummah_directory_masjid_id ON jummah_directory (masjid_id);

-- ---------------------------------------------------------------------------
-- Part 3: updated_at triggers (reuses public.update_updated_at() from baseline)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS masjids_directory_updated_at ON masjids_directory;
CREATE TRIGGER masjids_directory_updated_at
  BEFORE UPDATE ON masjids_directory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS jummah_directory_updated_at ON jummah_directory;
CREATE TRIGGER jummah_directory_updated_at
  BEFORE UPDATE ON jummah_directory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Part 4: RLS
-- Public can read rows where opted_out = false. Only Sahla team can write.
-- (is_sahla_team() is defined in the baseline migrations.)
-- ---------------------------------------------------------------------------

ALTER TABLE masjids_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE jummah_directory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "masjids_directory_public_read" ON masjids_directory;
CREATE POLICY "masjids_directory_public_read" ON masjids_directory
  FOR SELECT TO public
  USING (opted_out = false);

DROP POLICY IF EXISTS "masjids_directory_sahla_team_write" ON masjids_directory;
CREATE POLICY "masjids_directory_sahla_team_write" ON masjids_directory
  FOR ALL TO public
  USING (is_sahla_team())
  WITH CHECK (is_sahla_team());

-- Jummah rows follow their masjid's visibility: readable when the parent
-- masjid is public, regardless of the requester's own opted_out row access.
DROP POLICY IF EXISTS "jummah_directory_public_read" ON jummah_directory;
CREATE POLICY "jummah_directory_public_read" ON jummah_directory
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM masjids_directory m
      WHERE m.id = jummah_directory.masjid_id AND m.opted_out = false
    )
  );

DROP POLICY IF EXISTS "jummah_directory_sahla_team_write" ON jummah_directory;
CREATE POLICY "jummah_directory_sahla_team_write" ON jummah_directory
  FOR ALL TO public
  USING (is_sahla_team())
  WITH CHECK (is_sahla_team());
