import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const featuredRouter = Router();
featuredRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

// GET /api/admin/featured
featuredRouter.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.featuredItem.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        movie: { select: { id: true, title: true, posterUrl: true, rating: true, releaseDate: true, genres: { include: { genre: true } } } },
        tvShow: { select: { id: true, title: true, posterUrl: true, rating: true, firstAirDate: true, genres: { include: { genre: true } } } },
      },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch featured items' });
  }
});

// POST /api/admin/featured
featuredRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contentType, movieId, tvShowId } = req.body;
    if (!contentType || (!movieId && !tvShowId)) {
      res.status(400).json({ success: false, error: 'contentType and content ID required' });
      return;
    }

    // Check for duplicate
    const existing = await prisma.featuredItem.findFirst({
      where: movieId ? { movieId } : { tvShowId },
    });
    if (existing) {
      res.status(409).json({ success: false, error: 'Content is already featured' });
      return;
    }

    const count = await prisma.featuredItem.count();
    const item = await prisma.featuredItem.create({
      data: { contentType, movieId: movieId || null, tvShowId: tvShowId || null, displayOrder: count },
      include: {
        movie: { select: { id: true, title: true, posterUrl: true, rating: true } },
        tvShow: { select: { id: true, title: true, posterUrl: true, rating: true } },
      },
    });

    await auditLog(req, 'ADD_FEATURED', 'FeaturedItem', item.id);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('[Featured] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to add featured item' });
  }
});

// PUT /api/admin/featured/reorder
featuredRouter.put('/reorder', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, error: 'orderedIds array required' });
      return;
    }
    await Promise.all(
      orderedIds.map((id, index) =>
        prisma.featuredItem.update({ where: { id }, data: { displayOrder: index } })
      )
    );
    await auditLog(req, 'REORDER_FEATURED', 'FeaturedItem');
    res.json({ success: true, message: 'Featured items reordered' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reorder featured items' });
  }
});

// PATCH /api/admin/featured/:id/toggle
featuredRouter.patch('/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const item = await prisma.featuredItem.findUnique({ where: { id }, select: { enabled: true } });
    if (!item) { res.status(404).json({ success: false, error: 'Featured item not found' }); return; }
    const updated = await prisma.featuredItem.update({ where: { id }, data: { enabled: !item.enabled } });
    res.json({ success: true, data: { enabled: updated.enabled } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle featured item' });
  }
});

// DELETE /api/admin/featured/:id
featuredRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.featuredItem.delete({ where: { id } });
    await auditLog(req, 'REMOVE_FEATURED', 'FeaturedItem', id);
    res.json({ success: true, message: 'Featured item removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove featured item' });
  }
});

async function auditLog(req: AuthRequest, action: string, resourceType: string, resourceId?: string) {
  if (!req.admin) return;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  await prisma.auditLog.create({ data: { adminId: req.admin.id, adminEmail: req.admin.email, action, resourceType, resourceId, ipAddress: ip } }).catch(() => {});
}

