import { Router, Response } from 'express';
import { supabase } from '../database';
import { AuthRequest, authMiddleware } from '../auth/middleware';

const router = Router();
router.use(authMiddleware);

router.get('/matches', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const { data: matches, error, count } = await supabase
      .from('filter_matches')
      .select('*, filters!inner(user_id)', { count: 'exact' })
      .eq('filters.user_id', req.userId)
      .order('matched_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ matches, total: count, page, limit });
  } catch {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

router.get('/matches/unread', async (req: AuthRequest, res: Response) => {
  try {
    const { data: matches, error } = await supabase
      .from('filter_matches')
      .select('*, filters!inner(user_id)')
      .eq('filters.user_id', req.userId)
      .eq('is_read', false)
      .order('matched_at', { ascending: false });

    if (error) throw error;
    res.json(matches);
  } catch {
    res.status(500).json({ error: 'Failed to fetch unread matches' });
  }
});

router.patch('/matches/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('filter_matches')
      .update({ is_read: true })
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to mark match as read' });
  }
});

router.post('/matches/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const { data: userFilters } = await supabase
      .from('filters')
      .select('id')
      .eq('user_id', req.userId);

    if (!userFilters || userFilters.length === 0) {
      return res.status(204).send();
    }

    const filterIds = userFilters.map(f => f.id);

    const { error } = await supabase
      .from('filter_matches')
      .update({ is_read: true })
      .eq('is_read', false)
      .in('filter_id', filterIds);

    if (error) throw error;
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to mark all matches as read' });
  }
});

router.get('/logs', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = (page - 1) * limit;
    const type = req.query.type as string;

    let query = supabase
      .from('logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);

    const { data: logs, error, count } = await query;

    if (error) throw error;
    res.json({ logs, total: count, page, limit });
  } catch {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const { count: totalItems } = await supabase
      .from('market_items')
      .select('*', { count: 'exact', head: true });

    const { count: totalFilters } = await supabase
      .from('filters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId)
      .eq('is_active', true);

    const { count: totalMatches } = await supabase
      .from('filter_matches')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    const { data: lastItem } = await supabase
      .from('market_items')
      .select('last_seen_at')
      .order('last_seen_at', { ascending: false })
      .limit(1)
      .single();

    res.json({
      isOnline: true,
      lastUpdate: lastItem?.last_seen_at || null,
      totalItemsMonitored: totalItems || 0,
      totalFilters: totalFilters || 0,
      totalMatches: totalMatches || 0,
      pollingInterval: 3000,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
