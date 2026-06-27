import React from 'react';

interface SidebarProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, setScreen, mobileOpen, setMobileOpen }) => {
  const menuItems = [
    { id: 'overview', name: 'Executive Overview', icon: 'dashboard' },
    { id: 'spend', name: 'AI Spend Analytics', icon: 'payments' },
    { id: 'governance', name: 'Governance Center', icon: 'gavel' },
    { id: 'intelligence', name: 'Intelligence Center', icon: 'psychology' },
    { id: 'tba', name: 'Token Benefit Analysis™', icon: 'generating_tokens' },
    { id: 'reports', name: 'Reports Center', icon: 'description' },
    { id: 'integrations', name: 'Integrations', icon: 'extension' },
  ];

  const adminItems = [
    { id: 'sandbox', name: 'Proxy Playground', icon: 'terminal', highlight: true },
    { id: 'users', name: 'Users & Permissions', icon: 'group' },
    { id: 'settings', name: 'Organization Settings', icon: 'settings' },
  ];

  const navigate = (id: string) => {
    setScreen(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 h-full w-64 pt-16 pb-6 px-4 flex flex-col justify-between
          bg-surface-container-low border-r border-outline-variant z-40
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1 min-h-0 pt-4">
          <div className="mb-4 px-2">
            <h2 className="font-headline-sm text-headline-sm font-black text-on-surface">Peek Enterprise</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70">AI Governance Platform</p>
          </div>

          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all active:scale-95 duration-100 text-left w-full ${
                currentScreen === item.id
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined flex-shrink-0">{item.icon}</span>
              <span className="font-label-md text-label-md truncate">{item.name}</span>
            </button>
          ))}

          <div className="h-px bg-outline-variant/30 my-3 mx-2" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-outline px-3 mb-1 block">Simulation & Admin</span>

          {adminItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all active:scale-95 duration-100 text-left w-full ${
                currentScreen === item.id
                  ? 'bg-secondary-container text-on-secondary-container font-bold border border-primary/20'
                  : item.highlight
                  ? 'border border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className={`material-symbols-outlined flex-shrink-0 ${item.highlight && currentScreen !== item.id ? 'text-primary' : ''}`}>
                {item.icon}
              </span>
              <span className={`font-label-md text-label-md truncate ${item.highlight && currentScreen !== item.id ? 'text-primary' : ''}`}>
                {item.name}
              </span>
            </button>
          ))}
        </div>

        <div className="px-2 pt-4 border-t border-outline-variant/20 flex-shrink-0">
          <div className="bg-surface-container p-3 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-[11px] text-outline font-bold">DATA RESIDENCY</div>
              <div className="text-xs text-primary font-medium">US-East (Virginia)</div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
