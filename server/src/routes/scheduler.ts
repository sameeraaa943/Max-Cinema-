import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { ScheduleTargetType, ScheduleAction, ScheduleStatus } from '@prisma/client';
import { processScheduledTasks } from '../lib/schedulerRunner';

export const schedulerRouter = Router();
schedulerRouter.use(requireAuth);

const getId = (req: AuthRequest): string => req.params.id as string;

// GET /api/admin/scheduler/tasks
schedulerRouter.get('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, targetType } = req.query as Record<string, string>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status && status !== 'ALL') where.status = status as ScheduleStatus;
    if (targetType && targetType !== 'ALL') where.targetType = targetType as ScheduleTargetType;

    const tasks = await prisma.scheduledTask.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: 100,
    });

    // Populate target title for display
    const enriched = await Promise.all(
      tasks.map(async (task) => {
        let targetTitle = 'Unknown Target';
        if (task.targetType === 'MOVIE') {
          const m = await prisma.movie.findUnique({ where: { id: task.targetId }, select: { title: true } });
          if (m) targetTitle = m.title;
        } else if (task.targetType === 'TV_SHOW') {
          const s = await prisma.tVShow.findUnique({ where: { id: task.targetId }, select: { title: true } });
          if (s) targetTitle = s.title;
        } else if (task.targetType === 'COLLECTION') {
          const c = await prisma.collection.findUnique({ where: { id: task.targetId }, select: { name: true } });
          if (c) targetTitle = c.name;
        }
        return { ...task, targetTitle };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error('[Scheduler] Fetch tasks error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch scheduled tasks' });
  }
});

// POST /api/admin/scheduler/tasks
schedulerRouter.post('/tasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, action, scheduledAt, metadata } = req.body;

    if (!targetType || !targetId || !action || !scheduledAt) {
      res.status(400).json({ success: false, error: 'targetType, targetId, action, and scheduledAt are required' });
      return;
    }

    const task = await prisma.scheduledTask.create({
      data: {
        targetType: targetType as ScheduleTargetType,
        targetId,
        action: action as ScheduleAction,
        scheduledAt: new Date(scheduledAt),
        status: 'PENDING',
        metadata: metadata || undefined,
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error('[Scheduler] Create task error:', err);
    res.status(500).json({ success: false, error: 'Failed to schedule task' });
  }
});

// POST /api/admin/scheduler/tasks/:id/execute-now — Manually trigger task right now
schedulerRouter.post('/tasks/:id/execute-now', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    // Set scheduledAt to past so scheduler picks it up immediately
    await prisma.scheduledTask.update({
      where: { id },
      data: { scheduledAt: new Date(Date.now() - 1000) },
    });

    const processed = await processScheduledTasks();
    const updated = await prisma.scheduledTask.findUnique({ where: { id } });

    res.json({ success: true, processed, data: updated });
  } catch (err) {
    console.error('[Scheduler] Execute error:', err);
    res.status(500).json({ success: false, error: 'Failed to execute task' });
  }
});

// DELETE /api/admin/scheduler/tasks/:id — Cancel scheduled task
schedulerRouter.delete('/tasks/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = getId(req);
    await prisma.scheduledTask.delete({ where: { id } });
    res.json({ success: true, message: 'Scheduled task cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to cancel scheduled task' });
  }
});

