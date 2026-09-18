import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Search,
  Sparkles,
  Film,
  Star,
  Check,
  Calendar,
  Clock,
  Globe,
  Video,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { moviesApi, tmdbApi, settingsApi } from '../../services/api';
import { Genre, MovieStatus } from '../../types';

const movieFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  originalTitle: z.string().optional(),
  description: z.string().optional(),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  releaseDate: z.string().optional(),
  runtime: z.coerce.number().optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  imdbId: z.string().optional(),
  tmdbId: z.coerce.number().optional(),
  director: z.string().optional(),
  cast: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  trailerUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']),
  featured: z.boolean(),
  trending: z.boolean(),
  tags: z.string().optional(),
  genreIds: z.array(z.string()),
});

type MovieFormData = z.infer<typeof movieFormSchema>;

export default function MovieForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TMDB search modal / state
  const [tmdbQuery, setTmdbQuery] = useState('');
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [showTmdbDropdown, setShowTmdbDropdown] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch Genres
  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => settingsApi.getGenres(),
  });
  const genres: Genre[] = genresData?.data?.data || [];

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(movieFormSchema) as any,
    defaultValues: {
      title: '',
      originalTitle: '',
      description: '',
      posterUrl: '',
      backdropUrl: '',
      releaseDate: '',
      runtime: 120,
      rating: 7.5,
      imdbId: '',
      tmdbId: undefined,
      director: '',
      cast: '',
      language: 'en',
      country: 'US',
      trailerUrl: '',
      videoUrl: '',
      status: 'ACTIVE',
      featured: false,
      trending: false,
      tags: '',
      genreIds: [],
    },
  });

  // Fetch existing movie if editing
  const { data: existingMovieData, isLoading: isLoadingMovie } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => (id ? moviesApi.get(id) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingMovieData?.data?.data) {
      const m = existingMovieData.data.data;
      reset({
        title: m.title || '',
        originalTitle: m.originalTitle || '',
        description: m.description || '',
        posterUrl: m.posterUrl || '',
        backdropUrl: m.backdropUrl || '',
        releaseDate: m.releaseDate ? m.releaseDate.split('T')[0] : '',
        runtime: m.runtime || undefined,
        rating: m.rating || undefined,
        imdbId: m.imdbId || '',
        tmdbId: m.tmdbId || undefined,
        director: m.director || '',
        cast: Array.isArray(m.cast) ? m.cast.join(', ') : m.cast || '',
        language: m.language || 'en',
        country: m.country || 'US',
        trailerUrl: m.trailerUrl || '',
        videoUrl: m.videoUrl || '',
        status: m.status || 'ACTIVE',
        featured: m.featured || false,
        trending: m.trending || false,
        tags: Array.isArray(m.tags) ? m.tags.join(', ') : m.tags || '',
        genreIds: m.genres ? m.genres.map((g: Genre) => g.id) : [],
      });
    }
  }, [existingMovieData, reset]);

  // Live poster and backdrop preview
  const watchedPosterUrl = watch('posterUrl');
  const watchedBackdropUrl = watch('backdropUrl');
  const watchedTitle = watch('title');
  const watchedRating = watch('rating');

  // TMDB search handler
  const handleSearchTmdb = async () => {
    if (!tmdbQuery.trim()) return;
    setIsSearchingTmdb(true);
    try {
      const resp = await tmdbApi.searchMovies(tmdbQuery);
      if (resp.data.success) {
        setTmdbResults(resp.data.data.results || []);
        setShowTmdbDropdown(true);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'TMDB search failed. Verify TMDB_API_KEY.');
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  // Import TMDB item
  const handleSelectTmdb = async (tmdbId: number) => {
    setIsImporting(true);
    setShowTmdbDropdown(false);
    try {
      const resp = await tmdbApi.getMovieDetails(tmdbId);
      if (resp.data.success && resp.data.data) {
        const d = resp.data.data;
        setValue('title', d.title || '');
        setValue('originalTitle', d.originalTitle || '');
        setValue('description', d.description || '');
        setValue('posterUrl', d.posterUrl || '');
        setValue('backdropUrl', d.backdropUrl || '');
        setValue('releaseDate', d.releaseDate ? d.releaseDate.split('T')[0] : '');
        setValue('runtime', d.runtime || undefined);
        setValue('rating', d.rating ? Number(d.rating.toFixed(1)) : undefined);
        setValue('imdbId', d.imdbId || '');
        setValue('tmdbId', d.tmdbId || tmdbId);
        setValue('director', d.director || '');
        setValue('cast', Array.isArray(d.cast) ? d.cast.join(', ') : '');
        setValue('language', d.language || 'en');
        setValue('country', d.country || '');
        setValue('trailerUrl', d.trailerUrl || '');
        if (d.genreIds && Array.isArray(d.genreIds)) {
          setValue('genreIds', d.genreIds);
        }
        toast.success(`Imported "${d.title}" from TMDB!`);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to import from TMDB');
    } finally {
      setIsImporting(false);
    }
  };

  // Submit
  const onSubmit = async (data: MovieFormData) => {
    try {
      if (isEdit && id) {
        await moviesApi.update(id, data);
        toast.success('Movie updated successfully');
      } else {
        await moviesApi.create(data);
        toast.success('Movie created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      navigate('/movies');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any).response?.data?.error || 'Failed to save movie';
      toast.error(msg);
    }
  };

  if (isEdit && isLoadingMovie) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#242424', borderTopColor: '#D4AF37' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/movies"
            className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white font-cinzel">
              {isEdit ? 'Edit Movie' : 'Add New Movie'}
            </h1>
            <p className="text-xs text-muted">
              {isEdit ? 'Update metadata, assets, and catalog settings' : 'Search TMDB or enter details manually'}
            </p>
          </div>
        </div>
      </div>

      {/* TMDB Quick Import Bar */}
      <div
        className="rounded-xl p-4 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(18,18,18,0.9) 100%)',
          border: '1px solid rgba(212,175,55,0.3)',
        }}
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold gold-text">
          <Sparkles size={14} style={{ color: '#D4AF37' }} />
          <span>TMDB Fast Import Engine</span>
        </div>
        <p className="text-xs text-muted mb-3">
          Search the TMDB database to automatically fetch title, posters, synopsis, release date, director, cast, and trailers.
        </p>

        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search movie title (e.g. Oppenheimer, Dune, Inception)..."
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchTmdb(); } }}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-xs transition-colors focus:outline-none"
              style={{ backgroundColor: '#070707', border: '1px solid #242424', color: '#FFFFFF' }}
            />
          </div>
          <button
            type="button"
            onClick={handleSearchTmdb}
            disabled={isSearchingTmdb || !tmdbQuery.trim()}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all btn-gold flex items-center gap-2 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
              color: '#070707',
            }}
          >
            {isSearchingTmdb ? (
              <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={14} />
            )}
            <span>Search TMDB</span>
          </button>
        </div>

        {/* TMDB Results Dropdown */}
        {showTmdbDropdown && (
          <div
            className="absolute left-4 right-4 top-full mt-2 rounded-xl overflow-hidden z-30 max-h-80 overflow-y-auto dropdown-animate"
            style={{ backgroundColor: '#121212', border: '1px solid #242424', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
          >
            <div className="p-3 border-b border-[#242424] flex items-center justify-between text-xs">
              <span className="font-semibold text-muted">TMDB Results ({tmdbResults.length})</span>
              <button
                type="button"
                onClick={() => setShowTmdbDropdown(false)}
                className="text-muted hover:text-white"
              >
                Close
              </button>
            </div>
            {tmdbResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                No movies found for "{tmdbQuery}".
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f1f]">
                {tmdbResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectTmdb(item.id)}
                    className="p-3 flex items-center gap-3 hover:bg-white/[0.04] cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-[#1f1f1f]">
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Film size={14} className="m-auto text-muted mt-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-xs text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                        <span>{item.releaseDate ? item.releaseDate.split('-')[0] : '—'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                          <Star size={10} fill="#facc15" />
                          {item.rating?.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted line-clamp-1 mt-1">{item.overview}</p>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded text-[11px] font-semibold text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"
                    >
                      Import
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Fields (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Film size={16} style={{ color: '#D4AF37' }} />
              <span>General Information</span>
            </h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Movie Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Oppenheimer"
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none transition-colors"
                style={{ backgroundColor: '#0D0D0D', border: errors.title ? '1px solid #ef4444' : '1px solid #242424', color: '#FFFFFF' }}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            {/* Original Title */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Original Title (Optional)
              </label>
              <input
                type="text"
                {...register('originalTitle')}
                placeholder="Title in original language"
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none transition-colors"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            {/* Description / Overview */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Synopsis / Description
              </label>
              <textarea
                rows={4}
                {...register('description')}
                placeholder="Enter plot summary..."
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none transition-colors"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            {/* Release Date, Runtime, Rating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Release Date</span>
                </label>
                <input
                  type="date"
                  {...register('releaseDate')}
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                  <Clock size={12} />
                  <span>Runtime (mins)</span>
                </label>
                <input
                  type="number"
                  {...register('runtime')}
                  placeholder="120"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                  <Star size={12} />
                  <span>Rating (0-10)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('rating')}
                  placeholder="8.5"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
            </div>

            {/* Director & Cast */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Director</label>
                <input
                  type="text"
                  {...register('director')}
                  placeholder="Christopher Nolan"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Cast (comma-separated)</label>
                <input
                  type="text"
                  {...register('cast')}
                  placeholder="Cillian Murphy, Emily Blunt"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>

          {/* Media & Links Card */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ImageIcon size={16} style={{ color: '#D4AF37' }} />
              <span>Media & Links</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Poster Image URL</label>
              <input
                type="text"
                {...register('posterUrl')}
                placeholder="https://image.tmdb.org/t/p/w500/..."
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Backdrop Banner URL</label>
              <input
                type="text"
                {...register('backdropUrl')}
                placeholder="https://image.tmdb.org/t/p/original/..."
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Trailer URL (YouTube)</label>
                <input
                  type="text"
                  {...register('trailerUrl')}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Video / Stream URL</label>
                <input
                  type="text"
                  {...register('videoUrl')}
                  placeholder="https://example.com/embed/..."
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>

          {/* Genres Card */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <h2 className="text-sm font-semibold text-white mb-3">Genres</h2>
            <Controller
              name="genreIds"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {genres.map((genre) => {
                    const isSelected = field.value.includes(genre.id);
                    return (
                      <button
                        type="button"
                        key={genre.id}
                        onClick={() => {
                          if (isSelected) {
                            field.onChange(field.value.filter((gid: string) => gid !== genre.id));
                          } else {
                            field.onChange([...field.value, genre.id]);
                          }
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all"
                        style={{
                          backgroundColor: isSelected ? 'rgba(212,175,55,0.15)' : '#0D0D0D',
                          color: isSelected ? '#D4AF37' : '#8A8A8A',
                          border: isSelected ? '1px solid #D4AF37' : '1px solid #242424',
                        }}
                      >
                        <span>{genre.name}</span>
                        {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </div>

        {/* Right Column: Preview & Status Settings (1 col) */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div
            className="rounded-xl p-5 card-hover"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              Poster Preview
            </h3>
            <div
              className="w-full aspect-[2/3] rounded-lg overflow-hidden flex items-center justify-center relative"
              style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424' }}
            >
              {watchedPosterUrl ? (
                <img
                  src={watchedPosterUrl}
                  alt="Poster preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center p-6">
                  <Film size={32} className="mx-auto text-muted/30 mb-2" />
                  <span className="text-xs text-muted">Enter poster URL above</span>
                </div>
              )}

              {watchedRating && (
                <div
                  className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md flex items-center gap-1 font-bold text-xs"
                  style={{ backgroundColor: 'rgba(0,0,0,0.85)', color: '#facc15', border: '1px solid rgba(212,175,55,0.3)' }}
                >
                  <Star size={11} fill="#facc15" />
                  <span>{watchedRating}</span>
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="font-semibold text-sm text-white truncate">
                {watchedTitle || 'Untitled Movie'}
              </div>
            </div>
          </div>

          {/* Visibility & Settings Card */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ backgroundColor: '#121212', border: '1px solid #242424' }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Publishing Options
            </h3>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Catalog Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              >
                <option value="ACTIVE">Active (Live on website)</option>
                <option value="DRAFT">Draft (Admin only)</option>
                <option value="INACTIVE">Inactive (Hidden)</option>
              </select>
            </div>

            {/* Featured & Trending toggles */}
            <div className="space-y-3 pt-2 border-t border-[#1f1f1f]">
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Star size={13} style={{ color: '#D4AF37' }} />
                  <span>Showcase as Featured</span>
                </span>
                <input
                  type="checkbox"
                  {...register('featured')}
                  className="rounded"
                  style={{ accentColor: '#D4AF37' }}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Star size={13} style={{ color: '#ef4444' }} />
                  <span>Mark as Trending</span>
                </span>
                <input
                  type="checkbox"
                  {...register('trending')}
                  className="rounded"
                  style={{ accentColor: '#ef4444' }}
                />
              </label>
            </div>

            {/* Identifiers */}
            <div className="space-y-3 pt-2 border-t border-[#1f1f1f]">
              <div>
                <label className="block text-xs text-muted mb-1">TMDB ID</label>
                <input
                  type="number"
                  {...register('tmdbId')}
                  placeholder="e.g. 872585"
                  className="w-full px-3 py-1.5 rounded text-xs font-mono"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">IMDb ID</label>
                <input
                  type="text"
                  {...register('imdbId')}
                  placeholder="e.g. tt15398776"
                  className="w-full px-3 py-1.5 rounded text-xs font-mono"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#242424]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg text-xs font-bold transition-all btn-gold flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 100%)',
                  color: '#070707',
                }}
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                <span>{isEdit ? 'Save Changes' : 'Create Movie'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

