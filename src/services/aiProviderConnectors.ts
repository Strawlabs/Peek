export interface AIUsageConnectorConfig {
  id: string;
  org_id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'copilot' | 'cursor' | 'azure-openai' | 'aws-bedrock' | 'local';
  tool_type: 'proxy' | 'copilot_extension' | 'cursor_ide' | 'direct_api' | 'cli_tool';
  auth_method: 'api_key' | 'oauth' | 'virtual_key';
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  config: Record<string, string>;
  last_sync_at?: number;
}

export interface RawUsagePayload {
  source: 'proxy' | 'copilot_api' | 'cursor_logs' | 'provider_dashboard' | 'csv_import';
  provider: string;
  tool: string;
  model: string;
  team: string;
  developer: string;
  project?: string;
  workflow?: string;
  prompt_text?: string;
  tokens_in: number;
  tokens_out: number;
  cost?: number;
  latency?: number;
  timestamp?: number;
  status?: string;
  metadata?: Record<string, unknown>;
}

export class AIProviderConnectorService {
  /**
   * Generates mock simulated usage events for external tools (e.g. GitHub Copilot, Cursor IDE)
   * so organizations get realistic multi-source usage metrics out of the box.
   */
  static generateSimulatedExternalUsage(
    connector: AIUsageConnectorConfig,
    activeTeams: string[],
    activeDevelopers: { name: string; email: string }[]
  ): RawUsagePayload[] {
    const events: RawUsagePayload[] = [];
    const count = Math.floor(Math.random() * 5) + 3;
    const now = Date.now();

    const dev = activeDevelopers.length > 0
      ? activeDevelopers[Math.floor(Math.random() * activeDevelopers.length)]
      : { name: 'aswini m', email: 'ammu2406sm@gmail.com' };
    const devIdentifier = `${dev.name} (${dev.email})`;
    const team = activeTeams.length > 0 ? activeTeams[Math.floor(Math.random() * activeTeams.length)] : 'Engineering';
    const project = ['Project Phoenix', 'Project Sentinel', 'Project Keystone', 'Project Nebula'][Math.floor(Math.random() * 4)];

    for (let i = 0; i < count; i++) {
      let model = 'gpt-4o';
      if (connector.provider === 'anthropic') model = 'claude-3-5-sonnet';
      else if (connector.provider === 'gemini') model = 'gemini-1.5-pro';
      else if (connector.provider === 'copilot') model = 'copilot-codex-v2';
      else if (connector.provider === 'cursor') model = 'claude-3-5-sonnet';

      const tokensIn = Math.floor(Math.random() * 600) + 150;
      const tokensOut = Math.floor(Math.random() * 400) + 80;

      events.push({
        source: connector.tool_type === 'copilot_extension' ? 'copilot_api' : connector.tool_type === 'cursor_ide' ? 'cursor_logs' : 'provider_dashboard',
        provider: connector.provider,
        tool: connector.name,
        model,
        team,
        developer: devIdentifier,
        project,
        workflow: connector.tool_type === 'copilot_extension' ? 'Inline Code Completion' : connector.tool_type === 'cursor_ide' ? 'AI Composer & Chat' : 'Direct API Task',
        prompt_text: `Automated dev task synced via ${connector.name} connector`,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        timestamp: now - (i * 3600000) - Math.floor(Math.random() * 1800000),
        latency: parseFloat((0.2 + Math.random() * 0.8).toFixed(2)),
        status: 'Optimal',
        metadata: { connector_id: connector.id, sync_batch: true }
      });
    }

    return events;
  }
}
