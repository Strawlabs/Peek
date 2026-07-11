import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setError("Sign up successful! You can now sign in.");
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
  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 relative overflow-y-auto py-12">
      {/* Decorative background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md my-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-surface-container rounded-2xl border border-outline-variant shadow-xl shadow-primary/5 mb-6">
             <span className="material-symbols-outlined text-[48px] text-primary">visibility</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2 font-bold tracking-tight">Welcome to Peek</h1>
          <p className="text-body-md text-on-surface-variant">
            {isSignUp ? "Create a new account" : "Sign in to access your Enterprise AI Gateway"}
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

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary focus:ring-offset-background" />
              <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
            </label>
            <a href="#" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
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
    </div>
  );
};
