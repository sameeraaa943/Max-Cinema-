import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/admin/languages - list all languages
router.get('/', requireAuth, async (req, res) => {
  try {
    const languages = await prisma.language.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ success: true, data: languages });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch languages' });
  }
});

// POST /api/admin/languages - create language
router.post('/', requireAuth, async (req, res) => {
  try {
    const { code, name, nativeName, rtl, isDefault } = req.body;
    if (isDefault) {
      await prisma.language.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const language = await prisma.language.create({ data: { code, name, nativeName, rtl: rtl || false, isDefault: isDefault || false } });
    res.json({ success: true, data: language });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create language' });
  }
});

// PUT /api/admin/languages/:id - update language
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, nativeName, rtl, isEnabled, isDefault } = req.body;
    if (isDefault) {
      await prisma.language.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }
    const language = await prisma.language.update({ where: { id }, data: { name, nativeName, rtl, isEnabled, isDefault } });
    res.json({ success: true, data: language });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to update language' });
  }
});

// DELETE /api/admin/languages/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    await prisma.contentTranslation.deleteMany({ where: { language: { id } } });
    await prisma.language.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to delete language' });
  }
});

// GET /api/admin/languages/translations/:contentType/:contentId
router.get('/translations/:contentType/:contentId', requireAuth, async (req, res) => {
  try {
    const { contentType, contentId } = req.params as { contentType: string; contentId: string };
    const translations = await prisma.contentTranslation.findMany({ where: { contentType, contentId }, include: { language: true } });
    res.json({ success: true, data: translations });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch translations' });
  }
});

// PUT /api/admin/languages/translations/:contentType/:contentId/:languageCode
router.put('/translations/:contentType/:contentId/:languageCode', requireAuth, async (req, res) => {
  try {
    const { contentType, contentId, languageCode } = req.params as { contentType: string; contentId: string; languageCode: string };
    const { title, description, tagline, keywords } = req.body;
    const translation = await prisma.contentTranslation.upsert({
      where: { contentType_contentId_languageCode: { contentType, contentId, languageCode } },
      create: { contentType, contentId, languageCode, title, description, tagline, keywords: keywords || [] },
      update: { title, description, tagline, keywords: keywords || [] },
    });
    res.json({ success: true, data: translation });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to save translation' });
  }
});

export default router;
