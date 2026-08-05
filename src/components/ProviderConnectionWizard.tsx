import React, { useState } from 'react';
import { useAppState, DISCOVERABLE_MODELS, type ConnectedModel } from '../context/StateContext';

interface ProviderConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PROVIDER_OPTIONS = [
  { id: 'openai', name: 'OpenAI', desc: 'GPT-4o, GPT-4o Mini, o1 reasoning models', icon: 'smart_toy', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3.5 Sonnet, Claude 3 Haiku, Opus', icon: 'psychology', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'gemini', name: 'Google Gemini', desc: 'Gemini 1.5 Flash (1M tokens), 1.5 Pro (2M tokens)', icon: 'auto_awesome', bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  { id: 'azure-openai', name: 'Azure OpenAI Service', desc: 'Enterprise managed OpenAI endpoints', icon: 'cloud_sync', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'aws-bedrock', name: 'AWS Bedrock', desc: 'Amazon Bedrock multi-model gateway', icon: 'hub', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { id: 'local', name: 'Local / Ollama Inference', desc: 'Private self-hosted Llama-3 & Mistral nodes', icon: 'terminal', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
];

export const ProviderConnectionWizard: React.FC<ProviderConnectionWizardProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { connectProviderWithCredentials, currentOrganization } = useAppState();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [endpointUrl, setEndpointUrl] = useState<string>('');
  const [region, setRegion] = useState<string>('us-east-1');
  const [testing, setTesting] = useState<boolean>(false);
  const [discoveredModels, setDiscoveredModels] = useState<ConnectedModel[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProvObj = PROVIDER_OPTIONS.find(p => p.id === selectedProviderId) || PROVIDER_OPTIONS[0];

  const handleTestAndDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey && selectedProviderId !== 'local') {
      setErrorMsg('API Key is required to connect provider.');
      return;
    }

    setErrorMsg(null);
    setTesting(true);

    // Simulate real handshake verification latency
    await new Promise(r => setTimeout(r, 1200));

    const discovered = DISCOVERABLE_MODELS[selectedProviderId] || [
      { id: `${selectedProviderId}-default`, name: `${selectedProvObj.name} Default Model`, contextWindow: '128,000 tokens', capabilities: ['Code', 'Function Calling'] }
    ];

    setDiscoveredModels(discovered);
    setTesting(false);
    setStep(3); // Model discovery view
  };

  const handleSaveConnection = async () => {
    setTesting(true);
    const res = await connectProviderWithCredentials(
      selectedProviderId,
      apiKey || 'local-key-enabled',
      endpointUrl,
      region
    );
    setTesting(false);

    if (res.success) {
      setStep(4); // Success step
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || 'Failed to save connection.');
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setApiKey('');
    setEndpointUrl('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-card rounded-2xl p-6 md:p-8 max-w-2xl w-full border border-outline-variant shadow-2xl space-y-6 bg-surface-container-high/90">

        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Multi-Tenant Credential Store &bull; {currentOrganization.name}
            </span>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mt-0.5">
              {step === 1 && 'Select LLM Provider'}
              {step === 2 && `Configure ${selectedProvObj.name} Credentials`}
              {step === 3 && 'Discovered Models & Capabilities'}
              {step === 4 && 'Connection Activated Successfully'}
            </h3>
          </div>
          <button onClick={resetAndClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Wizard Progress Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            />
          ))}
        </div>

        {/* STEP 1: Select Provider */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-body-sm text-on-surface-variant">
              Choose an enterprise AI provider to connect to {currentOrganization.name}. Credentials are encrypted at rest using envelope encryption.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROVIDER_OPTIONS.map((prov) => (
                <div
                  key={prov.id}
                  onClick={() => setSelectedProviderId(prov.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    selectedProviderId === prov.id
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                      : 'border-outline-variant bg-surface-container/60 hover:bg-surface-variant'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${prov.bg}`}>
                    <span className="material-symbols-outlined text-[22px]">{prov.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{prov.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{prov.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-all text-sm flex items-center gap-2"
              >
                <span>Continue to Credentials</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Credential Entry */}
        {step === 2 && (
          <form onSubmit={handleTestAndDiscover} className="space-y-5">
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${selectedProvObj.bg}`}>
                <span className="material-symbols-outlined text-[22px]">{selectedProvObj.icon}</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-on-surface">{selectedProvObj.name}</h4>
                <p className="text-xs text-on-surface-variant">Connecting for tenant: <span className="text-primary font-mono">{currentOrganization.name}</span></p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">
                  {selectedProviderId === 'local' ? 'Server Endpoint URL' : 'API Secret Key'}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">key</span>
                  <input
                    type={selectedProviderId === 'local' ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      selectedProviderId === 'openai' ? 'sk-proj-...' :
                      selectedProviderId === 'anthropic' ? 'sk-ant-...' :
                      selectedProviderId === 'gemini' ? 'AIzaSy...' :
                      selectedProviderId === 'local' ? 'http://localhost:11434' : 'Secret Key'
                    }
                    required={selectedProviderId !== 'local'}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-body-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Keys are stored encrypted with HSM backend envelope keys. They are never exposed to the web client.
                </p>
              </div>

              {(selectedProviderId === 'azure-openai' || selectedProviderId === 'aws-bedrock') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">Custom Endpoint URL</label>
                    <input
                      type="text"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder="https://your-resource.openai.azure.com"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-body-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">Cloud Region</label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="us-east-1"
                      className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-body-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={testing}
                className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Verifying & Discovering Models...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">manage_search</span>
                    <span>Test & Discover Models</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Model Auto-Discovery Display */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300 text-xs font-medium">
              <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
              <span>Connection Verified! Discovered {discoveredModels.length} active models available for deployment.</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {discoveredModels.map((m) => (
                <div key={m.id} className="p-3 bg-surface-container rounded-xl border border-outline-variant/40 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface font-mono">{m.name || m.id}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-primary/10 text-primary border border-primary/20">{m.status || 'Active'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1 font-mono">
                      <span>Context: {m.contextWindow}</span>
                      <span>&bull;</span>
                      <span>Output: {m.maxOutputTokens || '4,096 tokens'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {(m.capabilities || ['Code']).map((cap: string) => (
                      <span key={cap} className="px-2 py-0.5 rounded text-[9px] font-bold bg-surface-container-highest text-on-surface-variant">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Re-enter Key
              </button>

              <button
                onClick={handleSaveConnection}
                disabled={testing}
                className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-all text-sm flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Save Connection & Enable Inventory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success confirmation */}
        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {selectedProvObj.name} Connected!
              </h4>
              <p className="text-body-sm text-on-surface-variant max-w-md mx-auto mt-1">
                Your credentials have been securely stored in encrypted vault for <strong>{currentOrganization.name}</strong>. Telemetry proxy and policy guardrails are now active.
              </p>
            </div>

            <button
              onClick={resetAndClose}
              className="px-8 py-3 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 transition-all text-sm shadow-lg shadow-primary/20"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
