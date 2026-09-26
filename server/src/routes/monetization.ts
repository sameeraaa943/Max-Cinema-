import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET plans
router.get('/plans', requireAuth, async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ success: true, data: plans });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch plans' });
  }
});

// POST create plan
router.post('/plans', requireAuth, async (req, res) => {
  try {
    const { name, price, currency, period, features, sortOrder } = req.body;
    const plan = await prisma.subscriptionPlan.create({ data: { name, price, currency: currency || 'USD', period, features: features || [], sortOrder: sortOrder || 0 } });
    res.json({ success: true, data: plan });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create plan' });
  }
});

// PUT update plan
router.put('/plans/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, price, currency, period, features, isActive, sortOrder } = req.body;
    const plan = await prisma.subscriptionPlan.update({ where: { id }, data: { name, price, currency, period, features, isActive, sortOrder } });
    res.json({ success: true, data: plan });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update plan' });
  }
});

// DELETE plan
router.delete('/plans/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    await prisma.subscriptionPlan.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete plan' });
  }
});

// GET revenue stats (mock based on plan counts + premium users)
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [plans, premiumUsers, totalUsers] = await Promise.all([
      prisma.subscriptionPlan.findMany({ where: { isActive: true } }),
      prisma.userAccount.count({ where: { isPremium: true } }),
      prisma.userAccount.count(),
    ]);
    // Estimate MRR from cheapest monthly plan * premium users
    const monthlyPlan = plans.find(p => p.period === 'MONTHLY');
    const estimatedMRR = monthlyPlan ? monthlyPlan.price * premiumUsers : 0;
    res.json({
      success: true,
      data: {
        premiumUsers,
        totalUsers,
        conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0',
        activePlans: plans.length,
        estimatedMRR: estimatedMRR.toFixed(2),
        estimatedARR: (estimatedMRR * 12).toFixed(2),
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
