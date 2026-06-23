import React from 'react';
import { useAppState } from '../context/StateContext';

export const IntelligenceCenterScreen: React.FC = () => {
  const { recommendations, applyRecommendation, dismissRecommendation } = useAppState();

  const activeRecs = recommendations.filter((r) => r.status === 'active');
  const appliedRecs = recommendations.filter((r) => r.status === 'applied');
  const totalSavings = activeRecs.reduce((sum, r) => sum + r.savings, 0);

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Intelligence</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Intelligence Center</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">AI Optimization Intelligence</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Actionable recommendations to reduce cost, improve governance, and optimize model usage.
          </p>
        </div>
        <div className="glass-card rounded-xl px-6 py-3 text-right">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Potential Monthly Savings</span>
          <p className="text-headline-md font-bold text-primary">${totalSavings.toLocaleString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Active Recommendations</span>
          <p className="text-headline-lg font-bold text-tertiary mt-1">{activeRecs.length}</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Applied This Month</span>
          <p className="text-headline-lg font-bold text-emerald-400 mt-1">{appliedRecs.length}</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <span className="text-[10px] font-bold text-outline uppercase">Avg Confidence</span>
          <p className="text-headline-lg font-bold text-on-surface mt-1">
            {activeRecs.length > 0
              ? Math.round(activeRecs.reduce((s, r) => s + r.confidence, 0) / activeRecs.length)
              : 0}%
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Recommended Actions</h3>
        {recommendations.map((rec) => (
          <div key={rec.id} className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    rec.category === 'cost'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                      : rec.category === 'governance'
                      ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {rec.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    rec.status === 'active'
                      ? 'bg-primary/10 text-primary'
                      : rec.status === 'applied'
                      ? 'bg-emerald-950/40 text-emerald-400'
                      : 'bg-surface-variant text-outline'
                  }`}>
                    {rec.status}
                  </span>
                </div>
                <h4 className="text-body-lg font-bold text-on-surface">{rec.title}</h4>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">{rec.suggestion}</p>
                <p className="text-xs text-outline italic">Evidence: {rec.evidence}</p>
              </div>
              <div className="text-right space-y-1 shrink-0">
                <p className="text-[10px] font-bold text-outline uppercase">Est. Savings</p>
                <p className="text-headline-md font-bold text-primary">${rec.savings.toLocaleString()}/mo</p>
                <p className="text-xs text-on-surface-variant">Confidence: {rec.confidence}%</p>
              </div>
            </div>
            {rec.status === 'active' && (
              <div className="flex gap-3 pt-2 border-t border-outline-variant/30">
                <button
                  onClick={() => applyRecommendation(rec.id)}
                  className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Apply Recommendation
                </button>
                <button
                  onClick={() => dismissRecommendation(rec.id)}
                  className="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-variant transition-all"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
