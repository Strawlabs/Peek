/* Migration: init schema */
/* Contents copied from supabase_schema.sql */

-- Begin schema (auto-generated)
CREATE SCHEMA IF NOT EXISTS public;

-- organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id text PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id text PRIMARY KEY,
    name text NOT NULL,
    status text NOT NULL CHECK (status IN ('connected', 'disconnected')),
    api_key text,
    models text[] NOT NULL DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id text PRIMARY KEY,
    team text NOT NULL,
    name text NOT NULL,
    key_prefix text NOT NULL,
    key_hash text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- requests table
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

-- policies table
CREATE TABLE IF NOT EXISTS public.policies (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    action text NOT NULL CHECK (action IN ('block', 'flag'))
);

-- budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    team text PRIMARY KEY,
    limit_amount numeric NOT NULL DEFAULT 0,
    spent numeric NOT NULL DEFAULT 0
);

-- recommendations table
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

-- outcomes table
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

-- users table
CREATE TABLE IF NOT EXISTS public.users (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    status text NOT NULL CHECK (status IN ('Active', 'Pending'))
);

-- Enable RLS on all tables
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Example default policies
CREATE POLICY "allow_authenticated" ON public.organizations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.providers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.api_keys FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.requests FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.policies FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.budgets FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.recommendations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.outcomes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.users FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant Data API access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- End of migration
