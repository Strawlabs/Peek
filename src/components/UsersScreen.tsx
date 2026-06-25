import React, { useState } from 'react';
import { useAppState } from '../context/StateContext';

export const UsersScreen: React.FC = () => {
  const { users, inviteUser, deleteUser, updateUserRole } = useAppState();
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    inviteUser(name, email, role);
    setName('');
    setEmail('');
    setShowInvite(false);
  };

  return (
    <div className="space-y-6">
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

      {showInvite && (
        <form onSubmit={handleInvite} className="glass-card rounded-xl p-6 max-w-lg space-y-4">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Invite New User</h3>
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
          <button type="submit" className="w-full py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90">
            Send Invitation
          </button>
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
                    user.status === 'Active' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-amber-950/40 text-amber-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-rose-400 hover:text-rose-300 transition-colors"
                    title="Remove user"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
