import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const systemHealthRouter = Router();
systemHealthRouter.use(requireAuth);

// GET /api/admin/system/health-metrics
systemHealthRouter.get('/health-metrics', async (_req: AuthRequest, res: Response): Promise<void> => {
  const startTime = Date.now();

  // 1. Measure Supabase Database Latency
  let dbLatency = -1;
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = 'error';
    dbLatency = -1;
  }

  // 2. Measure TMDB API Latency
  let tmdbLatency = -1;
  let tmdbStatus: 'ok' | 'error' | 'not_configured' = 'ok';
  const tmdbKey = process.env.TMDB_API_KEY;
  if (!tmdbKey) {
    tmdbStatus = 'not_configured';
  } else {
    try {
      const tmdbStart = Date.now();
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${tmdbKey}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (tmdbRes.ok) {
        tmdbLatency = Date.now() - tmdbStart;
      } else {
        tmdbStatus = 'error';
      }
    } catch {
      tmdbStatus = 'error';
    }
  }

  // 3. Measure Public Website Latency
  let publicSiteLatency = -1;
  let publicSiteStatus: 'ok' | 'error' = 'ok';
  const publicSiteUrl = process.env.PUBLIC_SITE_URL || 'https://cinescopecodespactor.netlify.app';
  try {
    const siteStart = Date.now();
    const siteRes = await fetch(publicSiteUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    if (siteRes.ok || siteRes.status === 304 || siteRes.status === 405) {
      publicSiteLatency = Date.now() - siteStart;
    } else {
      publicSiteStatus = 'error';
    }
  } catch {
    publicSiteStatus = 'error';
  }

  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    success: true,
    data: {
      timestamp: new Date().toISOString(),
      apiLatency: Date.now() - startTime,
      services: {
        api: {
          status: 'ok',
          uptimeSeconds,
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          engine: 'Supabase PostgreSQL (Session Pooler)',
        },
        tmdb: {
          status: tmdbStatus,
          latencyMs: tmdbLatency,
        },
        publicWebsite: {
          status: publicSiteStatus,
          latencyMs: publicSiteLatency,
          url: publicSiteUrl,
        },
      },
      memory: {
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
        rssMB: Math.round(memory.rss / 1024 / 1024),
      },
    },
  });
});

