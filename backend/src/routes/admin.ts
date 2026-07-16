import { Router, Response } from 'express';
import { supabase } from '../database';
import { AuthRequest, authMiddleware, approvalMiddleware, adminMiddleware } from '../auth/middleware';

const router = Router();
router.use(authMiddleware);
router.use(approvalMiddleware);
router.use(adminMiddleware);

// List all users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_approved, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Approve user
router.patch('/users/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_approved: true })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject/unapprove user
router.patch('/users/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_approved: false })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Delete user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Toggle admin role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
