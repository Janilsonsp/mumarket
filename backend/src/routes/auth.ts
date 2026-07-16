import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../database';
import { generateTokens, verifyRefreshToken } from '../auth/jwt';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        name: data.name,
      })
      .select('id, email, name, created_at, updated_at')
      .single();

    if (error) throw error;

    const tokens = generateTokens(user);

    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    res.status(201).json({ user, ...tokens });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_approved, password_hash, created_at, updated_at')
      .eq('email', data.email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is approved (admin bypasses)
    if (user.role !== 'admin' && !user.is_approved) {
      return res.status(403).json({ error: 'Conta aguardando aprovacao pelo administrador' });
    }

    const tokens = generateTokens(user);

    await supabase.from('refresh_tokens').upsert({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, ...tokens });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    const { data: tokenRecord } = await supabase
      .from('refresh_tokens')
      .select('id')
      .eq('token', refreshToken)
      .eq('user_id', decoded.userId)
      .single();

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, created_at, updated_at')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const tokens = generateTokens(user);

    await supabase
      .from('refresh_tokens')
      .delete()
      .eq('token', refreshToken);

    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_approved, created_at, updated_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
