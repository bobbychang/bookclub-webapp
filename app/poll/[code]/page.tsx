'use client';
import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthContainer from '@/components/Auth/AuthContainer';

function PollView({ code, profile }: { code: string, profile: any }) {
  const [poll, setPoll] = useState<any>(null);
  const [myVote, setMyVote] = useState('');
  const [nominationTitle, setNominationTitle] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const searchParams = useSearchParams();
  
  const isAdmin = searchParams.get('admin') === 'true' || profile?.email === 'rchang915@gmail.com';

  useEffect(() => {
    const fetchPoll = async () => {
      const res = await fetch(`/bookclub/api/polls/${code}`);
      if (res.ok) setPoll(await res.json());
    };
    fetchPoll();
    const interval = setInterval(fetchPoll, 1000);
    return () => clearInterval(interval);
  }, [code]);

  useEffect(() => {
    fetch('/bookclub/api/recommendations')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setRecommendations(data);
      })
      .catch(() => {});
  }, []);

  if (!poll) return <div className="text-center mt-20 font-bold">Loading Poll Data...</div>;

  const handleNominate = async (title: string) => {
    await fetch(`/bookclub/api/polls/${code}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'nominate', name: profile?.displayName, title, recommenderId: profile?.id }),
    });
    setNominationTitle('');
  };

  const handleStartVoting = async () => {
    if (!confirm('Start the voting phase? This cannot be undone.')) return;
    await fetch(`/bookclub/api/polls/${code}`, { method: 'PATCH' });
  };

  const handleVote = async (option: string) => {
    setMyVote(option);
    await fetch(`/bookclub/api/polls/${code}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'vote', name: profile?.displayName, option }),
    });
  };

  const handleEndRound = async () => {
    if (!confirm('End current round and eliminate the lowest votes?')) return;
    setMyVote(''); 
    await fetch(`/bookclub/api/polls/${code}`, { method: 'PATCH' });
  };

  const currentRoundIndex = poll.rounds.length - 1;
  const currentVotes = poll.rounds[currentRoundIndex]?.votes || {};
  const totalVotesThisRound = Object.keys(currentVotes).length;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors" title="Back to Home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Link>
          <h1 className="text-2xl font-bold">Poll: {poll.code}</h1>
        </div>
        {isAdmin && poll.status === 'nominating' && (
          <button onClick={handleStartVoting} className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
            Start Voting Phase
          </button>
        )}
        {isAdmin && poll.status === 'voting' && (
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold text-blue-800 bg-blue-100 px-3 py-2 rounded-lg">
              Votes Cast: {totalVotesThisRound}
            </span>
            <button onClick={handleEndRound} className="bg-red-500 hover:bg-red-600 text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
              End Round {currentRoundIndex + 1}
            </button>
          </div>
        )}
      </div>

      {poll.status === 'finished' ? (
        <div className="bg-green-100 p-8 rounded-xl text-center space-y-4 shadow-sm border border-green-200">
          <h2 className="text-xl text-green-800 font-bold">Winner</h2>
          <p className="text-5xl font-black text-green-600">{poll.winner}</p>
        </div>
      ) : poll.status === 'nominating' ? (
        <div className="space-y-6">
          {!profile?.displayName && (
             <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 text-sm font-bold text-center shadow-sm">
                You must set a display name exclusively on the Home Page before participating in polls!
             </div>
          )}
          <div className="bg-background p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-foreground">Nominate a Book</h2>
            <p className="text-sm text-muted-foreground">Pick from existing community recommendations, or enter a new title to automatically add it via OpenLibrary.</p>
            
            <div className="space-y-3">
              <input 
                value={nominationTitle}
                onChange={e => setNominationTitle(e.target.value)}
                placeholder={profile?.displayName ? "Type a book title..." : "Identity Required"}
                disabled={!profile?.displayName}
                className="w-full border-2 border-border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary transition-all font-medium disabled:opacity-50"
                list="recommendations-list"
              />
              <datalist id="recommendations-list">
                {recommendations.map(rec => (
                   <option key={rec.id} value={rec.title}>{rec.author ? `by ${rec.author}` : ''}</option>
                ))}
              </datalist>
              <div className="flex gap-3">
                <button onClick={() => handleNominate(nominationTitle)} disabled={!nominationTitle.trim() || !profile?.displayName} className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
                  Submit Nomination
                </button>
                <button onClick={() => handleNominate('SKIP')} disabled={!profile?.displayName} className="flex-1 bg-muted text-foreground font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
                  Skip
                </button>
              </div>
            </div>
            {profile?.displayName && poll.nominations[profile.displayName] && (
               <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium border border-blue-100">
                 You nominated: {poll.nominations[profile.displayName].title || 'Skipped'}
               </div>
            )}
          </div>
          
          <div className="bg-secondary p-6 rounded-xl border border-border">
            <h3 className="font-bold text-foreground mb-4 border-b pb-2">Group Nominations</h3>
            <ul className="space-y-3">
              {Object.entries(poll.nominations || {}).map(([voterName, nom]: [string, any]) => (
                 <li key={voterName} className="flex justify-between items-center text-sm">
                   <span className="font-medium text-foreground">{voterName}</span>
                   <span className="bg-background px-3 py-1 rounded border shadow-sm font-semibold">{nom.title || 'Skipped'}</span>
                 </li>
              ))}
            </ul>
            {Object.keys(poll.nominations || {}).length === 0 && <p className="text-sm text-muted-foreground italic">No one has nominated yet.</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {!profile?.displayName ? (
             <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 text-sm font-bold text-center shadow-sm">
                You must set a display name exclusively on the Home Page before participating in polls!
             </div>
          ) : (
             <h3 className="font-semibold text-lg mt-4 text-foreground">Casting vote as <span className="text-primary">{profile.displayName}</span></h3>
          )}
          <div className="space-y-2">
            {poll.options.map((opt: string) => (
              <button 
                key={opt}
                onClick={() => handleVote(opt)}
                disabled={!profile?.displayName}
                className={`w-full p-4 border-2 rounded-xl text-left font-medium transition-all ${
                  currentVotes[profile?.displayName] === opt ? 'bg-primary text-primary-foreground border-blue-600 shadow-md transform scale-[1.02]' : 'hover:bg-secondary hover:border-blue-300'
                } disabled:opacity-50 disabled:hover:scale-100`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {poll.status === 'voting' && (
        <div className="mt-12 space-y-6">
          <h3 className="text-xl font-bold text-foreground border-b pb-2">Previous Rounds</h3>
          {poll.rounds.map((round: any, idx: number) => {
            if (idx === currentRoundIndex && poll.status === 'voting') return null; 
            return (
              <div key={idx} className="bg-secondary p-4 rounded-xl border-2 border-border shadow-sm">
                <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <span className="bg-muted text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">{idx + 1}</span> 
                  Round {idx + 1}
                </h4>
                {Object.entries(round.votes).length === 0 ? <p className="text-sm text-muted-foreground italic">No votes recorded.</p> : null}
                <ul className="space-y-2 text-sm">
                  {Object.entries(round.votes).map(([voter, choice]) => (
                    <li key={voter} className="flex justify-between border-b border-border pb-2">
                      <span className="text-foreground font-medium">{voter}</span>
                      <span className="font-bold text-foreground">{String(choice)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }).reverse()}
          
          {poll.eliminated.length > 0 && (
            <div className="p-4 bg-red-50 border-2 border-red-100 text-red-800 rounded-xl mt-6">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <span className="text-red-500">✗</span> Eliminated
              </h4>
              <div className="flex gap-2 flex-wrap">
                {poll.eliminated.map((opt: string) => (
                  <span key={opt} className="bg-background border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm line-through decoration-red-400">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PollPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  return (
    <AuthContainer>
      {(auth) => <PollView code={code} profile={auth.profile} />}
    </AuthContainer>
  );
}
