import { useState } from 'react';
import { StateProvider } from './context/StateContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AskPeekDrawer } from './components/AskPeekDrawer';
import { OverviewScreen } from './components/OverviewScreen';
import { SpendAnalyticsScreen } from './components/SpendAnalyticsScreen';
import { GovernanceCenterScreen } from './components/GovernanceCenterScreen';
import { IntelligenceCenterScreen } from './components/IntelligenceCenterScreen';
import { TokenBenefitScreen } from './components/TokenBenefitScreen';
import { ProxyPlaygroundScreen } from './components/ProxyPlaygroundScreen';
import { UsersScreen } from './components/UsersScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { IntegrationsScreen } from './components/IntegrationsScreen';

import { useAppState } from './context/StateContext';

function AppShell() {
  const { loading, error } = useAppState();
  const [currentScreen, setScreen] = useState('overview');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-body-md text-on-surface-variant animate-pulse font-medium">Syncing with Supabase...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
        <span className="material-symbols-outlined text-rose-400 text-[64px]">cloud_off</span>
        <div className="text-center max-w-md">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Unable to Connect to Supabase</h1>
          <p className="text-body-md text-on-surface-variant mb-4">The application could not reach its data backend. Verify your environment variables and Supabase project status.</p>
          <code className="block bg-surface-container border border-outline-variant rounded-lg px-4 py-3 text-xs text-rose-300 font-mono text-left break-all mb-6">
            {error}
          </code>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'overview':    return <OverviewScreen setScreen={setScreen} />;
      case 'spend':       return <SpendAnalyticsScreen />;
      case 'governance':  return <GovernanceCenterScreen />;
      case 'intelligence':return <IntelligenceCenterScreen />;
      case 'tba':         return <TokenBenefitScreen />;
      case 'reports':     return <ReportsScreen />;
      case 'integrations':return <IntegrationsScreen />;
      case 'sandbox':     return <ProxyPlaygroundScreen />;
      case 'users':       return <UsersScreen />;
      case 'settings':    return <SettingsScreen />;
      default:            return <OverviewScreen setScreen={setScreen} />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Header
        setScreen={setScreen}
        toggleCopilotDrawer={() => setCopilotOpen((o) => !o)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onMenuToggle={() => setMobileNavOpen((o) => !o)}
      />

      <Sidebar
        currentScreen={currentScreen}
        setScreen={setScreen}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
      />

      {/* Main content — shifts right of sidebar only on lg+; scrolls independently */}
      <main className="lg:ml-64 pt-16 flex-1 overflow-y-auto">
        {/* Copilot drawer shifts content on large screens; on small it overlays */}
        <div
          className={`transition-all duration-300 ${copilotOpen ? 'lg:mr-[500px]' : ''}`}
        >
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto pb-12">
            {renderScreen()}
          </div>
        </div>
      </main>

      {/* Copilot drawer */}
      <AskPeekDrawer isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <StateProvider>
      <AppShell />
    </StateProvider>
  );
}

export default App;
