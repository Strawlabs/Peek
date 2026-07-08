import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';
import { supabase } from '../lib/supabase';

type ToastType = 'success' | 'error' | 'info';

export const UsersScreen: React.FC = () => {
  const { users, deleteUser, updateUserRole, activateUser, inviteUser } = useAppState();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSending(true);

    try {
      // Call the Edge Function — it sends the real invitation email
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, name, role },
      });

      if (error || data?.error) {
        let msg = data?.error || error?.message || 'Failed to send invitation';
        if (error && 'context' in error && error.context) {
          try {
            const errBody = await (error.context as any).json();
            msg = errBody.error || errBody.message || msg;
          } catch (e) {
            console.warn('Failed to parse response body:', e);
          }
        }
        showToast(`❌ ${msg}`, 'error');
      } else {
        // Edge Function already upserted the user in DB — optimistically add to local state
        // (realtime subscription will also catch it, but let's give instant feedback)
        inviteUser(name, email, role);
        showToast(`✅ Invitation sent to ${email}! They will receive an email to set their password.`, 'success');
        setName('');
        setEmail('');
        setShowInvite(false);
      }
    } catch (err) {
      // Fallback: if Edge Function is not deployed yet, use the local-only path
      console.warn('[UsersScreen] Edge function unavailable, falling back to local invite:', err);
      inviteUser(name, email, role);
      showToast(`⚠️ Invitation added locally (Edge Function not deployed). Deploy "invite-user" function to send real emails.`, 'info');
      setName('');
      setEmail('');
      setShowInvite(false);
    } finally {
      setSending(false);
    }
  };

  const handleActivate = async (userId: string) => {
    setActivatingId(userId);
    try {
      await activateUser(userId);
      showToast('✅ User activated successfully.', 'success');
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm font-medium max-w-sm animate-slide-in ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-700/50 text-emerald-200' :
          toast.type === 'error' ? 'bg-rose-950/90 border-rose-700/50 text-rose-200' :
          'bg-amber-950/90 border-amber-700/50 text-amber-200'
        }`}>
          {toast.message}
        </div>
      )}

      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-bold">Users & Permissions</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Users & Permissions</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage team access, roles, and governance permissions across Peek Enterprise.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invite User
        </button>
      </header>

      {/* How does acceptance work — info banner */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
        <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">mail</span>
        <div>
          <p className="text-sm font-bold text-on-surface">How invitation acceptance works</p>
          <p className="text-xs text-on-surface-variant mt-1">
            When you invite a user, Supabase sends them a <strong>magic link email</strong>. They click it, set a password, and their status automatically changes from <span className="text-amber-400 font-bold">Pending</span> to <span className="text-emerald-400 font-bold">Active</span>. Admins can also manually activate users using the <strong>Activate</strong> button.
          </p>
        </div>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="glass-card rounded-xl p-6 max-w-lg space-y-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Invite New User</h3>
          <p className="text-xs text-on-surface-variant">
            A real invitation email will be sent via Supabase Auth. The user clicks the link, sets their password, and joins the platform.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            type="email"
            required
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none"
          >
            <option>Super Admin</option>
            <option>Governance Manager</option>
            <option>Viewer</option>
          </select>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant font-bold rounded-lg hover:bg-surface-variant transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container text-on-surface-variant font-label-md text-label-md">
            <tr>
              <th className="px-6 py-4 font-medium border-b border-outline-variant">User</th>
              <th className="px-6 py-4 font-medium border-b border-outline-variant">Role</th>
              <th className="px-6 py-4 font-medium border-b border-outline-variant">Status</th>
              <th className="px-6 py-4 font-medium border-b border-outline-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-body-sm text-on-surface divide-y divide-outline-variant/30">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-surface-variant/20">
                <td className="px-6 py-4">
                  <div className="font-bold">{user.name}</div>
                  <div className="text-xs text-on-surface-variant">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs focus:outline-none"
                  >
                    <option>Super Admin</option>
                    <option>Governance Manager</option>
                    <option>Viewer</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                    user.status === 'Active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-amber-950/40 text-amber-400 border border-amber-800/30'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {user.status === 'Pending' && (
                      <button
                        onClick={() => handleActivate(user.id)}
                        disabled={activatingId === user.id}
                        title="Manually activate user"
                        className="px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 text-xs font-bold hover:bg-emerald-900/40 disabled:opacity-50 transition-all flex items-center gap-1"
                      >
                        {activatingId === user.id ? (
                          <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        )}
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-rose-400 hover:text-rose-300 transition-colors"
                      title="Remove user"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
