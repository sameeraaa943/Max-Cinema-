import { Router, Response } from 'express';
import { requireAuth, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

// GET /api/admin/settings
settingsRouter.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const settings = await prisma.siteSetting.findMany({ orderBy: { category: 'asc' } });
    const grouped: Record<string, Record<string, unknown>> = {};
    settings.forEach((s) => {
      if (!grouped[s.category]) grouped[s.category] = {};
      grouped[s.category][s.key] = s.value;
    });
    res.json({ success: true, data: grouped });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// PUT /api/admin/settings
settingsRouter.put('/', requireSuperAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updates = req.body as Record<string, Record<string, unknown>>;

    const ops = Object.entries(updates).flatMap(([category, values]) =>
      Object.entries(values).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key: `${category}.${key}` },
          create: { key: `${category}.${key}`, value: value as Parameters<typeof prisma.siteSetting.upsert>[0]['create']['value'], category },
          update: { value: value as Parameters<typeof prisma.siteSetting.update>[0]['data']['value'] },
        })
      )
    );

    await Promise.all(ops);

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    if (req.admin) {
      await prisma.auditLog.create({ data: { adminId: req.admin.id, adminEmail: req.admin.email, action: 'UPDATE_SETTINGS', resourceType: 'SiteSettings', ipAddress: ip } }).catch(() => {});
    }

    res.json({ success: true, message: 'Settings saved' });
  } catch (err) {
    console.error('[Settings] Update error:', err);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// GET /api/admin/settings/genres
settingsRouter.get('/genres', async (_req, res: Response): Promise<void> => {
  try {
    const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: genres });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch genres' });
  }
});

// POST /api/admin/settings/genres
settingsRouter.post('/genres', requireSuperAdmin, async (req, res: Response): Promise<void> => {
  try {
    const { name, slug, tmdbId } = req.body;
    const genre = await prisma.genre.create({ data: { name, slug, tmdbId } });
    res.status(201).json({ success: true, data: genre });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create genre' });
  }
});

// GET /api/admin/settings/admins (Super admin only)
settingsRouter.get('/admins', requireSuperAdmin, async (_req, res: Response): Promise<void> => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch admin users' });
  }
});

