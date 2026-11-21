import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ABYSS_DRAGON, ABYSS_HARVEST_REWARDS, newAbyssDragon, isAbyssDragonSave, maxHpFor, attackFor,
  damageAbyssDragon, restoreAbyssDragon, tickAbyssHealing, abyssCurtainDirection, abyssBiteParalyzes,
  chooseAbyssAttack, curtainSafeY, inCurtain, harvestAbyssDragon, tickAbyssRespawn,
} from '../.test-build/AbyssDragon.js';

test('the sleeping dragon matches the underworld dragon and evolves into a 8880 HP, 80 attack dragon', () => {
  assert.deepEqual(newAbyssDragon(), { state: 'sleeping', hp: 1250, harvests: 0, respawn: 0 });
  assert.equal(maxHpFor('awake'), 1250);
  assert.equal(attackFor('awake'), 50);
  assert.equal(maxHpFor('evolved'), 8880);
  assert.equal(attackFor('evolved'), 80);
  assert.equal(ABYSS_DRAGON.curtainDamage, 10);
});

test('before evolving it never uses the long breath; after evolving it mixes it in at least every few attacks', () => {
  const never = () => 0.0;
  for (let i = 0; i < 20; i++) assert.notEqual(chooseAbyssAttack(false, undefined, 99, never), 'curtain');
  assert.equal(chooseAbyssAttack(true, 'arm', ABYSS_DRAGON.curtainMaxGap, () => 0.99), 'curtain');
  assert.notEqual(chooseAbyssAttack(true, 'curtain', 99, () => 0), 'curtain');
  assert.equal(chooseAbyssAttack(true, 'arm', 0, () => 0.1), 'curtain');
  const picked = chooseAbyssAttack(true, 'breath', 0, () => 0.9);
  assert.ok(['arm', 'tail', 'current', 'bite'].includes(picked));
});

test('the long breath covers the screen except the bottom strip', () => {
  const h = 800;
  assert.equal(curtainSafeY(h), h * (1 - ABYSS_DRAGON.curtainSafeBand));
  assert.equal(inCurtain(20, h), true);
  assert.equal(inCurtain(h * 0.6, h), true);
  assert.equal(inCurtain(h - 25, h), false);
});

test('the grey evolved corpse gives five harvests, then respawns as the sleeping dragon', () => {
  const dragon = { state: 'dead', hp: 0, harvests: 0, respawn: 0 };
  assert.equal(isAbyssDragonSave(dragon), true);
  const rewards = [];
  for (let i = 0; i < 5; i++) rewards.push(harvestAbyssDragon(dragon));
  assert.deepEqual(rewards, ['수룡의 역광비늘', '수룡의 불멸의 꼬리가시', '수룡의 퇴화된 날개', '수룡의 퇴화된 날개', '수룡의 머리뼈+']);
  assert.deepEqual(rewards, [...ABYSS_HARVEST_REWARDS]);
  assert.equal(dragon.state, 'respawning');
  assert.equal(dragon.respawn, ABYSS_DRAGON.respawnSeconds);
  assert.equal(harvestAbyssDragon(dragon), null);
  assert.equal(tickAbyssRespawn(dragon, 100), false);
  assert.equal(tickAbyssRespawn(dragon, 200), true);
  assert.deepEqual(dragon, newAbyssDragon());
});

test('broken boss saves are rejected', () => {
  for (const bad of [
    { state: 'evolved', hp: 4001, harvests: 0, respawn: 0 },
    { state: 'awake', hp: 2000, harvests: 0, respawn: 0 },
    { state: 'dead', hp: 0, harvests: 5, respawn: 0 },
    { state: 'respawning', hp: 0, harvests: 0, respawn: 0 },
    { state: 'sleeping', hp: 1250, harvests: 0, respawn: 30 },
    { state: 'flying', hp: 1, harvests: 0, respawn: 0 },
  ]) assert.equal(isAbyssDragonSave(bad), false, JSON.stringify(bad));
  assert.equal(isAbyssDragonSave({ state: 'evolved', hp: 3100, harvests: 0, respawn: 0 }), true);
});


test('rage begins at half HP, raises attack and defense, and heals 3 every five seconds', () => {
  const dragon = { state: 'evolved', hp: 4450, harvests: 0, respawn: 0, enraged: false };
  assert.equal(damageAbyssDragon(dragon, 10).enteredRage, true);
  assert.equal(dragon.hp, 4440);
  assert.equal(attackFor('evolved', dragon.enraged), 100);
  assert.equal(damageAbyssDragon(dragon, 150).damage, 100);
  assert.equal(dragon.hp, 4340);
  tickAbyssHealing(dragon, 4.9);
  assert.equal(dragon.hp, 4340);
  tickAbyssHealing(dragon, 0.1);
  assert.equal(dragon.hp, 4343);
  const loaded = restoreAbyssDragon(JSON.parse(JSON.stringify(dragon)));
  tickAbyssHealing(loaded, 160);
  assert.equal(loaded.hp, 4439);
  tickAbyssHealing(loaded, 5);
  assert.equal(loaded.hp, 4442);
  assert.equal(loaded.enraged, true);
  assert.equal(isAbyssDragonSave(loaded), true);
});

test('old evolved-dragon saves keep their percentage without resetting in-progress fights', () => {
  const old = { state: 'evolved', hp: 2000, harvests: 0, respawn: 0 };
  const migrated = restoreAbyssDragon(old);
  assert.equal(migrated.hp, 4440);
  assert.equal(migrated.enraged, true);
  assert.deepEqual(restoreAbyssDragon(migrated), migrated);
  const evolving = restoreAbyssDragon({ state: 'awake', hp: 0, harvests: 0, respawn: 0 });
  assert.equal(evolving.state, 'evolved');
  assert.equal(evolving.hp, 8880);
  assert.equal(isAbyssDragonSave(evolving), true);
});

test('reverse breath is exclusive to rage and switches safety to the top', () => {
  assert.equal(abyssCurtainDirection(false, () => 0), 'down');
  assert.equal(abyssCurtainDirection(true, () => 0), 'up');
  assert.equal(abyssCurtainDirection(true, () => 0.9), 'down');
  assert.equal(inCurtain(30, 320, 'up'), false);
  assert.equal(inCurtain(290, 320, 'up'), true);
  assert.equal(abyssBiteParalyzes(() => 0.029), true);
  assert.equal(abyssBiteParalyzes(() => 0.03), false);
  assert.equal(ABYSS_DRAGON.biteParalysisSeconds, 4);
});
