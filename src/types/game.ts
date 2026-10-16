export type RarityKey =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'elite'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'celestial';

export type TagKey =
  | 'weapon'    // ۱. سلاح و شمشیر جنگی
  | 'defense'   // ۲. سپر دفاعی و زره (۱۰ روزه)
  | 'mining'    // ۳. ابزار حفاری و کلنگ
  | 'theft'     // ۴. ابزار نفوذ و دزدی
  | 'hex'       // ۵. طومار افسون و طلسم
  | 'chrono'    // ۶. ساعت زمان و کاهش تایم‌اوت
  | 'alchemy'   // ۷. کاتالیزور کیمیاگری
  | 'trade'     // ۸. نشان سلطنتی تجارت
  | 'regen'     // ۹. حلقه احیا و استقامت
  | 'cosmic';   // ۱۰. بلور بخت کیهانی

export interface Item {
  uid: string;
  name: string;
  description: string;
  tag: TagKey;
  rarity: RarityKey;
  level: number;
  power: number;
  aiScore: number;
  cooldownSec: number;
  durabilityDays?: number; // for shields (e.g. 10 days)
  shieldCharges?: number;   // e.g. 1-3 hits depending on tier
  showcased?: boolean;
  matrix: (string | null)[][];
  abilities: Record<string, number>;
  createdAt?: number;
}

export interface Material {
  id: string;
  name: string;
  rarity: RarityKey;
  tag: TagKey;
  ability: string;
  baseVal: number;
  c1: string;
  c2: string;
  pattern: 'gem' | 'ingot' | 'crystal' | 'orb' | 'herb' | 'chunk';
}

export interface IncomingAttack {
  id: string;
  attackerId: string;
  attackerName: string;
  attackType: 'raid' | 'theft' | 'hex';
  itemUsedName: string;
  itemRarity: RarityKey;
  timestamp: number;
  damageScore: number;
  lootLostPix: number;
  materialLostName?: string;
  shieldBlocked: boolean;
  revenged: boolean;
}

export interface PlayerProfile {
  userId: string;
  username: string;
  bio: string;
  rankScore: number;
  pix: number;
  gems: number;
  power: number;
  defense: number;
  shieldItem?: Item | null;
  lastDamageTimestamp: number; // for 1-damage-per-day protection
  isHexed: boolean;
  flagMatrix: string[][];
  showcaseItems: Item[];
  incomingAttacks?: IncomingAttack[];
}

export interface ShopListing {
  listingId: string;
  sellerName: string;
  sellerId: string;
  pricePix: number;
  item: Item;
  flagMatrix: string[][];
  isPublicMarket: boolean;
  timestamp: number;
}

export interface GiftTransaction {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  item: Item;
  timestamp: number;
}
