'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let user: any = null;

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    user = supabaseUser;

    if (!user && isDevMode) {
        const devSessionStr = localStorage.getItem('dev-session');
        if (devSessionStr) {
            user = JSON.parse(devSessionStr);
        }
    }

    if (!user) {
      setError('No user found. Please try logging in again.');
      setLoading(false);
      return;
    }

    // Requirements: Administrator account is tied to rchang915@gmail.com
    const isAdmin = user.email === 'rchang915@gmail.com';
    const now = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from('Profile')
      .upsert({
        id: user.id,
        email: user.email!,
        displayName: displayName,
        isAdmin: isAdmin,
        updatedAt: now,
        createdAt: now,
      }, { onConflict: 'email' });

    if (upsertError) {
      setError(upsertError.message);
    } else {
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="p-6 border-2 border-border rounded-3xl bg-background shadow-xl space-y-4 max-w-sm mx-auto mt-20">
      <h2 className="text-2xl font-bold text-foreground text-center">Complete Your Profile</h2>
      <p className="text-muted-foreground text-sm text-center">Please choose a display name so others know who you are.</p>

      {error && <p className="text-red-500 text-xs text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Display Name (e.g. Bobby)"
          className="border-2 border-border p-3 w-full rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Finish Setup'}
        </button>
      </form>
    </div>
  );
}
