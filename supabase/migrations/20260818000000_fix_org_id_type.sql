-- Migration: Fix organizations RLS policies - uuid::text cast
--
-- Problem: The live DB has organizations.id as uuid (created via Studio before migrations
-- were applied). The RLS policies in 20260730000001 compare id = get_my_org_id() where
-- the function returns text, causing: "operator does not exist: uuid = text".
--
-- Fix: This migration applies the function + corrected policies (with id::text cast)
-- in case the previous migration was recorded as applied but partially failed, or if
-- run on a fresh DB where organizations.id ends up as uuid.
--
-- The ::text cast is safe and idempotent: it works whether id is text or uuid.

-- Re-create helper function (idempotent)
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid text;
  v_org_id text;
BEGIN
  -- Safely cast uuid -> text before any comparison
  v_uid := CAST(auth.uid() AS text);

  -- 1. Try JWT claim first
  v_org_id := nullif(current_setting('request.jwt.claims', true), '')::jsonb
                -> 'user_metadata' ->> 'org_id';

  -- 2. Fall back to users table lookup
  IF v_org_id IS NULL AND v_uid IS NOT NULL THEN
    SELECT u.org_id INTO v_org_id
    FROM public.users u
    WHERE u.id = v_uid
    LIMIT 1;
  END IF;

  -- 3. Final fallback
  RETURN COALESCE(v_org_id, 'org-default');
END;
$$;

-- Drop and re-create organizations policies with explicit ::text cast
-- This resolves "operator does not exist: uuid = text" when id is a uuid column.
DROP POLICY IF EXISTS "org_select" ON public.organizations;
DROP POLICY IF EXISTS "org_all"    ON public.organizations;

CREATE POLICY "org_select"
  ON public.organizations
  FOR SELECT
  USING (id::text = public.get_my_org_id());

CREATE POLICY "org_all"
  ON public.organizations
  FOR ALL
  USING (id::text = public.get_my_org_id())
  WITH CHECK (id::text = public.get_my_org_id());
