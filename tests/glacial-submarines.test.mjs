import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SUBMARINES, shopSubmarines, gradeLabel, getSubmarine, inventoryResources, RARE_MINERALS } from '../.test-build/Submarines.js';
import { COMBAT, newFishStatus, applyWeaponStatus, tickFishStatus, fishMovementSeconds, effectiveDefense, shipAttack, weaponForShip, holdWeapon, voltChargeLevel, sawBoost } from '../.test-build/SubmarineCombat.js';

const SPECIAL = ['hi_metal', 'rainbow', 'mega_volcano', 'mega_blizzard', 'mega_voltage', 'sword_crusher', 'master_dragon'];

test('the seven special submarines only appear after visiting the glacial valley and have no grade', () => {
  assert.deepEqual(shopSubmarines(false).map(sub => sub.id), ['basic', 'sturdy', 'fire', 'ice', 'electric', 'metal', 'baby_dragon']);
  assert.deepEqual(shopSubmarines(true).map(sub => sub.id).slice(7), SPECIAL);
  for (const id of SPECIAL) assert.equal(gradeLabel(getSubmarine(id)), '특별 잠수함');
  assert.equal(gradeLabel(getSubmarine('metal')), '2등급');
});

test('attack and defense multipliers follow the design', () => {
  const expected = {
    hi_metal: [5, 10], rainbow: [10, 5], mega_volcano: [5, 5], mega_blizzard: [5, 5],
    mega_voltage: [5, 5], sword_crusher: [15, 3], master_dragon: [6, 6], metal: [1, 4], basic: [1, 1],
  };
  for (const [id, [attack, defense]] of Object.entries(expected)) {
    assert.equal(shipAttack(id), attack, id);
    assert.equal(effectiveDefense(id, 1, 0), defense, id);
    assert.equal(effectiveDefense(id, 2, 0), defense * 2, id);
  }
});

test('weapons are assigned to each special submarine', () => {
  assert.equal(weaponForShip('hi_metal'), 'greenLaser');
  assert.equal(weaponForShip('rainbow'), 'rainbow');
  assert.equal(weaponForShip('mega_blizzard'), 'blade');
  assert.equal(holdWeapon('mega_volcano'), 'flame');
  assert.equal(holdWeapon('master_dragon'), 'hyper');
  assert.equal(holdWeapon('baby_dragon'), 'breath');
  assert.equal(holdWeapon('hi_metal'), null);
});

test('flamethrower burns for 8 damage every second', () => {
  const status = newFishStatus();
  applyWeaponStatus(status, 'flame');
  assert.equal(tickFishStatus(status, 1), 8);
  assert.equal(tickFishStatus(status, 4), 32);
  assert.equal(status.burnRemaining, 0);
  assert.equal(status.burnDamage, COMBAT.burnDamage);
});

test('ice blades slow a fish more with every hit and the slow wears off', () => {
  const status = newFishStatus();
  const speeds = [];
  for (let i = 0; i < 4; i++) { applyWeaponStatus(status, 'blade'); speeds.push(fishMovementSeconds(status, 1)); }
  assert.deepEqual(speeds.map(v => +v.toFixed(4)), [0.75, 0.5625, 0.4219, 0.3164]);
  for (let i = 0; i < 20; i++) applyWeaponStatus(status, 'blade');
  assert.ok(Math.abs(fishMovementSeconds(status, 1) - COMBAT.bladeSlowMin) < 1e-9);
  tickFishStatus(status, COMBAT.slowSeconds);
  assert.equal(fishMovementSeconds(status, 1), 1);
  applyWeaponStatus(status, 'blade');
  assert.equal(fishMovementSeconds(status, 1), 0.75);
});

test('voltage charge has three levels and the saw crusher speeds up while held', () => {
  assert.equal(voltChargeLevel(0.1), 1);
  assert.equal(voltChargeLevel(COMBAT.voltLevel2), 2);
  assert.equal(voltChargeLevel(COMBAT.voltLevel3 + 1), 3);
  assert.equal(sawBoost(0), 1);
  assert.equal(sawBoost(COMBAT.boostDelay), 1);
  assert.ok(sawBoost(1) > 1.5);
  assert.equal(sawBoost(60), COMBAT.boostMax);
});

test('boss loot used in recipes is counted from the loot list', () => {
  const resources = inventoryResources({ 다이아몬드: 4, 그라시스메탈: 1 },
    ['헬리코프리온의 아래턱', '헬리코프리온의 비늘', '헬리코프리온의 살점', '수룡의 퇴화된 날개', '수룡의 퇴화된 날개']);
  assert.equal(resources['헬리코프리온의 아래턱'], 1);
  assert.equal(resources['헬리코프리온의 비늘'], 1);
  assert.equal(resources['수룡의 퇴화된 날개'], 2);
  assert.equal(resources.그라시스메탈, 1);
  assert.equal(resources['슈퍼 루비'], 0);
  assert.deepEqual([...RARE_MINERALS], ['그라시스메탈', '레인보우크리스탈', '슈퍼 루비', '슈퍼 사파이어', '슈퍼 토파즈']);
  assert.equal(SUBMARINES.length, 14);
});
