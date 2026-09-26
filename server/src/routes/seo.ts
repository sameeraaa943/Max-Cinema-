import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET all SEO settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const contentType = req.query.contentType as string || '';
    const skip = (page - 1) * limit;
    const where: any = {};
    if (contentType) where.contentType = contentType;
    const [settings, total] = await Promise.all([
      prisma.seoSettings.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
      prisma.seoSettings.count({ where }),
    ]);
    res.json({ success: true, data: settings, total });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch SEO settings' });
  }
});

// GET SEO for specific content
router.get('/:contentType/:contentId', requireAuth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params as { contentType: string; contentId: string };
    const seo = await prisma.seoSettings.findUnique({ where: { contentType_contentId: { contentType, contentId } } });
    res.json({ success: true, data: seo });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch SEO settings' });
  }
});

// PUT upsert SEO settings
router.put('/:contentType/:contentId', requireAuth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params as { contentType: string; contentId: string };
    const { metaTitle, metaDescription, keywords, ogImage, canonicalUrl, noIndex } = req.body;
    const seo = await prisma.seoSettings.upsert({
      where: { contentType_contentId: { contentType, contentId } },
      create: { contentType, contentId, metaTitle, metaDescription, keywords: keywords || [], ogImage, canonicalUrl, noIndex: noIndex || false },
      update: { metaTitle, metaDescription, keywords: keywords || [], ogImage, canonicalUrl, noIndex },
    });
    res.json({ success: true, data: seo });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to save SEO settings' });
  }
});

// GET SEO stats - coverage analysis
router.get('/stats/coverage', requireAuth, async (req, res) => {
  try {
    const [movieCount, tvCount, seoCount] = await Promise.all([
      prisma.movie.count(),
      prisma.tVShow.count(),
      prisma.seoSettings.count(),
    ]);
    const totalContent = movieCount + tvCount;
    const coverage = totalContent > 0 ? ((seoCount / totalContent) * 100).toFixed(1) : '0';
    res.json({ success: true, data: { movieCount, tvCount, totalContent, seoCount, coverage } });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch SEO stats' });
  }
});

export default router;
