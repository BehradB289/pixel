import React from 'react';
import { PlayerProfile } from '../types/game';
import { renderMatrixToCanvas } from '../utils/pixelArt';
import { sounds } from '../utils/sound';

interface HeaderProps {
  player: PlayerProfile;
  energy: number;
  maxEnergy: number;
  pixUsdRate: number; // starting baseline around 1000.00
  cooldownReductionPct: number;
  onOpenProfile: () => void;
  onOpenCreator: () => void;
  isCreatorUnlocked: boolean;
  discoveredMaterialsCount: number;
  onSwitchTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  energy,
  maxEnergy,
  pixUsdRate,
  cooldownReductionPct,
  onOpenProfile,
  onOpenCreator,
  isCreatorUnlocked,
  discoveredMaterialsCount,
  onSwitchTab
}) => {
  const flagCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (flagCanvasRef.current && player.flagMatrix) {
      renderMatrixToCanvas(flagCanvasRef.current, player.flagMatrix);
    }
  }, [player.flagMatrix]);

  // Real world currency conversions based on $1000 base valuation:
  // 1 USD = ~0.92 EUR, 1 USD = ~90,000 Tomans (mocked standard parity for immersion), 1 Gold Gram = ~$85
  const usdVal = pixUsdRate;
  const tomanVal = Math.round(usdVal * 92000);
  const goldGrams = (usdVal / 85).toFixed(2);

  return (
    <header className="sticky top-0 z-40 bg-[#05070d]/95 backdrop-blur-md border-b-2 border-slate-800 px-3 py-2">
      <div className="max-w-2xl mx-auto flex flex-col gap-2">

        {/* Row 1: Player Identity, Flag, Profile Trigger & Creator Lock */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="relative group focus:outline-none"
              title="ویرایش پروفایل و پرچم"
            >
              <div className="w-10 h-10 bg-slate-900 border-2 border-amber-400 rounded flex items-center justify-center p-1 shadow-md">
                <svg viewBox="0 0 8 8" className="w-7 h-7 pixel-shader">
                  <rect x="1" y="2" width="6" height="5" fill="#fbbf24" />
                  <rect x="1" y="1" width="1" height="1" fill="#f43f5e" />
                  <rect x="3" y="1" width="2" height="1" fill="#22d3ee" />
                  <rect x="6" y="1" width="1" height="1" fill="#f43f5e" />
                  <rect x="2" y="4" width="4" height="2" fill="#090d16" />
                </svg>
              </div>
              <span className="absolute -bottom-1 -left-1 bg-cyan-500 text-black text-[8px] font-black px-1 rounded">
                پروفایل
              </span>
            </button>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-pixel text-[9px] sm:text-[10px] text-amber-400">THE WORLD OF PIXAL</span>
                {isCreatorUnlocked && (
                  <span className="px-1.5 py-0.5 text-[8px] font-black bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300 text-black rounded">
                    خالق اعظم
                  </span>
                )}
                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/50 rounded">
                  شبکه جهانی آنلاین
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
                <canvas
                  ref={flagCanvasRef}
                  width="24"
                  height="16"
                  onClick={onOpenProfile}
                  className="w-6 h-4 border border-slate-600 rounded-[2px] cursor-pointer bg-slate-950"
                  title="پرچم پیکسلی شما (کلیک برای ویرایش)"
                />
                <span
                  onClick={onOpenProfile}
                  className="font-black text-white cursor-pointer hover:text-amber-300"
                >
                  {player.username}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-[9px] text-slate-400">ID: {player.userId}</span>
                <span className="text-slate-600">•</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[10px]">
                  امتیاز: <b className={`font-pixel text-[9px] ${player.rankScore < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{player.rankScore}</b>
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Audio & Secret Creator Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sounds.toggle();
              }}
              className="pixel-btn bg-slate-800 text-amber-400 px-2 py-1 text-xs"
              title="قطع/وصل صدای ۸ بیتی"
            >
              <i className="fa-solid fa-volume-high"></i>
            </button>

            {/* Secret Creator Access Button */}
            <button
              onClick={onOpenCreator}
              className={`pixel-btn px-2 py-1 text-[9px] font-black flex items-center gap-1 ${
                isCreatorUnlocked
                  ? 'bg-amber-500 text-black border-yellow-300'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-amber-300'
              }`}
              title="دسترسی خالق (قفل برای بازیکنان)"
            >
              <i className={`fa-solid ${isCreatorUnlocked ? 'fa-crown text-black' : 'fa-lock text-slate-500'}`}></i>
              <span>{isCreatorUnlocked ? 'پنل خالق' : 'ورود خالق'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Currencies & Real World Valuation ($1000 Base) */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-slate-900/95 border border-amber-500/40 rounded px-2 py-1 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400">ارز اصلی (PIX)</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-pixel text-[10px] text-amber-400">
                {isCreatorUnlocked ? '∞' : player.pix.toLocaleString()}
              </span>
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block border border-black"></span>
            </div>
          </div>

          <div className="bg-slate-900/95 border border-cyan-500/40 rounded px-2 py-1 flex flex-col justify-between">
            <span className="text-[9px] text-slate-400">گوهر کمیاب (GEM)</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-pixel text-[10px] text-cyan-400">
                {isCreatorUnlocked ? '∞' : player.gems.toLocaleString()}
              </span>
              <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400 inline-block border border-black"></span>
            </div>
          </div>

          {/* $1000 Base Valuation with Real Conversion */}
          <div
            onClick={() => onSwitchTab('market')}
            className="cursor-pointer bg-slate-900/95 border border-emerald-500/40 rounded px-2 py-1 flex flex-col justify-between"
            title={`ارزش واقعی: $${usdVal.toFixed(1)} دلار | ${tomanVal.toLocaleString()} تومان | ${goldGrams} گرم طلا`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">نرخ پایه PIX</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-pixel text-[9px] text-emerald-400">${usdVal.toFixed(0)}</span>
              <span className="text-[8px] font-mono text-cyan-300">{(tomanVal / 1000000).toFixed(1)}M ت</span>
            </div>
          </div>

          <div
            onClick={() => onSwitchTab('inventory')}
            className="cursor-pointer bg-slate-900/95 border border-purple-500/40 rounded px-2 py-1 flex flex-col justify-between"
          >
            <span className="text-[9px] text-slate-400">کاهش تایم‌اوت</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] font-bold text-purple-300">-{cooldownReductionPct}%</span>
              <i className="fa-solid fa-hourglass-half text-purple-400 text-[10px]"></i>
            </div>
          </div>
        </div>

        {/* Row 3: Rebalanced Energy & Discovery Stats */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-slate-900/90 rounded px-2 py-1 border border-slate-800">
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>انرژی عملیاتی (شارژ تدریجی):</span>
              <span className="font-mono font-bold text-amber-300">
                {isCreatorUnlocked ? '∞ / ∞' : `${energy} / ${maxEnergy}`}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 overflow-hidden rounded">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
                style={{ width: `${isCreatorUnlocked ? 100 : (energy / maxEnergy) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded px-2 py-1 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">
              مواد مکشوفه: <b className="text-cyan-300">{discoveredMaterialsCount}</b> ماده
            </span>
            <span className="text-slate-400">
              قدرت جنگی: <b className="text-amber-300">{player.power}</b>
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
