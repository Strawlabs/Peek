import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

export const OrganizationManagementScreen: React.FC = () => {
  const {
    organizations,
    currentOrganization,
    switchOrganization,
    createOrganization,
    currentUserRole
  } = useAppState();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newPlan, setNewPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Enterprise');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setSubmitting(true);
    try {
      await createOrganization(newOrgName.trim(), newPlan);
      showNotification(`🎉 Organization "${newOrgName}" created and activated!`, 'success');
      setNewOrgName('');
      setShowCreateModal(false);
    } catch (err: any) {
      showNotification(`Failed to create organization: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border text-xs font-bold max-w-sm ${
          toast.type === 'success' ? 'bg-emerald-950 border-emerald-700 text-emerald-200' : 'bg-rose-950 border-rose-700 text-rose-200'
        }`}>
          {toast.message}
        </div>
      )}

      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Multi-Organization Management</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Multi-Tenant Organizations</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage multi-tenant enterprise isolation, subscriptions, and active organization contexts.
          </p>
        </div>

        {currentUserRole === 'Super Admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label-md hover:opacity-90 transition-all shadow-lg shadow-primary/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">domain_add</span>
            Create New Tenant Organization
          </button>
        )}
      </header>

      {/* Active Organization Banner */}
      <div className="glass-card rounded-2xl p-6 border border-primary/30 bg-gradient-to-r from-primary/10 via-surface-container to-surface-container flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-2xl shadow-inner">
            {currentOrganization.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Active Organization Context</span>
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-extrabold bg-primary/20 text-primary border border-primary/30">
                {currentOrganization.subscriptionPlan} Plan
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mt-0.5">{currentOrganization.name}</h3>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">Org ID: {currentOrganization.id} &bull; Region: {currentOrganization.region || 'US-East'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Data Isolation Active
          </span>
        </div>
      </div>

      {/* Organization Grid */}
      <div className="space-y-4">
        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">corporate_fare</span>
          All Registered Tenant Organizations ({organizations.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => {
            const isCurrent = org.id === currentOrganization.id;
            return (
              <div
                key={org.id}
                className={`glass-card rounded-2xl p-6 border transition-all flex flex-col justify-between space-y-4 ${
                  isCurrent ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-outline-variant hover:border-outline'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center font-bold text-lg text-primary">
                      {org.name.charAt(0)}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                      org.subscriptionPlan === 'Enterprise'
                        ? 'bg-purple-950/50 text-purple-300 border border-purple-800/40'
                        : org.subscriptionPlan === 'Pro'
                        ? 'bg-sky-950/50 text-sky-300 border border-sky-800/40'
                        : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                    }`}>
                      {org.subscriptionPlan}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-on-surface">{org.name}</h4>
                    <p className="text-xs font-mono text-on-surface-variant mt-0.5">ID: {org.id}</p>
                  </div>

                  <div className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/30 text-xs font-mono space-y-1 text-on-surface-variant">
                    <div className="flex justify-between">
                      <span>Telemetry Isolation:</span>
                      <span className="text-emerald-400 font-bold">Enabled</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Region:</span>
                      <span className="text-on-surface font-bold">{org.region || 'US-East'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/30 flex justify-between items-center">
                  {isCurrent ? (
                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Active Context
                    </span>
                  ) : (
                    <button
                      onClick={() => switchOrganization(org.id)}
                      className="px-3 py-1.5 bg-surface-container border border-outline-variant text-on-surface hover:bg-primary hover:text-on-primary hover:border-primary rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                      Switch Context
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <form onSubmit={handleCreateOrg} className="glass-card rounded-2xl p-8 max-w-md w-full space-y-5 border border-outline-variant shadow-2xl bg-surface-container-high">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Create Tenant Organization</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Organization Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Health Corp"
                  required
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3.5 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Subscription Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3.5 py-2.5 text-body-sm text-on-surface focus:outline-none"
                >
                  <option value="Starter">Starter Plan</option>
                  <option value="Pro">Pro Plan</option>
                  <option value="Enterprise">Enterprise Tier</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant font-bold rounded-xl hover:bg-surface-variant transition-all text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Create Tenant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
