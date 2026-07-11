/* Migration: init schema */
/* Contents copied from supabase_schema.sql */

-- Begin schema (auto-generated)
CREATE SCHEMA IF NOT EXISTS public;

-- providers table
CREATE TABLE IF NOT EXISTS public.providers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    hashed_password text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    owner_id uuid REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


-- profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id uuid PRIMARY KEY REFERENCES public.users(id),
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id uuid REFERENCES public.organizations(id),
    title text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id uuid REFERENCES public.projects(id),
    title text NOT NULL,
    status text,
    created_at timestamp with time zone DEFAULT now()
);

-- connections table
CREATE TABLE IF NOT EXISTS public.connections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id),
    type text,
    created_at timestamp with time zone DEFAULT now()
);

-- analytics table
CREATE TABLE IF NOT EXISTS public.analytics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event text NOT NULL,
    payload jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id),
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- settings table
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text
);

-- Enable RLS on all tables
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Example policies (adjust as needed)
CREATE POLICY "allow_authenticated" ON public.providers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.organizations FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.users FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.profiles FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.projects FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.tasks FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.connections FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.analytics FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.notifications FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_authenticated" ON public.settings FOR ALL USING (auth.uid() IS NOT NULL);

-- Grant Data API access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- End of migration

-- Note: This is a simplified schema based on code expectations.
