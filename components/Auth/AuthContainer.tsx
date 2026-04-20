'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import EmailLogin from './EmailLogin';
import ProfileSetup from './ProfileSetup';

export interface AuthContextType {
  session: any;
  profile: any;
  loading: boolean;
  checkUser: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

export default function AuthContainer({ children }: { children: (auth: AuthContextType) => React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

  const checkUser = async () => {
    setLoading(true);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (!session) {
            setProfile(null);
        } else {
            checkUser();
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return <>{children({ session, profile, loading, checkUser, handleSignOut })}</>;
}
