import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Response } from 'express';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const admin = await prisma.adminUser.findFirst({
      where: { email: email.toLowerCase().trim(), active: true },
    });

    if (!admin) {
      // Timing-safe: still hash even if no user found
      await bcrypt.compare(password, '$2a$12$invalidhashfortimingprotection00000000000');
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const secret = process.env.AUTH_SECRET!;
    const expiresIn = process.env.AUTH_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, name: admin.name },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    // Update lastLoginAt
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Set HttpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('cinescope_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    res.json({
      success: true,
      data: {
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        token,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res: Response): void => {
  res.clearCookie('cinescope_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin!.id },
      select: { id: true, email: true, name: true, role: true, lastLoginAt: true, createdAt: true },
    });

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin not found' });
      return;
    }

    res.json({ success: true, data: admin });
  } catch (err) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Both passwords are required' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
      return;
    }

    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.id } });
    if (!admin) { res.status(404).json({ success: false, error: 'Admin not found' }); return; }

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) { res.status(401).json({ success: false, error: 'Current password is incorrect' }); return; }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Auth] Change password error:', err);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

