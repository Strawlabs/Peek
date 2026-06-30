import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/StateContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportSchedule {
  id: string;
  reportId: string;
  reportTitle: string;
  format: 'PDF' | 'CSV';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Custom Cron';
  recipientType: 'email' | 'slack' | 'teams';
  recipient: string;
  time: string;
  active: boolean;
  nextRun: string;
}

export const ReportsScreen: React.FC = () => {
  const { requests, budgets, policies, channels, sendTestNotification } = useAppState();

  const totalCost = requests.reduce((sum, r) => sum + r.cost, 0);
  const violations = requests.filter((r) => r.status.includes('Flagged') || r.status.includes('Blocked')).length;
  const activePoliciesCount = policies.filter((p) => p.active).length;

  const slackChan = channels?.find((c) => c.id === 'slack');
  const teamsChan = channels?.find((c) => c.id === 'teams');

  // ─── State ──────────────────────────────────────────────────────────────────

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Loading/progress state for generating reports
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [activeReportId, setActiveReportId] = useState('');
  const [activeFormat, setActiveFormat] = useState<'PDF' | 'CSV'>('PDF');

  // Schedules state loaded from localStorage
  const [schedules, setSchedules] = useState<ReportSchedule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('peek_report_schedules');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse schedules from localStorage', e);
        }
      }
    }
    // Default schedules if empty
    return [
      {
        id: 'sch-1',
        reportId: 'exec',
        reportTitle: 'Executive Summary Report',
        format: 'PDF',
        frequency: 'Weekly',
        recipientType: 'email',
        recipient: 'exec-team@peek.ai',
        time: '09:00',
        active: true,
        nextRun: 'July 6, 2026, 9:00 AM UTC',
      },
      {
        id: 'sch-2',
        reportId: 'spend',
        reportTitle: 'Detailed Spend Report',
        format: 'CSV',
        frequency: 'Daily',
        recipientType: 'slack',
        recipient: '#budget-warnings',
        time: '07:00',
        active: true,
        nextRun: 'June 30, 2026, 7:00 AM UTC',
      },
    ];
  });

  // Save schedules to localStorage
  useEffect(() => {
    localStorage.setItem('peek_report_schedules', JSON.stringify(schedules));
  }, [schedules]);

  // Form states for creating a new schedule
  const [newReportId, setNewReportId] = useState('exec');
  const [newFormat, setNewFormat] = useState<'PDF' | 'CSV'>('PDF');
  const [newFrequency, setNewFrequency] = useState<ReportSchedule['frequency']>('Weekly');
  const [newRecipientType, setNewRecipientType] = useState<ReportSchedule['recipientType']>('email');
  const [newRecipient, setNewRecipient] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  // ─── Static Report Definitions ──────────────────────────────────────────────

  const reports = [
    { id: 'exec', title: 'Executive Summary Report', desc: 'High-level spend, ROI, and governance overview for leadership.', icon: 'summarize' },
    { id: 'spend', title: 'Detailed Spend Report', desc: 'Provider-level cost breakdown with team attribution.', icon: 'payments' },
    { id: 'gov', title: 'Governance Compliance Report', desc: 'Policy violations, PII blocks, and audit trail summary.', icon: 'gavel' },
    { id: 'forecast', title: 'Cost Forecast Report', desc: 'Projected end-of-month spend based on current trends.', icon: 'trending_up' },
  ];

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleGenerateClick = (reportId: string, format: 'PDF' | 'CSV') => {
    setActiveReportId(reportId);
    setActiveFormat(format);
    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationMessage('Initializing report engine...');

    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            if (format === 'CSV') {
              triggerCSVDownload(reportId);
            } else {
              triggerPDFPrint(reportId);
            }
            showToast(`${reports.find((r) => r.id === reportId)?.title} generated successfully!`);
          }, 400);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 20) + 10;
        const capped = Math.min(next, 100);

        if (capped < 30) setGenerationMessage('Gathering telemetry data from Supabase...');
        else if (capped < 60) setGenerationMessage('Aggregating cost indices and usage records...');
        else if (capped < 85) setGenerationMessage('Constructing SVG telemetry visualization diagrams...');
        else setGenerationMessage('Finalizing payload file headers...');

        return capped;
      });
    }, 200);
  };

  const triggerCSVDownload = (reportId: string) => {
    let csvContent = '';
    const filename = `peek_${reportId}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportId === 'exec') {
      csvContent = 'Team,Budget Limit,Budget Spent,Utilization %\n';
      Object.keys(budgets).forEach((team) => {
        const b = budgets[team];
        const pct = b.limit > 0 ? ((b.spent / b.limit) * 100).toFixed(1) : '0.0';
        csvContent += `"${team}",${b.limit},${b.spent.toFixed(2)},${pct}%\n`;
      });
    } else if (reportId === 'spend') {
      csvContent = 'Request ID,Timestamp,Team,Provider,Model,Cost,Latency,Status\n';
      requests.forEach((r) => {
        const date = new Date(r.timestamp).toISOString();
        csvContent += `"${r.id}","${date}","${r.team}","${r.provider}","${r.model}",${r.cost},${r.latency},"${r.status}"\n`;
      });
    } else if (reportId === 'gov') {
      csvContent = 'Policy Name,Description,Type,Action,Active\n';
      policies.forEach((p) => {
        csvContent += `"${p.name}","${p.description}","${p.type}","${p.action}",${p.active}\n`;
      });
    } else if (reportId === 'forecast') {
      csvContent = 'Month,Projected Cost,Lower Bound,Upper Bound,Projected Savings\n';
      const months = ['July 2026', 'August 2026', 'September 2026'];
      months.forEach((m, idx) => {
        const multiplier = 1 + (idx + 1) * 0.08;
        const base = totalCost * multiplier;
        csvContent += `"${m}",${base.toFixed(2)},${(base * 0.92).toFixed(2)},${(base * 1.15).toFixed(2)},${(7500 * multiplier).toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPDFPrint = (reportId: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please enable popups to download or print PDF reports.', 'error');
      return;
    }

    let title = '';
    let contentHtml = '';

    const averageLatency = requests.reduce((sum, r) => sum + r.latency, 0) / Math.max(requests.length, 1);
    const totalTokens = requests.reduce((sum, r) => sum + r.tokens_in + r.tokens_out, 0);

    if (reportId === 'exec') {
      title = 'Executive Summary Report';

      // Spend by Team Table
      let teamRows = '';
      Object.keys(budgets).forEach((team) => {
        const b = budgets[team];
        const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
        teamRows += `
          <tr>
            <td><strong>${team}</strong></td>
            <td>$${b.limit.toLocaleString()}</td>
            <td>$${b.spent.toFixed(2)}</td>
            <td>
              <div style="background: #e5e7eb; border-radius: 4px; height: 8px; width: 100px; display: inline-block; margin-right: 10px; overflow: hidden;">
                <div style="background: #6366f1; height: 8px; width: ${Math.min(pct, 100)}%;"></div>
              </div>
              ${pct.toFixed(1)}%
            </td>
          </tr>
        `;
      });

      // SVG Chart
      const maxSpent = Math.max(...Object.values(budgets).map((b) => b.spent), 1);
      let teamBars = '';
      Object.keys(budgets).forEach((team, idx) => {
        const b = budgets[team];
        const barHeight = (b.spent / maxSpent) * 100;
        const x = 50 + idx * 80;
        const y = 130 - barHeight;
        teamBars += `
          <rect x="${x}" y="${y}" width="35" height="${barHeight}" fill="#6366f1" rx="4" />
          <text x="${x + 17}" y="145" font-size="8" text-anchor="middle" fill="#6b7280">${team.substring(0, 8)}</text>
          <text x="${x + 17}" y="${y - 5}" font-size="8" font-weight="bold" text-anchor="middle" fill="#111827">$${b.spent.toFixed(0)}</text>
        `;
      });

      const chartSvg = `
        <svg width="450" height="160" style="margin: 20px auto; display: block; border: 1px solid #f3f4f6; border-radius: 8px; padding: 10px;">
          <line x1="30" y1="130" x2="430" y2="130" stroke="#e5e7eb" stroke-width="1" />
          ${teamBars}
        </svg>
      `;

      contentHtml = `
        <div class="grid">
          <div class="card">
            <div class="card-title">30-Day Spend</div>
            <div class="card-value">$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Requests</div>
            <div class="card-value">${requests.length.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Avg Latency</div>
            <div class="card-value">${averageLatency.toFixed(2)}s</div>
          </div>
          <div class="card">
            <div class="card-title">Policy Violations</div>
            <div class="card-value" style="color: #ef4444;">${violations}</div>
          </div>
        </div>

        <h3 style="margin-top: 30px;">Cost Allocation by Team</h3>
        ${chartSvg}
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Allocated Budget</th>
              <th>Spend to Date</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            ${teamRows}
          </tbody>
        </table>

        <h3 style="margin-top: 30px;">Governance Summary</h3>
        <p>There are currently <strong>${activePoliciesCount}</strong> active governance rules running on the Peek Proxy Gateway. Over the last 30 days, <strong>${violations}</strong> requests triggered compliance alerts (PII leakage blocks, model restrictions, or budget limit warning notifications).</p>
      `;
    } else if (reportId === 'spend') {
      title = 'Detailed Spend Report';

      // Group by provider
      const providerStats: Record<string, { cost: number; count: number; lat: number }> = {};
      requests.forEach((r) => {
        if (!providerStats[r.provider]) providerStats[r.provider] = { cost: 0, count: 0, lat: 0 };
        providerStats[r.provider].cost += r.cost;
        providerStats[r.provider].count += 1;
        providerStats[r.provider].lat += r.latency;
      });

      let provRows = '';
      Object.keys(providerStats).forEach((p) => {
        const s = providerStats[p];
        provRows += `
          <tr>
            <td style="text-transform: capitalize;"><strong>${p}</strong></td>
            <td>${s.count.toLocaleString()}</td>
            <td>$${s.cost.toFixed(4)}</td>
            <td>${(s.lat / s.count).toFixed(2)}s</td>
          </tr>
        `;
      });

      // Recent requests
      let reqRows = '';
      const recent = [...requests].sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
      recent.forEach((r) => {
        reqRows += `
          <tr>
            <td>${new Date(r.timestamp).toLocaleDateString()}</td>
            <td>${r.team}</td>
            <td style="text-transform: capitalize;">${r.provider}</td>
            <td><code>${r.model}</code></td>
            <td>$${r.cost.toFixed(5)}</td>
            <td>${r.latency.toFixed(2)}s</td>
            <td><span class="badge ${
              r.status.includes('Block') ? 'badge-critical' : r.status.includes('Flag') ? 'badge-warning' : 'badge-success'
            }">${r.status}</span></td>
          </tr>
        `;
      });

      contentHtml = `
        <div class="grid">
          <div class="card">
            <div class="card-title">Total Spend</div>
            <div class="card-value">$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-title">Avg Cost / Req</div>
            <div class="card-value">$${(totalCost / Math.max(requests.length, 1)).toFixed(5)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Tokens</div>
            <div class="card-value">${totalTokens.toLocaleString()}</div>
          </div>
          <div class="card">
            <div class="card-title">Avg Latency</div>
            <div class="card-value">${averageLatency.toFixed(2)}s</div>
          </div>
        </div>

        <h3 style="margin-top: 30px;">Provider breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Requests</th>
              <th>Total Cost</th>
              <th>Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            ${provRows}
          </tbody>
        </table>

        <h3 style="margin-top: 30px;">Recent Logs (Last 15 requests)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Team</th>
              <th>Provider</th>
              <th>Model</th>
              <th>Cost</th>
              <th>Latency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reqRows}
          </tbody>
        </table>
      `;
    } else if (reportId === 'gov') {
      title = 'Governance Compliance Report';

      let polRows = '';
      policies.forEach((p) => {
        const count = requests.filter((r) => {
          if (p.id === 'pol-pii') return r.status.includes('PII');
          if (p.id === 'pol-models') return r.status.includes('Policy');
          return false;
        }).length;
        polRows += `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.type}</td>
            <td style="text-transform: uppercase;"><code>${p.action}</code></td>
            <td><span class="badge ${p.active ? 'badge-success' : 'badge-info'}">${p.active ? 'Active' : 'Inactive'}</span></td>
            <td><strong>${count}</strong> triggers</td>
          </tr>
        `;
      });

      let incidentRows = '';
      const incidents = requests.filter((r) => r.status.includes('Flag') || r.status.includes('Block')).slice(0, 10);
      if (incidents.length === 0) {
        incidentRows = `<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 20px;">No compliance violations found in this period.</td></tr>`;
      } else {
        incidents.forEach((r) => {
          incidentRows += `
            <tr>
              <td>${new Date(r.timestamp).toLocaleDateString()}</td>
              <td><strong>${r.team}</strong></td>
              <td><code>${r.model}</code></td>
              <td><span class="badge ${r.status.includes('Block') ? 'badge-critical' : 'badge-warning'}">${r.status}</span></td>
              <td><div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><code>${r.prompt}</code></div></td>
            </tr>
          `;
        });
      }

      contentHtml = `
        <div class="grid">
          <div class="card">
            <div class="card-title">Active Rules</div>
            <div class="card-value">${activePoliciesCount} / ${policies.length}</div>
          </div>
          <div class="card">
            <div class="card-title">Blocked Requests</div>
            <div class="card-value" style="color: #ef4444;">${requests.filter((r) => r.status.includes('Blocked')).length}</div>
          </div>
          <div class="card">
            <div class="card-title">Flagged Audits</div>
            <div class="card-value" style="color: #f59e0b;">${requests.filter((r) => r.status.includes('Flagged')).length}</div>
          </div>
          <div class="card">
            <div class="card-title">Compliance Score</div>
            <div class="card-value" style="color: #10b981;">${((1 - violations / Math.max(requests.length, 1)) * 100).toFixed(2)}%</div>
          </div>
        </div>

        <h3 style="margin-top: 30px;">Gateway Policies</h3>
        <table>
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Type</th>
              <th>Action</th>
              <th>Status</th>
              <th>Violations (30d)</th>
            </tr>
          </thead>
          <tbody>
            ${polRows}
          </tbody>
        </table>

        <h3 style="margin-top: 30px;">Compliance Incident Log</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Team</th>
              <th>Model</th>
              <th>Incident Type</th>
              <th>Sample Payload</th>
            </tr>
          </thead>
          <tbody>
            ${incidentRows}
          </tbody>
        </table>
      `;
    } else if (reportId === 'forecast') {
      title = 'Cost Forecast Report';

      const projectedEOM = totalCost * 1.08;
      const weeklyCost = totalCost / 4.2;

      // Forecast list
      const months = ['July 2026', 'August 2026', 'September 2026'];
      let forecastRows = '';
      months.forEach((m, idx) => {
        const multiplier = 1 + (idx + 1) * 0.08;
        const expected = totalCost * multiplier;
        const lower = expected * 0.92;
        const upper = expected * 1.15;
        forecastRows += `
          <tr>
            <td><strong>${m}</strong></td>
            <td>$${expected.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            <td>$${lower.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            <td>$${upper.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            <td style="color: #10b981;">$${(7500 * multiplier).toFixed(0)} savings available</td>
          </tr>
        `;
      });

      // SVG Forecast Chart
      const maxForecast = totalCost * 1.35;
      let histPoints = `40,${130 - (totalCost * 0.45 / maxForecast) * 100}`;
      histPoints += ` 140,${130 - (totalCost * 0.65 / maxForecast) * 100}`;
      histPoints += ` 240,${130 - (totalCost * 0.85 / maxForecast) * 100}`;
      histPoints += ` 340,${130 - (totalCost / maxForecast) * 100}`;

      let projPoints = `340,${130 - (totalCost / maxForecast) * 100}`;
      projPoints += ` 440,${130 - (totalCost * 1.08 / maxForecast) * 100}`;
      projPoints += ` 540,${130 - (totalCost * 1.16 / maxForecast) * 100}`;

      const chartSvg = `
        <svg width="550" height="150" style="margin: 20px auto; display: block; border: 1px solid #f3f4f6; border-radius: 8px; padding: 10px;">
          <line x1="30" y1="130" x2="530" y2="130" stroke="#e5e7eb" />
          <polyline fill="none" stroke="#6366f1" stroke-width="3" points="${histPoints}" />
          <polyline fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4" points="${projPoints}" />
          <circle cx="340" cy="${130 - (totalCost / maxForecast) * 100}" r="4.5" fill="#6366f1" />
          <text x="340" y="${110 - (totalCost / maxForecast) * 100}" font-size="8.5" font-weight="bold" fill="#6366f1" text-anchor="middle">Current MTD: $${totalCost.toFixed(0)}</text>
          <circle cx="440" cy="${130 - (totalCost * 1.08 / maxForecast) * 100}" r="4.5" fill="#f59e0b" />
          <text x="440" y="${110 - (totalCost * 1.08 / maxForecast) * 100}" font-size="8.5" font-weight="bold" fill="#f59e0b" text-anchor="middle">July Proj: $${(totalCost * 1.08).toFixed(0)}</text>
        </svg>
      `;

      contentHtml = `
        <div class="grid">
          <div class="card">
            <div class="card-title">MTD Spend</div>
            <div class="card-value">$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-title">Run Rate / Week</div>
            <div class="card-value">$${weeklyCost.toFixed(2)}</div>
          </div>
          <div class="card">
            <div class="card-title">Projected End of Month</div>
            <div class="card-value" style="color: #f59e0b;">$${projectedEOM.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div class="card">
            <div class="card-title">Unrealized Savings</div>
            <div class="card-value" style="color: #10b981;">$7,500.00</div>
          </div>
        </div>

        <h3 style="margin-top: 30px;">Spend Trajectory & Projection Chart</h3>
        <p style="font-size: 11px; color: #6b7280; margin-bottom: 10px;">Solid line shows MTD history. Dashed line denotes expected trajectory based on existing workloads.</p>
        ${chartSvg}

        <h3 style="margin-top: 30px;">Spend Projections Table</h3>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Forecasted Spend</th>
              <th>Lower Bound (95% CI)</th>
              <th>Upper Bound (95% CI)</th>
              <th>Potential Savings</th>
            </tr>
          </thead>
          <tbody>
            ${forecastRows}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1f2937; padding: 40px; background: white; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.05em; }
            .title { font-size: 22px; font-weight: 800; margin-bottom: 5px; color: #111827; }
            .meta { font-size: 11px; color: #6b7280; }
            .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .card { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
            .card-title { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; }
            .card-value { font-size: 20px; font-weight: 800; margin-top: 5px; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; }
            td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
            tr:hover { background: #f9fafb; }
            .badge { padding: 3px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
            .badge-critical { background: #fee2e2; color: #991b1b; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-info { background: #dbeafe; color: #1e40af; }
            .badge-success { background: #d1fae5; color: #065f46; }
            code { font-family: monospace; background: #f3f4f6; padding: 2px 4px; border-radius: 4px; font-size: 11px; }
            h3 { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 10px; border-left: 3px solid #6366f1; padding-left: 8px; }
            p { font-size: 12px; line-height: 1.6; color: #4b5563; }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${title}</div>
              <div class="meta">Peek AI Control Center &bull; Generated on ${new Date().toLocaleString()} &bull; Security Level: Confidential</div>
            </div>
            <div class="logo">PEEK.AI</div>
          </div>
          ${contentHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (newRecipientType === 'email' && !newRecipient.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (!newRecipient.trim()) {
      showToast('Please specify a recipient target.', 'error');
      return;
    }

    const reportTitle = reports.find((r) => r.id === newReportId)?.title || 'Custom Report';
    
    // Mock calculate next run string
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (newFrequency === 'Daily' ? 1 : newFrequency === 'Weekly' ? 7 : 30));
    const nextRun = `${nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${newTime} UTC`;

    const newSchedule: ReportSchedule = {
      id: `sch-${Math.random().toString(36).substring(2, 7)}`,
      reportId: newReportId,
      reportTitle,
      format: newFormat,
      frequency: newFrequency,
      recipientType: newRecipientType,
      recipient: newRecipient,
      time: newTime,
      active: true,
      nextRun,
    };

    setSchedules((prev) => [...prev, newSchedule]);
    showToast(`Successfully scheduled "${reportTitle}" delivery.`);
    
    // Reset recipient input
    setNewRecipient('');
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    showToast('Scheduled delivery removed.', 'info');
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
    showToast('Schedule status updated.', 'info');
  };

  const handleRunNow = async (schedule: ReportSchedule) => {
    showToast(`Starting manual execution trigger for ${schedule.reportTitle}...`, 'info');
    
    // Simulate API delivery lag
    await new Promise((r) => setTimeout(r, 1200));

    if (schedule.recipientType === 'slack') {
      await sendTestNotification(
        'slack',
        'Slack Channel',
        schedule.recipient
      );
    } else if (schedule.recipientType === 'teams') {
      await sendTestNotification(
        'teams',
        'Microsoft Teams',
        schedule.recipient
      );
    }

    showToast(`Successfully delivered report [${schedule.format}] to ${schedule.recipient}!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl p-4 shadow-2xl animate-fade-in max-w-sm">
          <span
            className={`material-symbols-outlined text-[20px] ${
              toast.type === 'success'
                ? 'text-emerald-400'
                : toast.type === 'error'
                ? 'text-red-400'
                : 'text-sky-400'
            }`}
          >
            {toast.type === 'success'
              ? 'check_circle'
              : toast.type === 'error'
              ? 'error'
              : 'info'}
          </span>
          <p className="text-body-sm font-medium text-on-surface">{toast.message}</p>
        </div>
      )}

      {/* Progress Compilation Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full border border-outline-variant space-y-6 text-center shadow-2xl">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-primary text-[36px]">
                  {activeFormat === 'CSV' ? 'description' : 'picture_as_pdf'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Compiling {activeFormat} Report
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                {reports.find((r) => r.id === activeReportId)?.title}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden border border-outline-variant">
                <div
                  className="bg-primary h-2 transition-all duration-200 ease-out"
                  style={{ width: `${generationStep}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-on-surface-variant font-mono">
                <span>{generationMessage}</span>
                <span>{generationStep}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
          <span>Reports</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold">Reports Center</span>
        </nav>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Reports Center</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Generate, export, or schedule executive summaries, spend attribution, and policy compliance logs.
        </p>
      </header>

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-6 border border-outline-variant hover:border-primary/30 transition-all">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">30-Day Cumulative Cost</span>
          <p className="text-headline-lg font-bold text-primary mt-1">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass-card rounded-xl p-6 border border-outline-variant hover:border-amber-400/30 transition-all">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Compliance Violations</span>
          <p className="text-headline-lg font-bold text-amber-400 mt-1">{violations}</p>
        </div>
        <div className="glass-card rounded-xl p-6 border border-outline-variant hover:border-emerald-400/30 transition-all">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Active Policies Running</span>
          <p className="text-headline-lg font-bold text-emerald-400 mt-1">{activePoliciesCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Available Reports list (Left columns) */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">analytics</span>
            Available Executive Reports
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="glass-card rounded-xl p-6 flex flex-col justify-between border border-outline-variant hover:border-primary/20 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[24px]">
                        {report.icon}
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      {report.title}
                    </h3>
                  </div>
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">
                    {report.desc}
                  </p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleGenerateClick(report.id, 'PDF')}
                    className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    Generate PDF
                  </button>
                  <button
                    onClick={() => handleGenerateClick(report.id, 'CSV')}
                    className="flex-1 py-2 border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-variant transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    Export CSV
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active Schedules Panel */}
          <div className="glass-card rounded-xl p-6 border border-outline-variant space-y-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
              Active Scheduled Reports
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              System automated deliveries that forward compiled files periodically.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container text-on-surface-variant font-label-md text-label-md">
                  <tr>
                    <th className="px-4 py-3 font-medium border-b border-outline-variant rounded-l-lg">Report</th>
                    <th className="px-4 py-3 font-medium border-b border-outline-variant">Format</th>
                    <th className="px-4 py-3 font-medium border-b border-outline-variant">Interval</th>
                    <th className="px-4 py-3 font-medium border-b border-outline-variant">Recipient</th>
                    <th className="px-4 py-3 font-medium border-b border-outline-variant text-center">Active</th>
                    <th className="px-4 py-3 font-medium border-b border-outline-variant text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/30 font-sans">
                  {schedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-surface-variant/20 transition-all">
                      <td className="px-4 py-3.5">
                        <div className="font-bold">{sch.reportTitle}</div>
                        <div className="text-[10px] text-on-surface-variant font-mono">Next: {sch.nextRun}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sch.format === 'PDF' ? 'bg-red-400/20 text-red-400' : 'bg-emerald-400/20 text-emerald-400'
                          }`}
                        >
                          {sch.format}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{sch.frequency}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                            {sch.recipientType === 'email'
                              ? 'mail'
                              : sch.recipientType === 'slack'
                              ? 'chat_bubble'
                              : 'group'}
                          </span>
                          <span className="truncate max-w-[120px]">{sch.recipient}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleSchedule(sch.id)}
                          className="relative inline-flex h-5 w-9 items-center rounded-full bg-surface-container-high border border-outline-variant transition-colors cursor-pointer"
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-on-surface transition-transform ${
                              sch.active ? 'translate-x-4.5 bg-primary' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleRunNow(sch)}
                            title="Execute Immediately"
                            className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(sch.id)}
                            title="Remove Schedule"
                            className="w-8 h-8 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Schedule Report Form (Right column) */}
        <div>
          <div className="glass-card rounded-xl p-6 border border-outline-variant space-y-4 sticky top-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">schedule_send</span>
              Configure Schedule
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              Create a new automated report delivery trigger.
            </p>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">
                  Report Type
                </label>
                <select
                  value={newReportId}
                  onChange={(e) => setNewReportId(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                >
                  {reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">
                    Format
                  </label>
                  <select
                    value={newFormat}
                    onChange={(e) => setNewFormat(e.target.value as 'PDF' | 'CSV')}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="PDF">PDF Summary</option>
                    <option value="CSV">Raw CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">
                    Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom Cron">Custom Cron</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">
                  Channel Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['email', 'slack', 'teams'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewRecipientType(type);
                        if (type === 'slack') {
                          setNewRecipient(slackChan?.connected ? slackChan.targetChannel : '#governance-alerts');
                        } else if (type === 'teams') {
                          setNewRecipient(teamsChan?.connected ? teamsChan.targetChannel : 'AI Governance');
                        } else {
                          setNewRecipient('');
                        }
                      }}
                      className={`py-1.5 px-2 rounded-lg border font-bold text-xs capitalize transition-all cursor-pointer ${
                        newRecipientType === type
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-variant'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">
                  Recipient / Target Channel
                </label>
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    placeholder={
                      newRecipientType === 'email'
                        ? 'e.g. alerts@company.com'
                        : newRecipientType === 'slack'
                        ? 'e.g. #governance-alerts'
                        : 'e.g. AI Governance Team'
                    }
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                  {newRecipientType === 'slack' && !slackChan?.connected && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1.5 font-sans leading-snug">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Slack is disconnected. Channel alerts will run in simulation mode.
                    </p>
                  )}
                  {newRecipientType === 'teams' && !teamsChan?.connected && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1.5 font-sans leading-snug">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Teams is disconnected. Channel alerts will run in simulation mode.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">
                  Delivery Time (UTC)
                </label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Schedule Delivery
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Budget snapshot from original layout */}
      <div className="glass-card rounded-xl p-6 border border-outline-variant">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">pie_chart</span>
          Team Budget Allocation Snapshot
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {Object.keys(budgets).map((team) => {
            const b = budgets[team];
            const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
            return (
              <div
                key={team}
                className="p-4 bg-surface-container rounded-lg border border-outline-variant space-y-2 hover:border-primary/20 transition-all"
              >
                <span className="text-xs font-bold text-on-surface block truncate">{team}</span>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full ${
                      pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono flex justify-between">
                  <span>${b.spent.toFixed(0)}</span>
                  <span>/</span>
                  <span>${b.limit.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
