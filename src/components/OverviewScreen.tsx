import React from 'react';
import { useAppState } from '../context/StateContext';

interface OverviewScreenProps {
  setScreen: (screen: string) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({ setScreen }) => {
  const { requests, policies, recommendations } = useAppState();

  const totalRequests = requests.length;
  const totalCost = requests.reduce((sum, r) => sum + r.cost, 0);
  const activePolicies = policies.filter(p => p.active).length;
  const activeRecsCount = recommendations.filter(r => r.status === 'active').length;

  const averageLatency = totalRequests > 0 
    ? requests.reduce((sum, r) => sum + r.latency, 0) / totalRequests 
    : 0;

  const latestRequests = [...requests]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Peek</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Executive Overview</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Enterprise AI Intelligence Overview</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Understand where AI is being used, what it costs, what value it creates, and what actions require attention.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span> Export Report
          </button>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all shadow-md shadow-primary/10">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span> Last 30 Days
          </button>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between h-36">
          <div>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">TOTAL SPEND (30d)</span>
            <h3 className="text-headline-lg text-primary font-bold mt-1">
              ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <span onClick={() => setScreen('spend')} className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1">
            Analyze Spend <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>

        <div className="glass-card rounded-xl p-6 flex flex-col justify-between h-36">
          <div>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">TOTAL REQUESTS</span>
            <h3 className="text-headline-lg text-on-surface font-bold mt-1">
              {totalRequests.toLocaleString()}
            </h3>
          </div>
          <span onClick={() => setScreen('tba')} className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1">
            View Performance <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>

        <div className="glass-card rounded-xl p-6 flex flex-col justify-between h-36">
          <div>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">ACTIVE POLICIES</span>
            <h3 className="text-headline-lg text-emerald-400 font-bold mt-1">
              {activePolicies} / {policies.length}
            </h3>
          </div>
          <span onClick={() => setScreen('governance')} className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1">
            Manage Rules <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>

        <div className="glass-card rounded-xl p-6 flex flex-col justify-between h-36">
          <div>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">PENDING ACTIONS</span>
            <h3 className="text-headline-lg text-tertiary font-bold mt-1">
              {activeRecsCount} Recommendations
            </h3>
          </div>
          <span onClick={() => setScreen('intelligence')} className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1">
            Optimize Now <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Telemetry */}
        <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Telemetry Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant text-[11px] text-outline font-bold uppercase">
                  <th className="py-2">Time</th>
                  <th className="py-2">Team</th>
                  <th className="py-2">Workflow</th>
                  <th className="py-2">Model</th>
                  <th className="py-2 text-right">Cost</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-body-sm text-on-surface-variant">
                {latestRequests.map((r) => {
                  const dateStr = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={r.id} className="hover:bg-surface-variant/20 transition-colors">
                      <td className="py-3 font-mono">{dateStr}</td>
                      <td className="py-3">{r.team}</td>
                      <td className="py-3">{r.workflow}</td>
                      <td className="py-3 font-mono text-xs">{r.provider}/{r.model}</td>
                      <td className="py-3 text-right font-mono">${r.cost.toFixed(4)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status.includes('Leak') || r.status.includes('Blocked') 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : r.status.includes('Flagged') 
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : r.status === 'High Cost' 
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={() => setScreen('sandbox')} className="w-full py-2 bg-surface-container hover:bg-surface-variant text-primary text-xs font-bold rounded-lg border border-primary/10 transition-all">
            Test Live Proxy Telemetry
          </button>
        </div>

        {/* Quick Insights */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Key AI Insights</h3>
          <div className="space-y-3">
            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">speed</span>
                <span className="text-body-md font-bold">Average Latency</span>
              </div>
              <p className="text-xl font-bold text-on-surface mt-1">{averageLatency.toFixed(2)}s</p>
              <p className="text-xs text-on-surface-variant mt-1">Across 30 days of production data flow.</p>
            </div>

            <div className="p-3 bg-surface-container rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2 text-amber-400">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <span className="text-body-md font-bold">Security Breaches Blocked</span>
              </div>
              <p className="text-xl font-bold text-on-surface mt-1">
                {requests.filter(r => r.status.includes('Blocked')).length} Requests
              </p>
              <p className="text-xs text-on-surface-variant mt-1">PII leakage prevented by Gateway rules.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Risk Alerts Panel (Task 6) ─── */}
      <RiskAlertsPanel requests={requests} setScreen={setScreen} />
    </div>
  );
};

/* ─── Risk Alerts Panel ─── */
const RiskAlertsPanel: React.FC<{
  requests: ReturnType<typeof useAppState>['requests'];
  setScreen: (s: string) => void;
}> = ({ requests, setScreen }) => {
  const piiLeaks = requests.filter(r => r.status.includes('PII'));
  const modelViolations = requests.filter(r => r.status.includes('Policy'));
  const highCost = requests.filter(r => r.status === 'High Cost');
  const blocked = requests.filter(r => r.status.includes('Blocked'));

  const alerts = [
    {
      id: 'risk-pii',
      severity: 'critical' as const,
      icon: 'privacy_tip',
      title: 'PII Exposure Events Detected',
      count: piiLeaks.length,
      detail: `${piiLeaks.length} request${piiLeaks.length !== 1 ? 's' : ''} flagged for PII leakage (SSN, email, credit card patterns) in prompt payloads.`,
      action: 'View Audit Logs',
      screen: 'governance',
    },
    {
      id: 'risk-block',
      severity: 'critical' as const,
      icon: 'block',
      title: 'Gateway Blocked Requests',
      count: blocked.length,
      detail: `${blocked.length} request${blocked.length !== 1 ? 's' : ''} rejected by Gateway policy enforcement before reaching downstream providers.`,
      action: 'Review Policies',
      screen: 'governance',
    },
    {
      id: 'risk-model',
      severity: 'warning' as const,
      icon: 'policy',
      title: 'Model Restriction Violations',
      count: modelViolations.length,
      detail: `${modelViolations.length} request${modelViolations.length !== 1 ? 's' : ''} used non-approved models in restricted environments.`,
      action: 'Manage Policies',
      screen: 'governance',
    },
    {
      id: 'risk-cost',
      severity: 'info' as const,
      icon: 'attach_money',
      title: 'High-Cost Requests Logged',
      count: highCost.length,
      detail: `${highCost.length} request${highCost.length !== 1 ? 's' : ''} exceeded the per-request cost threshold. Review model selection.`,
      action: 'View Intelligence',
      screen: 'intelligence',
    },
  ].filter(a => a.count > 0);

  if (alerts.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6 flex items-center gap-4">
        <span className="material-symbols-outlined text-emerald-400 text-[40px]">shield</span>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">All Systems Nominal</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">No active risk alerts. Gateway policies are operating within expected parameters.</p>
        </div>
      </div>
    );
  }

  const severityStyles = {
    critical: {
      border: 'border-rose-800/40',
      bg: 'bg-rose-950/20',
      badge: 'bg-rose-950/50 text-rose-400 border-rose-800/40',
      icon: 'text-rose-400',
      dot: 'bg-rose-400 animate-pulse',
    },
    warning: {
      border: 'border-amber-800/40',
      bg: 'bg-amber-950/20',
      badge: 'bg-amber-950/50 text-amber-400 border-amber-800/40',
      icon: 'text-amber-400',
      dot: 'bg-amber-400',
    },
    info: {
      border: 'border-cyan-800/40',
      bg: 'bg-cyan-950/20',
      badge: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/40',
      icon: 'text-cyan-400',
      dot: 'bg-cyan-400',
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400 text-[22px]">crisis_alert</span>
          Active Risk Alerts
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/50 text-rose-400 border border-rose-800/40">
            {alerts.length} Active
          </span>
        </h3>
        <button
          onClick={() => setScreen('governance')}
          className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
        >
          View All in Audit Logs <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert) => {
          const s = severityStyles[alert.severity];
          return (
            <div
              key={alert.id}
              className={`rounded-xl p-5 border ${s.border} ${s.bg} flex flex-col gap-3 transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start gap-3">
                <div className="relative mt-0.5">
                  <span className={`material-symbols-outlined text-[28px] ${s.icon}`}>{alert.icon}</span>
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${s.dot}`} />
                </div>
                <div>
                  <h4 className="font-bold text-on-surface text-sm">{alert.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${s.badge} uppercase mt-1 inline-block`}>
                    {alert.severity} · {alert.count} event{alert.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">{alert.detail}</p>
              <button
                onClick={() => setScreen(alert.screen)}
                className="self-start text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                {alert.action} <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
