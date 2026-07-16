import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwt';
import { supabase } from '../database';

export interface AuthRequest extends Request {
  userId?: string;
  email?: string;
  userRole?: string;
  isApproved?: boolean;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export async function approvalMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('role, is_approved')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userRole = user.role;
    req.isApproved = user.is_approved;

    // Admin bypass
    if (user.role === 'admin') {
      return next();
    }

    // Check approval
    if (!user.is_approved) {
      return res.status(403).json({ error: 'Conta aguardando aprovacao pelo administrador' });
    }

    next();
  } catch {
    return res.status(500).json({ error: 'Failed to verify user status' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
}
