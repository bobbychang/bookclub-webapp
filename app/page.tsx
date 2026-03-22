'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BOOKCLUB_NAME, CURRENT_BOOK } from '../lib/constants';
import AuthContainer from '@/components/Auth/AuthContainer';
import DateSelection from '@/components/Scheduling/DateSelection';
import Recommendations from '@/components/Recommendations';

export default function Home() {
  const [options, setOptions] = useState(['', '', '']);
  const [joinCode, setJoinCode] = useState('');
  const router = useRouter();

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim() !== '');
    if (validOptions.length < 2) return alert('Need at least 2 options');
    
    const res = await fetch('/bookclub/api/polls', {
      method: 'POST',
      body: JSON.stringify({ options: validOptions }),
    });
    const { code } = await res.json();
    // Pass admin flag so the creator can see the "End Round" button
    router.push(`/poll/${code}?admin=true`); 
  };

  return (
    <AuthContainer>
      {(profile) => (
        <div className="max-w-2xl mx-auto mt-10 p-6 space-y-12 font-sans pb-20">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{BOOKCLUB_NAME}</h1>
            <p className="text-xl text-gray-600 font-medium">
              The next book is <span className="text-blue-600 font-bold">{CURRENT_BOOK.title}</span> by {CURRENT_BOOK.author}
            </p>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="relative w-64 h-96 overflow-hidden rounded-2xl shadow-2xl transition-transform hover:scale-105 duration-300">
              <img 
                src={CURRENT_BOOK.coverImage} 
                alt={`Cover of ${CURRENT_BOOK.title}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Date Selection Feature */}
            <DateSelection profile={profile} />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="p-6 border-2 border-gray-100 rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Join a Poll</h2>
                <p className="text-gray-500 text-sm">Enter a 4-letter code shared by your book club organizer to cast your vote.</p>
                <input 
                  className="border-2 border-gray-200 p-3 w-full rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                  placeholder="Enter 4-letter code" 
                  value={joinCode} 
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={4}
                />
              </div>
              <button 
                onClick={() => router.push(`/poll/${joinCode}`)} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all"
              >
                Join Voting
              </button>
            </div>

            <div className="p-6 border-2 border-gray-100 rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300 space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">New Poll</h2>
              <p className="text-gray-500 text-sm">Nominate books for the next meeting. Add at least two options.</p>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <input 
                    key={i} 
                    className="border-2 border-gray-200 p-3 w-full rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" 
                    placeholder={`Option ${i + 1}`} 
                    value={opt} 
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }} 
                  />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={() => setOptions([...options, ''])} className="text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors">+ Add More Options</button>
                <button onClick={handleCreate} className="w-full bg-black hover:bg-gray-800 text-white p-4 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all">
                  Create New Round
                </button>
              </div>
            </div>
          </div>
          
          <Recommendations profile={profile} />
        </div>
      )}
    </AuthContainer>
  );
}
