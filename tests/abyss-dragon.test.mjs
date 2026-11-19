import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ABYSS_DRAGON, ABYSS_HARVEST_REWARDS, newAbyssDragon, isAbyssDragonSave, maxHpFor, attackFor,
  chooseAbyssAttack, curtainSafeY, inCurtain, harvestAbyssDragon, tickAbyssRespawn,
} from '../.test-build/AbyssDragon.js';

test('the sleeping dragon matches the underworld dragon and evolves into a 4000 HP, 80 attack dragon', () => {
  assert.deepEqual(newAbyssDragon(), { state: 'sleeping', hp: 1250, harvests: 0, respawn: 0 });
  assert.equal(maxHpFor('awake'), 1250);
  assert.equal(attackFor('awake'), 50);
  assert.equal(maxHpFor('evolved'), 4000);
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
  assert.ok(picked === 'arm' || picked === 'tail');
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
