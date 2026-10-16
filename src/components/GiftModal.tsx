import React, { useState } from 'react';
import { Item, PlayerProfile } from '../types/game';
import { RARITY_TIERS, TAG_METADATA } from '../constants/gameData';
import { sounds } from '../utils/sound';

interface GiftModalProps {
  item: Item | null;
  allPlayers: PlayerProfile[];
  currentUserId: string;
  onClose: () => void;
  onSendGift: (recipientId: string, item: Item) => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  item,
  allPlayers,
  currentUserId,
  onClose,
  onSendGift
}) => {
  const [searchRecipientId, setSearchRecipientId] = useState<string>('');
  const [recipient, setRecipient] = useState<PlayerProfile | null>(null);

  if (!item) return null;

  const handleSearchRecipient = () => {
    const q = searchRecipientId.trim().toLowerCase();
    if (!q) return;
    if (q === currentUserId.toLowerCase()) {
      sounds.play('error');
      alert('نمی‌توانید به خودتان هدیه ارسال کنید!');
      return;
    }
    const found = allPlayers.find((p) => p.userId.toLowerCase() === q);
    if (found) {
      setRecipient(found);
      sounds.play('success');
    } else {
      sounds.play('error');
      alert(`کاربری با آیدی «${searchRecipientId}» یافت نشد.`);
    }
  };

  const handleConfirmGift = () => {
    if (!recipient) {
      sounds.play('error');
      alert('لطفاً ابتدا آیدی گیرنده را سرچ و انتخاب کنید!');
      return;
    }
    onSendGift(recipient.userId, item);
    sounds.play('gift');
    onClose();
  };

  const tier = RARITY_TIERS[item.rarity] || RARITY_TIERS.common;
  const tagMeta = TAG_METADATA[item.tag] || TAG_METADATA.weapon;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="pixel-frame max-w-md w-full p-4 space-y-3.5 my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <i className="fa-solid fa-gift text-amber-400"></i>
            <h3 className="text-sm font-black text-amber-400">ارسال هدیه پیکسلی (Gift System)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">
            &times;
          </button>
        </div>

        {/* Selected Item Summary */}
        <div className={`bg-slate-950 border-2 rounded p-2.5 text-xs ${tier.css}`}>
          <div className="flex items-center justify-between font-bold text-white mb-0.5">
            <span>{item.name} (Lv.{item.level || 1})</span>
            <span style={{ color: tier.color }}>{tier.name}</span>
          </div>
          <div className="text-[10px] text-slate-400">تگ: {tagMeta.name} • قدرت: +{item.power}</div>
        </div>

        {/* Recipient ID Search */}
        <div className="space-y-1.5 text-xs">
          <label className="block text-slate-300 font-bold">۱. جستجوی آیدی گیرنده هدیه:</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={searchRecipientId}
              onChange={(e) => setSearchRecipientId(e.target.value)}
              placeholder="مثلاً: PX_100002..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
            <button
              onClick={handleSearchRecipient}
              className="pixel-btn bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 font-bold"
            >
              یافتن گیرنده
            </button>
          </div>
        </div>

        {/* Recipient Confirmation Banner */}
        {recipient ? (
          <div className="bg-emerald-950/70 border border-emerald-500 rounded p-2.5 text-xs text-emerald-200 space-y-1">
            <div className="font-bold">✓ گیرنده تایید شد:</div>
            <div>نام: <b>{recipient.username}</b></div>
            <div className="text-[10px] text-slate-300">شناسه: {recipient.userId} • امتیاز رتبه: {recipient.rankScore}</div>
          </div>
        ) : (
          <div className="bg-slate-950 border border-dashed border-slate-800 rounded p-3 text-center text-[11px] text-slate-400">
            آیدی بازیکن مقصد را وارد کنید تا نام و مشخصات او نمایش داده شود.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onClose}
            className="pixel-btn bg-slate-800 text-slate-300 py-2 text-xs font-bold"
          >
            انصراف
          </button>
          <button
            onClick={handleConfirmGift}
            disabled={!recipient}
            className="pixel-btn bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black py-2 text-xs disabled:opacity-40"
          >
            تایید و ارسال هدیه
          </button>
        </div>
      </div>
    </div>
  );
};
