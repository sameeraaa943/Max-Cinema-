import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Natural language command processor
router.post('/command', requireAuth, async (req: any, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ success: false, error: 'Command is required' });

    // Parse natural language into actions
    const lowerCmd = command.toLowerCase();
    let response = '';
    let actions: any[] = [];
    let data: any = null;

    // Count commands
    if (lowerCmd.includes('how many movies') || lowerCmd.includes('count movies') || lowerCmd.includes('total movies')) {
      const count = await prisma.movie.count();
      response = `There are currently ${count} movies in the database.`;
      actions = [{ type: 'INFO', label: 'View Movies', path: '/movies' }];
      data = { count, type: 'movies' };
    } else if (lowerCmd.includes('how many tv') || lowerCmd.includes('count tv') || lowerCmd.includes('total tv')) {
      const count = await prisma.tVShow.count();
      response = `There are currently ${count} TV shows in the database.`;
      actions = [{ type: 'INFO', label: 'View TV Shows', path: '/tv-shows' }];
      data = { count, type: 'tvshows' };
    } else if (lowerCmd.includes('latest movies') || lowerCmd.includes('recent movies') || lowerCmd.includes('newest movies')) {
      const movies = await prisma.movie.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, releaseDate: true, rating: true } });
      response = `Here are the 5 most recently added movies:`;
      actions = movies.map((m: any) => ({ type: 'LINK', label: m.title, path: `/movies/${m.id}/edit` }));
      data = { movies };
    } else if (lowerCmd.includes('featured') && lowerCmd.includes('list')) {
      const featured = await (prisma as any).featuredContent.findMany({ take: 5, include: { movie: { select: { title: true } }, tvShow: { select: { title: true } } } });
      const names = featured.map((f: any) => f.movie?.title || f.tvShow?.title || 'Unknown').join(', ');
      response = `Currently featured content: ${names || 'None'}.`;
      actions = [{ type: 'LINK', label: 'Manage Featured', path: '/featured' }];
      data = { featured };
    } else if (lowerCmd.includes('trending') && lowerCmd.includes('list')) {
      const trending = await (prisma as any).trendingContent.findMany({ take: 5, include: { movie: { select: { title: true } }, tvShow: { select: { title: true } } } });
      const names = trending.map((t: any) => t.movie?.title || t.tvShow?.title || 'Unknown').join(', ');
      response = `Current trending content: ${names || 'None'}.`;
      actions = [{ type: 'LINK', label: 'Manage Trending', path: '/trending' }];
      data = { trending };
    } else if (lowerCmd.includes('health') || lowerCmd.includes('status')) {
      const [movies, tvShows, featured, trending] = await Promise.all([
        prisma.movie.count(),
        prisma.tVShow.count(),
        (prisma as any).featuredContent.count(),
        (prisma as any).trendingContent.count(),
      ]);
      response = `System status: ${movies} movies, ${tvShows} TV shows, ${featured} featured, ${trending} trending. All systems operational.`;
      actions = [{ type: 'LINK', label: 'System Health', path: '/system-health' }];
      data = { movies, tvShows, featured, trending };
    } else if (lowerCmd.includes('missing') || lowerCmd.includes('issue') || lowerCmd.includes('problem')) {
      const missingPoster = await prisma.movie.count({ where: { OR: [{ posterUrl: null }, { posterUrl: '' }] } });
      const missingDesc = await prisma.movie.count({ where: { OR: [{ description: null }, { description: '' }] } });
      response = `Content issues found: ${missingPoster} movies missing poster, ${missingDesc} movies missing description.`;
      actions = [{ type: 'LINK', label: 'View Content Health', path: '/content-center' }];
      data = { missingPoster, missingDesc };
    } else if (lowerCmd.includes('top rated') || lowerCmd.includes('highest rated')) {
      const movies = await prisma.movie.findMany({ orderBy: { rating: 'desc' }, take: 5, select: { id: true, title: true, rating: true } });
      const list = movies.map((m: any) => `${m.title} (${m.rating})`).join(', ');
      response = `Top rated movies: ${list}`;
      data = { movies };
    } else if (lowerCmd.includes('user') && (lowerCmd.includes('count') || lowerCmd.includes('how many'))) {
      const count = await prisma.userAccount.count();
      const premium = await prisma.userAccount.count({ where: { isPremium: true } });
      response = `There are ${count} registered users, ${premium} of which are premium subscribers.`;
      actions = [{ type: 'LINK', label: 'Manage Users', path: '/users' }];
      data = { count, premium };
    } else if (lowerCmd.includes('help') || lowerCmd.includes('what can you do')) {
      response = `I can help you with:\n• Count movies/TV shows/users\n• List latest or top-rated content\n• Show featured and trending content\n• Check system health and content issues\n• Find missing metadata\n\nTry: "How many movies?" or "Show latest movies" or "Check system status"`;
      actions = [];
    } else {
      // Generic search
      const searchTerm = command.replace(/find|search|show|get|list/gi, '').trim();
      if (searchTerm.length > 1) {
        const movies = await prisma.movie.findMany({
          where: { title: { contains: searchTerm, mode: 'insensitive' } },
          take: 5,
          select: { id: true, title: true, releaseDate: true, rating: true },
        });
        if (movies.length > 0) {
          response = `Found ${movies.length} movie(s) matching "${searchTerm}": ${movies.map((m: any) => m.title).join(', ')}`;
          actions = movies.map((m: any) => ({ type: 'LINK', label: `Edit ${m.title}`, path: `/movies/${m.id}/edit` }));
          data = { movies };
        } else {
          response = `No content found matching "${searchTerm}". Try a different search term or check the content library.`;
        }
      } else {
        response = `I didn't understand that command. Try: "How many movies?", "Show latest movies", "Check system health", or type "help" for more options.`;
      }
    }

    // Log the command
    await prisma.aiCommand.create({
      data: {
        command,
        response,
        actions,
        status: 'COMPLETED',
        adminId: req.admin?.id,
      },
    });

    res.json({ success: true, data: { response, actions, data } });
  } catch (e) {
    console.error('AI command error:', e);
    res.status(500).json({ success: false, error: 'Failed to process command' });
  }
});

// GET command history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const history = await prisma.aiCommand.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    res.json({ success: true, data: history });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

export default router;
