import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

export const SpendAnalyticsScreen: React.FC = () => {
  const { requests, budgets } = useAppState();
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchProvider = selectedProvider === 'All' || r.provider.toLowerCase() === selectedProvider.toLowerCase();
    const matchTeam = selectedTeam === 'All' || r.team.toLowerCase() === selectedTeam.toLowerCase();
    return matchProvider && matchTeam;
  });

  const totalCost = filteredRequests.reduce((sum, r) => sum + r.cost, 0);

  // Group by provider for donut chart
  const providerTotals = filteredRequests.reduce((acc, r) => {
    acc[r.provider] = (acc[r.provider] || 0) + r.cost;
    return acc;
  }, {} as Record<string, number>);

  // Group by team
  const teamTotals = filteredRequests.reduce((acc, r) => {
    acc[r.team] = (acc[r.team] || 0) + r.cost;
    return acc;
  }, {} as Record<string, number>);

  // Daily spend trend calculation (last 15 days)
  const last15Days = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    return d.toDateString();
  });

  const dailyCosts = last15Days.map((dayStr) => {
    const dayRequests = filteredRequests.filter((r) => new Date(r.timestamp).toDateString() === dayStr);
    return dayRequests.reduce((sum, r) => sum + r.cost, 0);
  });

  const maxDailyCost = Math.max(...dailyCosts, 5);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = [...filteredRequests]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setSelectedProvider('All');
    setSelectedTeam('All');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Finance</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Spend Analytics</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">AI Spend Analytics</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Real-time expenditure tracking across LLM providers and enterprise workflows.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span> Last 30 Days
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <section className="glass-card rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">filter_list</span>
          <span className="font-label-md text-label-md text-on-surface-variant">Filters:</span>
        </div>
        <select
          value={selectedProvider}
          onChange={(e) => { setSelectedProvider(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:ring-1 focus:ring-primary min-w-[140px] focus:outline-none"
        >
          <option value="All">Provider: All</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Gemini</option>
          <option value="local">Local Inference</option>
        </select>
        <select
          value={selectedTeam}
          onChange={(e) => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:ring-1 focus:ring-primary min-w-[140px] focus:outline-none"
        >
          <option value="All">Team: All</option>
          <option value="Engineering">Engineering</option>
          <option value="Customer Success">Customer Success</option>
          <option value="Marketing">Marketing</option>
          <option value="Product Design">Product Design</option>
          <option value="Research">Research</option>
        </select>
        {(selectedProvider !== 'All' || selectedTeam !== 'All') && (
          <div className="ml-auto flex items-center gap-2">
            <button onClick={clearFilters} className="text-primary font-label-md text-label-md hover:underline">
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* Bento Grid Visualizations */}
      <section className="grid grid-cols-12 gap-6">
        {/* Main Spend Trend Chart */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl p-6 intelligence-glow space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Spend Trend</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Daily token costs over the last 15 days</p>
            </div>
            <div className="text-right">
              <span className="font-display-lg text-[32px] text-primary font-bold">
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center justify-end text-emerald-400 text-body-sm">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span>Active Telemetry Monitoring</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 px-2 border-b border-outline-variant">
            {dailyCosts.map((cost, idx) => {
              const pct = (cost / maxDailyCost) * 90; // cap at 90%
              return (
                <div
                  key={idx}
                  style={{ height: `${Math.max(pct, 5)}%` }}
                  className="flex-1 bg-primary/20 rounded-t border-t border-primary/40 transition-all hover:bg-primary/40 group relative cursor-pointer"
                >
                  <div className="hidden group-hover:block absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-container border border-outline px-2 py-1 rounded text-label-sm whitespace-nowrap z-10 shadow-lg">
                    ${cost.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-outline font-bold">
            <span>{new Date(last15Days[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(last15Days[7]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>Today</span>
          </div>
        </div>

        {/* Provider Breakdown Donut */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 glass-card rounded-xl p-6 flex flex-col justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Provider Breakdown</h3>
          
          <div className="flex items-center justify-center relative py-4 my-auto">
            <svg className="w-40 h-40 -rotate-90">
              <circle className="text-surface-container-highest" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" strokeWidth="16"></circle>
              {/* OpenAI circle segment */}
              <circle className="text-primary" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" 
                strokeDasharray={`${2 * Math.PI * 64}`} 
                strokeDashoffset={`${2 * Math.PI * 64 * (1 - (providerTotals['openai'] || 0) / (totalCost || 1))}`} 
                strokeWidth="16"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-label-sm text-on-surface-variant uppercase">Filtered Total</span>
              <span className="font-headline-md text-on-surface font-bold">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {Object.keys(providerTotals).map((p, i) => (
              <div key={p} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-tertiary' : 'bg-surface-variant'}`}></div>
                  <span className="text-body-sm text-on-surface capitalize">{p}</span>
                </div>
                <span className="font-label-md text-on-surface font-mono">${providerTotals[p].toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Attribution */}
        <div className="col-span-12 md:col-span-6 lg:col-span-6 glass-card rounded-xl p-6">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6">Team Attribution</h3>
          <div className="space-y-4">
            {Object.keys(budgets).map((team) => {
              const spent = teamTotals[team] || 0;
              const limit = budgets[team].limit;
              const pct = (spent / limit) * 100;
              return (
                <div key={team}>
                  <div className="flex justify-between text-body-sm mb-1.5">
                    <span className="text-on-surface">{team}</span>
                    <span className="text-on-surface-variant font-mono">${spent.toFixed(2)} / ${limit.toLocaleString()} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(pct, 100)}%` }} 
                      className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500 animate-pulse' : 'bg-primary'}`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forecasting Info */}
        <div className="col-span-12 md:col-span-6 lg:col-span-6 glass-card rounded-xl p-6 flex flex-col justify-between bg-gradient-to-br from-surface-container to-surface-container-low border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Cost Forecasting</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-surface-container-high border border-outline-variant">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Projected End of Month</p>
              <div className="flex items-baseline gap-2">
                <span className="text-headline-md font-bold text-on-surface">${(totalCost * 1.2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-emerald-400 text-label-sm">Budget within margins</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-container-high/50">
                <p className="text-label-sm text-on-surface-variant mb-1">Next 7 Days Projected</p>
                <span className="text-body-lg font-medium text-on-surface">${(totalCost * 0.25).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-high/50">
                <p className="text-label-sm text-on-surface-variant mb-1">Efficiency Score</p>
                <span className="text-body-lg font-medium text-primary">96 / 100</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requests Summary Table */}
      <section className="glass-card rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">AI Requests Telemetry Logs</h3>
          <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-xs rounded-full font-mono">
            {filteredRequests.length} Packets Found
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Timestamp</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Team</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Workflow</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Provider</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Tokens</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Cost</th>
                <th className="px-6 py-4 font-medium border-b border-outline-variant">Status</th>
              </tr>
            </thead>
            <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/30">
              {paginatedRequests.map((r) => {
                const dateStr = new Date(r.timestamp).toLocaleString();
                return (
                  <tr key={r.id} className="hover:bg-surface-variant/20 transition-all">
                    <td className="px-6 py-4 font-mono text-xs">{dateStr}</td>
                    <td className="px-6 py-4">{r.team}</td>
                    <td className="px-6 py-4">{r.workflow}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 font-mono text-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">deployed_code</span>
                        {r.provider} ({r.model})
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{(r.tokens_in + r.tokens_out).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">${r.cost.toFixed(4)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                        r.status.includes('Leak') || r.status.includes('Blocked')
                          ? 'bg-rose-950 text-rose-300'
                          : r.status.includes('Flagged')
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-emerald-950/40 text-emerald-400'
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

        {/* Pagination Footer */}
        <div className="px-6 py-3 border-t border-outline-variant flex justify-between items-center text-body-sm text-on-surface-variant bg-surface-container-low">
          <span>Showing Page {currentPage} of {totalPages || 1}</span>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              disabled={currentPage === 1}
              className="hover:text-primary transition-all disabled:opacity-50 font-bold"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="hover:text-primary transition-all disabled:opacity-50 font-bold"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
