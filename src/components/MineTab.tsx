import React, { useState, useEffect, useRef } from 'react';
import { RarityKey, Material } from '../types/game';
import { MINE_LAYERS, RARITY_TIERS, ALL_MATERIALS } from '../constants/gameData';
import { sounds } from '../utils/sound';

interface MineTabProps {
  energy: number;
  maxEnergy: number;
  pickaxeLevel: number;
  cooldownReductionPct: number;
  isCreator: boolean;
  isHexed: boolean;
  discoveredMaterials: Record<string, number>;
  stonesInventory: number;
  onMineSuccess: (params: {
    material: Material | null;
    isDebris: boolean;
    stoneCount: number;
    earnedPix: number;
    energyConsumed: number;
    cooldownMs: number;
  }) => void;
  onCleanseHex: () => void;
}

export const MineTab: React.FC<MineTabProps> = ({
  energy,
  pickaxeLevel,
  cooldownReductionPct,
  isCreator,
  isHexed,
  discoveredMaterials,
  stonesInventory,
  onMineSuccess,
  onCleanseHex
}) => {
  const [selectedDepth, setSelectedDepth] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<RarityKey | 'all'>('all');
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState<number>(0);
  const [lastDropMessage, setLastDropMessage] = useState<string>('روی رگه معدن ضربه بزنید. سنگ‌های عمیق نیازمند کلنگ‌های سطح بالاتر هستند!');
  const [shakeAnim, setShakeAnim] = useState<boolean>(false);

  const veinCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live timer for mining cooldown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (now < cooldownUntil) {
        setCooldownRemainingSec(Math.max(0, +((cooldownUntil - now) / 1000).toFixed(1)));
      } else {
        setCooldownRemainingSec(0);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  // Render pixel vein art depending on selected depth
  useEffect(() => {
    const canvas = veinCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 64);

    const palettes = [
      { rock: '#334155', shade: '#1e293b', gem: '#38bdf8', glow: '#fde047' },
      { rock: '#451a03', shade: '#271002', gem: '#f97316', glow: '#facc15' },
      { rock: '#0f172a', shade: '#020617', gem: '#2dd4bf', glow: '#38bdf8' },
      { rock: '#2e1065', shade: '#170736', gem: '#f43f5e', glow: '#ec4899' }
    ];
    const pal = palettes[selectedDepth] || palettes[0];

    ctx.fillStyle = pal.shade;
    ctx.fillRect(8, 16, 48, 40);
    ctx.fillStyle = pal.rock;
    ctx.fillRect(12, 12, 40, 40);
    ctx.fillRect(16, 8, 32, 44);

    ctx.fillStyle = pal.gem;
    ctx.fillRect(20, 16, 8, 8);
    ctx.fillRect(36, 24, 10, 10);
    ctx.fillRect(22, 36, 12, 8);

    ctx.fillStyle = pal.glow;
    ctx.fillRect(22, 18, 4, 4);
    ctx.fillRect(38, 26, 4, 4);
    ctx.fillRect(26, 38, 4, 4);
  }, [selectedDepth]);

  const currentLayer = MINE_LAYERS[selectedDepth];
  const hasRequiredPickaxe = pickaxeLevel >= currentLayer.minPickaxeLevel;

  // Calculate cooldown with percentage reductions and under-level penalties
  const calculateCooldownMs = (): number => {
    if (isCreator) return 200;
    let baseSec = currentLayer.baseCooldownSec;

    // Penalty if pickaxe level is lower than layer requirement
    if (pickaxeLevel < currentLayer.minPickaxeLevel) {
      const deficiency = currentLayer.minPickaxeLevel - pickaxeLevel;
      baseSec *= 1 + deficiency * 1.5; // significantly longer timeout!
    }

    // Percentage reduction from pickaxe level bonuses & chrono haste
    const pickaxeDiscount = (pickaxeLevel - 1) * 6; // -6% per pickaxe level
    const totalReductionPct = Math.min(80, cooldownReductionPct + pickaxeDiscount);

    let finalSec = baseSec * (1 - totalReductionPct / 100);
    if (isHexed) finalSec *= 1.3; // 30% penalty if hexed
    return Math.max(900, Math.round(finalSec * 1000));
  };

  const handleStrike = (e: React.MouseEvent) => {
    const now = Date.now();
    if (!isCreator && now < cooldownUntil) {
      sounds.play('error');
      return;
    }

    if (!isCreator && energy < currentLayer.energyCost) {
      sounds.play('error');
      setLastDropMessage(`انرژی ناکافی است! نیاز به ${currentLayer.energyCost} انرژی دارید.`);
      return;
    }

    // Trigger visual shake & sound
    setShakeAnim(true);
    setTimeout(() => setShakeAnim(false), 200);
    sounds.play('mine');

    const cooldownMs = calculateCooldownMs();
    if (!isCreator) {
      setCooldownUntil(now + cooldownMs);
    }

    // Drop chance logic:
    // 35% ordinary stone debris
    // 15% empty strike / dust
    // 50% secret material discovery!
    const roll = Math.random() * 100;
    let earnedPix = 0;
    if (Math.random() < 0.25 || isCreator) {
      earnedPix = 1;
    }

    if (roll < 15 && !isCreator) {
      // Empty vein!
      setLastDropMessage('رگه پوک بود! فقط گرد و غبار سنگی حاصل شد.');
      onMineSuccess({
        material: null,
        isDebris: false,
        stoneCount: 0,
        earnedPix,
        energyConsumed: currentLayer.energyCost,
        cooldownMs
      });
      return;
    }

    if (roll < 50 && !isCreator) {
      // Ordinary stone debris
      const stoneQty = 1 + Math.floor(Math.random() * 2);
      setLastDropMessage(`استخراج معمولی: +${stoneQty} واحد خرده‌سنگ معدنی خام (قابل فروش در بازار).`);
      onMineSuccess({
        material: null,
        isDebris: true,
        stoneCount: stoneQty,
        earnedPix,
        energyConsumed: currentLayer.energyCost,
        cooldownMs
      });
      return;
    }

    // Rare Material Discovery!
    // Weighted by depth
    const depthTierBoost = selectedDepth * 8;
    const tierWeights: Record<RarityKey, number> = {
      common: Math.max(5, 45 - depthTierBoost),
      uncommon: 25,
      rare: 15 + depthTierBoost * 0.4,
      elite: 8 + depthTierBoost * 0.3,
      epic: 4 + depthTierBoost * 0.2,
      legendary: 2 + depthTierBoost * 0.15,
      mythic: 0.8 + depthTierBoost * 0.08,
      celestial: selectedDepth >= 2 ? (0.2 + depthTierBoost * 0.05) : 0
    };

    const totalWeight = Object.values(tierWeights).reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    let chosenTier: RarityKey = 'common';
    for (const [tier, w] of Object.entries(tierWeights)) {
      if (r <= w) {
        chosenTier = tier as RarityKey;
        break;
      }
      r -= w;
    }

    const tierPool = ALL_MATERIALS.filter(m => m.rarity === chosenTier);
    const chosenMat = tierPool[Math.floor(Math.random() * tierPool.length)] || ALL_MATERIALS[0];

    const tierMeta = RARITY_TIERS[chosenMat.rarity];
    setLastDropMessage(`کشف ارزشمند: +1 ${chosenMat.name} (${tierMeta.name}) • ارزش پایه: ${chosenMat.baseVal} PIX`);

    onMineSuccess({
      material: chosenMat,
      isDebris: false,
      stoneCount: 0,
      earnedPix,
      energyConsumed: currentLayer.energyCost,
      cooldownMs
    });
  };

  // Filter owned materials strictly (Fog of war: hide unowned materials!)
  const ownedMaterialsList = ALL_MATERIALS.filter(m => (discoveredMaterials[m.id] || 0) > 0);
  const filteredOwnedList = ownedMaterialsList.filter(m => activeFilter === 'all' || m.rarity === activeFilter);

  return (
    <section className="space-y-4">
      {/* Active Hex Alert */}
      {isHexed && (
        <div className="pixel-frame-crimson p-2.5 flex items-center justify-between gap-2">
          <div className="text-xs text-rose-200">
            <b className="text-rose-400">طلسم افسون سیاه روی شما فعال است!</b> تایم‌اوت‌های شما ۳۰٪ افزایش یافته است.
          </div>
          <button
            onClick={onCleanseHex}
            className="pixel-btn bg-rose-500 text-black font-black text-[10px] px-2.5 py-1.5 shrink-0"
          >
            ابطال طلسم (45 PIX)
          </button>
        </div>
      )}

      {/* Main Mining Stage */}
      <div className="pixel-frame p-4 relative">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 font-bold">
              HARDCORE EXCAVATION • ۴ لایه سنگ
            </span>
            <h2 className="text-sm sm:text-base font-black text-white mt-1">حفاری سنگین معدن (کشف مواد مخفی جهان)</h2>
          </div>
          <div className="text-left">
            <div className="text-[9px] text-slate-400">وضعیت کلنگ</div>
            <div className={`font-pixel text-[10px] ${cooldownRemainingSec > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {cooldownRemainingSec > 0 ? `${cooldownRemainingSec}s خنک‌سازی` : 'آماده ضربه'}
            </div>
          </div>
        </div>

        {/* 4 Depth Layers Selection with Level Warnings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3 text-[10px]">
          {MINE_LAYERS.map((layer) => {
            const isSelected = selectedDepth === layer.depth;
            const isReqMet = pickaxeLevel >= layer.minPickaxeLevel;
            return (
              <button
                key={layer.depth}
                onClick={() => setSelectedDepth(layer.depth)}
                className={`pixel-btn py-2 px-1.5 flex flex-col items-center text-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-amber-500 text-black font-black border-yellow-300'
                    : 'bg-slate-900 text-slate-300 font-bold border-slate-700'
                }`}
              >
                <span>{layer.title.split(' ')[1]}</span>
                <span className="text-[8px] opacity-80">انرژی: {layer.energyCost}</span>
                {!isReqMet && (
                  <span className="text-[7px] text-rose-400 font-black">نیاز به کلنگ لول {layer.minPickaxeLevel}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Layer Info & Timeout Notice */}
        <div className="bg-slate-950/80 border border-slate-800 rounded p-2 mb-3 text-[11px] flex flex-wrap items-center justify-between gap-2">
          <div className="text-slate-300">
            <b className="text-amber-400">{currentLayer.title}:</b> {currentLayer.desc}
          </div>
          <div className="text-[10px] text-cyan-300">
            موجودی خرده‌سنگ خام شما: <b className="font-pixel text-amber-400">{stonesInventory}</b>
          </div>
        </div>

        {/* Central Vein Canvas & Button */}
        <div className="relative flex flex-col items-center justify-center py-5 rounded bg-gradient-to-b from-[#080b14] via-[#11192e] to-[#070a12] border-2 border-slate-800">
          <button
            onClick={handleStrike}
            disabled={cooldownRemainingSec > 0}
            className="my-3 focus:outline-none group relative"
          >
            <div
              className={`w-36 h-36 sm:w-40 sm:h-40 rounded bg-slate-900/90 border-4 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.2)] flex items-center justify-center p-3 transition-transform active:scale-95 ${
                shakeAnim ? 'strike-anim' : ''
              }`}
            >
              <canvas ref={veinCanvasRef} width="64" height="64" className="w-full h-full" />
            </div>

            {/* Cooldown Overlay */}
            {cooldownRemainingSec > 0 && (
              <div className="absolute inset-0 bg-black/85 rounded flex flex-col items-center justify-center border-2 border-rose-500">
                <i className="fa-solid fa-hourglass-half text-rose-400 text-lg animate-spin mb-1"></i>
                <span className="font-pixel text-xs text-white">{cooldownRemainingSec}s</span>
                <span className="text-[9px] text-rose-300 mt-0.5">تایم‌اوت ضربه کلنگ</span>
                {!hasRequiredPickaxe && (
                  <span className="text-[8px] text-yellow-300 mt-1">تایم طولانی‌تر به دلیل لول پایین کلنگ</span>
                )}
              </div>
            )}
          </button>

          <div className="mt-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 font-semibold text-center max-w-md">
            {lastDropMessage}
          </div>
        </div>
      </div>

      {/* Discovered Materials Vault (Strict Fog of War) */}
      <div className="pixel-frame p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-black text-amber-400">انبار مواد مکشوفه شما (مه جنگ: مواد نایافته مخفی هستند)</h3>
            <p className="text-[11px] text-slate-400">
              موادی که هنوز استخراج نکرده‌اید کاملاً پنهان هستند تا زمانی که اولین بار آن‌ها را پیدا کنید.
            </p>
          </div>
          <span className="font-pixel text-[9px] bg-slate-900 border border-slate-700 px-2.5 py-1 text-cyan-300">
            کشف‌شده: {ownedMaterialsList.length} از ۴۰
          </span>
        </div>

        {/* Rarity Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 text-[10px]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`pixel-btn px-2.5 py-1 shrink-0 ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-black font-black'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            همه دارایی‌ها
          </button>
          {(Object.keys(RARITY_TIERS) as RarityKey[]).map((tierKey) => {
            const tier = RARITY_TIERS[tierKey];
            const isSel = activeFilter === tierKey;
            return (
              <button
                key={tierKey}
                onClick={() => setActiveFilter(tierKey)}
                className={`pixel-btn px-2 py-1 shrink-0 ${
                  isSel
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-slate-800 text-slate-300'
                }`}
                style={{ color: isSel ? '#000000' : tier.color }}
              >
                {tier.name}
              </button>
            );
          })}
        </div>

        {/* Strictly Owned Materials Grid */}
        {filteredOwnedList.length === 0 ? (
          <div className="bg-slate-950/90 border border-dashed border-slate-800 rounded p-4 text-center text-xs text-slate-400">
            در این دسته هنوز ماده‌ای کشف نکرده‌اید! مواد ناشناخته در مه پنهانند و با حفاری بیشتر رونمایی می‌شوند.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredOwnedList.map((mat) => {
              const qty = discoveredMaterials[mat.id] || 0;
              const tier = RARITY_TIERS[mat.rarity];
              return (
                <div
                  key={mat.id}
                  className={`bg-slate-950/95 border-2 rounded p-2 flex items-center justify-between gap-2 ${tier.css}`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">{mat.name}</div>
                    <div className="text-[9px]" style={{ color: tier.color }}>
                      {tier.name} • ارزش: {mat.baseVal} PIX
                    </div>
                  </div>
                  <div className="font-pixel text-xs text-amber-400">x{qty}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
