"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_LOG_ENTRIES = exports.LOG_RETENTION_DAYS = exports.JWT_REFRESH_EXPIRATION = exports.JWT_EXPIRATION = exports.MAX_CACHE_SIZE = exports.CACHE_TTL = exports.MIN_POLLING_INTERVAL = exports.MAX_POLLING_INTERVAL = exports.DEFAULT_POLLING_INTERVAL = exports.CURRENCY_TYPES = exports.ARMOR_CATEGORIES = exports.WEAPON_CATEGORIES = exports.EXCELLENT_OPTIONS_ARMOR = exports.EXCELLENT_OPTIONS_WEAPONS = exports.RARITIES = exports.CATEGORIES = exports.MUDREAM_MARKET_URL = exports.MUDREAM_GRAPHQL_ENDPOINT = void 0;
exports.MUDREAM_GRAPHQL_ENDPOINT = 'https://mudream.online/api/graphql';
exports.MUDREAM_MARKET_URL = 'https://mudream.online/pt/market';
exports.CATEGORIES = [
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
];
exports.RARITIES = [
    'Normal',
    'Excellent',
    'Ancient',
    'Socket',
    'Legendary',
];
exports.EXCELLENT_OPTIONS_WEAPONS = [
    { value: 'EXE', label: 'EXE - Excellent Damage Rate' },
    { value: 'DMGL', label: 'DMGL - Excellent Damage' },
    { value: 'DMG', label: 'DMG - Attack Damage' },
    { value: 'ASPD', label: 'ASPD - Attack Speed' },
    { value: 'RHP', label: 'RHP - HP Recovery' },
    { value: 'RMP', label: 'RMP - MP Recovery' },
];
exports.EXCELLENT_OPTIONS_ARMOR = [
    { value: 'MH', label: 'MH - Max HP' },
    { value: 'SD', label: 'SD - Max SD' },
    { value: 'DD', label: 'DD - Defense' },
    { value: 'REF', label: 'REF - HP Recovery Rate' },
    { value: 'DSR', label: 'DSR - Damage Decrease' },
    { value: 'ZEN', label: 'ZEN - Zen Drop Rate' },
];
exports.WEAPON_CATEGORIES = [
    'Swords', 'Axes', 'Maces', 'Spears', 'Bows', 'Crossbows', 'Staffs', 'Scepters',
];
exports.ARMOR_CATEGORIES = [
    'Shields', 'Helms', 'Armors', 'Pants', 'Gloves', 'Boots', 'Wings', 'Cloaks',
];
exports.CURRENCY_TYPES = ['Zen', 'DC', 'WCoin', 'Jewel'];
exports.DEFAULT_POLLING_INTERVAL = 3000;
exports.MAX_POLLING_INTERVAL = 30000;
exports.MIN_POLLING_INTERVAL = 1000;
exports.CACHE_TTL = 5000;
exports.MAX_CACHE_SIZE = 1000;
exports.JWT_EXPIRATION = '7d';
exports.JWT_REFRESH_EXPIRATION = '30d';
exports.LOG_RETENTION_DAYS = 30;
exports.MAX_LOG_ENTRIES = 10000;
//# sourceMappingURL=constants.js.map