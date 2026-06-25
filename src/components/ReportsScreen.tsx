import React from 'react';
import { useAppState } from '../context/StateContext';

export const ReportsScreen: React.FC = () => {
  const { requests, budgets, policies } = useAppState();
  const totalCost = requests.reduce((sum, r) => sum + r.cost, 0);
  const violations = requests.filter((r) => r.status.includes('Flagged') || r.status.includes('Blocked')).length;

  const reports = [
    { id: 'exec', title: 'Executive Summary Report', desc: 'High-level spend, ROI, and governance overview for leadership.', icon: 'summarize' },
    { id: 'spend', title: 'Detailed Spend Report', desc: 'Provider-level cost breakdown with team attribution.', icon: 'payments' },
    { id: 'gov', title: 'Governance Compliance Report', desc: 'Policy violations, PII blocks, and audit trail summary.', icon: 'gavel' },
    { id: 'forecast', title: 'Cost Forecast Report', desc: 'Projected end-of-month spend based on current trends.', icon: 'trending_up' },
  ];

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
          <span>Reports</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Reports Center</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Reports Center</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Generate and export governance, spend, and compliance reports for stakeholders.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">30-Day Spend</span>
          <p className="text-headline-lg font-bold text-primary mt-1">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Policy Violations</span>
          <p className="text-headline-lg font-bold text-amber-400 mt-1">{violations}</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Active Policies</span>
          <p className="text-headline-lg font-bold text-emerald-400 mt-1">{policies.filter((p) => p.active).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="glass-card rounded-xl p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[28px]">{report.icon}</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{report.title}</h3>
              </div>
              <p className="text-body-sm text-on-surface-variant">{report.desc}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all">
                Generate PDF
              </button>
              <button className="flex-1 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-all">
                Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Budget Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.keys(budgets).map((team) => (
            <div key={team} className="p-3 bg-surface-container rounded-lg border border-outline-variant">
              <span className="text-xs font-bold text-on-surface block">{team}</span>
              <span className="text-xs text-on-surface-variant font-mono">
                ${budgets[team].spent.toFixed(0)} / ${budgets[team].limit.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
