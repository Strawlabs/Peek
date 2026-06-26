import React from 'react';

interface HeaderProps {
  setScreen: (screen: string) => void;
  toggleCopilotDrawer: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  setScreen,
  toggleCopilotDrawer,
  searchQuery,
  setSearchQuery,
  onMenuToggle,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 h-16 bg-background/85 backdrop-blur-md border-b border-outline-variant">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible below lg breakpoint */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-variant text-on-surface-variant transition-colors"
          aria-label="Open navigation"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <span
          onClick={() => setScreen('overview')}
          className="font-headline-lg text-headline-lg font-bold text-primary flex items-center gap-2 select-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px] md:text-[32px] text-primary">visibility</span>
          <span className="hidden sm:inline">Peek</span>
        </span>

        <div className="hidden md:flex items-center bg-surface-container border border-outline-variant px-4 py-1.5 rounded-lg w-56 lg:w-96 focus-within:border-primary transition-all">
          <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-body-sm w-full placeholder:text-on-surface-variant focus:outline-none text-on-surface"
            placeholder="Search telemetry, insights, policies..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={toggleCopilotDrawer}
          className="flex items-center gap-1 md:gap-2 px-3 py-2 bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          <span className="hidden sm:inline">Ask Peek</span>
        </button>

        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined p-2 hover:bg-surface-variant rounded-full cursor-pointer transition-colors text-[22px]" title="Notifications">
            notifications
          </span>
          <span
            onClick={() => setScreen('settings')}
            className="hidden sm:block material-symbols-outlined p-2 hover:bg-surface-variant rounded-full cursor-pointer transition-colors text-[22px]"
            title="Settings"
          >
            settings
          </span>
        </div>

        <div className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden bg-surface-container flex-shrink-0">
          <img
            alt="User Profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiIp7Yl8qooEkwD0OeOPvjWOY9bG7gC6gY4xCYsviskez2MrK2qmT7_iEysZy1ZgSE7OuoBGALT46zffHiQDkn5bif_wrl_F57PEdVt9FE4Dij3yk4bsx35UBVCLrB2CYV-c08Sny4BIrZvNWKM00Uzbe5dul-7ce7ZoDq3_uuN2EkXtfezkZyQvBvLMWOZk6U57jDqvNXPxpcfi3PXegC-B0VpxLIqm-HoAiauHGFnZFrzvR19tvkFqTMMaV84XefPS8hpIEh86I"
          />
        </div>
      </div>
    </header>
  );
};
