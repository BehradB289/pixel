import React, { useState, useRef, useEffect } from 'react';
import { PlayerProfile } from '../types/game';
import { STUDIO_PALETTE, createFlagPresetMatrix, renderMatrixToCanvas } from '../utils/pixelArt';
import { sounds } from '../utils/sound';

interface ProfileModalProps {
  player: PlayerProfile;
  onClose: () => void;
  onSaveProfile: (name: string, bio: string, flagMatrix: string[][]) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  player,
  onClose,
  onSaveProfile
}) => {
  const [name, setName] = useState<string>(player.username);
  const [bio, setBio] = useState<string>(player.bio || '');
  const [flagMatrix, setFlagMatrix] = useState<string[][]>(() =>
    player.flagMatrix && player.flagMatrix.length === 8
      ? player.flagMatrix.map((r) => [...r])
      : createFlagPresetMatrix('royal')
  );
  const [currentColor, setCurrentColor] = useState<string>('#facc15');
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderMatrixToCanvas(canvasRef.current, flagMatrix);
    }
  }, [flagMatrix]);

  const paintFlagAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 12);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (x < 0 || x >= 12 || y < 0 || y >= 8) return;

    setFlagMatrix((prev) => {
      const copy = prev.map((r) => [...r]);
      copy[y][x] = currentColor;
      return copy;
    });
  };

  const handleSave = () => {
    onSaveProfile(name.trim() || 'شوالیه پیکسل', bio.trim() || 'مبارز دنیای پیکسل', flagMatrix);
    sounds.play('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="pixel-frame max-w-lg w-full p-4 space-y-4 my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm sm:text-base font-black text-amber-400">
            کارگاه پرچم پیکسلی و پروفایل شخصی
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* Flag Canvas */}
          <div className="sm:col-span-6 flex flex-col items-center">
            <div className="text-xs font-bold text-cyan-300 mb-1">پرچم پیکسلی شما (۱۲×۸):</div>
            <div className="p-1.5 bg-slate-950 border-2 border-amber-400 rounded shadow-md">
              <canvas
                ref={canvasRef}
                width={192}
                height={128}
                onMouseDown={(e) => {
                  setIsMouseDown(true);
                  paintFlagAt(e.clientX, e.clientY);
                }}
                onMouseMove={(e) => {
                  if (isMouseDown) paintFlagAt(e.clientX, e.clientY);
                }}
                onMouseUp={() => setIsMouseDown(false)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setIsMouseDown(true);
                  if (e.touches[0]) paintFlagAt(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  if (isMouseDown && e.touches[0]) paintFlagAt(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchEnd={() => setIsMouseDown(false)}
                className="w-48 h-32 cursor-crosshair touch-none bg-[#090d16]"
              />
            </div>

            <div className="grid grid-cols-8 gap-1 mt-2">
              {STUDIO_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrentColor(c)}
                  className={`w-5 h-5 rounded border ${
                    c === currentColor ? 'border-white scale-110 shadow-lg' : 'border-slate-700'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>

            <div className="flex gap-1 mt-2">
              <button
                onClick={() => setFlagMatrix(createFlagPresetMatrix('iran_inspired'))}
                className="pixel-btn bg-slate-800 text-slate-200 text-[9px] px-2 py-1"
              >
                سه‌رنگ
              </button>
              <button
                onClick={() => setFlagMatrix(createFlagPresetMatrix('pirate'))}
                className="pixel-btn bg-slate-800 text-slate-200 text-[9px] px-2 py-1"
              >
                غارتگر
              </button>
              <button
                onClick={() => setFlagMatrix(createFlagPresetMatrix('cyberpunk'))}
                className="pixel-btn bg-slate-800 text-cyan-300 text-[9px] px-2 py-1"
              >
                کیهانی
              </button>
            </div>
          </div>

          {/* Form details */}
          <div className="sm:col-span-6 space-y-2.5 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-bold">نام نمایشی در جدول جهان:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold">شعار / بیوگرافی:</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="مثلاً: استاد ترکیب آیتم‌های کیهانی..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-cyan-300"
              />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-400">
              این پرچم و نام برای همه بازیکنان در جدول تاپ ۱۰ و نبردها به نمایش درمی‌آید.
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 text-xs"
        >
          ذخیره تغییرات پروفایل و پرچم
        </button>
      </div>
    </div>
  );
};
