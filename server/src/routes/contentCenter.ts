import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const contentCenterRouter = Router();
contentCenterRouter.use(requireAuth);

// GET /api/admin/content-center/health
contentCenterRouter.get('/health', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalMovies,
      totalTVShows,
      missingPosterMovies,
      missingPosterTV,
      missingBackdropMovies,
      missingBackdropTV,
      missingTrailerMovies,
      missingTrailerTV,
      missingDescMovies,
      missingDescTV,
      moviesWithoutGenres,
      tvWithoutGenres,
    ] = await Promise.all([
      prisma.movie.count(),
      prisma.tVShow.count(),
      prisma.movie.count({ where: { OR: [{ posterUrl: null }, { posterUrl: '' }] } }),
      prisma.tVShow.count({ where: { OR: [{ posterUrl: null }, { posterUrl: '' }] } }),
      prisma.movie.count({ where: { OR: [{ backdropUrl: null }, { backdropUrl: '' }] } }),
      prisma.tVShow.count({ where: { OR: [{ backdropUrl: null }, { backdropUrl: '' }] } }),
      prisma.movie.count({ where: { OR: [{ trailerUrl: null }, { trailerUrl: '' }] } }),
      prisma.tVShow.count({ where: { OR: [{ trailerUrl: null }, { trailerUrl: '' }] } }),
      prisma.movie.count({ where: { OR: [{ description: null }, { description: '' }] } }),
      prisma.tVShow.count({ where: { OR: [{ description: null }, { description: '' }] } }),
      prisma.movie.count({ where: { genres: { none: {} } } }),
      prisma.tVShow.count({ where: { genres: { none: {} } } }),
    ]);

    const totalTitles = totalMovies + totalTVShows;
    const totalMissingBackdrop = missingBackdropMovies + missingBackdropTV;
    const totalMissingTrailer = missingTrailerMovies + missingTrailerTV;
    const totalMissingPoster = missingPosterMovies + missingPosterTV;
    const totalMissingDesc = missingDescMovies + missingDescTV;
    const totalNoGenres = moviesWithoutGenres + tvWithoutGenres;

    // Approximate complete items that have poster, backdrop, and description
    const completeMovies = await prisma.movie.count({
      where: {
        AND: [
          { posterUrl: { not: null } },
          { backdropUrl: { not: null } },
          { description: { not: null } },
        ],
      },
    });

    const completeScore = totalTitles > 0 ? Math.round((completeMovies / totalTitles) * 100) : 100;

    res.json({
      success: true,
      data: {
        totalMovies,
        totalTVShows,
        totalTitles,
        completeTitles: completeMovies,
        healthScore: completeScore,
        issues: {
          missingBackdrop: totalMissingBackdrop,
          missingTrailer: totalMissingTrailer,
          missingPoster: totalMissingPoster,
          missingDescription: totalMissingDesc,
          missingGenres: totalNoGenres,
          possibleDuplicates: 0,
        },
      },
    });
  } catch (err) {
    console.error('[Content Center] Health error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate content health' });
  }
});

// GET /api/admin/content-center/issues
contentCenterRouter.get('/issues', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type = 'missing_backdrop', page = '1', limit = '20' } = req.query as { type?: string; page?: string; limit?: string };
    const skip = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let movieWhere: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tvWhere: any = {};

    switch (type) {
      case 'missing_backdrop':
        movieWhere = { OR: [{ backdropUrl: null }, { backdropUrl: '' }] };
        tvWhere = { OR: [{ backdropUrl: null }, { backdropUrl: '' }] };
        break;
      case 'missing_poster':
        movieWhere = { OR: [{ posterUrl: null }, { posterUrl: '' }] };
        tvWhere = { OR: [{ posterUrl: null }, { posterUrl: '' }] };
        break;
      case 'missing_trailer':
        movieWhere = { OR: [{ trailerUrl: null }, { trailerUrl: '' }] };
        tvWhere = { OR: [{ trailerUrl: null }, { trailerUrl: '' }] };
        break;
      case 'missing_description':
        movieWhere = { OR: [{ description: null }, { description: '' }] };
        tvWhere = { OR: [{ description: null }, { description: '' }] };
        break;
      case 'missing_genres':
        movieWhere = { genres: { none: {} } };
        tvWhere = { genres: { none: {} } };
        break;
      default:
        movieWhere = { OR: [{ backdropUrl: null }, { backdropUrl: '' }] };
        tvWhere = { OR: [{ backdropUrl: null }, { backdropUrl: '' }] };
    }

    const [movies, tvShows] = await Promise.all([
      prisma.movie.findMany({
        where: movieWhere,
        take: Number(limit),
        skip,
        select: { id: true, title: true, posterUrl: true, rating: true, status: true, releaseDate: true, tmdbId: true },
      }),
      prisma.tVShow.findMany({
        where: tvWhere,
        take: Number(limit),
        skip,
        select: { id: true, title: true, posterUrl: true, rating: true, status: true, firstAirDate: true, tmdbId: true },
      }),
    ]);

    const results = [
      ...movies.map((m) => ({ ...m, contentType: 'MOVIE' as const })),
      ...tvShows.map((s) => ({ ...s, contentType: 'TV_SHOW' as const })),
    ].slice(0, Number(limit));

    res.json({
      success: true,
      data: {
        items: results,
        type,
        page: Number(page),
      },
    });
  } catch (err) {
    console.error('[Content Center] Issues error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch content issues' });
  }
});

