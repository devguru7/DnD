import React, { useState } from 'react';
import {
  AbilityKey,
  ABILITY_NAMES,
  CLASS_PRESETS,
  ClassName,
  Combatant,
  DND_ABILITIES,
  DND_SKILLS,
  evaluateD20Test,
  formatSigned,
  getMod,
  getProfBonus,
  PlayerCharacterState,
  rollFormula,
  RollMode,
  sortInitiativeOrder,
  calculateMovementClamp,
} from '../engine/dndRules';
import {
  Swords,
  Shield,
  Dices,
  Sparkles,
  Play,
  Square,
  SkipForward,
  Snowflake,
  Sun,
  Heart,
  Eye,
  Zap,
  Send,
  Footprints,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  tag: string;
  tagColor: string;
  text: string;
  detail?: string;
  highlight?: 'nat20' | 'nat1' | 'combat' | 'dm' | 'normal';
}

const INITIAL_MOBS: Array<{ name: string; ac: number; maxHp: number }> = [
  { name: 'Skeletal Champion (NPC)', ac: 15, maxHp: 22 },
  { name: 'Cultist Fanatic', ac: 13, maxHp: 16 },
  { name: 'Cave Spider Stalker', ac: 14, maxHp: 14 },
];

export const TabletopSimulator: React.FC = () => {
  const [character, setCharacter] = useState<PlayerCharacterState>({
    ...CLASS_PRESETS.Fighter,
    username: 'Aldric_Vane',
    hp: CLASS_PRESETS.Fighter.maxHp,
    inspiration: false,
    hitDiceRemaining: 1,
  });

  const [sneakMode, setSneakMode] = useState<boolean>(false);
  const [partyFrozen, setPartyFrozen] = useState<boolean>(false);
  const [combatActive, setCombatActive] = useState<boolean>(false);
  const [combatRound, setCombatRound] = useState<number>(1);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [selectedTargetUuid, setSelectedTargetUuid] = useState<string>('');
  const [commandInput, setCommandInput] = useState<string>('/dnd roll 2d6+3');
  const [actionBarText, setActionBarText] = useState<string>(
    'Free Exploration Mode · Select an item or roll a check'
  );

  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      tag: 'D&D Engine',
      tagColor: 'text-amber-400',
      text: 'Initialized player.persistentData.dnd for Aldric_Vane (Lv.1 Fighter · 24/24 HP · AC 16).',
      detail: 'Synced minecraft:generic.max_health (+4.0 addition). Click any Check, Save, Item, or DM button to test.',
      highlight: 'normal',
    },
  ]);

  const appendChat = (
    tag: string,
    tagColor: string,
    text: string,
    detail?: string,
    highlight: ChatMessage['highlight'] = 'normal'
  ) => {
    setChatLog((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tag,
        tagColor,
        text,
        detail,
        highlight,
      },
      ...prev.slice(0, 39),
    ]);
  };

  // Switch Class Preset (/dnd class <className>)
  const handleSelectClass = (className: ClassName) => {
    const preset = CLASS_PRESETS[className];
    const updated: PlayerCharacterState = {
      ...preset,
      username: character.username,
      level: character.level,
      hp: preset.maxHp,
      inspiration: character.inspiration,
      hitDiceRemaining: character.level,
    };
    setCharacter(updated);
    appendChat(
      '📜 Class',
      'text-emerald-400',
      `${updated.username} selected the ${className} preset! Synced Max HP to ${preset.maxHp} and AC to ${preset.ac}.`,
      `Save Proficiencies: ${preset.saveProf1.toUpperCase()}, ${preset.saveProf2.toUpperCase()} · Feature: ${preset.featureName}`
    );
  };

  // Level adjustment (/dnd setstat <player> level <val>)
  const handleChangeLevel = (newLevel: number) => {
    const clamped = Math.max(1, Math.min(20, newLevel));
    setCharacter((prev) => ({
      ...prev,
      level: clamped,
      hitDiceRemaining: clamped,
    }));
    appendChat(
      '⚙ DM SetStat',
      'text-amber-400',
      `Updated ${character.username}'s LEVEL to ${clamped} (Proficiency Bonus: +${getProfBonus(clamped)}).`
    );
  };

  // Ability or Skill Check / Saving Throw
  const handleRollD20 = (
    abilityKey: AbilityKey,
    mode: RollMode,
    isSave: boolean,
    customSkillKey?: string
  ) => {
    const { result, updatedCharacter } = evaluateD20Test(
      character,
      abilityKey,
      mode,
      isSave,
      customSkillKey
    );
    setCharacter(updatedCharacter);

    const modeBadge =
      result.consumedInspiration
        ? ' [Inspiration -> ADV]'
        : result.mode === 'adv'
        ? ' [Advantage]'
        : result.mode === 'dis'
        ? ' [Disadvantage]'
        : '';

    const suffix = result.nat20
      ? ' (NATURAL 20!)'
      : result.nat1
      ? ' (NATURAL 1!)'
      : '';

    appendChat(
      '🎲 D&D Roll',
      result.nat20 ? 'text-amber-400' : result.nat1 ? 'text-rose-400' : 'text-sky-400',
      `${character.username} rolled ${result.testName}${modeBadge}: ${result.total}${suffix}`,
      `Breakdown: ${result.breakdown} · Sound: ${
        result.nat20
          ? 'minecraft:item.totem.use'
          : result.nat1
          ? 'minecraft:block.anvil.land'
          : 'minecraft:entity.experience_orb.pickup'
      }`,
      result.nat20 ? 'nat20' : result.nat1 ? 'nat1' : 'normal'
    );
  };

  // Formula Roll (/dnd roll <formula>)
  const handleFormulaRoll = (formula: string, label?: string) => {
    const res = rollFormula(formula);
    if (!res) {
      appendChat('⚠ Error', 'text-rose-400', `Invalid dice formula "${formula}". Try 1d20, 2d6+3, 1d8-1.`);
      return;
    }

    const title = label || `Dice Roll (${res.formula})`;
    const suffix = res.nat20 ? ' (NATURAL 20!)' : res.nat1 ? ' (NATURAL 1!)' : '';
    appendChat(
      '🎲 Formula',
      res.nat20 ? 'text-amber-400' : res.nat1 ? 'text-rose-400' : 'text-emerald-400',
      `${character.username} rolled ${title}: ${res.total}${suffix}`,
      `Breakdown: ${res.breakdown}`,
      res.nat20 ? 'nat20' : res.nat1 ? 'nat1' : 'normal'
    );
  };

  // Start Turn-Based Combat (/dnd combat start 25)
  const handleStartCombat = () => {
    const dexMod = getMod(character.dex);
    const pRoll = Math.floor(Math.random() * 20) + 1;
    const playerCombatant: Combatant = {
      uuid: 'player-1',
      name: character.username,
      isPlayer: true,
      initiative: pRoll + dexMod,
      initRoll: pRoll,
      initMod: dexMod,
      startX: 0,
      startY: 64,
      startZ: 0,
      currentX: 0,
      currentZ: 0,
      speed: character.speed,
      maxMoveThisTurn: character.speed,
      remainingMove: character.speed,
      hasAction: true,
      hasBonusAction: true,
      ac: character.ac,
      hp: character.hp,
      maxHp: character.maxHp,
    };

    const mobCombatants: Combatant[] = INITIAL_MOBS.map((m, idx) => {
      const mRoll = Math.floor(Math.random() * 20) + 1;
      return {
        uuid: `mob-${idx + 1}`,
        name: m.name,
        isPlayer: false,
        initiative: mRoll + 1,
        initRoll: mRoll,
        initMod: 1,
        startX: (idx + 1) * 2,
        startY: 64,
        startZ: (idx + 1) * 1.5,
        currentX: (idx + 1) * 2,
        currentZ: (idx + 1) * 1.5,
        speed: 6,
        maxMoveThisTurn: 6,
        remainingMove: 6,
        hasAction: true,
        hasBonusAction: true,
        ac: m.ac,
        hp: m.maxHp,
        maxHp: m.maxHp,
      };
    });

    const sorted = sortInitiativeOrder([playerCombatant, ...mobCombatants]);
    setCombatants(sorted);
    setCombatActive(true);
    setCombatRound(1);
    setTurnIndex(0);

    const firstMob = sorted.find((c) => !c.isPlayer);
    if (firstMob) setSelectedTargetUuid(firstMob.uuid);

    const active = sorted[0];
    if (active.isPlayer) {
      setActionBarText(
        `⚔ YOUR TURN | Move: ${active.remainingMove.toFixed(1)}m / ${active.maxMoveThisTurn}m | ● Action | ● Bonus`
      );
    } else {
      setActionBarText(`⏳ Waiting for ${active.name}'s turn (Round 1)`);
    }

    const orderSummary = sorted
      .map((c, idx) => `#${idx + 1} [${c.initiative}] ${c.name}`)
      .join(' · ');

    appendChat(
      '⚔ Combat',
      'text-amber-400',
      `D&D TURN-BASED COMBAT STARTED! (Radius: 25m · Round 1) — Active: ${active.name} (Glowing)`,
      `Initiative Order: ${orderSummary}`,
      'combat'
    );
  };

  // End Combat (/dnd combat end)
  const handleEndCombat = () => {
    setCombatActive(false);
    setCombatants([]);
    setTurnIndex(0);
    setActionBarText('Combat Encounter Ended · Free movement restored');
    appendChat(
      '⚔ Combat',
      'text-emerald-400',
      'Combat Encounter Ended! Removed Glowing effects and restored mob AI ({NoAI:0b}).',
      undefined,
      'combat'
    );
  };

  // Next Turn (/dnd next)
  const handleNextTurn = () => {
    if (!combatActive || combatants.length === 0) {
      appendChat('⚠ Combat', 'text-rose-400', 'No active D&D combat encounter! Start combat first.');
      return;
    }

    const alive = combatants.filter((c) => c.hp > 0);
    if (alive.length === 0) {
      handleEndCombat();
      return;
    }

    let nextIdx = turnIndex + 1;
    let nextRound = combatRound;
    if (nextIdx >= alive.length) {
      nextIdx = 0;
      nextRound += 1;
    }

    const updated = alive.map((c, idx) => {
      if (idx === nextIdx) {
        return {
          ...c,
          startX: c.currentX,
          startZ: c.currentZ,
          maxMoveThisTurn: c.speed,
          remainingMove: c.speed,
          hasAction: true,
          hasBonusAction: true,
        };
      }
      return c;
    });

    setCombatants(updated);
    setTurnIndex(nextIdx);
    setCombatRound(nextRound);

    const active = updated[nextIdx];
    if (active.isPlayer) {
      setActionBarText(
        `⚔ YOUR TURN | Move: ${active.remainingMove.toFixed(1)}m / ${active.maxMoveThisTurn}m | ● Action | ● Bonus`
      );
    } else {
      setActionBarText(`⏳ Waiting for ${active.name}'s turn (Round ${nextRound})`);
    }

    appendChat(
      '⏭ Turn',
      'text-amber-400',
      `Round ${nextRound} — It is now ${active.name}'s turn! Applied Glowing effect & reset turn resources.`,
      active.isPlayer
        ? 'Player Turn Prompt: [⚔ Attack] [💨 Dash] [✨ Feature] [📜 Sheet] [⏭ End Turn]'
        : 'NPC Turn: Move monster or click [⏭ Next Turn] to advance.',
      'combat'
    );
  };

  // Attack Action (/dnd action attack)
  const handleCombatAttack = () => {
    if (!combatActive || combatants.length === 0) {
      appendChat('⚠ Combat', 'text-rose-400', 'Combat is not currently active!');
      return;
    }

    const active = combatants[turnIndex];
    if (!active || !active.isPlayer) {
      appendChat(
        '⚠ Turn Lock',
        'text-rose-400',
        `It is currently ${active?.name}'s turn! Click "Next Turn" until it is ${character.username}'s turn.`
      );
      return;
    }

    if (!active.hasAction) {
      appendChat('⚠ Action', 'text-rose-400', 'You have already used your Action this turn!');
      return;
    }

    const target =
      combatants.find((c) => c.uuid === selectedTargetUuid && !c.isPlayer && c.hp > 0) ||
      combatants.find((c) => !c.isPlayer && c.hp > 0);

    if (!target) {
      appendChat('⚔ Victory', 'text-emerald-400', 'All hostile targets have been defeated!');
      return;
    }

    const bestMod = Math.max(getMod(character.str), getMod(character.dex), getMod(character.int), getMod(character.cha));
    const prof = getProfBonus(character.level);
    const attackMod = bestMod + prof;

    const r1 = Math.floor(Math.random() * 20) + 1;
    const r2 = Math.floor(Math.random() * 20) + 1;
    const usedInsp = character.inspiration;
    const d20 = usedInsp ? Math.max(r1, r2) : r1;

    if (usedInsp) {
      setCharacter((prev) => ({ ...prev, inspiration: false }));
    }

    const nat20 = d20 === 20;
    const nat1 = d20 === 1;
    const totalAttack = d20 + attackMod;
    const isHit = nat20 || (!nat1 && totalAttack >= target.ac);

    let dmg = 0;
    let dmgDetail = '';
    if (isHit) {
      const d1 = Math.floor(Math.random() * 8) + 1;
      const d2 = nat20 ? Math.floor(Math.random() * 8) + 1 : 0;
      dmg = Math.max(1, d1 + d2 + bestMod);
      dmgDetail = nat20
        ? `2d8[${d1}+${d2}] ${formatSigned(bestMod)} = ${dmg} dmg`
        : `1d8[${d1}] ${formatSigned(bestMod)} = ${dmg} dmg`;
    }

    const nextCombatants = combatants.map((c) => {
      if (c.uuid === active.uuid) {
        return { ...c, hasAction: false };
      }
      if (isHit && c.uuid === target.uuid) {
        return { ...c, hp: Math.max(0, c.hp - dmg) };
      }
      return c;
    });

    setCombatants(nextCombatants);
    setActionBarText(
      `⚔ YOUR TURN | Move: ${active.remainingMove.toFixed(1)}m / ${active.maxMoveThisTurn}m | ○ Action | ${
        active.hasBonusAction ? '● Bonus' : '○ Bonus'
      }`
    );

    appendChat(
      '⚔ Attack',
      nat20 ? 'text-amber-400' : isHit ? 'text-emerald-400' : 'text-rose-400',
      `${character.username} attacks ${target.name} (AC ${target.ac}): ${totalAttack} (1d20[${d20}] ${formatSigned(
        attackMod
      )}) — ${nat20 ? 'CRITICAL HIT!' : isHit ? `HIT for ${dmg} damage!` : 'MISS!'}`,
      isHit ? `Damage Breakdown: ${dmgDetail} · Target HP: ${Math.max(0, target.hp - dmg)}/${target.maxHp}` : 'Attack missed target Armor Class.',
      nat20 ? 'nat20' : nat1 ? 'nat1' : 'combat'
    );
  };

  // Dash Action (/dnd action dash)
  const handleCombatDash = () => {
    if (!combatActive || combatants.length === 0) {
      appendChat('⚠ Combat', 'text-rose-400', 'Combat is not currently active!');
      return;
    }
    const active = combatants[turnIndex];
    if (!active || !active.isPlayer) {
      appendChat('⚠ Turn Lock', 'text-rose-400', `Wait for ${character.username}'s turn to use Dash!`);
      return;
    }
    if (!active.hasAction) {
      appendChat('⚠ Action', 'text-rose-400', 'You have already used your Action this turn!');
      return;
    }

    const newMax = active.maxMoveThisTurn + active.speed;
    const newRem = active.remainingMove + active.speed;

    const updated = combatants.map((c) =>
      c.uuid === active.uuid
        ? { ...c, hasAction: false, maxMoveThisTurn: newMax, remainingMove: newRem }
        : c
    );
    setCombatants(updated);
    setActionBarText(
      `⚔ YOUR TURN | Move: ${newRem.toFixed(1)}m / ${newMax}m | ○ Action | ${
        active.hasBonusAction ? '● Bonus' : '○ Bonus'
      }`
    );

    appendChat(
      '💨 Dash',
      'text-sky-400',
      `${character.username} expends Action to Dash! Movement limit doubled to ${newMax}m this turn.`,
      `Remaining Move: ${newRem.toFixed(1)}m`,
      'combat'
    );
  };

  // Simulate Player Movement Step in `PlayerEvents.tick`
  const handleSimulateMove = (stepMeters: number) => {
    if (partyFrozen) {
      setActionBarText('❄ PARTY FROZEN BY GAME MASTER ❄');
      appendChat(
        '❄ Freeze Lock',
        'text-sky-400',
        `PlayerEvents.tick: ${character.username} moved > 0.3m while partyFrozen=true -> Teleported back to freeze coordinates!`
      );
      return;
    }

    if (!combatActive || combatants.length === 0) {
      setActionBarText(`Free Movement: walked ${stepMeters}m (No active combat lock)`);
      return;
    }

    const active = combatants[turnIndex];
    const playerEntry = combatants.find((c) => c.isPlayer);
    if (!playerEntry || !active) return;

    const isMyTurn = active.uuid === playerEntry.uuid;
    const targetX = playerEntry.currentX + stepMeters;
    const clampResult = calculateMovementClamp(
      playerEntry.startX,
      playerEntry.startZ,
      targetX,
      playerEntry.currentZ,
      playerEntry.maxMoveThisTurn,
      isMyTurn
    );

    const updated = combatants.map((c) =>
      c.uuid === playerEntry.uuid
        ? {
            ...c,
            currentX: clampResult.clampedX,
            remainingMove: clampResult.remainingMove,
          }
        : c
    );
    setCombatants(updated);

    if (!isMyTurn && clampResult.wasTeleportedBack) {
      setActionBarText(`⏳ Waiting for ${active.name}'s turn (Round ${combatRound})`);
      appendChat(
        '🔒 Out-of-Turn Lock',
        'text-rose-400',
        `PlayerEvents.tick: ${character.username} tried to move ${stepMeters}m during ${active.name}'s turn -> Clamped & teleported back to startX!`
      );
    } else if (isMyTurn && clampResult.wasTeleportedBack) {
      setActionBarText(
        `⚔ YOUR TURN | Move: 0.0m / ${playerEntry.maxMoveThisTurn}m (Movement Limit Reached!)`
      );
      appendChat(
        '🛑 Speed Limit',
        'text-amber-400',
        `PlayerEvents.tick: ${character.username} reached the ${playerEntry.maxMoveThisTurn}m speed cap! Use Dash (+Speed) to move further.`
      );
    } else {
      setActionBarText(
        `⚔ YOUR TURN | Move: ${clampResult.remainingMove.toFixed(1)}m / ${
          playerEntry.maxMoveThisTurn
        }m | ${playerEntry.hasAction ? '● Action' : '○ Action'} | ${
          playerEntry.hasBonusAction ? '● Bonus' : '○ Bonus'
        }`
      );
    }
  };

  // Custom Item Right-Click Handler (`ItemEvents.rightClicked`)
  const handleItemRightClick = (itemId: string) => {
    if (itemId === 'kubejs:dm_wand') {
      if (sneakMode) {
        const nextFreeze = !partyFrozen;
        setPartyFrozen(nextFreeze);
        setActionBarText(
          nextFreeze ? '❄ PARTY FROZEN BY GAME MASTER ❄' : '☀ Party Unfrozen · Free movement'
        );
        appendChat(
          '❄ DM Wand',
          'text-sky-400',
          nextFreeze
            ? 'The Game Master has FROZEN the party! Non-DM players are locked in place.'
            : 'The Game Master has UNFROZEN the party! Movement lock released.',
          'Triggered via Sneak + Right-Click on kubejs:dm_wand',
          'dm'
        );
      } else {
        if (combatActive) {
          handleEndCombat();
        } else {
          handleStartCombat();
        }
      }
    } else if (itemId === 'kubejs:dm_orb') {
      appendChat(
        '🔮 Orb of Fate',
        'text-purple-400',
        'Opened Interactive Game Master Control Panel in chat (/dnd dm).',
        'Click any DM Control Panel action on the right to orchestrate the party.',
        'dm'
      );
    } else if (itemId === 'kubejs:d20_die') {
      if (sneakMode) {
        appendChat(
          '📜 Character Sheet',
          'text-amber-400',
          `Displayed ${character.username}'s interactive Character Sheet (/dnd sheet).`
        );
      } else {
        handleFormulaRoll('1d20', 'Physical d20 Die (kubejs:d20_die)');
      }
    } else if (itemId === 'kubejs:inspiration_token') {
      if (character.inspiration) {
        appendChat('★ Inspiration', 'text-amber-300', 'You already have Heroic Inspiration active!');
      } else {
        setCharacter((prev) => ({ ...prev, inspiration: true }));
        appendChat(
          '★ Inspiration',
          'text-amber-400',
          `${character.username} consumed an Inspiration Token! Granted Advantage on next d20 roll.`,
          'Sound: minecraft:block.amethyst_block.chime · Particle: minecraft:wax_on'
        );
      }
    } else if (itemId === 'kubejs:healing_draught') {
      const r1 = Math.floor(Math.random() * 4) + 1;
      const r2 = Math.floor(Math.random() * 4) + 1;
      const heal = r1 + r2 + 2;
      setCharacter((prev) => ({
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + heal),
      }));
      appendChat(
        '🧪 Healing Draught',
        'text-emerald-400',
        `${character.username} drinks a Potion of Healing (2d4+2) and restores +${heal} HP ([${r1}, ${r2}] + 2)!`
      );
    }
  };

  // Command Line Parser for `/dnd ...`
  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = commandInput.trim();
    if (!raw) return;

    const parts = raw.replace(/^\//, '').split(/\s+/);
    if (parts[0]?.toLowerCase() !== 'dnd') {
      appendChat('⚠ Command', 'text-rose-400', 'Commands in this engine start with /dnd (e.g., /dnd roll 2d6+3).');
      return;
    }

    const sub = (parts[1] || 'sheet').toLowerCase();
    if (sub === 'roll' && parts[2]) {
      handleFormulaRoll(parts.slice(2).join(''));
    } else if (sub === 'check' && parts[2]) {
      const ab = parts[2].toLowerCase() as AbilityKey;
      const mode = ((parts[3] || 'normal').toLowerCase() as RollMode);
      if (DND_ABILITIES.includes(ab)) {
        handleRollD20(ab, mode, false);
      } else {
        appendChat('⚠ Error', 'text-rose-400', `Invalid ability "${ab}". Use str, dex, con, int, wis, cha.`);
      }
    } else if (sub === 'save' && parts[2]) {
      const ab = parts[2].toLowerCase() as AbilityKey;
      const mode = ((parts[3] || 'normal').toLowerCase() as RollMode);
      if (DND_ABILITIES.includes(ab)) {
        handleRollD20(ab, mode, true);
      }
    } else if (sub === 'skill' && parts[2]) {
      const sk = parts[2].toLowerCase();
      const mode = ((parts[3] || 'normal').toLowerCase() as RollMode);
      if (DND_SKILLS[sk]) {
        handleRollD20(DND_SKILLS[sk].ability, mode, false, sk);
      } else {
        appendChat('⚠ Error', 'text-rose-400', `Unknown skill "${sk}". Try perception, stealth, arcana, athletics.`);
      }
    } else if (sub === 'class' && parts[2]) {
      const found = (Object.keys(CLASS_PRESETS) as ClassName[]).find(
        (k) => k.toLowerCase() === parts[2].toLowerCase()
      );
      if (found) handleSelectClass(found);
    } else if (sub === 'combat') {
      if (parts[2]?.toLowerCase() === 'end') handleEndCombat();
      else handleStartCombat();
    } else if (sub === 'next') {
      handleNextTurn();
    } else if (sub === 'action') {
      if (parts[2]?.toLowerCase() === 'dash') handleCombatDash();
      else handleCombatAttack();
    } else {
      appendChat('📜 Sheet', 'text-amber-400', `Displayed Character Sheet for ${character.username}.`);
    }
  };

  const profBonus = getProfBonus(character.level);

  return (
    <div className="space-y-6">
      {/* Item Hotbar Bar (`kubejs/startup_scripts/dnd_startup.js`) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Custom KubeJS RPG Items Hotbar (ItemEvents.rightClicked)
            </h2>
            <p className="text-xs text-slate-400">
              Click any registered item below to trigger its in-game Right-Click handler, or toggle Sneak mode first.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSneakMode((s) => !s)}
            aria-pressed={sneakMode}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              sneakMode
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {sneakMode ? 'Sneak Mode: ON (Shift+Right-Click)' : 'Sneak Mode: OFF (Normal Right-Click)'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => handleItemRightClick('kubejs:dm_wand')}
            className="text-left p-3.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-amber-400">kubejs:dm_wand</div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">Master Wand of Encounters</div>
            <div className="text-xs text-slate-400 mt-1">
              {sneakMode ? 'Sneak: Freeze / Unfreeze Party' : 'Use: Start / Stop Combat'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleItemRightClick('kubejs:dm_orb')}
            className="text-left p-3.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-purple-400">kubejs:dm_orb</div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">Orb of Fate</div>
            <div className="text-xs text-slate-400 mt-1">Use: Open DM Control Panel</div>
          </button>

          <button
            type="button"
            onClick={() => handleItemRightClick('kubejs:d20_die')}
            className="text-left p-3.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/40 transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-sky-400">kubejs:d20_die</div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">Icosahedron of Fate (d20)</div>
            <div className="text-xs text-slate-400 mt-1">
              {sneakMode ? 'Sneak: Open Character Sheet' : 'Use: Roll 1d20 in Chat'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleItemRightClick('kubejs:inspiration_token')}
            className="text-left p-3.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-400/40 transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-amber-300">kubejs:inspiration_token</div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">Inspiration Token</div>
            <div className="text-xs text-slate-400 mt-1">Consume: Advantage on next d20</div>
          </button>

          <button
            type="button"
            onClick={() => handleItemRightClick('kubejs:healing_draught')}
            className="text-left p-3.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer"
          >
            <div className="text-xs font-mono text-rose-400">kubejs:healing_draught</div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">Potion of Healing</div>
            <div className="text-xs text-slate-400 mt-1">Consume: Roll 2d4+2 Heal</div>
          </button>
        </div>
      </div>

      {/* Main Split: Character Sheet (Left) + Combat & DM Panel & Chat Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Columns: Interactive Character Sheet (/dnd sheet) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-amber-400 font-mono">/dnd sheet</span>
              <h3 className="text-lg font-bold text-slate-100">{character.username}</h3>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="char-level-select" className="text-xs text-slate-400">
                Lv.
              </label>
              <select
                id="char-level-select"
                aria-label="Character Level"
                value={character.level}
                onChange={(e) => handleChangeLevel(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-100"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Class Preset Selector (/dnd class <name>) */}
          <div>
            <div className="text-xs font-medium text-slate-400 mb-2">
              Class Presets (/dnd class &lt;className&gt;)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(CLASS_PRESETS) as ClassName[]).map((cName) => {
                const active = character.charClass === cName;
                return (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => handleSelectClass(cName)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {cName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vitals Strip */}
          <div className="grid grid-cols-4 gap-2 text-center bg-slate-950 border border-slate-800 rounded-lg p-3">
            <div>
              <div className="text-xs text-slate-400">HP</div>
              <div className="text-sm font-mono font-bold text-rose-400 tabular-nums">
                {character.hp}/{character.maxHp}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">AC</div>
              <div className="text-sm font-mono font-bold text-sky-400 tabular-nums">{character.ac}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Speed</div>
              <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                {character.speed}m
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Prof / Insp</div>
              <div className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                +{profBonus} · {character.inspiration ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          {/* 6 Core Abilities with Clickable Check / Adv / Dis / Save Buttons */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-400">
              Abilities — Click to Roll in Chat (/dnd check &amp; /dnd save)
            </div>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950">
              {DND_ABILITIES.map((ab) => {
                const score = character[ab];
                const mod = getMod(score);
                const isSaveProf = character.saveProf1 === ab || character.saveProf2 === ab;
                const saveMod = mod + (isSaveProf ? profBonus : 0);

                return (
                  <div
                    key={ab}
                    className="p-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-[92px]">
                      <span className="font-mono font-bold text-amber-400 uppercase">{ab}</span>{' '}
                      <span className="font-mono text-slate-100 tabular-nums">{score}</span>{' '}
                      <span className="font-mono text-slate-400 tabular-nums">
                        ({formatSigned(mod)})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        type="button"
                        onClick={() => handleRollD20(ab, 'normal', false)}
                        aria-label={`Roll ${ABILITY_NAMES[ab]} Check`}
                        className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-medium cursor-pointer whitespace-nowrap"
                      >
                        Check
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRollD20(ab, 'adv', false)}
                        aria-label={`Roll ${ABILITY_NAMES[ab]} Check with Advantage`}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-mono cursor-pointer whitespace-nowrap"
                      >
                        Adv
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRollD20(ab, 'dis', false)}
                        aria-label={`Roll ${ABILITY_NAMES[ab]} Check with Disadvantage`}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-700 font-mono cursor-pointer whitespace-nowrap"
                      >
                        Dis
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRollD20(ab, 'normal', true)}
                        aria-label={`Roll ${ABILITY_NAMES[ab]} Saving Throw`}
                        className={`px-2 py-1 rounded border font-mono cursor-pointer whitespace-nowrap tabular-nums ${
                          isSaveProf
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        Save {formatSigned(saveMod)}
                        {isSaveProf ? '*' : ''}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Skills Strip */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-400">
              Proficient &amp; Common Skills (/dnd skill &lt;name&gt;)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['perception', 'stealth', 'athletics', 'arcana', 'persuasion', 'investigation'].map(
                (sk) => {
                  const isProf = character.skills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => handleRollD20(DND_SKILLS[sk].ability, 'normal', false, sk)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                        isProf
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {DND_SKILLS[sk].name} {isProf ? '★' : ''}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Right 7 Columns: DM Control Panel, Turn-Based Combat Arena & Minecraft Chat Log */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive DM Control Panel (/dnd dm) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-purple-400">/dnd dm · kubejs:dm_orb</span>
                <h3 className="text-base font-bold text-slate-100">
                  Interactive Game Master Control Panel
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Party Status: {partyFrozen ? 'FROZEN' : 'UNFROZEN'} · Combat:{' '}
                {combatActive ? `ACTIVE (Round ${combatRound})` : 'IDLE'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={handleStartCombat}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                Start Combat
              </button>
              <button
                type="button"
                onClick={handleEndCombat}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 cursor-pointer whitespace-nowrap"
              >
                <Square className="w-3.5 h-3.5" />
                Stop Combat
              </button>
              <button
                type="button"
                onClick={handleNextTurn}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 cursor-pointer whitespace-nowrap"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Next Turn
              </button>
              <button
                type="button"
                onClick={() => {
                  setPartyFrozen(true);
                  setActionBarText('❄ PARTY FROZEN BY GAME MASTER ❄');
                  appendChat(
                    '❄ DM Freeze',
                    'text-sky-400',
                    'The Game Master has FROZEN the party! Movement locked.',
                    undefined,
                    'dm'
                  );
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 cursor-pointer whitespace-nowrap"
              >
                <Snowflake className="w-3.5 h-3.5" />
                Freeze Party
              </button>
              <button
                type="button"
                onClick={() => {
                  setPartyFrozen(false);
                  setActionBarText('☀ Party Unfrozen · Free movement restored');
                  appendChat(
                    '☀ DM Unfreeze',
                    'text-emerald-400',
                    'The Game Master has UNFROZEN the party!',
                    undefined,
                    'dm'
                  );
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer whitespace-nowrap"
              >
                <Sun className="w-3.5 h-3.5" />
                Unfreeze Party
              </button>

              <button
                type="button"
                onClick={() => handleRollD20('wis', 'normal', false, 'perception')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Group Perception
              </button>
              <button
                type="button"
                onClick={() => handleRollD20('dex', 'normal', true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Group DEX Save
              </button>
              <button
                type="button"
                onClick={() => handleRollD20('wis', 'normal', true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 cursor-pointer whitespace-nowrap"
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Group WIS Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setCharacter((prev) => ({ ...prev, hp: prev.maxHp }));
                  appendChat(
                    '❤ DM Heal',
                    'text-rose-400',
                    `Full Heal Party: Restored ${character.username} to ${character.maxHp}/${character.maxHp} HP!`,
                    undefined,
                    'dm'
                  );
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 cursor-pointer whitespace-nowrap"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Full Heal Party
              </button>
              <button
                type="button"
                onClick={() => {
                  setCharacter((prev) => ({ ...prev, inspiration: true }));
                  appendChat(
                    '★ DM Reward',
                    'text-amber-400',
                    'All party members have been granted Heroic Inspiration (Advantage on next d20 roll)!',
                    undefined,
                    'dm'
                  );
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Inspire All
              </button>
            </div>
          </div>

          {/* Turn-Based Initiative Tracker & Player Combat Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Turn-Based Initiative &amp; Grid Movement Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Simulates server.persistentData.dndCombat &amp; PlayerEvents.tick coordinate locking.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCombatAttack}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer whitespace-nowrap"
                >
                  <Swords className="w-3.5 h-3.5" />
                  /dnd action attack
                </button>
                <button
                  type="button"
                  onClick={handleCombatDash}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 cursor-pointer whitespace-nowrap"
                >
                  <Footprints className="w-3.5 h-3.5" />
                  /dnd action dash
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateMove(2.0)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer whitespace-nowrap"
                >
                  Move +2m (Tick Check)
                </button>
              </div>
            </div>

            {combatants.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 text-center space-y-3">
                <div className="text-sm font-medium text-slate-300">
                  No Active Combat Encounter
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click "Start Combat" above or Right-Click kubejs:dm_wand in the hotbar to scan entities within 25 blocks, roll Initiative, and enable turn-based movement clamping.
                </p>
                <button
                  type="button"
                  onClick={handleStartCombat}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Combat Encounter (25m)
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="py-2.5 px-3">Turn</th>
                      <th className="py-2.5 px-3">Init</th>
                      <th className="py-2.5 px-3">Combatant</th>
                      <th className="py-2.5 px-3 text-right">HP</th>
                      <th className="py-2.5 px-3 text-right">AC</th>
                      <th className="py-2.5 px-3 text-right">Move Left</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                    {combatants.map((c, idx) => {
                      const isCurrent = idx === turnIndex;
                      return (
                        <tr
                          key={c.uuid}
                          onClick={() => !c.isPlayer && setSelectedTargetUuid(c.uuid)}
                          className={`${
                            isCurrent ? 'bg-amber-500/10' : 'hover:bg-slate-900/60'
                          } ${!c.isPlayer ? 'cursor-pointer' : ''}`}
                        >
                          <td className="py-2.5 px-3 font-mono">
                            {isCurrent ? (
                              <span className="text-amber-400 font-bold">▶ GLOW</span>
                            ) : (
                              <span className="text-slate-500">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-300 tabular-nums">
                            {c.initiative}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={c.isPlayer ? 'text-sky-300 font-semibold' : 'text-rose-300'}>
                              {c.name}
                            </span>
                            {!c.isPlayer && selectedTargetUuid === c.uuid && (
                              <span className="ml-2 text-xs text-amber-400 font-mono">[Target]</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                            {c.hp}/{c.maxHp}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                            {c.ac}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400">
                            {c.remainingMove.toFixed(1)}m
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {c.hasAction ? (
                              <span className="text-emerald-400">READY</span>
                            ) : (
                              <span className="text-slate-500">USED</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Simulated Minecraft Action Bar & Chat Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Action Bar HUD Preview */}
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="text-xs font-mono text-amber-300 truncate">
                Action Bar HUD: {actionBarText}
              </div>
              <button
                type="button"
                onClick={() =>
                  setChatLog([
                    {
                      id: 'clear-1',
                      tag: 'D&D Engine',
                      tagColor: 'text-slate-400',
                      text: 'Chat log cleared. Ready for new rolls and commands.',
                    },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Chat
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div className="p-4 bg-slate-950/90 max-h-72 overflow-y-auto space-y-2.5 font-mono text-xs">
              {chatLog.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-lg border ${
                    msg.highlight === 'nat20'
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : msg.highlight === 'nat1'
                      ? 'bg-rose-500/10 border-rose-500/40'
                      : msg.highlight === 'combat'
                      ? 'bg-slate-900 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800/80'
                  }`}
                >
                  <div>
                    <span className="text-slate-500">[</span>
                    <span className={`font-semibold ${msg.tagColor}`}>{msg.tag}</span>
                    <span className="text-slate-500">] </span>
                    <span className="text-slate-100">{msg.text}</span>
                  </div>
                  {msg.detail && <div className="text-slate-400 mt-1">{msg.detail}</div>}
                </div>
              ))}
            </div>

            {/* Command Bar Input (`/dnd roll 2d6+3`, etc.) */}
            <form
              onSubmit={handleRunCommand}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <Dices className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
              <input
                type="text"
                aria-label="Minecraft D&D Command Input"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="Type a command: /dnd roll 2d6+3, /dnd check dex adv, /dnd save wis..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Run Command
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
