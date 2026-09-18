import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check HttpOnly cookie first, then Authorization header
    const token =
      req.cookies?.cinescope_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: 'Server configuration error' });
      return;
    }

    const payload = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
      name: string;
    };

    // Verify admin still exists and is active
    const admin = await prisma.adminUser.findFirst({
      where: { id: payload.id, active: true },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!admin) {
      res.status(401).json({ success: false, error: 'Account not found or deactivated' });
      return;
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Session expired — please log in again' });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid authentication token' });
    } else {
      next(err);
    }
  }
};

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.admin?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, error: 'Super admin access required' });
    return;
  }
  next();
};

