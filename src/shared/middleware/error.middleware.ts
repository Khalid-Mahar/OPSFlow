import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../prisma/client';

// Error Handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);

  if (err.name === 'ZodError') {
    return res.status(400).json({ success: false, error: 'Validation failed', details: err.errors });
  }
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ success: false, error: `${field} already exists` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Record not found' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

// Request Logger
export const requestLogger = async (req: AuthRequest, res: Response, next: NextFunction) => {
  next();
};

// Audit Logger utility
export const logAudit = async (params: {
  userId?: string;
  companyId?: string;
  action: string;
  module: string;
  entityId?: string;
  entityType?: string;
  details?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}) => {
  try {
    await prisma.auditLog.create({ data: params as any });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
};
