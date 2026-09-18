import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Film,
  Plus,
  Search,
  Star,
  TrendingUp,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { moviesApi, settingsApi } from '../../services/api';
import { Movie, Genre } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function MoviesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & Pagination state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filterFeatured, setFilterFeatured] = useState<boolean | undefined>(undefined);
  const [filterTrending, setFilterTrending] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 15;

  // Confirm delete dialog state
  const [deleteMovieId, setDeleteMovieId] = useState<string | null>(null);
  const [deleteMovieTitle, setDeleteMovieTitle] = useState<string>('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch Genres for filter
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => settingsApi.getGenres(),
  });
  const genres: Genre[] = genresData?.data?.data || [];

  // Fetch Movies
  const { data, isLoading, isError } = useQuery({
    queryKey: ['movies', { page, limit, search, genre: selectedGenre, status: selectedStatus, featured: filterFeatured, trending: filterTrending }],
    queryFn: () =>
      moviesApi.list({
        page,
        limit,
        search: search || undefined,
        genre: selectedGenre || undefined,
        status: selectedStatus || undefined,
        featured: filterFeatured !== undefined ? filterFeatured : undefined,
        trending: filterTrending !== undefined ? filterTrending : undefined,
      }),
  });

  const movies: Movie[] = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  // Mutations
  const toggleFeaturedMutation = useMutation({
    mutationFn: (id: string) => moviesApi.toggleFeatured(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('Featured status updated');
    },
    onError: () => toast.error('Failed to update featured status'),
  });

  const toggleTrendingMutation = useMutation({
    mutationFn: (id: string) => moviesApi.toggleTrending(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('Trending status updated');
    },
    onError: () => toast.error('Failed to update trending status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => moviesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      toast.success('Movie deleted successfully');
      setDeleteMovieId(null);
    },
    onError: () => toast.error('Failed to delete movie'),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-wide">Movies Catalog</h1>
          <p className="text-xs text-muted mt-1">
            Manage movie listings, ratings, visibility, and featured showcases
          </p>
        </div>

        <Link
          to="/movies/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold transition-all self-start sm:self-auto"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
            color: '#070707',
          }}
        >
          <Plus size={16} />
          <span>Add Movie</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div
        className="rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search movies by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs transition-colors focus:outline-none"
            style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
          />
        </div>

        {/* Genre filter */}
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

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg text-xs focus:outline-none"
          style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Featured toggle filter */}
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

        {/* Trending toggle filter */}
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

      {/* Table Card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
      >
        {isLoading ? (
          <div className="p-6">
            <LoadingSkeleton lines={6} height="40px" />
          </div>
        ) : movies.length === 0 ? (
          <EmptyState
            title="No movies found"
            description={search ? `No movies matching "${search}". Try adjusting your filters.` : 'Your movie database is currently empty.'}
            icon={Film}
            action={{
              label: 'Add First Movie',
              onClick: () => navigate('/movies/new'),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-semibold text-muted uppercase tracking-wider border-b border-[#242424]" style={{ backgroundColor: '#0D0D0D' }}>
                  <th className="py-3.5 px-4">Poster</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Genres</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Featured</th>
                  <th className="py-3.5 px-4 text-center">Trending</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f] text-xs">
                {movies.map((movie) => {
                  const year = movie.releaseDate
                    ? new Date(movie.releaseDate).getFullYear()
                    : '—';

                  return (
                    <tr
                      key={movie.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Poster */}
                      <td className="py-2.5 px-4">
                        <div
                          className="w-10 h-14 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: '#1f1f1f', border: '1px solid #2a2a2a' }}
                        >
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Film size={16} className="text-muted/50" />
                          )}
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-4 font-medium text-white max-w-xs">
                        <div className="truncate font-semibold">{movie.title}</div>
                        {movie.tmdbId && (
                          <span className="text-[10px] text-muted font-mono block">
                            TMDB: #{movie.tmdbId}
                          </span>
                        )}
                      </td>

                      {/* Year */}
                      <td className="py-2.5 px-4 text-muted font-mono">{year}</td>

                      {/* Rating */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-white">
                            {movie.rating ? movie.rating.toFixed(1) : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Genres */}
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {movie.genres?.slice(0, 2).map((g) => (
                            <span
                              key={g.id}
                              className="text-[10px] px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: '#1a1a1a', color: '#8A8A8A', border: '1px solid #242424' }}
                            >
                              {g.name}
                            </span>
                          ))}
                          {(movie.genres?.length || 0) > 2 && (
                            <span className="text-[10px] text-muted">
                              +{movie.genres.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4">
                        <StatusBadge status={movie.status} />
                      </td>

                      {/* Featured toggle */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => toggleFeaturedMutation.mutate(movie.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          title={movie.featured ? 'Remove from Featured' : 'Mark as Featured'}
                        >
                          <Star
                            size={16}
                            style={{
                              color: movie.featured ? '#D4AF37' : '#666666',
                              fill: movie.featured ? '#D4AF37' : 'none',
                            }}
                          />
                        </button>
                      </td>

                      {/* Trending toggle */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => toggleTrendingMutation.mutate(movie.id)}
                          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                          title={movie.trending ? 'Remove from Trending' : 'Mark as Trending'}
                        >
                          <TrendingUp
                            size={16}
                            style={{
                              color: movie.trending ? '#ef4444' : '#666666',
                            }}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/movies/${movie.id}/edit`)}
                            className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
                            title="Edit movie"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteMovieId(movie.id);
                              setDeleteMovieTitle(movie.title);
                            }}
                            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete movie"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t border-[#242424] text-xs text-muted"
            style={{ backgroundColor: '#0D0D0D' }}
          >
            <span>
              Showing {movies.length} of {total} movies
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-[#242424] disabled:opacity-30 hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteMovieId}
        title="Delete Movie"
        message={`Are you sure you want to permanently delete "${deleteMovieTitle}"? This will remove it from the database, public website, and collections.`}
        confirmLabel="Delete Movie"
        danger={true}
        onConfirm={() => deleteMovieId && deleteMutation.mutate(deleteMovieId)}
        onCancel={() => setDeleteMovieId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
