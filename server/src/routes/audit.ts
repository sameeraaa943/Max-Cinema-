import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const auditRouter = Router();
auditRouter.use(requireAuth);

// GET /api/admin/audit
auditRouter.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1', limit = '50', adminId, resourceType, action,
    } = req.query as Record<string, string>;

    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = {};
    if (adminId) where.adminId = adminId;
    if (resourceType) where.resourceType = resourceType;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map((log) => ({
          ...log,
          adminName: log.admin.name,
        })),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('[Audit] List error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

