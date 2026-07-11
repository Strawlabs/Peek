/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  apiKey: string;
  models: string[];
}

export interface TelemetryRequest {
  id: string;
  provider: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost: number;
  latency: number;
  timestamp: number;
  team: string;
  project: string;
  department: string;
  workflow: string;
  customer: string;
  prompt: string;
  response: string;
  status: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  type: string;
  active: boolean;
  action: 'block' | 'flag';
}

export interface Budget {
  limit: number;
  spent: number;
}

export interface Recommendation {
  id: string;
  title: string;
  category: string;
  suggestion: string;
  savings: number;
  confidence: number;
  status: 'active' | 'applied' | 'dismissed';
  evidence: string;
}

export interface Outcome {
  id: string;
  workflow: string;
  department: string;
  metricName: string;
  volume: number;
  costPerOutcome: number;
  roiScore: 'High' | 'Medium' | 'Low';
  necessity: 'AI Essential' | 'AI Recommended' | 'Hybrid' | 'Rule-Based Preferred';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending';
}

export interface Notification {
  channel: 'slack' | 'teams' | 'system';
  type: 'pii' | 'budget' | 'policy' | 'test';
  title: string;
  body: string;
  destination: string;
  timestamp: number;
}

export interface ChannelConfig {
  id: 'slack' | 'teams';
  name: string;
  webhookUrl: string;
  targetChannel: string;
  connected: boolean;
}

export interface EnterpriseIntegration {
  id: 'datadog' | 'jira' | 'snowflake' | 'pagerduty';
  name: string;
  desc: string;
  icon: string;
  connected: boolean;
  config: Record<string, string>;
}


// ─── Pricing lookup (no mock data — used only for cost calculations) ──────────

export const PROVIDER_PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    'gpt-4o': { input: 5.00, output: 15.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
  },
  anthropic: {
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 }
  },
  gemini: {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 }
  },
  'azure-openai': {
    'gpt-4-azure': { input: 10.00, output: 30.00 }
  },
  'aws-bedrock': {
    'claude-3-sonnet-bedrock': { input: 3.00, output: 15.00 }
  },
  local: {
    'llama-3-local': { input: 0.00, output: 0.00 }
  }
};

// ─── Seed data — only used when tables are empty (runs once per fresh DB) ─────

const SEED_PROVIDERS: Provider[] = [
  { id: 'openai',      name: 'OpenAI',           status: 'connected',    apiKey: 'sk-proj-••••••••••••••••', models: ['gpt-4o', 'gpt-3.5-turbo'] },
  { id: 'anthropic',   name: 'Anthropic',         status: 'connected',    apiKey: 'sk-ant-••••••••••••••••',  models: ['claude-3-5-sonnet', 'claude-3-haiku'] },
  { id: 'gemini',      name: 'Gemini',            status: 'connected',    apiKey: 'AIzaSy••••••••••••••••',   models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
  { id: 'azure-openai',name: 'Azure OpenAI',      status: 'disconnected', apiKey: '',                         models: ['gpt-4-azure'] },
  { id: 'aws-bedrock', name: 'AWS Bedrock',       status: 'disconnected', apiKey: '',                         models: ['claude-3-sonnet-bedrock'] },
  { id: 'local',       name: 'Local Inference',   status: 'connected',    apiKey: 'local-key',                models: ['llama-3-local'] }
];

const SEED_POLICIES: Policy[] = [
  { id: 'pol-pii',      name: 'PII Protection (Anti-leakage)',  description: 'Scan prompt text for SSN, credit cards, or emails. Flag and mask or block.', type: 'data_leakage',      active: true,  action: 'block' },
  { id: 'pol-models',   name: 'Approved Model Guardrails',      description: 'Restrict production environments from using non-approved or premium cost models.', type: 'model_restriction', active: true,  action: 'flag'  },
  { id: 'pol-residency',name: 'Data Residency Standard',        description: 'Ensure customer data does not leave US region.', type: 'residency', active: false, action: 'flag'  }
];

const SEED_BUDGETS = [
  { team: 'Engineering',     limit_amount: 25000, spent: 0 },
  { team: 'Customer Success', limit_amount: 15000, spent: 0 },
  { team: 'Marketing',       limit_amount: 10000, spent: 0 },
  { team: 'Product Design',  limit_amount: 8000,  spent: 0 },
  { team: 'Research',        limit_amount: 5000,  spent: 0 }
];

const SEED_RECOMMENDATIONS: Recommendation[] = [
  { id: 'rec-001', title: 'Transition Support Chatbot to Gemini 1.5 Flash', category: 'cost', suggestion: 'The Support Chatbot workflow is currently running on Claude 3.5 Sonnet. Over 90% of requests are basic classification tasks. Transitioning to Gemini 1.5 Flash will reduce cost by ~85%.', savings: 4500, confidence: 92, status: 'active', evidence: '90% of requests have < 3 sentences and output simple classification tags.' },
  { id: 'rec-002', title: 'Configure rate-limiting on ContentGen-Agent keys', category: 'governance', suggestion: 'The Marketing ContentGen-Agent generated 42% cost growth this week due to an infinite-loop bug in review code.', savings: 1200, confidence: 98, status: 'active', evidence: 'Marketing team API key generated 150 requests/min between 2:00 AM and 4:00 AM on Sunday.' },
  { id: 'rec-003', title: 'Enable Local Llama-3 for draft reviews', category: 'optimization', suggestion: 'Engineering CI/CD review workflows are using GPT-4o for draft-stage reviews. Moving draft reviews to a local Llama-3 server is free.', savings: 1800, confidence: 88, status: 'active', evidence: 'Draft review tasks do not require premium model capabilities.' }
];

const SEED_OUTCOMES = [
  { id: 'w-cs',  workflow: 'Support Chatbot', department: 'Customer Success', metric_name: 'Zendesk Tickets Resolved',  volume: 15400, cost_per_outcome: 0.42, roi_score: 'High',   necessity: 'AI Essential'           },
  { id: 'w-eng', workflow: 'CI/CD Review',    department: 'Engineering',      metric_name: 'PRs Reviewed',              volume: 8500,  cost_per_outcome: 0.15, roi_score: 'Medium', necessity: 'AI Recommended'         },
  { id: 'w-mkt', workflow: 'Campaign Gen',    department: 'Marketing',        metric_name: 'Campaign Drafts Generated', volume: 1200,  cost_per_outcome: 0.35, roi_score: 'Low',    necessity: 'Rule-Based Preferred'   },
  { id: 'w-res', workflow: 'Paper Analysis',  department: 'Research',         metric_name: 'Papers Processed',          volume: 450,   cost_per_outcome: 0.00, roi_score: 'High',   necessity: 'Hybrid'                 }
];

const SEED_USERS: User[] = [
  { id: 'u1', name: 'Sarah Jenkins', email: 'sarah.jenkins@peek.ai', role: 'Super Admin',        status: 'Active' },
  { id: 'u2', name: 'James Carter',  email: 'j.carter@peek.ai',      role: 'Governance Manager', status: 'Active' },
  { id: 'u3', name: 'Elena Rostova', email: 'e.rostova@peek.ai',     role: 'Viewer',             status: 'Active' }
];

// ─── Telemetry seeder — generates demo requests using providers from DB ───────

function generateSeedRequests(dbProviders: Provider[]): { requests: TelemetryRequest[]; budgetSpend: Record<string, number> } {
  const days = 30;
  const teams = ['Engineering', 'Customer Success', 'Marketing', 'Product Design', 'Research'];
  const departments: Record<string, string> = {
    'Engineering': 'R&D', 'Customer Success': 'Operations',
    'Marketing': 'GTM', 'Product Design': 'R&D', 'Research': 'R&D'
  };
  const workflows: Record<string, string[]> = {
    'Engineering': ['CI/CD Review', 'Code Autocomplete', 'Doc Synthesis'],
    'Customer Success': ['Email Triage', 'Support Chatbot', 'FAQ Search'],
    'Marketing': ['Campaign Gen', 'Copywriting Drafts', 'SEO Tagging'],
    'Product Design': ['UI Layout Copy', 'Design Reviews'],
    'Research': ['Paper Analysis', 'Literature Review']
  };
  const customers = ['Alphabet Corp', 'Stripe Inc', 'Vercel Group', 'None'];
  const connectedProviders = dbProviders.filter(p => p.status === 'connected');
  if (connectedProviders.length === 0) return { requests: [], budgetSpend: {} };

  const newRequests: TelemetryRequest[] = [];
  const budgetSpend: Record<string, number> = {};
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalRequests = days * 30;

  for (let i = 0; i < totalRequests; i++) {
    const timestamp = now - Math.random() * days * msPerDay;
    const team = teams[Math.floor(Math.random() * teams.length)];
    const department = departments[team];
    const workflow = workflows[team][Math.floor(Math.random() * workflows[team].length)];
    const prov = connectedProviders[Math.floor(Math.random() * connectedProviders.length)];
    const model = prov.models[Math.floor(Math.random() * prov.models.length)];
    const tokensIn = Math.floor(Math.random() * 5000) + 100;
    const tokensOut = Math.floor(Math.random() * 2000) + 50;
    const rates = PROVIDER_PRICING[prov.id]?.[model] || { input: 0, output: 0 };
    const cost = parseFloat((((tokensIn * rates.input) + (tokensOut * rates.output)) / 1_000_000).toFixed(6));
    let baseLatency = 0.5;
    if (model.includes('flash') || model.includes('haiku') || model.includes('3.5-turbo') || model.includes('local')) baseLatency = 0.15;
    else if (model.includes('pro') || model.includes('gpt-4o') || model.includes('sonnet')) baseLatency = 1.6;
    const latency = parseFloat((baseLatency + Math.random() * 1.2).toFixed(2));
    let status = 'Optimal';
    const violatesPII = Math.random() < 0.02;
    const violatesModel = model === 'gpt-4o' && team === 'Marketing' && Math.random() < 0.05;
    if (violatesPII) status = 'PII Leak Flagged';
    else if (violatesModel) status = 'Policy Flagged';
    else if (cost > 0.05) status = 'High Cost';
    const prompt = violatesPII
      ? `Retrieve user email user_id_33@gmail.com and process credit card 4111-2222-3333-4444...`
      : `Process workflow tasks for ${workflow}`;
    newRequests.push({
      id: 'req-' + Math.random().toString(36).substring(2, 11),
      provider: prov.id, model, tokens_in: tokensIn, tokens_out: tokensOut,
      cost, latency, timestamp, team,
      project: 'Project-' + ['Phoenix', 'Sentinel', 'Keystone', 'Nebula'][Math.floor(Math.random() * 4)],
      department, workflow, customer: customers[Math.floor(Math.random() * customers.length)],
      prompt, response: `Simulated response from ${model}. Processed ${tokensIn + tokensOut} tokens in ${latency}s.`, status
    });
    budgetSpend[team] = (budgetSpend[team] || 0) + cost;
  }
  newRequests.sort((a, b) => a.timestamp - b.timestamp);
  return { requests: newRequests, budgetSpend };
}

// ─── Helper: map provider row from DB ────────────────────────────────────────

function mapProvider(p: Record<string, unknown>): Provider {
  return {
    id: p.id as string,
    name: p.name as string,
    status: (p.status as string) as 'connected' | 'disconnected',
    apiKey: (p.api_key as string) || '',
    models: (p.models as string[]) || []
  };
}

function mapOutcome(o: Record<string, unknown>): Outcome {
  return {
    id: o.id as string,
    workflow: o.workflow as string,
    department: o.department as string,
    metricName: o.metric_name as string,
    volume: o.volume as number,
    costPerOutcome: Number(o.cost_per_outcome),
    roiScore: o.roi_score as 'High' | 'Medium' | 'Low',
    necessity: o.necessity as Outcome['necessity']
  };
}

// ─── Context type ─────────────────────────────────────────────────────────────

interface StateContextType {
  providers: Provider[];
  requests: TelemetryRequest[];
  policies: Policy[];
  budgets: Record<string, Budget>;
  recommendations: Recommendation[];
  outcomes: Outcome[];
  users: User[];
  notifications: Notification[];
  channels: ChannelConfig[];
  enterpriseIntegrations: EnterpriseIntegration[];
  loading: boolean;
  error: string | null;
  updateBudgetLimit: (team: string, limit: number) => Promise<void>;
  togglePolicy: (id: string) => Promise<void>;
  addPolicy: (name: string, description: string, type: string, action: 'block' | 'flag') => Promise<void>;
  applyRecommendation: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  toggleProvider: (id: string, apiKey?: string) => Promise<void>;
  inviteUser: (name: string, email: string, role: string) => Promise<void>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (id: string, role: string) => Promise<void>;
  activateUser: (id: string) => Promise<void>;
  sendTestNotification: (channelId: 'slack' | 'teams', channelName: string, destination: string) => Promise<void>;
  updateChannelConfig: (id: 'slack' | 'teams', webhookUrl: string, targetChannel: string, connected: boolean) => void;
  updateEnterpriseIntegration: (id: 'datadog' | 'jira' | 'snowflake' | 'pagerduty', connected: boolean, config: Record<string, string>) => void;
  routeGatewayRequest: (
    prompt: string, provider: string, model: string,
    team: string, environment: string, workflow: string, customer: string
  ) => Promise<{ success: boolean; trace: string[]; cost: number; tokens: number; latency: number }>;
  resetSystemState: () => Promise<void>;
  authSession: any | null;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ success: boolean; error: string | null }>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [requests, setRequests] = useState<TelemetryRequest[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [budgets, setBudgets] = useState<Record<string, Budget>>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<any | null>(null);

  const [channels, setChannels] = useState<ChannelConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('peek_notification_channels');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse channels from localStorage', e);
        }
      }
    }
    return [
      {
        id: 'slack',
        name: 'Slack Alerts',
        webhookUrl: '',
        targetChannel: '#governance-alerts',
        connected: false,
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        webhookUrl: '',
        targetChannel: 'AI Governance',
        connected: false,
      },
    ];
  });

  const updateChannelConfig = (id: 'slack' | 'teams', webhookUrl: string, targetChannel: string, connected: boolean) => {
    setChannels(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, webhookUrl, targetChannel, connected } : c);
      localStorage.setItem('peek_notification_channels', JSON.stringify(updated));
      return updated;
    });
  };

  const [enterpriseIntegrations, setEnterpriseIntegrations] = useState<EnterpriseIntegration[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('peek_enterprise_integrations');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse enterprise integrations', e);
        }
      }
    }
    return [
      { id: 'datadog', name: 'Datadog', desc: 'Export telemetry metrics to Datadog dashboards.', icon: 'monitoring', connected: false, config: { apiKey: '', site: 'datadoghq.com' } },
      { id: 'jira', name: 'Jira', desc: 'Auto-create tickets for policy violations and cost anomalies.', icon: 'bug_report', connected: false, config: { siteUrl: '', email: '', apiToken: '' } },
      { id: 'snowflake', name: 'Snowflake', desc: 'Sync AI spend data to your data warehouse.', icon: 'cloud', connected: true, config: { account: 'sf-demo-123', username: 'PEEK_SYNC', password: '••••••••••••' } },
      { id: 'pagerduty', name: 'PagerDuty', desc: 'Escalate critical governance incidents to on-call teams.', icon: 'notification_important', connected: false, config: { routingKey: '' } },
    ];
  });

  const updateEnterpriseIntegration = (id: 'datadog' | 'jira' | 'snowflake' | 'pagerduty', connected: boolean, config: Record<string, string>) => {
    setEnterpriseIntegrations(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, connected, config } : item);
      localStorage.setItem('peek_enterprise_integrations', JSON.stringify(updated));
      return updated;
    });
  };

  // ─── Helper: push a simulated notification ────────────────────────────────
  const pushNotification = (n: Omit<Notification, 'timestamp'>) => {
    setNotifications(prev => [...prev, { ...n, timestamp: Date.now() }]);
  };

  const dispatchNotification = (
    type: 'pii' | 'budget' | 'policy',
    title: string,
    body: string,
    defaultSlackChannel: string,
    defaultTeamsChannel: string
  ) => {
    const slackChan = channels.find(c => c.id === 'slack');
    if (slackChan?.connected) {
      pushNotification({
        channel: 'slack',
        type,
        title,
        body,
        destination: slackChan.targetChannel || defaultSlackChannel,
      });
    }

    const teamsChan = channels.find(c => c.id === 'teams');
    if (teamsChan?.connected) {
      pushNotification({
        channel: 'teams',
        type,
        title,
        body,
        destination: teamsChan.targetChannel || defaultTeamsChannel,
      });
    }

    if (!slackChan?.connected && !teamsChan?.connected) {
      pushNotification({
        channel: 'system',
        type,
        title: `[System] ${title}`,
        body: `${body} (No external notification channels connected)`,
        destination: 'System Log',
      });
    }
  };

  // ─── 1. Initial load from Supabase + seed empty tables ─────────────────────

  useEffect(() => {
    const loadState = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          { data: pData,   error: pErr   },
          { data: rData,   error: rErr   },
          { data: polData, error: polErr },
          { data: bData,   error: bErr   },
          { data: recData, error: recErr },
          { data: oData,   error: oErr   },
          { data: uData,   error: uErr   }
        ] = await Promise.all([
          supabase.from('providers').select('*'),
          supabase.from('requests').select('*').order('timestamp', { ascending: true }),
          supabase.from('policies').select('*'),
          supabase.from('budgets').select('*'),
          supabase.from('recommendations').select('*'),
          supabase.from('outcomes').select('*'),
          supabase.from('users').select('*')
        ]);

        // Surface any critical DB error
        const criticalError = pErr || polErr || bErr;
        if (criticalError) {
          throw new Error(`Database connection failed: ${criticalError.message}`);
        }
        if (rErr) console.warn('requests fetch warning:', rErr.message);
        if (recErr) console.warn('recommendations fetch warning:', recErr.message);
        if (oErr) console.warn('outcomes fetch warning:', oErr.message);
        if (uErr) console.warn('users fetch warning:', uErr.message);

        // ── Seed providers if empty ──────────────────────────────────────────
        let liveProviders: Provider[] = (pData || []).map(p => mapProvider(p as Record<string, unknown>));
        if (liveProviders.length === 0) {
          const { data: seeded, error: seedPErr } = await supabase
            .from('providers')
            .insert(SEED_PROVIDERS.map(p => ({ id: p.id, name: p.name, status: p.status, api_key: p.apiKey, models: p.models })))
            .select();
          if (seedPErr) console.warn('Provider seed error:', seedPErr.message);
          liveProviders = (seeded || SEED_PROVIDERS).map(p => mapProvider(p as Record<string, unknown>));
        }
        setProviders(liveProviders);

        // ── Seed policies if empty ───────────────────────────────────────────
        let livePolicies: Policy[] = (polData || []) as Policy[];
        if (livePolicies.length === 0) {
          const { data: seededPol, error: seedPolErr } = await supabase
            .from('policies').insert(SEED_POLICIES).select();
          if (seedPolErr) console.warn('Policy seed error:', seedPolErr.message);
          livePolicies = (seededPol || SEED_POLICIES) as Policy[];
        }
        setPolicies(livePolicies);

        // ── Seed budgets if empty ────────────────────────────────────────────
        let liveBudgets: Record<string, Budget> = {};
        let budgetRows = bData || [];
        if (budgetRows.length === 0) {
          const { data: seededB, error: seedBErr } = await supabase
            .from('budgets').insert(SEED_BUDGETS).select();
          if (seedBErr) console.warn('Budget seed error:', seedBErr.message);
          budgetRows = seededB || SEED_BUDGETS;
        }
        budgetRows.forEach((b: Record<string, unknown>) => {
          liveBudgets[b.team as string] = { limit: Number(b.limit_amount), spent: Number(b.spent) };
        });
        setBudgets(liveBudgets);

        // ── Seed recommendations if empty ────────────────────────────────────
        let liveRecs: Recommendation[] = (recData || []) as Recommendation[];
        if (liveRecs.length === 0) {
          const { data: seededRec, error: seedRecErr } = await supabase
            .from('recommendations').insert(SEED_RECOMMENDATIONS).select();
          if (seedRecErr) console.warn('Recommendations seed error:', seedRecErr.message);
          liveRecs = (seededRec || SEED_RECOMMENDATIONS) as Recommendation[];
        }
        setRecommendations(liveRecs);

        // ── Seed outcomes if empty ───────────────────────────────────────────
        let liveOutcomes: Outcome[] = oData ? oData.map(o => mapOutcome(o as Record<string, unknown>)) : [];
        if (liveOutcomes.length === 0) {
          const { data: seededO, error: seedOErr } = await supabase
            .from('outcomes').insert(SEED_OUTCOMES).select();
          if (seedOErr) console.warn('Outcomes seed error:', seedOErr.message);
          liveOutcomes = (seededO || SEED_OUTCOMES).map(o => mapOutcome(o as Record<string, unknown>));
        }
        setOutcomes(liveOutcomes);

        // ── Seed users if empty ──────────────────────────────────────────────
        let liveUsers: User[] = (uData || []) as User[];
        if (liveUsers.length === 0) {
          const { data: seededU, error: seedUErr } = await supabase
            .from('users').insert(SEED_USERS).select();
          if (seedUErr) console.warn('Users seed error:', seedUErr.message);
          liveUsers = (seededU || SEED_USERS) as User[];
        }
        setUsers(liveUsers);

        // ── Seed telemetry requests if empty (uses live providers from DB) ───
        let liveRequests: TelemetryRequest[] = (rData || []) as TelemetryRequest[];
        if (liveRequests.length === 0 && liveProviders.some(p => p.status === 'connected')) {
          console.log('[Peek] Seeding historical telemetry requests into Supabase...');
          const { requests: seedReqs, budgetSpend } = generateSeedRequests(liveProviders);
          const batchSize = 300;
          for (let i = 0; i < seedReqs.length; i += batchSize) {
            const { error: insErr } = await supabase.from('requests').insert(seedReqs.slice(i, i + batchSize));
            if (insErr) console.warn('Request batch seed error:', insErr.message);
          }
          // Update budget spend totals
          for (const team in budgetSpend) {
            const newSpent = (liveBudgets[team]?.spent || 0) + budgetSpend[team];
            await supabase.from('budgets').update({ spent: newSpent }).eq('team', team);
            liveBudgets = { ...liveBudgets, [team]: { ...liveBudgets[team], spent: newSpent } };
          }
          setBudgets({ ...liveBudgets });
          liveRequests = seedReqs;
        }
        setRequests(liveRequests);

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown database error';
        console.error('[Peek] Fatal load error:', msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, []);

  // ─── 2. Realtime subscriptions for ALL tables ───────────────────────────────

  useEffect(() => {
    // Requests — INSERT only (they're append-only)
    const requestsCh = supabase
      .channel('rt-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
        const r = payload.new as TelemetryRequest;
        setRequests(prev => prev.some(x => x.id === r.id) ? prev : [...prev, r]);
      })
      .subscribe();

    // Budgets — UPDATE
    const budgetsCh = supabase
      .channel('rt-budgets')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'budgets' }, (payload) => {
        const b = payload.new as { team: string; limit_amount: number; spent: number };
        setBudgets(prev => ({ ...prev, [b.team]: { limit: Number(b.limit_amount), spent: Number(b.spent) } }));
      })
      .subscribe();

    // Policies — INSERT + UPDATE
    const policiesCh = supabase
      .channel('rt-policies')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'policies' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const p = payload.new as Policy;
          setPolicies(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p]);
        } else if (payload.eventType === 'UPDATE') {
          const p = payload.new as Policy;
          setPolicies(prev => prev.map(x => x.id === p.id ? p : x));
        } else if (payload.eventType === 'DELETE') {
          const p = payload.old as Policy;
          setPolicies(prev => prev.filter(x => x.id !== p.id));
        }
      })
      .subscribe();

    // Providers — UPDATE
    const providersCh = supabase
      .channel('rt-providers')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'providers' }, (payload) => {
        const p = mapProvider(payload.new as Record<string, unknown>);
        setProviders(prev => prev.map(x => x.id === p.id ? p : x));
      })
      .subscribe();

    // Recommendations — UPDATE
    const recsCh = supabase
      .channel('rt-recommendations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recommendations' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const r = payload.new as Recommendation;
          setRecommendations(prev => prev.map(x => x.id === r.id ? r : x));
        } else if (payload.eventType === 'INSERT') {
          const r = payload.new as Recommendation;
          setRecommendations(prev => prev.some(x => x.id === r.id) ? prev : [...prev, r]);
        }
      })
      .subscribe();

    // Users — full CRUD
    const usersCh = supabase
      .channel('rt-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const u = payload.new as User;
          setUsers(prev => prev.some(x => x.id === u.id) ? prev : [...prev, u]);
        } else if (payload.eventType === 'UPDATE') {
          const u = payload.new as User;
          setUsers(prev => prev.map(x => x.id === u.id ? u : x));
        } else if (payload.eventType === 'DELETE') {
          const u = payload.old as User;
          setUsers(prev => prev.filter(x => x.id !== u.id));
        }
      })
      .subscribe();

    // Outcomes — UPDATE
    const outcomesCh = supabase
      .channel('rt-outcomes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'outcomes' }, (payload) => {
        setOutcomes(prev => prev.map(x => x.id === (payload.new as Record<string, unknown>).id
          ? mapOutcome(payload.new as Record<string, unknown>) : x));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsCh);
      supabase.removeChannel(budgetsCh);
      supabase.removeChannel(policiesCh);
      supabase.removeChannel(providersCh);
      supabase.removeChannel(recsCh);
      supabase.removeChannel(usersCh);
      supabase.removeChannel(outcomesCh);
    };
  }, []);

  // ─── Auth State Listener ───────────────────────────────────────────────────
  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthSession(session?.user ?? null);
      if (session?.user) {
        handleStatusTransition(session.user);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthSession(session?.user ?? null);
      if (session?.user) {
        handleStatusTransition(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [users]);

  // Helper to transition Pending user to Active upon signing in.
  // If the email isn't in the users table at all, create them on the fly
  // so they're never locked out of the app.
  const handleStatusTransition = async (authUser: any) => {
    const email = authUser.email?.toLowerCase();
    if (!email) return;

    // Look up user by email in the public users table
    const matchingUser = users.find(u => u.email.toLowerCase() === email);

    if (matchingUser) {
      if (matchingUser.status === 'Pending') {
        console.log(`[Peek] Transitioning user ${matchingUser.email} from Pending to Active (Auth event detected)`);
        // Update locally
        setUsers(prev => prev.map(u => u.id === matchingUser.id ? { ...u, status: 'Active' as const, id: authUser.id } : u));
        // Update in DB (also update the ID to match the auth.users ID if it was random before)
        await supabase.from('users').update({ status: 'Active', id: authUser.id }).eq('email', matchingUser.email);
      }
      // Already Active — nothing to do
    } else {
      // Email not in Users & Permissions table — auto-create so they can access the app
      console.log(`[Peek] Unknown email ${email} signed in — auto-creating user record as Active/Viewer`);
      const newUser = {
        id: authUser.id,
        name: authUser.user_metadata?.name || email.split('@')[0],
        email: authUser.email,
        role: (authUser.user_metadata?.role as string) || 'Viewer',
        status: 'Active' as const,
      };
      setUsers(prev => [...prev, newUser]);
      await supabase.from('users').upsert(newUser, { onConflict: 'email' });
    }
  };


  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthSession(null);
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.error('[Peek] Failed to update password:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  };

  // ─── CRUD Operations (optimistic + Supabase write + rollback on error) ──────

  const updateBudgetLimit = async (team: string, limit: number) => {
    const prev = budgets[team];
    setBudgets(b => ({ ...b, [team]: { ...b[team], limit } }));
    const { error } = await supabase.from('budgets').update({ limit_amount: limit }).eq('team', team);
    if (error) {
      console.error('updateBudgetLimit failed:', error.message);
      setBudgets(b => ({ ...b, [team]: prev })); // rollback
    }
  };

  const togglePolicy = async (id: string) => {
    const policy = policies.find(p => p.id === id);
    if (!policy) return;
    const nextActive = !policy.active;
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, active: nextActive } : p));
    const { error } = await supabase.from('policies').update({ active: nextActive }).eq('id', id);
    if (error) {
      console.error('togglePolicy failed:', error.message);
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, active: policy.active } : p)); // rollback
    }
  };

  const addPolicy = async (name: string, description: string, type: string, action: 'block' | 'flag') => {
    const newPolicy: Policy = {
      id: 'pol-' + Math.random().toString(36).substring(2, 7),
      name, description, type, active: true, action
    };
    setPolicies(prev => [...prev, newPolicy]);
    const { error } = await supabase.from('policies').insert(newPolicy);
    if (error) {
      console.error('addPolicy failed:', error.message);
      setPolicies(prev => prev.filter(p => p.id !== newPolicy.id)); // rollback
    }
  };

  const applyRecommendation = async (id: string) => {
    const prev = recommendations.find(r => r.id === id);
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status: 'applied' as const } : r));
    const { error } = await supabase.from('recommendations').update({ status: 'applied' }).eq('id', id);
    if (error) {
      console.error('applyRecommendation failed:', error.message);
      if (prev) setRecommendations(recs => recs.map(r => r.id === id ? prev : r));
    }
  };

  const dismissRecommendation = async (id: string) => {
    const prev = recommendations.find(r => r.id === id);
    setRecommendations(recs => recs.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r));
    const { error } = await supabase.from('recommendations').update({ status: 'dismissed' }).eq('id', id);
    if (error) {
      console.error('dismissRecommendation failed:', error.message);
      if (prev) setRecommendations(recs => recs.map(r => r.id === id ? prev : r));
    }
  };

  const toggleProvider = async (id: string, apiKey?: string) => {
    const prevProviders = providers;
    let nextStatus: 'connected' | 'disconnected' = 'connected';
    let nextApiKey = '';
    const updated = providers.map(p => {
      if (p.id !== id) return p;
      nextStatus = p.status === 'connected' ? 'disconnected' : 'connected';
      nextApiKey = apiKey !== undefined ? apiKey : (nextStatus === 'connected' ? 'sk-new-••••••••••••••••' : '');
      return { ...p, status: nextStatus, apiKey: nextApiKey };
    });
    setProviders(updated);
    const { error } = await supabase.from('providers').update({ status: nextStatus, api_key: nextApiKey }).eq('id', id);
    if (error) {
      console.error('toggleProvider failed:', error.message);
      setProviders(prevProviders); // rollback
    }
  };

  const inviteUser = async (name: string, email: string, role: string) => {
    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 7),
      name, email, role, status: 'Pending'
    };
    setUsers(prev => [...prev, newUser]);
    const { error } = await supabase.from('users').insert(newUser);
    if (error) {
      console.error('inviteUser failed:', error.message);
      setUsers(prev => prev.filter(u => u.id !== newUser.id)); // rollback
    }
  };

  const deleteUser = async (id: string) => {
    const prev = users;
    setUsers(prev => prev.filter(u => u.id !== id));
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('deleteUser failed:', error.message);
      setUsers(prev); // rollback
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const updateUserRole = async (id: string, role: string) => {
    const prev = users.find(u => u.id === id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    const { error } = await supabase.from('users').update({ role }).eq('id', id);
    if (error) {
      console.error('updateUserRole failed:', error.message);
      if (prev) setUsers(us => us.map(u => u.id === id ? prev : u));
    }
  };

  const activateUser = async (id: string) => {
    const prev = users.find(u => u.id === id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'Active' as const } : u));
    const { error } = await supabase.from('users').update({ status: 'Active' }).eq('id', id);
    if (error) {
      console.error('activateUser failed:', error.message);
      if (prev) setUsers(us => us.map(u => u.id === id ? prev : u));
    }
  };

  // ─── Notification channel actions ─────────────────────────────────────────

  const sendTestNotification = async (
    channelId: 'slack' | 'teams',
    channelName: string,
    destination: string
  ) => {
    pushNotification({
      channel: channelId,
      type: 'test',
      title: `Test Alert from Peek`,
      body: `This is a simulated test notification from the Peek AI Governance Platform. Your ${channelName} integration is working correctly.`,
      destination,
    });
  };

  // ─── Gateway simulation — logs every routed request to Supabase ─────────────

  const routeGatewayRequest = async (
    prompt: string, provider: string, model: string,
    team: string, environment: string, workflow: string, customer: string
  ) => {
    const trace: string[] = [];
    trace.push(`[SYSTEM] Intercepted raw HTTP request routed to /v1/chat/completions`);
    trace.push(`[GATEWAY] Extracting metadata headers: Team=${team}, Env=${environment}, Workflow=${workflow}`);

    let status = 'Optimal';
    let blockRequest = false;
    const piiPolicy = policies.find(p => p.id === 'pol-pii');

    if (piiPolicy?.active) {
      trace.push(`[POLICY] Running '${piiPolicy.name}' scan on prompt contents...`);
      const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(prompt);
      const hasCard = /\b(?:\d[ -]*?){13,16}\b/.test(prompt);
      const hasSSN = /\b\d{3}-\d{2}-\d{4}\b/.test(prompt);
      if (hasEmail || hasCard || hasSSN) {
        const piiKind = hasEmail ? 'Email address' : hasCard ? 'Credit card number' : 'SSN';
        trace.push(`[WARNING] PII detected: ${piiKind}`);
        if (piiPolicy.action === 'block') {
          blockRequest = true; status = 'PII Leak Blocked';
          trace.push(`[BLOCK] Gateway terminating connection immediately.`);
          // Fire alert notification
          dispatchNotification(
            'pii',
            `🔴 PII Leak Blocked — ${team}`,
            `${piiKind} detected in a ${workflow} request from ${team}. Gateway blocked the request. Workflow: ${workflow}.`,
            '#governance-alerts',
            'AI Governance'
          );
        } else {
          status = 'PII Leak Flagged';
          trace.push(`[FLAG] Audit log updated.`);
          dispatchNotification(
            'pii',
            `⚠️ PII Flagged — ${team}`,
            `${piiKind} detected in a ${workflow} request from ${team} and flagged for review.`,
            '#governance-alerts',
            'AI Governance'
          );
        }
      } else { trace.push(`[POLICY] PII scan passed.`); }
    }

    const modelPolicy = policies.find(p => p.id === 'pol-models');
    if (!blockRequest && modelPolicy?.active) {
      trace.push(`[POLICY] Running '${modelPolicy.name}' constraints...`);
      if (model === 'gpt-4o' && team === 'Marketing') {
        trace.push(`[WARNING] Model restriction violated: Marketing → gpt-4o not permitted.`);
        if (modelPolicy.action === 'block') {
          blockRequest = true; status = 'Policy Blocked';
          trace.push(`[BLOCK] Connection rejected.`);
          dispatchNotification(
            'policy',
            `🚫 Policy Blocked — Model Restriction`,
            `Marketing team attempted to use gpt-4o which is not permitted under Approved Model Guardrails. Request blocked.`,
            '#governance-alerts',
            'AI Governance'
          );
        } else {
          status = 'Policy Flagged';
          trace.push(`[FLAG] Violation flagged.`);
          dispatchNotification(
            'policy',
            `⚠️ Policy Violation Flagged`,
            `Marketing team used gpt-4o in violation of model restriction policy. Flagged for audit.`,
            '#governance-alerts',
            'AI Governance'
          );
        }
      } else { trace.push(`[POLICY] Model constraint checks passed.`); }
    }

    const pricing = PROVIDER_PRICING[provider]?.[model] || { input: 0, output: 0 };
    const tokensIn = Math.floor(prompt.length / 4) + 12;
    const tokensOut = blockRequest ? 0 : Math.floor(Math.random() * 400) + 100;
    const calculatedCost = blockRequest ? 0 : parseFloat((((tokensIn * pricing.input) + (tokensOut * pricing.output)) / 1_000_000).toFixed(6));
    let baseLatency = 0.4;
    if (model.includes('flash') || model.includes('haiku') || model.includes('local')) baseLatency = 0.15;
    else if (model.includes('pro') || model.includes('gpt-4o') || model.includes('sonnet')) baseLatency = 1.2;
    const finalLatency = blockRequest ? 0.02 : parseFloat((baseLatency + Math.random() * 0.4).toFixed(2));

    if (!blockRequest) {
      const teamBudget = budgets[team];
      if (teamBudget && (teamBudget.spent + calculatedCost) > teamBudget.limit) {
        trace.push(`[WARNING] Budget limit exceeded for ${team}: $${(teamBudget.spent + calculatedCost).toFixed(2)} / $${teamBudget.limit}`);
        dispatchNotification(
          'budget',
          `💸 Budget Exceeded — ${team}`,
          `${team} has exceeded their AI spend limit. Used: $${(teamBudget.spent + calculatedCost).toFixed(2)} of $${teamBudget.limit.toFixed(2)} allocated budget.`,
          '#budget-warnings',
          'Budget Alerts'
        );
      }
      trace.push(`[ATTRIBUTION] input_tokens=${tokensIn}, output_tokens=${tokensOut}`);
      trace.push(`[PROXY] Contacting ${provider}/${model}...`);
      trace.push(`[PROXY] Response received in ${finalLatency}s. Cost: $${calculatedCost.toFixed(5)}`);
      trace.push(`[TELEMETRY] Logging outcome to Peek data lake.`);
    }

    const newRequest: TelemetryRequest = {
      id: 'req-' + Math.random().toString(36).substring(2, 11),
      provider, model, tokens_in: tokensIn, tokens_out: tokensOut,
      cost: calculatedCost, latency: finalLatency, timestamp: Date.now(),
      team, project: 'Project-' + ['Phoenix', 'Sentinel', 'Keystone', 'Nebula'][Math.floor(Math.random() * 4)],
      department: team === 'Engineering' || team === 'Research' || team === 'Product Design' ? 'R&D' : (team === 'Marketing' ? 'GTM' : 'Operations'),
      workflow, customer, prompt,
      response: blockRequest
        ? `ERROR 403: Request blocked by Peek Gateway.`
        : `Gateway routing response from ${provider}/${model}. Output tokens: ${tokensOut}.`,
      status
    };

    // Optimistic update
    setRequests(prev => [...prev, newRequest]);

    // Write to Supabase
    const { error: reqErr } = await supabase.from('requests').insert(newRequest);
    if (reqErr) {
      console.error('routeGatewayRequest insert failed:', reqErr.message);
      setRequests(prev => prev.filter(r => r.id !== newRequest.id)); // rollback
    }

    if (!blockRequest && budgets[team]) {
      const nextSpent = budgets[team].spent + calculatedCost;
      setBudgets(prev => ({ ...prev, [team]: { ...prev[team], spent: nextSpent } }));
      const { error: budErr } = await supabase.from('budgets').update({ spent: nextSpent }).eq('team', team);
      if (budErr) console.error('routeGatewayRequest budget update failed:', budErr.message);
    }

    return { success: !blockRequest, trace, cost: calculatedCost, tokens: tokensIn + tokensOut, latency: finalLatency };
  };

  // ─── Reset — wipe requests, re-seed from scratch ────────────────────────────

  const resetSystemState = async () => {
    try {
      setLoading(true);
      // Delete all requests
      await supabase.from('requests').delete().neq('id', '');
      // Reset budget spend
      for (const team in budgets) {
        await supabase.from('budgets').update({ spent: 0 }).eq('team', team);
      }
      // Reset recommendations to active
      await supabase.from('recommendations').update({ status: 'active' }).neq('id', '');
      // Re-seed telemetry from live providers
      const { requests: seedReqs, budgetSpend } = generateSeedRequests(providers);
      const batchSize = 300;
      for (let i = 0; i < seedReqs.length; i += batchSize) {
        await supabase.from('requests').insert(seedReqs.slice(i, i + batchSize));
      }
      const freshBudgets = { ...budgets };
      for (const team in budgetSpend) {
        await supabase.from('budgets').update({ spent: budgetSpend[team] }).eq('team', team);
        if (freshBudgets[team]) freshBudgets[team] = { ...freshBudgets[team], spent: budgetSpend[team] };
      }
      setRequests(seedReqs);
      setBudgets(freshBudgets);
      setRecommendations(prev => prev.map(r => ({ ...r, status: 'active' as const })));
    } catch (err) {
      console.error('resetSystemState error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StateContext.Provider value={{
      providers, requests, policies, budgets, recommendations, outcomes, users, notifications,
      channels, enterpriseIntegrations, loading, error,
      updateBudgetLimit, togglePolicy, addPolicy,
      applyRecommendation, dismissRecommendation, toggleProvider,
      inviteUser, deleteUser, updateUserRole, activateUser,
      sendTestNotification, updateChannelConfig, updateEnterpriseIntegration,
      routeGatewayRequest, resetSystemState,
      authSession, signOut, updatePassword
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) throw new Error('useAppState must be used within a StateProvider');
  return context;
};
