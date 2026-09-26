import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ContentStatus } from '@prisma/client';

export const moviesRouter = Router();
moviesRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

// GET /api/admin/movies/export — Export movies as JSON
moviesRouter.get('/export', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { format = 'json' } = req.query as { format?: string };
    const movies = await prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
      include: { genres: { include: { genre: true } } },
    });

    const exportData = movies.map((m) => ({
      id: m.id,
      title: m.title,
      originalTitle: m.originalTitle,
      description: m.description,
      releaseDate: m.releaseDate ? m.releaseDate.toISOString().split('T')[0] : null,
      runtime: m.runtime,
      rating: m.rating,
      imdbId: m.imdbId,
      tmdbId: m.tmdbId,
      director: m.director,
      cast: m.cast,
      language: m.language,
      country: m.country,
      status: m.status,
      featured: m.featured,
      trending: m.trending,
      posterUrl: m.posterUrl,
      backdropUrl: m.backdropUrl,
      trailerUrl: m.trailerUrl,
      genres: m.genres.map((g) => g.genre.name),
    }));

    if (format === 'csv') {
      const headers = ['id', 'title', 'releaseDate', 'rating', 'runtime', 'status', 'featured', 'trending', 'genres'];
      const rows = exportData.map((m) => [
        m.id,
        `"${m.title.replace(/"/g, '""')}"`,
        m.releaseDate || '',
        m.rating || '',
        m.runtime || '',
        m.status,
        m.featured ? 'true' : 'false',
        m.trending ? 'true' : 'false',
        `"${m.genres.join(', ')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="cinescope-movies.csv"');
      res.send(csv);
      return;
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="cinescope-movies.json"');
    res.json({ success: true, count: exportData.length, data: exportData });
  } catch (err) {
    console.error('[Movies Export] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to export movies' });
  }
});

// POST /api/admin/movies/import — Bulk JSON import
moviesRouter.post('/import', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movies } = req.body as { movies: Array<Record<string, any>> };
    if (!Array.isArray(movies) || movies.length === 0) {
      res.status(400).json({ success: false, error: 'movies array is required' });
      return;
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const item of movies) {
      if (!item.title) {
        skippedCount++;
        continue;
      }

      // Check if already exists by tmdbId or title
      let existing = null;
      if (item.tmdbId) {
        existing = await prisma.movie.findFirst({ where: { tmdbId: Number(item.tmdbId) } });
      }
      if (!existing && item.title) {
        existing = await prisma.movie.findFirst({ where: { title: item.title } });
      }

      if (existing) {
        skippedCount++;
        continue;
      }

      await prisma.movie.create({
        data: {
          title: item.title,
          originalTitle: item.originalTitle || null,
          description: item.description || null,
          posterUrl: item.posterUrl || null,
          backdropUrl: item.backdropUrl || null,
          releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
          runtime: item.runtime ? Number(item.runtime) : null,
          rating: item.rating ? Number(item.rating) : null,
          imdbId: item.imdbId || null,
          tmdbId: item.tmdbId ? Number(item.tmdbId) : null,
          director: item.director || null,
          cast: Array.isArray(item.cast) ? item.cast : [],
          language: item.language || 'English',
          country: item.country || null,
          trailerUrl: item.trailerUrl || null,
          videoUrl: item.videoUrl || null,
          status: 'PUBLISHED',
          featured: Boolean(item.featured),
          trending: Boolean(item.trending),
        },
      });
      importedCount++;
    }

    await createAuditLog(req, 'IMPORT', 'Movie', `${importedCount} movies imported`);
    res.json({ success: true, imported: importedCount, skipped: skippedCount });
  } catch (err) {
    console.error('[Movies Import] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to import movies' });
  }
});

// POST /api/admin/movies/bulk-action — Bulk operations (publish, archive, feature, delete, etc.)
moviesRouter.post('/bulk-action', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids, action } = req.body as { ids: string[]; action: string };
    if (!Array.isArray(ids) || ids.length === 0 || !action) {
      res.status(400).json({ success: false, error: 'ids array and action are required' });
      return;
    }

    let updatedCount = 0;

    switch (action) {
      case 'publish':
        await prisma.movie.updateMany({ where: { id: { in: ids } }, data: { status: 'PUBLISHED' } });
        updatedCount = ids.length;
        break;
      case 'draft':
        await prisma.movie.updateMany({ where: { id: { in: ids } }, data: { status: 'DRAFT' } });
        updatedCount = ids.length;
        break;
      case 'archive':
        await prisma.movie.updateMany({ where: { id: { in: ids } }, data: { status: 'ARCHIVED' } });
        updatedCount = ids.length;
        break;
      case 'feature':
        await prisma.movie.updateMany({ where: { id: { in: ids } }, data: { featured: true } });
        for (const id of ids) {
          const exists = await prisma.featuredItem.findFirst({ where: { movieId: id } });
          if (!exists) {
            const count = await prisma.featuredItem.count();
            await prisma.featuredItem.create({ data: { contentType: 'MOVIE', movieId: id, displayOrder: count } });
          }
        }
        updatedCount = ids.length;
        break;
      case 'unfeature':
        await prisma.movie.updateMany({ where: { id: { in: ids } }, data: { featured: false } });
        await prisma.featuredItem.deleteMany({ where: { movieId: { in: ids } } });
        updatedCount = ids.length;
        break;
      case 'trending':
        await prisma.movie.updateMany({ where: { id: { in: ids } }, data: { trending: true } });
        for (const id of ids) {
          const exists = await prisma.trendingItem.findFirst({ where: { movieId: id } });
          if (!exists) {
            const count = await prisma.trendingItem.count();
            await prisma.trendingItem.create({ data: { contentType: 'MOVIE', movieId: id, rank: count, trendingScore: 95 } });
          }
        }
        updatedCount = ids.length;
        break;
      case 'untrending':
        await prisma.movie.updateMany({ where: { id: { in: ids } }, data: { trending: false } });
        await prisma.trendingItem.deleteMany({ where: { movieId: { in: ids } } });
        updatedCount = ids.length;
        break;
      case 'delete':
        await prisma.movie.deleteMany({ where: { id: { in: ids } } });
        updatedCount = ids.length;
        break;
      default:
        res.status(400).json({ success: false, error: `Invalid action: ${action}` });
        return;
    }

    await createAuditLog(req, 'BULK_' + action.toUpperCase(), 'Movie', `${updatedCount} movies modified`);
    res.json({ success: true, count: updatedCount, message: `Bulk action '${action}' applied to ${updatedCount} movies` });
  } catch (err) {
    console.error('[Movies Bulk] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to apply bulk action' });
  }
});

// GET /api/admin/movies
moviesRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search, genre, year, rating, featured, trending, status,
      missingPoster, missingBackdrop, missingTrailer,
      page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (status && status !== 'ALL') where.status = status as ContentStatus;
    if (featured === 'true') where.featured = true;
    if (trending === 'true') where.trending = true;
    if (genre) where.genres = { some: { genre: { slug: genre } } };
    if (year) where.releaseDate = { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year)+1}-01-01`) };
    if (rating) where.rating = { gte: Number(rating) };

    // V3 Quality Filter flags
    if (missingPoster === 'true') where.posterUrl = null;
    if (missingBackdrop === 'true') where.backdropUrl = null;
    if (missingTrailer === 'true') where.trailerUrl = null;

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

    if (!movie) {
      res.status(404).json({ success: false, error: 'Movie not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        ...movie,
        genres: movie.genres.map((mg) => mg.genre),
      },
    });
  } catch (err) {
    console.error('[Movies] Get error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch movie' });
  }
});

// POST /api/admin/movies
moviesRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { genreIds, cast, tags, releaseDate, ...rest } = req.body;

    if (rest.tmdbId) {
      const exists = await prisma.movie.findFirst({ where: { tmdbId: rest.tmdbId } });
      if (exists) {
        res.status(409).json({ success: false, error: `A movie with TMDB ID ${rest.tmdbId} already exists: "${exists.title}"`, data: exists });
        return;
      }
    }

    const movie = await prisma.movie.create({
      data: {
        ...rest,
        cast: Array.isArray(cast) ? cast : (cast ? String(cast).split(',').map((c: string) => c.trim()) : []),
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()) : []),
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        genres: genreIds?.length
          ? { create: genreIds.map((gid: string) => ({ genreId: gid })) }
          : undefined,
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
