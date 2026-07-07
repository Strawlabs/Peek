import React, { useState } from 'react';
import { useAppState, type ChannelConfig, type EnterpriseIntegration } from '../context/StateContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChannelId = 'slack' | 'teams';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SLACK_CHANNELS = ['#governance-alerts', '#budget-warnings', '#ai-ops', '#security', '#general'];
const TEAMS_CHANNELS = ['AI Governance', 'Budget Alerts', 'Security Team', 'Engineering', 'Leadership'];

function ConfigModal({
  channel,
  onSave,
  onClose,
}: {
  channel: ChannelConfig;
  onSave: (updated: ChannelConfig) => void;
  onClose: () => void;
}) {
  const [webhookUrl, setWebhookUrl] = useState(channel.webhookUrl);
  const [targetChannel, setTargetChannel] = useState(channel.targetChannel);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isSlack = channel.id === 'slack';
  const channelOptions = isSlack ? SLACK_CHANNELS : TEAMS_CHANNELS;
  const placeholder = isSlack
    ? 'https://hooks.slack.com/services/T.../B.../...'
    : 'https://outlook.office.com/webhook/...';

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API call
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      onSave({ ...channel, webhookUrl, targetChannel, connected: !!webhookUrl });
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md mx-4 border border-outline-variant shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{isSlack ? '💬' : '🟦'}</span>
          <div>
            <h3 className="font-bold text-on-surface text-lg">
              Configure {channel.name}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {isSlack ? 'Connect via Incoming Webhook' : 'Connect via Teams Webhook Connector'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Webhook URL */}
        <label className="block mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
            Webhook URL
          </span>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
          />
          <p className="text-[10px] text-on-surface-variant mt-1">
            {isSlack
              ? 'Create one at api.slack.com → Your Apps → Incoming Webhooks'
              : 'Create one in Teams channel settings → Connectors → Incoming Webhook'}
          </p>
        </label>

        {/* Target channel */}
        <label className="block mb-6">
          <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
            {isSlack ? 'Post to Channel' : 'Post to Team Channel'}
          </span>
          <select
            value={targetChannel}
            onChange={(e) => setTargetChannel(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
          >
            {channelOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {/* Notification types (display only) */}
        <div className="mb-6">
          <span className="text-xs font-bold text-on-surface-variant uppercase mb-2 block">
            Alert Types Delivered
          </span>
          <div className="flex flex-wrap gap-2">
            {['PII Leak', 'Budget Exceeded', 'Policy Violation', 'High Cost Spike'].map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-variant transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!webhookUrl || saving || saved}
            className="flex-1 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Saved!
              </>
            ) : (
              'Save & Connect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function EnterpriseConfigModal({
  integration,
  onSave,
  onClose,
}: {
  integration: EnterpriseIntegration;
  onSave: (id: 'datadog' | 'jira' | 'snowflake' | 'pagerduty', connected: boolean, config: Record<string, string>) => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [apiKey, setApiKey] = useState(integration.config?.apiKey || '');
  const [site, setSite] = useState(integration.config?.site || 'datadoghq.com');

  const [siteUrl, setSiteUrl] = useState(integration.config?.siteUrl || '');
  const [email, setEmail] = useState(integration.config?.email || '');
  const [apiToken, setApiToken] = useState(integration.config?.apiToken || '');

  const [account, setAccount] = useState(integration.config?.account || '');
  const [warehouse, setWarehouse] = useState(integration.config?.warehouse || 'COMPUTE_WH');
  const [database, setDatabase] = useState(integration.config?.database || 'PEEK_DB');
  const [username, setUsername] = useState(integration.config?.username || '');
  const [password, setPassword] = useState(integration.config?.password || '');

  const [routingKey, setRoutingKey] = useState(integration.config?.routingKey || '');

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);

    let config: Record<string, string> = {};
    if (integration.id === 'datadog') {
      config = { apiKey, site };
    } else if (integration.id === 'jira') {
      config = { siteUrl, email, apiToken };
    } else if (integration.id === 'snowflake') {
      config = { account, warehouse, database, username, password };
    } else if (integration.id === 'pagerduty') {
      config = { routingKey };
    }

    setTimeout(() => {
      onSave(integration.id, true, config);
      onClose();
    }, 600);
  };

  const isFormValid = () => {
    if (integration.id === 'datadog') return !!apiKey;
    if (integration.id === 'jira') return !!siteUrl && !!email && !!apiToken;
    if (integration.id === 'snowflake') return !!account && !!username && !!password;
    if (integration.id === 'pagerduty') return !!routingKey;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md mx-4 border border-outline-variant shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">{integration.icon}</span>
          <div>
            <h3 className="font-bold text-on-surface text-lg">
              Configure {integration.name}
            </h3>
            <p className="text-xs text-on-surface-variant">
              Set up enterprise sync and alert routing
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Dynamic Fields */}
        <div className="space-y-4 mb-6">
          {integration.id === 'datadog' && (
            <>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Datadog API Key
                </span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Datadog API Key"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Datadog Site
                </span>
                <select
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="datadoghq.com">US1 (datadoghq.com)</option>
                  <option value="us3.datadoghq.com">US3 (us3.datadoghq.com)</option>
                  <option value="us5.datadoghq.com">US5 (us5.datadoghq.com)</option>
                  <option value="datadoghq.eu">EU1 (datadoghq.eu)</option>
                  <option value="ap1.datadoghq.com">AP1 (ap1.datadoghq.com)</option>
                </select>
              </label>
            </>
          )}

          {integration.id === 'jira' && (
            <>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Jira Site URL
                </span>
                <input
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://company.atlassian.net"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Atlassian Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Atlassian API Token
                </span>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter API Token"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
                />
              </label>
            </>
          )}

          {integration.id === 'snowflake' && (
            <>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Snowflake Account Identifier
                </span>
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="e.g. xy12345.us-east-1"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                    Warehouse
                  </span>
                  <input
                    type="text"
                    value={warehouse}
                    onChange={(e) => setWarehouse(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                    Database
                  </span>
                  <input
                    type="text"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Username
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="PEEK_SYNC"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
                />
              </label>
            </>
          )}

          {integration.id === 'pagerduty' && (
            <>
              <label className="block">
                <span className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">
                  PagerDuty Routing Key
                </span>
                <input
                  type="password"
                  value={routingKey}
                  onChange={(e) => setRoutingKey(e.target.value)}
                  placeholder="Enter Routing Key"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface font-mono placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
                />
              </label>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-variant transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid() || saving || saved}
            className="flex-1 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Saved!
              </>
            ) : (
              'Save & Connect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const IntegrationsScreen: React.FC = () => {
  const { providers, toggleProvider, notifications, sendTestNotification, channels, updateChannelConfig, enterpriseIntegrations, updateEnterpriseIntegration } = useAppState();
  const [activeTab, setActiveTab] = useState<'providers' | 'enterprise' | 'notifications'>('providers');
  const [modalChannel, setModalChannel] = useState<ChannelConfig | null>(null);
  const [modalIntegration, setModalIntegration] = useState<EnterpriseIntegration | null>(null);

  const handleSaveChannel = (updated: ChannelConfig) => {
    updateChannelConfig(updated.id, updated.webhookUrl, updated.targetChannel, updated.connected);
  };

  const handleDisconnect = (id: ChannelId) => {
    updateChannelConfig(id, '', '', false);
  };

  const [sendingTest, setSendingTest] = useState<ChannelId | null>(null);

  const handleSendTest = async (channel: ChannelConfig) => {
    setSendingTest(channel.id);
    await sendTestNotification(channel.id, channel.name, channel.targetChannel);
    await new Promise((r) => setTimeout(r, 1200));
    setSendingTest(null);
  };

  const tabs = [
    { id: 'providers', label: 'LLM Providers', icon: 'hub' },
    { id: 'enterprise', label: 'Enterprise', icon: 'extension' },
    { id: 'notifications', label: 'Notification Log', icon: 'notifications', badge: notifications.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="mb-6">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
          <span>Platform</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Integrations</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Integrations Hub</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Connect Peek to your LLM providers, observability stack, and enterprise messaging tools.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary shadow'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
            {'badge' in tab && tab.badge > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: LLM Providers ─────────────────────────────────────────────── */}
      {activeTab === 'providers' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div key={p.id} className="glass-card rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-on-surface">{p.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-outline'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2">
                    Models: {p.models.join(', ')}
                  </p>
                  <span
                    className={`text-[10px] uppercase font-bold ${
                      p.status === 'connected' ? 'text-emerald-400' : 'text-outline'
                    }`}
                  >
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
      )}

      {/* ── Tab: Enterprise Integrations ───────────────────────────────────── */}
      {activeTab === 'enterprise' && (
        <div className="space-y-6">
          {/* Messaging Channels */}
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
              Notification Channels
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">
              Deliver governance alerts, budget warnings, and policy violations to your team in real time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((ch) => (
                <div key={ch.id} className="glass-card rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl mt-0.5">{ch.id === 'slack' ? '💬' : '🟦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-on-surface">{ch.name}</h4>
                        {ch.connected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                            Connected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-surface-container text-outline border border-outline-variant">
                            Not Connected
                          </span>
                        )}
                      </div>

                      {ch.connected && (
                        <p className="text-xs text-on-surface-variant truncate mb-1">
                          → {ch.targetChannel}
                        </p>
                      )}

                      {ch.connected && (
                        <p className="text-[10px] text-outline font-mono truncate mb-3">
                          {ch.webhookUrl.slice(0, 48)}…
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setModalChannel(ch)}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/20 transition-all"
                        >
                          {ch.connected ? 'Reconfigure' : 'Connect'}
                        </button>

                        {ch.connected && (
                          <>
                            <button
                              onClick={() => handleSendTest(ch)}
                              disabled={sendingTest === ch.id}
                              className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-variant disabled:opacity-50 transition-all flex items-center gap-1"
                            >
                              {sendingTest === ch.id ? (
                                <>
                                  <span className="w-3 h-3 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin" />
                                  Sending…
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[12px]">send</span>
                                  Test
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDisconnect(ch.id)}
                              className="px-3 py-1.5 rounded-lg border border-rose-800/40 text-xs font-bold text-rose-400 hover:bg-rose-950/20 transition-all"
                            >
                              Disconnect
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other integrations */}
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
              Observability & Workflow
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enterpriseIntegrations.map((int) => (
                <div key={int.id} className="glass-card rounded-xl p-6 flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary text-[32px]">{int.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-on-surface">{int.name}</h4>
                      {int.connected ? (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-surface-container text-outline border border-outline-variant">
                          Not Connected
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-1">{int.desc}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setModalIntegration(int)}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        {int.connected ? 'Configure' : 'Connect'}
                      </button>
                      {int.connected && (
                        <button
                          onClick={() => updateEnterpriseIntegration(int.id, false, int.config)}
                          className="px-3 py-1.5 rounded-lg border border-rose-800/40 text-xs font-bold text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Notification Log ──────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Notification Delivery Log
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Simulated alert deliveries sent to connected channels
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
              {notifications.length} events
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-30">notifications_off</span>
              <p className="text-sm font-medium">No notifications delivered yet.</p>
              <p className="text-xs opacity-60">
                Trigger a gateway request with PII or a budget violation to see alerts here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/30">
              {[...notifications].reverse().map((n, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-surface-variant/10 transition-all">
                  <span className="text-xl mt-0.5">{n.channel === 'slack' ? '💬' : n.channel === 'teams' ? '🟦' : '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          n.type === 'pii'
                            ? 'bg-rose-950/40 text-rose-400 border-rose-800/30'
                            : n.type === 'budget'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-800/30'
                            : n.type === 'policy'
                            ? 'bg-purple-950/40 text-purple-400 border-purple-800/30'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {n.type === 'pii'
                          ? 'PII Leak'
                          : n.type === 'budget'
                          ? 'Budget Warning'
                          : n.type === 'policy'
                          ? 'Policy Violation'
                          : 'Test'}
                      </span>
                      <span className="text-xs font-bold text-on-surface">{n.title}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-1">{n.body}</p>
                    <div className="flex items-center gap-3 text-[10px] text-outline">
                      <span>→ {n.destination}</span>
                      <span>•</span>
                      <span>{new Date(n.timestamp).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">✓ Delivered</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Configure Modal */}
      {modalChannel && (
        <ConfigModal
          channel={modalChannel}
          onSave={handleSaveChannel}
          onClose={() => setModalChannel(null)}
        />
      )}

      {/* Configure Enterprise Integration Modal */}
      {modalIntegration && (
        <EnterpriseConfigModal
          integration={modalIntegration}
          onSave={updateEnterpriseIntegration}
          onClose={() => setModalIntegration(null)}
        />
      )}
    </div>
  );
};
