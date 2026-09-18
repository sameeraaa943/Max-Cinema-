import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ContentStatus, TVStatus } from '@prisma/client';

export const tvShowsRouter = Router();
tvShowsRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

// GET /api/admin/tv-shows
tvShowsRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search, genre, year, featured, trending, status, tvStatus,
      page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (status) where.status = status as ContentStatus;
    if (tvStatus) where.tvStatus = tvStatus as TVStatus;
    if (featured === 'true') where.featured = true;
    if (trending === 'true') where.trending = true;
    if (genre) where.genres = { some: { genre: { slug: genre } } };
    if (year) where.firstAirDate = { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year)+1}-01-01`) };

    const [items, total] = await Promise.all([
      prisma.tVShow.findMany({
        where, skip, take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: { genres: { include: { genre: true } } },
      }),
      prisma.tVShow.count({ where }),
    ]);

    const shows = items.map((s) => ({
      ...s,
      genres: s.genres.map((sg) => sg.genre),
    }));

    res.json({
      success: true,
      data: {
        items: shows,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[TVShows] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch TV shows' });
  }
});

// GET /api/admin/tv-shows/:id
tvShowsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const show = await prisma.tVShow.findUnique({
      where: { id },
      include: { genres: { include: { genre: true } } },
    });
    if (!show) { res.status(404).json({ success: false, error: 'TV show not found' }); return; }
    res.json({ success: true, data: { ...show, genres: show.genres.map((sg) => sg.genre) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch TV show' });
  }
});

// POST /api/admin/tv-shows
tvShowsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genreIds, cast, tags, firstAirDate, lastAirDate, ...rest } = req.body;

    if (rest.tmdbId) {
      const exists = await prisma.tVShow.findFirst({ where: { tmdbId: rest.tmdbId } });
      if (exists) {
        res.status(409).json({ success: false, error: `A TV show with TMDB ID ${rest.tmdbId} already exists`, data: exists });
        return;
      }
    }

    const show = await prisma.tVShow.create({
      data: {
        ...rest,
        cast: Array.isArray(cast) ? cast : (cast ? String(cast).split(',').map((c: string) => c.trim()) : []),
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()) : []),
        firstAirDate: firstAirDate ? new Date(firstAirDate) : undefined,
        lastAirDate: lastAirDate ? new Date(lastAirDate) : undefined,
        genres: genreIds?.length ? { create: genreIds.map((gid: string) => ({ genreId: gid })) } : undefined,
      },
      include: { genres: { include: { genre: true } } },
    });
    await createAuditLog(req, 'CREATE', 'TVShow', show.id);
    res.status(201).json({ success: true, data: { ...show, genres: show.genres.map((sg) => sg.genre) } });
  } catch (err) {
    console.error('[TVShows] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create TV show' });
  }
});

// PUT /api/admin/tv-shows/:id
tvShowsRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const { genreIds, cast, tags, firstAirDate, lastAirDate, ...rest } = req.body;
    const data: Record<string, unknown> = { ...rest };
    if (cast !== undefined) data.cast = Array.isArray(cast) ? cast : String(cast).split(',').map((c: string) => c.trim());
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim());
    if (firstAirDate !== undefined) data.firstAirDate = firstAirDate ? new Date(firstAirDate) : null;
    if (lastAirDate !== undefined) data.lastAirDate = lastAirDate ? new Date(lastAirDate) : null;

    const show = await prisma.tVShow.update({
      where: { id },
      data: {
        ...data,
        ...(genreIds !== undefined && { genres: { deleteMany: {}, create: genreIds.map((gid: string) => ({ genreId: gid })) } }),
      },
      include: { genres: { include: { genre: true } } },
    });
    await createAuditLog(req, 'UPDATE', 'TVShow', show.id);
    res.json({ success: true, data: { ...show, genres: show.genres.map((sg) => sg.genre) } });
  } catch (err) {
    console.error('[TVShows] Update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update TV show' });
  }
});

// DELETE /api/admin/tv-shows/:id
tvShowsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.tVShow.delete({ where: { id } });
    await createAuditLog(req, 'DELETE', 'TVShow', id);
    res.json({ success: true, message: 'TV show deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete TV show' });
  }
});

// PATCH /:id/toggle-featured
tvShowsRouter.patch('/:id/toggle-featured', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const show = await prisma.tVShow.findUnique({ where: { id }, select: { featured: true } });
    if (!show) { res.status(404).json({ success: false, error: 'TV show not found' }); return; }
    const updated = await prisma.tVShow.update({ where: { id }, data: { featured: !show.featured } });
    await createAuditLog(req, updated.featured ? 'ADD_FEATURED' : 'REMOVE_FEATURED', 'TVShow', id);
    res.json({ success: true, data: { featured: updated.featured } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle featured' });
  }
});

// PATCH /:id/toggle-trending
tvShowsRouter.patch('/:id/toggle-trending', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const show = await prisma.tVShow.findUnique({ where: { id }, select: { trending: true } });
    if (!show) { res.status(404).json({ success: false, error: 'TV show not found' }); return; }
    const updated = await prisma.tVShow.update({ where: { id }, data: { trending: !show.trending } });
    await createAuditLog(req, updated.trending ? 'ADD_TRENDING' : 'REMOVE_TRENDING', 'TVShow', id);
    res.json({ success: true, data: { trending: updated.trending } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle trending' });
  }
});

async function createAuditLog(req: AuthRequest, action: string, resourceType: string, resourceId: string) {
  if (!req.admin) return;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  await prisma.auditLog.create({ data: { adminId: req.admin.id, adminEmail: req.admin.email, action, resourceType, resourceId, ipAddress: ip } }).catch(() => {});
}
