import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Save,
  Search,
  Sparkles,
  Tv,
  Star,
  Check,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { tvShowsApi, tmdbApi, settingsApi } from '../../services/api';
import { Genre } from '../../types';

const tvShowFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  originalTitle: z.string().optional(),
  description: z.string().optional(),
  posterUrl: z.string().optional(),
  backdropUrl: z.string().optional(),
  firstAirDate: z.string().optional(),
  lastAirDate: z.string().optional(),
  rating: z.coerce.number().min(0).max(10).optional(),
  imdbId: z.string().optional(),
  tmdbId: z.coerce.number().optional(),
  creator: z.string().optional(),
  cast: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  trailerUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']),
  tvStatus: z.enum(['RETURNING', 'ENDED', 'CANCELED', 'UPCOMING']),
  featured: z.boolean(),
  trending: z.boolean(),
  tags: z.string().optional(),
  genreIds: z.array(z.string()),
});

type TVShowFormData = z.infer<typeof tvShowFormSchema>;

export default function TVShowForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tmdbQuery, setTmdbQuery] = useState('');
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [showTmdbDropdown, setShowTmdbDropdown] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { data: genresData } = useQuery({
    queryKey: ['genres'],
    queryFn: () => settingsApi.getGenres(),
  });
  const genres: Genre[] = genresData?.data?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TVShowFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tvShowFormSchema) as any,
    defaultValues: {
      title: '',
      originalTitle: '',
      description: '',
      posterUrl: '',
      backdropUrl: '',
      firstAirDate: '',
      lastAirDate: '',
      rating: 8.0,
      imdbId: '',
      tmdbId: undefined,
      creator: '',
      cast: '',
      language: 'en',
      country: 'US',
      trailerUrl: '',
      status: 'ACTIVE',
      tvStatus: 'RETURNING',
      featured: false,
      trending: false,
      tags: '',
      genreIds: [],
    },
  });

  const { data: existingShowData, isLoading: isLoadingShow } = useQuery({
    queryKey: ['tv-show', id],
    queryFn: () => (id ? tvShowsApi.get(id) : null),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingShowData?.data?.data) {
      const s = existingShowData.data.data;
      reset({
        title: s.title || '',
        originalTitle: s.originalTitle || '',
        description: s.description || '',
        posterUrl: s.posterUrl || '',
        backdropUrl: s.backdropUrl || '',
        firstAirDate: s.firstAirDate ? s.firstAirDate.split('T')[0] : '',
        lastAirDate: s.lastAirDate ? s.lastAirDate.split('T')[0] : '',
        rating: s.rating || undefined,
        imdbId: s.imdbId || '',
        tmdbId: s.tmdbId || undefined,
        creator: s.creator || '',
        cast: Array.isArray(s.cast) ? s.cast.join(', ') : s.cast || '',
        language: s.language || 'en',
        country: s.country || 'US',
        trailerUrl: s.trailerUrl || '',
        status: s.status || 'ACTIVE',
        tvStatus: s.tvStatus || 'RETURNING',
        featured: s.featured || false,
        trending: s.trending || false,
        tags: Array.isArray(s.tags) ? s.tags.join(', ') : s.tags || '',
        genreIds: s.genres ? s.genres.map((g: Genre) => g.id) : [],
      });
    }
  }, [existingShowData, reset]);

  const watchedPosterUrl = watch('posterUrl');
  const watchedTitle = watch('title');
  const watchedRating = watch('rating');

  const handleSearchTmdb = async () => {
    if (!tmdbQuery.trim()) return;
    setIsSearchingTmdb(true);
    try {
      const resp = await tmdbApi.searchTV(tmdbQuery);
      if (resp.data.success) {
        setTmdbResults(resp.data.data.results || []);
        setShowTmdbDropdown(true);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'TMDB TV search failed.');
    } finally {
      setIsSearchingTmdb(false);
    }
  };

  const handleSelectTmdb = async (tmdbId: number) => {
    setIsImporting(true);
    setShowTmdbDropdown(false);
    try {
      const resp = await tmdbApi.getTVDetails(tmdbId);
      if (resp.data.success && resp.data.data) {
        const d = resp.data.data;
        setValue('title', d.title || '');
        setValue('originalTitle', d.originalTitle || '');
        setValue('description', d.description || '');
        setValue('posterUrl', d.posterUrl || '');
        setValue('backdropUrl', d.backdropUrl || '');
        setValue('firstAirDate', d.firstAirDate ? d.firstAirDate.split('T')[0] : '');
        setValue('lastAirDate', d.lastAirDate ? d.lastAirDate.split('T')[0] : '');
        setValue('rating', d.rating ? Number(d.rating.toFixed(1)) : undefined);
        setValue('tmdbId', d.tmdbId || tmdbId);
        setValue('creator', d.creator || '');
        setValue('cast', Array.isArray(d.cast) ? d.cast.join(', ') : '');
        setValue('language', d.language || 'en');
        setValue('country', d.country || '');
        setValue('trailerUrl', d.trailerUrl || '');
        if (d.tvStatus) setValue('tvStatus', d.tvStatus);
        if (d.genreIds && Array.isArray(d.genreIds)) setValue('genreIds', d.genreIds);
        toast.success(`Imported "${d.title}" from TMDB!`);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any).response?.data?.error || 'Failed to import series');
    } finally {
      setIsImporting(false);
    }
  };

  const onSubmit = async (data: TVShowFormData) => {
    try {
      if (isEdit && id) {
        await tvShowsApi.update(id, data);
        toast.success('TV Show updated');
      } else {
        await tvShowsApi.create(data);
        toast.success('TV Show created');
      }
      queryClient.invalidateQueries({ queryKey: ['tv-shows'] });
      navigate('/tv-shows');
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = (err as any).response?.data?.error || 'Failed to save TV Show';
      toast.error(msg);
    }
  };

  if (isEdit && isLoadingShow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#242424', borderTopColor: '#D4AF37' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/tv-shows" className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white font-cinzel">
              {isEdit ? 'Edit TV Show' : 'Add New TV Show'}
            </h1>
            <p className="text-xs text-muted">
              {isEdit ? 'Update television series metadata' : 'Search TMDB or input series manually'}
            </p>
          </div>
        </div>
      </div>

      {/* TMDB Quick Import Bar */}
      <div
        className="rounded-xl p-4 relative"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(18,18,18,0.9) 100%)',
          border: '1px solid rgba(59,130,246,0.3)',
        }}
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-blue-400">
          <Sparkles size={14} />
          <span>TMDB Television Import Engine</span>
        </div>
        <p className="text-xs text-muted mb-3">
          Search the TMDB database to import television series, season air dates, creators, and cast.
        </p>

        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search series (e.g. Breaking Bad, Stranger Things, Succession)..."
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
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
            style={{
              backgroundColor: '#2563eb',
              color: '#FFFFFF',
            }}
          >
            {isSearchingTmdb ? (
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={14} />
            )}
            <span>Search TMDB</span>
          </button>
        </div>

        {showTmdbDropdown && (
          <div
            className="absolute left-4 right-4 top-full mt-2 rounded-xl overflow-hidden z-30 max-h-80 overflow-y-auto dropdown-animate"
            style={{ backgroundColor: '#121212', border: '1px solid #242424', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
          >
            <div className="p-3 border-b border-[#242424] flex items-center justify-between text-xs">
              <span className="font-semibold text-muted">TMDB Results ({tmdbResults.length})</span>
              <button type="button" onClick={() => setShowTmdbDropdown(false)} className="text-muted hover:text-white">
                Close
              </button>
            </div>
            {tmdbResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">No series found for "{tmdbQuery}".</div>
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
                        <Tv size={14} className="m-auto text-muted mt-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-xs text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                        <span>{item.firstAirDate ? item.firstAirDate.split('-')[0] : '—'}</span>
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
                      className="px-2.5 py-1.5 rounded text-[11px] font-semibold text-blue-400 border border-blue-400/30 hover:bg-blue-400/10"
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
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Tv size={16} style={{ color: '#60a5fa' }} />
              <span>Series Information</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">
                Series Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g. Breaking Bad"
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: errors.title ? '1px solid #ef4444' : '1px solid #242424', color: '#FFFFFF' }}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Original Title</label>
              <input
                type="text"
                {...register('originalTitle')}
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Synopsis / Overview</label>
              <textarea
                rows={4}
                {...register('description')}
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>First Air Date</span>
                </label>
                <input
                  type="date"
                  {...register('firstAirDate')}
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5 flex items-center gap-1">
                  <Calendar size={12} />
                  <span>Last Air Date</span>
                </label>
                <input
                  type="date"
                  {...register('lastAirDate')}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Creator / Showrunner</label>
                <input
                  type="text"
                  {...register('creator')}
                  placeholder="Vince Gilligan"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Cast</label>
                <input
                  type="text"
                  {...register('cast')}
                  placeholder="Bryan Cranston, Aaron Paul"
                  className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                  style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ImageIcon size={16} style={{ color: '#60a5fa' }} />
              <span>Media Assets</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Poster Image URL</label>
              <input
                type="text"
                {...register('posterUrl')}
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Backdrop Banner URL</label>
              <input
                type="text"
                {...register('backdropUrl')}
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Trailer URL (YouTube)</label>
              <input
                type="text"
                {...register('trailerUrl')}
                className="w-full px-3.5 py-2 rounded-lg text-xs focus:outline-none"
                style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}
              />
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
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
                          if (isSelected) field.onChange(field.value.filter((gid: string) => gid !== genre.id));
                          else field.onChange([...field.value, genre.id]);
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all"
                        style={{
                          backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : '#0D0D0D',
                          color: isSelected ? '#60a5fa' : '#8A8A8A',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid #242424',
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

        <div className="space-y-6">
          <div className="rounded-xl p-5 card-hover" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Poster Preview</h3>
            <div
              className="w-full aspect-[2/3] rounded-lg overflow-hidden flex items-center justify-center relative"
              style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424' }}
            >
              {watchedPosterUrl ? (
                <img src={watchedPosterUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <Tv size={32} className="mx-auto text-muted/30 mb-2" />
                  <span className="text-xs text-muted">Enter poster URL above</span>
                </div>
              )}
              {watchedRating && (
                <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md flex items-center gap-1 font-bold text-xs bg-black/80 text-amber-400 border border-amber-400/30">
                  <Star size={11} fill="#facc15" />
                  <span>{watchedRating}</span>
                </div>
              )}
            </div>
            <div className="mt-3 font-semibold text-sm text-white truncate">{watchedTitle || 'Untitled Series'}</div>
          </div>

          <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: '#121212', border: '1px solid #242424' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Publishing Options</h3>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Catalog Status</label>
              <select {...register('status')} className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}>
                <option value="ACTIVE">Active (Live)</option>
                <option value="DRAFT">Draft</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Series Lifecycle State</label>
              <select {...register('tvStatus')} className="w-full px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }}>
                <option value="RETURNING">Returning Series</option>
                <option value="ENDED">Ended</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#1f1f1f]">
              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Star size={13} style={{ color: '#D4AF37' }} />
                  <span>Showcase as Featured</span>
                </span>
                <input type="checkbox" {...register('featured')} className="rounded" style={{ accentColor: '#D4AF37' }} />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-xs">
                <span className="font-medium text-white flex items-center gap-1.5">
                  <Star size={13} style={{ color: '#ef4444' }} />
                  <span>Mark as Trending</span>
                </span>
                <input type="checkbox" {...register('trending')} className="rounded" style={{ accentColor: '#ef4444' }} />
              </label>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#1f1f1f]">
              <div>
                <label className="block text-xs text-muted mb-1">TMDB ID</label>
                <input type="number" {...register('tmdbId')} className="w-full px-3 py-1.5 rounded text-xs font-mono" style={{ backgroundColor: '#0D0D0D', border: '1px solid #242424', color: '#FFFFFF' }} />
              </div>
            </div>

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
                <Save size={15} />
                <span>{isEdit ? 'Save Changes' : 'Create TV Show'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

