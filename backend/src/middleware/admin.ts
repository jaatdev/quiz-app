import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PRIMARY_ADMIN_EMAIL, isPrimaryAdmin } from '../config/admin.config';

const prisma = new PrismaClient();

export interface AdminRequest extends Request {
  user?: any;
  isAdmin?: boolean;
  isPrimaryAdmin?: boolean;
}

/**
 * Middleware to enforce admin access
 * Automatically restores PRIMARY_ADMIN if accidentally revoked
 */
export const requireAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clerkId = req.headers['x-clerk-user-id'] as string;
    
    if (!clerkId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // AUTO-RESTORE: If primary admin was accidentally revoked, restore immediately
    if (isPrimaryAdmin(user.email) && user.role !== 'admin') {
      console.warn(`⚠️  Primary admin ${user.email} status was revoked. Auto-restoring...`);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' }
      });
      console.log(`✅ Primary admin status restored for ${user.email}`);
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = user;
    req.isAdmin = true;
    req.isPrimaryAdmin = isPrimaryAdmin(user.email);
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
