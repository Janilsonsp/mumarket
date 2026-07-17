import { Router, Response } from 'express';
import { supabase } from '../database';
import { AuthRequest, authMiddleware } from '../auth/middleware';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const filterSchema = z.object({
  name: z.string().min(1),
  itemName: z.string().optional(),
  category: z.string().optional(),
  rarity: z.string().optional(),
  level: z.number().optional(),
  ancient: z.boolean().optional(),
  excellent: z.boolean().optional(),
  excellentOptions: z.array(z.string()).optional(),
  socket: z.boolean().optional(),
  minSockets: z.number().optional(),
  luck: z.boolean().optional(),
  skill: z.boolean().optional(),
  maxPriceZen: z.number().optional(),
  maxPriceDC: z.number().optional(),
  maxPriceWCoin: z.number().optional(),
  maxPriceJewel: z.number().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { data: filters, error } = await supabase
      .from('filters')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const mapped = (filters || []).map((f: any) => ({
      id: f.id,
      userId: f.user_id,
      name: f.name,
      itemName: f.item_name,
      category: f.category,
      rarity: f.rarity,
      level: f.level,
      ancient: f.ancient,
      excellent: f.excellent,
      excellentOptions: f.excellent_options,
      socket: f.socket,
      minSockets: f.min_sockets,
      luck: f.luck,
      skill: f.skill,
      maxPriceZen: f.max_price_zen,
      maxPriceDC: f.max_price_dc,
      maxPriceWCoin: f.max_price_wcoin,
      maxPriceJewel: f.max_price_jewel,
      isActive: f.is_active,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));
    res.json(mapped);
  } catch {
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { data: filter, error } = await supabase
      .from('filters')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (error || !filter) {
      return res.status(404).json({ error: 'Filter not found' });
    }

    res.json(filter);
  } catch {
    res.status(500).json({ error: 'Failed to fetch filter' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = filterSchema.parse(req.body);
    
    const { data: filter, error } = await supabase
      .from('filters')
      .insert({
        user_id: req.userId,
        name: data.name,
        item_name: data.itemName || null,
        category: data.category || null,
        rarity: data.rarity || null,
        level: data.level || null,
        ancient: data.ancient ?? false,
        excellent: data.excellent ?? false,
        excellent_options: data.excellentOptions || [],
        socket: data.socket ?? false,
        min_sockets: data.minSockets || 0,
        luck: data.luck ?? false,
        skill: data.skill ?? false,
        max_price_zen: data.maxPriceZen || null,
        max_price_dc: data.maxPriceDC || null,
        max_price_wcoin: data.maxPriceWCoin || null,
        max_price_jewel: data.maxPriceJewel || null,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      id: filter.id,
      userId: filter.user_id,
      name: filter.name,
      itemName: filter.item_name,
      category: filter.category,
      rarity: filter.rarity,
      level: filter.level,
      ancient: filter.ancient,
      excellent: filter.excellent,
      excellentOptions: filter.excellent_options,
      socket: filter.socket,
      minSockets: filter.min_sockets,
      luck: filter.luck,
      skill: filter.skill,
      maxPriceZen: filter.max_price_zen,
      maxPriceDC: filter.max_price_dc,
      maxPriceWCoin: filter.max_price_wcoin,
      maxPriceJewel: filter.max_price_jewel,
      isActive: filter.is_active,
      createdAt: filter.created_at,
      updatedAt: filter.updated_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create filter' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = filterSchema.partial().parse(req.body);
    
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.itemName !== undefined) updateData.item_name = data.itemName;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.rarity !== undefined) updateData.rarity = data.rarity;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.ancient !== undefined) updateData.ancient = data.ancient;
    if (data.excellent !== undefined) updateData.excellent = data.excellent;
    if (data.excellentOptions !== undefined) updateData.excellent_options = data.excellentOptions;
    if (data.socket !== undefined) updateData.socket = data.socket;
    if (data.minSockets !== undefined) updateData.min_sockets = data.minSockets;
    if (data.luck !== undefined) updateData.luck = data.luck;
    if (data.skill !== undefined) updateData.skill = data.skill;
    if (data.maxPriceZen !== undefined) updateData.max_price_zen = data.maxPriceZen;
    if (data.maxPriceDC !== undefined) updateData.max_price_dc = data.maxPriceDC;
    if (data.maxPriceWCoin !== undefined) updateData.max_price_wcoin = data.maxPriceWCoin;
    if (data.maxPriceJewel !== undefined) updateData.max_price_jewel = data.maxPriceJewel;

    const { data: filter, error } = await supabase
      .from('filters')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({
      id: filter.id,
      userId: filter.user_id,
      name: filter.name,
      itemName: filter.item_name,
      category: filter.category,
      rarity: filter.rarity,
      level: filter.level,
      ancient: filter.ancient,
      excellent: filter.excellent,
      excellentOptions: filter.excellent_options,
      socket: filter.socket,
      minSockets: filter.min_sockets,
      luck: filter.luck,
      skill: filter.skill,
      maxPriceZen: filter.max_price_zen,
      maxPriceDC: filter.max_price_dc,
      maxPriceWCoin: filter.max_price_wcoin,
      maxPriceJewel: filter.max_price_jewel,
      isActive: filter.is_active,
      createdAt: filter.created_at,
      updatedAt: filter.updated_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update filter' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('filters')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.userId);

    if (error) throw error;
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete filter' });
  }
});

router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { data: filter } = await supabase
      .from('filters')
      .select('is_active')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .single();

    if (!filter) {
      return res.status(404).json({ error: 'Filter not found' });
    }

    const { data: updated, error } = await supabase
      .from('filters')
      .update({ is_active: !filter.is_active, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({
      id: updated.id,
      userId: updated.user_id,
      name: updated.name,
      itemName: updated.item_name,
      category: updated.category,
      rarity: updated.rarity,
      level: updated.level,
      ancient: updated.ancient,
      excellent: updated.excellent,
      excellentOptions: updated.excellent_options,
      socket: updated.socket,
      minSockets: updated.min_sockets,
      luck: updated.luck,
      skill: updated.skill,
      maxPriceZen: updated.max_price_zen,
      maxPriceDC: updated.max_price_dc,
      maxPriceWCoin: updated.max_price_wcoin,
      maxPriceJewel: updated.max_price_jewel,
      isActive: updated.is_active,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch {
    res.status(500).json({ error: 'Failed to toggle filter' });
  }
});

export default router;
