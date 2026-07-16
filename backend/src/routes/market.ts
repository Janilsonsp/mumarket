import { Router, Response } from 'express';
import { supabase } from '../database';
import { AuthRequest, authMiddleware } from '../auth/middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const { data: items, error, count } = await supabase
      .from('market_items')
      .select('*', { count: 'exact' })
      .order('last_seen_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ items, total: count, page, limit });
  } catch {
    res.status(500).json({ error: 'Failed to fetch market items' });
  }
});

router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, category, rarity, minLevel, maxPrice } = req.query;
    
    let query = supabase
      .from('market_items')
      .select('*')
      .order('last_seen_at', { ascending: false });

    if (q) query = query.ilike('item_name', `%${q}%`);
    if (category) query = query.eq('category', category);
    if (rarity) query = query.eq('rarity', rarity);
    if (minLevel) query = query.gte('level', parseInt(minLevel as string));
    if (maxPrice) query = query.lte('price_zen', parseInt(maxPrice as string));

    const { data: items, error } = await query.limit(100);

    if (error) throw error;
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to search market items' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { data: item, error } = await supabase
      .from('market_items')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

router.get('/:id/price-history', async (req: AuthRequest, res: Response) => {
  try {
    const { data: history, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_id', req.params.id)
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

export default router;
