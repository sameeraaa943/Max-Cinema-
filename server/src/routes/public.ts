import { Router, Response, Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { prisma } from '../lib/prisma';

export const publicRouter = Router();

// Rate limit public API more generously
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
publicRouter.use(publicLimiter);

// POST /api/public/analytics/event — analytics tracker endpoint
publicRouter.post('/analytics/event', async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, contentId, contentType, searchQuery, sessionId, metadata } = req.body;

    if (!event) { res.status(400).json({ success: false, error: 'Event type required' }); return; }

    const validEvents = ['page_view', 'movie_view', 'tv_show_view', 'search', 'featured_click', 'trending_click', 'trailer_click', 'collection_view'];
    if (!validEvents.includes(event)) { res.status(400).json({ success: false, error: 'Invalid event type' }); return; }

    let movieId: string | null = null;
    let tvShowId: string | null = null;

    if (contentId && contentType === 'movie') {
      const movie = await prisma.movie.findFirst({ where: { id: contentId }, select: { id: true } });
      if (movie) movieId = movie.id;
    } else if (contentId && contentType === 'tv_show') {
      const show = await prisma.tVShow.findFirst({ where: { id: contentId }, select: { id: true } });
      if (show) tvShowId = show.id;
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType: event,
        contentId,
        contentType: contentType === 'movie' ? 'MOVIE' : contentType === 'tv_show' ? 'TV_SHOW' : undefined,
        movieId,
        tvShowId,
        searchQuery: searchQuery ? String(searchQuery).slice(0, 200) : null,
        sessionId: sessionId ? String(sessionId) : null,
        metadata: metadata ? (metadata as Parameters<typeof prisma.analyticsEvent.create>[0]['data']['metadata']) : undefined,
        userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 500) : null,
      },
    });

    // Increment view count
    if (event === 'movie_view' && movieId) {
      await prisma.movie.update({ where: { id: movieId }, data: { viewCount: { increment: 1 } } });
    } else if (event === 'tv_show_view' && tvShowId) {
      await prisma.tVShow.update({ where: { id: tvShowId }, data: { viewCount: { increment: 1 } } });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Public Analytics] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to record event' });
  }
});

// GET /api/public/movies
publicRouter.get('/movies', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', genre, featured, trending, search } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: 'ACTIVE' };
    if (genre) where.genres = { some: { genre: { slug: genre } } };
    if (featured === 'true') where.featured = true;
    if (trending === 'true') where.trending = true;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.movie.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.count({ where }),
    ]);

    const movies = items.map((m) => ({
      id: m.id,
      title: m.title,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      releaseDate: m.releaseDate,
      rating: m.rating,
      runtime: m.runtime,
      featured: m.featured,
      trending: m.trending,
      viewCount: m.viewCount,
      genres: m.genres.map((mg) => mg.genre),
    }));

    res.json({ success: true, data: { items: movies, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch movies' });
  }
});

// GET /api/public/movies/:id
publicRouter.get('/movies/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const movie = await prisma.movie.findFirst({
      where: { id, status: 'ACTIVE' },
      include: { genres: { include: { genre: true } } },
    });
    if (!movie) { res.status(404).json({ success: false, error: 'Movie not found' }); return; }
    res.json({ success: true, data: { ...movie, genres: movie.genres.map((mg) => mg.genre) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch movie' });
  }
});

// GET /api/public/tv-shows
publicRouter.get('/tv-shows', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', genre, featured, trending, search } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { status: 'ACTIVE' };
    if (genre) where.genres = { some: { genre: { slug: genre } } };
    if (featured === 'true') where.featured = true;
    if (trending === 'true') where.trending = true;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.tVShow.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        include: { genres: { include: { genre: true } } },
      }),
      prisma.tVShow.count({ where }),
    ]);

    const shows = items.map((s) => ({
      id: s.id,
      title: s.title,
      posterUrl: s.posterUrl,
      backdropUrl: s.backdropUrl,
      firstAirDate: s.firstAirDate,
      rating: s.rating,
      featured: s.featured,
      trending: s.trending,
      viewCount: s.viewCount,
      tvStatus: s.tvStatus,
      genres: s.genres.map((sg) => sg.genre),
    }));

    res.json({ success: true, data: { items: shows, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch TV shows' });
  }
});

// GET /api/public/tv-shows/:id
publicRouter.get('/tv-shows/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const show = await prisma.tVShow.findFirst({
      where: { id, status: 'ACTIVE' },
      include: { genres: { include: { genre: true } } },
    });
    if (!show) { res.status(404).json({ success: false, error: 'TV show not found' }); return; }
    res.json({ success: true, data: { ...show, genres: show.genres.map((sg) => sg.genre) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch TV show' });
  }
});

// GET /api/public/featured
publicRouter.get('/featured', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.featuredItem.findMany({
      where: { enabled: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        movie: { select: { id: true, title: true, description: true, posterUrl: true, backdropUrl: true, rating: true, releaseDate: true, trailerUrl: true } },
        tvShow: { select: { id: true, title: true, description: true, posterUrl: true, backdropUrl: true, rating: true, firstAirDate: true, trailerUrl: true } },
      },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch featured' });
  }
});

// GET /api/public/trending
publicRouter.get('/trending', async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.trendingItem.findMany({
      where: { enabled: true },
      orderBy: { rank: 'asc' },
      include: {
        movie: { select: { id: true, title: true, posterUrl: true, backdropUrl: true, rating: true } },
        tvShow: { select: { id: true, title: true, posterUrl: true, backdropUrl: true, rating: true } },
      },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch trending' });
  }
});

// GET /api/public/collections
publicRouter.get('/collections', async (_req: Request, res: Response): Promise<void> => {
  try {
    const collections = await prisma.collection.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    res.json({ success: true, data: collections.map((c) => ({ ...c, itemCount: c._count.items })) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch collections' });
  }
});

// GET /api/public/collections/:slug
publicRouter.get('/collections/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const collection = await prisma.collection.findFirst({
      where: { slug, visibility: 'PUBLIC' },
      include: {
        items: {
          orderBy: { displayOrder: 'asc' },
          include: {
            movie: { select: { id: true, title: true, posterUrl: true, rating: true } },
            tvShow: { select: { id: true, title: true, posterUrl: true, rating: true } },
          },
        },
      },
    });
    if (!collection) { res.status(404).json({ success: false, error: 'Collection not found' }); return; }
    res.json({ success: true, data: { ...collection, itemCount: collection.items.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch collection' });
  }
});

// GET /api/public/homepage
publicRouter.get('/homepage', async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await prisma.homepageConfig.findFirst({
      include: {
        sections: { where: { enabled: true }, orderBy: { displayOrder: 'asc' } },
        heroMovie: { select: { id: true, title: true, description: true, backdropUrl: true, posterUrl: true, trailerUrl: true, rating: true } },
        heroTvShow: { select: { id: true, title: true, description: true, backdropUrl: true, posterUrl: true, trailerUrl: true, rating: true } },
      },
    });
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch homepage config' });
  }
});

// GET /api/public/genres
publicRouter.get('/genres', async (_req: Request, res: Response): Promise<void> => {
  try {
    const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: genres });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch genres' });
  }
});

// GET /api/public/ads?placement=HOMEPAGE
publicRouter.get('/ads', async (req: Request, res: Response): Promise<void> => {
  try {
    const { placement, device } = req.query as Record<string, string>;
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      enabled: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    };
    if (placement) where.placement = placement;
    if (device) where.deviceTarget = { in: ['ALL', device.toUpperCase()] };

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { priority: 'desc' },
      select: { id: true, name: true, placement: true, adCode: true, deviceTarget: true },
    });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch ads' });
  }
});
