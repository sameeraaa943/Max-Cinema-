// File: src/pages/recommendations/index.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, Search, Sparkles, Film, Loader2 } from 'lucide-react';
import { recommendationsApi, moviesApi } from '../../services/api';

const cardStyle: React.CSSProperties = { background: '#121212', border: '1px solid #242424', borderRadius: 12, padding: 24 };
const inputStyle: React.CSSProperties = {
  background: '#0a0a0a', border: '1px solid #242424', borderRadius: 8, color: '#fff',
  padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%',
};

export default function RecommendationsPage() {
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');

  const { data: moviesData, isLoading: loadingMovies } = useQuery({
    queryKey: ['movies-rec-selector'],
    queryFn: () => moviesApi.list({ limit: 50 }).then(r => r.data?.data?.movies || []),
  });

  const { data: recommendations = [], isLoading: loadingRecs } = useQuery({
    queryKey: ['recommendations', selectedMovieId],
    queryFn: () => recommendationsApi.get(selectedMovieId).then(r => r.data?.data || []),
    enabled: !!selectedMovieId,
  });

  const movies: any[] = moviesData || [];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <GitBranch size={28} color="#D4AF37" />
        <div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, fontFamily: 'Cinzel, serif' }}>Smart Recommendations Engine</h1>
          <p style={{ color: '#8A8A8A', fontSize: 13, marginTop: 2 }}>Content similarity and viewing behavior algorithms</p>
        </div>
      </div>

      <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Sparkles size={20} color="#D4AF37" />
        <div style={{ fontSize: 13, color: '#D4AF37' }}>
          <strong>Public API Endpoint:</strong> <code>GET /api/public/recommendations/:contentId</code> — Powered by TF-IDF genre clustering and director correlations.
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <label style={{ color: '#8A8A8A', fontSize: 12, display: 'block', marginBottom: 8 }}>Select a Movie to Test Recommendations</label>
        <select
          style={inputStyle}
          value={selectedMovieId}
          onChange={e => setSelectedMovieId(e.target.value)}
        >
          <option value="">-- Choose a movie --</option>
          {movies.map((m: any) => (
            <option key={m.id} value={m.id}>{m.title} ({m.rating || 'N/A'} ★)</option>
          ))}
        </select>
      </div>

      {loadingRecs && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <Loader2 size={32} color="#D4AF37" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {!loadingRecs && selectedMovieId && recommendations.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#8A8A8A' }}>
          <Film size={40} color="#242424" style={{ margin: '0 auto 12px' }} />
          <p>No similar content found for this title.</p>
        </div>
      )}

      {!loadingRecs && recommendations.length > 0 && (
        <div>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recommended Similar Titles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {recommendations.map((item: any) => (
              <div key={item.id} style={{ background: '#121212', border: '1px solid #242424', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ height: 260, background: '#1a1a1a', overflow: 'hidden' }}>
                  {item.posterUrl ? (
                    <img src={item.posterUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Film size={32} color="#242424" />
                    </div>
                  )}
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ color: '#D4AF37', fontSize: 11, marginTop: 2 }}>{item.rating || 'N/A'} ★</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
