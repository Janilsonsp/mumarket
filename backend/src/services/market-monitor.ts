import { supabase } from '../database';
import { graphqlClient } from './graphql-client';
import { GraphQLQuery, Filter, FilterMatch } from '../shared/types';
import { DEFAULT_POLLING_INTERVAL } from '../shared/constants';
import { EventEmitter } from 'events';

export class MarketMonitor extends EventEmitter {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastQueryHash: string | null = null;
  private queryHistory: Map<string, number> = new Map();
  private seenItemIds = new Set<string>();
  private filters: Filter[] = [];

  constructor() {
    super();
  }

  start(interval: number = DEFAULT_POLLING_INTERVAL) {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`[Monitor] Starting market monitor with ${interval}ms interval`);

    this.pollingInterval = setInterval(() => {
      this.pollMarket();
    }, interval);

    // Load filters from DB
    this.loadFilters();

    this.pollMarket().catch(err => {
      console.error('[Monitor] Initial poll failed:', err);
      this.emit('monitoring:error', err.message || 'Poll failed');
    });
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    console.log('[Monitor] Market monitor stopped');
  }

  setCookie(cookie: string) {
    graphqlClient.setCookie(cookie);
  }

  refreshFilters() {
    this.loadFilters();
  }

  private async pollMarket() {
    const startTime = Date.now();

    try {
      // Search for each filter's items on the MuDream market
      const allItems: any[] = [];
      
      for (const filter of this.filters) {
        const searchTerm = filter.itemName || filter.category || '';
        if (!searchTerm) continue;

        console.log(`[Monitor] Buscando: "${searchTerm}"`);
        const items = await graphqlClient.searchItems(searchTerm);
        console.log(`[Monitor] Encontrados: ${items.length} itens`);
        
        // Add filter info to items
        items.forEach((item: any) => {
          item.filterId = filter.id;
          item.filterName = filter.name;
          item.type = this.guessCategory(item.name);
        });
        
        allItems.push(...items);
      }

      // Remove duplicates by name
      const uniqueItems = allItems.filter((item: any, i: number, arr: any[]) => 
        arr.findIndex((x: any) => x.name === item.name) === i
      );

      if (uniqueItems.length > 0) {
        console.log(`[Monitor] Total: ${uniqueItems.length} itens unicos`);
        uniqueItems.slice(0, 5).forEach((item: any) => {
          console.log(`[Monitor]   ${item.name} | cat:${item.type} | opts:[${item.options.join(',')}]`);
        });
      }

      this.emit('market:update', uniqueItems);
      this.checkMatches(uniqueItems);

    } catch (error) {
      const duration = Date.now() - startTime;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Monitor] Poll failed after ${duration}ms:`, msg.substring(0, 200));
      this.emit('monitoring:error', msg);
    }
  }

  private async loadFilters() {
    try {
      const { data } = await supabase
        .from('filters')
        .select('*')
        .eq('is_active', true);

      if (data) {
        this.filters = data.map((f: any) => ({
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
          optionsMatchType: f.options_match_type || 'and',
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
        this.filters.forEach(f => {
          const criteria = [];
          if (f.category) criteria.push(`cat:${f.category}`);
          if (f.level) criteria.push(`lv:${f.level}+`);
          if (f.maxPriceZen) criteria.push(`zen≤${f.maxPriceZen}`);
          if (f.maxPriceDC) criteria.push(`dc≤${f.maxPriceDC}`);
          console.log(`[Monitor] Filtro "${f.name}": ${criteria.join(', ') || 'sem restricoes'}`);
        });
        console.log(`[Monitor] ${this.filters.length} filtros ativos`);
      }
    } catch {
      console.log('[Monitor] Tabelas nao existem, usando filtros da memoria');
    }
  }

  private checkMatches(items: any[]) {
    let totalFound = items.length;
    let totalMatched = 0;
    const newMatches: any[] = [];

    for (const item of items) {
      for (const filter of this.filters) {
        const matchKey = `${filter.id}-${item.name}`;
        if (this.seenItemIds.has(matchKey)) continue;

        const result = this.matchesFilter(item, filter);
        if (result.match) {
          totalMatched++;
          this.seenItemIds.add(matchKey);

          const prices = item.Prices || [];
          const priceInfo = prices.map((p: any) => ({
            value: p.value,
            currency: p.Currency?.code || p.Currency?.title || '',
          }));

          const match: any = {
            id: matchKey,
            filterId: filter.id,
            filterName: filter.name,
            itemId: item.name,
            itemName: item.name,
            matchedAt: new Date().toISOString(),
            isRead: false,
            notificationSent: false,
            priceZen: 0,
            priceDC: 0,
            priceWCoin: 0,
            priceJewel: 0,
            seller: undefined,
            imageUrl: item.imageUrl || undefined,
            options: item.options || [],
            prices: priceInfo,
          };

          console.log(`[Monitor] MATCH: "${filter.name}" -> ${item.name} (opts: ${(item.options || []).join(',')})`);
          newMatches.push(match);
        }
      }
    }

    if (newMatches.length > 0) {
      this.emit('item:match', newMatches);
    }

    if (totalMatched === 0 && totalFound > 0) {
      console.log(`[Monitor] Nenhum match: ${totalFound} itens encontrados, 0 filtrados`);
    }
  }

  private extractPrices(item: any): Record<string, number> {
    const prices: Record<string, number> = {};

    if (item.Prices) {
      for (const p of item.Prices) {
        const code = (p.Currency?.code || '').toLowerCase();
        const value = p.value || 0;
        prices[code] = (prices[code] || 0) + value;
      }
    }

    return prices;
  }

  private guessCategory(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('sword') || lower.includes('blade') || lower.includes('katana')) return 'sword';
    if (lower.includes('axe') || lower.includes('halberd')) return 'axe';
    if (lower.includes('mace') || lower.includes('hammer')) return 'mace';
    if (lower.includes('spear') || lower.includes('lance')) return 'spear';
    if (lower.includes('bow') || lower.includes('crossbow')) return 'bow';
    if (lower.includes('staff') || lower.includes('wand')) return 'staff';
    if (lower.includes('scepter') || lower.includes('orb')) return 'scepter';
    if (lower.includes('shield')) return 'shield';
    if (lower.includes('helm') || lower.includes('helmet')) return 'helm';
    if (lower.includes('armor') || lower.includes('breastplate') || lower.includes('plate')) return 'armor';
    if (lower.includes('pants') || lower.includes('greaves') || lower.includes('leggings')) return 'pants';
    if (lower.includes('gloves') || lower.includes('gauntlets')) return 'gloves';
    if (lower.includes('boots') || lower.includes('shoes')) return 'boots';
    if (lower.includes('wing') || lower.includes('cloak')) return 'wings';
    if (lower.includes('ring')) return 'ring';
    if (lower.includes('pendant') || lower.includes('necklace') || lower.includes('amulet')) return 'pendant';
    if (lower.includes('jewel') || lower.includes('gem')) return 'jewel';
    return '';
  }

  private matchesFilter(item: any, filter: Filter): { match: boolean; reason?: string } {
    const itemName = (item.name || '').toLowerCase();
    const itemCategory = (item.type || '').toLowerCase();
    const itemOptions = (item.options || []).map((o: string) => o.toLowerCase());

    console.log(`[DEBUG] Checking "${item.name}" vs filter "${filter.name}" (itemName:${filter.itemName}, cat:${filter.category}, opts:${filter.excellentOptions})`);

    // Check item name
    if (filter.itemName) {
      const filterName = filter.itemName.toLowerCase();
      if (!itemName.includes(filterName) && !filterName.includes(itemName)) {
        console.log(`[DEBUG] Name FAIL: "${itemName}" vs "${filterName}"`);
        return { match: false, reason: `nome nao bate` };
      }
    }

    // Check category
    if (filter.category) {
      if (!itemCategory) {
        return { match: false, reason: `sem categoria` };
      }
      
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
      if (!validTypes.includes(itemCategory)) {
        return { match: false, reason: `categoria "${itemCategory}" nao e [${validTypes}]` };
      }
    }

    // Check excellent options
    if (filter.excellentOptions && filter.excellentOptions.length > 0) {
      const requiredOpts = filter.excellentOptions.map((o: string) => o.toLowerCase());
      const matchType = (filter as any).optionsMatchType || 'and';
      
      if (matchType === 'or') {
        // OR - any option matches
        const hasAny = requiredOpts.some((opt: string) => itemOptions.some((io: string) => io.includes(opt)));
        if (!hasAny) {
          console.log(`[DEBUG] Options OR FAIL: none of [${requiredOpts}] in [${itemOptions}]`);
          return { match: false, reason: `nenhuma option encontrada: ${requiredOpts.join(', ')}` };
        }
      } else {
        // AND - all options required (default)
        const missing = requiredOpts.filter((opt: string) => !itemOptions.some((io: string) => io.includes(opt)));
        if (missing.length > 0) {
          console.log(`[DEBUG] Options AND FAIL: missing [${missing}] from [${itemOptions}]`);
          return { match: false, reason: `options faltando: ${missing.join(', ')}` };
        }
      }
    }

    return { match: true };
  }

  private buildMarketQuery(): GraphQLQuery {
    return {
      operationName: 'GET_ALL_LOTS',
      query: `query GET_ALL_LOTS($offset: NonNegativeInt, $limit: NonNegativeInt, $sort: LotsSortInput, $filter: LotsFilterInput) {
  lots(limit: $limit, offset: $offset, sort: $sort, filter: $filter) {
    Lots {
      id
      source
      isMine
      type
      gearScore
      hasPendingCounterOffer
      Prices {
        value
        Currency {
          id
          code
          type
          title
          __typename
        }
        __typename
      }
      Currencies {
        id
        code
        type
        title
        isAvailableForLots
        __typename
      }
      __typename
    }
    Pagination {
      total
      currentPage
      nextPageExists
      __typename
    }
    __typename
  }
}`,
      variables: {
        filter: {},
        limit: 50,
        offset: 0,
        sort: {
          field: 'LOT_FIELD_UPDATED_AT',
          type: 'SORT_TYPE_DESC',
        },
      },
    };
  }

  private hashQuery(query: GraphQLQuery): string {
    return `${query.operationName}:${JSON.stringify(query.variables)}`;
  }
}

export const marketMonitor = new MarketMonitor();
