import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

// GET /api/admin/analytics?period=7d|30d|90d|1y
analyticsRouter.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = ((_req.query.period as string) || '7d');
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1d': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const where = { createdAt: { gte: startDate } };

    const [
      totalPageViews,
      movieViews,
      tvViews,
      searches,
      topMoviesRaw,
      topTVRaw,
      topSearchesRaw,
      recentEvents,
    ] = await Promise.all([
      prisma.analyticsEvent.count({ where: { ...where, eventType: 'page_view' } }),
      prisma.analyticsEvent.count({ where: { ...where, eventType: 'movie_view' } }),
      prisma.analyticsEvent.count({ where: { ...where, eventType: 'tv_show_view' } }),
      prisma.analyticsEvent.count({ where: { ...where, eventType: 'search' } }),
      // Top movies by view count
      prisma.analyticsEvent.groupBy({
        by: ['movieId'],
        where: { ...where, eventType: 'movie_view', movieId: { not: null } },
        _count: { movieId: true },
        orderBy: { _count: { movieId: 'desc' } },
        take: 10,
      }),
      // Top TV shows
      prisma.analyticsEvent.groupBy({
        by: ['tvShowId'],
        where: { ...where, eventType: 'tv_show_view', tvShowId: { not: null } },
        _count: { tvShowId: true },
        orderBy: { _count: { tvShowId: 'desc' } },
        take: 10,
      }),
      // Top searches
      prisma.analyticsEvent.groupBy({
        by: ['searchQuery'],
        where: { ...where, eventType: 'search', searchQuery: { not: null } },
        _count: { searchQuery: true },
        orderBy: { _count: { searchQuery: 'desc' } },
        take: 10,
      }),
      // Recent events for chart grouping
      prisma.analyticsEvent.findMany({
        where,
        select: { eventType: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Resolve top movie IDs to titles
    const topMovieIds = topMoviesRaw.map((r) => r.movieId!).filter(Boolean);
    const topMovies = topMovieIds.length
      ? await prisma.movie.findMany({ where: { id: { in: topMovieIds } }, select: { id: true, title: true, posterUrl: true } })
      : [];

    const topTVIds = topTVRaw.map((r) => r.tvShowId!).filter(Boolean);
    const topTV = topTVIds.length
      ? await prisma.tVShow.findMany({ where: { id: { in: topTVIds } }, select: { id: true, title: true, posterUrl: true } })
      : [];

    // Build chart data
    const chartData = buildChartData(recentEvents, startDate, now, period);

    // Unique visitor estimate (session-based)
    const uniqueSessions = await prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: { ...where, sessionId: { not: null } },
    });

    res.json({
      success: true,
      data: {
        period,
        totalPageViews,
        uniqueVisitors: uniqueSessions.length,
        movieViews,
        tvViews,
        searches,
        chartData,
        topMovies: topMoviesRaw.map((r) => {
          const movie = topMovies.find((m) => m.id === r.movieId);
          return { id: r.movieId, title: movie?.title || 'Unknown', posterUrl: movie?.posterUrl, views: r._count.movieId };
        }),
        topTVShows: topTVRaw.map((r) => {
          const show = topTV.find((t) => t.id === r.tvShowId);
          return { id: r.tvShowId, title: show?.title || 'Unknown', posterUrl: show?.posterUrl, views: r._count.tvShowId };
        }),
        topSearches: topSearchesRaw.map((r) => ({ query: r.searchQuery, count: r._count.searchQuery })),
      },
    });
  } catch (err) {
    console.error('[Analytics] Get error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

function buildChartData(
  events: { eventType: string; createdAt: Date }[],
  startDate: Date,
  endDate: Date,
  period: string
) {
  const buckets: Record<string, { label: string; pageViews: number; movieViews: number; tvViews: number; searches: number }> = {};
  const isDaily = ['1d', '7d'].includes(period);

  for (const event of events) {
    const date = new Date(event.createdAt);
    const key = isDaily
      ? date.toISOString().slice(0, 10)
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = isDaily
      ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!buckets[key]) buckets[key] = { label, pageViews: 0, movieViews: 0, tvViews: 0, searches: 0 };

    if (event.eventType === 'page_view') buckets[key].pageViews++;
    else if (event.eventType === 'movie_view') buckets[key].movieViews++;
    else if (event.eventType === 'tv_show_view') buckets[key].tvViews++;
    else if (event.eventType === 'search') buckets[key].searches++;
  }

  return Object.values(buckets);
}

