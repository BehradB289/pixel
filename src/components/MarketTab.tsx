import React, { useState, useRef, useEffect } from 'react';
import { Item, ShopListing, RarityKey } from '../types/game';
import { RARITY_TIERS, TAG_METADATA } from '../constants/gameData';
import { renderMatrixToCanvas } from '../utils/pixelArt';
import { sounds } from '../utils/sound';

interface MarketTabProps {
  playerPix: number;
  playerGems: number;
  stonesInventory: number;
  craftedItems: Item[];
  pixUsdRate: number;
  rateHistory: number[];
  officialStonePrice: number;
  gemPixRate: number;
  publicListings: ShopListing[];
  isCreator: boolean;
  onBuyStones: (amount: number) => void;
  onSellStones: (amount: number) => void;
  onExchangeGem: (action: 'buy' | 'sell') => void;
  onBuyListing: (listingId: string) => void;
  onCreateListing: (item: Item | 'stone', price: number, stoneCount?: number) => void;
}

export const MarketTab: React.FC<MarketTabProps> = ({
  playerPix,
  playerGems,
  stonesInventory,
  craftedItems,
  pixUsdRate,
  rateHistory,
  officialStonePrice,
  gemPixRate,
  publicListings,
  isCreator,
  onBuyStones,
  onSellStones,
  onExchangeGem,
  onBuyListing,
  onCreateListing
}) => {
  const [activeMarketMode, setActiveMarketMode] = useState<'official' | 'p2p'>('official');
  const [stoneTradeQty, setStoneTradeQty] = useState<number>(5);

  // Listing creation state
  const [isListingModalOpen, setIsListingModalOpen] = useState<boolean>(false);
  const [selectedListingItemUid, setSelectedListingItemUid] = useState<string>('stone');
  const [customListingPrice, setCustomListingPrice] = useState<number>(50);
  const [customStoneQty, setCustomStoneQty] = useState<number>(5);

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render price fluctuation chart
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 340;
    canvas.height = rect.height || 120;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
    for (let y = 16; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const arr = rateHistory.length > 0 ? rateHistory : [1000, 1005, 998, 1002];
    const minV = Math.min(...arr) * 0.98;
    const maxV = Math.max(...arr) * 1.02;
    const range = maxV - minV || 1;
    const isUp = arr[arr.length - 1] >= arr[Math.max(0, arr.length - 2)];

    ctx.beginPath();
    arr.forEach((v, i) => {
      const x = (i / (arr.length - 1 || 1)) * (w - 20) + 10;
      const y = h - 14 - ((v - minV) / range) * (h - 28);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = isUp ? '#4ade80' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [rateHistory]);

  // Real world conversions
  const usd = pixUsdRate;
  const eur = (usd * 0.92).toFixed(1);
  const toman = Math.round(usd * 92000);
  const goldGram = (usd / 85).toFixed(2);

  const handlePostListing = () => {
    if (selectedListingItemUid === 'stone') {
      if (stonesInventory < customStoneQty) {
        sounds.play('error');
        alert('موجودی سنگ شما کافی نیست!');
        return;
      }
      onCreateListing('stone', customListingPrice, customStoneQty);
    } else {
      const itm = craftedItems.find((i) => i.uid === selectedListingItemUid);
      if (!itm) return;
      onCreateListing(itm, customListingPrice);
    }
    setIsListingModalOpen(false);
    sounds.play('success');
  };

  return (
    <section className="space-y-4">
      {/* Dynamic Valuation Index Card ($1000 Baseline) */}
      <div className="pixel-frame p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 font-bold">
              DYNAMIC MACRO ECONOMY • $1000 BASELINE
            </span>
            <h2 className="text-sm sm:text-base font-black text-white mt-1">
              بورس ارزش‌گذاری و تطابق با ارزهای واقعی
            </h2>
          </div>
          <div className="text-left">
            <div className="font-pixel text-xs sm:text-sm text-emerald-400">
              ${usd.toFixed(2)} USD
            </div>
            <div className="text-[10px] text-slate-400">
              ۱ گوهر GEM = <b className="text-cyan-300">{gemPixRate}</b> PIX
            </div>
          </div>
        </div>

        {/* Currency Conversion Parity Grid */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2 rounded border border-slate-800 text-[10px] mb-2 text-center">
          <div>
            <span className="text-slate-400">ارزش به تومان:</span>
            <div className="font-mono font-bold text-amber-300 mt-0.5">
              {(toman / 1000000).toFixed(2)} میلیون تومان
            </div>
          </div>
          <div>
            <span className="text-slate-400">ارزش به یورو:</span>
            <div className="font-mono font-bold text-cyan-300 mt-0.5">€{eur} EUR</div>
          </div>
          <div>
            <span className="text-slate-400">برابری با طلا:</span>
            <div className="font-mono font-bold text-yellow-400 mt-0.5">{goldGram} گرم طلا</div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="bg-[#060911] border-2 border-slate-800 rounded p-2 my-2">
          <canvas ref={chartCanvasRef} className="w-full h-28 block" />
        </div>

        <p className="text-[10px] text-slate-400">
          با استخراج دارایی‌ها و ورود بازیکنان بیشتر، تورم و نرخ برابری PIX به آرامی تغییر می‌کند. اگر ارز دست بازیکنان متمرکز بماند، ارزش آن بالا می‌رود.
        </p>
      </div>

      {/* Market Selector Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setActiveMarketMode('official')}
          className={`pixel-btn py-2 text-xs font-black ${
            activeMarketMode === 'official'
              ? 'bg-amber-500 text-black border-yellow-300'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          🏛️ بازار اصلی رسمی (خرید/فروش سنگ و GEM)
        </button>
        <button
          onClick={() => setActiveMarketMode('p2p')}
          className={`pixel-btn py-2 text-xs font-black ${
            activeMarketMode === 'p2p'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          🌐 بازار عمومی P2P (قیمت‌گذاری دلخواه شما)
        </button>
      </div>

      {activeMarketMode === 'official' ? (
        <div className="space-y-4">
          {/* Official Stones Trading Counter */}
          <div className="pixel-frame p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-black text-amber-400">باجه رسمی خرید و فروش خرده‌سنگ‌های خام معدن</h3>
                <p className="text-[11px] text-slate-400">
                  نرخ لحظه‌ای هر واحد سنگ: <b className="text-emerald-400 font-pixel text-xs">{officialStonePrice} PIX</b>
                </p>
              </div>
              <div className="text-[10px] text-cyan-300">
                موجودی سنگ شما: <b className="font-pixel text-amber-400">{stonesInventory}</b>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300">تعداد واحد:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={stoneTradeQty}
                onChange={(e) => setStoneTradeQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white text-center font-mono"
              />
              <span className="text-[11px] text-slate-400">
                ارزش کل: <b>{stoneTradeQty * officialStonePrice} PIX</b>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onBuyStones(stoneTradeQty)}
                className="pixel-btn bg-cyan-700 hover:bg-cyan-600 text-white py-2 text-xs font-bold"
              >
                خرید {stoneTradeQty} سنگ ({stoneTradeQty * officialStonePrice} PIX)
              </button>
              <button
                onClick={() => onSellStones(stoneTradeQty)}
                disabled={stonesInventory < stoneTradeQty}
                className="pixel-btn bg-amber-600 hover:bg-amber-500 text-black py-2 text-xs font-black disabled:opacity-40"
              >
                فروش {stoneTradeQty} سنگ و دریافت PIX
              </button>
            </div>
          </div>

          {/* GEM Exchange */}
          <div className="pixel-frame p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-cyan-400">صرافی گوهر کمیاب GEM</h3>
              <span className="text-xs text-slate-400">
                موجودی شما: <b className="text-cyan-300 font-pixel">{playerGems} GEM</b>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onExchangeGem('buy')}
                className="pixel-btn bg-cyan-800 hover:bg-cyan-700 text-white py-2 text-xs font-bold"
              >
                خرید ۱ گوهر GEM با {gemPixRate} PIX
              </button>
              <button
                onClick={() => onExchangeGem('sell')}
                disabled={playerGems < 1}
                className="pixel-btn bg-amber-700 hover:bg-amber-600 text-white py-2 text-xs font-bold disabled:opacity-40"
              >
                فروش ۱ گوهر GEM (دریافت {Math.floor(gemPixRate * 0.92)} PIX)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Public P2P Market */
        <div className="pixel-frame p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm sm:text-base font-black text-emerald-400">
                بازار عمومی بازیکنان (خرید و فروش با قیمت دلخواه)
              </h3>
              <p className="text-[11px] text-slate-400">
                شما می‌توانید آیتم‌های دست‌ساز یا سنگ‌های خود را با هر قیمتی که تمایل دارید آگهی کنید.
              </p>
            </div>
            <button
              onClick={() => setIsListingModalOpen(true)}
              className="pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5"
            >
              + ثبت آگهی جدید در بازار عمومی
            </button>
          </div>

          {/* Listings List */}
          {publicListings.length === 0 ? (
            <div className="bg-slate-950 border border-dashed border-slate-800 rounded p-6 text-center text-xs text-slate-400">
              در حال حاضر هیچ آگهی در بازار عمومی ثبت نشده است. اولین نفری باشید که آیتم یا سنگ می‌فروشد!
            </div>
          ) : (
            <div className="space-y-2">
              {publicListings.map((listing) => {
                const isMe = listing.sellerId === 'ME';
                const itm = listing.item;
                const tier = RARITY_TIERS[itm.rarity] || RARITY_TIERS.common;

                return (
                  <div
                    key={listing.listingId}
                    className={`bg-slate-950 border-2 rounded p-3 flex flex-wrap items-center justify-between gap-3 ${tier.css}`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{itm.name}</span>
                          <span className="text-[9px] px-1 rounded bg-slate-900" style={{ color: tier.color }}>
                            {tier.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            فروشنده: {listing.sellerName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{itm.description}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          تگ: <b className="text-amber-300">{TAG_METADATA[itm.tag]?.name || itm.tag}</b> • قدرت: +{itm.power} • تایم‌اوت: {itm.cooldownSec}s
                        </div>
                      </div>
                    </div>

                    <div>
                      {isMe ? (
                        <span className="text-[10px] text-amber-400 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                          آگهی شما ({listing.pricePix} PIX)
                        </span>
                      ) : (
                        <button
                          onClick={() => onBuyListing(listing.listingId)}
                          disabled={playerPix < listing.pricePix}
                          className="pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 disabled:opacity-40"
                        >
                          خرید ({listing.pricePix} PIX)
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

      {/* Listing Creation Modal */}
      {isListingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="pixel-frame max-w-md w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-emerald-400">عرضه در بازار عمومی با قیمت دلخواه</h3>
              <button onClick={() => setIsListingModalOpen(false)} className="text-slate-400 hover:text-white text-lg">
                &times;
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">انتخاب دارایی برای فروش:</label>
                <select
                  value={selectedListingItemUid}
                  onChange={(e) => setSelectedListingItemUid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-2 text-white text-xs"
                >
                  <option value="stone">بسته خرده‌سنگ‌های معدنی خام</option>
                  {craftedItems.map((itm) => (
                    <option key={itm.uid} value={itm.uid}>
                      {itm.name} (Lv.{itm.level || 1} | {RARITY_TIERS[itm.rarity].name})
                    </option>
                  ))}
                </select>
              </div>

              {selectedListingItemUid === 'stone' && (
                <div>
                  <label className="block text-slate-300 mb-1 font-bold">تعداد سنگ (موجودی: {stonesInventory}):</label>
                  <input
                    type="number"
                    min="1"
                    max={stonesInventory}
                    value={customStoneQty}
                    onChange={(e) => setCustomStoneQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-bold">قیمت دلخواه شما (به PIX):</label>
                <input
                  type="number"
                  min="5"
                  value={customListingPrice}
                  onChange={(e) => setCustomListingPrice(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-amber-400 font-mono font-bold"
                />
              </div>

              <button
                onClick={handlePostListing}
                className="w-full pixel-btn bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 text-xs"
              >
                ثبت در بازار عمومی
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
