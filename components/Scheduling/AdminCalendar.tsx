'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

export default function AdminCalendar({ pollId, onComplete }: { pollId: string, onComplete: () => void }) {
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handlePropose = async () => {
    if (selectedDays.length === 0) return alert('Please select at least one date.');
    setLoading(true);

    const now = new Date().toISOString();
    const datesToInsert = selectedDays.map(d => ({
        id: crypto.randomUUID(),
        pollId: pollId,
        date: d.toISOString(),
        createdAt: now,
        updatedAt: now
    }));

    const { error: insertError } = await supabase.from('ProposedDate').insert(datesToInsert);
    
    if (insertError) {
        alert(insertError.message);
    } else {
        await supabase.from('SchedulingPoll').update({ 
            status: 'VOTING',
            updatedAt: now
        }).eq('id', pollId);
        onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="p-4 bg-gray-50 rounded-3xl border border-gray-100 shadow-inner">
        <DayPicker
          mode="multiple"
          selected={selectedDays}
          onSelect={setSelectedDays as any}
          className="mx-auto"
        />
      </div>
      <div className="text-center space-y-4 w-full">
        <p className="text-sm text-gray-500 font-medium">
            {selectedDays.length} dates selected
        </p>
        <button
          onClick={handlePropose}
          disabled={loading || selectedDays.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Propose These Dates'}
        </button>
      </div>
    </div>
  );
}
