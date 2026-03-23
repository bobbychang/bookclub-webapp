'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Calendar, Check, X, Minus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import AdminCalendar from './AdminCalendar';
import UserAvailability from './UserAvailability';
import AvailabilityGrid from './AvailabilityGrid';

export default function DateSelection({ profile }: { profile: any }) {
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPoll = useCallback(async () => {
    const { data: activePoll, error } = await supabase
      .from('SchedulingPoll')
      .select(`
        *,
        dates:ProposedDate(
          *,
          responses:Availability(
            *,
            user:Profile(displayName)
          )
        )
      `)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching poll:', error);
    }

    setPoll(activePoll);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPoll();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Availability' }, () => fetchPoll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'SchedulingPoll' }, () => fetchPoll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ProposedDate' }, () => fetchPoll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchPoll]);

  const handleStartProposing = async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase.from('SchedulingPoll').insert({ 
        id: crypto.randomUUID(),
        status: 'PROPOSING',
        createdAt: now,
        updatedAt: now
    }).select().single();

    if (error) {
        alert('Failed to start proposing: ' + error.message);
        setLoading(false);
    } else {
        // Explicitly include empty dates array to prevent crashes
        setPoll({ ...data, dates: [] });
        setLoading(false);
    }
  };

  if (loading && !poll) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (!poll || poll.status === 'IDLE') {
    return (
      <div className="w-full max-w-lg p-8 border-2 border-border bg-background rounded-3xl shadow-lg text-center space-y-4 mx-auto">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Calendar className="text-blue-600" /> Date Selection
        </h2>
        <p className="text-muted-foreground italic">The host is choosing dates for the next book club.</p>
        {profile.isAdmin && (
          <button 
            onClick={handleStartProposing}
            className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 mx-auto"
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            Start Proposing Dates
          </button>
        )}
      </div>
    );
  }

  if (poll.status === 'FINALIZED') {
    return (
        <div className="w-full max-w-lg p-8 border-2 border-green-100 bg-green-50/20 rounded-3xl shadow-lg text-center space-y-4 mx-auto">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              🎉 Date Confirmed!
          </h2>
          <div className="bg-background p-6 rounded-2xl shadow-sm border border-green-50">
            <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest mb-1">The next book club is</p>
            <p className="text-2xl font-extrabold text-green-700">{format(new Date(poll.finalDate), 'EEEE, MMMM do')}</p>
          </div>
          <p className="text-sm text-muted-foreground font-medium italic pt-2">
            Availability for this date:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {poll.dates?.find((d: any) => d.date === poll.finalDate)?.responses.map((r: any) => (
                <span key={r.id} className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                    r.status === 'YES' ? 'bg-green-100 text-green-700' : 
                    r.status === 'MAYBE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}>
                    {r.user.displayName}
                </span>
            ))}
          </div>

          {profile.isAdmin && (
            <div className="pt-6 border-t border-green-100/50 mt-4">
                <button 
                    onClick={handleStartProposing}
                    className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 flex items-center gap-2 mx-auto"
                    disabled={loading}
                >
                    {loading && <Loader2 className="animate-spin w-3 h-3" />}
                    Start New Scheduling Round
                </button>
            </div>
          )}
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="p-8 border-2 border-border bg-background rounded-3xl shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="text-blue-600" />
            {poll.status === 'PROPOSING' ? 'Choose Potential Dates' : 'Mark Your Availability'}
        </h2>
        
        {poll.status === 'PROPOSING' && profile.isAdmin ? (
            <AdminCalendar pollId={poll.id} onComplete={fetchPoll} />
        ) : (
            <UserAvailability poll={poll} profile={profile} onUpdate={fetchPoll} />
        )}

        <AvailabilityGrid dates={poll.dates || []} />
      </div>
    </div>
  );
}
