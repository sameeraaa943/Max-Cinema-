import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const collectionsRouter = Router();
collectionsRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

collectionsRouter.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    });
    res.json({ success: true, data: collections.map((c) => ({ ...c, itemCount: c._count.items })) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch collections' });
  }
});

collectionsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const collection = await prisma.collection.findUnique({
      where: { id },
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

collectionsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await prisma.collection.count();
    const collection = await prisma.collection.create({
      data: { ...req.body, displayOrder: req.body.displayOrder ?? count },
    });
    await auditLog(req, 'CREATE', 'Collection', collection.id);
    res.status(201).json({ success: true, data: { ...collection, itemCount: 0 } });
  } catch (err) {
    console.error('[Collections] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create collection' });
  }
});

collectionsRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const collection = await prisma.collection.update({ where: { id }, data: req.body });
    await auditLog(req, 'UPDATE', 'Collection', collection.id);
    res.json({ success: true, data: collection });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update collection' });
  }
});

collectionsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.collection.delete({ where: { id } });
    await auditLog(req, 'DELETE', 'Collection', id);
    res.json({ success: true, message: 'Collection deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete collection' });
  }
});

// POST /api/admin/collections/:id/items
collectionsRouter.post('/:id/items', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const { contentType, movieId, tvShowId } = req.body;
    const count = await prisma.collectionItem.count({ where: { collectionId: id } });

    const existing = await prisma.collectionItem.findFirst({
      where: { collectionId: id, ...(movieId ? { movieId } : { tvShowId }) },
    });
    if (existing) { res.status(409).json({ success: false, error: 'Content already in collection' }); return; }

    const item = await prisma.collectionItem.create({
      data: { collectionId: id, contentType, movieId: movieId || null, tvShowId: tvShowId || null, displayOrder: count },
      include: {
        movie: { select: { id: true, title: true, posterUrl: true, rating: true } },
        tvShow: { select: { id: true, title: true, posterUrl: true, rating: true } },
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add item to collection' });
  }
});

// DELETE /api/admin/collections/:id/items/:itemId
collectionsRouter.delete('/:id/items/:itemId', async (_req, res: Response): Promise<void> => {
  try {
    const itemId = _req.params.itemId as string;
    await prisma.collectionItem.delete({ where: { id: itemId } });
    res.json({ success: true, message: 'Item removed from collection' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
});

// PUT /api/admin/collections/:id/items/reorder
collectionsRouter.put('/:id/items/reorder', async (_req, res: Response): Promise<void> => {
  try {
    const { orderedIds } = _req.body as { orderedIds: string[] };
    await Promise.all(orderedIds.map((itemId, index) =>
      prisma.collectionItem.update({ where: { id: itemId }, data: { displayOrder: index } })
    ));
    res.json({ success: true, message: 'Collection items reordered' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reorder collection items' });
  }
});

async function auditLog(req: AuthRequest, action: string, resourceType: string, resourceId?: string) {
  if (!req.admin) return;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  await prisma.auditLog.create({ data: { adminId: req.admin.id, adminEmail: req.admin.email, action, resourceType, resourceId, ipAddress: ip } }).catch(() => {});
}

