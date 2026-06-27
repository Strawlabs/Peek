-- =========================================================================
-- Peek Enterprise AI Gateway - Supabase Database Schema & Initial Seeding
-- =========================================================================

-- 1. Create Tables
create table if not exists public.providers (
  id text primary key,
  name text not null,
  status text not null check (status in ('connected', 'disconnected')),
  api_key text,
  models text[] not null default '{}'::text[]
);

create table if not exists public.requests (
  id text primary key,
  provider text not null,
  model text not null,
  tokens_in integer not null,
  tokens_out integer not null,
  cost numeric(10, 6) not null,
  latency numeric(5, 2) not null,
  timestamp bigint not null,
  team text not null,
  project text not null,
  department text not null,
  workflow text not null,
  customer text not null,
  prompt text not null,
  response text not null,
  status text not null
);

create table if not exists public.policies (
  id text primary key,
  name text not null,
  description text not null,
  type text not null,
  active boolean not null default true,
  action text not null check (action in ('block', 'flag'))
);

create table if not exists public.budgets (
  team text primary key,
  limit_amount numeric not null default 0,
  spent numeric not null default 0
);

create table if not exists public.recommendations (
  id text primary key,
  title text not null,
  category text not null,
  suggestion text not null,
  savings numeric not null,
  confidence numeric not null,
  status text not null check (status in ('active', 'applied', 'dismissed')),
  evidence text not null
);

create table if not exists public.outcomes (
  id text primary key,
  workflow text not null,
  department text not null,
  metric_name text not null,
  volume integer not null,
  cost_per_outcome numeric(10, 4) not null,
  roi_score text not null check (roi_score in ('High', 'Medium', 'Low')),
  necessity text not null check (necessity in ('AI Essential', 'AI Recommended', 'Hybrid', 'Rule-Based Preferred'))
);

create table if not exists public.users (
  id text primary key,
  name text not null,
  email text not null,
  role text not null,
  status text not null check (status in ('Active', 'Pending'))
);

-- 2. Enable Row Level Security (RLS)
alter table public.providers enable row level security;
alter table public.requests enable row level security;
alter table public.policies enable row level security;
alter table public.budgets enable row level security;
alter table public.recommendations enable row level security;
alter table public.outcomes enable row level security;
alter table public.users enable row level security;

-- 3. Create RLS Policies for Anon/Public Access (Read & Write)
create policy "Allow public read" on public.providers for select using (true);
create policy "Allow public write" on public.providers for all using (true) with check (true);

create policy "Allow public read" on public.requests for select using (true);
create policy "Allow public write" on public.requests for all using (true) with check (true);

create policy "Allow public read" on public.policies for select using (true);
create policy "Allow public write" on public.policies for all using (true) with check (true);

create policy "Allow public read" on public.budgets for select using (true);
create policy "Allow public write" on public.budgets for all using (true) with check (true);

create policy "Allow public read" on public.recommendations for select using (true);
create policy "Allow public write" on public.recommendations for all using (true) with check (true);

create policy "Allow public read" on public.outcomes for select using (true);
create policy "Allow public write" on public.outcomes for all using (true) with check (true);

create policy "Allow public read" on public.users for select using (true);
create policy "Allow public write" on public.users for all using (true) with check (true);

-- 4. Initial Seed Data
insert into public.providers (id, name, status, api_key, models) values
('openai', 'OpenAI', 'connected', 'sk-proj-••••••••••••••••', ARRAY['gpt-4o', 'gpt-3.5-turbo']),
('anthropic', 'Anthropic', 'connected', 'sk-ant-••••••••••••••••', ARRAY['claude-3-5-sonnet', 'claude-3-haiku']),
('gemini', 'Gemini', 'connected', 'AIzaSy••••••••••••••••', ARRAY['gemini-1.5-flash', 'gemini-1.5-pro']),
('azure-openai', 'Azure OpenAI', 'disconnected', '', ARRAY['gpt-4-azure']),
('aws-bedrock', 'AWS Bedrock', 'disconnected', '', ARRAY['claude-3-sonnet-bedrock']),
('local', 'Local Inference', 'connected', 'local-key', ARRAY['llama-3-local'])
on conflict (id) do nothing;

insert into public.policies (id, name, description, type, active, action) values
('pol-pii', 'PII Protection (Anti-leakage)', 'Scan prompt text for SSN, credit cards, or emails. Flag and mask or block.', 'data_leakage', true, 'block'),
('pol-models', 'Approved Model Guardrails', 'Restrict production environments from using non-approved or premium cost models.', 'model_restriction', true, 'flag'),
('pol-residency', 'Data Residency Standard', 'Ensure customer data does not leave US region.', 'residency', false, 'flag')
on conflict (id) do nothing;

insert into public.budgets (team, limit_amount, spent) values
('Engineering', 25000, 0),
('Customer Success', 15000, 0),
('Marketing', 10000, 0),
('Product Design', 8000, 0),
('Research', 5000, 0)
on conflict (team) do nothing;

insert into public.recommendations (id, title, category, suggestion, savings, confidence, status, evidence) values
('rec-001', 'Transition Support Chatbot to Gemini 1.5 Flash', 'cost', 'The Support Chatbot workflow is currently running on Claude 3.5 Sonnet. Over 90% of requests are basic classification tasks. Transitioning to Gemini 1.5 Flash will reduce cost by ~85%.', 4500, 92, 'active', '90% of requests have < 3 sentences and output simple classification tags.'),
('rec-002', 'Configure rate-limiting on ContentGen-Agent keys', 'governance', 'The Marketing ContentGen-Agent generated 42% cost growth this week due to an infinite-loop bug in review code.', 1200, 98, 'active', 'Marketing team API key generated 150 requests/min between 2:00 AM and 4:00 AM on Sunday.'),
('rec-003', 'Enable Local Llama-3 for draft reviews', 'optimization', 'Engineering CI/CD review workflows are using GPT-4o for draft-stage reviews. Moving draft reviews to a local Llama-3 server is free.', 1800, 88, 'active', 'Draft review tasks do not require premium model capabilities.')
on conflict (id) do nothing;

insert into public.outcomes (id, workflow, department, metric_name, volume, cost_per_outcome, roi_score, necessity) values
('w-cs', 'Support Chatbot', 'Customer Success', 'Zendesk Tickets Resolved', 15400, 0.42, 'High', 'AI Essential'),
('w-eng', 'CI/CD Review', 'Engineering', 'PRs Reviewed', 8500, 0.15, 'Medium', 'AI Recommended'),
('w-mkt', 'Campaign Gen', 'Marketing', 'Campaign Drafts Generated', 1200, 0.35, 'Low', 'Rule-Based Preferred'),
('w-res', 'Paper Analysis', 'Research', 'Papers Processed', 450, 0.00, 'High', 'Hybrid')
on conflict (id) do nothing;

insert into public.users (id, name, email, role, status) values
('u1', 'Sarah Jenkins', 'sarah.jenkins@peek.ai', 'Super Admin', 'Active'),
('u2', 'James Carter', 'j.carter@peek.ai', 'Governance Manager', 'Active'),
('u3', 'Elena Rostova', 'e.rostova@peek.ai', 'Viewer', 'Active')
on conflict (id) do nothing;
