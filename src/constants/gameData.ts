import { RarityKey, TagKey, Material, Item } from '../types/game';

export const CREATOR_PASSCODE = '6529174114';

export const TAG_METADATA: Record<TagKey, {
  id: TagKey;
  name: string;
  icon: string;
  color: string;
  description: string;
  skillType: string;
}> = {
  weapon: {
    id: 'weapon',
    name: 'سلاح و شمشیر جنگی',
    icon: 'fa-sword',
    color: '#f43f5e',
    description: 'برای غارت، حمله و شکستن سپر دفاعی رقبا. شمشیرهای لول بالا سپر لول‌های پایین را می‌شکنند.',
    skillType: 'غارت خزانه و آسیب مستقیم'
  },
  defense: {
    id: 'defense',
    name: 'سپر دفاعی و زره',
    icon: 'fa-shield-halved',
    color: '#38bdf8',
    description: 'ماندگاری ۱۰ روزه؛ تا زمانی که نشکند جلوی حملات روزانه را می‌گیرد و مانع ثبت آسیب می‌شود.',
    skillType: 'دفاع مطلق و جذب ضربات روزانه'
  },
  mining: {
    id: 'mining',
    name: 'ابزار حفاری و کلنگ',
    icon: 'fa-hammer',
    color: '#fbbf24',
    description: 'برای شکستن سنگ‌های سخت‌تر معدن و کاهش درصدی تایم‌اوت ضربات حفاری.',
    skillType: 'استخراج سنگ‌های عمیق و تسریع کار'
  },
  theft: {
    id: 'theft',
    name: 'ابزار نفوذ و دزدی',
    icon: 'fa-mask',
    color: '#4ade80',
    description: 'نفوذ شبانه به انبار مواد رقبا با سرچ آیدی و سرقت یک واحد سنگ یا متریال کمیاب.',
    skillType: 'سرقت مخفیانه مواد مکشوفه'
  },
  hex: {
    id: 'hex',
    name: 'طومار افسون و طلسم',
    icon: 'fa-scroll',
    color: '#c084fc',
    description: 'افسون سیاه برای منفی کردن امتیاز رتبه هدف و افزایش ۳۰ درصدی تایم‌اوت‌های او.',
    skillType: 'کاهش شدید امتیاز و طلسم تایم‌اوت'
  },
  chrono: {
    id: 'chrono',
    name: 'ساعت زمان و شکاف تایم‌اوت',
    icon: 'fa-hourglass-half',
    color: '#818cf8',
    description: 'کاهش درصدی کلیه تایم‌اوت‌های کوله‌پشتی، معدن، کوره و نبرد.',
    skillType: 'فشردگی زمان و خنک‌سازی سریع'
  },
  alchemy: {
    id: 'alchemy',
    name: 'کاتالیزور کیمیاگری',
    icon: 'fa-flask',
    color: '#2dd4bf',
    description: 'افزایش شانس جهش کمیابی در کوره فیوژن و کشف رگه‌های با ارزش‌تر در معدن.',
    skillType: 'ارتقای شانس ترکیب و کیمیا'
  },
  trade: {
    id: 'trade',
    name: 'نشان سلطنتی تجارت',
    icon: 'fa-coins',
    color: '#f59e0b',
    description: 'افزایش سود فروش در بازار رسمی و دریافت تخفیف کارمزد صرافی.',
    skillType: 'مغناطیس ثروت و سود بازرگانی'
  },
  regen: {
    id: 'regen',
    name: 'حلقه احیا و استقامت',
    icon: 'fa-heart-pulse',
    color: '#fb7185',
    description: 'افزایش سرعت ریکاوری انرژی و ترمیم تدریجی دوام تجهیزات.',
    skillType: 'بازیابی انرژی و استقامت'
  },
  cosmic: {
    id: 'cosmic',
    name: 'بلور بخت کیهانی',
    icon: 'fa-sun',
    color: '#ec4899',
    description: 'شانس دریافت گوهر کمیاب GEM و دریافت هدیه شگفت‌انگیز کیهانی.',
    skillType: 'افزایش شانس GEM و وقایع آسمانی'
  }
};

export const RARITY_TIERS: Record<RarityKey, {
  id: RarityKey;
  name: string;
  en: string;
  rank: number;
  color: string;
  css: string;
  floorPix: number;
  cooldownBase: number;
}> = {
  common:    { id: 'common',    name: 'معمولی',    en: 'Common',    rank: 1, color: '#94a3b8', css: 'rarity-common',    floorPix: 15,   cooldownBase: 45 },
  uncommon:  { id: 'uncommon',  name: 'غیرمعمولی', en: 'Uncommon',  rank: 2, color: '#4ade80', css: 'rarity-uncommon',  floorPix: 35,   cooldownBase: 40 },
  rare:      { id: 'rare',      name: 'کمیاب',     en: 'Rare',      rank: 3, color: '#38bdf8', css: 'rarity-rare',      floorPix: 85,   cooldownBase: 35 },
  elite:     { id: 'elite',     name: 'نخبه',      en: 'Elite',     rank: 4, color: '#2dd4bf', css: 'rarity-elite',     floorPix: 180,  cooldownBase: 30 },
  epic:      { id: 'epic',      name: 'حماسی',     en: 'Epic',      rank: 5, color: '#c084fc', css: 'rarity-epic',      floorPix: 380,  cooldownBase: 25 },
  legendary: { id: 'legendary', name: 'افسانه‌ای', en: 'Legendary', rank: 6, color: '#fbbf24', css: 'rarity-legendary', floorPix: 850,  cooldownBase: 18 },
  mythic:    { id: 'mythic',    name: 'اسطوره‌ای', en: 'Mythic',    rank: 7, color: '#f43f5e', css: 'rarity-mythic',    floorPix: 1900, cooldownBase: 12 },
  celestial: { id: 'celestial', name: 'کیهانی',    en: 'Celestial', rank: 8, color: '#f472b6', css: 'rarity-celestial', floorPix: 4200, cooldownBase: 6 }
};

export const TEN_ABILITIES = [
  { id: 'double_yield',   name: 'حفاری مضاعف',      tag: 'mining',  color: '#fbbf24' },
  { id: 'alchemy_luck',   name: 'شانس کیمیاگری',    tag: 'alchemy', color: '#22d3ee' },
  { id: 'legend_finder',  name: 'چشم افسانه‌ای',     tag: 'cosmic',  color: '#f59e0b' },
  { id: 'anti_theft',     name: 'سپر ضد سرقت',     tag: 'defense', color: '#38bdf8' },
  { id: 'shadow_heist',   name: 'پرده دزدی شبانه',  tag: 'theft',   color: '#4ade80' },
  { id: 'dark_hex',       name: 'افسون سیاه',       tag: 'hex',     color: '#c084fc' },
  { id: 'chrono_haste',   name: 'شکاف زمان',        tag: 'chrono',  color: '#818cf8' },
  { id: 'thorns_counter', name: 'زره بازتابنده',     tag: 'defense', color: '#fb7185' },
  { id: 'market_magnet',  name: 'مغناطیس بازار',     tag: 'trade',   color: '#34d399' },
  { id: 'creator_grace',  name: 'برکت کیهانی (GEM)', tag: 'cosmic',  color: '#f43f5e' }
];

// 40 Secret Materials categorized across the 10 tags
export const ALL_MATERIALS: Material[] = [
  // 1. Common
  { id: 'm01', name: 'سنگ رسوبی تیره',   rarity: 'common', tag: 'defense', ability: 'anti_theft',     baseVal: 8,   c1: '#64748b', c2: '#334155', pattern: 'chunk' },
  { id: 'm02', name: 'ذغال فشرده معدنی', rarity: 'common', tag: 'weapon',  ability: 'thorns_counter', baseVal: 10,  c1: '#334155', c2: '#0f172a', pattern: 'chunk' },
  { id: 'm03', name: 'سنگ مس خام',      rarity: 'common', tag: 'mining',  ability: 'double_yield',   baseVal: 12,  c1: '#d97706', c2: '#78350f', pattern: 'ingot' },
  { id: 'm04', name: 'کوارتز دودی',     rarity: 'common', tag: 'chrono',  ability: 'chrono_haste',   baseVal: 14,  c1: '#cbd5e1', c2: '#475569', pattern: 'crystal' },
  { id: 'm05', name: 'ریشه مرداب شب',   rarity: 'common', tag: 'hex',     ability: 'dark_hex',       baseVal: 15,  c1: '#65a30d', c2: '#365314', pattern: 'herb' },
  // 2. Uncommon
  { id: 'm06', name: 'سنگ آهن رگه‌دار',  rarity: 'uncommon', tag: 'weapon',  ability: 'thorns_counter', baseVal: 24, c1: '#94a3b8', c2: '#dc2626', pattern: 'ingot' },
  { id: 'm07', name: 'نقره مهتابی',      rarity: 'uncommon', tag: 'defense', ability: 'anti_theft',     baseVal: 28, c1: '#e2e8f0', c2: '#38bdf8', pattern: 'ingot' },
  { id: 'm08', name: 'قارچ شب‌تاب غار',  rarity: 'uncommon', tag: 'hex',     ability: 'dark_hex',       baseVal: 30, c1: '#4ade80', c2: '#065f46', pattern: 'herb' },
  { id: 'm09', name: 'کهربای جنگلی',    rarity: 'uncommon', tag: 'alchemy', ability: 'alchemy_luck',   baseVal: 34, c1: '#f59e0b', c2: '#92400e', pattern: 'gem' },
  { id: 'm10', name: 'بلور نمک سایه',   rarity: 'uncommon', tag: 'theft',   ability: 'shadow_heist',   baseVal: 38, c1: '#a7f3d0', c2: '#047857', pattern: 'crystal' },
  // 3. Rare
  { id: 'm11', name: 'شمش طلای باستانی', rarity: 'rare', tag: 'trade',   ability: 'market_magnet',  baseVal: 65, c1: '#facc15', c2: '#a16207', pattern: 'ingot' },
  { id: 'm12', name: 'یاقوت کبود قطبی',  rarity: 'rare', tag: 'defense', ability: 'anti_theft',     baseVal: 72, c1: '#38bdf8', c2: '#1d4ed8', pattern: 'gem' },
  { id: 'm13', name: 'جیوه نقره‌ای سمی',  rarity: 'rare', tag: 'theft',   ability: 'shadow_heist',   baseVal: 78, c1: '#2dd4bf', c2: '#115e59', pattern: 'orb' },
  { id: 'm14', name: 'کریستال زمان‌شکن', rarity: 'rare', tag: 'chrono',  ability: 'chrono_haste',   baseVal: 85, c1: '#818cf8', c2: '#312e81', pattern: 'crystal' },
  { id: 'm15', name: 'گوگرد آتشفشانی',  rarity: 'rare', tag: 'weapon',  ability: 'double_yield',   baseVal: 92, c1: '#fb923c', c2: '#9a3412', pattern: 'chunk' },
  // 4. Elite
  { id: 'm16', name: 'زمرد سلطنتی',      rarity: 'elite', tag: 'trade',   ability: 'market_magnet',  baseVal: 155, c1: '#10b981', c2: '#064e3b', pattern: 'gem' },
  { id: 'm17', name: 'فولاد دمشقی نخبه', rarity: 'elite', tag: 'weapon',  ability: 'thorns_counter', baseVal: 170, c1: '#2dd4bf', c2: '#0f172a', pattern: 'ingot' },
  { id: 'm18', name: 'شن ساعت ابدی',    rarity: 'elite', tag: 'chrono',  ability: 'chrono_haste',   baseVal: 185, c1: '#38bdf8', c2: '#fbbf24', pattern: 'orb' },
  { id: 'm19', name: 'گوهر کیمیای سبز',  rarity: 'elite', tag: 'alchemy', ability: 'alchemy_luck',   baseVal: 200, c1: '#4ade80', c2: '#14532d', pattern: 'gem' },
  { id: 'm20', name: 'زهر عقرب سایه',    rarity: 'elite', tag: 'theft',   ability: 'shadow_heist',   baseVal: 215, c1: '#a855f7', c2: '#1e1b4b', pattern: 'orb' },
  // 5. Epic
  { id: 'm21', name: 'فلز میتریل درخشان', rarity: 'epic', tag: 'defense', ability: 'anti_theft',     baseVal: 340, c1: '#c084fc', c2: '#6b21a8', pattern: 'ingot' },
  { id: 'm22', name: 'تیغه اوبسیدین سیاه',rarity: 'epic', tag: 'weapon',  ability: 'thorns_counter', baseVal: 365, c1: '#312e81', c2: '#a855f7', pattern: 'crystal' },
  { id: 'm23', name: 'خون اژدهای کهن',   rarity: 'epic', tag: 'mining',  ability: 'double_yield',   baseVal: 395, c1: '#ef4444', c2: '#7f1d1d', pattern: 'orb' },
  { id: 'm24', name: 'یاقوت سرخ شب',    rarity: 'epic', tag: 'theft',   ability: 'shadow_heist',   baseVal: 430, c1: '#f43f5e', c2: '#881337', pattern: 'gem' },
  { id: 'm25', name: 'غبار ستاره دنباله‌دار', rarity: 'epic', tag: 'hex', ability: 'dark_hex',      baseVal: 470, c1: '#e879f9', c2: '#4a044e', pattern: 'herb' },
  // 6. Legendary
  { id: 'm26', name: 'اوریکالکوم امپراتور', rarity: 'legendary', tag: 'weapon',  ability: 'double_yield',   baseVal: 780,  c1: '#fbbf24', c2: '#b45309', pattern: 'ingot' },
  { id: 'm27', name: 'الماس کهکشانی',   rarity: 'legendary', tag: 'mining',  ability: 'legend_finder',  baseVal: 840,  c1: '#67e8f9', c2: '#facc15', pattern: 'gem' },
  { id: 'm28', name: 'هسته آتشین ققنوس',rarity: 'legendary', tag: 'regen',   ability: 'thorns_counter', baseVal: 910,  c1: '#fb923c', c2: '#fde047', pattern: 'orb' },
  { id: 'm29', name: 'اشک فرشته محافظ', rarity: 'legendary', tag: 'defense', ability: 'anti_theft',     baseVal: 980,  c1: '#f8fafc', c2: '#38bdf8', pattern: 'crystal' },
  { id: 'm30', name: 'سنگ کیمیاگر اعظم',rarity: 'legendary', tag: 'alchemy', ability: 'alchemy_luck',   baseVal: 1060, c1: '#f43f5e', c2: '#fbbf24', pattern: 'gem' },
  // 7. Mythic
  { id: 'm31', name: 'ماده تاریک پیکسلی', rarity: 'mythic', tag: 'hex',     ability: 'dark_hex',       baseVal: 1800, c1: '#a855f7', c2: '#f43f5e', pattern: 'orb' },
  { id: 'm32', name: 'بلور شکاف زمان',  rarity: 'mythic', tag: 'chrono',  ability: 'chrono_haste',   baseVal: 1950, c1: '#22d3ee', c2: '#f43f5e', pattern: 'crystal' },
  { id: 'm33', name: 'جوهره مطلق قدرت',  rarity: 'mythic', tag: 'cosmic',  ability: 'creator_grace',  baseVal: 2150, c1: '#fde047', c2: '#f43f5e', pattern: 'gem' },
  { id: 'm34', name: 'شهاب‌سنگ ازلی',   rarity: 'mythic', tag: 'weapon',  ability: 'legend_finder',  baseVal: 2350, c1: '#fb7185', c2: '#4c0519', pattern: 'chunk' },
  { id: 'm35', name: 'تاج‌سنگ ابدیت',   rarity: 'mythic', tag: 'trade',   ability: 'market_magnet',  baseVal: 2600, c1: '#fbbf24', c2: '#ec4899', pattern: 'gem' },
  // 8. Celestial
  { id: 'm36', name: 'تکینگی کوانتومی', rarity: 'celestial', tag: 'chrono',  ability: 'chrono_haste',   baseVal: 4200, c1: '#ec4899', c2: '#38bdf8', pattern: 'orb' },
  { id: 'm37', name: 'تیغه کهکشان راه شیری', rarity: 'celestial', tag: 'weapon', ability: 'double_yield', baseVal: 4800, c1: '#f472b6', c2: '#fde047', pattern: 'crystal' },
  { id: 'm38', name: 'سپر عرش الهی',    rarity: 'celestial', tag: 'defense', ability: 'anti_theft',     baseVal: 5400, c1: '#fde047', c2: '#38bdf8', pattern: 'ingot' },
  { id: 'm39', name: 'طومار سرنوشت ازلی',rarity: 'celestial', tag: 'hex',   ability: 'dark_hex',       baseVal: 6100, c1: '#c084fc', c2: '#ec4899', pattern: 'herb' },
  { id: 'm40', name: 'تخت پادشاهی پیکسل',rarity: 'celestial', tag: 'cosmic',ability: 'creator_grace',  baseVal: 7200, c1: '#fbbf24', c2: '#f43f5e', pattern: 'gem' }
];

export const MINE_LAYERS = [
  {
    depth: 0,
    title: '۱. غار رسوبی سطحی',
    energyCost: 5,
    minPickaxeLevel: 1,
    baseCooldownSec: 2.5,
    dropRateLuck: 1.0,
    stoneName: 'خرده‌سنگ‌های رسوبی',
    desc: 'قابل استخراج با کلنگ سطح ۱. مصرف ۵ انرژی، خنک‌سازی ۲.۵ ثانیه‌ای.'
  },
  {
    depth: 1,
    title: '۲. رگه گدازه و آهن',
    energyCost: 12,
    minPickaxeLevel: 2,
    baseCooldownSec: 9.0,
    dropRateLuck: 1.4,
    stoneName: 'سنگ‌آهن گداخته',
    desc: 'نیازمند کلنگ سطح ۲ به بالا؛ اگر کلنگ لول ۱ باشد خنک‌سازی شدید (۱۰ برابر) اعمال می‌شود. مصرف ۱۲ انرژی.'
  },
  {
    depth: 2,
    title: '۳. معدن عمیق کریستال',
    energyCost: 22,
    minPickaxeLevel: 3,
    baseCooldownSec: 18.0,
    dropRateLuck: 2.2,
    stoneName: 'بلورهای الماسه',
    desc: 'سنگ‌های فوق‌متراکم کریستالی. نیازمند کلنگ سطح ۳ به بالا. مصرف ۲۲ انرژی.'
  },
  {
    depth: 3,
    title: '۴. شکاف کیهانی تاریک',
    energyCost: 38,
    minPickaxeLevel: 4,
    baseCooldownSec: 32.0,
    dropRateLuck: 3.5,
    stoneName: 'سنگ‌های رادیواکتیو کیهان',
    desc: 'سخت‌ترین سنگ‌های جهان! مصرف ۳۸ انرژی از ۱۰۰ انرژی کل، نیازمند کلنگ سطح ۴ به بالا.'
  }
];

export const INITIAL_MARKET_STONE_PRICE = 15; // PIX per basic stone unit
