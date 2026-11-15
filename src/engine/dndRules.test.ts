import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMod,
  getProfBonus,
  parseDiceFormula,
  rollFormula,
  evaluateD20Test,
  sortInitiativeOrder,
  calculateMovementClamp,
  CLASS_PRESETS,
  PlayerCharacterState,
  Combatant,
} from './dndRules';

test('getMod calculates accurate D&D 5e ability modifiers', () => {
  assert.equal(getMod(10), 0);
  assert.equal(getMod(11), 0);
  assert.equal(getMod(16), 3);
  assert.equal(getMod(8), -1);
  assert.equal(getMod(20), 5);
  assert.equal(getMod(1), -5);
});

test('getProfBonus scales properly across levels 1 to 20', () => {
  assert.equal(getProfBonus(1), 2);
  assert.equal(getProfBonus(4), 2);
  assert.equal(getProfBonus(5), 3);
  assert.equal(getProfBonus(9), 4);
  assert.equal(getProfBonus(13), 5);
  assert.equal(getProfBonus(17), 6);
  assert.equal(getProfBonus(20), 6);
});

test('parseDiceFormula and rollFormula parse valid formulas and reject invalid ones', () => {
  assert.deepEqual(parseDiceFormula('1d20'), { count: 1, sides: 20, modifier: 0 });
  assert.deepEqual(parseDiceFormula('2d6+3'), { count: 2, sides: 6, modifier: 3 });
  assert.deepEqual(parseDiceFormula('1d8-1'), { count: 1, sides: 8, modifier: -1 });
  assert.equal(parseDiceFormula('invalid'), null);
  assert.equal(parseDiceFormula('200d6'), null);

  // Test Natural 20 detection
  const nat20Roll = rollFormula('1d20+4', () => 0.99);
  assert.ok(nat20Roll);
  assert.equal(nat20Roll.rolls[0], 20);
  assert.equal(nat20Roll.total, 24);
  assert.equal(nat20Roll.nat20, true);
  assert.equal(nat20Roll.nat1, false);

  // Test Natural 1 detection
  const nat1Roll = rollFormula('1d20+4', () => 0.0);
  assert.ok(nat1Roll);
  assert.equal(nat1Roll.rolls[0], 1);
  assert.equal(nat1Roll.total, 5);
  assert.equal(nat1Roll.nat1, true);
  assert.equal(nat1Roll.nat20, false);
});

test('evaluateD20Test consumes inspiration automatically and adds save proficiency', () => {
  const fighter: PlayerCharacterState = {
    ...CLASS_PRESETS.Fighter,
    username: 'Aragorn',
    hp: 24,
    inspiration: true,
    hitDiceRemaining: 1,
  };

  let callCount = 0;
  const mockRng = () => {
    callCount++;
    return callCount === 1 ? 0.1 : 0.85; // Roll 3 and Roll 18
  };

  // Fighter has STR save proficiency (+3 STR mod + 2 Prof = +5)
  const { result, updatedCharacter } = evaluateD20Test(fighter, 'str', 'normal', true, undefined, mockRng);
  assert.equal(result.consumedInspiration, true);
  assert.equal(updatedCharacter.inspiration, false);
  assert.equal(result.chosenRoll, 18);
  assert.equal(result.isProficient, true);
  assert.equal(result.total, 18 + 3 + 2);
});

test('sortInitiativeOrder sorts descending by initiative with modifier tie-breaker', () => {
  const list: Combatant[] = [
    {
      uuid: '1',
      name: 'Skeleton',
      isPlayer: false,
      initiative: 14,
      initRoll: 13,
      initMod: 1,
      startX: 0,
      startY: 64,
      startZ: 0,
      currentX: 0,
      currentZ: 0,
      speed: 6,
      maxMoveThisTurn: 6,
      remainingMove: 6,
      hasAction: true,
      hasBonusAction: true,
      ac: 13,
      hp: 13,
      maxHp: 13,
    },
    {
      uuid: '2',
      name: 'RoguePlayer',
      isPlayer: true,
      initiative: 14,
      initRoll: 11,
      initMod: 3,
      startX: 0,
      startY: 64,
      startZ: 0,
      currentX: 0,
      currentZ: 0,
      speed: 7,
      maxMoveThisTurn: 7,
      remainingMove: 7,
      hasAction: true,
      hasBonusAction: true,
      ac: 14,
      hp: 18,
      maxHp: 18,
    },
    {
      uuid: '3',
      name: 'WizardPlayer',
      isPlayer: true,
      initiative: 19,
      initRoll: 17,
      initMod: 2,
      startX: 0,
      startY: 64,
      startZ: 0,
      currentX: 0,
      currentZ: 0,
      speed: 6,
      maxMoveThisTurn: 6,
      remainingMove: 6,
      hasAction: true,
      hasBonusAction: true,
      ac: 12,
      hp: 14,
      maxHp: 14,
    },
  ];

  const sorted = sortInitiativeOrder(list);
  assert.equal(sorted[0].name, 'WizardPlayer');
  assert.equal(sorted[1].name, 'RoguePlayer');
  assert.equal(sorted[2].name, 'Skeleton');
});

test('calculateMovementClamp locks out-of-turn movement > 0.3m and clamps in-turn movement to speed', () => {
  // Out-of-turn lock
  const outTurn = calculateMovementClamp(0, 0, 1.5, 0, 6, false);
  assert.equal(outTurn.wasTeleportedBack, true);
  assert.equal(outTurn.clampedX, 0);

  // In-turn valid movement (4m out of 6m speed)
  const inTurnValid = calculateMovementClamp(0, 0, 4, 0, 6, true);
  assert.equal(inTurnValid.wasTeleportedBack, false);
  assert.equal(inTurnValid.remainingMove, 2);

  // In-turn exceeded movement (10m out of 6m speed)
  const inTurnExceeded = calculateMovementClamp(0, 0, 10, 0, 6, true);
  assert.equal(inTurnExceeded.wasTeleportedBack, true);
  assert.equal(inTurnExceeded.remainingMove, 0);
  assert.ok(inTurnExceeded.clampedX <= 6.0);
});
