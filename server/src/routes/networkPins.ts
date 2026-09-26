import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export const networkPinsRouter = Router();

const HASH_SECRET = process.env.NETWORK_HASH_SECRET || 'cinescope_secure_network_salt_2026';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const ips = forwarded.split(',').map((ip) => ip.trim());
    for (const ip of ips) {
      if (!isPrivateIp(ip)) return ip;
    }
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && !isPrivateIp(realIp)) {
    return realIp;
  }
  const socketIp = req.socket?.remoteAddress || '';
  return socketIp.replace(/^::ffff:/, '');
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '');
  if (clean === '127.0.0.1' || clean === '::1' || clean === 'localhost') return true;
  if (clean.startsWith('10.') || clean.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  return false;
}

export function hashNetworkIp(ip: string): string {
  return crypto.createHmac('sha256', HASH_SECRET).update(ip).digest('hex');
}

export function maskIp(ip: string): string {
  if (!ip) return '0.0.xxx.xxx';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return ip.slice(0, 8) + '...';
}

// GET /api/admin/network-pins - List all network pins
networkPinsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { search, scope } = req.query;
    const where: any = {};
    if (scope && scope !== 'ALL') {
      where.scope = String(scope);
    }
    if (search) {
      where.OR = [
        { mediaId: { contains: String(search), mode: 'insensitive' } },
        { note: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const items = await (prisma as any).networkMoviePin.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const clientIp = getClientIp(req);

    res.json({
      success: true,
      data: {
        items,
        clientInfo: {
          maskedIp: maskIp(clientIp),
          networkHash: hashNetworkIp(clientIp),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch network pins' });
  }
});

// POST /api/admin/network-pins - Create a new network pin
networkPinsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { mediaId, mediaType, scope, customIp, note, expiresAt } = req.body;
    if (!mediaId || !mediaType) {
      return res.status(400).json({ success: false, error: 'mediaId and mediaType are required' });
    }

    const targetIp = customIp?.trim() || getClientIp(req);
    const networkHash = hashNetworkIp(targetIp);
    const masked = maskIp(targetIp);

    const pin = await (prisma as any).networkMoviePin.create({
      data: {
        mediaId,
        mediaType: mediaType || 'MOVIE',
        scope: scope || 'NETWORK',
        networkHash,
        maskedIp: masked,
        note: note || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    });

    res.json({ success: true, data: pin });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create network pin' });
  }
});

// PUT /api/admin/network-pins/:id - Update status or notes
networkPinsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { isActive, note, expiresAt } = req.body;

    const updated = await (prisma as any).networkMoviePin.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(note !== undefined ? { note } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update network pin' });
  }
});

// DELETE /api/admin/network-pins/:id
networkPinsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await (prisma as any).networkMoviePin.delete({ where: { id } });
    res.json({ success: true, message: 'Network pin deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete network pin' });
  }
});

export default networkPinsRouter;
