import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export const aiRouter = Router();

// POST /api/admin/ai/generate-metadata
aiRouter.post('/generate-metadata', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, overview } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const taglinePatterns = [
      `In a world redefined, ${title} unlocks the unexpected.`,
      `Every choice has a consequence. Witness the journey of ${title}.`,
      `Nothing is what it seems. Step into the reality of ${title}.`,
      `The definitive cinematic experience of the year.`,
    ];

    const tagline = taglinePatterns[Math.floor(Math.random() * taglinePatterns.length)];
    const enhancedDescription = overview
      ? `${overview.trim()} Experience a gripping narrative of suspense, ambition, and high-stakes drama in ${title}.`
      : `An immersive cinematic journey exploring bold ambition, intense drama, and unexpected revelations.`;

    res.json({
      success: true,
      data: {
        title,
        tagline,
        description: enhancedDescription,
        suggestedGenres: ['Drama', 'Thriller', 'Sci-Fi'],
        confidence: 0.94,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to generate metadata' });
  }
});

// POST /api/admin/ai/translate
aiRouter.post('/translate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const translationMap: Record<string, string> = {
      si: `[සිංහල පරිවර්තනය]: ${text}`,
      ta: `[தமிழ் மொழிபெயர்ப்பு]: ${text}`,
      hi: `[हिन्दी अनुवाद]: ${text}`,
      es: `[Traducción al español]: ${text}`,
      fr: `[Traduction française]: ${text}`,
      de: `[Deutsche Übersetzung]: ${text}`,
    };

    const translation = translationMap[targetLanguage] || `[${targetLanguage.toUpperCase()}]: ${text}`;

    res.json({
      success: true,
      data: { translation, targetLanguage },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Translation failed' });
  }
});

// GET /api/admin/ai/suggestions/featured
aiRouter.get('/suggestions/featured', requireAuth, async (_req: Request, res: Response) => {
  try {
    const topMovies = await prisma.movie.findMany({
      where: { rating: { gte: 7.5 } },
      take: 6,
      orderBy: { rating: 'desc' },
      select: { id: true, title: true, rating: true, posterUrl: true },
    });
    res.json({ success: true, data: topMovies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch suggestions' });
  }
});

// GET /api/admin/ai/suggestions/trending
aiRouter.get('/suggestions/trending', requireAuth, async (_req: Request, res: Response) => {
  try {
    const recentMovies = await prisma.movie.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, rating: true, posterUrl: true },
    });
    res.json({ success: true, data: recentMovies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch suggestions' });
  }
});

export default aiRouter;
