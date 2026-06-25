import React from 'react';
import { useAppState } from '../context/StateContext';

export const IntegrationsScreen: React.FC = () => {
  const { providers, toggleProvider } = useAppState();

  const integrations = [
    { id: 'slack', name: 'Slack Alerts', desc: 'Push governance alerts and budget warnings to Slack channels.', icon: 'chat', connected: true },
    { id: 'datadog', name: 'Datadog', desc: 'Export telemetry metrics to Datadog dashboards.', icon: 'monitoring', connected: false },
    { id: 'jira', name: 'Jira', desc: 'Auto-create tickets for policy violations and cost anomalies.', icon: 'bug_report', connected: false },
    { id: 'snowflake', name: 'Snowflake', desc: 'Sync AI spend data to your data warehouse.', icon: 'cloud', connected: true },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
          <span>Platform</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Integrations</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Integrations Hub</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Connect Peek to your LLM providers, observability stack, and enterprise tools.
        </p>
      </header>

      <div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">LLM Providers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <div key={p.id} className="glass-card rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-on-surface">{p.name}</span>
                  <span className={`w-2 h-2 rounded-full ${p.status === 'connected' ? 'bg-emerald-500' : 'bg-outline'}`}></span>
                </div>
                <p className="text-xs text-on-surface-variant mb-2">
                  Models: {p.models.join(', ')}
                </p>
                <span className={`text-[10px] uppercase font-bold ${p.status === 'connected' ? 'text-emerald-400' : 'text-outline'}`}>
                  {p.status}
                </span>
              </div>
              <button
                onClick={() => toggleProvider(p.id)}
                className="mt-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-primary hover:bg-surface-variant transition-all"
              >
                {p.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Enterprise Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((int) => (
            <div key={int.id} className="glass-card rounded-xl p-6 flex items-start gap-4">
              <span className="material-symbols-outlined text-primary text-[32px]">{int.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-on-surface">{int.name}</h4>
                  {int.connected && (
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950/40 text-emerald-400">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-body-sm text-on-surface-variant mt-1">{int.desc}</p>
                <button className="mt-3 text-xs font-bold text-primary hover:underline">
                  {int.connected ? 'Configure' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
