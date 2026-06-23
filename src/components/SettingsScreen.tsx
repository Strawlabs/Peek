import React from 'react';
import { useAppState } from '../context/StateContext';

export const SettingsScreen: React.FC = () => {
  const { providers, toggleProvider, resetSystemState } = useAppState();

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
          <span>Admin</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Organization Settings</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Organization Settings</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Configure provider connections, data residency, and system preferences.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">LLM Provider Connections</h3>
          <div className="space-y-3">
            {providers.map((p) => (
              <div key={p.id} className="p-4 bg-surface-container rounded-lg border border-outline-variant flex justify-between items-center">
                <div>
                  <span className="font-bold text-on-surface">{p.name}</span>
                  <p className="text-xs text-on-surface-variant font-mono mt-1">
                    {p.status === 'connected' ? p.apiKey || 'Connected' : 'Not connected'}
                  </p>
                </div>
                <button
                  onClick={() => toggleProvider(p.id)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${
                    p.status === 'connected' ? 'bg-primary flex justify-end' : 'bg-surface-variant flex justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-surface-container"></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Data Residency</h3>
            <div className="p-4 bg-surface-container rounded-lg border border-outline-variant flex items-center justify-between">
              <div>
                <span className="font-bold text-on-surface">US-East (Virginia)</span>
                <p className="text-xs text-on-surface-variant mt-1">Primary telemetry and audit log region</p>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-3 border border-rose-800/20">
            <h3 className="font-headline-sm text-headline-sm text-rose-400">Danger Zone</h3>
            <p className="text-body-sm text-on-surface-variant">
              Reset all telemetry data and regenerate fresh 30-day simulation data. Policies and user settings are preserved.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Reset all telemetry and regenerate simulation data?')) {
                  resetSystemState();
                }
              }}
              className="px-4 py-2 border border-rose-800 text-rose-400 rounded-lg font-label-md hover:bg-rose-950/30 transition-all"
            >
              Reset Simulation Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
