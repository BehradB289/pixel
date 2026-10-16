import React, { useState } from 'react';
import { PlayerProfile, Item, IncomingAttack } from '../types/game';
import { RARITY_TIERS, TAG_METADATA } from '../constants/gameData';
import { renderMatrixToCanvas } from '../utils/pixelArt';
import { sounds } from '../utils/sound';

interface BattlefieldTabProps {
  currentPlayer: PlayerProfile;
  craftedItems: Item[];
  equippedItems: Record<string, string | null>;
  itemCooldowns: Record<string, number>;
  allPlayers: PlayerProfile[];
  incomingAttacks: IncomingAttack[];
  battleLogs: string[];
  onExecuteAttack: (params: {
    target: PlayerProfile;
    attackType: 'raid' | 'theft' | 'hex';
    selectedItem: Item;
    isRevenge?: boolean;
    revengeIncidentId?: string;
  }) => void;
  onInspectPlayer: (target: PlayerProfile) => void;
}

export const BattlefieldTab: React.FC<BattlefieldTabProps> = ({
  currentPlayer,
  craftedItems,
  equippedItems,
  itemCooldowns,
  allPlayers,
  incomingAttacks,
  battleLogs,
  onExecuteAttack,
  onInspectPlayer
}) => {
  const [searchIdInput, setSearchIdInput] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<PlayerProfile | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'arena' | 'revenge' | 'top10'>('arena');

  // Filter items matching action type
  const getEligibleItems = (action: 'raid' | 'theft' | 'hex') => {
    const requiredTag = action === 'raid' ? 'weapon' : action === 'theft' ? 'theft' : 'hex';
    return craftedItems.filter((i) => i.tag === requiredTag);
  };

  const [selectedWeaponUid, setSelectedWeaponUid] = useState<string>('');
  const [selectedTheftUid, setSelectedTheftUid] = useState<string>('');
  const [selectedHexUid, setSelectedHexUid] = useState<string>('');

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Check if target is already protected today (attacked in the last 24h)
  const isTargetProtectedToday = (target: PlayerProfile) => {
    if (!target.lastDamageTimestamp) return false;
    return now - target.lastDamageTimestamp < ONE_DAY_MS;
  };

  // 1. Search player by ID
  const handleSearchPlayer = () => {
    const q = searchIdInput.trim();
    if (!q) return;
    const found = allPlayers.find((p) => p.userId.toLowerCase() === q.toLowerCase());
    if (found) {
      setSelectedTarget(found);
      sounds.play('success');
    } else {
      sounds.play('error');
      alert(`بازیکنی با آیدی «${q}» یافت نشد. می‌توانید با بازیکنان دیگر مبارزه کنید.`);
    }
  };

  // 2. Random Matchmaking (find an eligible player who has NOT been damaged today)
  const handleFindRandomEligibleRival = () => {
    const eligiblePool = allPlayers.filter(
      (p) => p.userId !== currentPlayer.userId && !isTargetProtectedToday(p)
    );

    if (eligiblePool.length === 0) {
      sounds.play('error');
      alert('در حال حاضر تمام بازیکنان جهان سهمیه آسیب روزانه خود را دریافت کرده‌اند یا مصون هستند!');
      return;
    }

    const randomPick = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];
    setSelectedTarget(randomPick);
    sounds.play('success');
  };

  const handleAction = (type: 'raid' | 'theft' | 'hex', isRevenge = false, incidentId?: string) => {
    if (!selectedTarget) return;

    if (selectedTarget.userId === currentPlayer.userId) {
      sounds.play('error');
      alert('نمی‌توانید به خودتان اتک بزنید!');
      return;
    }

    // Daily Protection check (bypassed if it's a valid revenge!)
    if (!isRevenge && isTargetProtectedToday(selectedTarget)) {
      sounds.play('error');
      alert('این بازیکن امروز قبلاً آسیب دیده و تا فردا تحت مصونیت روزانه است!');
      return;
    }

    // Required item selection
    const uid = type === 'raid' ? selectedWeaponUid : type === 'theft' ? selectedTheftUid : selectedHexUid;
    const item = craftedItems.find((i) => i.uid === uid) || getEligibleItems(type)[0];

    if (!item) {
      sounds.play('error');
      alert(`برای انجام این عملیات باید حداقل یک آیتم با تگ «${TAG_METADATA[type === 'raid' ? 'weapon' : type === 'theft' ? 'theft' : 'hex'].name}» در کوله‌پشتی داشته باشید!`);
      return;
    }

    // Check item cooldown
    const until = itemCooldowns[item.uid] || 0;
    if (now < until) {
      const rem = Math.ceil((until - now) / 1000);
      sounds.play('error');
      alert(`این آیتم در تایم‌اوت است (${rem} ثانیه باقی‌مانده). لطفاً صبر کنید یا آیتم دیگری انتخاب کنید.`);
      return;
    }

    onExecuteAttack({
      target: selectedTarget,
      attackType: type,
      selectedItem: item,
      isRevenge,
      revengeIncidentId: incidentId
    });
  };

  // Sort Top 10 players
  const topTenPlayers = [...allPlayers]
    .sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0))
    .slice(0, 10);

  return (
    <section className="space-y-4">
      {/* Sub Tabs: Battlefield Matchmaking & Search / Revenge List / Top 10 */}
      <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('arena')}
          className={`pixel-btn py-2 ${
            activeSubTab === 'arena' ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-800 text-slate-300'
          }`}
        >
          ⚔️ میدان جنگ و سرچ آیدی
        </button>
        <button
          onClick={() => setActiveSubTab('revenge')}
          className={`pixel-btn py-2 relative ${
            activeSubTab === 'revenge' ? 'bg-amber-500 text-black border-yellow-300' : 'bg-slate-800 text-slate-300'
          }`}
        >
          <span>🔥 اتک‌های به من (انتقام)</span>
          {incomingAttacks.filter((a) => !a.revenged).length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-pixel">
              {incomingAttacks.filter((a) => !a.revenged).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('top10')}
          className={`pixel-btn py-2 ${
            activeSubTab === 'top10' ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-800 text-slate-300'
          }`}
        >
          🏆 تاپ ۱۰ جهانی
        </button>
      </div>

      {activeSubTab === 'arena' && (
        <div className="space-y-4">
          {/* Matchmaking & Search Card */}
          <div className="pixel-frame p-4 space-y-3">
            <div>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 font-bold">
                DAILY ATTACK QUOTA & ITEM-BASED STRIKE
              </span>
              <h2 className="text-sm sm:text-base font-black text-white mt-1">
                میدان نبرد، سرچ آیدی هر بازیکن و شانس روزانه
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                قانون روزانه: هر بازیکن در طول روز فقط ۱ بار می‌تواند آسیب دریافت کند (حجم تجمیعی دزدی، غارت و افسون). با سرچ آیدی یا زدن دکمه تصادفی حریف خود را انتخاب کنید!
              </p>
            </div>

            {/* Random & Search Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <button
                onClick={handleFindRandomEligibleRival}
                className="sm:col-span-5 pixel-btn bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-dice"></i>
                <span>یافتن حریف تصادفی (آماده نبرد امروز)</span>
              </button>

              <div className="sm:col-span-7 flex gap-1.5">
                <input
                  type="text"
                  value={searchIdInput}
                  onChange={(e) => setSearchIdInput(e.target.value)}
                  placeholder="جستجوی آیدی هر بازیکن (مثلاً PX_100001)..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={handleSearchPlayer}
                  className="pixel-btn bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-2 text-xs font-bold"
                >
                  سرچ
                </button>
              </div>
            </div>

            {/* Selected Target Banner */}
            {selectedTarget ? (
              <div className="bg-slate-950 border-2 border-amber-400 rounded p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-amber-400">حریف انتخاب‌شده:</span>
                    <span className="font-black text-white text-sm">{selectedTarget.username}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({selectedTarget.userId})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isTargetProtectedToday(selectedTarget) ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-bold">
                        🛡️ مصونیت روزانه فعال (امروز ضربه خورده)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600 text-[10px] font-bold">
                        🎯 آماده دریافت ضربه روزانه
                      </span>
                    )}
                    <button
                      onClick={() => onInspectPlayer(selectedTarget)}
                      className="pixel-btn bg-slate-800 text-cyan-300 text-[10px] px-2 py-1"
                    >
                      👁️ مشاهده ویترین
                    </button>
                  </div>
                </div>

                {/* Target Stats & Shield Info */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400">امتیاز هدف</span>
                    <div className="font-pixel text-amber-400 mt-0.5">{selectedTarget.rankScore}</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400">قدرت دفاعی</span>
                    <div className="font-pixel text-sky-400 mt-0.5">{selectedTarget.defense || 0}%</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-[9px] text-slate-400">سپر ۱۰ روزه فعال</span>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {selectedTarget.shieldItem ? `${selectedTarget.shieldItem.name} (دوام: ۱۰ روز)` : 'فاقد سپر'}
                    </div>
                  </div>
                </div>

                {/* Item Selection for Each Strike Type */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-bold text-slate-300">
                    انتخاب آیتم برای اتک (هر اتک آیتم را وارد تایم‌اوت می‌کند):
                  </div>

                  {/* 1. Raid with Weapon */}
                  <div className="bg-slate-900/90 border border-rose-500/40 rounded p-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-xs font-bold text-rose-400">۱. غارت و نبرد (شمشیر/سلاح):</span>
                      <select
                        value={selectedWeaponUid}
                        onChange={(e) => setSelectedWeaponUid(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        {getEligibleItems('raid').map((i) => (
                          <option key={i.uid} value={i.uid}>
                            {i.name} (Lv.{i.level || 1} | قدرت +{i.power} | تایم‌اوت {i.cooldownSec}s)
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        شمشیرهای لول بالا یا افسانه‌ای سپرهای لول ۱ را می‌شکنند و آسیب ثبت می‌کنند.
                      </p>
                    </div>
                    <button
                      onClick={() => handleAction('raid')}
                      className="pixel-btn bg-rose-700 hover:bg-rose-600 text-white font-black text-xs px-3 py-2 shrink-0"
                    >
                      ⚔️ اجرای غارت خزانه
                    </button>
                  </div>

                  {/* 2. Theft with Theft Item */}
                  <div className="bg-slate-900/90 border border-emerald-500/40 rounded p-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-xs font-bold text-emerald-400">۲. دزدی مخفیانه (خنجر/ماسک نفوذ):</span>
                      <select
                        value={selectedTheftUid}
                        onChange={(e) => setSelectedTheftUid(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        {getEligibleItems('theft').map((i) => (
                          <option key={i.uid} value={i.uid}>
                            {i.name} (Lv.{i.level || 1} | شانس نفوذ +{i.power}% | تایم‌اوت {i.cooldownSec}s)
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleAction('theft')}
                      className="pixel-btn bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-2 shrink-0"
                    >
                      🥷 سرقت ۱ واحد ماده
                    </button>
                  </div>

                  {/* 3. Hex with Hex Item */}
                  <div className="bg-slate-900/90 border border-purple-500/40 rounded p-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-xs font-bold text-purple-400">۳. طلسم افسون سیاه (طومار/اسکرول):</span>
                      <select
                        value={selectedHexUid}
                        onChange={(e) => setSelectedHexUid(e.target.value)}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        {getEligibleItems('hex').map((i) => (
                          <option key={i.uid} value={i.uid}>
                            {i.name} (Lv.{i.level || 1} | قدرت طلسم +{i.power} | تایم‌اوت {i.cooldownSec}s)
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleAction('hex')}
                      className="pixel-btn bg-purple-700 hover:bg-purple-600 text-white font-black text-xs px-3 py-2 shrink-0"
                    >
                      ☠️ اعمال افسون سیاه
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded p-4 text-center text-xs text-slate-400">
                یک حریف را با کلیک روی «یافتن حریف تصادفی» یا جستجوی آیدی او مشخص کنید تا دکمه‌های نبرد فعال شوند.
              </div>
            )}
          </div>

          {/* Live Global Combat & Server Log */}
          <div className="pixel-frame p-4">
            <h3 className="text-xs font-black text-slate-300 mb-2">وقایع‌نگار زنده نبردها و افسون‌های سرور:</h3>
            <div className="space-y-1.5 text-[11px] max-h-40 overflow-y-auto">
              {battleLogs.map((log, idx) => (
                <div key={idx} className="bg-slate-950/90 border-r-2 border-amber-400 px-2.5 py-1.5 rounded text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REVENGE LIST (اتک‌های به من) */}
      {activeSubTab === 'revenge' && (
        <div className="pixel-frame p-4 space-y-3">
          <div>
            <h3 className="text-sm font-black text-amber-400">لیست اتک‌های دریافتی به شما و سیستم انتقام</h3>
            <p className="text-[11px] text-slate-400">
              قانون انتقام: شما می‌توانید در هر زمان که اراده کردید از مهاجم خود <b>انتقام</b> بگیرید؛ حتی اگر او امروز اتک خورده باشد! هر ضربه دریافتی دقیقاً ۱ بار فرصت انتقام دارد.
            </p>
          </div>

          {incomingAttacks.length === 0 ? (
            <div className="bg-slate-950 border border-dashed border-slate-800 rounded p-6 text-center text-xs text-slate-400">
              🛡️ هیچ اتکی به شما ثبت نشده است! شما در امنیت کامل به سر می‌برید.
            </div>
          ) : (
            <div className="space-y-2">
              {incomingAttacks.map((att) => {
                const targetPlayer = allPlayers.find((p) => p.userId === att.attackerId) || {
                  userId: att.attackerId,
                  username: att.attackerName,
                  bio: 'مهاجم',
                  rankScore: 100,
                  pix: 50,
                  gems: 1,
                  power: 15,
                  defense: 10,
                  lastDamageTimestamp: 0,
                  isHexed: false,
                  flagMatrix: [],
                  showcaseItems: []
                };

                return (
                  <div
                    key={att.id}
                    className="bg-slate-950 border-2 border-rose-500/50 rounded p-3 flex flex-wrap items-center justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-rose-400 font-bold text-xs">{att.attackerName}</span>
                        <span className="font-mono text-[9px] text-slate-400">({att.attackerId})</span>
                        <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded text-[9px] text-cyan-300">
                          {att.attackType === 'raid' ? '⚔️ غارت' : att.attackType === 'theft' ? '🥷 دزدی' : '☠️ افسون'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        با آیتم: <b className="text-amber-400">{att.itemUsedName}</b> • خسارت: {att.damageScore} امتیاز • غنیمت از دست رفته: {att.lootLostPix} PIX
                        {att.shieldBlocked && <span className="text-sky-300 font-bold"> (سپر ضربه را مهار کرد!)</span>}
                      </div>
                    </div>

                    <div>
                      {att.revenged ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          ✓ انتقام گرفته شد
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTarget(targetPlayer);
                            handleAction('raid', true, att.id);
                          }}
                          className="pixel-btn bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs px-3 py-1.5"
                        >
                          🔥 گرفتن انتقام (فوری)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: TOP 10 PLAYERS */}
      {activeSubTab === 'top10' && (
        <div className="pixel-frame p-4 space-y-3">
          <div>
            <h3 className="text-sm font-black text-amber-400">جدول ۱۰ قهرمان برتر جهان (فقط بازیکنان واقعی ثبت‌شده)</h3>
            <p className="text-[10px] text-slate-400">روی هر بازیکن کلیک کنید تا ویترین افتخارات و پرچم او را ببینید یا با آیدی او نبرد کنید.</p>
          </div>

          <div className="space-y-2">
            {topTenPlayers.map((p, idx) => {
              const isMe = p.userId === currentPlayer.userId;
              return (
                <div
                  key={p.userId}
                  className={`bg-slate-950 border-2 ${
                    isMe ? 'border-amber-400' : 'border-slate-800'
                  } rounded p-2.5 flex flex-wrap items-center justify-between gap-2`}
                >
                  <div
                    onClick={() => onInspectPlayer(p)}
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-90"
                  >
                    <span className="font-pixel text-xs text-amber-400 w-5">#{idx + 1}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-xs">{p.username}</span>
                        {isMe && <span className="text-[8px] bg-amber-400 text-black px-1 rounded font-bold">شما</span>}
                        <span className="text-[10px] font-mono text-slate-400">ID: {p.userId}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        امتیاز: <b className="text-emerald-400">{p.rankScore}</b> • قدرت: <b className="text-amber-400">{p.power}</b> • سپر: {p.shieldItem ? 'دارد' : 'ندارد'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onInspectPlayer(p)}
                      className="pixel-btn bg-slate-800 text-cyan-300 text-[10px] px-2 py-1"
                    >
                      ویترین
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => {
                          setSelectedTarget(p);
                          setActiveSubTab('arena');
                        }}
                        className="pixel-btn bg-rose-700 text-white text-[10px] px-2 py-1 font-bold"
                      >
                        انتخاب برای نبرد
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
