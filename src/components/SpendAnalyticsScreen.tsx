import React, { useState, useMemo } from 'react';
import { useAppState } from '../context/StateContext';

export const SpendAnalyticsScreen: React.FC = () => {
  const { requests, budgets } = useAppState();
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const dateRangeLabel = dateRange === '7d' ? 'Last 7 Days' : dateRange === '30d' ? 'Last 30 Days' : 'All Time';

  const cycleDateRange = () => {
    setDateRange((prev) => (prev === '30d' ? '7d' : prev === '7d' ? 'all' : '30d'));
    setCurrentPage(1);
  };

  const now = Date.now();
  const dateRangeMs = dateRange === '7d' ? 7 * 86400000 : dateRange === '30d' ? 30 * 86400000 : Infinity;
  const prevRangeMs = dateRangeMs * 2;

  // Current period requests
  const filteredRequests = useMemo(() => requests.filter((r) => {
    const matchProvider = selectedProvider === 'All' || r.provider.toLowerCase() === selectedProvider.toLowerCase();
    const matchTeam = selectedTeam === 'All' || r.team.toLowerCase() === selectedTeam.toLowerCase();
    const matchDate = dateRange === 'all' || (now - r.timestamp) <= dateRangeMs;
    return matchProvider && matchTeam && matchDate;
  }), [requests, selectedProvider, selectedTeam, dateRange, now, dateRangeMs]);

  // Previous period requests (for delta calculations)
  const prevPeriodRequests = useMemo(() => {
    if (dateRange === 'all') return [];
    return requests.filter((r) => {
      const age = now - r.timestamp;
      const matchProvider = selectedProvider === 'All' || r.provider.toLowerCase() === selectedProvider.toLowerCase();
      const matchTeam = selectedTeam === 'All' || r.team.toLowerCase() === selectedTeam.toLowerCase();
      return matchProvider && matchTeam && age > dateRangeMs && age <= prevRangeMs;
    });
  }, [requests, selectedProvider, selectedTeam, dateRange, now, dateRangeMs, prevRangeMs]);

  // Core metrics
  const totalCost = filteredRequests.reduce((sum, r) => sum + r.cost, 0);
  const prevTotalCost = prevPeriodRequests.reduce((sum, r) => sum + r.cost, 0);
  const costDelta = prevTotalCost > 0 ? ((totalCost - prevTotalCost) / prevTotalCost) * 100 : 0;

  const totalRequests = filteredRequests.length;
  const prevTotalRequests = prevPeriodRequests.length;
  const requestsDelta = prevTotalRequests > 0 ? ((totalRequests - prevTotalRequests) / prevTotalRequests) * 100 : 0;

  const blockedCount = filteredRequests.filter(r => r.status.includes('Blocked')).length;
  const prevBlockedCount = prevPeriodRequests.filter(r => r.status.includes('Blocked')).length;
  const blockedDelta = prevBlockedCount > 0 ? ((blockedCount - prevBlockedCount) / prevBlockedCount) * 100 : 0;

  const avgCostPerReq = totalRequests > 0 ? totalCost / totalRequests : 0;
  const prevAvgCostPerReq = prevTotalRequests > 0 ? prevTotalCost / prevTotalRequests : 0;
  const efficiencyDelta = prevAvgCostPerReq > 0 ? ((prevAvgCostPerReq - avgCostPerReq) / prevAvgCostPerReq) * 100 : 0;

  // Provider breakdown
  const providerTotals = filteredRequests.reduce((acc, r) => {
    acc[r.provider] = (acc[r.provider] || 0) + r.cost;
    return acc;
  }, {} as Record<string, number>);
  const sortedProviders = Object.entries(providerTotals).sort((a, b) => b[1] - a[1]);

  // Team totals from requests (not from budgets.spent which may lag)
  const teamTotalsFromRequests = filteredRequests.reduce((acc, r) => {
    acc[r.team] = (acc[r.team] || 0) + r.cost;
    return acc;
  }, {} as Record<string, number>);

  // Model breakdown
  const modelTotals = filteredRequests.reduce((acc, r) => {
    const key = `${r.provider}/${r.model}`;
    if (!acc[key]) acc[key] = { cost: 0, count: 0, tokens: 0 };
    acc[key].cost += r.cost;
    acc[key].count += 1;
    acc[key].tokens += (r.tokens_in + r.tokens_out);
    return acc;
  }, {} as Record<string, { cost: number; count: number; tokens: number }>);
  const sortedModels = Object.entries(modelTotals).sort((a, b) => b[1].cost - a[1].cost).slice(0, 5);

  // Daily spend trend — last 14 days with real data
  const trendDays = dateRange === '7d' ? 7 : 14;
  const trendData = useMemo(() => {
    return Array.from({ length: trendDays }, (_, i) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - (trendDays - 1 - i));
      const dayEnd = dayStart.getTime() + 86400000;
      const dayRequests = requests.filter(r => {
        const matchProvider = selectedProvider === 'All' || r.provider.toLowerCase() === selectedProvider.toLowerCase();
        const matchTeam = selectedTeam === 'All' || r.team.toLowerCase() === selectedTeam.toLowerCase();
        return matchProvider && matchTeam && r.timestamp >= dayStart.getTime() && r.timestamp < dayEnd;
      });
      return {
        label: dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        cost: dayRequests.reduce((s, r) => s + r.cost, 0),
        count: dayRequests.length,
        isToday: i === trendDays - 1,
      };
    });
  }, [requests, selectedProvider, selectedTeam, trendDays]);

  const maxDailyCost = Math.max(...trendData.map(d => d.cost), 0.001);

  // Budget utilisation — use live teamTotalsFromRequests for current spend
  const budgetEntries = Object.entries(budgets).map(([team, b]) => {
    const spent = teamTotalsFromRequests[team] || 0;
    const limit = b.limit || 1;
    return { team, spent, limit, pct: Math.min((spent / limit) * 100, 100) };
  }).sort((a, b) => b.pct - a.pct);

  // Forecasting
  const daysElapsed = dateRange === 'all' ? 30 : (dateRange === '7d' ? 7 : 30);
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const projectedMonthly = dayOfMonth > 0 ? (totalCost / daysElapsed) * daysInMonth : 0;
  const projectedNext7 = (totalCost / daysElapsed) * 7;

  // Efficiency score: penalise blocked/flagged, reward low avg cost
  const violationRate = totalRequests > 0 ? (filteredRequests.filter(r => r.status !== 'Optimal').length / totalRequests) : 0;
  const efficiencyScore = Math.max(0, Math.min(100, Math.round(100 - (violationRate * 40) - (avgCostPerReq > 0.01 ? 10 : 0))));

  // Pagination
  const sortedFiltered = [...filteredRequests].sort((a, b) => b.timestamp - a.timestamp);
  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const paginatedRequests = sortedFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => { setSelectedProvider('All'); setSelectedTeam('All'); setDateRange('30d'); setCurrentPage(1); };

  const handleExportCSV = () => {
    const headers = 'Request ID,Timestamp,Team,Workflow,Provider,Model,Tokens In,Tokens Out,Total Tokens,Cost ($),Latency (s),Status';
    const rows = sortedFiltered.map((r) => {
      const totalTokens = r.tokens_in + r.tokens_out;
      return [
        `"${r.id}"`, `"${new Date(r.timestamp).toISOString()}"`, `"${r.team}"`,
        `"${r.workflow || ''}"`, `"${r.provider}"`, `"${r.model}"`,
        r.tokens_in, r.tokens_out, totalTokens, r.cost.toFixed(6), r.latency.toFixed(3), `"${r.status}"`,
      ].join(',');
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `peek_ai_spend_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fmtDelta = (delta: number, invertColor = false) => {
    const up = delta >= 0;
    const color = invertColor ? (up ? 'text-rose-400' : 'text-emerald-400') : (up ? 'text-emerald-400' : 'text-rose-400');
    return (
      <span className={`flex items-center gap-0.5 text-xs font-semibold ${color}`}>
        <span className="material-symbols-outlined text-[14px]">{up ? 'trending_up' : 'trending_down'}</span>
        {Math.abs(delta).toFixed(1)}% vs prev period
      </span>
    );
  };

  const PROVIDER_COLORS = ['bg-primary', 'bg-tertiary', 'bg-secondary', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500'];

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
            Real-time expenditure tracking — {totalRequests.toLocaleString()} requests across {Object.keys(providerTotals).length} providers.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 border border-outline-variant px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
          <button onClick={cycleDateRange} title="Click to cycle date range" className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span> {dateRangeLabel}
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="glass-card rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant">
          <span className="material-symbols-outlined text-[18px] text-primary">filter_list</span>
          <span className="font-label-md text-label-md text-on-surface-variant">Filters:</span>
        </div>
        <select value={selectedProvider} onChange={(e) => { setSelectedProvider(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:ring-1 focus:ring-primary min-w-[140px] focus:outline-none">
          <option value="All">Provider: All</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Gemini</option>
          <option value="local">Local Inference</option>
        </select>
        <select value={selectedTeam} onChange={(e) => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
          className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:ring-1 focus:ring-primary min-w-[140px] focus:outline-none">
          <option value="All">Team: All</option>
          <option value="Engineering">Engineering</option>
          <option value="Customer Success">Customer Success</option>
          <option value="Marketing">Marketing</option>
          <option value="Product Design">Product Design</option>
          <option value="Research">Research</option>
        </select>
        {(selectedProvider !== 'All' || selectedTeam !== 'All') && (
          <button onClick={clearFilters} className="ml-auto text-primary font-label-md text-label-md hover:underline">Clear All</button>
        )}
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, delta: costDelta, invertColor: true, icon: 'payments' },
          { label: 'Total Requests', value: totalRequests.toLocaleString(), delta: requestsDelta, invertColor: false, icon: 'api' },
          { label: 'Blocked / Flagged', value: blockedCount.toLocaleString(), delta: blockedDelta, invertColor: true, icon: 'block' },
          { label: 'Avg Cost / Request', value: `$${avgCostPerReq.toFixed(5)}`, delta: efficiencyDelta, invertColor: false, icon: 'savings' },
        ].map(({ label, value, delta, invertColor, icon }) => (
          <div key={label} className="glass-card rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-headline-md text-on-surface font-bold">{value}</div>
            {dateRange !== 'all' && fmtDelta(delta, invertColor)}
            {dateRange === 'all' && <span className="text-xs text-on-surface-variant">All-time data</span>}
          </div>
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* Spend Trend */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl p-6 intelligence-glow space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Daily Spend Trend</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Token costs per day — last {trendDays} days</p>
            </div>
            <div className="text-right">
              <span className="font-display-lg text-[28px] text-primary font-bold">
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="text-on-surface-variant text-xs mt-1">{dateRangeLabel}</div>
            </div>
          </div>

          <div className="h-56 flex items-end gap-1.5 px-1 border-b border-outline-variant/50">
            {trendData.map((day, idx) => {
              const pct = maxDailyCost > 0 ? (day.cost / maxDailyCost) * 88 : 5;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                  <div
                    style={{ height: `${Math.max(pct, 3)}%` }}
                    className={`w-full rounded-t transition-all duration-300 ${
                      day.isToday
                        ? 'bg-primary border-t-2 border-primary'
                        : day.cost > 0
                        ? 'bg-primary/30 border-t border-primary/50 hover:bg-primary/50'
                        : 'bg-surface-variant/30 border-t border-outline-variant/20'
                    }`}
                  />
                  {/* Tooltip */}
                  <div className="hidden group-hover:flex flex-col absolute -top-16 left-1/2 -translate-x-1/2 bg-surface-container-high border border-outline px-2 py-1.5 rounded-lg shadow-xl z-20 text-center min-w-[90px]">
                    <span className="text-[10px] text-on-surface-variant">{day.label}</span>
                    <span className="text-xs font-bold text-primary">${day.cost.toFixed(3)}</span>
                    <span className="text-[10px] text-on-surface-variant">{day.count} req</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-outline font-medium px-1">
            <span>{trendData[0]?.label}</span>
            <span>{trendData[Math.floor(trendDays / 2)]?.label}</span>
            <span className="text-primary font-bold">Today</span>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 glass-card rounded-xl p-6 flex flex-col gap-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Provider Breakdown</h3>
          <div className="flex items-center justify-center relative py-2">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-container-highest" />
              {sortedProviders.reduce((acc, [, cost], i) => {
                const pct = totalCost > 0 ? cost / totalCost : 0;
                const circumference = 2 * Math.PI * 40;
                const strokeDash = circumference * pct;
                const colors = ['text-primary', 'text-tertiary', 'text-secondary', 'text-amber-400', 'text-rose-400'];
                acc.elements.push(
                  <circle key={i} cx="50" cy="50" r="40" fill="transparent"
                    stroke="currentColor" strokeWidth="12"
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    strokeDashoffset={-acc.offset}
                    className={`${colors[i % colors.length]} transition-all duration-500`}
                  />
                );
                acc.offset += strokeDash;
                return acc;
              }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">Total</span>
              <span className="text-lg font-bold text-on-surface">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="space-y-2">
            {sortedProviders.length === 0 && <p className="text-xs text-on-surface-variant text-center py-4">No spend data for this period</p>}
            {sortedProviders.map(([p, cost], i) => (
              <div key={p} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${PROVIDER_COLORS[i % PROVIDER_COLORS.length]}`} />
                  <span className="text-body-sm text-on-surface capitalize">{p}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-on-surface">${cost.toFixed(2)}</span>
                  <span className="text-[10px] text-on-surface-variant ml-1">({((cost / totalCost) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Budget + Top Models Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* Team Budget Utilisation */}
        <div className="col-span-12 lg:col-span-6 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Team Budget Utilisation</h3>
            <span className="text-xs text-on-surface-variant">Spend / Limit</span>
          </div>
          <div className="space-y-4">
            {budgetEntries.length === 0 && <p className="text-xs text-on-surface-variant">No budget data loaded.</p>}
            {budgetEntries.map(({ team, spent, limit, pct }) => (
              <div key={team}>
                <div className="flex justify-between text-body-sm mb-1.5">
                  <span className="text-on-surface font-medium">{team}</span>
                  <span className={`font-mono text-xs ${pct > 90 ? 'text-rose-400' : pct > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ${spent.toFixed(2)} / ${limit.toLocaleString()} ({pct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2.5 bg-surface-variant rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                    className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500 animate-pulse' : pct > 70 ? 'bg-amber-400' : 'bg-primary'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Models by Cost */}
        <div className="col-span-12 lg:col-span-6 glass-card rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>model_training</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Top Models by Cost</h3>
          </div>
          <div className="space-y-3">
            {sortedModels.length === 0 && <p className="text-xs text-on-surface-variant">No model data for this period.</p>}
            {sortedModels.map(([key, { cost, count, tokens }], i) => {
              const maxCost = sortedModels[0]?.[1].cost || 1;
              return (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-body-sm text-on-surface font-mono">{key}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-primary">${cost.toFixed(2)}</span>
                      <span className="text-[10px] text-on-surface-variant ml-2">{count} req · {(tokens / 1000).toFixed(0)}k tok</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <div
                      style={{ width: `${(cost / maxCost) * 100}%`, transition: 'width 0.6s ease' }}
                      className={`h-full rounded-full ${PROVIDER_COLORS[i % PROVIDER_COLORS.length]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Forecasting */}
      <section className="glass-card rounded-xl p-6 bg-gradient-to-br from-surface-container to-surface-container-low border border-primary/10">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Cost Forecasting & Efficiency</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Projected This Month</p>
            <span className="text-headline-sm font-bold text-on-surface">${projectedMonthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <p className="text-xs text-on-surface-variant mt-1">Based on current daily rate</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Next 7 Days Est.</p>
            <span className="text-headline-sm font-bold text-on-surface">${projectedNext7.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <p className="text-xs text-on-surface-variant mt-1">Linear extrapolation</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Efficiency Score</p>
            <span className={`text-headline-sm font-bold ${efficiencyScore >= 90 ? 'text-emerald-400' : efficiencyScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
              {efficiencyScore} / 100
            </span>
            <p className="text-xs text-on-surface-variant mt-1">{violationRate > 0 ? `${(violationRate * 100).toFixed(1)}% violation rate` : 'No violations'}</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Avg Cost / Request</p>
            <span className="text-headline-sm font-bold text-on-surface">${avgCostPerReq.toFixed(5)}</span>
            {dateRange !== 'all' && prevAvgCostPerReq > 0 && (
              <p className={`text-xs mt-1 font-semibold ${efficiencyDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {efficiencyDelta > 0 ? '↓' : '↑'} {Math.abs(efficiencyDelta).toFixed(1)}% vs prev period
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Requests Table */}
      <section className="glass-card rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">AI Request Telemetry</h3>
          <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-xs rounded-full font-mono">
            {filteredRequests.length.toLocaleString()} Records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md">
              <tr>
                <th className="px-5 py-4 font-medium border-b border-outline-variant">Timestamp</th>
                <th className="px-5 py-4 font-medium border-b border-outline-variant">Team</th>
                <th className="px-5 py-4 font-medium border-b border-outline-variant">Workflow</th>
                <th className="px-5 py-4 font-medium border-b border-outline-variant">Model</th>
                <th className="px-5 py-4 font-medium border-b border-outline-variant text-right">Tokens</th>
                <th className="px-5 py-4 font-medium border-b border-outline-variant text-right">Cost</th>
                <th className="px-5 py-4 font-medium border-b border-outline-variant text-right">Latency</th>
                <th className="px-5 py-4 font-medium border-b border-outline-variant">Status</th>
              </tr>
            </thead>
            <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/30">
              {paginatedRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-on-surface-variant">
                    No requests found for this period. Try running some requests in the Proxy Playground.
                  </td>
                </tr>
              )}
              {paginatedRequests.map((r) => (
                <tr key={r.id} className="hover:bg-surface-variant/20 transition-all">
                  <td className="px-5 py-3.5 font-mono text-xs text-on-surface-variant">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-medium">{r.team}</td>
                  <td className="px-5 py-3.5 text-on-surface-variant">{r.workflow}</td>
                  <td className="px-5 py-3.5 font-mono text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">deployed_code</span>
                      {r.provider}/{r.model}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs">{(r.tokens_in + r.tokens_out).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold text-primary">${r.cost.toFixed(5)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs">{r.latency.toFixed(2)}s</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      r.status.includes('Blocked') ? 'bg-rose-950 text-rose-300'
                      : r.status.includes('Flagged') || r.status.includes('PII') ? 'bg-amber-950 text-amber-300'
                      : r.status === 'High Cost' ? 'bg-orange-950 text-orange-300'
                      : 'bg-emerald-950/40 text-emerald-400'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-outline-variant flex justify-between items-center text-body-sm text-on-surface-variant bg-surface-container-low">
          <span>Page {currentPage} of {totalPages || 1} · {filteredRequests.length.toLocaleString()} total</span>
          <div className="flex gap-4">
            <button onClick={() => setCurrentPage(c => Math.max(c - 1, 1))} disabled={currentPage === 1}
              className="hover:text-primary transition-all disabled:opacity-30 font-bold">← Prev</button>
            <button onClick={() => setCurrentPage(c => Math.min(c + 1, totalPages))} disabled={currentPage >= totalPages || totalPages === 0}
              className="hover:text-primary transition-all disabled:opacity-30 font-bold">Next →</button>
          </div>
        </div>
      </section>
    </div>
  );
};
