import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const trendingRouter = Router();
trendingRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

trendingRouter.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const items = await prisma.trendingItem.findMany({
      orderBy: { rank: 'asc' },
      include: {
        movie: { select: { id: true, title: true, posterUrl: true, rating: true } },
        tvShow: { select: { id: true, title: true, posterUrl: true, rating: true } },
      },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch trending items' });
  }
});

trendingRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contentType, movieId, tvShowId, trendingScore } = req.body;
    if (!contentType || (!movieId && !tvShowId)) {
      res.status(400).json({ success: false, error: 'contentType and content ID required' });
      return;
    }
    const existing = await prisma.trendingItem.findFirst({ where: movieId ? { movieId } : { tvShowId } });
    if (existing) { res.status(409).json({ success: false, error: 'Content is already trending' }); return; }
    const count = await prisma.trendingItem.count();
    const item = await prisma.trendingItem.create({
      data: { contentType, movieId: movieId || null, tvShowId: tvShowId || null, rank: count, trendingScore: trendingScore || 0 },
      include: {
        movie: { select: { id: true, title: true, posterUrl: true, rating: true } },
        tvShow: { select: { id: true, title: true, posterUrl: true, rating: true } },
      },
    });
    await auditLog(req, 'ADD_TRENDING', 'TrendingItem', item.id);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add trending item' });
  }
});

trendingRouter.put('/reorder', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderedIds } = req.body as { orderedIds: string[] };
    if (!Array.isArray(orderedIds)) { res.status(400).json({ success: false, error: 'orderedIds array required' }); return; }
    await Promise.all(orderedIds.map((id, index) => prisma.trendingItem.update({ where: { id }, data: { rank: index } })));
    await auditLog(req, 'REORDER_TRENDING', 'TrendingItem');
    res.json({ success: true, message: 'Trending items reordered' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reorder trending items' });
  }
});

trendingRouter.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const item = await prisma.trendingItem.update({
      where: { id },
      data: { trendingScore: req.body.trendingScore, enabled: req.body.enabled },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update trending item' });
  }
});

trendingRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.trendingItem.delete({ where: { id } });
    await auditLog(req, 'REMOVE_TRENDING', 'TrendingItem', id);
    res.json({ success: true, message: 'Trending item removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove trending item' });
  }
});

async function auditLog(req: AuthRequest, action: string, resourceType: string, resourceId?: string) {
  if (!req.admin) return;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  await prisma.auditLog.create({ data: { adminId: req.admin.id, adminEmail: req.admin.email, action, resourceType, resourceId, ipAddress: ip } }).catch(() => {});
}

