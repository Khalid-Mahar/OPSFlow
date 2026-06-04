import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import prisma from '../prisma/client';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = auth.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, deletedAt: null },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        permissions: { include: { permission: true } }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Build permissions list
    const rolePerms = user.role?.permissions.map(rp => `${rp.permission.module}.${rp.permission.action}`) || [];
    const userPerms = user.permissions
      .filter(up => up.granted)
      .map(up => `${up.permission.module}.${up.permission.action}`);

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.name || null,
      companyId: user.companyId,
      permissions: [...new Set([...rolePerms, ...userPerms])]
    };

    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const authorize = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const isSuperAdmin = req.user.role === 'Super Admin';
    if (isSuperAdmin) return next();

    const hasPermission = permissions.some(p => req.user!.permissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (!roles.includes(req.user.role || '')) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
  };
};
