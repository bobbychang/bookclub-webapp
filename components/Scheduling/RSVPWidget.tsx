'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Check, X, Minus, Loader2 } from 'lucide-react';

type Status = 'YES' | 'NO' | 'MAYBE';

export default function RSVPWidget({ 
    finalDateId, 
    responses, 
    profile, 
    onUpdate 
}: { 
    finalDateId: string, 
    responses: any[], 
    profile: any, 
    onUpdate: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleRSVP = async (status: Status) => {
    if (!profile?.id) return;
    setLoading(true);
    const now = new Date().toISOString();
    
    const existing = responses.find((r: any) => r.userId === profile.id);

    const payload: any = {
        userId: profile.id,
        dateId: finalDateId,
        status: status,
        updatedAt: now,
    };

    if (!existing) {
        payload.id = crypto.randomUUID();
        payload.createdAt = now;
    } else {
        payload.id = existing.id;
    }

    const { error } = await supabase
        .from('Availability')
        .upsert(payload, { onConflict: 'userId,dateId' });

    if (error) alert(error.message);
    setLoading(false);
    onUpdate();
  };

  const userRSVP = responses.find((r: any) => r.userId === profile?.id)?.status;

  const attending = responses.filter(r => r.status === 'YES');
  const maybe = responses.filter(r => r.status === 'MAYBE');
  const no = responses.filter(r => r.status === 'NO');

  return (
    <div className="w-full mt-6 space-y-6">
      
      {/* Interaction Section (Logged In) */}
      {profile && (
        <div className="bg-background border-2 border-border p-4 rounded-2xl shadow-sm text-center">
            <h3 className="font-bold text-foreground mb-3 text-sm tracking-wide uppercase">Your RSVP</h3>
            
            {!profile.displayName ? (
                 <p className="text-yellow-600 text-xs italic bg-yellow-50 p-2 rounded-lg mb-2">
                    Please set your display name in the widget above to RSVP!
                 </p>
            ) : null}

            <div className="flex justify-center gap-4">
                <button
                    onClick={() => handleRSVP('YES')}
                    disabled={loading || !profile.displayName}
                    className={`flex-1 max-w-24 p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${userRSVP === 'YES' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-secondary text-muted-foreground border border-border hover:bg-green-50'} disabled:opacity-50`}
                >
                    <Check size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Yes</span>
                </button>
                <button
                    onClick={() => handleRSVP('MAYBE')}
                    disabled={loading || !profile.displayName}
                    className={`flex-1 max-w-24 p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${userRSVP === 'MAYBE' ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200' : 'bg-secondary text-muted-foreground border border-border hover:bg-yellow-50'} disabled:opacity-50`}
                >
                    <Minus size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Maybe</span>
                </button>
                <button
                    onClick={() => handleRSVP('NO')}
                    disabled={loading || !profile.displayName}
                    className={`flex-1 max-w-24 p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${userRSVP === 'NO' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-secondary text-muted-foreground border border-border hover:bg-red-50'} disabled:opacity-50`}
                >
                    <X size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">No</span>
                </button>
            </div>
            {loading && <Loader2 className="animate-spin w-4 h-4 text-blue-500 mx-auto mt-3" />}
        </div>
      )}

      {/* Roster Section (Public) */}
      <div className="text-left bg-white/50 border border-green-100/50 rounded-2xl p-5 shadow-inner">
          <p className="text-sm font-extrabold text-foreground uppercase tracking-widest mb-4 border-b pb-2 text-center">Guest List</p>
          
          <div className="space-y-4">
              <div>
                  <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Check size={14}/> Attending ({attending.length})
                  </h4>
                  {attending.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {attending.map((r: any) => (
                            <span key={r.id} data-testid={`attendee-${r.user?.displayName}`} className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-800 shadow-sm border border-green-200/50">
                                {r.user?.displayName || 'Unknown User'}
                            </span>
                        ))}
                      </div>
                  ) : <p className="text-xs italic text-muted-foreground pl-5">None yet.</p>}
              </div>

              {maybe.length > 0 && (
                  <div>
                      <h4 className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-2 flex items-center gap-2 mt-4 border-t pt-4">
                         <Minus size={14}/> Maybe ({maybe.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {maybe.map((r: any) => (
                            <span key={r.id} data-testid={`maybe-${r.user?.displayName}`} className="text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 shadow-sm border border-yellow-200/50">
                                {r.user?.displayName || 'Unknown User'}
                            </span>
                        ))}
                      </div>
                  </div>
              )}

              {no.length > 0 && (
                  <div>
                      <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 flex items-center gap-2 mt-4 border-t pt-4">
                         <X size={14}/> Can&apos;t Make It ({no.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {no.map((r: any) => (
                            <span key={r.id} data-testid={`no-${r.user?.displayName}`} className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-800 shadow-sm border border-red-200/50 opacity-75">
                                {r.user?.displayName || 'Unknown User'}
                            </span>
                        ))}
                      </div>
                  </div>
              )}
          </div>
      </div>

    </div>
  );
}
