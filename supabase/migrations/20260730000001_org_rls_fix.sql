-- Migration: Tenant RLS Isolation & Ensure org_id columns exist

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
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'user_metadata' ->> 'org_id'),
    (SELECT org_id FROM public.users WHERE id = auth.uid()::text LIMIT 1),
    'org-default'
  );
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
CREATE POLICY "org_select" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "org_all" ON public.organizations FOR ALL USING (true);

CREATE POLICY "providers_select" ON public.providers FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "providers_all" ON public.providers FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());

CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "api_keys_all" ON public.api_keys FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());

CREATE POLICY "requests_select" ON public.requests FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "requests_all" ON public.requests FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());

CREATE POLICY "policies_select" ON public.policies FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "policies_all" ON public.policies FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());

CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "budgets_all" ON public.budgets FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());

CREATE POLICY "recommendations_select" ON public.recommendations FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "recommendations_all" ON public.recommendations FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());

CREATE POLICY "outcomes_select" ON public.outcomes FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "outcomes_all" ON public.outcomes FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());

CREATE POLICY "users_select" ON public.users FOR SELECT USING (org_id IS NULL OR org_id = public.get_my_org_id());
CREATE POLICY "users_all" ON public.users FOR ALL USING (org_id IS NULL OR org_id = public.get_my_org_id()) WITH CHECK (org_id IS NULL OR org_id = public.get_my_org_id());
