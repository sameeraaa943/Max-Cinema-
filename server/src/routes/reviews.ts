import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string || 'ALL'; // ALL | PENDING | APPROVED | FLAGGED
    const contentType = req.query.contentType as string || '';
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status === 'PENDING') where.isApproved = false;
    else if (status === 'APPROVED') where.isApproved = true;
    else if (status === 'FLAGGED') where.isFlagged = true;
    if (contentType) where.contentType = contentType;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true, avatar: true } } } }),
      prisma.review.count({ where }),
    ]);
    res.json({ success: true, data: reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

router.patch('/:id/approve', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const review = await prisma.review.update({ where: { id }, data: { isApproved: true, isFlagged: false } });
    res.json({ success: true, data: review });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to approve review' });
  }
});

router.patch('/:id/flag', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const review = await prisma.review.update({ where: { id }, data: { isFlagged: true } });
    res.json({ success: true, data: review });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to flag review' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    await prisma.review.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
});

export default router;
