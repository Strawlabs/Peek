import React, { useState } from 'react';
import { useAppState, DISCOVERABLE_MODELS } from '../context/StateContext';

export const ConnectedModelsInventoryScreen: React.FC = () => {
  const { connectedModels, providers, currentOrganization } = useAppState();

  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('All');
  const [capabilityFilter, setCapabilityFilter] = useState('All');

  // Fallback to all discoverable models from connected providers if state array is loading
  const activeProviders = providers.filter(p => p.status === 'connected');
  const displayModels = connectedModels.length > 0
    ? connectedModels
    : activeProviders.flatMap(p => DISCOVERABLE_MODELS[p.id] || []);

  const filteredModels = displayModels.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
    const matchProvider = providerFilter === 'All' || m.providerId === providerFilter;
    const matchCapability = capabilityFilter === 'All' || m.capabilities.includes(capabilityFilter as any);
    return matchSearch && matchProvider && matchCapability;
  });

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Inventory</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Connected Models Inventory</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Connected Models Inventory</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Real-time catalog of active LLM models, context windows, capabilities, and telemetry for <span className="text-primary font-semibold">{currentOrganization.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-xs text-on-surface flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">{activeProviders.length} Connected Providers</span>
          </div>
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-5 border border-outline-variant">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Total Discovered Models</span>
          <p className="text-headline-lg font-bold text-primary mt-1">{displayModels.length}</p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-outline-variant">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Vision Enabled</span>
          <p className="text-headline-lg font-bold text-sky-400 mt-1">
            {displayModels.filter(m => m.capabilities.includes('Vision')).length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-outline-variant">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Function Calling Capable</span>
          <p className="text-headline-lg font-bold text-amber-400 mt-1">
            {displayModels.filter(m => m.capabilities.includes('Function Calling')).length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5 border border-outline-variant">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Max Context Window</span>
          <p className="text-headline-lg font-bold text-emerald-400 mt-1">2,000,000</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search model name, ID, or provider..."
            className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none"
          >
            <option value="All">Provider: All</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Google Gemini</option>
            <option value="azure-openai">Azure OpenAI</option>
            <option value="aws-bedrock">AWS Bedrock</option>
            <option value="local">Local Inference</option>
          </select>

          <select
            value={capabilityFilter}
            onChange={(e) => setCapabilityFilter(e.target.value)}
            className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none"
          >
            <option value="All">Capability: All</option>
            <option value="Vision">Vision</option>
            <option value="Function Calling">Function Calling</option>
            <option value="Code">Code</option>
            <option value="Reasoning">Reasoning</option>
            <option value="Audio">Audio</option>
          </select>
        </div>
      </div>

      {/* Grid of Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="glass-card rounded-xl p-6 border border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono block">
                    {model.providerName}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
                    {model.name}
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                  model.status === 'Active' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                }`}>
                  {model.status}
                </span>
              </div>

              <div className="bg-surface-container/60 p-3 rounded-lg border border-outline-variant/30 space-y-1.5 text-xs font-mono text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Context Window:</span>
                  <span className="text-on-surface font-bold">{model.contextWindow}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Output:</span>
                  <span className="text-on-surface font-bold">{model.maxOutputTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prompt Cost:</span>
                  <span className="text-primary font-bold">{model.pricingPrompt}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider block">Capabilities</span>
                <div className="flex flex-wrap gap-1.5">
                  {model.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex justify-between items-center text-xs">
              <span className="text-on-surface-variant font-mono">
                {model.requestsCount ? `${model.requestsCount} requests logged` : 'Active Gateway Route'}
              </span>
              <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
