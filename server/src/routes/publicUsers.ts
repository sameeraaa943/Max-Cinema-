import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/admin/users/public - list user accounts with pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const role = req.query.role as string || '';
    const isPremium = req.query.isPremium;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }];
    if (role) where.role = role;
    if (isPremium !== undefined) where.isPremium = isPremium === 'true';
    const [users, total] = await Promise.all([
      prisma.userAccount.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { _count: { select: { reviews: true } } } }),
      prisma.userAccount.count({ where }),
    ]);
    res.json({ success: true, data: users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [total, premium, active, newThisWeek] = await Promise.all([
      prisma.userAccount.count(),
      prisma.userAccount.count({ where: { isPremium: true } }),
      prisma.userAccount.count({ where: { isActive: true } }),
      prisma.userAccount.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);
    res.json({ success: true, data: { total, premium, active, newThisWeek } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// PATCH toggle active/premium
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { isActive, isPremium, role } = req.body;
    const user = await prisma.userAccount.update({ where: { id }, data: { isActive, isPremium, role } });
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    await prisma.review.deleteMany({ where: { userId: id } });
    await prisma.userAccount.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

export default router;
