import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AdPlacement, AdDeviceTarget } from '@prisma/client';

export const adsRouter = Router();
adsRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

adsRouter.get('/', async (_req, res: Response): Promise<void> => {
  try {
    const ads = await prisma.advertisement.findMany({ orderBy: [{ placement: 'asc' }, { priority: 'desc' }] });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch ads' });
  }
});

adsRouter.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const ad = await prisma.advertisement.findUnique({ where: { id } });
    if (!ad) { res.status(404).json({ success: false, error: 'Ad not found' }); return; }
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch ad' });
  }
});

adsRouter.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, placement, deviceTarget, priority, ...rest } = req.body;
    const ad = await prisma.advertisement.create({
      data: {
        ...rest,
        placement: placement as AdPlacement,
        deviceTarget: (deviceTarget as AdDeviceTarget) || 'ALL',
        priority: priority ? Number(priority) : 0,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });
    await auditLog(req, 'CREATE', 'Advertisement', ad.id);
    res.status(201).json({ success: true, data: ad });
  } catch (err) {
    console.error('[Ads] Create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create ad' });
  }
});

adsRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const { startDate, endDate, placement, deviceTarget, priority, ...rest } = req.body;
    const ad = await prisma.advertisement.update({
      where: { id },
      data: {
        ...rest,
        ...(placement && { placement: placement as AdPlacement }),
        ...(deviceTarget && { deviceTarget: deviceTarget as AdDeviceTarget }),
        ...(priority !== undefined && { priority: Number(priority) }),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });
    await auditLog(req, 'UPDATE', 'Advertisement', ad.id);
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update ad' });
  }
});

adsRouter.patch('/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    const ad = await prisma.advertisement.findUnique({ where: { id }, select: { enabled: true } });
    if (!ad) { res.status(404).json({ success: false, error: 'Ad not found' }); return; }
    const updated = await prisma.advertisement.update({ where: { id }, data: { enabled: !ad.enabled } });
    await auditLog(req, updated.enabled ? 'ENABLE_AD' : 'DISABLE_AD', 'Advertisement', id);
    res.json({ success: true, data: { enabled: updated.enabled } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to toggle ad' });
  }
});

adsRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.advertisement.delete({ where: { id } });
    await auditLog(req, 'DELETE', 'Advertisement', id);
    res.json({ success: true, message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete ad' });
  }
});

async function auditLog(req: AuthRequest, action: string, resourceType: string, resourceId?: string) {
  if (!req.admin) return;
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  await prisma.auditLog.create({ data: { adminId: req.admin.id, adminEmail: req.admin.email, action, resourceType, resourceId, ipAddress: ip } }).catch(() => {});
}
