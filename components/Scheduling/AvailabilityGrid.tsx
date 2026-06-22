'use client';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  YES:   'bg-green-100 text-green-700 border border-green-200',
  MAYBE: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  NO:    'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_ICON: Record<string, string> = {
  YES: '✓', MAYBE: '~', NO: '✗',
};

export default function AvailabilityGrid({ dates }: { dates: any[] }) {
  const allUsers = Array.from(new Set(
    dates.flatMap(d => d.responses.map((r: any) => JSON.stringify({
      id: r.userId,
      name: r.user.displayName,
    })))
  )).map(s => JSON.parse(s));

  if (allUsers.length === 0) {
    return <p className="text-center text-muted-foreground italic text-sm py-4">No responses yet.</p>;
  }

  return (
    <div className="mt-8 space-y-4 pt-8 border-t border-border">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">Group Responses</h3>

      <div className="space-y-2">
        {allUsers.map((user: any) => (
          <div key={user.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-xl bg-secondary">
            <span className="text-sm font-bold text-foreground w-24 shrink-0 truncate">{user.name}</span>
            <div className="flex flex-wrap gap-1.5">
              {dates.map(d => {
                const vote = d.responses.find((r: any) => r.userId === user.id)?.status;
                const styles = vote ? STATUS_STYLES[vote] : 'bg-muted text-muted-foreground';
                const icon = vote ? STATUS_ICON[vote] : '·';
                return (
                  <span
                    key={d.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${styles}`}
                  >
                    <span>{icon}</span>
                    <span>{format(new Date(d.date), 'MMM d')}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
