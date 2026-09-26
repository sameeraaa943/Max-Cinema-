import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await prisma.pushNotification.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: notifications });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, body, imageUrl, targetAudience } = req.body;
    const notification = await prisma.pushNotification.create({
      data: { title, body, imageUrl, targetAudience: targetAudience || 'ALL', status: 'DRAFT' },
    });
    res.json({ success: true, data: notification });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// POST send notification
router.post('/:id/send', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    // In production this would trigger a real push service (FCM, OneSignal, etc.)
    // For now we mark it as sent with estimated count based on user count
    const userCount = await prisma.userAccount.count({ where: { isActive: true } });
    const notification = await prisma.pushNotification.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), sentCount: userCount },
    });
    res.json({ success: true, data: notification });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    await prisma.pushNotification.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

export default router;
