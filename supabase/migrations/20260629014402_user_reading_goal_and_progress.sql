-- Reconstructed from staging (rpepxdgdiqeirdqsazuc) migration history: user_reading_goal_and_progress
-- NT-ENGAGE-01 — Reading-goal data model + daily progress sync.
--
-- Project: STAGING (rpepxdgdiqeirdqsazuc) — applied via MCP per team workflow.

-- 1. Per-user daily Quran page goal. Defaults match the client default in
--    src/lib/quran-tracker.ts (2 pages/day).
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS quran_daily_goal int NOT NULL DEFAULT 2;

-- 2. Daily progress ledger. One row per (user, mosque, date).
CREATE TABLE IF NOT EXISTS public.user_daily_reading_progress (
  user_id    text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mosque_id  text NOT NULL REFERENCES public.mosques(id)  ON DELETE CASCADE,
  date       date NOT NULL,
  pages_read int  NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mosque_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_reading_progress_date
  ON public.user_daily_reading_progress (date);

-- 3. RLS — users can read their own row.
ALTER TABLE public.user_daily_reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_daily_reading_progress_user_select"
  ON public.user_daily_reading_progress;
CREATE POLICY "user_daily_reading_progress_user_select"
  ON public.user_daily_reading_progress
  FOR SELECT TO public
  USING (user_id = requesting_user_id());

-- 4. Idempotent upsert RPC, scoped to requesting_user_id() / requesting_mosque_id().
CREATE OR REPLACE FUNCTION public.upsert_reading_progress(
  p_date  date,
  p_pages int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   text;
  v_mosque_id text;
BEGIN
  v_user_id   := requesting_user_id();
  v_mosque_id := requesting_mosque_id();

  IF v_user_id IS NULL OR v_mosque_id IS NULL THEN
    RAISE EXCEPTION 'upsert_reading_progress: missing user or mosque context';
  END IF;
  IF p_pages < 0 THEN
    RAISE EXCEPTION 'upsert_reading_progress: pages cannot be negative';
  END IF;

  INSERT INTO public.user_daily_reading_progress (
    user_id, mosque_id, date, pages_read, updated_at
  )
  VALUES (v_user_id, v_mosque_id, p_date, p_pages, now())
  ON CONFLICT (user_id, mosque_id, date) DO UPDATE
    SET pages_read = GREATEST(public.user_daily_reading_progress.pages_read, EXCLUDED.pages_read),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_reading_progress(date, int) TO anon, authenticated;
