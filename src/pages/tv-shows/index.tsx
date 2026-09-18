import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Tv,
  Plus,
  Search,
  Star,
  TrendingUp,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { tvShowsApi, settingsApi } from '../../services/api';
import { TVShow, Genre } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function TVShowsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTvStatus, setSelectedTvStatus] = useState('');
  const [filterFeatured, setFilterFeatured] = useState<boolean | undefined>(undefined);
  const [filterTrending, setFilterTrending] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 15;

  const [deleteShowId, setDeleteShowId] = useState<string | null>(null);
  const [deleteShowTitle, setDeleteShowTitle] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => settingsApi.getGenres(),
  });
  const genres: Genre[] = genresData?.data?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: [
      'tv-shows',
      { page, limit, search, genre: selectedGenre, status: selectedStatus, tvStatus: selectedTvStatus, featured: filterFeatured, trending: filterTrending },
    ],
    queryFn: () =>
      tvShowsApi.list({
        page,
        limit,
        search: search || undefined,
        genre: selectedGenre || undefined,
        status: selectedStatus || undefined,
        tvStatus: selectedTvStatus || undefined,
        featured: filterFeatured !== undefined ? filterFeatured : undefined,
        trending: filterTrending !== undefined ? filterTrending : undefined,
      }),
  });

  const shows: TVShow[] = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  const toggleFeaturedMutation = useMutation({
    mutationFn: (id: string) => tvShowsApi.toggleFeatured(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-shows'] });
      toast.success('Featured status updated');
    },
    onError: () => toast.error('Failed to update featured status'),
  });

  const toggleTrendingMutation = useMutation({
    mutationFn: (id: string) => tvShowsApi.toggleTrending(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-shows'] });
      toast.success('Trending status updated');
    },
    onError: () => toast.error('Failed to update trending status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tvShowsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tv-shows'] });
      toast.success('TV show deleted');
      setDeleteShowId(null);
    },
    onError: () => toast.error('Failed to delete TV show'),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">TV Shows</h1>
          <p className="text-xs text-muted mt-1">
            Manage episodic series, returning seasons, and television showcases
          </p>
        </div>

        <Link
          to="/tv-shows/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
            color: '#070707',
          }}
        >
          <Plus size={16} />
          <span>Add TV Show</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search series by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs transition-colors focus:outline-none"
            style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
          />
        </div>

        <select
          value={selectedGenre}
          onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs focus:outline-none"
          style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g.id} value={g.slug}>{g.name}</option>
          ))}
        </select>

        <select
          value={selectedTvStatus}
          onChange={(e) => { setSelectedTvStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs focus:outline-none"
          style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
        >
          <option value="">All Series States</option>
          <option value="RETURNING">Returning Series</option>
          <option value="ENDED">Ended</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="CANCELED">Canceled</option>
        </select>

        <button
          onClick={() => {
            setFilterFeatured((prev) => (prev === true ? undefined : true));
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          style={{
            backgroundColor: filterFeatured ? 'rgba(212,175,55,0.15)' : '#0D0D0D',
            color: filterFeatured ? '#D4AF37' : '#8A8A8A',
            border: filterFeatured ? '1px solid #D4AF37' : '1px solid #242424',
          }}
        >
          <Star size={13} fill={filterFeatured ? '#D4AF37' : 'none'} />
          <span>Featured</span>
        </button>

        <button
          onClick={() => {
            setFilterTrending((prev) => (prev === true ? undefined : true));
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          style={{
            backgroundColor: filterTrending ? 'rgba(239,68,68,0.15)' : '#0D0D0D',
            color: filterTrending ? '#f87171' : '#8A8A8A',
            border: filterTrending ? '1px solid #ef4444' : '1px solid #242424',
          }}
        >
          <TrendingUp size={13} />
          <span>Trending</span>
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton lines={6} height="40px" />
          </div>
        ) : shows.length === 0 ? (
          <EmptyState
            title="No TV shows found"
            description={search ? `No series matching "${search}".` : 'Your TV show catalog is currently empty.'}
            icon={Tv}
            action={{
              label: 'Add First TV Show',
              onClick: () => navigate('/tv-shows/new'),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-[#242424]" style={{ backgroundColor: '#0D0D0D' }}>
                  <th className="py-3.5 px-4">Poster</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">First Aired</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Series State</th>
                  <th className="py-3.5 px-4">Genres</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Trending</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f] text-xs">
                {shows.map((show) => {
                  const airYear = show.firstAirDate
                    ? new Date(show.firstAirDate).getFullYear()
                    : '—';

                  return (
                    <tr key={show.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4">
                        <div
                          className="w-10 h-14 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a' }}
                        >
                          {show.posterUrl ? (
                            <img
                              src={show.posterUrl}
                              alt={show.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Tv size={16} className="text-muted/50" />
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-medium text-white max-w-xs">
                        <div className="truncate font-semibold">{show.title}</div>
                        {show.creator && (
                          <span className="text-[10px] text-muted block">by {show.creator}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-muted font-mono">{airYear}</td>

                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-white">
                            {show.rating ? show.rating.toFixed(1) : '—'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4">
                        <StatusBadge status={show.tvStatus} />
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {show.genres?.slice(0, 2).map((g) => (
                            <span
                              key={g.id}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: '#1a1a1a', color: '#8A8A8A', border: '1px solid #242424' }}
                            >
                              {g.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => toggleFeaturedMutation.mutate(show.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Star
                            size={16}
                            style={{
                              color: show.featured ? '#D4AF37' : '#666666',
                              fill: show.featured ? '#D4AF37' : 'none',
                            }}
                          />
                        </button>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => toggleTrendingMutation.mutate(show.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <TrendingUp
                            size={16}
                            style={{
                              color: show.trending ? '#ef4444' : '#666666',
                            }}
                          />
                        </button>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/tv-shows/${show.id}/edit`)}
                            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteShowId(show.id);
                              setDeleteShowTitle(show.title);
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-[#242424] text-xs text-muted"
            style={{ backgroundColor: '#0D0D0D' }}
          >
            <span>Showing {shows.length} of {total} shows</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-[#242424] disabled:opacity-30 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded border border-[#242424] disabled:opacity-30 hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteShowId}
        title="Delete TV Show"
        message={`Are you sure you want to permanently delete "${deleteShowTitle}"?`}
        confirmLabel="Delete TV Show"
        danger={true}
        onConfirm={() => deleteShowId && deleteMutation.mutate(deleteShowId)}
        onCancel={() => setDeleteShowId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
