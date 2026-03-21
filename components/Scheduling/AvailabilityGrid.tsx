'use client';
import { format } from 'date-fns';

export default function AvailabilityGrid({ dates }: { dates: any[] }) {
  // Get all unique users who have responded to any date
  const allUsers = Array.from(new Set(
    dates.flatMap(d => d.responses.map((r: any) => JSON.stringify({
        id: r.userId,
        name: r.user.displayName
    })))
  )).map(s => JSON.parse(s));

  if (allUsers.length === 0) {
    return <p className="text-center text-gray-400 italic text-sm py-4">No responses yet.</p>;
  }

  return (
    <div className="mt-8 space-y-4 pt-8 border-t border-gray-100">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest text-center">Group Responses</h3>
      
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-separate border-spacing-x-1">
          <thead>
            <tr>
              <th className="p-2 min-w-[120px]"></th>
              {dates.map(d => (
                <th key={d.id} className="p-2 text-center align-top min-w-[100px]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-400">{format(new Date(d.date), 'EEE')}</span>
                    <span className="text-xs font-bold text-gray-700 leading-tight">{format(new Date(d.date), 'MMM d')}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user: any) => (
              <tr key={user.id}>
                <td className="p-2">
                  <span className="text-sm font-bold text-gray-700 truncate block max-w-[120px]">
                    {user.name}
                  </span>
                </td>
                {dates.map(d => {
                  const vote = d.responses.find((r: any) => r.userId === user.id)?.status;
                  let colorClass = 'bg-gray-100'; // Default/No vote
                  if (vote === 'YES') colorClass = 'bg-green-100 text-green-700 border border-green-200';
                  if (vote === 'MAYBE') colorClass = 'bg-yellow-100 text-yellow-700 border border-yellow-200';
                  if (vote === 'NO') colorClass = 'bg-red-100 text-red-700 border border-red-200';

                  return (
                    <td key={d.id} className="p-1">
                      <div className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${colorClass}`}>
                        {vote ? vote.substring(0, 1) : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
