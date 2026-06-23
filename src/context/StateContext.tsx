/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

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

const DEFAULT_STATE = {
  providers: [
    { id: 'openai', name: 'OpenAI', status: 'connected' as const, apiKey: 'sk-proj-••••••••••••••••', models: ['gpt-4o', 'gpt-3.5-turbo'] },
    { id: 'anthropic', name: 'Anthropic', status: 'connected' as const, apiKey: 'sk-ant-••••••••••••••••', models: ['claude-3-5-sonnet', 'claude-3-haiku'] },
    { id: 'gemini', name: 'Gemini', status: 'connected' as const, apiKey: 'AIzaSy••••••••••••••••', models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
    { id: 'azure-openai', name: 'Azure OpenAI', status: 'disconnected' as const, apiKey: '', models: ['gpt-4-azure'] },
    { id: 'aws-bedrock', name: 'AWS Bedrock', status: 'disconnected' as const, apiKey: '', models: ['claude-3-sonnet-bedrock'] },
    { id: 'local', name: 'Local Inference', status: 'connected' as const, apiKey: 'local-key', models: ['llama-3-local'] }
  ],
  requests: [] as TelemetryRequest[],
  policies: [
    { id: 'pol-pii', name: 'PII Protection (Anti-leakage)', description: 'Scan prompt text for SSN, credit cards, or emails. Flag and mask or block.', type: 'data_leakage', active: true, action: 'block' as const },
    { id: 'pol-models', name: 'Approved Model Guardrails', description: 'Restrict production environments from using non-approved or premium cost models.', type: 'model_restriction', active: true, action: 'flag' as const },
    { id: 'pol-residency', name: 'Data Residency Standard', description: 'Ensure customer data does not leave US region.', type: 'residency', active: false, action: 'flag' as const }
  ],
  budgets: {
    'Engineering': { limit: 25000, spent: 0 },
    'Customer Success': { limit: 15000, spent: 0 },
    'Marketing': { limit: 10000, spent: 0 },
    'Product Design': { limit: 8000, spent: 0 },
    'Research': { limit: 5000, spent: 0 }
  } as Record<string, Budget>,
  recommendations: [
    { id: 'rec-001', title: 'Transition Support Chatbot to Gemini 1.5 Flash', category: 'cost', suggestion: 'The Support Chatbot workflow is currently running on Claude 3.5 Sonnet. Over 90% of requests are basic classification tasks. Transitioning to Gemini 1.5 Flash will reduce cost by ~85%.', savings: 4500, confidence: 92, status: 'active' as const, evidence: '90% of requests have < 3 sentences and output simple classification tags.' },
    { id: 'rec-002', title: 'Configure rate-limiting on ContentGen-Agent keys', category: 'governance', suggestion: 'The Marketing ContentGen-Agent generated 42% cost growth this week due to an infinite-loop bug in review code.', savings: 1200, confidence: 98, status: 'active' as const, evidence: 'Marketing team API key generated 150 requests/min between 2:00 AM and 4:00 AM on Sunday.' },
    { id: 'rec-003', title: 'Enable Local Llama-3 for draft reviews', category: 'optimization', suggestion: 'Engineering CI/CD review workflows are using GPT-4o for draft-stage reviews. Moving draft reviews to a local Llama-3 server is free.', savings: 1800, confidence: 88, status: 'active' as const, evidence: 'Draft review tasks do not require premium model capabilities.' }
  ] as Recommendation[],
  outcomes: [
    { id: 'w-cs', workflow: 'Support Chatbot', department: 'Customer Success', metricName: 'Zendesk Tickets Resolved', volume: 15400, costPerOutcome: 0.42, roiScore: 'High' as const, necessity: 'AI Essential' as const },
    { id: 'w-eng', workflow: 'CI/CD Review', department: 'Engineering', metricName: 'PRs Reviewed', volume: 8500, costPerOutcome: 0.15, roiScore: 'Medium' as const, necessity: 'AI Recommended' as const },
    { id: 'w-mkt', workflow: 'Campaign Gen', department: 'Marketing', metricName: 'Campaign Drafts Generated', volume: 1200, costPerOutcome: 0.35, roiScore: 'Low' as const, necessity: 'Rule-Based Preferred' as const },
    { id: 'w-res', workflow: 'Paper Analysis', department: 'Research', metricName: 'Papers Processed', volume: 450, costPerOutcome: 0.00, roiScore: 'High' as const, necessity: 'Hybrid' as const }
  ] as Outcome[],
  users: [
    { id: 'u1', name: 'Sarah Jenkins', email: 'sarah.jenkins@peek.ai', role: 'Super Admin', status: 'Active' as const },
    { id: 'u2', name: 'James Carter', email: 'j.carter@peek.ai', role: 'Governance Manager', status: 'Active' as const },
    { id: 'u3', name: 'Elena Rostova', email: 'e.rostova@peek.ai', role: 'Viewer', status: 'Active' as const }
  ] as User[]
};

interface StateContextType {
  providers: Provider[];
  requests: TelemetryRequest[];
  policies: Policy[];
  budgets: Record<string, Budget>;
  recommendations: Recommendation[];
  outcomes: Outcome[];
  users: User[];
  updateBudgetLimit: (team: string, limit: number) => void;
  togglePolicy: (id: string) => void;
  addPolicy: (name: string, description: string, type: string, action: 'block' | 'flag') => void;
  applyRecommendation: (id: string) => void;
  dismissRecommendation: (id: string) => void;
  toggleProvider: (id: string, apiKey?: string) => void;
  inviteUser: (name: string, email: string, role: string) => void;
  deleteUser: (id: string) => void;
  updateUserRole: (id: string, role: string) => void;
  routeGatewayRequest: (
    prompt: string,
    provider: string,
    model: string,
    team: string,
    environment: string,
    workflow: string,
    customer: string
  ) => { success: boolean; trace: string[]; cost: number; tokens: number; latency: number };
  resetSystemState: () => void;
}

type PersistedState = {
  providers: Provider[];
  requests: TelemetryRequest[];
  policies: Policy[];
  budgets: Record<string, Budget>;
  recommendations: Recommendation[];
  outcomes: Outcome[];
  users: User[];
};

function generateFreshTelemetryData(): PersistedState {
  const days = 30;
  const teams = ['Engineering', 'Customer Success', 'Marketing', 'Product Design', 'Research'];
  const departments: Record<string, string> = {
    'Engineering': 'R&D',
    'Customer Success': 'Operations',
    'Marketing': 'GTM',
    'Product Design': 'R&D',
    'Research': 'R&D'
  };
  const workflows: Record<string, string[]> = {
    'Engineering': ['CI/CD Review', 'Code Autocomplete', 'Doc Synthesis'],
    'Customer Success': ['Email Triage', 'Support Chatbot', 'FAQ Search'],
    'Marketing': ['Campaign Gen', 'Copywriting Drafts', 'SEO Tagging'],
    'Product Design': ['UI Layout Copy', 'Design Reviews'],
    'Research': ['Paper Analysis', 'Literature Review']
  };
  const providerList = ['openai', 'anthropic', 'gemini', 'local'];
  const providerModels: Record<string, string[]> = {
    'openai': ['gpt-4o', 'gpt-3.5-turbo'],
    'anthropic': ['claude-3-5-sonnet', 'claude-3-haiku'],
    'gemini': ['gemini-1.5-flash', 'gemini-1.5-pro'],
    'local': ['llama-3-local']
  };
  const customers = ['Alphabet Corp', 'Stripe Inc', 'Vercel Group', 'None'];

  const newRequests: TelemetryRequest[] = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const totalRequests = days * 30;

  const freshBudgets = JSON.parse(JSON.stringify(DEFAULT_STATE.budgets)) as Record<string, Budget>;

  for (let i = 0; i < totalRequests; i++) {
    const timeOffset = Math.random() * days * msPerDay;
    const timestamp = now - timeOffset;

    const team = teams[Math.floor(Math.random() * teams.length)];
    const department = departments[team];
    const workflowList = workflows[team];
    const workflow = workflowList[Math.floor(Math.random() * workflowList.length)];

    const provider = providerList[Math.floor(Math.random() * providerList.length)];
    const models = providerModels[provider];
    const model = models[Math.floor(Math.random() * models.length)];

    const tokensIn = Math.floor(Math.random() * 5000) + 100;
    const tokensOut = Math.floor(Math.random() * 2000) + 50;

    const rates = PROVIDER_PRICING[provider][model] || { input: 0, output: 0 };
    const cost = ((tokensIn * rates.input) + (tokensOut * rates.output)) / 1000000;

    let baseLatency = 0.5;
    if (model.includes('flash') || model.includes('haiku') || model.includes('3.5-turbo') || model.includes('local')) {
      baseLatency = 0.15;
    } else if (model.includes('pro') || model.includes('gpt-4o') || model.includes('sonnet')) {
      baseLatency = 1.6;
    }
    const latency = baseLatency + (Math.random() * 1.2);

    let status = 'Optimal';
    const violatesPII = Math.random() < 0.02;
    const violatesModel = model === 'gpt-4o' && team === 'Marketing' && Math.random() < 0.05;

    if (violatesPII) {
      status = 'PII Leak Flagged';
    } else if (violatesModel) {
      status = 'Policy Flagged';
    } else if (cost > 0.05) {
      status = 'High Cost';
    }

    const promptSample = violatesPII
      ? `Retrieve user email user_id_33@gmail.com and process credit card 4111-2222-3333-4444...`
      : `Process workflow tasks for ${workflow}`;

    newRequests.push({
      id: 'req-' + Math.random().toString(36).substring(2, 11),
      provider,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost: parseFloat(cost.toFixed(6)),
      latency: parseFloat(latency.toFixed(2)),
      timestamp,
      team,
      project: 'Project-' + ['Phoenix', 'Sentinel', 'Keystone', 'Nebula'][Math.floor(Math.random() * 4)],
      department,
      workflow,
      customer: customers[Math.floor(Math.random() * customers.length)],
      prompt: promptSample,
      response: `Simulated response text matching parameters for model ${model}. Processed ${tokensIn + tokensOut} tokens in ${latency.toFixed(2)}s.`,
      status
    });

    if (freshBudgets[team]) {
      freshBudgets[team].spent += cost;
    }
  }

  newRequests.sort((a, b) => a.timestamp - b.timestamp);

  return {
    providers: DEFAULT_STATE.providers,
    requests: newRequests,
    policies: DEFAULT_STATE.policies,
    budgets: freshBudgets,
    recommendations: DEFAULT_STATE.recommendations,
    outcomes: DEFAULT_STATE.outcomes,
    users: DEFAULT_STATE.users,
  };
}

let cachedInitialState: PersistedState | undefined;

function getInitialState(): PersistedState {
  if (cachedInitialState) return cachedInitialState;

  const raw = localStorage.getItem('peek_state');
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.requests && parsed.requests.length > 0) {
        cachedInitialState = {
          providers: parsed.providers || DEFAULT_STATE.providers,
          requests: parsed.requests,
          policies: parsed.policies || DEFAULT_STATE.policies,
          budgets: parsed.budgets || DEFAULT_STATE.budgets,
          recommendations: parsed.recommendations || DEFAULT_STATE.recommendations,
          outcomes: parsed.outcomes || DEFAULT_STATE.outcomes,
          users: parsed.users || DEFAULT_STATE.users,
        };
        return cachedInitialState;
      }
    } catch {
      console.error('Error parsing peek_state, generating fresh state');
    }
  }

  cachedInitialState = generateFreshTelemetryData();
  localStorage.setItem('peek_state', JSON.stringify(cachedInitialState));
  return cachedInitialState;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [providers, setProviders] = useState<Provider[]>(() => getInitialState().providers);
  const [requests, setRequests] = useState<TelemetryRequest[]>(() => getInitialState().requests);
  const [policies, setPolicies] = useState<Policy[]>(() => getInitialState().policies);
  const [budgets, setBudgets] = useState<Record<string, Budget>>(() => getInitialState().budgets);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => getInitialState().recommendations);
  const [outcomes, setOutcomes] = useState<Outcome[]>(() => getInitialState().outcomes);
  const [users, setUsers] = useState<User[]>(() => getInitialState().users);

  const saveToStorage = (updatedState: Partial<typeof DEFAULT_STATE> & { budgets: Record<string, Budget> }) => {
    localStorage.setItem('peek_state', JSON.stringify({
      providers: updatedState.providers || providers,
      requests: updatedState.requests || requests,
      policies: updatedState.policies || policies,
      budgets: updatedState.budgets || budgets,
      recommendations: updatedState.recommendations || recommendations,
      outcomes: updatedState.outcomes || outcomes,
      users: updatedState.users || users,
    }));
  };

  const generateFreshTelemetry = () => {
    const fresh = generateFreshTelemetryData();
    cachedInitialState = fresh;
    setProviders(fresh.providers);
    setRequests(fresh.requests);
    setPolicies(fresh.policies);
    setBudgets(fresh.budgets);
    setRecommendations(fresh.recommendations);
    setOutcomes(fresh.outcomes);
    setUsers(fresh.users);
    localStorage.setItem('peek_state', JSON.stringify(fresh));
  };

  const updateBudgetLimit = (team: string, limit: number) => {
    const updated = {
      ...budgets,
      [team]: { ...budgets[team], limit }
    };
    setBudgets(updated);
    saveToStorage({ budgets: updated });
  };

  const togglePolicy = (id: string) => {
    const updated = policies.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setPolicies(updated);
    saveToStorage({ policies: updated, budgets });
  };

  const addPolicy = (name: string, description: string, type: string, action: 'block' | 'flag') => {
    const newPolicy: Policy = {
      id: 'pol-' + Math.random().toString(36).substring(2, 7),
      name,
      description,
      type,
      active: true,
      action
    };
    const updated = [...policies, newPolicy];
    setPolicies(updated);
    saveToStorage({ policies: updated, budgets });
  };

  const applyRecommendation = (id: string) => {
    const updated = recommendations.map(r => r.id === id ? { ...r, status: 'applied' as const } : r);
    setRecommendations(updated);
    saveToStorage({ recommendations: updated, budgets });
  };

  const dismissRecommendation = (id: string) => {
    const updated = recommendations.map(r => r.id === id ? { ...r, status: 'dismissed' as const } : r);
    setRecommendations(updated);
    saveToStorage({ recommendations: updated, budgets });
  };

  const toggleProvider = (id: string, apiKey?: string) => {
    const updated = providers.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'connected' ? 'disconnected' as const : 'connected' as const;
        return {
          ...p,
          status: nextStatus,
          apiKey: apiKey !== undefined ? apiKey : (nextStatus === 'connected' ? 'sk-new-••••••••••••••••' : '')
        };
      }
      return p;
    });
    setProviders(updated);
    saveToStorage({ providers: updated, budgets });
  };

  const inviteUser = (name: string, email: string, role: string) => {
    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 7),
      name,
      email,
      role,
      status: 'Pending'
    };
    const updated = [...users, newUser];
    setUsers(updated);
    saveToStorage({ users: updated, budgets });
  };

  const deleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    saveToStorage({ users: updated, budgets });
  };

  const updateUserRole = (id: string, role: string) => {
    const updated = users.map(u => u.id === id ? { ...u, role } : u);
    setUsers(updated);
    saveToStorage({ users: updated, budgets });
  };

  const routeGatewayRequest = (
    prompt: string,
    provider: string,
    model: string,
    team: string,
    environment: string,
    workflow: string,
    customer: string
  ) => {
    const trace: string[] = [];
    trace.push(`[SYSTEM] Intercepted raw HTTP request routed to /v1/chat/completions`);
    trace.push(`[GATEWAY] Extracting metadata headers: Team=${team}, Env=${environment}, Workflow=${workflow}`);

    // Policy 1: PII Protection
    let status = 'Optimal';
    let blockRequest = false;
    const piiPolicy = policies.find(p => p.id === 'pol-pii');

    if (piiPolicy && piiPolicy.active) {
      trace.push(`[POLICY] Running '${piiPolicy.name}' scan on prompt contents...`);
      const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(prompt);
      const hasCard = /\b(?:\d[ -]*?){13,16}\b/.test(prompt);
      const hasSSN = /\b\d{3}-\d{2}-\d{4}\b/.test(prompt);

      if (hasEmail || hasCard || hasSSN) {
        trace.push(`[WARNING] PII leakage detected in payload context! Found match: ${hasEmail ? 'Email' : hasCard ? 'Credit Card Number' : 'SSN'}`);
        if (piiPolicy.action === 'block') {
          blockRequest = true;
          status = 'PII Leak Blocked';
          trace.push(`[BLOCK] Policy action is set to 'BLOCK'. Gateway terminating connection immediately.`);
        } else {
          status = 'PII Leak Flagged';
          trace.push(`[FLAG] Policy action is set to 'FLAG'. Attributing audit logs and letting request pass.`);
        }
      } else {
        trace.push(`[POLICY] PII scan passed. No sensitive patterns found.`);
      }
    }

    // Policy 2: Approved Model Restriction
    const modelPolicy = policies.find(p => p.id === 'pol-models');
    if (!blockRequest && modelPolicy && modelPolicy.active) {
      trace.push(`[POLICY] Running '${modelPolicy.name}' constraints...`);
      if (model === 'gpt-4o' && team === 'Marketing') {
        trace.push(`[WARNING] Model restriction rule violated: Marketing team is not allowed to invoke premium gpt-4o in this configuration.`);
        if (modelPolicy.action === 'block') {
          blockRequest = true;
          status = 'Policy Blocked';
          trace.push(`[BLOCK] Restricting premium model. Connection rejected.`);
        } else {
          status = 'Policy Flagged';
          trace.push(`[FLAG] Policy violation flagged. Adding telemetry audit flags.`);
        }
      } else {
        trace.push(`[POLICY] Approved model constraint checks completed successfully.`);
      }
    }

    // Cost calculations
    const pricing = PROVIDER_PRICING[provider]?.[model] || { input: 0.0, output: 0.0 };
    const tokensIn = Math.floor(prompt.length / 4) + 12;
    const tokensOut = blockRequest ? 0 : Math.floor(Math.random() * 400) + 100;
    const calculatedCost = blockRequest ? 0 : ((tokensIn * pricing.input) + (tokensOut * pricing.output)) / 1000000;

    let baseLatency = 0.4;
    if (model.includes('flash') || model.includes('haiku') || model.includes('local')) baseLatency = 0.15;
    else if (model.includes('pro') || model.includes('gpt-4o') || model.includes('sonnet')) baseLatency = 1.2;
    const finalLatency = blockRequest ? 0.02 : baseLatency + (Math.random() * 0.4);

    if (!blockRequest) {
      // Check budget
      const teamBudget = budgets[team];
      if (teamBudget) {
        const nextSpent = teamBudget.spent + calculatedCost;
        if (nextSpent > teamBudget.limit) {
          trace.push(`[WARNING] Team '${team}' exceeded allocated budget limit of $${teamBudget.limit}! Current Spent: $${nextSpent.toFixed(2)}`);
        }
      }

      trace.push(`[ATTRIBUTION] Calculating token dimensions: input_tokens=${tokensIn}, output_tokens=${tokensOut}`);
      trace.push(`[PROXY] Contacting downstream provider ${provider} for model ${model}...`);
      trace.push(`[PROXY] Received response from downstream in ${finalLatency.toFixed(2)}s. Cost computed: $${calculatedCost.toFixed(5)}`);
      trace.push(`[TELEMETRY] Logging outcome packet to Peek data lake.`);
    }

    const newRequest: TelemetryRequest = {
      id: 'req-' + Math.random().toString(36).substring(2, 11),
      provider,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost: parseFloat(calculatedCost.toFixed(6)),
      latency: parseFloat(finalLatency.toFixed(2)),
      timestamp: Date.now(),
      team,
      project: 'Project-' + ['Phoenix', 'Sentinel', 'Keystone', 'Nebula'][Math.floor(Math.random() * 4)],
      department: team === 'Engineering' || team === 'Research' || team === 'Product Design' ? 'R&D' : (team === 'Marketing' ? 'GTM' : 'Operations'),
      workflow,
      customer,
      prompt,
      response: blockRequest 
        ? `ERROR 403: Request blocked by Peek Enterprise AI Gateway due to security policy violations.`
        : `Gateway routing response from ${provider}/${model}. Verified safe under policy standards. Output tokens: ${tokensOut}.`,
      status
    };

    const updatedRequests = [...requests, newRequest];
    setRequests(updatedRequests);

    const updatedBudgets = { ...budgets };
    if (!blockRequest && updatedBudgets[team]) {
      updatedBudgets[team] = {
        ...updatedBudgets[team],
        spent: updatedBudgets[team].spent + calculatedCost
      };
      setBudgets(updatedBudgets);
    }

    saveToStorage({
      requests: updatedRequests,
      budgets: updatedBudgets
    });

    return {
      success: !blockRequest,
      trace,
      cost: calculatedCost,
      tokens: tokensIn + tokensOut,
      latency: finalLatency
    };
  };

  const resetSystemState = () => {
    generateFreshTelemetry();
  };

  return (
    <StateContext.Provider value={{
      providers,
      requests,
      policies,
      budgets,
      recommendations,
      outcomes,
      users,
      updateBudgetLimit,
      togglePolicy,
      addPolicy,
      applyRecommendation,
      dismissRecommendation,
      toggleProvider,
      inviteUser,
      deleteUser,
      updateUserRole,
      routeGatewayRequest,
      resetSystemState
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
};
