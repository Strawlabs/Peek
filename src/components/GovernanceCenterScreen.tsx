import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

export const GovernanceCenterScreen: React.FC = () => {
  const { policies, budgets, togglePolicy, addPolicy, updateBudgetLimit } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyDesc, setNewPolicyDesc] = useState('');
  const [newPolicyType, setNewPolicyType] = useState('data_leakage');
  const [newPolicyAction, setNewPolicyAction] = useState<'block' | 'flag'>('flag');

  const [editingBudgetTeam, setEditingBudgetTeam] = useState<string | null>(null);
  const [editingBudgetLimit, setEditingBudgetLimit] = useState<number>(0);

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

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Governance</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Governance Center</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">AI Governance Center</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage policies, controls, budgets, and compliance across AI systems.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all shadow-md shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> 
          {showAddForm ? 'Cancel Policy' : 'Create Policy'}
        </button>
      </header>

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
  );
};
