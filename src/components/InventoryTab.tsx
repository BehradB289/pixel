import React from 'react';
import { Item, TagKey } from '../types/game';
import { TAG_METADATA, RARITY_TIERS, TEN_ABILITIES } from '../constants/gameData';
import { renderMatrixToCanvas } from '../utils/pixelArt';
import { sounds } from '../utils/sound';

interface InventoryTabProps {
  craftedItems: Item[];
  equippedSlots: Record<TagKey, string | null>;
  itemCooldowns: Record<string, number>;
  playerPix: number;
  isCreator: boolean;
  onEquipItem: (item: Item) => void;
  onUpgradeItem: (uid: string) => void;
  onToggleShowcase: (uid: string) => void;
  onOpenGiftModal: (item: Item) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  craftedItems,
  equippedSlots,
  itemCooldowns,
  playerPix,
  isCreator,
  onEquipItem,
  onUpgradeItem,
  onToggleShowcase,
  onOpenGiftModal
}) => {
  const now = Date.now();

  return (
    <section className="space-y-4">
      {/* 10 Tag Equipment Slots Header Notice (No Multiple Items of Same Tag!) */}
      <div className="pixel-frame p-4 space-y-3">
        <div>
          <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 font-bold">
            ONE ACTIVE ITEM PER TAG RULE
          </span>
          <h2 className="text-sm sm:text-base font-black text-amber-400 mt-1">
            اسلات‌های فعال کاراکتر (ممنوعیت فعال‌سازی همزمان دو آیتم هم‌تگ)
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            طبق قوانین بازی، از هر کدام از ۱۰ تگ بازی فقط ۱ آیتم می‌تواند به صورت هم‌زمان فعال باشد. فعال‌سازی یک آیتم جدید، جایگزین آیتم قبلی همان تگ می‌شود.
          </p>
        </div>

        {/* 10 Tag Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {(Object.keys(TAG_METADATA) as TagKey[]).map((tagKey) => {
            const meta = TAG_METADATA[tagKey];
            const activeUid = equippedSlots[tagKey];
            const activeItem = craftedItems.find((i) => i.uid === activeUid);

            return (
              <div
                key={tagKey}
                className={`bg-slate-950 border-2 rounded p-2 flex flex-col justify-between ${
                  activeItem ? 'border-amber-400' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold truncate" style={{ color: meta.color }}>
                    {meta.name.split(' ')[0]}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">تگ #{tagKey}</span>
                </div>

                {activeItem ? (
                  <div>
                    <div className="text-xs font-black text-white truncate">{activeItem.name}</div>
                    <div className="text-[9px] text-emerald-400">Lv.{activeItem.level || 1} • قدرت +{activeItem.power}</div>
                    {tagKey === 'defense' && (
                      <div className="text-[8px] text-sky-300 font-bold">سپر ۱۰ روزه فعال</div>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 py-1 text-center">خالی</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Backpack Items List with Skill Explanations, Gifting & Upgrades */}
      <div className="pixel-frame p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-sm font-black text-white">کوله‌پشتی آیتم‌های شما (مهارت، ارتقا، گیفت و ویترین)</h3>
            <p className="text-[10px] text-slate-400">
              هر آیتم را می‌توانید با سرچ آیدی به دوستانتان <b>هدیه (گیفت)</b> دهید یا در ویترین عمومی به نمایش بگذارید.
            </p>
          </div>
          <span className="text-xs text-cyan-300 font-bold">تعداد: {craftedItems.length} آیتم</span>
        </div>

        {craftedItems.length === 0 ? (
          <div className="bg-slate-950 border border-dashed border-slate-800 rounded p-6 text-center text-xs text-slate-400">
            کوله‌پشتی شما خالی است! در تب «نقاشی و ساخت» آیتم‌های جدید خلق کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {craftedItems.map((item) => {
              const tier = RARITY_TIERS[item.rarity] || RARITY_TIERS.common;
              const tagMeta = TAG_METADATA[item.tag] || TAG_METADATA.weapon;
              const isEquipped = equippedSlots[item.tag] === item.uid;
              const lvl = item.level || 1;
              const upgCost = Math.max(15, Math.round(tier.floorPix * 0.4 * lvl));
              const cdUntil = itemCooldowns[item.uid] || 0;
              const cdRem = Math.max(0, Math.ceil((cdUntil - now) / 1000));

              return (
                <div
                  key={item.uid}
                  className={`bg-slate-950 border-2 rounded p-3 flex flex-col justify-between gap-2.5 ${tier.css}`}
                >
                  <div className="space-y-1.5">
                    {/* Top Row: Name, Tag & Level */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-xs">{item.name}</span>
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold">
                          Lv.{lvl}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border" style={{ color: tagMeta.color, borderColor: tagMeta.color }}>
                        تگ: {tagMeta.name.split(' ')[0]}
                      </span>
                    </div>

                    {/* Skill & Description */}
                    <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[10px] space-y-1">
                      <div className="text-amber-300 font-bold">
                        ⚡ مهارت و اسکیل: <span className="text-slate-200 font-normal">{tagMeta.skillType}</span>
                      </div>
                      <div className="text-slate-400 line-clamp-2">{item.description}</div>
                      {item.tag === 'defense' && (
                        <div className="text-sky-300 font-bold text-[9px]">
                          🛡️ سپر دفاعی ۱۰ روزه (مهار ضربات تا زمان شکستن)
                        </div>
                      )}
                    </div>

                    {/* Stats & Timeout Status */}
                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-300 pt-1">
                      <span>قدرت: <b className="text-amber-400">+{item.power}</b></span>
                      <span>تایم‌اوت پایه: <b className="text-purple-300">{item.cooldownSec}s</b></span>
                      <span>امتیاز AI: <b className="text-cyan-300">{item.aiScore || 85}%</b></span>
                    </div>

                    {cdRem > 0 && (
                      <div className="text-[10px] text-rose-400 font-bold bg-rose-950/60 p-1 rounded border border-rose-600 text-center">
                        ⏳ در حال حاضر در تایم‌اوت است ({cdRem} ثانیه باقی‌مانده)
                      </div>
                    )}
                  </div>

                  {/* Action Controls: Equip / Level Up / Gift / Showcase */}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[10px]">
                    <button
                      onClick={() => onEquipItem(item)}
                      className={`pixel-btn py-1.5 font-bold ${
                        isEquipped ? 'bg-amber-500 text-black font-black' : 'bg-cyan-700 text-white'
                      }`}
                    >
                      {isEquipped ? '✓ تجهیز شده' : 'تجهیز در اسلات'}
                    </button>

                    <button
                      onClick={() => onUpgradeItem(item.uid)}
                      disabled={!isCreator && playerPix < upgCost}
                      className="pixel-btn bg-purple-700 hover:bg-purple-600 text-white font-bold py-1.5 disabled:opacity-40"
                    >
                      ⬆️ ارتقای لول ({upgCost} PIX)
                    </button>

                    <button
                      onClick={() => onOpenGiftModal(item)}
                      className="pixel-btn bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1 flex items-center justify-center gap-1"
                    >
                      <i className="fa-solid fa-gift"></i>
                      <span>ارسال هدیه (گیفت)</span>
                    </button>

                    <button
                      onClick={() => onToggleShowcase(item.uid)}
                      className={`pixel-btn py-1 font-bold ${
                        item.showcased ? 'bg-amber-600 text-black font-black' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.showcased ? '🌟 در ویترین پروفایل' : 'افزودن به ویترین'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
