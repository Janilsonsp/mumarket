export declare const MUDREAM_GRAPHQL_ENDPOINT = "https://mudream.online/api/graphql";
export declare const MUDREAM_MARKET_URL = "https://mudream.online/pt/market";
export declare const CATEGORIES: readonly ["Swords", "Axes", "Maces", "Spears", "Bows", "Crossbows", "Staffs", "Scepters", "Shields", "Helms", "Armors", "Pants", "Gloves", "Boots", "Wings", "Cloaks", "Rings", "Pendants", "Scrolls", "Pets", "Consumables", "Jewels", "Events", "Miscellaneous"];
export declare const RARITIES: readonly ["Normal", "Excellent", "Ancient", "Socket", "Legendary"];
export declare const EXCELLENT_OPTIONS_WEAPONS: readonly [{
    readonly value: "EXE";
    readonly label: "EXE - Excellent Damage Rate";
}, {
    readonly value: "DMGL";
    readonly label: "DMGL - Excellent Damage";
}, {
    readonly value: "DMG";
    readonly label: "DMG - Attack Damage";
}, {
    readonly value: "ASPD";
    readonly label: "ASPD - Attack Speed";
}, {
    readonly value: "RHP";
    readonly label: "RHP - HP Recovery";
}, {
    readonly value: "RMP";
    readonly label: "RMP - MP Recovery";
}];
export declare const EXCELLENT_OPTIONS_ARMOR: readonly [{
    readonly value: "MH";
    readonly label: "MH - Max HP";
}, {
    readonly value: "SD";
    readonly label: "SD - Max SD";
}, {
    readonly value: "DD";
    readonly label: "DD - Defense";
}, {
    readonly value: "REF";
    readonly label: "REF - HP Recovery Rate";
}, {
    readonly value: "DSR";
    readonly label: "DSR - Damage Decrease";
}, {
    readonly value: "ZEN";
    readonly label: "ZEN - Zen Drop Rate";
}];
export declare const WEAPON_CATEGORIES: readonly ["Swords", "Axes", "Maces", "Spears", "Bows", "Crossbows", "Staffs", "Scepters"];
export declare const ARMOR_CATEGORIES: readonly ["Shields", "Helms", "Armors", "Pants", "Gloves", "Boots", "Wings", "Cloaks"];
export declare const CURRENCY_TYPES: readonly ["Zen", "DC", "WCoin", "Jewel"];
export declare const DEFAULT_POLLING_INTERVAL = 3000;
export declare const MAX_POLLING_INTERVAL = 30000;
export declare const MIN_POLLING_INTERVAL = 1000;
export declare const CACHE_TTL = 5000;
export declare const MAX_CACHE_SIZE = 1000;
export declare const JWT_EXPIRATION = "7d";
export declare const JWT_REFRESH_EXPIRATION = "30d";
export declare const LOG_RETENTION_DAYS = 30;
export declare const MAX_LOG_ENTRIES = 10000;
//# sourceMappingURL=constants.d.ts.map