import { useState, useEffect } from 'react';
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
import { LoginScreen } from './components/LoginScreen';

import { useAppState } from './context/StateContext';
import { supabase } from './lib/supabase';

function SetPasswordModal({ onClose }: { onClose: () => void }) {
  const { updatePassword, authSession } = useAppState();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; success: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters long.', success: false });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', success: false });
      return;
    }

    setSubmitting(true);
    setToast(null);

    const res = await updatePassword(password);
    setSubmitting(false);

    if (res.error) {
      setToast({ message: `❌ ${res.error}`, success: false });
    } else {
      setToast({ message: '🎉 Password set successfully! You are now fully activated.', success: true });
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 max-w-md w-full space-y-5 border border-primary/20 shadow-2xl relative">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-[48px] text-primary">lock_reset</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">Set Your Password</h3>
          <p className="text-body-sm text-on-surface-variant">
            You successfully accepted the invitation for <strong>{authSession?.email}</strong>. Please set a secure password to finalize your account setup.
          </p>
        </div>

        {toast && (
          <div className={`p-3 rounded-lg text-xs font-medium ${toast.success ? 'bg-emerald-950/80 border border-emerald-700/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-700/50 text-rose-300'
            }`}>
            {toast.message}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              disabled={submitting}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              disabled={submitting}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Finalize Account'
          )}
        </button>
      </form>
    </div>
  );
}

function AppShell() {
  const { loading, error, authSession } = useAppState();
  const [currentScreen, setScreen] = useState('overview');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);

  // Detect invite redirect or direct token hash login on load
  useEffect(() => {
    const handleHashAuth = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      const isStandardRedirect = hash.includes('type=invite') || hash.includes('type=recovery');
      const hasTokenHash = hash.includes('token_hash=');

      if (hasTokenHash) {
        // Parse token_hash and type from hash params (e.g. #token_hash=xxx&type=invite)
        const rawHash = hash.substring(1); // strip the leading '#'
        const params = new URLSearchParams(rawHash);
        const tokenHash = params.get('token_hash');
        const type = params.get('type') || 'invite';

        if (tokenHash) {
          console.log(`[Peek] Verifying direct login token...`);
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });

          if (error) {
            console.error('[Peek] Direct verification failed:', error.message);
            alert(`Direct login link failed: ${error.message}`);
          } else {
            console.log('[Peek] Direct verification succeeded! Logging user in.');
            setShowSetPassword(true);
          }
        }
        // Clean URL hash
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else if (isStandardRedirect) {
        setShowSetPassword(true);
        // Clean URL hash so refreshing doesn't keep triggering modal
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };

    handleHashAuth();
  }, []);


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
      case 'overview': return <OverviewScreen setScreen={setScreen} />;
      case 'spend': return <SpendAnalyticsScreen />;
      case 'governance': return <GovernanceCenterScreen />;
      case 'intelligence': return <IntelligenceCenterScreen />;
      case 'tba': return <TokenBenefitScreen />;
      case 'reports': return <ReportsScreen />;
      case 'integrations': return <IntegrationsScreen />;
      case 'sandbox': return <ProxyPlaygroundScreen />;
      case 'users': return <UsersScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <OverviewScreen setScreen={setScreen} />;
    }
  };

  if (!authSession) {
    return (
      <>
        <LoginScreen />
        {showSetPassword && (
          <SetPasswordModal onClose={() => setShowSetPassword(false)} />
        )}
      </>
    );
  }

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

      {/* Set Password Modal */}
      {showSetPassword && (
        <SetPasswordModal onClose={() => setShowSetPassword(false)} />
      )}
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
