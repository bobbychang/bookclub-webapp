'use client';
import { useState, useEffect } from 'react';
import { apiPath } from '@/lib/routes';

type BookStatus = 'FUTURE_SUGGESTION' | 'NEXT' | 'COMPLETED';

type Book = {
  id: string;
  title: string;
  author?: string | null;
  status: BookStatus;
  recommenderId?: string | null;
  completedAt?: string | null;
  recommender?: {
    displayName?: string | null;
  } | null;
};

type MemberProfile = {
  id: string;
  displayName?: string | null;
  email?: string | null;
};

type CurrentProfile = {
  id?: string;
  displayName?: string | null;
  isAdmin?: boolean;
};

export default function Recommendations({ profile }: { profile: CurrentProfile | null }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [title, setTitle] = useState('');
  const [previousTitle, setPreviousTitle] = useState('');
  const [previousAuthor, setPreviousAuthor] = useState('');
  const [previousRecommenderId, setPreviousRecommenderId] = useState('');
  const [previousCompletedAt, setPreviousCompletedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [previousLoading, setPreviousLoading] = useState(false);

  const fetchBooks = async () => {
    const res = await fetch(apiPath('/api/books'));
    if (res.ok) {
      setBooks(await res.json());
    }
  };

  const fetchProfiles = async () => {
    const res = await fetch(apiPath('/api/profiles'));
    if (res.ok) {
      setProfiles(await res.json());
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchBooks();
  }, []);

  useEffect(() => {
    if (profile?.isAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchProfiles();
    }
  }, [profile?.isAdmin]);

  const suggestions = books.filter(book => book.status === 'FUTURE_SUGGESTION');
  const completedBooks = books.filter(book => book.status === 'COMPLETED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const res = await fetch(apiPath('/api/books'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        recommenderId: profile?.id
      })
    });

    if (res.ok) {
      setTitle('');
      await fetchBooks();
    } else {
      alert("Failed to add recommendation.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this recommendation?')) return;
    const res = await fetch(apiPath('/api/books'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId: profile?.id, isAdmin: profile?.isAdmin })
    });
    if (res.ok) {
      await fetchBooks();
    } else {
      alert("Failed to delete recommendation.");
    }
  };

  const handleStatusChange = async (id: string, status: 'NEXT' | 'COMPLETED') => {
    const message = status === 'NEXT'
      ? 'Make this the next book? The current next book will move to previous books.'
      : 'Move this book to previous books?';
    if (!confirm(message)) return;

    const res = await fetch(apiPath('/api/books'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, userId: profile?.id, isAdmin: profile?.isAdmin })
    });

    if (res.ok) {
      await fetchBooks();
    } else {
      alert("Failed to update book.");
    }
  };

  const handlePreviousSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previousTitle.trim() || !profile?.isAdmin) return;

    setPreviousLoading(true);
    const res = await fetch(apiPath('/api/books'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: previousTitle.trim(),
        author: previousAuthor.trim() || undefined,
        recommenderId: previousRecommenderId || undefined,
        completedAt: previousCompletedAt || undefined,
        status: 'COMPLETED',
        userId: profile?.id,
        isAdmin: profile?.isAdmin,
      })
    });

    if (res.ok) {
      setPreviousTitle('');
      setPreviousAuthor('');
      setPreviousRecommenderId('');
      setPreviousCompletedAt('');
      await fetchBooks();
    } else {
      alert("Failed to add previous book.");
    }
    setPreviousLoading(false);
  };

  return (
    <div className="mt-12 p-6 border-2 border-border rounded-3xl bg-background shadow-xl space-y-10">
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-2">Community Recommendations</h2>
        <p className="text-muted-foreground text-sm mb-6">Looking for our next read? Drop a title below!</p>
      
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={profile?.displayName ? "Enter a book title..." : "Set a display name above to recommend!"}
            className="flex-1 border-2 border-border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all disabled:opacity-50"
            disabled={loading || !profile?.displayName}
          />
          <button
            type="submit"
            disabled={loading || !profile?.displayName}
            className="bg-primary text-primary-foreground px-6 font-bold rounded-xl shadow-lg hover:opacity-90 disabled:bg-gray-400 transition-all active:scale-95"
          >
            {loading ? 'Adding...' : 'Recommend'}
          </button>
        </form>

        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 italic">No recommendations yet. Be the first!</p>
          ) : (
            suggestions.map(rec => (
              <div key={rec.id} className="p-4 rounded-xl border border-border bg-secondary flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-bold text-lg text-foreground leading-tight">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {rec.author ? `by ${rec.author}` : <span className="italic">Unknown Author</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm border bg-background px-3 py-1 rounded-full text-muted-foreground shadow-sm flex-shrink-0">
                    Recommended by <span className="font-bold text-foreground">{rec.recommender?.displayName || 'Unknown'}</span>
                  </div>
                  {profile?.isAdmin && (
                    <>
                      <button onClick={() => handleStatusChange(rec.id, 'NEXT')} className="text-sm font-bold bg-background border border-border px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        Make Next
                      </button>
                      <button onClick={() => handleStatusChange(rec.id, 'COMPLETED')} className="text-sm font-bold bg-background border border-border px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                        Mark Read
                      </button>
                    </>
                  )}
                  {(profile?.isAdmin || profile?.id === rec.recommenderId) && (
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remove Recommendation"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-foreground mb-4">Previous Books</h2>
        {profile?.isAdmin && (
          <form onSubmit={handlePreviousSubmit} className="mb-6 rounded-xl border border-border bg-secondary p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={previousTitle}
                onChange={e => setPreviousTitle(e.target.value)}
                placeholder="Book title"
                className="border-2 border-border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background"
                disabled={previousLoading}
              />
              <input
                type="text"
                value={previousAuthor}
                onChange={e => setPreviousAuthor(e.target.value)}
                placeholder="Author"
                className="border-2 border-border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background"
                disabled={previousLoading}
              />
              <select
                value={previousRecommenderId}
                onChange={e => setPreviousRecommenderId(e.target.value)}
                className="border-2 border-border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background"
                disabled={previousLoading}
              >
                <option value="">Unknown recommender</option>
                {profiles.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.displayName || member.email || 'Unnamed member'}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={previousCompletedAt}
                onChange={e => setPreviousCompletedAt(e.target.value)}
                className="border-2 border-border p-3 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background"
                disabled={previousLoading}
              />
            </div>
            <button
              type="submit"
              disabled={previousLoading || !previousTitle.trim()}
              className="bg-primary text-primary-foreground px-5 py-3 font-bold rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
            >
              {previousLoading ? 'Adding...' : 'Add Previous Book'}
            </button>
          </form>
        )}
        {completedBooks.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 italic">No completed books have been recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-bold">Book</th>
                  <th className="px-4 py-3 font-bold">Recommended By</th>
                  <th className="px-4 py-3 font-bold">Completed</th>
                  {profile?.isAdmin && <th className="px-4 py-3 font-bold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {completedBooks.map(book => (
                  <tr key={book.id}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{book.title}</div>
                      <div className="text-muted-foreground">{book.author || 'Unknown Author'}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{book.recommender?.displayName || 'Unknown'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {book.completedAt ? new Date(book.completedAt).toLocaleDateString() : 'Recorded'}
                    </td>
                    {profile?.isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Remove Previous Book"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
