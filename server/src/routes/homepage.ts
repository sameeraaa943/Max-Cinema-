import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { SectionType } from '@prisma/client';

export const homepageRouter = Router();
homepageRouter.use(requireAuth);

// GET /api/admin/homepage — get or create config
homepageRouter.get('/', async (_req, res: Response): Promise<void> => {
  try {
    let config = await prisma.homepageConfig.findFirst({
      include: { sections: { orderBy: { displayOrder: 'asc' } } },
    });

    if (!config) {
      // Create default config
      config = await prisma.homepageConfig.create({
        data: {
          heroEnabled: true,
          heroTitle: 'Welcome to CineScope',
          heroDescription: 'Discover movies and TV shows',
          ctaText: 'Browse Now',
          sections: {
            create: [
              { type: 'FEATURED', title: 'Featured', enabled: true, displayOrder: 0, itemLimit: 10 },
              { type: 'TRENDING', title: 'Trending Now', enabled: true, displayOrder: 1, itemLimit: 10 },
              { type: 'POPULAR_MOVIES', title: 'Popular Movies', enabled: true, displayOrder: 2, itemLimit: 12 },
              { type: 'POPULAR_TV', title: 'Popular TV Shows', enabled: true, displayOrder: 3, itemLimit: 12 },
              { type: 'NEW_RELEASES', title: 'New Releases', enabled: true, displayOrder: 4, itemLimit: 8 },
              { type: 'COLLECTIONS', title: 'Collections', enabled: true, displayOrder: 5, itemLimit: 6 },
            ],
          },
        },
        include: { sections: { orderBy: { displayOrder: 'asc' } } },
      });
    }

    res.json({ success: true, data: config });
  } catch (err) {
    console.error('[Homepage] Get error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch homepage config' });
  }
});

// PUT /api/admin/homepage
homepageRouter.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sections, ...configData } = req.body;

    let config = await prisma.homepageConfig.findFirst();

    if (!config) {
      config = await prisma.homepageConfig.create({ data: configData, include: { sections: true } });
    } else {
      await prisma.homepageConfig.update({ where: { id: config.id }, data: configData });
    }

    // Update sections if provided
    if (Array.isArray(sections)) {
      await Promise.all(
        sections.map((section: { id?: string; type: string; title: string; enabled: boolean; displayOrder: number; itemLimit: number }) => {
          if (section.id) {
            return prisma.homepageSection.update({
              where: { id: section.id },
              data: {
                title: section.title,
                enabled: section.enabled,
                displayOrder: section.displayOrder,
                itemLimit: section.itemLimit,
              },
            });
          } else {
            return prisma.homepageSection.create({
              data: {
                configId: config!.id,
                type: section.type as SectionType,
                title: section.title,
                enabled: section.enabled,
                displayOrder: section.displayOrder,
                itemLimit: section.itemLimit,
              },
            });
          }
        })
      );
    }

    const updated = await prisma.homepageConfig.findFirst({
      include: { sections: { orderBy: { displayOrder: 'asc' } } },
    });

    if (req.admin) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
      await prisma.auditLog.create({ data: { adminId: req.admin.id, adminEmail: req.admin.email, action: 'UPDATE', resourceType: 'HomepageConfig', resourceId: config.id, ipAddress: ip } }).catch(() => {});
      await prisma.auditLog.create({
        data: {
          adminId: req.admin.id,
          adminEmail: req.admin.email,
          action: 'UPDATE',
          resourceType: 'HomepageConfig',
          resourceId: config.id,
          ipAddress: ip,
        },
      }).catch(() => {});
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Homepage] Update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update homepage config' });
  }
});

