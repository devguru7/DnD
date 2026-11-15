// ============================================================================
// D&D 5e Tabletop RPG Engine - Startup Script
// Minecraft 1.20.1 (Fabric) | KubeJS 6
// File: kubejs/startup_scripts/dnd_startup.js
//
// Registers custom Game Master and Player RPG items with clear display names,
// enchantment glint (glow), rarity tiers, and multi-line lore tooltips.
// ============================================================================

StartupEvents.registry('item', event => {
  // 1. Master Wand of Encounters (DM Tool)
  event.create('dm_wand')
    .displayName('§6§lMaster Wand of Encounters')
    .texture('minecraft:item/blaze_rod')
    .unstackable()
    .glow(true)
    .rarity('epic')
    .tooltip('§7A mystic conduit forged for the Game Master.')
    .tooltip('§eRight-Click: §fStart or Stop Turn-Based Combat (25m radius)')
    .tooltip('§bSneak + Right-Click: §fFreeze or Unfreeze the Party');

  // 2. Orb of Fate (DM Control Panel Trigger)
  event.create('dm_orb')
    .displayName('§d§lOrb of Fate')
    .texture('minecraft:item/ender_eye')
    .unstackable()
    .glow(true)
    .rarity('epic')
    .tooltip('§7Peer into the threads of destiny and command the table.')
    .tooltip('§eRight-Click: §fOpen Interactive DM Control Panel in Chat')
    .tooltip('§bSneak + Right-Click: §fView Active Initiative Order');

  // 3. Physical d20 Die (Player & DM Utility)
  event.create('d20_die')
    .displayName('§b§lIcosahedron of Fate (d20)')
    .texture('minecraft:item/amethyst_shard')
    .maxStackSize(16)
    .glow(true)
    .rarity('rare')
    .tooltip('§7A crystalline 20-sided die humming with arcane probability.')
    .tooltip('§eRight-Click: §fRoll 1d20 publicly in chat with sound & particles')
    .tooltip('§bSneak + Right-Click: §fOpen your D&D 5e Character Sheet');

  // 4. Inspiration Token (Consumable Buff)
  event.create('inspiration_token')
    .displayName('§e§lToken of Heroic Inspiration')
    .texture('minecraft:item/sunflower')
    .maxStackSize(64)
    .glow(true)
    .rarity('uncommon')
    .tooltip('§7Awarded for heroic roleplay, clever tactics, or bold deeds.')
    .tooltip('§eRight-Click: §fConsume to gain §6Advantage §fon your next d20 roll');

  // 5. Adventurer's Character Folio (Quick Sheet Access)
  event.create('character_folio')
    .displayName('§a§lAdventurer\'s Character Folio')
    .texture('minecraft:item/writable_book')
    .unstackable()
    .glow(true)
    .rarity('uncommon')
    .tooltip('§7A leather-bound chronicle of your abilities, saves, and skills.')
    .tooltip('§eRight-Click: §fOpen Interactive Character Sheet in Chat')
    .tooltip('§bSneak + Right-Click: §fTake a Short Rest (Spend Hit Die)');

  // 6. Potion of Healing (2d4 + 2 Tabletop Draught)
  event.create('healing_draught')
    .displayName('§c§lPotion of Superior Healing (2d4+2)')
    .texture('minecraft:item/dragon_breath')
    .maxStackSize(16)
    .glow(true)
    .rarity('rare')
    .tooltip('§7A ruby-red alchemical draught brewed to 5e phials.')
    .tooltip('§eRight-Click: §fConsume to roll §c2d4+2 §fand restore HP');
});
