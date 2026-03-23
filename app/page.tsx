'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BOOKCLUB_NAME } from '../lib/constants';
import AuthContainer from '@/components/Auth/AuthContainer';
import DateSelection from '@/components/Scheduling/DateSelection';
import Recommendations from '@/components/Recommendations';

export default function Home() {
  const [settings, setSettings] = useState<any>(null);
  const [activePollCode, setActivePollCode] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/bookclub/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && !data.error) setSettings(data);
      })
      .catch(() => {});

    fetch('/bookclub/api/polls')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.activeCode) setActivePollCode(data.activeCode);
      })
      .catch(() => {});
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/bookclub/api/polls', {
      method: 'POST',
      body: JSON.stringify({ options: [] }),
    });
    const { code } = await res.json();
    router.push(`/poll/${code}?admin=true`); 
  };

  return (
    <AuthContainer>
      {(profile) => (
        <div className="max-w-2xl mx-auto mt-10 p-6 space-y-12 font-sans pb-20">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{BOOKCLUB_NAME}</h1>
            {settings ? (
              <p className="text-xl text-muted-foreground font-medium animate-fade-in">
                The next book is <span className="text-blue-600 font-bold">{settings.currentBookTitle}</span> by {settings.currentBookAuthor}
              </p>
            ) : (
              <p className="text-xl text-muted-foreground font-medium animate-pulse">Loading current book...</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-8">
            {settings && (
              <div className="relative w-64 h-96 overflow-hidden rounded-2xl shadow-2xl transition-transform hover:scale-105 duration-300">
                <img 
                  src={settings.currentBookCoverUrl} 
                  alt={`Cover of ${settings.currentBookTitle}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Date Selection Feature */}
            <DateSelection profile={profile} />
          </div>

          <div className="mt-12 p-8 border-2 border-border rounded-3xl bg-background shadow-xl flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Book Selection</h2>
            {activePollCode ? (
              <>
                <p className="text-muted-foreground">There is currently an active book selection process underway!</p>
                <button 
                  onClick={() => router.push(`/poll/${activePollCode}`)} 
                  className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 px-8 rounded-xl shadow-lg transform active:scale-95 transition-all"
                >
                  Go to Active Poll
                </button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">No active book selection is currently running.</p>
                {profile.isAdmin && (
                  <button onClick={handleCreate} className="mt-4 bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all">
                    Start Next Book Selection
                  </button>
                )}
              </>
            )}
          </div>
          
          <Recommendations profile={profile} />
        </div>
      )}
    </AuthContainer>
  );
}
