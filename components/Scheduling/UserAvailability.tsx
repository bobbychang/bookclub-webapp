'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Check, X, Minus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type Status = 'YES' | 'NO' | 'MAYBE';

export default function UserAvailability({ 
    poll, 
    profile, 
    onUpdate 
}: { 
    poll: any, 
    profile: any, 
    onUpdate: () => void 
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handleVote = async (dateId: string, status: Status) => {
    setLoading(dateId);
    const now = new Date().toISOString();
    
    // Check if availability already exists to decide whether to provide an ID
    const existing = poll.dates.find((d: any) => d.id === dateId)?.responses.find((r: any) => r.userId === profile.id);

    const payload: any = {
        userId: profile.id,
        dateId: dateId,
        status: status,
        updatedAt: now,
    };

    if (!existing) {
        payload.id = crypto.randomUUID();
        payload.createdAt = now;
    }

    const { error } = await supabase
        .from('Availability')
        .upsert(payload, { onConflict: 'userId,dateId' });

    if (error) alert(error.message);
    setLoading(null);
    onUpdate();
  };

  const handleFinalize = async (dateId: string, dateStr: string) => {
    if (!confirm(`Finalize the meeting for ${format(new Date(dateStr), 'PPP')}?`)) return;
    const now = new Date().toISOString();
    
    await supabase.from('SchedulingPoll').update({ 
        status: 'FINALIZED',
        finalDate: dateStr,
        updatedAt: now
    }).eq('id', poll.id);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {poll.dates.map((d: any) => {
            const userVote = d.responses.find((r: any) => r.userId === profile.id)?.status;
            
            return (
                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 gap-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{format(new Date(d.date), 'EEEE, MMMM do')}</span>
                        <span className="text-xs text-gray-500">{d.responses.length} responses</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleVote(d.id, 'YES')}
                            className={`p-2 rounded-lg transition-all ${userVote === 'YES' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:bg-green-50'}`}
                        >
                            <Check size={20} />
                        </button>
                        <button
                            onClick={() => handleVote(d.id, 'MAYBE')}
                            className={`p-2 rounded-lg transition-all ${userVote === 'MAYBE' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:bg-yellow-50'}`}
                        >
                            <Minus size={20} />
                        </button>
                        <button
                            onClick={() => handleVote(d.id, 'NO')}
                            className={`p-2 rounded-lg transition-all ${userVote === 'NO' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-200 hover:bg-red-50'}`}
                        >
                            <X size={20} />
                        </button>

                        {profile.isAdmin && poll.status === 'VOTING' && (
                            <button
                                onClick={() => handleFinalize(d.id, d.date)}
                                className="ml-4 text-[10px] font-bold uppercase tracking-wider bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800"
                            >
                                Finalize
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
