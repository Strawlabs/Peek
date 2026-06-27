import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

export const ProxyPlaygroundScreen: React.FC = () => {
  const { providers, routeGatewayRequest } = useAppState();
  const [prompt, setPrompt] = useState('Process workflow tasks for Support Chatbot');
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o');
  const [team, setTeam] = useState('Engineering');
  const [environment, setEnvironment] = useState('production');
  const [workflow, setWorkflow] = useState('CI/CD Review');
  const [customer, setCustomer] = useState('Alphabet Corp');
  const [trace, setTrace] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: boolean; cost: number; tokens: number; latency: number } | null>(null);
  const [routing, setRouting] = useState(false);

  const connectedProviders = providers.filter((p) => p.status === 'connected');
  const selectedProvider = providers.find((p) => p.id === provider);
  const availableModels = selectedProvider?.models ?? [];

  const handleRoute = async () => {
    setRouting(true);
    setTrace([]);
    setResult(null);
    try {
      const response = await routeGatewayRequest(prompt, provider, model, team, environment, workflow, customer);
      setTrace(response.trace);
      setResult({
        success: response.success,
        cost: response.cost,
        tokens: response.tokens,
        latency: response.latency,
      });
    } finally {
      setRouting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
          <span>Simulation</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Proxy Playground</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Enterprise AI Gateway Playground</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Simulate live proxy routing through Peek&apos;s governance layer — policies, budgets, and telemetry in real time.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">terminal</span>
            Request Payload
          </h3>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary h-24 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  const p = providers.find((pr) => pr.id === e.target.value);
                  if (p?.models[0]) setModel(p.models[0]);
                }}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
              >
                {connectedProviders.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
              >
                <option>Engineering</option>
                <option>Customer Success</option>
                <option>Marketing</option>
                <option>Product Design</option>
                <option>Research</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
              >
                <option>production</option>
                <option>staging</option>
                <option>development</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Workflow</label>
              <input
                value={workflow}
                onChange={(e) => setWorkflow(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Customer</label>
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleRoute}
            disabled={routing}
            className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {routing ? (
              <>
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                Routing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">play_arrow</span>
                Route Through Gateway
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {result && (
            <div className={`glass-card rounded-xl p-6 border ${result.success ? 'border-emerald-800/30' : 'border-rose-800/30'}`}>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Gateway Response</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-outline uppercase">Status</span>
                  <p className={`font-bold ${result.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.success ? 'Success' : 'Blocked'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-outline uppercase">Cost</span>
                  <p className="font-mono text-primary">${result.cost.toFixed(6)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-outline uppercase">Latency</span>
                  <p className="font-mono text-on-surface">{result.latency.toFixed(2)}s</p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-6 flex-1">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3">Execution Trace</h3>
            <div className="bg-surface-container-low rounded-lg p-4 font-mono text-xs text-on-surface-variant space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
              {trace.length === 0 ? (
                <p className="text-outline">Run a request to see gateway trace logs...</p>
              ) : (
                trace.map((line, i) => (
                  <div key={i} className={line.includes('[BLOCK]') ? 'text-rose-400' : line.includes('[WARNING]') ? 'text-amber-400' : ''}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
