import { PROVIDER_PRICING, type TelemetryRequest } from '../context/StateContext';
import type { RawUsagePayload } from './aiProviderConnectors';

export class AIUsageNormalizer {
  /**
   * Normalizes any raw AI usage payload into a standardized TelemetryRequest object.
   */
  static normalize(payload: RawUsagePayload): TelemetryRequest {
    const provider = (payload.provider || 'openai').toLowerCase();
    const model = payload.model || 'gpt-4o';
    const tokensIn = payload.tokens_in || 0;
    const tokensOut = payload.tokens_out || 0;

    // Calculate cost if not provided explicitly
    let calculatedCost = payload.cost ?? 0;
    if (calculatedCost <= 0) {
      const pricing = PROVIDER_PRICING[provider]?.[model] || { input: 1.00, output: 3.00 };
      calculatedCost = parseFloat((((tokensIn * pricing.input) + (tokensOut * pricing.output)) / 1_000_000).toFixed(6));
      if (provider !== 'local' && calculatedCost < 0.002) {
        calculatedCost = 0.0025;
      }
    }

    const team = payload.team || 'Engineering';
    const project = payload.project || 'Project Phoenix';
    const department = team === 'Engineering' || team === 'Research' || team === 'Product Design' ? 'R&D' : (team === 'Marketing' ? 'GTM' : 'Operations');

    return {
      id: 'req-' + Math.random().toString(36).substring(2, 11),
      provider,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost: calculatedCost,
      latency: payload.latency ?? 0.4,
      timestamp: payload.timestamp ?? Date.now(),
      team,
      project,
      department,
      workflow: payload.workflow || 'AI Dev Task',
      customer: payload.developer || 'aswini m (ammu2406sm@gmail.com)',
      prompt: payload.prompt_text || 'Usage event ingested via Peek AI Intelligence Layer',
      response: `Ingested usage telemetry from source: ${payload.source || 'proxy'} via ${payload.tool || 'Peek Gateway'}.`,
      status: payload.status || 'Optimal',
      tool: payload.tool || (payload.source === 'copilot_api' ? 'GitHub Copilot' : payload.source === 'cursor_logs' ? 'Cursor IDE' : 'Peek Gateway'),
      source: payload.source || 'proxy',
      actual_cost: calculatedCost,
      metadata: payload.metadata || {}
    };
  }

  /**
   * Batch normalizes multiple raw usage payloads.
   */
  static normalizeBatch(payloads: RawUsagePayload[]): TelemetryRequest[] {
    return payloads.map((p) => this.normalize(p));
  }

  /**
   * Parses CSV string of external AI tool usage into normalized TelemetryRequest array.
   */
  static parseCSVImport(csvText: string, defaultDeveloper: string = 'aswini m (ammu2406sm@gmail.com)'): TelemetryRequest[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const requests: TelemetryRequest[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));

      const getVal = (field: string) => {
        const idx = headers.indexOf(field);
        return idx !== -1 ? values[idx] : undefined;
      };

      const provider = getVal('provider') || 'openai';
      const model = getVal('model') || 'gpt-4o';
      const tokensIn = parseInt(getVal('tokens_in') || getVal('input_tokens') || '150', 10);
      const tokensOut = parseInt(getVal('tokens_out') || getVal('output_tokens') || '100', 10);
      const costStr = getVal('cost') || getVal('estimated_cost');
      const cost = costStr ? parseFloat(costStr) : undefined;
      const developer = getVal('developer') || getVal('customer') || getVal('user') || defaultDeveloper;
      const team = getVal('team') || 'Engineering';
      const tool = getVal('tool') || 'External AI Tool';
      const workflow = getVal('workflow') || 'Batch Imported Task';

      requests.push(this.normalize({
        source: 'csv_import',
        provider,
        tool,
        model,
        team,
        developer,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost,
        workflow,
        timestamp: Date.now() - (i * 300000)
      }));
    }

    return requests;
  }
}
