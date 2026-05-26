'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BOOKCLUB_NAME } from '../lib/constants';
import { apiPath } from '@/lib/routes';
import { getApiErrorMessage, getUnknownApiErrorMessage } from '@/lib/apiErrors';
import ApiErrorMessage from '@/components/ApiErrorMessage';
import AuthContainer from '@/components/Auth/AuthContainer';
import DateSelection from '@/components/Scheduling/DateSelection';
import Recommendations from '@/components/Recommendations';
import ProfileWidget from '@/components/Auth/ProfileWidget';

type BookSettings = {
  hasCurrentBook: boolean;
  currentBookTitle: string;
  currentBookAuthor: string | null;
  currentBookCoverUrl: string | null;
};

export default function Home() {
  const [settings, setSettings] = useState<BookSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [activePollCode, setActivePollCode] = useState<string | null>(null);
  const [pollsError, setPollsError] = useState<string | null>(null);
  const router = useRouter();

  const fetchSettings = async () => {
    try {
      setSettingsError(null);
      const res = await fetch(apiPath('/api/settings'));

      if (!res.ok) {
        setSettings(null);
        setSettingsError(await getApiErrorMessage(res, 'Current book could not load'));
        return;
      }

      const data = await res.json();
      if (data && !data.error) setSettings(data);
    } catch {
      setSettings(null);
      setSettingsError(getUnknownApiErrorMessage('Current book could not load'));
    }
  };

  const fetchPolls = async () => {
    try {
      setPollsError(null);
      const res = await fetch(apiPath('/api/polls'));

      if (!res.ok) {
        setActivePollCode(null);
        setPollsError(await getApiErrorMessage(res, 'Book selection status could not load'));
        return;
      }

      const data = await res.json();
      setActivePollCode(data?.activeCode ?? null);
    } catch {
      setActivePollCode(null);
      setPollsError(getUnknownApiErrorMessage('Book selection status could not load'));
    }
  };

  useEffect(() => {
    void fetchSettings();
    void fetchPolls();
  }, []);

  const handleCreate = async () => {
    const res = await fetch(apiPath('/api/polls'), {
      method: 'POST',
      body: JSON.stringify({ options: [] }),
    });
    const { code } = await res.json();
    router.push(`/poll/${code}?admin=true`); 
  };

  return (
    <AuthContainer>
      {(auth) => {
        const { profile } = auth;
        return (
          <div className="max-w-2xl mx-auto mt-10 p-6 space-y-12 font-sans pb-20">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{BOOKCLUB_NAME}</h1>
              {settings ? (
                <p className="text-xl text-muted-foreground font-medium animate-fade-in">
                  {settings.hasCurrentBook ? (
                    <>The next book is <span className="text-primary font-bold">{settings.currentBookTitle}</span> by {settings.currentBookAuthor}</>
                  ) : (
                    <span className="text-primary font-bold">{settings.currentBookTitle}</span>
                  )}
                </p>
              ) : settingsError ? null : (
                <p className="text-xl text-muted-foreground font-medium animate-pulse">Loading current book...</p>
              )}
              {settingsError && (
                <ApiErrorMessage
                  title="Current book failed to load"
                  message={settingsError}
                  onRetry={fetchSettings}
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-8">
              {settings?.hasCurrentBook ? (
                <div className="relative w-64 h-96 overflow-hidden rounded-2xl shadow-2xl transition-transform hover:scale-105 duration-300">
                  <img 
                    src={settings.currentBookCoverUrl} 
                    alt={`Cover of ${settings.currentBookTitle}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : settings ? (
                <div className="w-64 h-96 rounded-2xl border-2 border-dashed border-border bg-secondary shadow-inner flex items-center justify-center p-8 text-center">
                  <p className="text-lg font-bold text-muted-foreground">{settings.currentBookTitle}</p>
                </div>
              ) : null}
              
              <ProfileWidget auth={auth} />

              {/* Date Selection Feature */}
              <DateSelection profile={profile} />
            </div>

            <div className="mt-12 p-8 border-2 border-border rounded-3xl bg-background shadow-xl flex flex-col items-center justify-center text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Book Selection</h2>
              {pollsError && (
                <div className="w-full">
                  <ApiErrorMessage
                    title="Book selection failed to load"
                    message={pollsError}
                    onRetry={fetchPolls}
                  />
                </div>
              )}
              {pollsError ? null : activePollCode ? (
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
                  {profile?.isAdmin && (
                    <button onClick={handleCreate} className="mt-4 bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all">
                      Start Next Book Selection
                    </button>
                  )}
                </>
              )}
            </div>
            
            <Recommendations profile={profile} />
          </div>
        );
      }}
    </AuthContainer>
  );
}
