import { prisma } from './prisma';

/**
 * CineScope Server-side Background Scheduler Runner
 * Checks every 60 seconds for pending scheduled tasks whose scheduledAt <= now()
 * Executes state transitions and records execution timestamp & audit logs.
 */

let schedulerInterval: NodeJS.Timeout | null = null;

export async function processScheduledTasks(): Promise<number> {
  const now = new Date();
  const pendingTasks = await prisma.scheduledTask.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    take: 20,
    orderBy: { scheduledAt: 'asc' },
  });

  let processedCount = 0;

  for (const task of pendingTasks) {
    try {
      if (task.targetType === 'MOVIE') {
        if (task.action === 'PUBLISH') {
          await prisma.movie.update({ where: { id: task.targetId }, data: { status: 'PUBLISHED' } });
        } else if (task.action === 'UNPUBLISH') {
          await prisma.movie.update({ where: { id: task.targetId }, data: { status: 'ARCHIVED' } });
        } else if (task.action === 'FEATURE') {
          await prisma.movie.update({ where: { id: task.targetId }, data: { featured: true } });
          const exists = await prisma.featuredItem.findFirst({ where: { movieId: task.targetId } });
          if (!exists) {
            const count = await prisma.featuredItem.count();
            await prisma.featuredItem.create({
              data: { contentType: 'MOVIE', movieId: task.targetId, displayOrder: count },
            });
          }
        } else if (task.action === 'UNFEATURE') {
          await prisma.movie.update({ where: { id: task.targetId }, data: { featured: false } });
          await prisma.featuredItem.deleteMany({ where: { movieId: task.targetId } });
        } else if (task.action === 'SET_TRENDING') {
          await prisma.movie.update({ where: { id: task.targetId }, data: { trending: true } });
          const exists = await prisma.trendingItem.findFirst({ where: { movieId: task.targetId } });
          if (!exists) {
            const count = await prisma.trendingItem.count();
            await prisma.trendingItem.create({
              data: { contentType: 'MOVIE', movieId: task.targetId, rank: count, trendingScore: 90 },
            });
          }
        } else if (task.action === 'REMOVE_TRENDING') {
          await prisma.movie.update({ where: { id: task.targetId }, data: { trending: false } });
          await prisma.trendingItem.deleteMany({ where: { movieId: task.targetId } });
        }
      } else if (task.targetType === 'TV_SHOW') {
        if (task.action === 'PUBLISH') {
          await prisma.tVShow.update({ where: { id: task.targetId }, data: { status: 'PUBLISHED' } });
        } else if (task.action === 'UNPUBLISH') {
          await prisma.tVShow.update({ where: { id: task.targetId }, data: { status: 'ARCHIVED' } });
        } else if (task.action === 'FEATURE') {
          await prisma.tVShow.update({ where: { id: task.targetId }, data: { featured: true } });
          const exists = await prisma.featuredItem.findFirst({ where: { tvShowId: task.targetId } });
          if (!exists) {
            const count = await prisma.featuredItem.count();
            await prisma.featuredItem.create({
              data: { contentType: 'TV_SHOW', tvShowId: task.targetId, displayOrder: count },
            });
          }
        } else if (task.action === 'UNFEATURE') {
          await prisma.tVShow.update({ where: { id: task.targetId }, data: { featured: false } });
          await prisma.featuredItem.deleteMany({ where: { tvShowId: task.targetId } });
        } else if (task.action === 'SET_TRENDING') {
          await prisma.tVShow.update({ where: { id: task.targetId }, data: { trending: true } });
          const exists = await prisma.trendingItem.findFirst({ where: { tvShowId: task.targetId } });
          if (!exists) {
            const count = await prisma.trendingItem.count();
            await prisma.trendingItem.create({
              data: { contentType: 'TV_SHOW', tvShowId: task.targetId, rank: count, trendingScore: 90 },
            });
          }
        } else if (task.action === 'REMOVE_TRENDING') {
          await prisma.tVShow.update({ where: { id: task.targetId }, data: { trending: false } });
          await prisma.trendingItem.deleteMany({ where: { tvShowId: task.targetId } });
        }
      }

      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
        },
      });

      processedCount++;
    } catch (err) {
      console.error(`[Scheduler] Task ${task.id} failed:`, err);
      await prisma.scheduledTask.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          executedAt: new Date(),
          error: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return processedCount;
}

export function startSchedulerRunner(intervalMs = 60000): void {
  if (schedulerInterval) return;
  console.log('⏰ CineScope Content Scheduler engine started (polling every 60s)');
  
  // Run an initial sweep
  processScheduledTasks().catch((err) => console.error('[Scheduler] Initial sweep error:', err));

  schedulerInterval = setInterval(() => {
    processScheduledTasks().catch((err) => console.error('[Scheduler] Sweep error:', err));
  }, intervalMs);
}

export function stopSchedulerRunner(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

