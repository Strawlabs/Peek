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

function AppShell() {
  const [currentScreen, setScreen] = useState('overview');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'overview':
        return <OverviewScreen setScreen={setScreen} />;
      case 'spend':
        return <SpendAnalyticsScreen />;
      case 'governance':
        return <GovernanceCenterScreen />;
      case 'intelligence':
        return <IntelligenceCenterScreen />;
      case 'tba':
        return <TokenBenefitScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'integrations':
        return <IntegrationsScreen />;
      case 'sandbox':
        return <ProxyPlaygroundScreen />;
      case 'users':
        return <UsersScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <OverviewScreen setScreen={setScreen} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        setScreen={setScreen}
        toggleCopilotDrawer={() => setCopilotOpen((open) => !open)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <Sidebar currentScreen={currentScreen} setScreen={setScreen} />
      <main
        className={`ml-64 pt-16 min-h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ${
          copilotOpen ? 'mr-[500px]' : ''
        }`}
      >
        <div className="p-container-padding-desktop max-w-[1400px] mx-auto">
          {renderScreen()}
        </div>
      </main>
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
