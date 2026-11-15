export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type RollMode = 'normal' | 'adv' | 'dis';
export type ClassName = 'Fighter' | 'Wizard' | 'Rogue' | 'Cleric' | 'Paladin' | 'Bard';

export interface ClassPreset {
  charClass: ClassName;
  level: number;
  ac: number;
  maxHp: number;
  hitDie: number;
  speed: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  saveProf1: AbilityKey;
  saveProf2: AbilityKey;
  skills: string[];
  featureName: string;
}

export interface PlayerCharacterState extends ClassPreset {
  username: string;
  hp: number;
  inspiration: boolean;
  hitDiceRemaining: number;
}

export interface Combatant {
  uuid: string;
  name: string;
  isPlayer: boolean;
  initiative: number;
  initRoll: number;
  initMod: number;
  startX: number;
  startY: number;
  startZ: number;
  currentX: number;
  currentZ: number;
  speed: number;
  maxMoveThisTurn: number;
  remainingMove: number;
  hasAction: boolean;
  hasBonusAction: boolean;
  ac: number;
  hp: number;
  maxHp: number;
}

export interface DiceRollResult {
  formula: string;
  count: number;
  sides: number;
  modifier: number;
  rolls: number[];
  total: number;
  nat20: boolean;
  nat1: boolean;
  breakdown: string;
}

export interface D20TestResult {
  testName: string;
  ability: AbilityKey;
  mode: RollMode;
  consumedInspiration: boolean;
  r1: number;
  r2: number;
  chosenRoll: number;
  abilityMod: number;
  profBonus: number;
  isProficient: boolean;
  total: number;
  nat20: boolean;
  nat1: boolean;
  breakdown: string;
}

export const DND_ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const DND_SKILLS: Record<string, { name: string; ability: AbilityKey }> = {
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
  survival: { name: 'Survival', ability: 'wis' },
};

export const CLASS_PRESETS: Record<ClassName, ClassPreset> = {
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
    featureName: 'Second Wind (1d10+Lv Heal)',
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
    featureName: 'Arcane Ward (+2 AC / Temp Shield)',
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
    featureName: 'Cunning Action (Bonus Dash)',
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
    featureName: 'Channel Divinity (Preserve Life)',
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
    featureName: 'Lay on Hands (Restore 5xLv HP)',
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
    featureName: 'Bardic Inspiration (Inspire Nearby)',
  },
};

export function getMod(score: number): number {
  return Math.floor((Number(score) - 10) / 2);
}

export function getProfBonus(level: number): number {
  const clamped = Math.max(1, Math.min(20, Number(level) || 1));
  return Math.ceil(clamped / 4) + 1;
}

export function formatSigned(mod: number): string {
  const n = Number(mod) || 0;
  return n >= 0 ? `+${n}` : `${n}`;
}

export function parseDiceFormula(rawFormula: string): { count: number; sides: number; modifier: number } | null {
  const clean = String(rawFormula).trim().toLowerCase().replace(/\s+/g, '');
  const match = clean.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) return null;

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;
  return { count, sides, modifier };
}

export function rollFormula(
  rawFormula: string,
  rng: () => number = Math.random
): DiceRollResult | null {
  const parsed = parseDiceFormula(rawFormula);
  if (!parsed) return null;

  const { count, sides, modifier } = parsed;
  const rolls: number[] = [];
  let sum = 0;

  for (let i = 0; i < count; i++) {
    const r = Math.floor(rng() * sides) + 1;
    rolls.push(r);
    sum += r;
  }

  const total = sum + modifier;
  const isD20Single = count === 1 && sides === 20;
  const nat20 = isD20Single && rolls[0] === 20;
  const nat1 = isD20Single && rolls[0] === 1;
  const modStr = modifier !== 0 ? ` ${formatSigned(modifier)}` : '';
  const breakdown = `[${rolls.join(', ')}]${modStr}`;

  return {
    formula: rawFormula.trim().toLowerCase(),
    count,
    sides,
    modifier,
    rolls,
    total,
    nat20,
    nat1,
    breakdown,
  };
}

export function evaluateD20Test(
  character: PlayerCharacterState,
  abilityKey: AbilityKey,
  mode: RollMode,
  isSave: boolean,
  customSkillKey?: string,
  rng: () => number = Math.random
): { result: D20TestResult; updatedCharacter: PlayerCharacterState } {
  const nextChar = { ...character };
  let effectiveMode: RollMode = mode;
  let consumedInspiration = false;

  if (nextChar.inspiration && effectiveMode === 'normal') {
    effectiveMode = 'adv';
    nextChar.inspiration = false;
    consumedInspiration = true;
  }

  const r1 = Math.floor(rng() * 20) + 1;
  const r2 = Math.floor(rng() * 20) + 1;
  let chosenRoll = r1;

  if (effectiveMode === 'adv') {
    chosenRoll = Math.max(r1, r2);
  } else if (effectiveMode === 'dis') {
    chosenRoll = Math.min(r1, r2);
  }

  const score = Number(nextChar[abilityKey]) || 10;
  const abilityMod = getMod(score);
  let profBonus = 0;
  let isProficient = false;

  if (isSave) {
    if (nextChar.saveProf1 === abilityKey || nextChar.saveProf2 === abilityKey) {
      profBonus = getProfBonus(nextChar.level);
      isProficient = true;
    }
  } else if (customSkillKey && DND_SKILLS[customSkillKey]) {
    if (nextChar.skills.includes(customSkillKey)) {
      profBonus = getProfBonus(nextChar.level);
      isProficient = true;
    }
  }

  const total = chosenRoll + abilityMod + profBonus;
  const nat20 = chosenRoll === 20;
  const nat1 = chosenRoll === 1;

  let testName = `${ABILITY_NAMES[abilityKey]} Check`;
  if (isSave) {
    testName = `${ABILITY_NAMES[abilityKey]} Saving Throw`;
  } else if (customSkillKey && DND_SKILLS[customSkillKey]) {
    testName = `${DND_SKILLS[customSkillKey].name} (${abilityKey.toUpperCase()})`;
  }

  const diceDetail =
    effectiveMode === 'adv' || effectiveMode === 'dis'
      ? `[${r1}, ${r2} -> ${chosenRoll}]`
      : `[${chosenRoll}]`;
  const breakdown = `${diceDetail} ${formatSigned(abilityMod)} (${abilityKey.toUpperCase()})${
    isProficient ? ` +${profBonus} (Prof)` : ''
  }`;

  return {
    result: {
      testName,
      ability: abilityKey,
      mode: effectiveMode,
      consumedInspiration,
      r1,
      r2,
      chosenRoll,
      abilityMod,
      profBonus,
      isProficient,
      total,
      nat20,
      nat1,
      breakdown,
    },
    updatedCharacter: nextChar,
  };
}

export function sortInitiativeOrder(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return b.initMod - a.initMod;
  });
}

export function calculateMovementClamp(
  startX: number,
  startZ: number,
  targetX: number,
  targetZ: number,
  maxMove: number,
  isActiveTurn: boolean
): {
  clampedX: number;
  clampedZ: number;
  wasTeleportedBack: boolean;
  remainingMove: number;
  distanceMoved: number;
} {
  const dx = targetX - startX;
  const dz = targetZ - startZ;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (!isActiveTurn) {
    if (dist > 0.3) {
      return {
        clampedX: startX,
        clampedZ: startZ,
        wasTeleportedBack: true,
        remainingMove: 0,
        distanceMoved: 0,
      };
    }
    return {
      clampedX: targetX,
      clampedZ: targetZ,
      wasTeleportedBack: false,
      remainingMove: 0,
      distanceMoved: dist,
    };
  }

  if (dist > maxMove) {
    const ratio = (maxMove - 0.05) / dist;
    return {
      clampedX: startX + dx * ratio,
      clampedZ: startZ + dz * ratio,
      wasTeleportedBack: true,
      remainingMove: 0,
      distanceMoved: maxMove,
    };
  }

  return {
    clampedX: targetX,
    clampedZ: targetZ,
    wasTeleportedBack: false,
    remainingMove: Math.max(0, maxMove - dist),
    distanceMoved: dist,
  };
}
