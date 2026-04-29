-- Waitlist forms now write directly to mosques as leads (CRM pipeline).
-- Add a proper country column so the form's country field stops being
-- shoehorned into mosques.state.
ALTER TABLE public.mosques ADD COLUMN IF NOT EXISTS country text;

-- demo_requests is no longer used; lead capture writes to mosques + pipeline_stages.
DROP TABLE IF EXISTS public.demo_requests;
