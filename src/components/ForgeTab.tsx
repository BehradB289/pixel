import React, { useState, useRef, useEffect } from 'react';
import { Item, TagKey, RarityKey } from '../types/game';
import { TAG_METADATA, RARITY_TIERS, ALL_MATERIALS, TEN_ABILITIES } from '../constants/gameData';
import { STUDIO_PALETTE, createPresetMatrix, renderMatrixToCanvas } from '../utils/pixelArt';
import { inspectAndVerifyItem } from '../utils/aiInspector';
import { sounds } from '../utils/sound';

interface ForgeTabProps {
  playerPix: number;
  isCreator: boolean;
  craftedItems: Item[];
  discoveredMaterials: Record<string, number>;
  onItemCrafted: (item: Item, usedMaterials: Record<string, number>) => void;
  onItemFused: (fusedItem: Item, consumedUidA: string, consumedUidB: string) => void;
}

export const ForgeTab: React.FC<ForgeTabProps> = ({
  playerPix,
  isCreator,
  craftedItems,
  discoveredMaterials,
  onItemCrafted,
  onItemFused
}) => {
  const [forgeMode, setForgeMode] = useState<'draw' | 'fusion'>('draw');

  // Drawing Studio State
  const [pixelMatrix, setPixelMatrix] = useState<(string | null)[][]>(() => createPresetMatrix('weapon'));
  const [selectedColor, setSelectedColor] = useState<string>('#38bdf8');
  const [activeTool, setActiveTool] = useState<'pen' | 'mirror' | 'eraser'>('pen');
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [itemName, setItemName] = useState<string>('');
  const [itemTag, setItemTag] = useState<TagKey>('weapon');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [cauldron, setCauldron] = useState<Record<string, number>>({});
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<{ approved?: boolean; score?: number; reason?: string } | null>(null);

  // Fusion State
  const [fusionUidA, setFusionUidA] = useState<string>('');
  const [fusionUidB, setFusionUidB] = useState<string>('');

  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-render drawing canvas whenever matrix changes
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const cell = w / 16;

    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#0c111d' : '#111827';
        ctx.fillRect(x * cell, y * cell, cell, cell);
        const col = pixelMatrix[y] && pixelMatrix[y][x];
        if (col) {
          ctx.fillStyle = col;
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    }
  }, [pixelMatrix]);

  // Canvas drawing handler
  const handlePixelPaint = (clientX: number, clientY: number) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 16);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 16);
    if (x < 0 || x >= 16 || y < 0 || y >= 16) return;

    setPixelMatrix((prev) => {
      const copy = prev.map((r) => [...r]);
      if (activeTool === 'eraser') {
        copy[y][x] = null;
      } else if (activeTool === 'mirror') {
        copy[y][x] = selectedColor;
        copy[y][15 - x] = selectedColor;
      } else {
        copy[y][x] = selectedColor;
      }
      return copy;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    handlePixelPaint(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDown) handlePixelPaint(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsMouseDown(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsMouseDown(true);
    if (e.touches[0]) handlePixelPaint(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isMouseDown && e.touches[0]) handlePixelPaint(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Cauldron operations
  const addToCauldron = (matId: string) => {
    const owned = discoveredMaterials[matId] || 0;
    const inCauldron = cauldron[matId] || 0;
    if (!isCreator && inCauldron >= owned) {
      sounds.play('error');
      return;
    }
    setCauldron((prev) => ({ ...prev, [matId]: (prev[matId] || 0) + 1 }));
    sounds.play('mine');
  };

  const removeFromCauldron = (matId: string) => {
    setCauldron((prev) => {
      const current = prev[matId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[matId];
        return copy;
      }
      return { ...prev, [matId]: current - 1 };
    });
  };

  const clearCauldron = () => setCauldron({});

  // Cauldron analysis
  const cauldronEntries = Object.entries(cauldron).filter(([_, q]) => q > 0);
  const totalMaterialsInCauldron = cauldronEntries.reduce((sum, [_, q]) => sum + q, 0);

  const calculateCauldronStats = () => {
    if (totalMaterialsInCauldron === 0) return null;
    let weightedRankSum = 0;
    let rawValueSum = 0;
    const abilityScores: Record<string, number> = {};

    cauldronEntries.forEach(([matId, qty]) => {
      const mat = ALL_MATERIALS.find((m) => m.id === matId);
      if (!mat) return;
      const tier = RARITY_TIERS[mat.rarity];
      weightedRankSum += tier.rank * qty;
      rawValueSum += mat.baseVal * qty;
      abilityScores[mat.ability] = (abilityScores[mat.ability] || 0) + tier.rank * 7 * qty;
    });

    const avgRank = weightedRankSum / totalMaterialsInCauldron;
    const rarityKeys: RarityKey[] = ['common', 'uncommon', 'rare', 'elite', 'epic', 'legendary', 'mythic', 'celestial'];
    const chosenRarityIndex = Math.min(7, Math.max(0, Math.round(avgRank) - 1));
    const resultRarity = rarityKeys[chosenRarityIndex];
    const tierMeta = RARITY_TIERS[resultRarity];

    const finalAbilities: Record<string, number> = {};
    Object.entries(abilityScores).forEach(([abId, score]) => {
      finalAbilities[abId] = Math.min(90, Math.max(5, Math.round(score / (totalMaterialsInCauldron * 0.7))));
    });

    return {
      resultRarity,
      intrinsicValue: Math.max(tierMeta.floorPix, Math.round(rawValueSum * 1.35)),
      cooldownSec: tierMeta.cooldownBase,
      power: Math.round(rawValueSum * 0.4 + (chosenRarityIndex + 1) * 8),
      abilities: finalAbilities
    };
  };

  const cauldronStats = calculateCauldronStats();

  // Craft & Inspect with AI
  const handleCraftWithAI = async () => {
    if (!cauldronStats || totalMaterialsInCauldron < 2) {
      sounds.play('error');
      setInspectionResult({ approved: false, reason: 'حداقل ۲ واحد از مواد مکشوفه خود را وارد دیگ ساخت کنید!' });
      return;
    }

    if (!isCreator && playerPix < 15) {
      sounds.play('error');
      setInspectionResult({ approved: false, reason: 'برای چکش‌کاری و بازرسی هوشمند به ۱۵ سکه PIX نیاز دارید.' });
      return;
    }

    setIsInspecting(true);
    setInspectionResult(null);

    const verdict = await inspectAndVerifyItem({
      name: itemName,
      description: itemDescription,
      tag: itemTag,
      matrix: pixelMatrix
    });

    setIsInspecting(false);
    setInspectionResult(verdict);

    if (!verdict.approved) {
      sounds.play('error');
      return;
    }

    // Success! Create item
    const newItem: Item = {
      uid: 'itm_' + Date.now(),
      name: itemName.trim(),
      description: itemDescription.trim(),
      tag: itemTag,
      rarity: cauldronStats.resultRarity,
      level: 1,
      power: Math.round(cauldronStats.power * (verdict.score / 75)),
      aiScore: verdict.score,
      cooldownSec: cauldronStats.cooldownSec,
      durabilityDays: itemTag === 'defense' ? 10 : undefined,
      shieldCharges: itemTag === 'defense' ? (cauldronStats.resultRarity === 'legendary' || cauldronStats.resultRarity === 'mythic' ? 3 : 1) : undefined,
      showcased: craftedItems.filter((i) => i.showcased).length < 3,
      matrix: pixelMatrix.map((r) => [...r]),
      abilities: cauldronStats.abilities,
      createdAt: Date.now()
    };

    onItemCrafted(newItem, cauldron);
    setCauldron({});
    sounds.play('forge');
  };

  // Same-Tag & Same-Level Fusion Logic
  const itemA = craftedItems.find((i) => i.uid === fusionUidA);
  const eligibleItemsForB = craftedItems.filter(
    (i) => itemA && i.uid !== itemA.uid && i.tag === itemA.tag && (i.level || 1) === (itemA.level || 1)
  );
  const itemB = craftedItems.find((i) => i.uid === fusionUidB);

  // Ensure itemB is valid when itemA changes
  useEffect(() => {
    if (itemA) {
      if (!itemB || itemB.tag !== itemA.tag || (itemB.level || 1) !== (itemA.level || 1)) {
        if (eligibleItemsForB.length > 0) {
          setFusionUidB(eligibleItemsForB[0].uid);
        } else {
          setFusionUidB('');
        }
      }
    }
  }, [fusionUidA]);

  const handleExecuteFusion = () => {
    if (!itemA || !itemB) {
      sounds.play('error');
      return;
    }

    if (itemA.tag !== itemB.tag || (itemA.level || 1) !== (itemB.level || 1)) {
      sounds.play('error');
      alert('خطا: فقط آیتم‌های دارای «تگ یکسان» و «سطح برابر» قابل ادغام هستند!');
      return;
    }

    if (!isCreator && playerPix < 25) {
      sounds.play('error');
      alert('برای ادغام در کوره به ۲۵ سکه PIX نیاز دارید.');
      return;
    }

    // Merge abilities
    const mergedAbilities: Record<string, number> = { ...(itemA.abilities || {}) };
    Object.entries(itemB.abilities || {}).forEach(([abId, val]) => {
      mergedAbilities[abId] = Math.min(95, Math.round((mergedAbilities[abId] || 0) + val * 0.7));
    });

    const rankOrder: RarityKey[] = ['common', 'uncommon', 'rare', 'elite', 'epic', 'legendary', 'mythic', 'celestial'];
    const maxRankIdx = Math.max(rankOrder.indexOf(itemA.rarity), rankOrder.indexOf(itemB.rarity));
    // 50% chance of ascending rarity tier
    const ascend = Math.random() < 0.55;
    const newRarity = rankOrder[Math.min(7, ascend ? maxRankIdx + 1 : maxRankIdx)];

    const fusedItem: Item = {
      uid: 'itm_fused_' + Date.now(),
      name: `${itemA.name} [ارتقایافته +]`,
      description: `${itemA.description} (ترکیب با ${itemB.name})`,
      tag: itemA.tag,
      rarity: newRarity,
      level: (itemA.level || 1) + 1,
      power: Math.round((itemA.power + itemB.power) * 0.85),
      aiScore: Math.max(itemA.aiScore || 80, itemB.aiScore || 80),
      // 20% faster cooldown than parents
      cooldownSec: Math.max(3, Math.round(Math.min(itemA.cooldownSec, itemB.cooldownSec) * 0.8)),
      durabilityDays: itemA.tag === 'defense' ? 10 : undefined,
      shieldCharges: itemA.tag === 'defense' ? Math.min(5, (itemA.shieldCharges || 1) + 1) : undefined,
      showcased: itemA.showcased || itemB.showcased,
      matrix: itemA.matrix.map((r) => [...r]),
      abilities: mergedAbilities,
      createdAt: Date.now()
    };

    onItemFused(fusedItem, itemA.uid, itemB.uid);
    sounds.play('forge');
    setFusionUidA('');
    setFusionUidB('');
  };

  return (
    <section className="space-y-4">
      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setForgeMode('draw')}
          className={`pixel-btn py-2 text-xs font-black ${
            forgeMode === 'draw'
              ? 'bg-amber-500 text-black border-yellow-300'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          ۱. پلت نقاشی و خلق آیتم با بازرسی هوش مصنوعی
        </button>
        <button
          onClick={() => setForgeMode('fusion')}
          className={`pixel-btn py-2 text-xs font-black ${
            forgeMode === 'fusion'
              ? 'bg-purple-600 text-white border-purple-400'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          ۲. کوره ترکیب آیتم‌های هم‌تگ و هم‌سطح (Fusion)
        </button>
      </div>

      {forgeMode === 'draw' ? (
        <div className="space-y-4">
          {/* Pixel Canvas & Lore Studio */}
          <div className="pixel-frame p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 font-bold">
                  16x16 PIXEL STUDIO • AI INSPECTED
                </span>
                <h2 className="text-sm sm:text-base font-black text-white mt-1">
                  نقاشی آیتم، تعیین تگ و ثبت شناسنامه
                </h2>
              </div>
              {/* Presets */}
              <div className="flex flex-wrap gap-1">
                {(['weapon', 'defense', 'mining', 'theft', 'hex', 'chrono'] as TagKey[]).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setPixelMatrix(createPresetMatrix(tag));
                      setItemTag(tag);
                      sounds.play('mine');
                    }}
                    className="pixel-btn bg-slate-800 text-slate-200 text-[9px] px-2 py-1"
                  >
                    {TAG_METADATA[tag].name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* 16x16 Canvas Area */}
              <div className="sm:col-span-6 flex flex-col items-center">
                <div className="p-2 bg-[#05070c] border-4 border-slate-700 rounded shadow-inner">
                  <canvas
                    ref={drawCanvasRef}
                    width={256}
                    height={256}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                    className="w-56 h-56 sm:w-60 sm:h-60 cursor-crosshair touch-none bg-[#090d16]"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                  <button
                    onClick={() => setActiveTool('pen')}
                    className={`pixel-btn text-[10px] font-bold px-2.5 py-1 ${
                      activeTool === 'pen' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    قلم
                  </button>
                  <button
                    onClick={() => setActiveTool('mirror')}
                    className={`pixel-btn text-[10px] font-bold px-2.5 py-1 ${
                      activeTool === 'mirror' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    قرینه
                  </button>
                  <button
                    onClick={() => setActiveTool('eraser')}
                    className={`pixel-btn text-[10px] font-bold px-2.5 py-1 ${
                      activeTool === 'eraser' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    پاک‌کن
                  </button>
                  <button
                    onClick={() => setPixelMatrix(Array.from({ length: 16 }, () => Array(16).fill(null)))}
                    className="pixel-btn bg-rose-900 text-rose-200 text-[10px] font-bold px-2.5 py-1"
                  >
                    پاکسازی
                  </button>
                </div>
              </div>

              {/* Palette & Tag Selection & Mandatory Inputs */}
              <div className="sm:col-span-6 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">پالت رنگی پیکسل:</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {STUDIO_PALETTE.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`h-6 rounded border-2 ${
                          c === selectedColor ? 'border-white scale-110 shadow-lg' : 'border-slate-800'
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* 10 Game Tags Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">
                    تگ آیتم (یکی از ۱۰ دسته بازی):
                  </label>
                  <select
                    value={itemTag}
                    onChange={(e) => setItemTag(e.target.value as TagKey)}
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    {Object.values(TAG_METADATA).map((meta) => (
                      <option key={meta.id} value={meta.id}>
                        {meta.name} — {meta.skillType}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">{TAG_METADATA[itemTag].description}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-300 mb-1">نام دقیق آیتم (اجباری):</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="مثلاً: شمشیر گدازه سوزان"
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                    شناسنامه و کاربرد دقیق (برای بررسی هوش مصنوعی):
                  </label>
                  <textarea
                    rows={2}
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="توضیح دهید از چه رنگ‌هایی استفاده شده و مهارت این آیتم چیست..."
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cauldron & Material Engine */}
          <div className="pixel-frame p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-amber-400">دیگ مواد اولیه مکشوفه (تعیین‌کننده کمیابی و اسکیل‌ها)</h3>
                <p className="text-[10px] text-slate-400">
                  ارزش ذاتی و درصد اسکیل‌های این آیتم مستقیماً بر اساس مواد مصرفی از انبار شما محاسبه می‌شود.
                </p>
              </div>
              <button onClick={clearCauldron} className="text-[11px] text-rose-400 hover:underline">
                خالی کردن دیگ
              </button>
            </div>

            {/* Selected In Cauldron */}
            <div className="min-h-[52px] bg-slate-950 border-2 border-dashed border-slate-700 rounded p-2 flex flex-wrap items-center gap-1.5">
              {cauldronEntries.length === 0 ? (
                <span className="text-xs text-slate-500">هیچ ماده‌ای در دیگ نیست. از انبار مکشوفه در زیر اضافه کنید.</span>
              ) : (
                cauldronEntries.map(([mId, qty]) => {
                  const mat = ALL_MATERIALS.find((m) => m.id === mId);
                  if (!mat) return null;
                  const tier = RARITY_TIERS[mat.rarity];
                  return (
                    <div
                      key={mId}
                      onClick={() => removeFromCauldron(mId)}
                      className="cursor-pointer bg-slate-900 border px-2 py-1 rounded flex items-center gap-1.5 text-[11px]"
                      style={{ borderColor: tier.color }}
                      title="کلیک برای حذف ۱ واحد"
                    >
                      <span className="font-bold text-white">
                        {mat.name} <span className="text-amber-400">x{qty}</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Estimated Stats */}
            {cauldronStats && (
              <div className="bg-slate-900/95 border border-indigo-500/40 rounded p-3 text-xs space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[9px] text-slate-400">درجه کمیابی:</span>
                    <div className="font-bold text-amber-400 mt-0.5">
                      {RARITY_TIERS[cauldronStats.resultRarity].name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400">ارزش ذاتی:</span>
                    <div className="font-bold text-cyan-300 mt-0.5">{cauldronStats.intrinsicValue} PIX</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400">تایم‌اوت پایه:</span>
                    <div className="font-bold text-purple-300 mt-0.5">{cauldronStats.cooldownSec} ثانیه</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {Object.entries(cauldronStats.abilities).map(([abId, pct]) => {
                    const abMeta = TEN_ABILITIES.find((a) => a.id === abId);
                    return (
                      <div key={abId} className="flex justify-between bg-slate-950 p-1 rounded border border-slate-800">
                        <span style={{ color: abMeta?.color }}>{abMeta?.name}</span>
                        <span className="font-pixel text-amber-400">+{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Owned Materials Picker */}
            <div>
              <div className="text-xs font-bold text-slate-300 mb-1.5">انتخاب از مواد کشف‌شده در انبار شما:</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-1">
                {ALL_MATERIALS.filter((m) => (discoveredMaterials[m.id] || 0) > 0).map((mat) => {
                  const owned = discoveredMaterials[mat.id] || 0;
                  const inCauldron = cauldron[mat.id] || 0;
                  const left = isCreator ? 999 : Math.max(0, owned - inCauldron);
                  const tier = RARITY_TIERS[mat.rarity];
                  return (
                    <button
                      key={mat.id}
                      onClick={() => addToCauldron(mat.id)}
                      disabled={left === 0}
                      className={`bg-slate-950 hover:bg-slate-900 border rounded p-1.5 flex flex-col items-center text-center transition ${
                        left === 0 ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                      style={{ borderColor: tier.color }}
                    >
                      <span className="text-[10px] font-bold text-white truncate w-full">{mat.name}</span>
                      <span className="text-[8px]" style={{ color: tier.color }}>
                        {tier.name}
                      </span>
                      <span className="text-[9px] text-amber-400 font-mono mt-0.5">موجودی: {left}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inspection Feedback Box */}
            {inspectionResult && (
              <div
                className={`rounded p-3 border text-xs leading-relaxed ${
                  inspectionResult.approved
                    ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200'
                    : 'border-rose-500 bg-rose-950/70 text-rose-200'
                }`}
              >
                {inspectionResult.approved ? '✅ ' : '❌ '}
                {inspectionResult.reason}
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleCraftWithAI}
              disabled={isInspecting}
              className="w-full pixel-btn bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-black font-black py-3 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-hammer"></i>
              <span>{isInspecting ? 'در حال بررسی هوش مصنوعی...' : 'بازرسی هوشمند و ساخت نهایی (15 PIX)'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sub-View 2: SAME-TAG & SAME-LEVEL Item Fusion Chamber */
        <div className="pixel-frame p-4 space-y-4">
          <div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 font-bold">
              STRICT SAME-TAG & SAME-LEVEL RULE
            </span>
            <h2 className="text-base font-black text-white mt-1">کوره ترکیب آیتم‌ها (فقط هم‌تگ و هم‌سطح)</h2>
            <p className="text-xs text-slate-400 mt-1">
              قانون بازی: فقط دو آیتمی که دارای <b>تگ یکسان</b> (مثلاً هر دو شمشیر یا هر دو سپر) و <b>سطح برابر</b> هستند
              می‌توانند در کوره ترکیب شوند. هوش مصنوعی قدرت میانگین ارتقایافته، کاهش ۲۰ درصدی تایم‌اوت و شانس جهش به رتبه بالاتر
              را به خروجی می‌دهد.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Slot A */}
            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1">آیتم پایه اول:</label>
              <select
                value={fusionUidA}
                onChange={(e) => setFusionUidA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-2 text-xs text-white"
              >
                <option value="">انتخاب آیتم اول...</option>
                {craftedItems.map((itm) => (
                  <option key={itm.uid} value={itm.uid}>
                    {itm.name} [تگ: {TAG_METADATA[itm.tag].name.split(' ')[0]} | Lv.{itm.level || 1} |{' '}
                    {RARITY_TIERS[itm.rarity].name}]
                  </option>
                ))}
              </select>
            </div>

            {/* Slot B (Strictly same tag and same level) */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1">آیتم دوم (هم‌تگ و هم‌سطح):</label>
              <select
                value={fusionUidB}
                onChange={(e) => setFusionUidB(e.target.value)}
                disabled={!itemA}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-2 text-xs text-white"
              >
                <option value="">
                  {itemA ? 'انتخاب آیتم دوم هم‌تگ...' : 'ابتدا آیتم اول را مشخص کنید'}
                </option>
                {eligibleItemsForB.map((itm) => (
                  <option key={itm.uid} value={itm.uid}>
                    {itm.name} [تگ: {TAG_METADATA[itm.tag].name.split(' ')[0]} | Lv.{itm.level || 1} |{' '}
                    {RARITY_TIERS[itm.rarity].name}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Notice */}
          {itemA && eligibleItemsForB.length === 0 && (
            <div className="bg-rose-950/70 border border-rose-500 text-rose-200 rounded p-2.5 text-xs">
              ⚠️ هیچ آیتم دیگری با تگ «{TAG_METADATA[itemA.tag].name}» و سطح {itemA.level || 1} در کوله‌پشتی خود ندارید. برای
              ترکیب، باید یک آیتم هم‌تگ و هم‌سطح دیگر بسازید یا داشته باشید.
            </div>
          )}

          {itemA && itemB && (
            <div className="bg-slate-950 border border-purple-500/40 rounded p-3 text-xs space-y-2">
              <div className="font-bold text-emerald-400">✓ دو آیتم هم‌تگ و هم‌سطح تطبیق یافتند:</div>
              <div className="text-slate-300">
                • سطح آیتم جدید: <b className="text-amber-400">سطح {(itemA.level || 1) + 1}</b>
                <br />
                • تایم‌اوت جدید: <b className="text-purple-300">{Math.round(Math.min(itemA.cooldownSec, itemB.cooldownSec) * 0.8)} ثانیه</b> (۲۰٪ سریع‌تر)
                <br />
                • قدرت ترکیبی: <b className="text-cyan-300">+{Math.round((itemA.power + itemB.power) * 0.85)}</b>
                <br />
                • شانس ارتقای رتبه کمیابی: <b className="text-emerald-400">۵۵٪</b>
              </div>
            </div>
          )}

          <button
            onClick={handleExecuteFusion}
            disabled={!itemA || !itemB}
            className="w-full pixel-btn bg-purple-700 hover:bg-purple-600 text-white font-black py-2.5 text-xs disabled:opacity-50"
          >
            ادغام دو آیتم هم‌تگ و ارتقا به سطح بعد (25 PIX)
          </button>
        </div>
      )}
    </section>
  );
};
