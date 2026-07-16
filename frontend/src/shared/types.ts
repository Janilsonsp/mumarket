export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  is_approved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Filter {
  id: string;
  userId: string;
  name: string;
  itemName?: string;
  category?: string;
  rarity?: string;
  level?: number;
  ancient?: boolean;
  excellent?: boolean;
  excellentOptions?: string[];
  socket?: boolean;
  minSockets?: number;
  luck?: boolean;
  skill?: boolean;
  maxPriceZen?: number;
  maxPriceDC?: number;
  maxPriceWCoin?: number;
  maxPriceJewel?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketItem {
  id: string;
  listingId: string;
  itemName: string;
  name?: string;
  category: string;
  rarity: string;
  level: number;
  ancient: boolean;
  excellent: boolean;
  excellentOptions: string[];
  socket: boolean;
  socketCount: number;
  luck: boolean;
  skill: boolean;
  priceZen: number;
  priceDC: number;
  priceWCoin: number;
  priceJewel: number;
  price?: {
    zen?: number;
    dc?: number;
    wcoin?: number;
    jewel?: number;
  };
  seller: string | { name?: string; id?: string };
  imageUrl?: string;
  listedAt: string;
  lastSeenAt: string;
  firstSeenAt: string;
  appearances: number;
  rawData?: Record<string, unknown>;
}

export interface FilterMatch {
  id: string;
  filterId: string;
  filterName: string;
  itemId: string;
  itemName: string;
  matchedAt: string;
  isRead: boolean;
  notificationSent: boolean;
  priceZen?: number;
  priceDC?: number;
  priceWCoin?: number;
  priceJewel?: number;
  seller?: string;
  imageUrl?: string;
  itemUrl?: string;
}

export interface MonitoringStatus {
  isOnline: boolean;
  lastUpdate: string;
  totalItemsMonitored: number;
  totalFilters: number;
  totalMatches: number;
  pollingInterval: number;
  lastQueryTime?: number;
  error?: string;
}

export interface GraphQLQuery {
  operationName: string;
  query: string;
  variables: Record<string, unknown>;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
}

export interface PriceHistory {
  id: string;
  itemId: string;
  priceZen: number;
  priceDC: number;
  priceWCoin: number;
  priceJewel: number;
  recordedAt: string;
}

export interface LogEntry {
  id: string;
  type: 'query' | 'match' | 'error' | 'alert' | 'info';
  message: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface SocketEvents {
  'item:match': FilterMatch;
  'market:update': MarketItem[];
  'monitoring:status': MonitoringStatus;
  'filter:created': Filter;
  'filter:updated': Filter;
  'filter:deleted': string;
  'log:new': LogEntry;
}
