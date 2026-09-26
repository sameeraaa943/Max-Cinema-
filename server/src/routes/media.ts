import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { MediaType } from '@prisma/client';

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

// GET /api/admin/media
mediaRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, type, page = '1', limit = '24' } = req.query as Record<string, string>;
    const skip = (Number(page) - 1) * Number(limit);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (type && type !== 'ALL') where.type = type as MediaType;

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[Media] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch media assets' });
  }
});

// GET /api/admin/media/:id/usage — Check where media URL is actively used
mediaRouter.get('/:id/usage', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      res.status(404).json({ success: false, error: 'Media asset not found' });
      return;
    }

    const [moviesUsingPoster, moviesUsingBackdrop, tvUsingPoster, tvUsingBackdrop, collectionsUsingCover] = await Promise.all([
      prisma.movie.findMany({ where: { posterUrl: asset.url }, select: { id: true, title: true } }),
      prisma.movie.findMany({ where: { backdropUrl: asset.url }, select: { id: true, title: true } }),
      prisma.tVShow.findMany({ where: { posterUrl: asset.url }, select: { id: true, title: true } }),
      prisma.tVShow.findMany({ where: { backdropUrl: asset.url }, select: { id: true, title: true } }),
      prisma.collection.findMany({ where: { coverImage: asset.url }, select: { id: true, name: true } }),
    ]);

    const usages = [
      ...moviesUsingPoster.map((m) => ({ type: 'Movie Poster', id: m.id, title: m.title })),
      ...moviesUsingBackdrop.map((m) => ({ type: 'Movie Backdrop', id: m.id, title: m.title })),
      ...tvUsingPoster.map((s) => ({ type: 'TV Show Poster', id: s.id, title: s.title })),
      ...tvUsingBackdrop.map((s) => ({ type: 'TV Show Backdrop', id: s.id, title: s.title })),
      ...collectionsUsingCover.map((c) => ({ type: 'Collection Cover', id: c.id, title: c.name })),
    ];

    res.json({
      success: true,
      data: {
        assetId: asset.id,
        isUsed: usages.length > 0,
        usageCount: usages.length,
        usages,
      },
    });
  } catch (err) {
    console.error('[Media Usage] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to check media usage' });
  }
});

// POST /api/admin/media — Add a new media record
mediaRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, url, thumbnailUrl, type, mimeType, sizeBytes, width, height, altText, tags } = req.body;

    if (!title || !url) {
      res.status(400).json({ success: false, error: 'Title and URL are required' });
      return;
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        title,
        url,
        thumbnailUrl: thumbnailUrl || url,
        type: (type as MediaType) || 'POSTER',
        mimeType: mimeType || 'image/jpeg',
        sizeBytes: sizeBytes ? Number(sizeBytes) : null,
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        altText: altText || null,
        tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()) : []),
      },
    });

    res.status(201).json({ success: true, data: asset });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'A media asset with this URL already exists' });
      return;
    }
    console.error('[Media Create] Error:', err);
    res.status(500).json({ success: false, error: 'Failed to register media asset' });
  }
});

// PUT /api/admin/media/:id
mediaRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const { title, altText, type, tags } = req.body;

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(altText !== undefined && { altText }),
        ...(type !== undefined && { type: type as MediaType }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim()) }),
      },
    });

    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update media asset' });
  }
});

// DELETE /api/admin/media/:id
mediaRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.mediaAsset.delete({ where: { id } });
    res.json({ success: true, message: 'Media asset removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete media asset' });
  }
});

