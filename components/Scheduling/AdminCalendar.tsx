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

    const datesToPropose = selectedDays.map(d => ({
        date: d.toISOString(),
    }));

    const response = await fetch('/bookclub/api/admin/scheduling/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, dates: datesToPropose }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to propose dates');
    } else {
        onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="p-4 bg-secondary rounded-3xl border border-border shadow-inner">
        <DayPicker
          mode="multiple"
          selected={selectedDays}
          onSelect={setSelectedDays as any}
          className="mx-auto"
        />
      </div>
      <div className="text-center space-y-4 w-full">
        <p className="text-sm text-muted-foreground font-medium">
            {selectedDays.length} dates selected
        </p>
        <button
          onClick={handlePropose}
          disabled={loading || selectedDays.length === 0}
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-4 rounded-2xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Propose These Dates'}
        </button>
      </div>
    </div>
  );
}
