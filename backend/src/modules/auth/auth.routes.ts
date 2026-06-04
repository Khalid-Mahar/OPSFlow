import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { sign, verify, Secret } from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../../shared/prisma/client';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { AuthRequest } from '../../shared/types';
import { logAudit } from '../../shared/middleware/error.middleware';
import { success } from '../../shared/utils';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signToken = (userId: string) =>
  sign({ userId }, process.env.JWT_SECRET as Secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any
  });

const signRefreshToken = (userId: string) =>
  sign({ userId }, process.env.JWT_REFRESH_SECRET as Secret, { expiresIn: '30d' });

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        permissions: { include: { permission: true } }
      }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, error: 'Account is suspended' });
    }

    const token = signToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), refreshToken }
    });

    const rolePerms = user.role?.permissions.map(rp => `${rp.permission.module}.${rp.permission.action}`) || [];
    const userPerms = user.permissions.filter(up => up.granted).map(up => `${up.permission.module}.${up.permission.action}`);

    await logAudit({
      userId: user.id, companyId: user.companyId,
      action: 'LOGIN', module: 'AUTH', entityId: user.id,
      details: 'User logged in', ipAddress: req.ip
    });

    res.json(success({
      token, refreshToken,
      user: {
        id: user.id, email: user.email, name: user.name,
        avatar: user.avatar, role: user.role?.name,
        companyId: user.companyId,
        permissions: [...new Set([...rolePerms, ...userPerms])]
      }
    }, 'Login successful'));
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ success: false, error: 'Invalid input' });
    console.error(e);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, error: 'No refresh token' });

    const decoded = verify(refreshToken, process.env.JWT_REFRESH_SECRET as Secret) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const token = signToken(user.id);
    res.json(success({ token }));
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        employee: true,
        role: { include: { permissions: { include: { permission: true } } } }
      }
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const { password, refreshToken, ...safe } = user;
    res.json(success(safe));
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({ where: { id: req.user!.id }, data: { refreshToken: null } });
    await logAudit({ userId: req.user!.id, action: 'LOGOUT', module: 'AUTH', details: 'User logged out' });
    res.json(success(null, 'Logged out'));
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, error: 'Current password incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json(success(null, 'Password changed successfully'));
  } catch {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;


