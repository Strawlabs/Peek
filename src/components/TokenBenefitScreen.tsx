import React from 'react';
import { useAppState } from '../context/StateContext';

export const TokenBenefitScreen: React.FC = () => {
  const { outcomes, requests } = useAppState();

  const totalVolume = outcomes.reduce((sum, o) => sum + o.volume, 0);
  const avgCostPerOutcome =
    outcomes.length > 0
      ? outcomes.reduce((sum, o) => sum + o.costPerOutcome, 0) / outcomes.length
      : 0;

  const roiColor = (score: string) => {
    if (score === 'High') return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/30';
    if (score === 'Medium') return 'text-amber-400 bg-amber-950/40 border-amber-800/30';
    return 'text-rose-400 bg-rose-950/40 border-rose-800/30';
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
          <span>Analytics</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Token Benefit Analysis™</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Token Benefit Analysis™</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Measure AI ROI by workflow — cost per business outcome, necessity scoring, and volume attribution.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Total Outcomes Processed</span>
          <p className="text-headline-lg font-bold text-on-surface mt-1">{totalVolume.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Avg Cost / Outcome</span>
          <p className="text-headline-lg font-bold text-primary mt-1">${avgCostPerOutcome.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Telemetry Requests</span>
          <p className="text-headline-lg font-bold text-on-surface mt-1">{requests.length.toLocaleString()}</p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Workflow Outcome Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Workflow</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Department</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Metric</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Volume</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Cost/Outcome</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">ROI Score</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">AI Necessity</th>
              </tr>
            </thead>
            <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/30">
              {outcomes.map((o) => (
                <tr key={o.id} className="hover:bg-surface-variant/20 transition-all">
                  <td className="px-6 py-4 font-bold">{o.workflow}</td>
                  <td className="px-6 py-4">{o.department}</td>
                  <td className="px-6 py-4 text-on-surface-variant">{o.metricName}</td>
                  <td className="px-6 py-4 text-right font-mono">{o.volume.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-mono text-primary">${o.costPerOutcome.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${roiColor(o.roiScore)}`}>
                      {o.roiScore}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant text-xs">{o.necessity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
