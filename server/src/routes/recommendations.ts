import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const recommendationsRouter = Router();

recommendationsRouter.get('/:contentId', async (req: Request, res: Response) => {
  try {
    const contentId = String(req.params.contentId);
    const targetMovie = await prisma.movie.findUnique({
      where: { id: contentId },
      include: { genres: { include: { genre: true } } },
    });

    if (!targetMovie) {
      const fallback = await prisma.movie.findMany({
        take: 6,
        orderBy: { rating: 'desc' },
        include: { genres: { include: { genre: true } } },
      });
      return res.json({ success: true, data: fallback });
    }

    const targetGenreIds = (targetMovie as any).genres.map((g: any) => g.genreId);
    const related = await prisma.movie.findMany({
      where: {
        id: { not: contentId },
        genres: { some: { genreId: { in: targetGenreIds } } },
      },
      take: 6,
      orderBy: { rating: 'desc' },
      include: { genres: { include: { genre: true } } },
    });

    res.json({
      success: true,
      data: related.length > 0 ? related : await prisma.movie.findMany({ take: 6, include: { genres: { include: { genre: true } } } }),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch recommendations' });
  }
});

export default recommendationsRouter;
