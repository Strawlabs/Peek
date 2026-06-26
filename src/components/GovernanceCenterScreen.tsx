import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

export const GovernanceCenterScreen: React.FC = () => {
  const { policies, budgets, requests, togglePolicy, addPolicy, updateBudgetLimit } = useAppState();
  
  // Tab State: 'policies' | 'audit_logs'
  const [activeTab, setActiveTab] = useState<'policies' | 'audit_logs'>('policies');

  // Policy form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyDesc, setNewPolicyDesc] = useState('');
  const [newPolicyType, setNewPolicyType] = useState('data_leakage');
  const [newPolicyAction, setNewPolicyAction] = useState<'block' | 'flag'>('flag');

  // Budget editing state
  const [editingBudgetTeam, setEditingBudgetTeam] = useState<string | null>(null);
  const [editingBudgetLimit, setEditingBudgetLimit] = useState<number>(0);

  // Audit Logs Filter State
  const [logTypeFilter, setLogTypeFilter] = useState<string>('violations');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const handleSubmitPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName || !newPolicyDesc) return;
    addPolicy(newPolicyName, newPolicyDesc, newPolicyType, newPolicyAction);
    setNewPolicyName('');
    setNewPolicyDesc('');
    setShowAddForm(false);
  };

  const startEditBudget = (team: string, limit: number) => {
    setEditingBudgetTeam(team);
    setEditingBudgetLimit(limit);
  };

  const handleSaveBudget = (team: string) => {
    updateBudgetLimit(team, editingBudgetLimit);
    setEditingBudgetTeam(null);
  };

  // Filter requests for the Audit Log
  const filteredLogs = requests.filter((req) => {
    // 1. Log Type Filter
    if (logTypeFilter === 'violations') {
      // Anything that is not Optimal
      if (req.status === 'Optimal') return false;
    } else if (logTypeFilter === 'pii') {
      if (!req.status.includes('PII')) return false;
    } else if (logTypeFilter === 'model') {
      if (!req.status.includes('Policy')) return false;
    } else if (logTypeFilter === 'blocked') {
      if (!req.status.includes('Blocked')) return false;
    } else if (logTypeFilter === 'flagged') {
      if (!req.status.includes('Flagged')) return false;
    }

    // 2. Search Query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchText = `${req.team} ${req.project} ${req.workflow} ${req.prompt} ${req.response} ${req.status} ${req.model} ${req.provider}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    return true;
  }).sort((a, b) => b.timestamp - a.timestamp); // Show newest logs first

  return (
    <div className="space-y-6">
      <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Governance</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Governance Center</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">AI Governance Center</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage policies, controls, budgets, and compliance audit logs across AI systems.
          </p>
        </div>
        
        {activeTab === 'policies' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all shadow-md shadow-primary/10"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> 
            {showAddForm ? 'Cancel Policy' : 'Create Policy'}
          </button>
        )}
      </header>

      {/* Tabs Switcher */}
      <div className="flex border-b border-outline-variant/30 gap-6">
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 font-label-md text-label-md flex items-center gap-2 transition-all relative ${
            activeTab === 'policies' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">gavel</span>
          Policies & Budgets
          {activeTab === 'policies' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></span>}
        </button>
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`pb-3 font-label-md text-label-md flex items-center gap-2 transition-all relative ${
            activeTab === 'audit_logs' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          Compliance Audit Logs
          {activeTab === 'audit_logs' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></span>}
        </button>
      </div>

      {activeTab === 'policies' ? (
        <div className="space-y-6">
          {/* Add Policy Form Overlay / Drawer */}
          {showAddForm && (
            <form onSubmit={handleSubmitPolicy} className="glass-card rounded-xl p-6 max-w-xl space-y-4 animate-fadeIn">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">rule</span>
                Define New Gateway Security Rule
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Policy Name</label>
                  <input
                    value={newPolicyName}
                    onChange={(e) => setNewPolicyName(e.target.value)}
                    required
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                    placeholder="e.g. HIPAA Compliance filter"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Description</label>
                  <textarea
                    value={newPolicyDesc}
                    onChange={(e) => setNewPolicyDesc(e.target.value)}
                    required
                    className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary h-20"
                    placeholder="Brief summary of policy checks, regex patterns, or conditions"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Category</label>
                    <select
                      value={newPolicyType}
                      onChange={(e) => setNewPolicyType(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
                    >
                      <option value="data_leakage">Data Leakage</option>
                      <option value="model_restriction">Model Restrictions</option>
                      <option value="residency">Data Residency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Action on Violation</label>
                    <select
                      value={newPolicyAction}
                      onChange={(e) => setNewPolicyAction(e.target.value as 'block' | 'flag')}
                      className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
                    >
                      <option value="flag">Flag (Log Only)</option>
                      <option value="block">Block (Gateway Rejection)</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-all">
                Deploy Policy Rule to Gateway
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Policies Manager List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Deployed Gateway Policies</h3>
              <div className="grid grid-cols-1 gap-4">
                {policies.map((p) => (
                  <div key={p.id} className="glass-card rounded-xl p-6 flex justify-between items-start">
                    <div className="space-y-2 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          p.type === 'data_leakage' 
                            ? 'bg-rose-950/40 text-rose-400 border border-rose-800/30'
                            : p.type === 'model_restriction'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {p.type.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-xs text-outline">ID: {p.id}</span>
                      </div>
                      <h4 className="text-body-lg font-bold text-on-surface">{p.name}</h4>
                      <p className="text-body-sm text-on-surface-variant leading-relaxed">{p.description}</p>
                      <div className="text-[11px] text-outline font-bold uppercase">
                        ACTION: <span className={p.action === 'block' ? 'text-rose-400' : 'text-amber-400'}>{p.action}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between h-full gap-4">
                      <button
                        onClick={() => togglePolicy(p.id)}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${
                          p.active ? 'bg-primary flex justify-end' : 'bg-surface-variant flex justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-surface-container"></div>
                      </button>
                      <span className={`text-xs font-bold ${p.active ? 'text-primary' : 'text-outline'}`}>
                        {p.active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Center manager */}
            <div className="glass-card rounded-xl p-6 space-y-4 h-fit">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Allocated Team Budgets</h3>
              <p className="text-xs text-on-surface-variant">Configure monthly limits for each department. Violations emit real-time logs.</p>
              <div className="space-y-4">
                {Object.keys(budgets).map((team) => {
                  const b = budgets[team];
                  const isEditing = editingBudgetTeam === team;
                  return (
                    <div key={team} className="p-3 bg-surface-container rounded-lg border border-outline-variant flex justify-between items-center">
                      <div>
                        <span className="text-body-sm text-on-surface font-bold block">{team}</span>
                        <span className="text-xs text-on-surface-variant font-mono">Spent: ${b.spent.toFixed(2)}</span>
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingBudgetLimit}
                            onChange={(e) => setEditingBudgetLimit(Number(e.target.value))}
                            className="w-20 bg-surface-container-low border border-outline-variant rounded px-2 py-1 text-xs text-on-surface font-mono"
                          />
                          <button onClick={() => handleSaveBudget(team)} className="text-primary hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[18px]">check</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-label-md text-label-md text-primary font-mono">${b.limit.toLocaleString()}</span>
                          <button onClick={() => startEditBudget(team, b.limit)} className="text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Compliance Audit Logs Tab */
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container p-4 rounded-xl border border-outline-variant/30">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Filter by:</span>
              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm text-on-surface focus:outline-none"
              >
                <option value="violations">All Violations / Warnings</option>
                <option value="all">All Gateway Activity</option>
                <option value="pii">PII Leaks Only</option>
                <option value="model">Model Restrictions Only</option>
                <option value="blocked">Blocked Requests Only</option>
                <option value="flagged">Flagged Requests Only</option>
              </select>
            </div>

            <div className="flex items-center bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg w-full md:w-80 focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-outline text-[18px] mr-2">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-body-sm w-full placeholder:text-on-surface-variant focus:outline-none text-on-surface"
                placeholder="Search audit prompt, team, model..."
                type="text"
              />
            </div>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container text-on-surface-variant font-label-md text-label-md">
                  <tr>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Timestamp</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Team & Project</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Workflow</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Model</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant">Security Status</th>
                    <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/30">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant font-medium">
                        No compliance audit logs match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((req) => {
                      const isExpanded = expandedLogId === req.id;
                      const isViolation = req.status !== 'Optimal';
                      const isBlocked = req.status.includes('Blocked');
                      
                      return (
                        <React.Fragment key={req.id}>
                          <tr className={`hover:bg-surface-variant/10 transition-colors ${isExpanded ? 'bg-surface-variant/10' : ''}`}>
                            <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                              {new Date(req.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold">{req.team}</div>
                              <div className="text-xs text-on-surface-variant">{req.project}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {req.workflow}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                              {req.provider}/{req.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold border ${
                                isBlocked 
                                  ? 'bg-rose-950/40 text-rose-400 border-rose-800/30'
                                  : isViolation
                                  ? 'bg-amber-950/40 text-amber-400 border-amber-800/30'
                                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : req.id)}
                                className="flex items-center gap-1 ml-auto text-primary hover:text-white transition-colors"
                              >
                                <span className="text-xs font-bold">{isExpanded ? 'Hide' : 'Inspect'}</span>
                                <span className="material-symbols-outlined text-[18px]">
                                  {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                                </span>
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Details Panel */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2 animate-fadeIn">
                                  <div className="space-y-4">
                                    <div>
                                      <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">terminal</span>
                                        Prompt Payload
                                      </h5>
                                      <div className="p-3 bg-surface-container rounded-lg text-xs font-mono max-h-40 overflow-y-auto border border-outline-variant/20 whitespace-pre-wrap leading-relaxed text-on-surface">
                                        {req.prompt}
                                      </div>
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">question_answer</span>
                                        Response Payload
                                      </h5>
                                      <div className={`p-3 bg-surface-container rounded-lg text-xs font-mono max-h-40 overflow-y-auto border border-outline-variant/20 whitespace-pre-wrap leading-relaxed ${
                                        isBlocked ? 'text-rose-400' : 'text-on-surface'
                                      }`}>
                                        {req.response}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">info</span>
                                      Attribution & Execution Metrics
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="p-3 bg-surface-container rounded-lg">
                                        <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Latency</span>
                                        <span className="text-body-md font-bold font-mono text-primary">{req.latency.toFixed(2)}s</span>
                                      </div>
                                      <div className="p-3 bg-surface-container rounded-lg">
                                        <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Calculated Cost</span>
                                        <span className="text-body-md font-bold font-mono text-primary">${req.cost.toFixed(5)}</span>
                                      </div>
                                      <div className="p-3 bg-surface-container rounded-lg">
                                        <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Input Tokens</span>
                                        <span className="text-body-md font-bold font-mono">{req.tokens_in.toLocaleString()}</span>
                                      </div>
                                      <div className="p-3 bg-surface-container rounded-lg">
                                        <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Output Tokens</span>
                                        <span className="text-body-md font-bold font-mono">{req.tokens_out.toLocaleString()}</span>
                                      </div>
                                    </div>

                                    <div className="p-3 bg-surface-container rounded-lg flex justify-between items-center">
                                      <div>
                                        <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Customer Header</span>
                                        <span className="text-xs font-bold">{req.customer}</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Department</span>
                                        <span className="text-xs font-bold">{req.department}</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] text-on-surface-variant uppercase block font-bold">Project Ref</span>
                                        <span className="text-xs font-mono">{req.project}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
