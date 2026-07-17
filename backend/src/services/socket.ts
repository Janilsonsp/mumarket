import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../auth/jwt';
import { FilterMatch, MarketItem, MonitoringStatus } from '../shared/types';
import { supabase } from '../database';

export function setupSocket(io: SocketServer) {
  const authenticatedSockets = new Map<string, string>();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] Client connected: ${socket.id} (user: ${userId})`);
    
    authenticatedSockets.set(socket.id, userId);
    socket.join(`user:${userId}`);

    // Frontend sends monitoring data
    socket.on('monitoring:data', async (items: any[]) => {
      try {
        // Get user's active filters
        const { data: filters } = await supabase
          .from('filters')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (!filters || filters.length === 0) return;

        // Check each item against filters
        for (const item of items) {
          for (const filter of filters) {
            if (matchesFilter(item, filter)) {
              const match: FilterMatch = {
                id: `${filter.id}-${item.id}`,
                filterId: filter.id,
                filterName: filter.name,
                itemId: item.id,
                itemName: item.name || item.type || 'Unknown',
                matchedAt: new Date().toISOString(),
                isRead: false,
                notificationSent: false,
                priceZen: 0,
                priceDC: 0,
                priceWCoin: 0,
                priceJewel: 0,
                seller: undefined,
                imageUrl: undefined,
              };

              // Extract prices
              if (item.Prices) {
                for (const p of item.Prices) {
                  const code = (p.Currency?.code || '').toLowerCase();
                  const value = p.value || 0;
                  if (code === 'zen') match.priceZen = value;
                  else if (code === 'dc') match.priceDC = value;
                  else if (code === 'wcoin') match.priceWCoin = value;
                  else if (code === 'jewel') match.priceJewel = value;
                }
              }

              console.log(`[Socket] MATCH: "${filter.name}" -> ${item.name || item.type}`);
              socket.emit('item:match', [match]);
            }
          }
        }

        // Send items to frontend
        socket.emit('market:update', items);
      } catch (error) {
        console.error('[Socket] Error processing monitoring data:', error);
      }
    });

    socket.on('monitoring:start', (interval?: number) => {
      socket.emit('monitoring:status', { isOnline: true, pollingInterval: interval || 3000 });
    });

    socket.on('monitoring:stop', () => {
      socket.emit('monitoring:status', { isOnline: false });
    });

    socket.on('monitoring:error', (errorMessage: string) => {
      socket.emit('monitoring:status', { isOnline: true, error: errorMessage });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      authenticatedSockets.delete(socket.id);
    });
  });

  return io;
}

function matchesFilter(item: any, filter: any): boolean {
  const itemName = (item.name || item.source || '').toLowerCase();
  const itemCategory = (item.type || '').toLowerCase();
  const itemOptions = (item.options || []).map((o: string) => o.toLowerCase());

  // Check item name
  if (filter.item_name) {
    const filterName = filter.item_name.toLowerCase();
    if (!itemName.includes(filterName) && !filterName.includes(itemName)) return false;
  }

  // Check category
  if (filter.category) {
    if (!itemCategory) return false;
    const filterCat = filter.category.toLowerCase().replace(/s$/, '');
    const categoryMap: Record<string, string[]> = {
      'sword': ['sword'], 'axe': ['axe'], 'mace': ['mace'], 'spear': ['spear'],
      'bow': ['bow'], 'crossbow': ['crossbow'], 'staff': ['staff'], 'scepter': ['scepter'],
      'shield': ['shield'], 'helm': ['helm'],
      'armor': ['armor', 'armors', 'helm', 'boots', 'pants', 'gloves'],
      'pant': ['pants'], 'glove': ['gloves'], 'boot': ['boots'],
      'wing': ['wings'], 'ring': ['rings'], 'pendant': ['pendants'], 'jewel': ['jewel'],
    };
    const validTypes = categoryMap[filterCat] || [filterCat, filterCat + 's'];
    if (!validTypes.includes(itemCategory)) return false;
  }

  // Check excellent options
  if (filter.excellent_options && filter.excellent_options.length > 0) {
    const requiredOpts = filter.excellent_options.map((o: string) => o.toLowerCase());
    const matchType = filter.options_match_type || 'and';
    
    if (matchType === 'or') {
      const hasAny = requiredOpts.some((opt: string) => itemOptions.some((io: string) => io.includes(opt)));
      if (!hasAny) return false;
    } else {
      const missing = requiredOpts.filter((opt: string) => !itemOptions.some((io: string) => io.includes(opt)));
      if (missing.length > 0) return false;
    }
  }

  return true;
}

export function broadcastStatus(io: SocketServer, status: MonitoringStatus) {
  io.emit('monitoring:status', status);
}
