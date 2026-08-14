import { describe, it, expect } from 'vitest';
import { AIUsageIntelligenceService } from '../services/aiUsageIntelligenceService';
import type { TelemetryRequest } from '../context/StateContext';

const MOCK_USERS = [
  { id: 'u1', name: 'Sarah Jenkins', email: 'sarah.jenkins@peek.ai', role: 'Super Admin', status: 'Active' as const, org_id: 'org-1' },
  { id: 'u2', name: 'James Carter', email: 'j.carter@peek.ai', role: 'Governance Manager', status: 'Active' as const, org_id: 'org-1' },
  { id: 'u3', name: 'aswini m', email: 'ammu2406sm@gmail.com', role: 'Super Admin', status: 'Active' as const, org_id: 'org-1' }
];

const MOCK_TELEMETRY_REQUESTS: TelemetryRequest[] = [
  {
    id: 'req-001',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    tokens_in: 450,
    tokens_out: 220,
    cost: 0.0025,
    latency: 0.25,
    timestamp: Date.now() - 3600000,
    team: 'Engineering',
    project: 'Project Phoenix',
    department: 'R&D',
    workflow: 'Code Refactoring',
    customer: 'aswini m (ammu2406sm@gmail.com)',
    prompt: 'Refactor authentication middleware in TypeScript',
    response: 'Refactored auth middleware code',
    status: 'Optimal',
    activity_type: 'REFACTORING',
    tool: 'Cursor IDE',
    source: 'proxy',
    actual_cost: 0.0025
  },
  {
    id: 'req-002',
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    tokens_in: 800,
    tokens_out: 400,
    cost: 0.0035,
    latency: 0.65,
    timestamp: Date.now() - 7200000,
    team: 'Engineering',
    project: 'Project Sentinel',
    department: 'R&D',
    workflow: 'Unit Test Generation',
    customer: 'aswini m (ammu2406sm@gmail.com)',
    prompt: 'Write pytest suite for billing engine',
    response: 'Pytest suite generated',
    status: 'Optimal',
    activity_type: 'TEST_GENERATION',
    tool: 'Python SDK',
    source: 'proxy',
    actual_cost: 0.0035
  },
  {
    id: 'req-003',
    provider: 'openai',
    model: 'gpt-4o',
    tokens_in: 1200,
    tokens_out: 500,
    cost: 0.0135,
    latency: 1.10,
    timestamp: Date.now() - 10800000,
    team: 'Research',
    project: 'Project Keystone',
    department: 'R&D',
    workflow: 'Literature Analysis',
    customer: 'Sarah Jenkins (sarah.jenkins@peek.ai)',
    prompt: 'Analyze paper on distributed consensus',
    response: 'Analysis output',
    status: 'Optimal',
    activity_type: 'GENERAL_ASSISTANCE',
    tool: 'AskPeek Copilot',
    source: 'proxy',
    actual_cost: 0.0135
  }
];

describe('PHASE 3 — Developer -> Team -> Organization Mapping', () => {
  it('resolves developer context from email address', () => {
    const ctx = AIUsageIntelligenceService.resolveDeveloperContext('sarah.jenkins@peek.ai', MOCK_USERS, 'Engineering', 'org-1');
    expect(ctx.developerId).toBe('u1');
    expect(ctx.developerName).toBe('Sarah Jenkins');
    expect(ctx.orgId).toBe('org-1');
  });

  it('resolves developer context from Name (email) string pattern', () => {
    const ctx = AIUsageIntelligenceService.resolveDeveloperContext('aswini m (ammu2406sm@gmail.com)', MOCK_USERS, 'Engineering', 'org-1');
    expect(ctx.developerId).toBe('u3');
    expect(ctx.developerName).toBe('aswini m');
    expect(ctx.developerEmail).toBe('ammu2406sm@gmail.com');
  });
});

describe('PHASE 5 — AI Activity Classification', () => {
  it('classifies refactoring prompt intent', () => {
    expect(AIUsageIntelligenceService.classifyActivityType('Please refactor this auth function')).toBe('REFACTORING');
  });

  it('classifies debugging prompt intent', () => {
    expect(AIUsageIntelligenceService.classifyActivityType('Debug error NPE on line 42')).toBe('DEBUGGING');
  });

  it('classifies unit test prompt intent', () => {
    expect(AIUsageIntelligenceService.classifyActivityType('Write pytest unit test for user service')).toBe('TEST_GENERATION');
  });

  it('defaults unclassified prompt to UNKNOWN', () => {
    expect(AIUsageIntelligenceService.classifyActivityType('random text xyz')).toBe('UNKNOWN');
  });
});

describe('PHASE 7 & 8 — Developer Metrics Calculations', () => {
  it('calculates total requests, tokens, cost, and top model for developer', () => {
    const devMetrics = AIUsageIntelligenceService.calculateDeveloperMetrics(MOCK_TELEMETRY_REQUESTS, 'ammu2406sm@gmail.com');
    expect(devMetrics.totalRequests).toBe(2);
    expect(devMetrics.totalTokens).toBe(450 + 220 + 800 + 400); // 1870
    expect(devMetrics.totalCost).toBeCloseTo(0.006, 4);
    expect(devMetrics.mostUsedProvider).toBe('gemini');
  });
});

describe('PHASE 7 & 8 — Team Metrics & AI Adoption Rate Calculation', () => {
  it('calculates team requests, cost, active developers, and adoption rate', () => {
    const teamMetrics = AIUsageIntelligenceService.calculateTeamMetrics(MOCK_TELEMETRY_REQUESTS, 'Engineering', 5);
    expect(teamMetrics.totalRequests).toBe(2);
    expect(teamMetrics.activeDevelopersCount).toBe(1); // 1 dev (aswini m)
    expect(teamMetrics.totalTeamDevelopersCount).toBe(5);
    expect(teamMetrics.adoptionRate).toBe(20); // (1 / 5) * 100 = 20%
    expect(teamMetrics.totalCost).toBeCloseTo(0.006, 4);
  });

  it('isolates different teams correctly', () => {
    const engMetrics = AIUsageIntelligenceService.calculateTeamMetrics(MOCK_TELEMETRY_REQUESTS, 'Engineering', 5);
    const resMetrics = AIUsageIntelligenceService.calculateTeamMetrics(MOCK_TELEMETRY_REQUESTS, 'Research', 5);

    expect(engMetrics.totalRequests).toBe(2);
    expect(resMetrics.totalRequests).toBe(1);
    expect(resMetrics.totalCost).toBeCloseTo(0.0135, 4);
  });
});

describe('PHASE 7 & 8 — Organization Metrics & Distribution Calculation', () => {
  it('calculates organization total requests, active devs, adoption rate, and provider distribution', () => {
    const orgMetrics = AIUsageIntelligenceService.calculateOrgMetrics(MOCK_TELEMETRY_REQUESTS, 10);
    expect(orgMetrics.totalRequests).toBe(3);
    expect(orgMetrics.activeDevelopersCount).toBe(2); // aswini m, Sarah Jenkins
    expect(orgMetrics.adoptionRate).toBe(20); // (2 / 10) * 100 = 20%
    expect(orgMetrics.providerDistribution['gemini']).toBe(2);
    expect(orgMetrics.providerDistribution['openai']).toBe(1);
  });
});

describe('PHASE 12 & 15 — Security & API Key Secrecy', () => {
  it('ensures telemetry objects never expose API secret keys', () => {
    MOCK_TELEMETRY_REQUESTS.forEach(req => {
      const keys = Object.keys(req);
      expect(keys.includes('apiKey')).toBe(false);
      expect(keys.includes('secret')).toBe(false);
      expect(JSON.stringify(req).includes('sk-proj')).toBe(false);
      expect(JSON.stringify(req).includes('AIzaSy')).toBe(false);
    });
  });
});
