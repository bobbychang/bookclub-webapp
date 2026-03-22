'use client';
import { useState, useEffect } from 'react';

export default function Recommendations({ profile }: { profile: any }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    const res = await fetch('/bookclub/api/recommendations');
    if (res.ok) {
      setRecommendations(await res.json());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const res = await fetch('/bookclub/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        recommenderId: profile.id
      })
    });

    if (res.ok) {
      setTitle('');
      await fetchRecommendations();
    } else {
      alert("Failed to add recommendation.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this recommendation?')) return;
    const res = await fetch('/bookclub/api/recommendations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId: profile.id, isAdmin: profile.isAdmin })
    });
    if (res.ok) {
      await fetchRecommendations();
    } else {
      alert("Failed to delete recommendation.");
    }
  };

  return (
    <div className="mt-12 p-6 border-2 border-gray-100 rounded-3xl bg-white shadow-xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Community Recommendations</h2>
      <p className="text-gray-500 text-sm mb-6">Looking for our next read? Drop a title below!</p>
      
      <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter a book title..."
          className="flex-1 border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-black text-white px-6 font-bold rounded-xl shadow-lg hover:bg-gray-800 disabled:bg-gray-400 transition-all active:scale-95"
        >
          {loading ? 'Adding...' : 'Recommend'}
        </button>
      </form>

      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <p className="text-gray-400 text-center py-6 italic">No recommendations yet. Be the first!</p>
        ) : (
          recommendations.map(rec => (
            <div key={rec.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-bold text-lg text-gray-900 leading-tight">{rec.title}</h3>
                <p className="text-sm text-gray-600">
                  {rec.author ? `by ${rec.author}` : <span className="italic">Unknown Author</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm border bg-white px-3 py-1 rounded-full text-gray-500 shadow-sm flex-shrink-0">
                  Recommended by <span className="font-bold text-gray-700">{rec.recommender?.displayName || 'Unknown'}</span>
                </div>
                {(profile.isAdmin || profile.id === rec.recommenderId) && (
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
    </div>
  );
}
