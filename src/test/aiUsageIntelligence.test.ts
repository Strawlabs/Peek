import { describe, it, expect } from 'vitest';
import { AIUsageNormalizer } from '../services/aiUsageNormalizer';
import { AIProviderConnectorService } from '../services/aiProviderConnectors';

describe('AIUsageNormalizer — Single Payload Normalization', () => {
  it('correctly normalizes a proxy usage payload', () => {
    const raw = {
      source: 'proxy' as const,
      provider: 'openai',
      tool: 'Peek Gateway',
      model: 'gpt-4o',
      team: 'Engineering',
      developer: 'aswini m (ammu2406sm@gmail.com)',
      tokens_in: 400,
      tokens_out: 200,
    };

    const req = AIUsageNormalizer.normalize(raw);
    expect(req.provider).toBe('openai');
    expect(req.model).toBe('gpt-4o');
    expect(req.tokens_in).toBe(400);
    expect(req.tokens_out).toBe(200);
    expect(req.cost).toBeGreaterThan(0);
    expect(req.customer).toBe('aswini m (ammu2406sm@gmail.com)');
    expect(req.team).toBe('Engineering');
  });

  it('enforces minimum $0.0025 cost floor for small cloud model prompts', () => {
    const raw = {
      source: 'proxy' as const,
      provider: 'gemini',
      tool: 'AskPeek Copilot',
      model: 'gemini-1.5-flash',
      team: 'Engineering',
      developer: 'aswini m (ammu2406sm@gmail.com)',
      tokens_in: 10,
      tokens_out: 10,
    };

    const req = AIUsageNormalizer.normalize(raw);
    expect(req.cost).toBeGreaterThanOrEqual(0.0025);
  });
});

describe('AIUsageNormalizer — CSV Batch Parser', () => {
  it('parses valid CSV content into TelemetryRequest array', () => {
    const csv = `provider,model,tokens_in,tokens_out,developer,team,tool\nopenai,gpt-4o,500,250,alex@company.com,Research,GitHub Copilot\nanthropic,claude-3-5-sonnet,800,400,sarah@company.com,Engineering,Cursor IDE`;
    const reqs = AIUsageNormalizer.parseCSVImport(csv);
    expect(reqs.length).toBe(2);
    expect(reqs[0].provider).toBe('openai');
    expect(reqs[0].customer).toBe('alex@company.com');
    expect(reqs[0].tool).toBe('GitHub Copilot');
    expect(reqs[1].provider).toBe('anthropic');
    expect(reqs[1].customer).toBe('sarah@company.com');
    expect(reqs[1].tool).toBe('Cursor IDE');
  });
});

describe('AIProviderConnectorService — Simulated Usage Generator', () => {
  it('generates multi-source usage payloads for external connectors', () => {
    const connector = {
      id: 'conn-copilot',
      org_id: 'org-default',
      name: 'GitHub Copilot Enterprise',
      provider: 'copilot' as const,
      tool_type: 'copilot_extension' as const,
      auth_method: 'oauth' as const,
      status: 'connected' as const,
      config: {}
    };

    const payloads = AIProviderConnectorService.generateSimulatedExternalUsage(
      connector,
      ['Engineering', 'Product Design'],
      [{ name: 'aswini m', email: 'ammu2406sm@gmail.com' }]
    );

    expect(payloads.length).toBeGreaterThan(0);
    expect(payloads[0].provider).toBe('copilot');
    expect(payloads[0].source).toBe('copilot_api');
  });
});
