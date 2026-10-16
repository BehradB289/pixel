import React, { useRef, useEffect } from 'react';
import { PlayerProfile } from '../types/game';
import { RARITY_TIERS, TAG_METADATA } from '../constants/gameData';
import { renderMatrixToCanvas } from '../utils/pixelArt';

interface PlayerInspectModalProps {
  player: PlayerProfile | null;
  onClose: () => void;
}

export const PlayerInspectModal: React.FC<PlayerInspectModalProps> = ({
  player,
  onClose
}) => {
  const flagCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (flagCanvasRef.current && player?.flagMatrix) {
      renderMatrixToCanvas(flagCanvasRef.current, player.flagMatrix);
    }
  }, [player?.flagMatrix]);

  if (!player) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="pixel-frame max-w-md w-full p-4 space-y-3.5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <canvas
              ref={flagCanvasRef}
              width="36"
              height="24"
              className="w-9 h-6 border border-amber-400 rounded-[2px]"
            />
            <div>
              <h3 className="text-sm font-black text-white">{player.username}</h3>
              <p className="text-[10px] text-cyan-300 font-mono">ID: {player.userId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        {/* Bio */}
        <div className="bg-slate-950 p-2 rounded border border-slate-800 text-xs text-slate-300">
          «{player.bio || 'قهرمان دنیای پیکسل'}»
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <span className="text-[9px] text-slate-400">امتیاز رتبه:</span>
            <div className={`font-pixel text-xs mt-1 ${player.rankScore < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {player.rankScore}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <span className="text-[9px] text-slate-400">قدرت جنگی:</span>
            <div className="font-pixel text-xs text-amber-400 mt-1">{player.power || 12}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <span className="text-[9px] text-slate-400">سپر ۱۰ روزه:</span>
            <div className="font-bold text-sky-400 mt-1 text-[11px]">
              {player.shieldItem ? '✓ فعال' : 'فاقد سپر'}
            </div>
          </div>
        </div>

        {/* Showcased Items */}
        <div>
          <div className="text-xs font-black text-amber-400 mb-2">ویترین افتخارات و آیتم‌های این بازیکن:</div>
          {(!player.showcaseItems || player.showcaseItems.length === 0) ? (
            <div className="bg-slate-950 border border-dashed border-slate-800 rounded p-4 text-center text-xs text-slate-500">
              این بازیکن هنوز آیتمی را در ویترین عمومی خود قرار نداده است.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {player.showcaseItems.map((itm, idx) => {
                const tier = RARITY_TIERS[itm.rarity] || RARITY_TIERS.common;
                const tagMeta = TAG_METADATA[itm.tag] || TAG_METADATA.weapon;

                return (
                  <div
                    key={idx}
                    className={`bg-slate-950 border-2 rounded p-2.5 flex items-center justify-between gap-2.5 ${tier.css}`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{itm.name}</span>
                        <span className="text-[8px] px-1 rounded bg-slate-900 border" style={{ color: tagMeta.color, borderColor: tagMeta.color }}>
                          {tagMeta.name.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-amber-400 font-bold">Lv.{itm.level || 1}</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">{itm.description}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        قدرت: +{itm.power} • تایم‌اوت: {itm.cooldownSec}s • اصالت AI: {itm.aiScore || 85}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
