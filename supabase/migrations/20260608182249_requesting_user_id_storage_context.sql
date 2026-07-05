-- Reconstructed from staging (rpepxdgdiqeirdqsazuc) migration history: requesting_user_id_storage_context
CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'sub', '')
$$;
