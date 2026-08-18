-- Migration: Tenant RLS Isolation & Ensure org_id columns exist

-- Ensure core tables exist
CREATE TABLE IF NOT EXISTS public.organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.providers (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('connected', 'disconnected')),
  api_key text,
  models text[] NOT NULL DEFAULT '{}'::text[]
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id text PRIMARY KEY,
  team text NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.requests (
  id text PRIMARY KEY,
  provider text NOT NULL,
  model text NOT NULL,
  tokens_in integer NOT NULL,
  tokens_out integer NOT NULL,
  cost numeric(10, 6) NOT NULL,
  latency numeric(5, 2) NOT NULL,
  timestamp bigint NOT NULL,
  team text NOT NULL,
  project text NOT NULL,
  department text NOT NULL,
  workflow text NOT NULL,
  customer text NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  status text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.policies (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  action text NOT NULL CHECK (action IN ('block', 'flag'))
);

CREATE TABLE IF NOT EXISTS public.budgets (
  team text PRIMARY KEY,
  limit_amount numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  suggestion text NOT NULL,
  savings numeric NOT NULL,
  confidence numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'applied', 'dismissed')),
  evidence text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.outcomes (
  id text PRIMARY KEY,
  workflow text NOT NULL,
  department text NOT NULL,
  metric_name text NOT NULL,
  volume integer NOT NULL,
  cost_per_outcome numeric(10, 4) NOT NULL,
  roi_score text NOT NULL CHECK (roi_score IN ('High', 'Medium', 'Low')),
  necessity text NOT NULL CHECK (necessity IN ('AI Essential', 'AI Recommended', 'Hybrid', 'Rule-Based Preferred'))
);

CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  status text NOT NULL CHECK (status IN ('Active', 'Pending'))
);

-- Ensure org_id column exists on all core tables
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';
ALTER TABLE public.outcomes ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org-default';

-- Helper function to get current user's organization ID from auth JWT or users table
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

-- Drop old policies
DROP POLICY IF EXISTS "Allow public read" ON public.organizations;
DROP POLICY IF EXISTS "Allow public write" ON public.organizations;
DROP POLICY IF EXISTS "Allow public read" ON public.providers;
DROP POLICY IF EXISTS "Allow public write" ON public.providers;
DROP POLICY IF EXISTS "Allow public read" ON public.api_keys;
DROP POLICY IF EXISTS "Allow public write" ON public.api_keys;
DROP POLICY IF EXISTS "Allow public read" ON public.requests;
DROP POLICY IF EXISTS "Allow public write" ON public.requests;
DROP POLICY IF EXISTS "Allow public read" ON public.policies;
DROP POLICY IF EXISTS "Allow public write" ON public.policies;
DROP POLICY IF EXISTS "Allow public read" ON public.budgets;
DROP POLICY IF EXISTS "Allow public write" ON public.budgets;
DROP POLICY IF EXISTS "Allow public read" ON public.recommendations;
DROP POLICY IF EXISTS "Allow public write" ON public.recommendations;
DROP POLICY IF EXISTS "Allow public read" ON public.outcomes;
DROP POLICY IF EXISTS "Allow public write" ON public.outcomes;
DROP POLICY IF EXISTS "Allow public read" ON public.users;
DROP POLICY IF EXISTS "Allow public write" ON public.users;

-- Create tenant-isolated policies
-- NOTE: id::text cast handles the case where the live DB has organizations.id as uuid
-- (created via Studio) while get_my_org_id() returns text.
CREATE POLICY "org_select" ON public.organizations FOR SELECT USING (id::text = public.get_my_org_id());
CREATE POLICY "org_all" ON public.organizations FOR ALL USING (id::text = public.get_my_org_id()) WITH CHECK (id::text = public.get_my_org_id());

CREATE POLICY "providers_select" ON public.providers FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "providers_all" ON public.providers FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "api_keys_all" ON public.api_keys FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "requests_select" ON public.requests FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "requests_all" ON public.requests FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "policies_select" ON public.policies FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "policies_all" ON public.policies FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "budgets_all" ON public.budgets FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "recommendations_select" ON public.recommendations FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "recommendations_all" ON public.recommendations FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "outcomes_select" ON public.outcomes FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "outcomes_all" ON public.outcomes FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "users_select" ON public.users FOR SELECT USING (org_id = public.get_my_org_id());
CREATE POLICY "users_all" ON public.users FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());
