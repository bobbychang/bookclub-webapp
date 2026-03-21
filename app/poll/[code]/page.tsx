'use client';
import { useState, useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';

export default function PollPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  
  const [poll, setPoll] = useState<any>(null);
  const [name, setName] = useState('');
  const [isNameLocked, setIsNameLocked] = useState(false);
  const [myVote, setMyVote] = useState('');
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';

  // Check local storage for an existing name on load
  useEffect(() => {
    const savedName = localStorage.getItem(`voterName_${code}`);
    if (savedName) {
      setName(savedName);
      setIsNameLocked(true);
    }
  }, [code]);

  useEffect(() => {
    const fetchPoll = async () => {
      const res = await fetch(`/api/polls/${code}`);
      if (res.ok) setPoll(await res.json());
    };
    fetchPoll();
    const interval = setInterval(fetchPoll, 1000);
    return () => clearInterval(interval);
  }, [code]);

  if (!poll) return <div className="text-center mt-20">Loading...</div>;

  const handleVote = async (option: string) => {
    if (!name.trim()) return alert('Please enter your name first');
    
    // Lock the name in state and local storage
    const trimmedName = name.trim();
    if (!isNameLocked) {
      localStorage.setItem(`voterName_${code}`, trimmedName);
      setName(trimmedName);
      setIsNameLocked(true);
    }

    setMyVote(option);
    await fetch(`/api/polls/${code}`, {
      method: 'POST',
      body: JSON.stringify({ name: trimmedName, option }),
    });
  };

  const handleEndRound = async () => {
    if (!confirm('End current round and eliminate the lowest votes?')) return;
    setMyVote(''); 
    await fetch(`/api/polls/${code}`, { method: 'PATCH' });
  };

  const currentRoundIndex = poll.rounds.length - 1;
  const currentVotes = poll.rounds[currentRoundIndex].votes;
  const totalVotesThisRound = Object.keys(currentVotes).length;

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Poll: {poll.code}</h1>
        {isAdmin && poll.status === 'active' && (
          <div className="flex items-center gap-3">
             <span className="text-sm font-bold text-blue-800 bg-blue-100 px-3 py-2 rounded-lg">
              Votes Cast: {totalVotesThisRound}
            </span>
            <button onClick={handleEndRound} className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
              End Round {currentRoundIndex + 1}
            </button>
          </div>
        )}
      </div>

      {poll.status === 'finished' ? (
        <div className="bg-green-100 p-8 rounded-xl text-center space-y-4">
          <h2 className="text-xl text-green-800">Winner</h2>
          <p className="text-5xl font-black text-green-600">{poll.winner}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Your Name</label>
            <input 
              className="border p-2 w-full rounded disabled:bg-gray-100 disabled:text-gray-400" 
              placeholder="e.g. Alice" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              disabled={isNameLocked} 
            />
            {isNameLocked && (
              <p className="text-xs text-gray-500 mt-1">Your name is locked for this poll.</p>
            )}
          </div>

          <h3 className="font-semibold text-lg mt-4">Active Options</h3>
          <div className="space-y-2">
            {poll.options.map((opt: string) => (
              <button 
                key={opt}
                onClick={() => handleVote(opt)}
                className={`w-full p-4 border rounded-xl text-left transition ${
                  currentVotes[name] === opt ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 space-y-6">
        <h3 className="text-xl font-bold text-gray-800">Previous Rounds</h3>
        {poll.rounds.map((round: any, idx: number) => {
          if (idx === currentRoundIndex && poll.status === 'active') return null; 
          return (
            <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2">Round {idx + 1}</h4>
              {Object.entries(round.votes).length === 0 ? <p className="text-sm text-gray-500">No votes recorded.</p> : null}
              <ul className="space-y-1 text-sm">
                {Object.entries(round.votes).map(([voter, choice]) => (
                  <li key={voter} className="flex justify-between border-b pb-1">
                    <span className="text-gray-600">{voter}</span>
                    <span className="font-medium">{String(choice)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }).reverse()}
        
        {poll.eliminated.length > 0 && (
          <div className="p-4 bg-red-50 text-red-800 rounded-lg">
            <h4 className="font-semibold mb-2">Eliminated</h4>
            <div className="flex gap-2 flex-wrap">
              {poll.eliminated.map((opt: string) => (
                <span key={opt} className="bg-red-200 px-2 py-1 rounded text-xs line-through">{opt}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
