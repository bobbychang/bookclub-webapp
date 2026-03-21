'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import EmailLogin from './EmailLogin';
import ProfileSetup from './ProfileSetup';

export default function AuthContainer({ children }: { children: (profile: any) => React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const checkUser = async () => {
    setLoading(true);
    
    // Check Dev Mode Bypass
    if (isDevMode) {
        const devSessionStr = localStorage.getItem('dev-session');
        if (devSessionStr) {
            const devUser = JSON.parse(devSessionStr);
            setSession({ user: devUser });
            
            const { data: profile } = await supabase
                .from('Profile')
                .select('*')
                .eq('id', devUser.id)
                .single();
            
            setProfile(profile);
            setLoading(false);
            return;
        }
    }

    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    if (session?.user) {
      const { data: profile } = await supabase
        .from('Profile')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profile);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUser();

    if (!isDevMode) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                setProfile(null);
            } else {
                checkUser();
            }
        });
        return () => subscription.unsubscribe();
    }
  }, []);

  const handleSignOut = async () => {
    if (isDevMode) {
        localStorage.removeItem('dev-session');
        setSession(null);
        setProfile(null);
    } else {
        await supabase.auth.signOut();
    }
  };

  if (loading) return <div className="text-center p-10 font-bold">Loading...</div>;

  if (!session) {
    return <EmailLogin onLoginSuccess={checkUser} />;
  }

  if (!profile) {
    return <ProfileSetup onComplete={checkUser} />;
  }

  return (
    <>
      <div className="max-w-2xl mx-auto px-6 pt-4 flex justify-between items-center text-sm font-medium">
        <div className="flex items-center gap-2">
            <span className="text-gray-600">Signed in as <span className="text-blue-600 font-bold">{profile.displayName}</span></span>
            {session.user.isDev && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Dev Mode</span>}
        </div>
        <button 
          onClick={handleSignOut}
          className="text-red-500 hover:text-red-700"
        >
          Sign Out
        </button>
      </div>
      {children(profile)}
    </>
  );
}
