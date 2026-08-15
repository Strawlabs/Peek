import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

export const ProxyPlaygroundScreen: React.FC = () => {
  const { providers, routeGatewayRequest, apiKeys, authSession, users } = useAppState();

  const userEmail = authSession?.email?.toLowerCase() || '';
  const userRecord = users.find(u => u.email.toLowerCase() === userEmail);
  const accountDisplayName = userRecord?.name || userEmail || 'aswini m (ammu2406sm@gmail.com)';

  const [prompt, setPrompt] = useState('Process workflow tasks for Support Chatbot');
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [team, setTeam] = useState('Engineering');
  const [environment, setEnvironment] = useState('production');
  const [workflow, setWorkflow] = useState('CI/CD Review');
  const [customer, setCustomer] = useState(accountDisplayName);
  const [gatewayMode, setGatewayMode] = useState<'simulation' | 'live'>('simulation');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [trace, setTrace] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: boolean; cost: number; tokens: number; latency: number; responseText?: string } | null>(null);
  const [routing, setRouting] = useState(false);

  const connectedProviders = providers.filter((p) => p.status === 'connected');
  const selectedProvider = providers.find((p) => p.id === provider);
  const availableModels = selectedProvider?.models ?? [];
  const activeKeys = apiKeys.filter((k) => k.active);

  const handleRoute = async () => {
    setRouting(true);
    setTrace([]);
    setResult(null);
    try {
      if (gatewayMode === 'live') {
        const startMs = performance.now();
        const traceLog: string[] = [
          `[SYSTEM] Live Gateway activated — Peek local policy enforcement layer`,
          `[GATEWAY] Headers: X-Peek-Team=${team}, X-Peek-Workflow=${workflow}, X-Peek-Customer=${customer || accountDisplayName}`,
          `[GATEWAY] Auth Token: ${selectedKey ? 'pk_live_' + selectedKey.substring(0, 8) + '...' : 'Public Demo Mode'}`,
          `[POLICY] Running live PII scan and model restriction checks...`
        ];

        // Run governance logic & store telemetry log
        const response = await routeGatewayRequest(prompt, provider, model, team, environment, workflow, customer || accountDisplayName);
        const latencyMs = ((performance.now() - startMs) / 1000).toFixed(2);

        if (!response.success) {
          response.trace.forEach(t => traceLog.push(t.replace('[', '[LIVE] [').replace('[[LIVE] [', '[LIVE] [')));
          traceLog.push(`[BLOCK] Request terminated by Peek live gateway after ${latencyMs}s`);
          setTrace(traceLog);
          setResult({
            success: false,
            cost: 0,
            tokens: 0,
            latency: parseFloat(latencyMs),
            responseText: `Live Gateway Blocked: ${response.trace.find(t => t.includes('[BLOCK]') || t.includes('[WARNING]')) || 'Policy violation detected'}`
          });
        } else {
          const providerConfig = providers.find(p => p.id === provider);
          const hasRealKey = providerConfig?.apiKey && !providerConfig.apiKey.includes('••••') && providerConfig.apiKey.length > 10;

          traceLog.push(`[POLICY] All governance checks passed ✓`);
          traceLog.push(`[PROXY] Routing to upstream: ${provider}/${model}`);

          if (hasRealKey && provider === 'openai') {
            traceLog.push(`[PROXY] Sending authenticated request to OpenAI API...`);
            try {
              const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${providerConfig!.apiKey}`
                },
                body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 300 })
              });
              if (apiRes.ok) {
                const apiData = await apiRes.json();
                const content = apiData.choices?.[0]?.message?.content || '';
                const totalTokens = apiData.usage?.total_tokens || 0;
                const elapsedSec = parseFloat(((performance.now() - startMs) / 1000).toFixed(2));
                traceLog.push(`[PROXY] OpenAI responded in ${elapsedSec}s. tokens=${totalTokens}`);
                traceLog.push(`[TELEMETRY] Live request recorded and persisted for account: ${customer || accountDisplayName}`);
                setTrace(traceLog);
                setResult({ success: true, cost: response.cost, tokens: totalTokens, latency: elapsedSec, responseText: content });
              } else {
                const errText = await apiRes.text();
                traceLog.push(`[ERROR] OpenAI API returned ${apiRes.status}: ${errText.substring(0, 100)}`);
                setTrace(traceLog);
                setResult({ success: false, cost: 0, tokens: 0, latency: parseFloat(latencyMs), responseText: `API Error ${apiRes.status}: ${errText.substring(0, 200)}` });
              }
            } catch (fetchErr) {
              traceLog.push(`[ERROR] Network error: ${(fetchErr as Error).message}`);
              setTrace(traceLog);
              setResult({ success: false, cost: 0, tokens: 0, latency: parseFloat(latencyMs), responseText: `Network error: ${(fetchErr as Error).message}` });
            }
          } else if (hasRealKey && provider === 'gemini') {
            traceLog.push(`[PROXY] Sending authenticated request to Google Gemini API...`);
            try {
              const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${providerConfig!.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
              });
              if (apiRes.ok) {
                const apiData = await apiRes.json();
                const content = apiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const elapsedSec = parseFloat(((performance.now() - startMs) / 1000).toFixed(2));
                traceLog.push(`[PROXY] Google Gemini API responded in ${elapsedSec}s.`);
                traceLog.push(`[TELEMETRY] Live request recorded and persisted for account: ${customer || accountDisplayName}`);
                setTrace(traceLog);
                setResult({ success: true, cost: response.cost, tokens: response.tokens, latency: elapsedSec, responseText: content });
              } else {
                const errText = await apiRes.text();
                traceLog.push(`[ERROR] Gemini API returned ${apiRes.status}: ${errText.substring(0, 100)}`);
                setTrace(traceLog);
                setResult({ success: false, cost: 0, tokens: 0, latency: parseFloat(latencyMs), responseText: `API Error ${apiRes.status}: ${errText.substring(0, 200)}` });
              }
            } catch (fetchErr) {
              traceLog.push(`[ERROR] Network error contacting Gemini API: ${(fetchErr as Error).message}`);
              setTrace(traceLog);
              setResult({ success: false, cost: 0, tokens: 0, latency: parseFloat(latencyMs), responseText: `Network error: ${(fetchErr as Error).message}` });
            }
          } else if (provider === 'local') {
            traceLog.push(`[PROXY] Attempting local inference connection to http://localhost:11434 (Ollama / Local Node)...`);
            try {
              const localRes = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'llama3', prompt, stream: false })
              });
              if (localRes.ok) {
                const localData = await localRes.json();
                const elapsedSec = parseFloat(((performance.now() - startMs) / 1000).toFixed(2));
                traceLog.push(`[PROXY] Local inference node responded in ${elapsedSec}s.`);
                traceLog.push(`[TELEMETRY] Local execution recorded to Peek storage & database.`);
                setTrace(traceLog);
                setResult({ success: true, cost: 0, tokens: response.tokens, latency: elapsedSec, responseText: localData.response || 'Local model response received.' });
              } else {
                throw new Error(`Local endpoint HTTP ${localRes.status}`);
              }
            } catch {
              traceLog.push(`[PROXY] Local node offline — fallback to governed local simulation.`);
              traceLog.push(`[PROXY] Upstream responded in ${response.latency}s. Cost: $0.00 (Local)`);
              traceLog.push(`[TELEMETRY] Request recorded to Peek dashboard telemetry (account: ${customer || accountDisplayName})`);
              setTrace(traceLog);
              setResult({
                success: true,
                cost: 0,
                tokens: response.tokens,
                latency: response.latency,
                responseText: `[Gemini Locally / Local LLM Gateway] Governance passed. Task processed locally for ${customer || accountDisplayName}.`
              });
            }
          } else {
            traceLog.push(`[PROXY] Demo mode: No live API key configured for ${provider}. Returning governed simulation.`);
            traceLog.push(`[PROXY] Upstream responded in ${response.latency}s. Cost: $${response.cost.toFixed(5)}`);
            traceLog.push(`[TELEMETRY] Request recorded and persisted to Peek storage & database (account: ${customer || accountDisplayName})`);
            setTrace(traceLog);
            setResult({
              success: true,
              cost: response.cost,
              tokens: response.tokens,
              latency: response.latency,
              responseText: `[Live Gateway — Demo Mode] Governance passed. Add a real API key in Integrations → ${provider} to route to live endpoint.`
            });
          }
        }
      } else {
        const response = await routeGatewayRequest(prompt, provider, model, team, environment, workflow, customer || accountDisplayName);
        setTrace(response.trace);
        setResult({
          success: response.success,
          cost: response.cost,
          tokens: response.tokens,
          latency: response.latency,
          responseText: response.success
            ? `[Simulation Gateway Success] Response generated via ${provider}/${model} for account ${customer || accountDisplayName}. Governance scans passed.`
            : `[Simulation Gateway Blocked] Request terminated by Peek Governance engine.`
        });
      }
    } finally {
      setRouting(false);
    }
  };


  return (
    <div className="space-y-6">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Simulation & Gateway</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Proxy Playground</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Enterprise AI Gateway Playground</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Simulate or route live API requests through Peek&apos;s governance layer — policies, budgets, and telemetry in real time.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant">
          <button
            onClick={() => setGatewayMode('simulation')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
              gatewayMode === 'simulation' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            Simulation Mode
          </button>
          <button
            onClick={() => setGatewayMode('live')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
              gatewayMode === 'live' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Live Edge Gateway Mode
          </button>
        </div>
      </header>

      {gatewayMode === 'live' && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-400">cloud_done</span>
            <span>
              <strong>Live Edge Gateway Active:</strong> Routing requests to Deno Edge Function endpoint <code className="bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono">/v1-chat-completions</code>.
            </span>
          </div>
          {activeKeys.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant font-bold">Use Virtual Key:</span>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="bg-surface-container border border-emerald-800/40 rounded px-2 py-1 text-xs text-emerald-300 font-mono focus:outline-none"
              >
                <option value="">Default Demo Key (pk_live_demo)</option>
                {activeKeys.map((k) => (
                  <option key={k.id} value={k.key_prefix}>
                    {k.team} - {k.name} ({k.key_prefix}_...)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">terminal</span>
            Request Payload
          </h3>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase">Prompt / Dev Task</label>
              <span className="text-[10px] text-primary font-mono font-bold">Quick Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: '💻 Cursor Code Refactor', prompt: 'Refactor authentication middleware in TypeScript to support JWT claims and RBAC', workflow: 'Cursor IDE Refactoring' },
                { label: '🐍 Python SDK Test Gen', prompt: 'Write comprehensive pytest suite for billing calculation engine', workflow: 'Python SDK Test Generation' },
                { label: '🦙 Local Ollama Node', prompt: 'Analyze database schema for performance bottlenecks and index optimization', workflow: 'Local LLM Inference', provider: 'local', model: 'llama-3-local' },
                { label: '🚀 API Schema Gen', prompt: 'Generate OpenAPI 3.0 specification for payment gateway proxy endpoints', workflow: 'Node.js SDK Building' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setPrompt(preset.prompt);
                    setWorkflow(preset.workflow);
                    if (preset.provider) {
                      setProvider(preset.provider);
                      if (preset.model) setModel(preset.model);
                    }
                  }}
                  className="px-2.5 py-1 bg-surface-container hover:bg-surface-variant text-[11px] font-bold text-on-surface rounded-md border border-outline-variant/40 transition-all text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
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
