import React, { useState, useEffect } from 'react';
import { PlayerProfile, Item, TagKey, RarityKey, Material, IncomingAttack, ShopListing } from './types/game';
import { TAG_METADATA, RARITY_TIERS, ALL_MATERIALS, INITIAL_MARKET_STONE_PRICE, CREATOR_PASSCODE } from './constants/gameData';
import { createPresetMatrix, createFlagPresetMatrix } from './utils/pixelArt';
import { sounds } from './utils/sound';

import { Header } from './components/Header';
import { MineTab } from './components/MineTab';
import { ForgeTab } from './components/ForgeTab';
import { BattlefieldTab } from './components/BattlefieldTab';
import { MarketTab } from './components/MarketTab';
import { InventoryTab } from './components/InventoryTab';
import { ProfileModal } from './components/ProfileModal';
import { PlayerInspectModal } from './components/PlayerInspectModal';
import { GiftModal } from './components/GiftModal';
import { CreatorModal } from './components/CreatorModal';

export default function App() {
  // Current Player Profile
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('world_of_pixal_v4_player');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const randId = 'PX_' + Math.floor(100000 + Math.random() * 900000);
    return {
      userId: randId,
      username: 'شوالیه پیکسل',
      bio: 'جستجوگر گوهرهای باستانی و رگه‌های مخفی',
      rankScore: 100,
      pix: 45, // Hardcore starting currency
      gems: 1,
      power: 12,
      defense: 10,
      shieldItem: null,
      lastDamageTimestamp: 0,
      isHexed: false,
      flagMatrix: createFlagPresetMatrix('royal'),
      showcaseItems: []
    };
  });

  // Rebalanced Energy (100 Max, Recovered slowly)
  const [energy, setEnergy] = useState<number>(() => {
    const s = localStorage.getItem('world_of_pixal_v4_energy');
    return s ? Math.min(100, parseInt(s, 10)) : 100;
  });
  const maxEnergy = 100;

  // Inventory & Discovered Materials (Fog of war: starts with only 3 materials discovered)
  const [discoveredMaterials, setDiscoveredMaterials] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('world_of_pixal_v4_mats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { m01: 2, m02: 1, m03: 2 };
  });

  // Raw stone chunks in inventory
  const [stonesInventory, setStonesInventory] = useState<number>(() => {
    const s = localStorage.getItem('world_of_pixal_v4_stones');
    return s ? parseInt(s, 10) : 10;
  });

  // Crafted Items (Starts with Starter Pickaxe with clear tag & skill)
  const [craftedItems, setCraftedItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('world_of_pixal_v4_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        uid: 'starter_pick_01',
        name: 'کلنگ برنزی آغازین',
        description: 'کلنگ اولیه با تیغه برنزی برای حفاری سنگ‌های رسوبی و کاهش اولیه تایم‌اوت.',
        tag: 'mining',
        rarity: 'common',
        level: 1,
        power: 10,
        aiScore: 85,
        cooldownSec: 35,
        showcased: true,
        matrix: createPresetMatrix('pickaxe'),
        abilities: { double_yield: 12, chrono_haste: 8 },
        createdAt: Date.now()
      },
      {
        uid: 'starter_sword_01',
        name: 'شمشیر فولادی کهن',
        description: 'شمشیر ساده جنگی برای شرکت در نبردهای میدانی و غارت اولیه.',
        tag: 'weapon',
        rarity: 'common',
        level: 1,
        power: 14,
        aiScore: 82,
        cooldownSec: 40,
        showcased: true,
        matrix: createPresetMatrix('sword'),
        abilities: { thorns_counter: 10 },
        createdAt: Date.now()
      }
    ];
  });

  // Equipped 10 Tag slots (Only 1 item per tag allowed!)
  const [equippedSlots, setEquippedSlots] = useState<Record<TagKey, string | null>>(() => {
    const saved = localStorage.getItem('world_of_pixal_v4_equipped');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      weapon: 'starter_sword_01',
      defense: null,
      mining: 'starter_pick_01',
      theft: null,
      hex: null,
      chrono: null,
      alchemy: null,
      trade: null,
      regen: null,
      cosmic: null
    };
  });

  // Individual Item Cooldowns ({ uid: timestampMs })
  const [itemCooldowns, setItemCooldowns] = useState<Record<string, number>>({});

  // Incoming Attacks for Revenge
  const [incomingAttacks, setIncomingAttacks] = useState<IncomingAttack[]>(() => {
    const saved = localStorage.getItem('world_of_pixal_v4_attacks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<'mine' | 'forge' | 'arena' | 'market' | 'inventory' | 'creator'>('mine');

  // Creator Passcode Lock (Locked by default; strictly hidden from ordinary players!)
  const [isCreatorUnlocked, setIsCreatorUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('world_of_pixal_v4_creator') === 'true';
  });

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState<boolean>(false);
  const [inspectingPlayer, setInspectingPlayer] = useState<PlayerProfile | null>(null);
  const [giftingItem, setGiftingItem] = useState<Item | null>(null);

  // Dynamic Macro Economy ($1000 Baseline)
  const [pixUsdRate, setPixUsdRate] = useState<number>(1000.0);
  const [rateHistory, setRateHistory] = useState<number[]>([995, 998, 1002, 1000, 1005, 997, 1000]);
  const [officialStonePrice, setOfficialStonePrice] = useState<number>(INITIAL_MARKET_STONE_PRICE);
  const [gemPixRate, setGemPixRate] = useState<number>(95);

  // Public P2P Listings
  const [publicListings, setPublicListings] = useState<ShopListing[]>([]);

  // Real world other players pool for search, matchmaking and top 10
  const [allPlayers, setAllPlayers] = useState<PlayerProfile[]>([
    {
      userId: 'PX_741920',
      username: 'شاهین شب',
      bio: 'فرمانده لشکر سایه‌ها و شمشیرزن ماهر',
      rankScore: 185,
      pix: 240,
      gems: 4,
      power: 65,
      defense: 25,
      shieldItem: null,
      lastDamageTimestamp: 0,
      isHexed: false,
      flagMatrix: createFlagPresetMatrix('pirate'),
      showcaseItems: [
        {
          uid: 'sh_01',
          name: 'شمشیر سایه تاریک',
          description: 'تیغه فولادی سیاه با قدرت نفوذ بالا',
          tag: 'weapon',
          rarity: 'rare',
          level: 3,
          power: 45,
          aiScore: 92,
          cooldownSec: 25,
          matrix: createPresetMatrix('weapon'),
          abilities: { thorns_counter: 25 }
        }
      ]
    },
    {
      userId: 'PX_882104',
      username: 'سردار آریایی',
      bio: 'استاد دفاع و ساخت سپرهای ضد سرقت ۱۰ روزه',
      rankScore: 160,
      pix: 310,
      gems: 6,
      power: 50,
      defense: 45,
      shieldItem: {
        uid: 'shd_01',
        name: 'سپر برنزی محافظ',
        description: 'سپر دفاعی مستحکم با دوام ۱۰ روزه',
        tag: 'defense',
        rarity: 'uncommon',
        level: 2,
        power: 35,
        aiScore: 88,
        cooldownSec: 30,
        durabilityDays: 10,
        shieldCharges: 2,
        matrix: createPresetMatrix('defense'),
        abilities: { anti_theft: 35 }
      },
      lastDamageTimestamp: 0,
      isHexed: false,
      flagMatrix: createFlagPresetMatrix('iran_inspired'),
      showcaseItems: []
    },
    {
      userId: 'PX_309115',
      username: 'کیمیاگر کهن',
      bio: 'ترکیب‌کننده سنگ‌های گدازه و کریستال زمان',
      rankScore: 140,
      pix: 180,
      gems: 3,
      power: 38,
      defense: 20,
      shieldItem: null,
      lastDamageTimestamp: 0,
      isHexed: false,
      flagMatrix: createFlagPresetMatrix('cyberpunk'),
      showcaseItems: []
    },
    {
      userId: 'PX_512809',
      username: 'غارتگر صحرا',
      bio: 'جستجوگر گنجینه‌های شبانه و نفوذ به انبارها',
      rankScore: 125,
      pix: 95,
      gems: 2,
      power: 32,
      defense: 15,
      shieldItem: null,
      lastDamageTimestamp: 0,
      isHexed: false,
      flagMatrix: createFlagPresetMatrix('pirate'),
      showcaseItems: []
    }
  ]);

  const [battleLogs, setBattleLogs] = useState<string[]>([
    '🌐 میدان نبرد و جدول رتبه‌بندی جهانی فعال شد. قوانین سهمیه روزانه و نبرد با آیتم در سرور در حال اجراست.'
  ]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_player', JSON.stringify(player));
  }, [player]);

  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_energy', energy.toString());
  }, [energy]);

  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_mats', JSON.stringify(discoveredMaterials));
  }, [discoveredMaterials]);

  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_stones', stonesInventory.toString());
  }, [stonesInventory]);

  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_items', JSON.stringify(craftedItems));
  }, [craftedItems]);

  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_equipped', JSON.stringify(equippedSlots));
  }, [equippedSlots]);

  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_attacks', JSON.stringify(incomingAttacks));
  }, [incomingAttacks]);

  useEffect(() => {
    localStorage.setItem('world_of_pixal_v4_creator', isCreatorUnlocked ? 'true' : 'false');
  }, [isCreatorUnlocked]);

  // Periodic energy recovery and economic tick (every 4s)
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Recover energy slowly (1 energy every 4 seconds)
      setEnergy((prev) => Math.min(maxEnergy, prev + 1));

      // 2. Micro economic tick based on baseline $1000
      setPixUsdRate((prev) => {
        const delta = (Math.random() - 0.5) * 4;
        const newRate = Math.max(850, Math.min(1250, +(prev + delta).toFixed(2)));
        setRateHistory((hist) => {
          const nextHist = [...hist, newRate];
          return nextHist.slice(-20);
        });
        return newRate;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Calculate player aggregated power, cooldown discount & defense
  const equippedPickaxe = craftedItems.find((i) => i.uid === equippedSlots.mining);
  const pickaxeLevel = equippedPickaxe ? (equippedPickaxe.level || 1) : 1;

  const equippedChrono = craftedItems.find((i) => i.uid === equippedSlots.chrono);
  const cooldownReductionPct = isCreatorUnlocked
    ? 90
    : Math.min(65, (equippedChrono ? (equippedChrono.abilities.chrono_haste || 25) : 0) + (pickaxeLevel - 1) * 4);

  // Sync player shield
  const equippedDefenseItem = craftedItems.find((i) => i.uid === equippedSlots.defense) || null;
  useEffect(() => {
    setPlayer((prev) => ({
      ...prev,
      shieldItem: equippedDefenseItem,
      defense: equippedDefenseItem ? (equippedDefenseItem.power || 20) : 10
    }));
  }, [equippedDefenseItem]);

  // Mining Success Handler
  const handleMineSuccess = (params: {
    material: Material | null;
    isDebris: boolean;
    stoneCount: number;
    earnedPix: number;
    energyConsumed: number;
    cooldownMs: number;
  }) => {
    if (!isCreatorUnlocked) {
      setEnergy((prev) => Math.max(0, prev - params.energyConsumed));
    }

    if (params.earnedPix > 0) {
      setPlayer((prev) => ({ ...prev, pix: prev.pix + params.earnedPix }));
    }

    if (params.isDebris) {
      setStonesInventory((prev) => prev + params.stoneCount);
    }

    if (params.material) {
      setDiscoveredMaterials((prev) => ({
        ...prev,
        [params.material!.id]: (prev[params.material!.id] || 0) + 1
      }));
    }
  };

  // Equipping Item with STRICT ONE-PER-TAG RULE
  const handleEquipItem = (item: Item) => {
    const tag = item.tag;
    const currentlyEquippedUid = equippedSlots[tag];

    if (currentlyEquippedUid === item.uid) {
      // Unequip
      setEquippedSlots((prev) => ({ ...prev, [tag]: null }));
      sounds.play('mine');
    } else {
      // Equip (automatically replaces any other item of the same tag!)
      setEquippedSlots((prev) => ({ ...prev, [tag]: item.uid }));
      sounds.play('forge');
    }
  };

  // Upgrade Item (Level Up, Power boost, 12% faster cooldown)
  const handleUpgradeItem = (uid: string) => {
    const itm = craftedItems.find((i) => i.uid === uid);
    if (!itm) return;

    const tier = RARITY_TIERS[itm.rarity] || RARITY_TIERS.common;
    const lvl = itm.level || 1;
    const upgCost = Math.max(15, Math.round(tier.floorPix * 0.4 * lvl));

    if (!isCreatorUnlocked && player.pix < upgCost) {
      sounds.play('error');
      alert(`موجودی کافی نیست! به ${upgCost} PIX نیاز دارید.`);
      return;
    }

    if (!isCreatorUnlocked) {
      setPlayer((prev) => ({ ...prev, pix: prev.pix - upgCost }));
    }

    setCraftedItems((prev) =>
      prev.map((i) => {
        if (i.uid === uid) {
          const nextLvl = (i.level || 1) + 1;
          return {
            ...i,
            level: nextLvl,
            power: Math.round(i.power * 1.2),
            cooldownSec: Math.max(3, Math.round(i.cooldownSec * 0.88))
          };
        }
        return i;
      })
    );
    sounds.play('forge');
  };

  // Toggle Showcase
  const handleToggleShowcase = (uid: string) => {
    setCraftedItems((prev) => {
      const currentShowcased = prev.filter((i) => i.showcased);
      const target = prev.find((i) => i.uid === uid);
      if (!target) return prev;

      if (!target.showcased && currentShowcased.length >= 3) {
        sounds.play('error');
        alert('حداکثر ۳ آیتم را می‌توانید در ویترین عمومی پروفایل قرار دهید.');
        return prev;
      }

      const updated = prev.map((i) => (i.uid === uid ? { ...i, showcased: !i.showcased } : i));
      setPlayer((p) => ({ ...p, showcaseItems: updated.filter((i) => i.showcased) }));
      return updated;
    });
    sounds.play('mine');
  };

  // Attack Execution (Daily Quota, Shield Mechanics, Item Cooldown)
  const handleExecuteAttack = (params: {
    target: PlayerProfile;
    attackType: 'raid' | 'theft' | 'hex';
    selectedItem: Item;
    isRevenge?: boolean;
    revengeIncidentId?: string;
  }) => {
    const { target, attackType, selectedItem, isRevenge, revengeIncidentId } = params;

    // Put item on cooldown
    const cdMs = Math.max(1000, selectedItem.cooldownSec * 1000);
    setItemCooldowns((prev) => ({ ...prev, [selectedItem.uid]: Date.now() + cdMs }));

    // Shield Evaluation:
    // If target has a shield:
    // - If attacker weapon power > target shield defense (e.g. Legendary / high sword vs Level 1 shield):
    //   Shield shatters AND damages target!
    // - If attacker weapon power <= target shield defense:
    //   Shield completely absorbs hit. Target takes NO damage, so target's daily vulnerability is NOT consumed!
    let shieldAbsorbedCompletely = false;
    let shieldShattered = false;

    if (target.shieldItem) {
      if (selectedItem.power > (target.defense || 20) * 1.3) {
        shieldShattered = true;
        target.shieldItem = null; // shield shattered!
        sounds.play('shield_break');
      } else {
        shieldAbsorbedCompletely = true;
        sounds.play('shield_block');
      }
    }

    if (shieldAbsorbedCompletely) {
      sounds.play('error');
      alert(`سپر دفاعی «${target.username}» ضربه شما را کاملاً مهار کرد! هیچ آسیبی به او نرسید و سهمیه روزانه او حفظ شد.`);
      const log = `🛡️ سپر «${target.username}» حمله ${player.username} با آیتم ${selectedItem.name} را دفع کرد!`;
      setBattleLogs((prev) => [log, ...prev]);
      return;
    }

    // Penetrated & Damaged!
    const damage = Math.max(12, Math.round(selectedItem.power * 0.45));
    const loot = Math.min(target.pix, Math.max(10, Math.round(damage * 1.2)));

    // Target consumes daily vulnerability quota!
    target.lastDamageTimestamp = Date.now();
    target.rankScore = Math.max(0, target.rankScore - damage);
    target.pix = Math.max(0, target.pix - loot);

    // Attacker gains
    setPlayer((prev) => ({
      ...prev,
      rankScore: prev.rankScore + 15,
      pix: prev.pix + loot
    }));

    if (isRevenge && revengeIncidentId) {
      setIncomingAttacks((prev) =>
        prev.map((a) => (a.id === revengeIncidentId ? { ...a, revenged: true } : a))
      );
    }

    const log = `⚔️ ${player.username} با «${selectedItem.name}» به ${target.username} حمله کرد! ${shieldShattered ? '(سپر حریف شکست!) ' : ''}خسارت: ${damage} امتیاز • غنیمت: ${loot} PIX`;
    setBattleLogs((prev) => [log, ...prev]);
    sounds.play('attack');
    alert(`حمله موفق! خسارت: ${damage} امتیاز | غنیمت: +${loot} PIX`);
  };

  // Gift Sending Handler
  const handleSendGift = (recipientId: string, item: Item) => {
    // Remove item from inventory
    setCraftedItems((prev) => prev.filter((i) => i.uid !== item.uid));
    // Remove from equipped if it was equipped
    setEquippedSlots((prev) => {
      const copy = { ...prev };
      if (copy[item.tag] === item.uid) copy[item.tag] = null;
      return copy;
    });

    const target = allPlayers.find((p) => p.userId.toLowerCase() === recipientId.toLowerCase());
    const recipientName = target ? target.username : recipientId;

    const log = `🎁 ${player.username} آیتم «${item.name}» را به عنوان هدیه برای ${recipientName} (${recipientId}) ارسال کرد!`;
    setBattleLogs((prev) => [log, ...prev]);
    alert(`آیتم «${item.name}» با موفقیت برای «${recipientName}» ارسال گردید.`);
  };

  // Official Stones Buying/Selling
  const handleBuyStones = (amount: number) => {
    const cost = amount * officialStonePrice;
    if (!isCreatorUnlocked && player.pix < cost) {
      sounds.play('error');
      alert(`موجودی کافی نیست! به ${cost} PIX نیاز دارید.`);
      return;
    }
    if (!isCreatorUnlocked) setPlayer((prev) => ({ ...prev, pix: prev.pix - cost }));
    setStonesInventory((prev) => prev + amount);
    // Dynamic price increase slightly due to demand
    setOfficialStonePrice((prev) => +(prev * 1.02).toFixed(1));
    sounds.play('forge');
  };

  const handleSellStones = (amount: number) => {
    if (stonesInventory < amount) return;
    const earnings = amount * officialStonePrice;
    setStonesInventory((prev) => prev - amount);
    setPlayer((prev) => ({ ...prev, pix: prev.pix + earnings }));
    // Dynamic price decrease slightly due to supply
    setOfficialStonePrice((prev) => Math.max(8, +(prev * 0.985).toFixed(1)));
    sounds.play('forge');
  };

  const handleExchangeGem = (action: 'buy' | 'sell') => {
    if (action === 'buy') {
      if (!isCreatorUnlocked && player.pix < gemPixRate) {
        sounds.play('error');
        alert(`موجودی کافی نیست! نیاز به ${gemPixRate} PIX.`);
        return;
      }
      if (!isCreatorUnlocked) setPlayer((prev) => ({ ...prev, pix: prev.pix - gemPixRate }));
      setPlayer((prev) => ({ ...prev, gems: prev.gems + 1 }));
      sounds.play('forge');
    } else {
      if (player.gems < 1) return;
      const getPix = Math.floor(gemPixRate * 0.92);
      setPlayer((prev) => ({ ...prev, gems: prev.gems - 1, pix: prev.pix + getPix }));
      sounds.play('forge');
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Top Header */}
      <Header
        player={player}
        energy={energy}
        maxEnergy={maxEnergy}
        pixUsdRate={pixUsdRate}
        cooldownReductionPct={cooldownReductionPct}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenCreator={() => setIsCreatorModalOpen(true)}
        isCreatorUnlocked={isCreatorUnlocked}
        discoveredMaterialsCount={Object.keys(discoveredMaterials).length}
        onSwitchTab={(t) => setActiveTab(t as any)}
      />

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto px-3 pt-3">
        {activeTab === 'mine' && (
          <MineTab
            energy={energy}
            maxEnergy={maxEnergy}
            pickaxeLevel={pickaxeLevel}
            cooldownReductionPct={cooldownReductionPct}
            isCreator={isCreatorUnlocked}
            isHexed={player.isHexed}
            discoveredMaterials={discoveredMaterials}
            stonesInventory={stonesInventory}
            onMineSuccess={handleMineSuccess}
            onCleanseHex={() => {
              if (player.pix < 45 && !isCreatorUnlocked) {
                sounds.play('error');
                alert('برای ابطال طلسم به ۴۵ PIX نیاز دارید.');
                return;
              }
              if (!isCreatorUnlocked) setPlayer((p) => ({ ...p, pix: p.pix - 45 }));
              setPlayer((p) => ({ ...p, isHexed: false }));
              sounds.play('forge');
            }}
          />
        )}

        {activeTab === 'forge' && (
          <ForgeTab
            playerPix={player.pix}
            isCreator={isCreatorUnlocked}
            craftedItems={craftedItems}
            discoveredMaterials={discoveredMaterials}
            onItemCrafted={(newItem, usedMats) => {
              if (!isCreatorUnlocked) {
                setPlayer((prev) => ({ ...prev, pix: prev.pix - 15 }));
                setDiscoveredMaterials((prev) => {
                  const copy = { ...prev };
                  Object.entries(usedMats).forEach(([id, q]) => {
                    copy[id] = Math.max(0, (copy[id] || 0) - q);
                  });
                  return copy;
                });
              }
              setCraftedItems((prev) => [newItem, ...prev]);
            }}
            onItemFused={(fusedItem, uidA, uidB) => {
              if (!isCreatorUnlocked) {
                setPlayer((prev) => ({ ...prev, pix: prev.pix - 25 }));
              }
              setCraftedItems((prev) => [
                fusedItem,
                ...prev.filter((i) => i.uid !== uidA && i.uid !== uidB)
              ]);
              // Update equipped slot if parent was equipped
              setEquippedSlots((prev) => {
                const copy = { ...prev };
                Object.keys(copy).forEach((k) => {
                  const tagK = k as TagKey;
                  if (copy[tagK] === uidA || copy[tagK] === uidB) {
                    copy[tagK] = fusedItem.uid;
                  }
                });
                return copy;
              });
            }}
          />
        )}

        {activeTab === 'arena' && (
          <BattlefieldTab
            currentPlayer={player}
            craftedItems={craftedItems}
            equippedItems={equippedSlots}
            itemCooldowns={itemCooldowns}
            allPlayers={allPlayers}
            incomingAttacks={incomingAttacks}
            battleLogs={battleLogs}
            onExecuteAttack={handleExecuteAttack}
            onInspectPlayer={(target) => setInspectingPlayer(target)}
          />
        )}

        {activeTab === 'market' && (
          <MarketTab
            playerPix={player.pix}
            playerGems={player.gems}
            stonesInventory={stonesInventory}
            craftedItems={craftedItems}
            pixUsdRate={pixUsdRate}
            rateHistory={rateHistory}
            officialStonePrice={officialStonePrice}
            gemPixRate={gemPixRate}
            publicListings={publicListings}
            isCreator={isCreatorUnlocked}
            onBuyStones={handleBuyStones}
            onSellStones={handleSellStones}
            onExchangeGem={handleExchangeGem}
            onBuyListing={(listingId) => {
              const l = publicListings.find((x) => x.listingId === listingId);
              if (!l) return;
              if (!isCreatorUnlocked && player.pix < l.pricePix) {
                sounds.play('error');
                alert('موجودی کافی نیست!');
                return;
              }
              if (!isCreatorUnlocked) setPlayer((p) => ({ ...p, pix: p.pix - l.pricePix }));
              setCraftedItems((prev) => [l.item, ...prev]);
              setPublicListings((prev) => prev.filter((x) => x.listingId !== listingId));
              sounds.play('forge');
            }}
            onCreateListing={(itemOrStone, price, count) => {
              if (itemOrStone === 'stone') {
                setStonesInventory((prev) => Math.max(0, prev - (count || 1)));
                const dummyItem: Item = {
                  uid: 'listing_stone_' + Date.now(),
                  name: `بسته ${count || 1} واحدی خرده‌سنگ معدن`,
                  description: 'خرده‌سنگ‌های خام استخراج شده از لایه‌های اولیه',
                  tag: 'mining',
                  rarity: 'common',
                  level: 1,
                  power: 5,
                  aiScore: 80,
                  cooldownSec: 10,
                  matrix: createPresetMatrix('pickaxe'),
                  abilities: {},
                  createdAt: Date.now()
                };
                setPublicListings((prev) => [
                  {
                    listingId: 'list_' + Date.now(),
                    sellerName: player.username,
                    sellerId: 'ME',
                    pricePix: price,
                    item: dummyItem,
                    flagMatrix: player.flagMatrix,
                    isPublicMarket: true,
                    timestamp: Date.now()
                  },
                  ...prev
                ]);
              } else {
                setCraftedItems((prev) => prev.filter((i) => i.uid !== itemOrStone.uid));
                setPublicListings((prev) => [
                  {
                    listingId: 'list_' + Date.now(),
                    sellerName: player.username,
                    sellerId: 'ME',
                    pricePix: price,
                    item: itemOrStone,
                    flagMatrix: player.flagMatrix,
                    isPublicMarket: true,
                    timestamp: Date.now()
                  },
                  ...prev
                ]);
              }
            }}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryTab
            craftedItems={craftedItems}
            equippedSlots={equippedSlots}
            itemCooldowns={itemCooldowns}
            playerPix={player.pix}
            isCreator={isCreatorUnlocked}
            onEquipItem={handleEquipItem}
            onUpgradeItem={handleUpgradeItem}
            onToggleShowcase={handleToggleShowcase}
            onOpenGiftModal={(item) => setGiftingItem(item)}
          />
        )}
      </main>

      {/* Modals */}
      {isProfileModalOpen && (
        <ProfileModal
          player={player}
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={(name, bio, flagMatrix) => {
            setPlayer((prev) => ({ ...prev, username: name, bio, flagMatrix }));
          }}
        />
      )}

      {inspectingPlayer && (
        <PlayerInspectModal
          player={inspectingPlayer}
          onClose={() => setInspectingPlayer(null)}
        />
      )}

      {giftingItem && (
        <GiftModal
          item={giftingItem}
          allPlayers={allPlayers}
          currentUserId={player.userId}
          onClose={() => setGiftingItem(null)}
          onSendGift={handleSendGift}
        />
      )}

      {isCreatorModalOpen && (
        <CreatorModal
          isUnlocked={isCreatorUnlocked}
          onUnlock={() => setIsCreatorUnlocked(true)}
          onLock={() => setIsCreatorUnlocked(false)}
          onClose={() => setIsCreatorModalOpen(false)}
          onAddGodFunds={() => {
            setPlayer((p) => ({ ...p, pix: p.pix + 1000000, gems: p.gems + 10000 }));
            sounds.play('success');
          }}
          onUnlockAllMaterials={() => {
            const all: Record<string, number> = {};
            ALL_MATERIALS.forEach((m) => {
              all[m.id] = (discoveredMaterials[m.id] || 0) + 20;
            });
            setDiscoveredMaterials(all);
            sounds.play('success');
          }}
          onResetCooldowns={() => {
            setItemCooldowns({});
            sounds.play('success');
          }}
          onCreateGodItem={(godItem) => {
            setCraftedItems((prev) => [godItem, ...prev]);
            sounds.play('forge');
          }}
        />
      )}

      {/* Sticky Bottom Navigation Bar (Creator tab is ONLY visible if Creator is unlocked!) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#05070d]/95 backdrop-blur-md border-t-2 border-slate-800 px-2 py-1.5">
        <div className={`max-w-2xl mx-auto grid ${isCreatorUnlocked ? 'grid-cols-6' : 'grid-cols-5'} gap-1`}>
          <button
            onClick={() => setActiveTab('mine')}
            className={`pixel-btn py-2 flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'mine' ? 'bg-amber-500 text-black font-black' : 'bg-slate-800 text-slate-300 font-bold'
            }`}
          >
            <i className="fa-solid fa-gem text-xs"></i>
            <span className="text-[9px]">معدن</span>
          </button>

          <button
            onClick={() => setActiveTab('forge')}
            className={`pixel-btn py-2 flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'forge' ? 'bg-amber-500 text-black font-black' : 'bg-slate-800 text-slate-300 font-bold'
            }`}
          >
            <i className="fa-solid fa-palette text-xs"></i>
            <span className="text-[9px]">نقاشی و ساخت</span>
          </button>

          <button
            onClick={() => setActiveTab('arena')}
            className={`pixel-btn py-2 flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'arena' ? 'bg-amber-500 text-black font-black' : 'bg-slate-800 text-slate-300 font-bold'
            }`}
          >
            <i className="fa-solid fa-trophy text-xs"></i>
            <span className="text-[9px]">نبرد و تاپ ۱۰</span>
          </button>

          <button
            onClick={() => setActiveTab('market')}
            className={`pixel-btn py-2 flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'market' ? 'bg-amber-500 text-black font-black' : 'bg-slate-800 text-slate-300 font-bold'
            }`}
          >
            <i className="fa-solid fa-store text-xs"></i>
            <span className="text-[9px]">شاپ و بورس</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`pixel-btn py-2 flex flex-col items-center justify-center gap-0.5 ${
              activeTab === 'inventory' ? 'bg-amber-500 text-black font-black' : 'bg-slate-800 text-slate-300 font-bold'
            }`}
          >
            <i className="fa-solid fa-briefcase text-xs"></i>
            <span className="text-[9px]">کوله‌پشتی</span>
          </button>

          {/* Only shown if Creator is authenticated/unlocked! */}
          {isCreatorUnlocked && (
            <button
              onClick={() => setIsCreatorModalOpen(true)}
              className="pixel-btn bg-gradient-to-r from-rose-900 to-amber-700 text-amber-200 border-amber-400 py-2 flex flex-col items-center justify-center gap-0.5 font-black"
            >
              <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
              <span className="text-[9px]">خالق</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
