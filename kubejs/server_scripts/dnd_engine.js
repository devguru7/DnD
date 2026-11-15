// ============================================================================
// D&D 5e Tabletop RPG Engine - Server Script
// Minecraft 1.20.1 (Fabric) | KubeJS 6
// File: kubejs/server_scripts/dnd_engine.js
//
// Features:
// - Persistent Character Sheet & 6 Class Presets synced with Vanilla Max Health
// - 6 Core Abilities + 18 D&D 5e Skills + Saving Throws + Proficiency Scaling
// - Full Dice Parser (NdS+M) with Nat 20 (Gold/Totem) & Nat 1 (Crimson/Anvil)
// - Advantage, Disadvantage & Automatic Heroic Inspiration Consumption
// - Turn-Based Initiative Tracker, Grid Movement Clamping & Glowing Active Turn
// - Melee/Ranged Raycast Attacks, Dash, Class Bonus Actions & Rest Mechanics
// - Clickable Chat Character Sheet & Game Master Control Panel
// ============================================================================

// ----------------------------------------------------------------------------
// 1. CONSTANTS, SKILLS, CLASS PRESETS & HELPER FUNCTIONS
// ----------------------------------------------------------------------------

const DND_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const ABILITY_NAMES = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma'
};

const DND_SKILLS = {
  acrobatics: { name: 'Acrobatics', ability: 'dex' },
  animal_handling: { name: 'Animal Handling', ability: 'wis' },
  arcana: { name: 'Arcana', ability: 'int' },
  athletics: { name: 'Athletics', ability: 'str' },
  deception: { name: 'Deception', ability: 'cha' },
  history: { name: 'History', ability: 'int' },
  insight: { name: 'Insight', ability: 'wis' },
  intimidation: { name: 'Intimidation', ability: 'cha' },
  investigation: { name: 'Investigation', ability: 'int' },
  medicine: { name: 'Medicine', ability: 'wis' },
  nature: { name: 'Nature', ability: 'int' },
  perception: { name: 'Perception', ability: 'wis' },
  performance: { name: 'Performance', ability: 'cha' },
  persuasion: { name: 'Persuasion', ability: 'cha' },
  religion: { name: 'Religion', ability: 'int' },
  sleight_of_hand: { name: 'Sleight of Hand', ability: 'dex' },
  stealth: { name: 'Stealth', ability: 'dex' },
  survival: { name: 'Survival', ability: 'wis' }
};

const CLASS_PRESETS = {
  Fighter: {
    charClass: 'Fighter',
    level: 1,
    ac: 16,
    maxHp: 24,
    hitDie: 10,
    speed: 6,
    str: 16,
    dex: 13,
    con: 15,
    int: 10,
    wis: 12,
    cha: 8,
    saveProf1: 'str',
    saveProf2: 'con',
    skills: ['athletics', 'intimidation', 'perception'],
    featureName: 'Second Wind (1d10+Lv Heal)'
  },
  Wizard: {
    charClass: 'Wizard',
    level: 1,
    ac: 12,
    maxHp: 14,
    hitDie: 6,
    speed: 6,
    str: 8,
    dex: 14,
    con: 13,
    int: 16,
    wis: 12,
    cha: 10,
    saveProf1: 'int',
    saveProf2: 'wis',
    skills: ['arcana', 'history', 'investigation'],
    featureName: 'Arcane Ward (+2 AC / Temp Shield)'
  },
  Rogue: {
    charClass: 'Rogue',
    level: 1,
    ac: 14,
    maxHp: 18,
    hitDie: 8,
    speed: 7,
    str: 10,
    dex: 16,
    con: 12,
    int: 13,
    wis: 10,
    cha: 14,
    saveProf1: 'dex',
    saveProf2: 'int',
    skills: ['stealth', 'acrobatics', 'sleight_of_hand', 'deception'],
    featureName: 'Cunning Action (Bonus Dash)'
  },
  Cleric: {
    charClass: 'Cleric',
    level: 1,
    ac: 16,
    maxHp: 20,
    hitDie: 8,
    speed: 6,
    str: 14,
    dex: 10,
    con: 14,
    int: 10,
    wis: 16,
    cha: 12,
    saveProf1: 'wis',
    saveProf2: 'cha',
    skills: ['medicine', 'religion', 'insight'],
    featureName: 'Channel Divinity (Preserve Life)'
  },
  Paladin: {
    charClass: 'Paladin',
    level: 1,
    ac: 16,
    maxHp: 22,
    hitDie: 10,
    speed: 6,
    str: 16,
    dex: 10,
    con: 14,
    int: 8,
    wis: 12,
    cha: 15,
    saveProf1: 'wis',
    saveProf2: 'cha',
    skills: ['athletics', 'persuasion', 'religion'],
    featureName: 'Lay on Hands (Restore 5xLv HP)'
  },
  Bard: {
    charClass: 'Bard',
    level: 1,
    ac: 13,
    maxHp: 18,
    hitDie: 8,
    speed: 6,
    str: 8,
    dex: 14,
    con: 12,
    int: 12,
    wis: 10,
    cha: 16,
    saveProf1: 'dex',
    saveProf2: 'cha',
    skills: ['performance', 'persuasion', 'deception', 'perception'],
    featureName: 'Bardic Inspiration (Inspire Nearby)'
  }
};

/**
 * Calculates the D&D 5e ability modifier for a given score: Math.floor((score - 10) / 2)
 * @param {number} score
 * @returns {number}
 */
function getMod(score) {
  return Math.floor((Number(score) - 10) / 2);
}

/**
 * Calculates the D&D 5e proficiency bonus for a given level (1 to 20): Math.ceil(level / 4) + 1
 * @param {number} level
 * @returns {number}
 */
function getProfBonus(level) {
  let clamped = Math.max(1, Math.min(20, Number(level) || 1));
  return Math.ceil(clamped / 4) + 1;
}

/**
 * Formats a numeric modifier with an explicit + or - sign.
 * @param {number} mod
 * @returns {string}
 */
function formatSigned(mod) {
  let n = Number(mod) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

/**
 * Rolls a single die with `sides` faces (1 to sides).
 * @param {number} sides
 * @returns {number}
 */
function rollSingleDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Safely reads a boolean flag that may have been coerced to an NBT Byte (0 or 1).
 * @param {*} val
 * @returns {boolean}
 */
function isTruthyNbt(val) {
  return Boolean(val) && Number(val) !== 0 && val !== 'false';
}

/**
 * Initializes or updates a player's persistent D&D data in `player.persistentData.dnd`.
 * @param {Internal.ServerPlayer} player
 * @param {string} [presetName]
 */
function ensurePlayerDndData(player, presetName) {
  let pData = player.persistentData;
  if (!pData.contains('dnd') || presetName) {
    let chosenClass = presetName && CLASS_PRESETS[presetName] ? presetName : 'Fighter';
    let preset = CLASS_PRESETS[chosenClass];

    pData.dnd = {
      charClass: preset.charClass,
      level: preset.level,
      ac: preset.ac,
      hp: preset.maxHp,
      maxHp: preset.maxHp,
      hitDie: preset.hitDie,
      hitDiceRemaining: preset.level,
      speed: preset.speed,
      inspiration: false,
      featureUsed: false,
      str: preset.str,
      dex: preset.dex,
      con: preset.con,
      int: preset.int,
      wis: preset.wis,
      cha: preset.cha,
      saveProf1: preset.saveProf1,
      saveProf2: preset.saveProf2,
      skillsCsv: preset.skills.join(',')
    };
  }
  syncVanillaHealth(player);
}

/**
 * Checks whether the player has skill proficiency in a given skill key.
 * @param {object} dnd
 * @param {string} skillKey
 * @returns {boolean}
 */
function hasSkillProficiency(dnd, skillKey) {
  let csv = String(dnd.skillsCsv || '');
  let list = csv.split(',').map(s => s.trim().toLowerCase());
  return list.indexOf(skillKey.toLowerCase()) !== -1;
}

/**
 * Syncs D&D maxHp and hp with Vanilla Minecraft generic.max_health attribute.
 * @param {Internal.ServerPlayer} player
 */
function syncVanillaHealth(player) {
  if (!player || !player.persistentData || !player.persistentData.dnd) return;
  let dnd = player.persistentData.dnd;
  let maxHp = Math.max(1, Number(dnd.maxHp) || 20);
  let hp = Math.max(1, Math.min(maxHp, Number(dnd.hp) || maxHp));
  dnd.maxHp = maxHp;
  dnd.hp = hp;

  player.modifyAttribute('minecraft:generic.max_health', 'dnd_max_hp_sync', maxHp - 20, 'addition');
  player.setHealth(hp);
}

/**
 * Reads `server.persistentData.dndCombat` safely, converting NBT Lists into standard JS arrays.
 * @param {Internal.MinecraftServer} server
 */
function getCombatState(server) {
  let sData = server.persistentData;
  if (!sData.contains('dndCombat')) {
    sData.dndCombat = {
      active: false,
      round: 0,
      turnIndex: 0,
      partyFrozen: false,
      orderJson: '[]'
    };
  }
  let raw = sData.dndCombat;
  let parsedOrder = [];
  if (raw.orderJson) {
    try {
      parsedOrder = JSON.parse(String(raw.orderJson));
    } catch (e) {
      parsedOrder = [];
    }
  } else if (raw.order && raw.order.length) {
    for (let i = 0; i < raw.order.length; i++) {
      let item = raw.order[i];
      parsedOrder.push({
        uuid: String(item.uuid),
        name: String(item.name),
        isPlayer: isTruthyNbt(item.isPlayer),
        initiative: Number(item.initiative) || 10,
        initRoll: Number(item.initRoll) || 10,
        initMod: Number(item.initMod) || 0,
        startX: Number(item.startX) || 0,
        startY: Number(item.startY) || 64,
        startZ: Number(item.startZ) || 0,
        speed: Number(item.speed) || 6,
        maxMoveThisTurn: Number(item.maxMoveThisTurn) || 6,
        remainingMove: Number(item.remainingMove) || 6,
        hasAction: isTruthyNbt(item.hasAction),
        hasBonusAction: isTruthyNbt(item.hasBonusAction),
        ac: Number(item.ac) || 12
      });
    }
  }

  return {
    active: isTruthyNbt(raw.active),
    round: Number(raw.round) || 0,
    turnIndex: Number(raw.turnIndex) || 0,
    partyFrozen: isTruthyNbt(raw.partyFrozen),
    order: parsedOrder
  };
}

/**
 * Saves the combat state into `server.persistentData.dndCombat` (keeps both `order` and `orderJson`).
 * @param {Internal.MinecraftServer} server
 * @param {object} state
 */
function saveCombatState(server, state) {
  server.persistentData.dndCombat = {
    active: Boolean(state.active),
    round: Number(state.round) || 0,
    turnIndex: Number(state.turnIndex) || 0,
    partyFrozen: Boolean(state.partyFrozen),
    order: state.order || [],
    orderJson: JSON.stringify(state.order || [])
  };
}

/**
 * Sound helper using vanilla execute playsound so clients hear feedback reliably.
 */
function playSoundToPlayer(server, targetName, soundId, volume, pitch) {
  server.runCommandSilent(`execute as ${targetName} at @s run playsound ${soundId} master @s ~ ~ ~ ${volume} ${pitch}`);
}

/**
 * Broadcasts a sound to all players on the server.
 */
function broadcastSound(server, soundId, volume, pitch) {
  server.runCommandSilent(`execute as @a at @s run playsound ${soundId} master @s ~ ~ ~ ${volume} ${pitch}`);
}

// ----------------------------------------------------------------------------
// 2. DICE ENGINE, CHECKS, SKILLS, SAVES & CHARACTER SHEET UI
// ----------------------------------------------------------------------------

/**
 * Parses and rolls a dice formula like "1d20", "2d6+3", "1d8-1" and broadcasts to chat.
 * @param {Internal.ServerPlayer} player
 * @param {string} rawFormula
 * @param {string} [label]
 */
function executeFormulaRoll(player, rawFormula, label) {
  let clean = String(rawFormula).trim().toLowerCase().replace(/\s+/g, '');
  let match = clean.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    player.tell(Text.red('Invalid dice formula! Examples: 1d20, 2d6+3, 1d8-1, 4d6+2'));
    return null;
  }

  let count = parseInt(match[1], 10);
  let sides = parseInt(match[2], 10);
  let modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
    player.tell(Text.red('Dice limits exceeded! Roll between 1-100 dice with 2-1000 sides.'));
    return null;
  }

  let rolls = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    let r = rollSingleDie(sides);
    rolls.push(r);
    sum += r;
  }

  let total = sum + modifier;
  let isD20Single = (count === 1 && sides === 20);
  let nat20 = isD20Single && rolls[0] === 20;
  let nat1 = isD20Single && rolls[0] === 1;

  let server = player.server;
  let rollTitle = label ? label : `Dice Roll (${clean})`;

  if (nat20) {
    broadcastSound(server, 'minecraft:item.totem.use', 0.85, 1.2);
    server.runCommandSilent(`execute at ${player.username} run particle minecraft:totem_of_undying ~ ~1.2 ~ 0.4 0.5 0.4 0.15 40`);
  } else if (nat1) {
    broadcastSound(server, 'minecraft:block.anvil.land', 0.75, 0.8);
    server.runCommandSilent(`execute at ${player.username} run particle minecraft:angry_villager ~ ~1.2 ~ 0.3 0.4 0.3 0.1 12`);
  } else {
    broadcastSound(server, 'minecraft:entity.experience_orb.pickup', 0.8, 1.1);
    server.runCommandSilent(`execute at ${player.username} run particle minecraft:enchant ~ ~1.2 ~ 0.3 0.4 0.3 0.2 20`);
  }

  let modStr = modifier !== 0 ? ` ${formatSigned(modifier)}` : '';
  let breakdown = `[${rolls.join(', ')}]${modStr}`;

  let msg = Text.of('§8[§6🎲 D&D§8] §b' + player.username + ' §7rolled §f' + rollTitle + '§7: ');
  if (nat20) {
    msg.append(Text.of(`§6§l${total} (NATURAL 20!) `).hover(Text.of(`§eBreakdown: §f${breakdown}`)));
  } else if (nat1) {
    msg.append(Text.of(`§4§l${total} (NATURAL 1!) `).hover(Text.of(`§cBreakdown: §f${breakdown}`)));
  } else {
    msg.append(Text.of(`§a§l${total} `).hover(Text.of(`§7Breakdown: §f${breakdown}`)));
  }
  msg.append(Text.of(`§8(${breakdown})`));

  server.tell(msg);
  return { total: total, rolls: rolls, nat20: nat20, nat1: nat1 };
}

/**
 * Performs a 1d20 Ability Check, Skill Check, or Saving Throw with Advantage, Disadvantage & Inspiration.
 * @param {Internal.ServerPlayer} player
 * @param {string} abilityKey
 * @param {string} mode - 'normal', 'adv', or 'dis'
 * @param {boolean} isSave
 * @param {string} [customSkillKey]
 */
function performD20Test(player, abilityKey, mode, isSave, customSkillKey) {
  ensurePlayerDndData(player);
  let dnd = player.persistentData.dnd;
  let key = String(abilityKey).toLowerCase();

  if (DND_ABILITIES.indexOf(key) === -1) {
    player.tell(Text.red(`Unknown ability "${abilityKey}". Valid abilities: str, dex, con, int, wis, cha.`));
    return;
  }

  let rollMode = (mode || 'normal').toLowerCase();
  let consumedInspiration = false;

  // Automatically consume Inspiration to grant Advantage if rolling normally
  if (isTruthyNbt(dnd.inspiration) && rollMode === 'normal') {
    rollMode = 'adv';
    dnd.inspiration = false;
    consumedInspiration = true;
  }

  let r1 = rollSingleDie(20);
  let r2 = rollSingleDie(20);
  let chosenRoll = r1;
  let modeTag = '';

  if (rollMode === 'adv') {
    chosenRoll = Math.max(r1, r2);
    modeTag = consumedInspiration ? ' §6[Inspiration -> ADV]' : ' §a[Advantage]';
  } else if (rollMode === 'dis') {
    chosenRoll = Math.min(r1, r2);
    modeTag = ' §c[Disadvantage]';
  }

  let score = Number(dnd[key]) || 10;
  let abilityMod = getMod(score);
  let profBonus = 0;
  let isProficient = false;

  if (isSave) {
    if (String(dnd.saveProf1) === key || String(dnd.saveProf2) === key) {
      profBonus = getProfBonus(dnd.level);
      isProficient = true;
    }
  } else if (customSkillKey && DND_SKILLS[customSkillKey]) {
    if (hasSkillProficiency(dnd, customSkillKey)) {
      profBonus = getProfBonus(dnd.level);
      isProficient = true;
    }
  }

  let totalMod = abilityMod + profBonus;
  let finalTotal = chosenRoll + totalMod;
  let nat20 = (chosenRoll === 20);
  let nat1 = (chosenRoll === 1);

  let server = player.server;
  if (nat20) {
    broadcastSound(server, 'minecraft:item.totem.use', 0.85, 1.2);
    server.runCommandSilent(`execute at ${player.username} run particle minecraft:totem_of_undying ~ ~1.2 ~ 0.4 0.5 0.4 0.15 40`);
  } else if (nat1) {
    broadcastSound(server, 'minecraft:block.anvil.land', 0.75, 0.8);
    server.runCommandSilent(`execute at ${player.username} run particle minecraft:angry_villager ~ ~1.2 ~ 0.3 0.4 0.3 0.1 12`);
  } else {
    broadcastSound(server, 'minecraft:entity.experience_orb.pickup', 0.8, 1.15);
  }

  let testName = '';
  if (isSave) {
    testName = `${ABILITY_NAMES[key]} Saving Throw${isProficient ? ' §b(Prof)' : ''}`;
  } else if (customSkillKey && DND_SKILLS[customSkillKey]) {
    testName = `${DND_SKILLS[customSkillKey].name} (${key.toUpperCase()})${isProficient ? ' §b(Prof)' : ''}`;
  } else {
    testName = `${ABILITY_NAMES[key]} Check`;
  }

  let diceDetail = (rollMode === 'adv' || rollMode === 'dis') ? `[${r1}, ${r2} -> ${chosenRoll}]` : `[${chosenRoll}]`;
  let breakdown = `${diceDetail} ${formatSigned(abilityMod)} (${key.toUpperCase()})${isProficient ? ' +' + profBonus + ' (Prof)' : ''}`;

  let out = Text.of(`§8[§6🎲 D&D§8] §b${player.username} §7rolled §f${testName}${modeTag}§7: `);
  if (nat20) {
    out.append(Text.of(`§6§l${finalTotal} (NATURAL 20!) `));
  } else if (nat1) {
    out.append(Text.of(`§4§l${finalTotal} (NATURAL 1!) `));
  } else {
    out.append(Text.of(`§e§l${finalTotal} `));
  }
  out.append(Text.of(`§8(${breakdown})`));

  server.tell(out);
}

/**
 * Displays an interactive, clickable Character Sheet in the player's chat.
 * @param {Internal.ServerPlayer} player
 */
function displayCharacterSheet(player) {
  ensurePlayerDndData(player);
  let dnd = player.persistentData.dnd;
  let prof = getProfBonus(dnd.level);
  let preset = CLASS_PRESETS[String(dnd.charClass)] || CLASS_PRESETS.Fighter;

  player.tell(Text.of('§8§m===================================================='));
  player.tell(
    Text.of(`§6§l📜 ${player.username}'s Character Sheet `)
      .append(Text.of(`§7| §eLv.${dnd.level} ${dnd.charClass} `))
      .append(
        Text.of('§8[§bSwitch Class§8]')
          .clickSuggestCommand('/dnd class ')
          .hover(Text.of('§7Click to switch class preset (Fighter, Wizard, Rogue, Cleric, Paladin, Bard)'))
      )
  );

  let hasInsp = isTruthyNbt(dnd.inspiration);
  let vitalsLine = Text.of(
    `§c❤ HP: §f${dnd.hp}/${dnd.maxHp}  §9🛡 AC: §f${dnd.ac}  §a👟 Speed: §f${dnd.speed}m  §b✦ Prof: §f+${prof}  §e★ Insp: ${hasInsp ? '§6§lYES' : '§7NO'}`
  );
  player.tell(vitalsLine);
  player.tell(Text.of('§8§m----------------------------------------------------'));

  DND_ABILITIES.forEach(ab => {
    let score = Number(dnd[ab]) || 10;
    let mod = getMod(score);
    let isSaveProf = (String(dnd.saveProf1) === ab || String(dnd.saveProf2) === ab);
    let saveMod = mod + (isSaveProf ? prof : 0);

    let paddedAb = ab.toUpperCase();
    let scoreStr = score < 10 ? ` ${score}` : `${score}`;
    let modStr = formatSigned(mod);
    let saveStr = formatSigned(saveMod);

    let line = Text.of(`§6§l${paddedAb} §f${scoreStr} §7(${modStr})  `);

    let checkBtn = Text.of('§a[🎲 Check] ')
      .clickRunCommand(`/dnd check ${ab} normal`)
      .hover(Text.of(`§aRoll ${ABILITY_NAMES[ab]} Check\n§7Formula: 1d20 ${modStr}`));

    let advBtn = Text.of('§2[▲] ')
      .clickRunCommand(`/dnd check ${ab} adv`)
      .hover(Text.of(`§2Roll ${ABILITY_NAMES[ab]} Check with Advantage`));

    let disBtn = Text.of('§c[▼]  ')
      .clickRunCommand(`/dnd check ${ab} dis`)
      .hover(Text.of(`§cRoll ${ABILITY_NAMES[ab]} Check with Disadvantage`));

    let saveBtn = Text.of(isSaveProf ? `§b[🛡 Save* (${saveStr})]` : `§3[🛡 Save (${saveStr})]`)
      .clickRunCommand(`/dnd save ${ab}`)
      .hover(
        Text.of(
          `§bRoll ${ABILITY_NAMES[ab]} Saving Throw\n` +
          `§7Modifier: ${saveStr} ${isSaveProf ? '§b(Proficient)' : '§8(Not Proficient)'}`
        )
      );

    line.append(checkBtn).append(advBtn).append(disBtn).append(saveBtn);
    player.tell(line);
  });

  player.tell(Text.of('§8§m----------------------------------------------------'));

  // Quick Skill & Rest Bar
  let utilityRow = Text.of('§7Quick: ')
    .append(
      Text.of('§e[👁 Perception] ')
        .clickRunCommand('/dnd skill perception normal')
        .hover(Text.of('§eRoll Wisdom (Perception) Skill Check'))
    )
    .append(
      Text.of('§b[🗡 Stealth] ')
        .clickRunCommand('/dnd skill stealth normal')
        .hover(Text.of('§bRoll Dexterity (Stealth) Skill Check'))
    )
    .append(
      Text.of('§d[✨ Class Feature] ')
        .clickRunCommand('/dnd action feature')
        .hover(Text.of(`§dUse ${preset.featureName}`))
    )
    .append(
      Text.of('§a[⛺ Short Rest]')
        .clickRunCommand('/dnd rest short')
        .hover(Text.of(`§aSpend a Hit Die (1d${dnd.hitDie || 8} + CON) to recover HP`))
    );
  player.tell(utilityRow);
  player.tell(Text.of('§8§m===================================================='));
}

// ----------------------------------------------------------------------------
// 3. TURN-BASED COMBAT & GRID MOVEMENT ENGINE
// ----------------------------------------------------------------------------

/**
 * Helper to look up a live Entity on the server by its string UUID.
 * @param {Internal.MinecraftServer} server
 * @param {string} uuidStr
 * @returns {Internal.Entity | null}
 */
function findEntityByUuid(server, uuidStr) {
  let found = null;
  server.entities.forEach(ent => {
    if (!found && ent.uuid.toString() === uuidStr) {
      found = ent;
    }
  });
  return found;
}

/**
 * Prints the interactive combat HUD buttons to the active player on their turn.
 * @param {Internal.ServerPlayer} player
 * @param {object} combatant
 */
function sendTurnPromptToPlayer(player, combatant) {
  player.tell(Text.of('§8§m----------------------------------------------------'));
  player.tell(Text.of(`§6§l⚔ IT IS YOUR TURN, ${player.username.toUpperCase()}! ⚔`));
  player.tell(
    Text.of(`§7Movement: §a${Number(combatant.remainingMove).toFixed(1)}m §8| `)
      .append(Text.of(`§7Action: ${combatant.hasAction ? '§aREADY' : '§cUSED'} §8| `))
      .append(Text.of(`§7Bonus: ${combatant.hasBonusAction ? '§aREADY' : '§cUSED'}`))
  );

  let actionRow = Text.of('§eActions: ')
    .append(
      Text.of('§c§l[⚔ Attack] ')
        .clickRunCommand('/dnd action attack')
        .hover(Text.of('§cAttack the entity in your crosshairs (5m melee / 20m ranged)'))
    )
    .append(
      Text.of('§b§l[💨 Dash] ')
        .clickRunCommand('/dnd action dash')
        .hover(Text.of('§bExpend your Action to double your movement allowance this turn'))
    )
    .append(
      Text.of('§d§l[✨ Feature] ')
        .clickRunCommand('/dnd action feature')
        .hover(Text.of('§dExpend your Bonus Action to trigger your Class Feature'))
    )
    .append(
      Text.of('§6§l[📜 Sheet] ')
        .clickRunCommand('/dnd sheet')
        .hover(Text.of('§6Open your Character Sheet'))
    )
    .append(
      Text.of('§a§l[⏭ End Turn]')
        .clickRunCommand('/dnd next')
        .hover(Text.of('§aFinish your turn and pass initiative to the next combatant'))
    );

  player.tell(actionRow);
  player.tell(Text.of('§8§m----------------------------------------------------'));
}

/**
 * Starts a Turn-Based D&D Combat Encounter around the origin entity/player.
 * @param {Internal.ServerPlayer} originPlayer
 * @param {number} radius
 */
function startCombatEncounter(originPlayer, radius) {
  let server = originPlayer.server;
  let scanRadius = Math.max(5, Math.min(100, Number(radius) || 25));
  let level = originPlayer.level;

  let aabb = AABB.of(
    originPlayer.x - scanRadius,
    originPlayer.y - scanRadius,
    originPlayer.z - scanRadius,
    originPlayer.x + scanRadius,
    originPlayer.y + scanRadius,
    originPlayer.z + scanRadius
  );

  let rawEntities = level.getEntitiesWithin(aabb);
  let order = [];

  rawEntities.forEach(ent => {
    if (!ent.isLiving() || !ent.isAlive()) return;

    if (ent.isPlayer()) {
      ensurePlayerDndData(ent);
      let dnd = ent.persistentData.dnd;
      let dexMod = getMod(dnd.dex);
      let initRoll = rollSingleDie(20);
      let initTotal = initRoll + dexMod;

      order.push({
        uuid: ent.uuid.toString(),
        name: ent.username,
        isPlayer: true,
        initiative: initTotal,
        initRoll: initRoll,
        initMod: dexMod,
        startX: Math.floor(ent.x) + 0.5,
        startY: ent.y,
        startZ: Math.floor(ent.z) + 0.5,
        speed: Number(dnd.speed) || 6,
        maxMoveThisTurn: Number(dnd.speed) || 6,
        remainingMove: Number(dnd.speed) || 6,
        hasAction: true,
        hasBonusAction: true,
        ac: Number(dnd.ac) || 14
      });
    } else {
      let isMonster = ent.isMonster();
      let hasCustomName = ent.hasCustomName();
      if (isMonster || hasCustomName) {
        let initRoll = rollSingleDie(20);
        let initMod = 1;
        let initTotal = initRoll + initMod;
        let armorVal = ent.armorValue ? Number(ent.armorValue) : 0;
        let computedAc = Math.max(12, 11 + Math.floor(armorVal / 2));

        order.push({
          uuid: ent.uuid.toString(),
          name: ent.displayName.getString(),
          isPlayer: false,
          initiative: initTotal,
          initRoll: initRoll,
          initMod: initMod,
          startX: Math.floor(ent.x) + 0.5,
          startY: ent.y,
          startZ: Math.floor(ent.z) + 0.5,
          speed: 6,
          maxMoveThisTurn: 6,
          remainingMove: 6,
          hasAction: true,
          hasBonusAction: true,
          ac: computedAc
        });

        ent.mergeNbt('{NoAI:1b}');
      }
    }
  });

  if (order.length === 0) {
    originPlayer.tell(Text.red('No valid combatants found within ' + scanRadius + ' blocks!'));
    return;
  }

  // Sort participants descending by Initiative (tie-breaker: higher initMod)
  order.sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return b.initMod - a.initMod;
  });

  // Clear previous glowing effects if any
  order.forEach(c => {
    let e = findEntityByUuid(server, c.uuid);
    if (e && e.isLiving()) {
      e.removeEffect('minecraft:glowing');
    }
  });

  let prevCombat = getCombatState(server);
  let newState = {
    active: true,
    round: 1,
    turnIndex: 0,
    partyFrozen: Boolean(prevCombat.partyFrozen),
    order: order
  };
  saveCombatState(server, newState);

  broadcastSound(server, 'minecraft:event.raid.horn', 0.9, 1.0);

  server.tell(Text.of('§8§m===================================================='));
  server.tell(Text.of(`§6§l⚔ D&D TURN-BASED COMBAT STARTED! §7(Radius: ${scanRadius}m) ⚔`));
  server.tell(Text.of('§e§lInitiative Order (Round 1):'));

  for (let i = 0; i < order.length; i++) {
    let c = order[i];
    let marker = (i === 0) ? '§a§l▶ ' : '§7  ';
    let typeColor = c.isPlayer ? '§b' : '§c';
    server.tell(
      Text.of(`${marker}§f#${i + 1} §e[${c.initiative}] ${typeColor}${c.name} §8(1d20[${c.initRoll}] ${formatSigned(c.initMod)})`)
    );
  }
  server.tell(Text.of('§8§m===================================================='));

  activateCurrentTurn(server);
}

/**
 * Sets up the active combatant at the current turnIndex (applies Glowing, resets turn resources).
 * @param {Internal.MinecraftServer} server
 */
function activateCurrentTurn(server) {
  let combat = getCombatState(server);
  if (!combat.active || combat.order.length === 0) return;

  // Prune dead or despawned entities
  let validOrder = [];
  for (let i = 0; i < combat.order.length; i++) {
    let item = combat.order[i];
    let ent = findEntityByUuid(server, item.uuid);
    if (ent && ent.isAlive()) {
      ent.removeEffect('minecraft:glowing');
      validOrder.push(item);
    }
  }
  combat.order = validOrder;

  if (combat.order.length === 0) {
    endCombatEncounter(server);
    return;
  }

  if (combat.turnIndex >= combat.order.length) {
    combat.turnIndex = 0;
    combat.round = (Number(combat.round) || 1) + 1;
    server.tell(Text.of(`§6§l=== ⚔ COMBAT ROUND ${combat.round} BEGINS ⚔ ===`));
  }

  let active = combat.order[combat.turnIndex];
  let ent = findEntityByUuid(server, active.uuid);

  if (ent) {
    active.startX = ent.x;
    active.startY = ent.y;
    active.startZ = ent.z;

    let baseSpeed = 6;
    if (active.isPlayer && ent.isPlayer()) {
      ensurePlayerDndData(ent);
      baseSpeed = Number(ent.persistentData.dnd.speed) || 6;
    }
    active.speed = baseSpeed;
    active.maxMoveThisTurn = baseSpeed;
    active.remainingMove = baseSpeed;
    active.hasAction = true;
    active.hasBonusAction = true;

    saveCombatState(server, combat);

    // Apply Glowing highlight to active combatant
    ent.potionEffects.add('minecraft:glowing', 999999, 0, false, false);

    if (active.isPlayer && ent.isPlayer()) {
      playSoundToPlayer(server, ent.username, 'minecraft:block.note_block.chime', 1.0, 1.2);
      sendTurnPromptToPlayer(ent, active);
    } else {
      server.tell(
        Text.of(`§8[§6⚔ Combat§8] §c§l${active.name}'s Turn! §7(NPC/Mob) `)
          .append(
            Text.of('§e[⏭ Next Turn]')
              .clickRunCommand('/dnd next')
              .hover(Text.of('§7Click to advance to the next turn'))
          )
      );
    }
  } else {
    saveCombatState(server, combat);
  }
}

/**
 * Advances to the next combatant in the Initiative Order.
 * @param {Internal.MinecraftServer} server
 */
function advanceCombatTurn(server) {
  let combat = getCombatState(server);
  if (!combat.active || combat.order.length === 0) {
    server.tell(Text.red('No active D&D combat encounter!'));
    return;
  }

  let prev = combat.order[combat.turnIndex];
  if (prev) {
    let prevEnt = findEntityByUuid(server, prev.uuid);
    if (prevEnt) {
      prev.startX = prevEnt.x;
      prev.startY = prevEnt.y;
      prev.startZ = prevEnt.z;
      prevEnt.removeEffect('minecraft:glowing');
    }
  }

  combat.turnIndex = (Number(combat.turnIndex) || 0) + 1;
  saveCombatState(server, combat);
  activateCurrentTurn(server);
}

/**
 * Ends the active Turn-Based Combat encounter, restoring AI and removing glowing effects.
 * @param {Internal.MinecraftServer} server
 */
function endCombatEncounter(server) {
  let combat = getCombatState(server);
  if (combat.order && combat.order.length > 0) {
    for (let i = 0; i < combat.order.length; i++) {
      let c = combat.order[i];
      let ent = findEntityByUuid(server, c.uuid);
      if (ent && ent.isLiving()) {
        ent.removeEffect('minecraft:glowing');
        if (!c.isPlayer) {
          ent.mergeNbt('{NoAI:0b}');
        }
      }
    }
  }

  saveCombatState(server, {
    active: false,
    round: 0,
    turnIndex: 0,
    partyFrozen: Boolean(combat.partyFrozen),
    order: []
  });

  broadcastSound(server, 'minecraft:block.beacon.deactivate', 0.9, 1.0);
  server.tell(Text.of('§8[§6⚔ D&D Combat§8] §a§lCombat Encounter Ended! §7Free movement restored.'));
}

/**
 * Executes `/dnd action attack` for the active player against the entity in their line of sight.
 * Supports 5m melee reach or 20m ranged/spell reach when holding a bow, crossbow, or staff/wand.
 * @param {Internal.ServerPlayer} player
 */
function performCombatAttack(player) {
  let server = player.server;
  let combat = getCombatState(server);

  if (!combat.active) {
    player.tell(Text.red('Combat is not currently active!'));
    return;
  }

  let active = combat.order[combat.turnIndex];
  if (!active || active.uuid !== player.uuid.toString()) {
    player.tell(Text.red('It is not your turn to act!'));
    return;
  }

  if (!active.hasAction) {
    player.tell(Text.red('You have already used your Action this turn!'));
    return;
  }

  let heldId = player.mainHandItem ? String(player.mainHandItem.id) : '';
  let isRangedWeapon = (
    heldId.indexOf('bow') !== -1 ||
    heldId.indexOf('crossbow') !== -1 ||
    heldId.indexOf('trident') !== -1 ||
    String(player.persistentData.dnd.charClass) === 'Wizard' ||
    String(player.persistentData.dnd.charClass) === 'Bard'
  );
  let reach = isRangedWeapon ? 20.0 : 5.0;

  let ray = player.rayTrace(reach, false);
  if (!ray || !ray.entity || !ray.entity.isLiving() || !ray.entity.isAlive()) {
    player.tell(
      Text.red(`No living target in sight within ${reach} blocks! Aim directly at an enemy and try again.`)
    );
    return;
  }

  let target = ray.entity;
  ensurePlayerDndData(player);
  let dnd = player.persistentData.dnd;

  // Choose highest relevant attack stat (STR, DEX, or INT/CHA for spellcasters)
  let strMod = getMod(dnd.str);
  let dexMod = getMod(dnd.dex);
  let intMod = getMod(dnd.int);
  let chaMod = getMod(dnd.cha);
  let bestMod = Math.max(strMod, dexMod);
  if (String(dnd.charClass) === 'Wizard') bestMod = Math.max(bestMod, intMod);
  if (String(dnd.charClass) === 'Bard' || String(dnd.charClass) === 'Paladin') bestMod = Math.max(bestMod, chaMod);
  if (String(dnd.charClass) === 'Cleric') bestMod = Math.max(bestMod, getMod(dnd.wis));

  let profBonus = getProfBonus(dnd.level);
  let attackMod = bestMod + profBonus;

  // Determine Target AC
  let targetAc = 12;
  let targetName = target.displayName.getString();
  if (target.isPlayer()) {
    ensurePlayerDndData(target);
    targetAc = Number(target.persistentData.dnd.ac) || 14;
    targetName = target.username;
  } else {
    for (let i = 0; i < combat.order.length; i++) {
      if (combat.order[i].uuid === target.uuid.toString()) {
        targetAc = Number(combat.order[i].ac) || 12;
        break;
      }
    }
  }

  // Deduct Action and save
  active.hasAction = false;
  saveCombatState(server, combat);

  // Roll Attack (with automatic Inspiration advantage if active)
  let r1 = rollSingleDie(20);
  let r2 = rollSingleDie(20);
  let d20 = r1;
  let inspUsed = false;
  if (isTruthyNbt(dnd.inspiration)) {
    d20 = Math.max(r1, r2);
    dnd.inspiration = false;
    inspUsed = true;
  }

  let nat20 = (d20 === 20);
  let nat1 = (d20 === 1);
  let totalAttack = d20 + attackMod;
  let isHit = nat20 || (!nat1 && totalAttack >= targetAc);

  server.tell(
    Text.of(`§8[§6⚔ Attack§8] §b${player.username} §7attacks §c${targetName} §8(AC ${targetAc})${inspUsed ? ' §6[Inspiration ADV]' : ''}§7: `)
      .append(
        nat20
          ? Text.of(`§6§lCRITICAL HIT! (Nat 20 -> ${totalAttack})`)
          : nat1
          ? Text.of(`§4§lCRITICAL MISS! (Nat 1)`)
          : Text.of(`§e§l${totalAttack} §8(1d20[${d20}] ${formatSigned(attackMod)}) ${isHit ? '§a§lHIT!' : '§c§lMISS!'}`)
      )
  );

  if (isHit) {
    let dmgRoll1 = rollSingleDie(8);
    let dmgRoll2 = nat20 ? rollSingleDie(8) : 0;
    let totalDamage = Math.max(1, dmgRoll1 + dmgRoll2 + bestMod);

    target.attack(player.damageSources().playerAttack(player), totalDamage);

    if (target.isPlayer()) {
      target.persistentData.dnd.hp = Math.max(0, Math.round(target.health));
    }

    broadcastSound(server, nat20 ? 'minecraft:entity.player.attack.crit' : 'minecraft:entity.player.attack.strong', 1.0, 1.0);
    server.runCommandSilent(`execute at ${player.username} run particle minecraft:sweep_attack ~ ~1.0 ~ 0.2 0.2 0.2 0.0 3`);

    let dmgBreakdown = nat20
      ? `2d8[${dmgRoll1}+${dmgRoll2}] ${formatSigned(bestMod)}`
      : `1d8[${dmgRoll1}] ${formatSigned(bestMod)}`;

    server.tell(
      Text.of(`§8[§c💥 Damage§8] §c${targetName} §7takes §c§l${totalDamage} §7damage! §8(${dmgBreakdown})`)
    );
  } else {
    broadcastSound(server, 'minecraft:entity.player.attack.nodamage', 1.0, 0.9);
  }
}

/**
 * Executes `/dnd action dash` for the active player, doubling their speed allowance this turn.
 * @param {Internal.ServerPlayer} player
 */
function performCombatDash(player) {
  let server = player.server;
  let combat = getCombatState(server);

  if (!combat.active) {
    player.tell(Text.red('Combat is not currently active!'));
    return;
  }

  let active = combat.order[combat.turnIndex];
  if (!active || active.uuid !== player.uuid.toString()) {
    player.tell(Text.red('It is not your turn to act!'));
    return;
  }

  if (!active.hasAction) {
    player.tell(Text.red('You have already used your Action this turn!'));
    return;
  }

  active.hasAction = false;
  active.maxMoveThisTurn = Number(active.maxMoveThisTurn) + Number(active.speed);

  let dx = player.x - Number(active.startX);
  let dz = player.z - Number(active.startZ);
  let distMoved = Math.sqrt(dx * dx + dz * dz);
  active.remainingMove = Math.max(0, active.maxMoveThisTurn - distMoved);

  saveCombatState(server, combat);

  playSoundToPlayer(server, player.username, 'minecraft:entity.villager.work_fletcher', 1.0, 1.3);
  server.runCommandSilent(`execute at ${player.username} run particle minecraft:cloud ~ ~0.2 ~ 0.3 0.1 0.3 0.05 15`);

  server.tell(
    Text.of(`§8[§6💨 Dash§8] §b${player.username} §7uses §b§lDash§7! Movement limit increased to §a${active.maxMoveThisTurn}m §7this turn.`)
  );
}

/**
 * Executes `/dnd action feature` (Class Bonus Feature: Second Wind, Cunning Action, Lay on Hands, etc.)
 * @param {Internal.ServerPlayer} player
 */
function performClassFeature(player) {
  ensurePlayerDndData(player);
  let dnd = player.persistentData.dnd;
  let server = player.server;
  let combat = getCombatState(server);

  if (combat.active) {
    let active = combat.order[combat.turnIndex];
    if (!active || active.uuid !== player.uuid.toString()) {
      player.tell(Text.red('You can only use your Class Feature on your turn during combat!'));
      return;
    }
    if (!active.hasBonusAction) {
      player.tell(Text.red('You have already used your Bonus Action this turn!'));
      return;
    }
    active.hasBonusAction = false;
    saveCombatState(server, combat);
  }

  let charClass = String(dnd.charClass);
  let lv = Number(dnd.level) || 1;

  if (charClass === 'Fighter') {
    let heal = rollSingleDie(10) + lv;
    dnd.hp = Math.min(Number(dnd.maxHp), Number(dnd.hp) + heal);
    syncVanillaHealth(player);
    broadcastSound(server, 'minecraft:entity.player.levelup', 0.8, 1.4);
    server.tell(Text.of(`§8[§6✨ Feature§8] §b${player.username} §7uses §a§lSecond Wind §7and recovers §a+${heal} HP§7!`));
  } else if (charClass === 'Rogue') {
    if (combat.active) {
      let active = combat.order[combat.turnIndex];
      active.maxMoveThisTurn = Number(active.maxMoveThisTurn) + Number(active.speed);
      active.remainingMove = Number(active.remainingMove) + Number(active.speed);
      saveCombatState(server, combat);
    }
    broadcastSound(server, 'minecraft:entity.ender_dragon.flap', 0.7, 1.6);
    server.tell(Text.of(`§8[§6✨ Feature§8] §b${player.username} §7uses §b§lCunning Action (Bonus Dash)§7!`));
  } else if (charClass === 'Paladin' || charClass === 'Cleric') {
    let heal = 5 * lv;
    dnd.hp = Math.min(Number(dnd.maxHp), Number(dnd.hp) + heal);
    syncVanillaHealth(player);
    broadcastSound(server, 'minecraft:block.beacon.power_select', 0.8, 1.3);
    server.tell(Text.of(`§8[§6✨ Feature§8] §b${player.username} §7channels divine power and restores §d+${heal} HP§7!`));
  } else if (charClass === 'Bard') {
    dnd.inspiration = true;
    broadcastSound(server, 'minecraft:block.note_block.harp', 1.0, 1.4);
    server.tell(Text.of(`§8[§6✨ Feature§8] §b${player.username} §7performs §e§lBardic Inspiration§7, granting Advantage on their next roll!`));
  } else {
    // Wizard Arcane Ward
    player.potionEffects.add('minecraft:absorption', 1200, 0, false, true);
    broadcastSound(server, 'minecraft:block.enchantment_table.use', 0.9, 1.3);
    server.tell(Text.of(`§8[§6✨ Feature§8] §b${player.username} §7weaves an §b§lArcane Ward§7, gaining protective Absorption!`));
  }
}

/**
 * Executes Short or Long Rest for a player.
 * @param {Internal.ServerPlayer} player
 * @param {string} restType - 'short' or 'long'
 */
function performRest(player, restType) {
  ensurePlayerDndData(player);
  let dnd = player.persistentData.dnd;
  let server = player.server;

  if (restType === 'short') {
    let hitDieSides = Number(dnd.hitDie) || 8;
    let conMod = getMod(dnd.con);
    let rolled = rollSingleDie(hitDieSides);
    let healed = Math.max(1, rolled + conMod);
    dnd.hp = Math.min(Number(dnd.maxHp), Number(dnd.hp) + healed);
    syncVanillaHealth(player);
    playSoundToPlayer(server, player.username, 'minecraft:block.campfire.crackle', 1.0, 1.0);
    server.tell(
      Text.of(`§8[§6⛺ Short Rest§8] §b${player.username} §7spends a Hit Die (1d${hitDieSides}[${rolled}] ${formatSigned(conMod)}) and recovers §a+${healed} HP §8(${dnd.hp}/${dnd.maxHp})§7.`)
    );
  } else {
    dnd.hp = dnd.maxHp;
    dnd.hitDiceRemaining = dnd.level;
    dnd.featureUsed = false;
    syncVanillaHealth(player);
    playSoundToPlayer(server, player.username, 'minecraft:entity.player.levelup', 0.8, 1.0);
    server.tell(
      Text.of(`§8[§6🌙 Long Rest§8] §b${player.username} §7completes a Long Rest! §aHP (${dnd.maxHp}/${dnd.maxHp}) §7and class resources fully restored.`)
    );
  }
}

// ----------------------------------------------------------------------------
// 4. INTERACTIVE DM CONTROL PANEL
// ----------------------------------------------------------------------------

/**
 * Displays the clickable Game Master Control Panel in chat.
 * @param {Internal.ServerPlayer} player
 */
function displayDmControlPanel(player) {
  player.tell(Text.of('§8§m===================================================='));
  player.tell(Text.of('§d§l🔮 D&D 5e GAME MASTER CONTROL PANEL 🔮'));
  player.tell(Text.of('§7Click any button below to orchestrate the encounter:'));
  player.tell(Text.of('§8§m----------------------------------------------------'));

  // Row 1: Combat Controls
  let row1 = Text.of('§6Combat: ')
    .append(
      Text.of('§a§l[⚔ Start Combat] ')
        .clickRunCommand('/dnd combat start 25')
        .hover(Text.of('§aScan 25m radius, roll Initiative, and begin Turn-Based Combat'))
    )
    .append(
      Text.of('§c§l[⏹ Stop Combat] ')
        .clickRunCommand('/dnd combat end')
        .hover(Text.of('§cEnd Turn-Based Combat and restore normal movement'))
    )
    .append(
      Text.of('§e§l[⏭ Next Turn]')
        .clickRunCommand('/dnd next')
        .hover(Text.of('§eAdvance Initiative to the next participant'))
    );
  player.tell(row1);

  // Row 2: Party Movement & Healing Controls
  let row2 = Text.of('§bParty:   ')
    .append(
      Text.of('§3§l[❄ Freeze Party] ')
        .clickRunCommand('/dnd dm_action freeze')
        .hover(Text.of('§bLock all non-DM players in place for narration or cutscenes'))
    )
    .append(
      Text.of('§b§l[☀ Unfreeze Party] ')
        .clickRunCommand('/dnd dm_action unfreeze')
        .hover(Text.of('§bRelease movement lock on all players'))
    )
    .append(
      Text.of('§d§l[❤ Full Heal Party]')
        .clickRunCommand('/dnd dm_action heal_all')
        .hover(Text.of('§dRestore all players to full D&D & Vanilla HP'))
    );
  player.tell(row2);

  // Row 3: Group Checks & Saving Throws
  let row3 = Text.of('§eGroup:   ')
    .append(
      Text.of('§a§l[👁 Group Perception] ')
        .clickRunCommand('/dnd dm_action group_perception')
        .hover(Text.of('§aPrompt every online player to roll a Wisdom (Perception) Check'))
    )
    .append(
      Text.of('§6§l[⚡ DEX Save] ')
        .clickRunCommand('/dnd dm_action group_dex_save')
        .hover(Text.of('§6Force all players to roll a Dexterity Saving Throw'))
    )
    .append(
      Text.of('§5§l[🧠 WIS Save]')
        .clickRunCommand('/dnd dm_action group_wis_save')
        .hover(Text.of('§5Force all players to roll a Wisdom Saving Throw'))
    );
  player.tell(row3);

  // Row 4: Rewards & Rests
  let row4 = Text.of('§6Rewards: ')
    .append(
      Text.of('§e§l[★ Grant Inspiration to All] ')
        .clickRunCommand('/dnd dm_action inspire_all')
        .hover(Text.of('§eGrant Heroic Inspiration (Advantage on next roll) to all online players'))
    )
    .append(
      Text.of('§a§l[🌙 Long Rest Party]')
        .clickRunCommand('/dnd dm_action long_rest_all')
        .hover(Text.of('§aGrant a full Long Rest to every player in the party'))
    );
  player.tell(row4);

  player.tell(Text.of('§8§m===================================================='));
}

/**
 * Toggles the global DM Party Freeze state.
 * @param {Internal.ServerPlayer} dmPlayer
 * @param {boolean} [forceState]
 */
function togglePartyFreeze(dmPlayer, forceState) {
  let server = dmPlayer.server;
  let combat = getCombatState(server);

  let nextState = (typeof forceState === 'boolean') ? forceState : !combat.partyFrozen;
  combat.partyFrozen = nextState;
  saveCombatState(server, combat);

  if (nextState) {
    server.players.forEach(p => {
      p.persistentData.freezeX = p.x;
      p.persistentData.freezeY = p.y;
      p.persistentData.freezeZ = p.z;
    });
    broadcastSound(server, 'minecraft:block.glass.break', 0.8, 0.7);
    server.tell(Text.of('§8[§b❄ DM Control§8] §b§lThe Game Master has FROZEN the party! §7Listen closely...'));
  } else {
    broadcastSound(server, 'minecraft:block.beacon.activate', 0.8, 1.3);
    server.tell(Text.of('§8[§a☀ DM Control§8] §a§lThe Game Master has UNFROZEN the party! §7You may move freely.'));
  }
}

// ----------------------------------------------------------------------------
// 5. PLAYER LOGIN, TICK & ITEM RIGHT-CLICK EVENTS
// ----------------------------------------------------------------------------

PlayerEvents.loggedIn(event => {
  ensurePlayerDndData(event.player);
});

// Enforces Turn-Based Grid Movement and DM Party Freeze every tick
PlayerEvents.tick(event => {
  let player = event.player;
  let server = event.server;
  if (!server.persistentData.contains('dndCombat')) return;

  let combat = getCombatState(server);

  // 1. Check DM Party Freeze (applies to players not holding DM Wand/Orb)
  if (combat.partyFrozen) {
    let mainId = player.mainHandItem ? String(player.mainHandItem.id) : '';
    let isHoldingDmTool = (mainId === 'kubejs:dm_wand' || mainId === 'kubejs:dm_orb');
    if (!isHoldingDmTool) {
      let fx = Number(player.persistentData.freezeX);
      let fy = Number(player.persistentData.freezeY);
      let fz = Number(player.persistentData.freezeZ);
      if (!isNaN(fx) && !isNaN(fz)) {
        let fdx = player.x - fx;
        let fdz = player.z - fz;
        if (Math.sqrt(fdx * fdx + fdz * fdz) > 0.3) {
          player.teleportTo(player.level.dimension, fx, fy, fz, player.yaw, player.pitch);
        }
      } else {
        player.persistentData.freezeX = player.x;
        player.persistentData.freezeY = player.y;
        player.persistentData.freezeZ = player.z;
      }
      if (server.tickCount % 10 === 0) {
        player.setStatusMessage(Text.of('§b❄ §lPARTY FROZEN BY GAME MASTER §b❄'));
      }
      return;
    }
  }

  // 2. Check Active Turn-Based Combat Movement Rules
  if (!combat.active || combat.order.length === 0) return;

  let myEntry = null;
  let activeEntry = combat.order[combat.turnIndex];

  for (let i = 0; i < combat.order.length; i++) {
    if (combat.order[i].uuid === player.uuid.toString()) {
      myEntry = combat.order[i];
      break;
    }
  }

  if (!myEntry || !activeEntry) return;

  let isMyTurn = (activeEntry.uuid === player.uuid.toString());

  if (!isMyTurn) {
    // Lock non-active player to their stored coordinates if they move > 0.3 blocks horizontally
    let dx = player.x - Number(myEntry.startX);
    let dz = player.z - Number(myEntry.startZ);
    let horizDist = Math.sqrt(dx * dx + dz * dz);

    if (horizDist > 0.3) {
      player.teleportTo(
        player.level.dimension,
        Number(myEntry.startX),
        Number(myEntry.startY),
        Number(myEntry.startZ),
        player.yaw,
        player.pitch
      );
    }

    if (server.tickCount % 10 === 0) {
      player.setStatusMessage(
        Text.of(`§c⏳ Waiting for §e§l${activeEntry.name}'s §cturn §8(Round ${combat.round})`)
      );
    }
  } else {
    // Track active player's horizontal movement from turn-start coordinates
    let dx = player.x - Number(myEntry.startX);
    let dz = player.z - Number(myEntry.startZ);
    let distMoved = Math.sqrt(dx * dx + dz * dz);
    let maxMove = Number(myEntry.maxMoveThisTurn) || Number(myEntry.speed) || 6;

    if (distMoved > maxMove) {
      let ratio = (maxMove - 0.05) / distMoved;
      let clampedX = Number(myEntry.startX) + dx * ratio;
      let clampedZ = Number(myEntry.startZ) + dz * ratio;

      player.teleportTo(
        player.level.dimension,
        clampedX,
        player.y,
        clampedZ,
        player.yaw,
        player.pitch
      );
      myEntry.remainingMove = 0;
    } else {
      myEntry.remainingMove = Math.max(0, maxMove - distMoved);
    }

    if (server.tickCount % 5 === 0) {
      saveCombatState(server, combat);
      let remStr = Number(myEntry.remainingMove).toFixed(1);
      let actStr = myEntry.hasAction ? '§a● Action' : '§8○ Action';
      let bonStr = myEntry.hasBonusAction ? '§b● Bonus' : '§8○ Bonus';
      player.setStatusMessage(
        Text.of(`§6⚔ §lYOUR TURN §8| §eMove: §f${remStr}m / ${maxMove}m §8| ${actStr} §8| ${bonStr}`)
      );
    }
  }
});

// Custom RPG Item Right-Click Handlers
ItemEvents.rightClicked(event => {
  let player = event.player;
  let item = event.item;
  let server = event.server;

  // 1. kubejs:dm_wand
  if (item.id === 'kubejs:dm_wand') {
    if (player.crouching) {
      togglePartyFreeze(player);
    } else {
      let combat = getCombatState(server);
      if (combat.active) {
        endCombatEncounter(server);
      } else {
        startCombatEncounter(player, 25);
      }
    }
    player.swing();
    event.cancel();
  }

  // 2. kubejs:dm_orb
  if (item.id === 'kubejs:dm_orb') {
    playSoundToPlayer(server, player.username, 'minecraft:block.enchantment_table.use', 0.8, 1.2);
    displayDmControlPanel(player);
    player.swing();
    event.cancel();
  }

  // 3. kubejs:d20_die
  if (item.id === 'kubejs:d20_die') {
    if (player.crouching) {
      displayCharacterSheet(player);
    } else {
      executeFormulaRoll(player, '1d20', 'Physical d20 Die');
      player.addItemCooldown(item.item, 15);
    }
    player.swing();
    event.cancel();
  }

  // 4. kubejs:inspiration_token
  if (item.id === 'kubejs:inspiration_token') {
    ensurePlayerDndData(player);
    let dnd = player.persistentData.dnd;

    if (isTruthyNbt(dnd.inspiration)) {
      player.tell(Text.yellow('You already have Heroic Inspiration active!'));
      event.cancel();
      return;
    }

    dnd.inspiration = true;
    item.count--;

    broadcastSound(server, 'minecraft:block.amethyst_block.chime', 1.0, 1.3);
    server.runCommandSilent(`execute at ${player.username} run particle minecraft:wax_on ~ ~1.2 ~ 0.4 0.5 0.4 0.1 25`);
    server.tell(
      Text.of(`§8[§6★ Inspiration§8] §b${player.username} §7consumed an §e§lInspiration Token§7! §6(Advantage on next d20 roll)`)
    );
    player.swing();
    event.cancel();
  }

  // 5. kubejs:character_folio
  if (item.id === 'kubejs:character_folio') {
    if (player.crouching) {
      performRest(player, 'short');
    } else {
      displayCharacterSheet(player);
    }
    player.swing();
    event.cancel();
  }

  // 6. kubejs:healing_draught
  if (item.id === 'kubejs:healing_draught') {
    ensurePlayerDndData(player);
    let dnd = player.persistentData.dnd;
    let r1 = rollSingleDie(4);
    let r2 = rollSingleDie(4);
    let heal = r1 + r2 + 2;
    dnd.hp = Math.min(Number(dnd.maxHp), Number(dnd.hp) + heal);
    syncVanillaHealth(player);
    item.count--;
    broadcastSound(server, 'minecraft:entity.generic.drink', 1.0, 1.1);
    server.tell(
      Text.of(`§8[§c🧪 Healing§8] §b${player.username} §7drinks a §c§lPotion of Healing (2d4+2) §7and restores §a+${heal} HP §8([${r1}, ${r2}] + 2)§7!`)
    );
    player.swing();
    event.cancel();
  }
});

// ----------------------------------------------------------------------------
// 6. COMMAND REGISTRY (/dnd ...)
// ----------------------------------------------------------------------------

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event;

  event.register(
    Commands.literal('dnd')
      // /dnd sheet
      .then(
        Commands.literal('sheet')
          .executes(ctx => {
            let player = ctx.source.playerOrException;
            displayCharacterSheet(player);
            return 1;
          })
      )

      // /dnd class <className>
      .then(
        Commands.literal('class')
          .then(
            Commands.argument('className', Arguments.WORD.create(event))
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                let inputName = Arguments.WORD.getResult(ctx, 'className');

                let matchedKey = null;
                Object.keys(CLASS_PRESETS).forEach(k => {
                  if (k.toLowerCase() === String(inputName).toLowerCase()) {
                    matchedKey = k;
                  }
                });

                if (!matchedKey) {
                  player.tell(
                    Text.red(`Invalid class "${inputName}"! Choose from: Fighter, Wizard, Rogue, Cleric, Paladin, Bard.`)
                  );
                  return 0;
                }

                ensurePlayerDndData(player, matchedKey);
                playSoundToPlayer(player.server, player.username, 'minecraft:entity.player.levelup', 0.9, 1.2);
                player.tell(Text.of(`§8[§6📜 D&D§8] §aYou have selected the §e§l${matchedKey} §aclass preset!`));
                displayCharacterSheet(player);
                return 1;
              })
          )
      )

      // /dnd setstat <player> <stat> <value>
      .then(
        Commands.literal('setstat')
          .requires(src => src.hasPermission(2))
          .then(
            Commands.argument('target', Arguments.PLAYER.create(event))
              .then(
                Commands.argument('stat', Arguments.WORD.create(event))
                  .then(
                    Commands.argument('value', Arguments.INTEGER.create(event))
                      .executes(ctx => {
                        let target = Arguments.PLAYER.getResult(ctx, 'target');
                        let stat = String(Arguments.WORD.getResult(ctx, 'stat')).toLowerCase();
                        let value = Arguments.INTEGER.getResult(ctx, 'value');

                        ensurePlayerDndData(target);
                        let dnd = target.persistentData.dnd;

                        let validStats = ['str', 'dex', 'con', 'int', 'wis', 'cha', 'ac', 'hp', 'maxhp', 'speed', 'level'];
                        if (validStats.indexOf(stat) === -1) {
                          ctx.source.sendFailure(
                            Text.red(`Invalid stat "${stat}". Allowed: str, dex, con, int, wis, cha, ac, hp, maxhp, speed, level.`)
                          );
                          return 0;
                        }

                        if (stat === 'maxhp') {
                          dnd.maxHp = Math.max(1, value);
                          dnd.hp = Math.min(dnd.hp, dnd.maxHp);
                        } else if (stat === 'hp') {
                          dnd.hp = Math.max(1, Math.min(dnd.maxHp, value));
                        } else if (stat === 'level') {
                          dnd.level = Math.max(1, Math.min(20, value));
                        } else {
                          dnd[stat] = value;
                        }

                        syncVanillaHealth(target);

                        ctx.source.sendSuccess(
                          Text.of(`§8[§6⚙ DM§8] §aUpdated §b${target.username}'s §e${stat.toUpperCase()} §ato §f${value}§a.`),
                          true
                        );
                        target.tell(
                          Text.of(`§8[§6⚙ DM§8] §7Your §e${stat.toUpperCase()} §7was set to §f${value} §7by the Game Master.`)
                        );
                        return 1;
                      })
                  )
              )
          )
      )

      // /dnd roll <formula>
      .then(
        Commands.literal('roll')
          .then(
            Commands.argument('formula', Arguments.GREEDY_STRING.create(event))
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                let formula = Arguments.GREEDY_STRING.getResult(ctx, 'formula');
                executeFormulaRoll(player, formula);
                return 1;
              })
          )
      )

      // /dnd check <ability> [mode]
      .then(
        Commands.literal('check')
          .then(
            Commands.argument('ability', Arguments.WORD.create(event))
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                let ability = Arguments.WORD.getResult(ctx, 'ability');
                performD20Test(player, ability, 'normal', false);
                return 1;
              })
              .then(
                Commands.argument('mode', Arguments.WORD.create(event))
                  .executes(ctx => {
                    let player = ctx.source.playerOrException;
                    let ability = Arguments.WORD.getResult(ctx, 'ability');
                    let mode = Arguments.WORD.getResult(ctx, 'mode');
                    performD20Test(player, ability, mode, false);
                    return 1;
                  })
              )
          )
      )

      // /dnd skill <skillName> [mode]
      .then(
        Commands.literal('skill')
          .then(
            Commands.argument('skillName', Arguments.WORD.create(event))
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                let sk = String(Arguments.WORD.getResult(ctx, 'skillName')).toLowerCase();
                if (!DND_SKILLS[sk]) {
                  player.tell(Text.red(`Unknown skill "${sk}"! Try perception, stealth, athletics, arcana, persuasion...`));
                  return 0;
                }
                performD20Test(player, DND_SKILLS[sk].ability, 'normal', false, sk);
                return 1;
              })
              .then(
                Commands.argument('mode', Arguments.WORD.create(event))
                  .executes(ctx => {
                    let player = ctx.source.playerOrException;
                    let sk = String(Arguments.WORD.getResult(ctx, 'skillName')).toLowerCase();
                    let mode = Arguments.WORD.getResult(ctx, 'mode');
                    if (!DND_SKILLS[sk]) {
                      player.tell(Text.red(`Unknown skill "${sk}"!`));
                      return 0;
                    }
                    performD20Test(player, DND_SKILLS[sk].ability, mode, false, sk);
                    return 1;
                  })
              )
          )
      )

      // /dnd save <ability> [mode]
      .then(
        Commands.literal('save')
          .then(
            Commands.argument('ability', Arguments.WORD.create(event))
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                let ability = Arguments.WORD.getResult(ctx, 'ability');
                performD20Test(player, ability, 'normal', true);
                return 1;
              })
              .then(
                Commands.argument('mode', Arguments.WORD.create(event))
                  .executes(ctx => {
                    let player = ctx.source.playerOrException;
                    let ability = Arguments.WORD.getResult(ctx, 'ability');
                    let mode = Arguments.WORD.getResult(ctx, 'mode');
                    performD20Test(player, ability, mode, true);
                    return 1;
                  })
              )
          )
      )

      // /dnd rest short | /dnd rest long
      .then(
        Commands.literal('rest')
          .then(
            Commands.literal('short')
              .executes(ctx => {
                performRest(ctx.source.playerOrException, 'short');
                return 1;
              })
          )
          .then(
            Commands.literal('long')
              .executes(ctx => {
                performRest(ctx.source.playerOrException, 'long');
                return 1;
              })
          )
      )

      // /dnd combat start [radius] | /dnd combat end
      .then(
        Commands.literal('combat')
          .then(
            Commands.literal('start')
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                startCombatEncounter(player, 25);
                return 1;
              })
              .then(
                Commands.argument('radius', Arguments.INTEGER.create(event))
                  .executes(ctx => {
                    let player = ctx.source.playerOrException;
                    let radius = Arguments.INTEGER.getResult(ctx, 'radius');
                    startCombatEncounter(player, radius);
                    return 1;
                  })
              )
          )
          .then(
            Commands.literal('end')
              .executes(ctx => {
                endCombatEncounter(ctx.source.server);
                return 1;
              })
          )
      )

      // /dnd action attack | /dnd action dash | /dnd action feature
      .then(
        Commands.literal('action')
          .then(
            Commands.literal('attack')
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                performCombatAttack(player);
                return 1;
              })
          )
          .then(
            Commands.literal('dash')
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                performCombatDash(player);
                return 1;
              })
          )
          .then(
            Commands.literal('feature')
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                performClassFeature(player);
                return 1;
              })
          )
      )

      // /dnd next
      .then(
        Commands.literal('next')
          .executes(ctx => {
            advanceCombatTurn(ctx.source.server);
            return 1;
          })
      )

      // /dnd dm
      .then(
        Commands.literal('dm')
          .executes(ctx => {
            let player = ctx.source.playerOrException;
            displayDmControlPanel(player);
            return 1;
          })
      )

      // /dnd dm_action <subAction>
      .then(
        Commands.literal('dm_action')
          .then(
            Commands.argument('subAction', Arguments.WORD.create(event))
              .executes(ctx => {
                let player = ctx.source.playerOrException;
                let server = ctx.source.server;
                let action = String(Arguments.WORD.getResult(ctx, 'subAction')).toLowerCase();

                if (action === 'freeze') {
                  togglePartyFreeze(player, true);
                } else if (action === 'unfreeze') {
                  togglePartyFreeze(player, false);
                } else if (action === 'group_perception') {
                  server.tell(Text.of('§8[§d🔮 DM§8] §e§lThe Game Master calls for a Group Wisdom (Perception) Check!'));
                  server.players.forEach(p => {
                    performD20Test(p, 'wis', 'normal', false, 'perception');
                  });
                } else if (action === 'group_dex_save') {
                  server.tell(Text.of('§8[§d🔮 DM§8] §6§lThe Game Master calls for a Group DEX Saving Throw!'));
                  server.players.forEach(p => {
                    performD20Test(p, 'dex', 'normal', true);
                  });
                } else if (action === 'group_wis_save') {
                  server.tell(Text.of('§8[§d🔮 DM§8] §5§lThe Game Master calls for a Group WIS Saving Throw!'));
                  server.players.forEach(p => {
                    performD20Test(p, 'wis', 'normal', true);
                  });
                } else if (action === 'heal_all') {
                  server.players.forEach(p => {
                    ensurePlayerDndData(p);
                    p.persistentData.dnd.hp = p.persistentData.dnd.maxHp;
                    syncVanillaHealth(p);
                    server.runCommandSilent(`execute at ${p.username} run particle minecraft:heart ~ ~1.5 ~ 0.4 0.4 0.4 0.1 10`);
                  });
                  broadcastSound(server, 'minecraft:block.beacon.power_select', 0.9, 1.2);
                  server.tell(Text.of('§8[§d🔮 DM§8] §d§lThe party has been fully healed by divine intervention!'));
                } else if (action === 'inspire_all') {
                  server.players.forEach(p => {
                    ensurePlayerDndData(p);
                    p.persistentData.dnd.inspiration = true;
                  });
                  broadcastSound(server, 'minecraft:block.amethyst_block.chime', 1.0, 1.2);
                  server.tell(Text.of('§8[§d🔮 DM§8] §6§lAll party members have been granted Heroic Inspiration!'));
                } else if (action === 'long_rest_all') {
                  server.players.forEach(p => {
                    performRest(p, 'long');
                  });
                }
                return 1;
              })
          )
      )
  );
});
