import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export const adminUsersRouter = Router();

// GET /api/admin/users - List admin operators
adminUsersRouter.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const admins = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: admins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch admin users' });
  }
});

// POST /api/admin/users - Create new admin
adminUsersRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Admin with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        name: name || 'Admin',
        email,
        passwordHash: hashedPassword,
        role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: admin });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to create admin user' });
  }
});

// POST /api/admin/users/:id/reset-password
adminUsersRouter.post('/:id/reset-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.adminUser.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to reset password' });
  }
});

// DELETE /api/admin/users/:id
adminUsersRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.adminUser.delete({ where: { id } });
    res.json({ success: true, message: 'Admin user deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete admin user' });
  }
});

export default adminUsersRouter;
