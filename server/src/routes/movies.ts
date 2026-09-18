import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ContentStatus } from '@prisma/client';

export const moviesRouter = Router();
moviesRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

// GET /api/admin/movies
moviesRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search, genre, year, rating, featured, trending, status,
      page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (status) where.status = status as ContentStatus;
    if (featured === 'true') where.featured = true;
    if (trending === 'true') where.trending = true;
    if (genre) where.genres = { some: { genre: { slug: genre } } };
    if (year) where.releaseDate = { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year)+1}-01-01`) };
    if (rating) where.rating = { gte: Number(rating) };

    const [items, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: { genres: { include: { genre: true } } },
      }),
      prisma.movie.count({ where }),
    ]);

    const movies = items.map((m) => ({
      ...m,
      genres: m.genres.map((mg) => mg.genre),
    }));

    res.json({
      success: true,
      data: { items: movies, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error('[Movies] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch movies' });
  }
});

// GET /api/admin/movies/:id
moviesRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: { genres: { include: { genre: true } } },
    });
    if (!movie) { res.status(404).json({ success: false, error: 'Movie not found' }); return; }
    res.json({ success: true, data: { ...movie, genres: movie.genres.map((mg) => mg.genre) } });
  } catch (err) {
    console.error('[Movies] Get error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch movie' });
  }
});

// POST /api/admin/movies
moviesRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genreIds, cast, tags, releaseDate, ...rest } = req.body;

    // Check TMDB duplicate
    if (rest.tmdbId) {
      const exists = await prisma.movie.findFirst({ where: { tmdbId: rest.tmdbId } });
      if (exists) {
        res.status(409).json({ success: false, error: `A movie with TMDB ID ${rest.tmdbId} already exists`, data: exists });
        return;
      }
    }

    const movie = await prisma.movie.create({
      data: {
        ...rest,
        cast: Array.isArray(cast) ? cast : (cast ? String(cast).split(',').map((c: string) => c.trim()) : []),
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()) : []),
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        genres: genreIds?.length ? {
          create: genreIds.map((gid: string) => ({ genreId: gid })),
        } : undefined,
      },
      include: { genres: { include: { genre: true } } },
    });

    await createAuditLog(req, 'CREATE', 'Movie', movie.id);
    res.status(201).json({ success: true, data: { ...movie, genres: movie.genres.map((mg) => mg.genre) } });
  } catch (err) {
    console.error('[Movies] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create movie' });
  }
});

// PUT /api/admin/movies/:id
moviesRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const { genreIds, cast, tags, releaseDate, ...rest } = req.body;

    const data: Record<string, unknown> = { ...rest };
    if (cast !== undefined) data.cast = Array.isArray(cast) ? cast : String(cast).split(',').map((c: string) => c.trim());
    if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim());
    if (releaseDate !== undefined) data.releaseDate = releaseDate ? new Date(releaseDate) : null;

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        ...data,
        ...(genreIds !== undefined && {
          genres: {
            deleteMany: {},
            create: genreIds.map((gid: string) => ({ genreId: gid })),
          },
        }),
      },
      include: { genres: { include: { genre: true } } },
    });

    await createAuditLog(req, 'UPDATE', 'Movie', movie.id);
    res.json({ success: true, data: { ...movie, genres: movie.genres.map((mg) => mg.genre) } });
  } catch (err) {
    console.error('[Movies] Update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update movie' });
  }
});

// DELETE /api/admin/movies/:id
moviesRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.movie.delete({ where: { id } });
    await createAuditLog(req, 'DELETE', 'Movie', id);
    res.json({ success: true, message: 'Movie deleted' });
  } catch (err) {
    console.error('[Movies] Delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete movie' });
  }
});

// PATCH /api/admin/movies/:id/toggle-featured
moviesRouter.patch('/:id/toggle-featured', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const movie = await prisma.movie.findUnique({ where: { id }, select: { featured: true } });
    if (!movie) { res.status(404).json({ success: false, error: 'Movie not found' }); return; }
    const updated = await prisma.movie.update({ where: { id }, data: { featured: !movie.featured } });
    await createAuditLog(req, updated.featured ? 'ADD_FEATURED' : 'REMOVE_FEATURED', 'Movie', id);
    res.json({ success: true, data: { featured: updated.featured } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle featured' });
  }
});

// PATCH /api/admin/movies/:id/toggle-trending
moviesRouter.patch('/:id/toggle-trending', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const movie = await prisma.movie.findUnique({ where: { id }, select: { trending: true } });
    if (!movie) { res.status(404).json({ success: false, error: 'Movie not found' }); return; }
    const updated = await prisma.movie.update({ where: { id }, data: { trending: !movie.trending } });
    await createAuditLog(req, updated.trending ? 'ADD_TRENDING' : 'REMOVE_TRENDING', 'Movie', id);
    res.json({ success: true, data: { trending: updated.trending } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle trending' });
  }
});

// Helper
async function createAuditLog(req: AuthRequest, action: string, resourceType: string, resourceId: string) {
  if (!req.admin) return;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  await prisma.auditLog.create({
    data: { adminId: req.admin.id, adminEmail: req.admin.email, action, resourceType, resourceId, ipAddress: ip },
  }).catch(() => {});
}
