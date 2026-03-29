'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function EmailLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const query = window.location.search;
      
      const paramsToSearch = hash.includes('error=') ? new URLSearchParams(hash.substring(1)) : new URLSearchParams(query);
      
      if (paramsToSearch.has('error')) {
        const errDesc = paramsToSearch.get('error_description') || paramsToSearch.get('error');
        setError(`Login verification failed: ${errDesc?.replace(/\+/g, ' ')}`);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // --- DEV MODE BYPASS ---
    if (isDevMode) {
      try {
        const response = await fetch('/bookclub/api/auth/dev-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.email_otp) {
          // Instantly verify the OTP instead of redirecting
          // This ensures App Router + @supabase/ssr set the proper cookies inside the Next boundary.
          const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: data.email_otp,
            type: 'email'
          });
          
          if (verifyError) {
            setError(verifyError.message);
          } else {
            // AuthContainer will handle the onAuthStateChange natively and hide this component
            if (onLoginSuccess) onLoginSuccess();
          }
          setLoading(false);
          return;
        } else if (response.ok && data.properties?.action_link) {
          // Fallback legacy action handling
          window.location.href = data.properties.action_link;
          return;
        } else {
          setError(data.error || "Dev bypass failed");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Dev login failed:", err);
        setError("Dev login connection error");
        setLoading(false);
        return;
      }
    }

    // --- STANDARD PRODUCTION FLOW ---
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/bookclub`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for the magic link!');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 border-2 border-border rounded-3xl bg-background shadow-xl space-y-4 max-w-sm mx-auto mt-20">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome!</h2>
        {isDevMode && (
          <div className="flex flex-col items-center gap-1">
            <div className="inline-block px-3 py-1 bg-yellow-100 border border-yellow-200 rounded-full">
              <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">Dev Mode: Email Bypass Active</p>
            </div>
            {process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('bzgbskmghquhoxlbfcev') && (
              <div className="inline-block px-3 py-1 bg-red-100 border border-red-200 rounded-full animate-pulse">
                <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-widest">⚠️ WARNING: PRODUCTION DATA CONNECTED</p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-muted-foreground text-sm text-center">
        {isDevMode 
          ? "Enter any email to log in instantly (Dev Mode)." 
          : "Enter your email to receive a magic link."}
      </p>

      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      {message && <p className="text-green-600 text-xs text-center font-bold">{message}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          className="border-2 border-border p-3 w-full rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isDevMode ? 'Instant Login' : 'Send Magic Link')}
        </button>
      </form>
    </div>
  );
}
