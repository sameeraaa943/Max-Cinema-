import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const tmdbRouter = Router();
tmdbRouter.use(requireAuth);

const TMDB_BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tmdbFetch(path: string): Promise<any> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('TMDB_API_KEY not configured in environment');

  const url = `${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB request failed: ${resp.status}`);
  return resp.json();
}

function posterUrl(path: string | null, size = 'w500') {
  return path ? `${TMDB_IMAGE}/${size}${path}` : null;
}

// GET /api/admin/tmdb/search/movies?q=query
tmdbRouter.get('/search/movies', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, page = '1' } = req.query as Record<string, string>;
    if (!q) { res.status(400).json({ success: false, error: 'Search query required' }); return; }

    const data = await tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&page=${page}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (data.results || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      originalTitle: m.original_title,
      overview: m.overview,
      posterUrl: posterUrl(m.poster_path),
      backdropUrl: posterUrl(m.backdrop_path, 'original'),
      releaseDate: m.release_date,
      rating: m.vote_average,
      language: m.original_language,
    }));

    res.json({ success: true, data: { results, totalResults: data.total_results, page: data.page } });
  } catch (err) {
    console.error('[TMDB] Search movies error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'TMDB search failed' });
  }
});

// GET /api/admin/tmdb/search/tv?q=query
tmdbRouter.get('/search/tv', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, page = '1' } = req.query as Record<string, string>;
    if (!q) { res.status(400).json({ success: false, error: 'Search query required' }); return; }

    const data = await tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}&page=${page}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (data.results || []).map((t: any) => ({
      id: t.id,
      title: t.name,
      originalTitle: t.original_name,
      overview: t.overview,
      posterUrl: posterUrl(t.poster_path),
      backdropUrl: posterUrl(t.backdrop_path, 'original'),
      firstAirDate: t.first_air_date,
      rating: t.vote_average,
      language: t.original_language,
    }));

    res.json({ success: true, data: { results, totalResults: data.total_results, page: data.page } });
  } catch (err) {
    console.error('[TMDB] Search TV error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'TMDB search failed' });
  }
});

// GET /api/admin/tmdb/movies/:tmdbId — full details
tmdbRouter.get('/movies/:tmdbId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tmdbId = Array.isArray(req.params.tmdbId) ? req.params.tmdbId[0] : req.params.tmdbId;
    const [details, genres] = await Promise.all([
      tmdbFetch(`/movie/${tmdbId}?append_to_response=credits,videos`),
      prisma.genre.findMany(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const director = details.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cast = details.credits?.cast?.slice(0, 10).map((c: any) => c.name) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trailerKey = details.videos?.results?.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')?.key;
    const country = details.production_countries?.[0]?.iso_3166_1;

    const genreIds: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const tmdbGenre of (details.genres || [])) {
      const localGenre = genres.find((g) => g.tmdbId === tmdbGenre.id || g.name.toLowerCase() === tmdbGenre.name.toLowerCase());
      if (localGenre) genreIds.push(localGenre.id);
    }

    res.json({
      success: true,
      data: {
        tmdbId: details.id,
        title: details.title,
        originalTitle: details.original_title,
        description: details.overview,
        posterUrl: posterUrl(details.poster_path),
        backdropUrl: posterUrl(details.backdrop_path, 'original'),
        releaseDate: details.release_date,
        runtime: details.runtime,
        rating: details.vote_average,
        imdbId: details.imdb_id,
        director,
        cast,
        language: details.original_language,
        country,
        trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
        genreIds,
        tmdbGenres: details.genres,
      },
    });
  } catch (err) {
    console.error('[TMDB] Movie details error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'TMDB fetch failed' });
  }
});

// GET /api/admin/tmdb/tv/:tmdbId — full details
tmdbRouter.get('/tv/:tmdbId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tmdbId = Array.isArray(req.params.tmdbId) ? req.params.tmdbId[0] : req.params.tmdbId;
    const [details, genres] = await Promise.all([
      tmdbFetch(`/tv/${tmdbId}?append_to_response=credits,videos`),
      prisma.genre.findMany(),
    ]);

    const creator = details.created_by?.[0]?.name;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cast = details.credits?.cast?.slice(0, 10).map((c: any) => c.name) || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trailerKey = details.videos?.results?.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer')?.key;
    const country = details.origin_country?.[0];

    const genreIds: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const tmdbGenre of (details.genres || [])) {
      const localGenre = genres.find((g) => g.tmdbId === tmdbGenre.id || g.name.toLowerCase() === tmdbGenre.name.toLowerCase());
      if (localGenre) genreIds.push(localGenre.id);
    }

    const tvStatusMap: Record<string, string> = {
      'Returning Series': 'RETURNING',
      'Ended': 'ENDED',
      'Canceled': 'CANCELED',
      'In Production': 'UPCOMING',
    };

    res.json({
      success: true,
      data: {
        tmdbId: details.id,
        title: details.name,
        originalTitle: details.original_name,
        description: details.overview,
        posterUrl: posterUrl(details.poster_path),
        backdropUrl: posterUrl(details.backdrop_path, 'original'),
        firstAirDate: details.first_air_date,
        lastAirDate: details.last_air_date,
        rating: details.vote_average,
        creator,
        cast,
        language: details.original_language,
        country,
        trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
        tvStatus: tvStatusMap[details.status] || 'RETURNING',
        genreIds,
        tmdbGenres: details.genres,
      },
    });
  } catch (err) {
    console.error('[TMDB] TV details error:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'TMDB fetch failed' });
  }
});
