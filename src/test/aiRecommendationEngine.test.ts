/**
 * Unit tests for the AI Recommendation Engine.
 *
 * Tests generateDynamicRecommendations with various telemetry,
 * policy, budget, and provider states.
 */
import { describe, it, expect } from 'vitest';
import { generateDynamicRecommendations } from '../utils/aiRecommendationEngine';
import type { TelemetryRequest, Policy, Budget, Provider, Recommendation } from '../context/StateContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const makeRequest = (overrides: Partial<TelemetryRequest> = {}): TelemetryRequest => ({
  id: `req-${Math.random().toString(36).slice(2, 8)}`,
  provider: 'OpenAI',
  model: 'gpt-4o',
  team: 'Engineering',
  department: 'Engineering',
  workflow: 'Code Review',
  customer: 'internal',
  project: 'peek',
  status: 'Success',
  tokens_in: 500,
  tokens_out: 200,
  cost: 0.05,
  latency: 0.4,
  timestamp: Date.now(),
  prompt: 'Test prompt',
  response: 'Test response',
  ...overrides,
});

const makePolicy = (overrides: Partial<Policy> = {}): Policy => ({
  id: 'pol-pii',
  name: 'PII Protection',
  description: 'Detects and blocks PII in prompts',
  type: 'pii',
  active: true,
  action: 'block',
  ...overrides,
});

const makeBudget = (overrides: Partial<Budget> = {}): Budget => ({
  limit: 1000,
  spent: 200,
  ...overrides,
});

const makeProvider = (overrides: Partial<Provider> = {}): Provider => ({
  id: 'openai',
  name: 'OpenAI',
  status: 'connected',
  apiKey: 'sk-test',
  models: ['gpt-4o'],
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('generateDynamicRecommendations', () => {
  it('returns at least 3 recommendations for empty telemetry (fallback seeds)', () => {
    const recs = generateDynamicRecommendations([], [], {}, [], []);
    expect(recs.length).toBeGreaterThanOrEqual(3);
  });

  it('generates a cost optimization rec when premium model usage is high', () => {
    const requests = Array.from({ length: 10 }, () => makeRequest({ model: 'gpt-4o', cost: 5 }));
    const recs = generateDynamicRecommendations(requests, [makePolicy()], {}, [makeProvider()], []);
    const costRec = recs.find(r => r.id === 'rec-dyn-cost-01');
    expect(costRec).toBeDefined();
    expect(costRec!.category).toBe('cost');
    expect(costRec!.savings).toBeGreaterThan(0);
  });

  it('generates a PII governance rec when PII violations exist', () => {
    const requests = [
      makeRequest({ status: 'Blocked — PII Detected' }),
      makeRequest({ status: 'Success' }),
    ];
    const recs = generateDynamicRecommendations(requests, [makePolicy()], {}, [makeProvider()], []);
    const piiRec = recs.find(r => r.id === 'rec-dyn-gov-01');
    expect(piiRec).toBeDefined();
    expect(piiRec!.category).toBe('governance');
  });

  it('generates a budget risk rec when team exceeds 70% budget', () => {
    const budgets: Record<string, Budget> = {
      Engineering: makeBudget({ limit: 1000, spent: 800 }),
    };
    const recs = generateDynamicRecommendations([makeRequest()], [makePolicy()], budgets, [makeProvider()], []);
    const budgetRec = recs.find(r => r.id?.startsWith('rec-dyn-budget-'));
    expect(budgetRec).toBeDefined();
    expect(budgetRec!.category).toBe('cost');
  });

  it('does not generate budget rec when spend is under 70%', () => {
    const budgets: Record<string, Budget> = {
      Engineering: makeBudget({ limit: 1000, spent: 100 }),
    };
    const recs = generateDynamicRecommendations([makeRequest()], [makePolicy()], budgets, [makeProvider()], []);
    const budgetRec = recs.find(r => r.id?.startsWith('rec-dyn-budget-'));
    expect(budgetRec).toBeUndefined();
  });

  it('generates local inference rec when local provider is connected', () => {
    const localProvider = makeProvider({ id: 'local', name: 'Local Inference', status: 'connected' });
    const recs = generateDynamicRecommendations(
      Array.from({ length: 6 }, () => makeRequest()),
      [makePolicy()],
      {},
      [makeProvider(), localProvider],
      []
    );
    const localRec = recs.find(r => r.id === 'rec-dyn-opt-01');
    expect(localRec).toBeDefined();
    expect(localRec!.category).toBe('optimization');
  });

  it('generates a latency optimization rec when avg latency > 0.5s', () => {
    const requests = Array.from({ length: 6 }, () => makeRequest({ latency: 1.2, model: 'gpt-4o', cost: 2 }));
    const recs = generateDynamicRecommendations(requests, [makePolicy()], {}, [makeProvider()], []);
    const latRec = recs.find(r => r.id === 'rec-dyn-lat-01');
    expect(latRec).toBeDefined();
    expect(latRec!.category).toBe('optimization');
  });

  it('preserves applied/dismissed status from existing recommendations', () => {
    const existing: Recommendation[] = [{
      id: 'rec-dyn-cost-01',
      title: 'Test',
      category: 'cost',
      suggestion: 'Test',
      savings: 100,
      confidence: 90,
      status: 'applied',
      evidence: 'test',
    }];
    const requests = Array.from({ length: 10 }, () => makeRequest({ model: 'gpt-4o', cost: 5 }));
    const recs = generateDynamicRecommendations(requests, [makePolicy()], {}, [makeProvider()], existing);
    const costRec = recs.find(r => r.id === 'rec-dyn-cost-01');
    expect(costRec).toBeDefined();
    expect(costRec!.status).toBe('applied');
  });
});
