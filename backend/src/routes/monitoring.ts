import { Router, Response } from 'express';
import { supabase } from '../database';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { verifyAccessToken } from '../auth/jwt';
import { broadcastBookmarkletData } from '../shared-state';

const router = Router();

// Public endpoint for bookmarklet - accepts market data with token in body
router.post('/bookmarklet', async (req: AuthRequest, res: Response) => {
  try {
    const { token, items } = req.body;
    if (!token || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'token and items[] required' });
    }

    let userId: string;
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded.userId;
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user's active filters
    const { data: filters } = await supabase
      .from('filters')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (!filters || filters.length === 0) {
      return res.json({ matches: 0, itemsReceived: items.length });
    }

    const matches: any[] = [];

    for (const item of items) {
      for (const filter of filters) {
        const itemName = (item.name || '').toLowerCase();
        const filterItemName = (filter.item_name || '').toLowerCase();

        // Match by item name (partial match)
        if (filterItemName) {
          // Extract just the item name part (before any "+" or options)
          const cleanFilterName = filterItemName.split('+')[0].trim();
          const cleanItemName = itemName.split('+')[0].trim();
          if (!cleanItemName.includes(cleanFilterName) && !cleanFilterName.includes(cleanItemName)) continue;
        }

        // Match by category
        if (filter.category) {
          const itemCategory = (item.type || '').toLowerCase();
          const filterCat = filter.category.toLowerCase().replace(/s$/, '');
          if (itemCategory && !itemCategory.includes(filterCat) && !filterCat.includes(itemCategory)) continue;
        }

        // Note: excellent_options matching skipped - MuDream GraphQL doesn't return them

        const prices = (item.Prices || []).map((p: any) => ({
          value: p.value,
          currency: p.Currency?.code || p.Currency?.title || '',
        }));

        matches.push({
          filterId: filter.id,
          filterName: filter.name,
          itemName: item.name,
          prices,
          matchedAt: new Date().toISOString(),
        });
      }
    }

    // Broadcast items to connected clients via Socket.IO
    broadcastBookmarkletData(userId, items);

    console.log(`[Bookmarklet] User ${userId}: ${items.length} items, ${matches.length} matches`);
    res.json({ matches: matches.length, itemsReceived: items.length, details: matches });
  } catch (error) {
    console.error('[Bookmarklet] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Authenticated routes below
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

    const filterIds = userFilters.map((f: any) => f.id);

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
