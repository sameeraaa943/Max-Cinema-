import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export const alertsRouter = Router();

// GET /api/admin/alerts - List all alerts
alertsRouter.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const alerts = await (prisma as any).alert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch alerts' });
  }
});

// PATCH /api/admin/alerts/:id/read - Mark alert read / resolved
alertsRouter.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const alert = await (prisma as any).alert.update({
      where: { id },
      data: { isRead: true, status: 'RESOLVED', resolvedAt: new Date() },
    });
    res.json({ success: true, data: alert });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update alert' });
  }
});

// POST /api/admin/alerts/mark-all-read
alertsRouter.post('/mark-all-read', requireAuth, async (_req: Request, res: Response) => {
  try {
    await (prisma as any).alert.updateMany({
      where: { isRead: false },
      data: { isRead: true, status: 'RESOLVED', resolvedAt: new Date() },
    });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to resolve alerts' });
  }
});

// DELETE /api/admin/alerts/:id
alertsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await (prisma as any).alert.delete({ where: { id } });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete alert' });
  }
});

// POST /api/admin/alerts/test - Generate test alert
alertsRouter.post('/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, message, severity, source } = req.body;
    const alert = await (prisma as any).alert.create({
      data: {
        title: title || 'System Health Event',
        message: message || 'Routine infrastructure check completed.',
        severity: severity || 'INFO',
        source: source || 'SYSTEM',
        status: 'OPEN',
        isRead: false,
      },
    });
    res.json({ success: true, data: alert });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to generate alert' });
  }
});

export default alertsRouter;
