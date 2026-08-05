import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppState } from '../context/StateContext';

export const LoginScreen: React.FC = () => {
  const { sendPasswordResetEmail } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isSignUp, setIsSignUp] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            org_id: 'org-default'
          }
        }
      });
      if (error) {
        setError(error.message);
      } else {
        setToastMessage("🎉 Sign up successful! Check your email for confirmation or sign in.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSubmitting(true);
    const res = await sendPasswordResetEmail(resetEmail);
    setResetSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setToastMessage(`✅ Password reset link dispatched to ${resetEmail}. Check your inbox!`);
      setShowResetModal(false);
      setResetEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 relative overflow-y-auto py-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-bold shadow-2xl max-w-sm">
          {toastMessage}
        </div>
      )}

      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md my-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-surface-container rounded-2xl border border-outline-variant shadow-xl shadow-primary/5 mb-4">
             <span className="material-symbols-outlined text-[48px] text-primary">visibility</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1 font-bold tracking-tight">Welcome to Peek</h1>
          <p className="text-body-md text-on-surface-variant">
            {isSignUp ? "Create your Enterprise AI Gateway account" : "Sign in to access your Enterprise AI Gateway"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="glass-card rounded-2xl p-8 border border-outline-variant shadow-2xl space-y-5 bg-surface-container-high/80 backdrop-blur-xl">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs font-medium flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Removed tenant organization dropdown — org is resolved automatically upon login */}

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2 tracking-wider">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  disabled={loading}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2 tracking-wider">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary" defaultChecked />
              <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">Remember session</span>
            </label>
            <button
              type="button"
              onClick={() => { setResetEmail(email); setShowResetModal(true); }}
              className="text-xs font-bold text-primary hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 mt-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
          
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-xs text-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-container-high px-2 text-on-surface-variant">Or continue with SSO</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={loading} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container border border-outline-variant hover:bg-surface-variant rounded-lg text-xs font-medium text-on-surface transition-colors disabled:opacity-50">
               Google
            </button>
            <button type="button" disabled={loading} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-surface-container border border-outline-variant hover:bg-surface-variant rounded-lg text-xs font-medium text-on-surface transition-colors disabled:opacity-50">
               Microsoft
            </button>
          </div>
          
        </form>
        
        <p className="text-center text-xs text-on-surface-variant mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <form onSubmit={handlePasswordReset} className="glass-card rounded-2xl p-8 max-w-md w-full space-y-5 border border-outline-variant shadow-2xl bg-surface-container-high">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Reset Your Password</h3>
              <button type="button" onClick={() => setShowResetModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Enter your registered email address below. We'll send an authentication recovery link to reset your account credentials.
            </p>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-surface-container border border-outline-variant rounded-xl px-3.5 py-2.5 text-body-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant font-bold rounded-xl hover:bg-surface-variant transition-all text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetSubmitting}
                className="flex-1 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-1.5"
              >
                {resetSubmitting ? (
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
