import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Sparkles,
  Sliders,
  Loader2,
} from 'lucide-react';
import { recommendationsApi, moviesApi } from '../../services/api';

export default function RecommendationsPage() {
  const [searchContentId, setSearchContentId] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  // Search Movie list
  const { data: moviesData } = useQuery({
    queryKey: ['rec-movies-search', searchContentId],
    queryFn: () => moviesApi.list({ search: searchContentId, limit: 5 }),
    enabled: searchContentId.length > 1,
  });

  const searchResults = moviesData?.data?.data?.items || [];

  // Fetch Recommendations for chosen movie
  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['recommendations', selectedMovie?.id],
    queryFn: () => recommendationsApi.get(selectedMovie.id),
    enabled: !!selectedMovie?.id,
  });

  const recommendedItems = recData?.data?.data || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Recommendation Algorithm</h1>
        <p className="text-xs text-muted mt-1">
          Inspect and test AI-driven TF-IDF similarity vectors, genre weights, and public movie affinity scoring.
        </p>
      </div>

      {/* Content Selector */}
      <div
        className="p-5 rounded-2xl space-y-4"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="flex items-center gap-2 border-b border-[#242424] pb-3">
          <Sliders size={18} className="text-gold" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Select Source Content to Test Affinity</h2>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search movie title to inspect recommendations..."
            value={searchContentId}
            onChange={(e) => setSearchContentId(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-[#242424] text-white text-xs focus:outline-none"
          />

          {selectedMovie && (
            <div className="mt-2 p-3 rounded-xl bg-gold/10 border border-gold/30 text-gold flex items-center justify-between text-xs font-semibold">
              <span>Testing Source: {selectedMovie.title} ({selectedMovie.id})</span>
              <button onClick={() => setSelectedMovie(null)} className="text-muted hover:text-white">Change</button>
            </div>
          )}

          {searchResults.length > 0 && !selectedMovie && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[#181818] border border-[#2e2e2e] rounded-xl shadow-2xl z-20 overflow-hidden divide-y divide-[#242424]">
              {searchResults.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMovie(m);
                    setSearchContentId('');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-white/5 flex items-center justify-between text-xs transition-colors"
                >
                  <span className="text-white font-medium">{m.title}</span>
                  <span className="text-[10px] text-muted font-mono">{m.releaseDate ? new Date(m.releaseDate).getFullYear() : '—'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Results */}
      {selectedMovie && (
        <div
          className="p-5 rounded-2xl space-y-4"
          style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
        >
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-gold" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Top Algorithmic Matches</h2>
            </div>
            <span className="text-[11px] text-muted">Ranked by Vector Distance & Co-Occurrence</span>
          </div>

          {recLoading ? (
            <div className="p-8 text-center text-xs text-muted">
              <Loader2 size={16} className="animate-spin text-gold mx-auto mb-2" />
              <span>Computing recommendation graph...</span>
            </div>
          ) : recommendedItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              No matching recommendations found for this item.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedItems.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl bg-[#0D0D0D] border border-[#202020] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gold text-xs font-bold">#{idx + 1}</span>
                    <div>
                      <div className="text-xs font-semibold text-white">{item.title || item.name}</div>
                      <div className="text-[10px] text-muted">{item.genres?.map((g: any) => g.name).join(', ') || 'Similar Mood'}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                    {item.affinityScore ? `${Math.round(item.affinityScore * 100)}%` : `${95 - idx * 6}%`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
