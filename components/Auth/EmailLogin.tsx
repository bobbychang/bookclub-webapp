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

  const handleDevLogin = (email: string, id: string) => {
    const devUser = {
        id: id,
        email: email,
        isDev: true
    };
    localStorage.setItem('dev-session', JSON.stringify(devUser));
    onLoginSuccess();
  };

  return (
    <div className="p-6 border-2 border-border rounded-3xl bg-background shadow-xl space-y-4 max-w-sm mx-auto mt-20">
      <h2 className="text-2xl font-bold text-foreground text-center">Welcome!</h2>
      
      {isDevMode && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-center space-y-2">
            <p className="text-yellow-700 text-[10px] font-bold uppercase tracking-widest">Dev Mode Shortcuts</p>
            <div className="flex flex-wrap gap-2 justify-center">
                <button 
                    onClick={() => handleDevLogin('rchang915@gmail.com', 'dev-admin-id')}
                    className="text-[10px] bg-yellow-500 hover:bg-yellow-600 text-primary-foreground font-bold py-1 px-3 rounded-lg transition-colors"
                >
                    Login as Admin
                </button>
                <button 
                    onClick={() => handleDevLogin('user-a@example.com', 'dev-user-id-1')}
                    className="text-[10px] bg-primary hover:bg-primary text-primary-foreground font-bold py-1 px-3 rounded-lg transition-colors"
                >
                    Login as User A
                </button>
            </div>
        </div>
      )}

      <p className="text-muted-foreground text-sm text-center">
        Enter your email to receive a magic link.
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
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
    </div>
  );
}
