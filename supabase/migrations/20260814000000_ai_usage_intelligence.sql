-- Migration: AI Usage Intelligence & Multi-Source Telemetry Schema Extension

-- 1. Extend requests table with multi-dimensional telemetry attributes
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'UNKNOWN';
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS tool text DEFAULT 'Peek Gateway';
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS source text DEFAULT 'proxy';
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS project_id text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS actual_cost numeric(10, 6);
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Create usage_connectors table for external AI tools & providers (Copilot, Cursor, Direct APIs)
CREATE TABLE IF NOT EXISTS public.usage_connectors (
  id text PRIMARY KEY,
  org_id text NOT NULL DEFAULT 'org-default',
  name text NOT NULL,
  provider text NOT NULL,
  tool_type text NOT NULL,
  auth_method text NOT NULL DEFAULT 'api_key',
  status text NOT NULL CHECK (status IN ('connected', 'syncing', 'error', 'disconnected')),
  config jsonb DEFAULT '{}'::jsonb,
  last_sync_at bigint,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on usage_connectors
ALTER TABLE public.usage_connectors ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for usage_connectors
DROP POLICY IF EXISTS "usage_connectors_select" ON public.usage_connectors;
DROP POLICY IF EXISTS "usage_connectors_all" ON public.usage_connectors;

CREATE POLICY "usage_connectors_select" ON public.usage_connectors
  FOR SELECT USING (org_id = public.get_my_org_id());

CREATE POLICY "usage_connectors_all" ON public.usage_connectors
  FOR ALL USING (org_id = public.get_my_org_id()) WITH CHECK (org_id = public.get_my_org_id());

-- 5. Grant API access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage_connectors TO anon, authenticated;

-- 6. Add composite index for sub-millisecond multi-dimensional analytics query execution
CREATE INDEX IF NOT EXISTS idx_requests_usage_intel ON public.requests (org_id, team, customer, provider, timestamp);
