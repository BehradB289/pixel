import React, { useState } from 'react';
import { Item, TagKey, RarityKey } from '../types/game';
import { CREATOR_PASSCODE, TAG_METADATA, RARITY_TIERS, TEN_ABILITIES } from '../constants/gameData';
import { createPresetMatrix } from '../utils/pixelArt';
import { sounds } from '../utils/sound';

interface CreatorModalProps {
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onClose: () => void;
  onAddGodFunds: () => void;
  onUnlockAllMaterials: () => void;
  onResetCooldowns: () => void;
  onCreateGodItem: (item: Item) => void;
}

export const CreatorModal: React.FC<CreatorModalProps> = ({
  isUnlocked,
  onUnlock,
  onLock,
  onClose,
  onAddGodFunds,
  onUnlockAllMaterials,
  onResetCooldowns,
  onCreateGodItem
}) => {
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [godName, setGodName] = useState<string>('شمشیر کیهانی فرمانروا');
  const [godTag, setGodTag] = useState<TagKey>('weapon');
  const [godRarity, setGodRarity] = useState<RarityKey>('celestial');
  const [godPower, setGodPower] = useState<number>(350);
  const [godCooldownSec, setGodCooldownSec] = useState<number>(3);

  const handleVerifyPasscode = () => {
    if (passcodeInput.trim() === CREATOR_PASSCODE) {
      onUnlock();
      sounds.play('success');
    } else {
      sounds.play('error');
      alert('رمز عبور خالق نادرست است! این بخش برای بازیکنان قفل است.');
    }
  };

  const handleBuildGodItem = () => {
    const abilities: Record<string, number> = {};
    TEN_ABILITIES.forEach((a) => {
      abilities[a.id] = 80;
    });

    const godItem: Item = {
      uid: 'god_itm_' + Date.now(),
      name: godName.trim(),
      description: 'ساخته شده با قدرت مطلق خالق جهان برای آزمودن تعادل بازی.',
      tag: godTag,
      rarity: godRarity,
      level: 10,
      power: godPower,
      aiScore: 100,
      cooldownSec: godCooldownSec,
      durabilityDays: godTag === 'defense' ? 10 : undefined,
      shieldCharges: godTag === 'defense' ? 10 : undefined,
      showcased: true,
      matrix: createPresetMatrix(godTag),
      abilities,
      createdAt: Date.now()
    };

    onCreateGodItem(godItem);
    sounds.play('forge');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="pixel-frame max-w-lg w-full p-4 space-y-4 my-auto border-amber-500">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-crown text-amber-400"></i>
            <h3 className="text-sm sm:text-base font-black text-amber-400">
              {isUnlocked ? 'پنل فرمانروایی مطلق خالق (God-Mode)' : 'ورود اختصاصی خالق (قفل برای بازیکنان)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        {!isUnlocked ? (
          /* Authentication Screen */
          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 border border-rose-500/50 rounded p-3 text-slate-300 space-y-1">
              <div className="font-bold text-rose-400">🔒 دسترسی محدود:</div>
              <p className="text-[11px] text-slate-400">
                این بخش به دستور کارفرما برای بازیکنان عادی پنهان و قفل شده است. برای ورود کد دسترسی خالق را وارد کنید.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">کد امنیتی خالق:</label>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="کد ۱۰ رقمی خالق..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <button
              onClick={handleVerifyPasscode}
              className="w-full pixel-btn bg-amber-500 text-black font-black py-2.5 text-xs"
            >
              احراز هویت و بازگشایی پنل خالق
            </button>
          </div>
        ) : (
          /* Unlocked Controls */
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between bg-black/50 p-2.5 rounded border border-amber-500/40">
              <span className="text-amber-300 font-bold">فرمانروایی خالق فعال است</span>
              <button
                onClick={onLock}
                className="pixel-btn bg-rose-950 text-rose-200 border-rose-600 px-2.5 py-1 text-[10px] font-bold"
              >
                قفل کردن مجدد پنل
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onAddGodFunds}
                className="pixel-btn bg-amber-400 text-black font-black p-2 text-[10px]"
              >
                شارژ ۱,۰۰۰,۰۰۰ PIX و GEM
              </button>
              <button
                onClick={onUnlockAllMaterials}
                className="pixel-btn bg-emerald-700 text-white font-bold p-2 text-[10px]"
              >
                کشف و شارژ هر ۴۰ ماده مخفی
              </button>
              <button
                onClick={onResetCooldowns}
                className="pixel-btn bg-cyan-700 text-white font-bold p-2 text-[10px]"
              >
                صفر کردن تمام تایم‌اوت‌ها
              </button>
            </div>

            {/* Custom Item Generator */}
            <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2.5">
              <div className="font-bold text-amber-300 text-xs">خلق مستقیم آیتم سفارشی:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">نام آیتم:</label>
                  <input
                    type="text"
                    value={godName}
                    onChange={(e) => setGodName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">تگ آیتم (۱۰ تگ):</label>
                  <select
                    value={godTag}
                    onChange={(e) => setGodTag(e.target.value as TagKey)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  >
                    {Object.values(TAG_METADATA).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name.split(' ')[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">درجه کمیابی:</label>
                  <select
                    value={godRarity}
                    onChange={(e) => setGodRarity(e.target.value as RarityKey)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  >
                    {Object.values(RARITY_TIERS).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">قدرت:</label>
                  <input
                    type="number"
                    value={godPower}
                    onChange={(e) => setGodPower(parseInt(e.target.value, 10) || 100)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleBuildGodItem}
                className="w-full pixel-btn bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-2 text-xs"
              >
                تولید و افزودن به کوله‌پشتی
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
