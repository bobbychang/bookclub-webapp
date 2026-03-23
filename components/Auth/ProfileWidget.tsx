'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import EmailLogin from './EmailLogin';
import { AuthContextType } from './AuthContainer';

export default function ProfileWidget({ auth }: { auth: AuthContextType }) {
  const { session, profile, checkUser, handleSignOut } = auth;
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const supabase = createClient();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile]);

  if (auth.loading) {
     return <div className="p-6 border-2 border-border rounded-3xl bg-background shadow-xl max-w-sm w-full mx-auto text-center font-bold text-muted-foreground animate-pulse">Loading Identity...</div>;
  }

  if (!session) {
    return <EmailLogin onLoginSuccess={checkUser} />;
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setLoading(true);
    setSuccessMsg('');

    let userId = session?.user?.id;
    if (isDevMode && !userId) {
        const stored = localStorage.getItem('dev-session');
        if (stored) userId = JSON.parse(stored).id;
    }

    if (!userId) {
        setLoading(false);
        return;
    }

    // Attempt an upsert so both creation and updating correctly routes to the Profile table natively
    const isAdmin = session?.user?.email === 'rchang915@gmail.com';
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('Profile')
      .upsert({
        id: userId,
        email: session?.user?.email || 'dev@example.com',
        displayName: displayName,
        isAdmin: isAdmin,
        updatedAt: now,
      } as any, { onConflict: 'email' });

    if (!error) {
      setSuccessMsg('Profile updated!');
      await checkUser(); // Refresh global auth context natively
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="p-6 border-2 border-border rounded-3xl bg-background shadow-xl space-y-4 max-w-sm w-full mx-auto relative pt-8">
      <div className="absolute top-4 right-4">
         <button onClick={handleSignOut} className="text-[10px] uppercase text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded-md transition-colors border border-red-100">Sign Out</button>
      </div>

      <div className="absolute top-4 left-4">
          {session?.user?.isDev && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold uppercase border border-yellow-200">Dev</span>}
      </div>

      <h2 className="text-xl font-bold text-foreground text-center">
        {profile?.displayName ? 'Your Identity' : 'Complete Setup'}
      </h2>
      <p className="text-muted-foreground text-xs text-center px-2">
        {profile?.displayName 
          ? 'Change your display name below at any time so the boys know who is who.' 
          : 'Please choose a display name so others know who you are in the polls!'}
      </p>

      {successMsg && <p className="text-green-600 text-xs text-center font-bold bg-green-50 py-1 rounded-md">{successMsg}</p>}

      <form onSubmit={handleUpdate} className="space-y-4 pt-2">
        <input
          type="text"
          placeholder="Display Name (e.g. Bobby)"
          className="border-2 border-border p-3 w-full rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-foreground bg-background"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading || displayName === profile?.displayName}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : profile?.displayName ? 'Update Name' : 'Finish Setup'}
        </button>
      </form>
    </div>
  );
}
