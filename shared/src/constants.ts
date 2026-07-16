export const MUDREAM_GRAPHQL_ENDPOINT = 'https://mudream.online/api/graphql';
export const MUDREAM_MARKET_URL = 'https://mudream.online/pt/market';

export const CATEGORIES = [
  'Swords',
  'Axes',
  'Maces',
  'Spears',
  'Bows',
  'Crossbows',
  'Staffs',
  'Scepters',
  'Shields',
  'Helms',
  'Armors',
  'Pants',
  'Gloves',
  'Boots',
  'Wings',
  'Cloaks',
  'Rings',
  'Pendants',
  'Scrolls',
  'Pets',
  'Consumables',
  'Jewels',
  'Events',
  'Miscellaneous',
] as const;

export const RARITIES = [
  'Normal',
  'Excellent',
  'Ancient',
  'Socket',
  'Legendary',
] as const;

export const EXCELLENT_OPTIONS_WEAPONS = [
  { value: 'EXE', label: 'EXE - Excellent Damage Rate' },
  { value: 'DMGL', label: 'DMGL - Excellent Damage' },
  { value: 'DMG', label: 'DMG - Attack Damage' },
  { value: 'ASPD', label: 'ASPD - Attack Speed' },
  { value: 'RHP', label: 'RHP - HP Recovery' },
  { value: 'RMP', label: 'RMP - MP Recovery' },
] as const;

export const EXCELLENT_OPTIONS_ARMOR = [
  { value: 'MH', label: 'MH - Max HP' },
  { value: 'SD', label: 'SD - Max SD' },
  { value: 'DD', label: 'DD - Defense' },
  { value: 'REF', label: 'REF - HP Recovery Rate' },
  { value: 'DSR', label: 'DSR - Damage Decrease' },
  { value: 'ZEN', label: 'ZEN - Zen Drop Rate' },
] as const;

export const WEAPON_CATEGORIES = [
  'Swords', 'Axes', 'Maces', 'Spears', 'Bows', 'Crossbows', 'Staffs', 'Scepters',
] as const;

export const ARMOR_CATEGORIES = [
  'Shields', 'Helms', 'Armors', 'Pants', 'Gloves', 'Boots', 'Wings', 'Cloaks',
] as const;

export const CURRENCY_TYPES = ['Zen', 'DC', 'WCoin', 'Jewel'] as const;

export const DEFAULT_POLLING_INTERVAL = 3000;
export const MAX_POLLING_INTERVAL = 30000;
export const MIN_POLLING_INTERVAL = 1000;

export const CACHE_TTL = 5000;
export const MAX_CACHE_SIZE = 1000;

export const JWT_EXPIRATION = '7d';
export const JWT_REFRESH_EXPIRATION = '30d';

export const LOG_RETENTION_DAYS = 30;
export const MAX_LOG_ENTRIES = 10000;
