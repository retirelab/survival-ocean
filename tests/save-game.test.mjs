import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readSave, writeSave, isSaveGame, SAVE_KEY } from '../.test-build/SaveGame.js';

const sample = () => ({
  version: 1, savedAt: 1794772800000, zoneIndex: 3, level: 20,
  player: { x: 0.4, y: 0.6, facing: -1, hp: 175 },
  bag: ['송어', '참다랑어'], dragonLoot: ['수룡의 머리뼈'],
  minerals: { 다이아몬드: 1, 루비: 2, 사파이어: 3, 토파즈: 4, 부싯돌: 5 },
  upgrades: { rapid: 2, defense: 1, attack: 1 }, completedStages: [0, 1, 2, 3],
  stats: { attack: 2, defense: 2, rapid: 2, bulletSpeed: 1, autoFire: true, regenAmount: 5, regenInterval: 20, regenTimer: 13.4 },
  dragon: { state: 'dead', hp: 0, harvests: 2, respawn: 0, cooldown: 0 },
  ores: [{ id: 'upper', remaining: 0, respawn: 43.2 }, { id: 'lower', remaining: 3, respawn: 0 }],
  menu: { stage: 3, upgrading: false, nextZone: null, spawnY: 0.1 },
});
let entries;
beforeEach(() => {
  entries = new Map();
  globalThis.localStorage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
});

test('empty slot is distinct from an unreadable save', () => {
  assert.deepEqual(readSave(), { data: null, error: null });
});
test('round trip preserves progress, resources, timers and upgrade choices', () => {
  const data = sample();
  assert.equal(writeSave(data), true);
  assert.deepEqual(readSave(), { data, error: null });
  data.menu = { stage: 2, upgrading: true, nextZone: 2, spawnY: 0.07 };
  assert.equal(writeSave(data), true);
  assert.deepEqual(readSave().data.menu, data.menu);
});
test('corrupt and future saves are reported and preserved', () => {
  for (const raw of ['{broken', 'null', '[]', '{}', JSON.stringify({ ...sample(), version: 2 })]) {
    entries.set(SAVE_KEY, raw);
    assert.equal(readSave().data, null);
    assert.ok(readSave().error);
    assert.equal(entries.get(SAVE_KEY), raw);
  }
});
test('invalid nested values cannot reach the scene', () => {
  for (const change of [
    data => delete data.stats,
    data => data.player.hp = NaN,
    data => data.zoneIndex = 4,
    data => data.level = 1.5,
    data => data.upgrades.attack = 5,
    data => delete data.minerals['루비'],
    data => data.ores[0].respawn = Infinity,
    data => data.ores[1].id = 'upper',
    data => data.bag = Array(13).fill('송어'),
    data => data.dragonLoot.push(undefined),
    data => data.menu.nextZone = -1,
    data => data.player.x = -0.1,
  ]) {
    const data = sample(); change(data);
    assert.equal(isSaveGame(data), false);
    assert.equal(writeSave(data), false);
  }
});
test('storage disabled or full returns failure without deleting the prior save', () => {
  const original = sample(); writeSave(original);
  localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(writeSave({ ...original, level: 19 }), false);
  assert.deepEqual(readSave().data, original);
  localStorage.getItem = () => { throw new Error('blocked'); };
  assert.equal(readSave().data, null);
  assert.ok(readSave().error);
});


test('legacy fleet saves migrate without changing minerals or dragon loot', () => {
  assert.equal(writeSave(sample()), true);
  assert.equal(readSave().data.submarines, undefined);
  const old = { ...sample(), submarines: { coins: 427, owned: ['basic', 'coral', 'abyss', 'gold'], equipped: 'gold' } };
  entries.set(SAVE_KEY, JSON.stringify(old));
  const data = readSave().data;
  assert.deepEqual(data.submarines, { owned: ['basic', 'sturdy', 'ice', 'metal'], equipped: 'metal' });
  assert.deepEqual(data.minerals, old.minerals);
  assert.deepEqual(data.dragonLoot, old.dragonLoot);
  assert.equal(writeSave(data), true);
  assert.deepEqual(readSave().data, data);
  data.submarines.equipped = 'baby_dragon';
  assert.equal(writeSave(data), false);
});

test('electric cooldown and armor duration survive save/load and reject out of range timers', () => {
  const data = { ...sample(), combat: { armorRemaining: 3.5, shockCooldown: 27 } };
  assert.equal(writeSave(data), true); assert.deepEqual(readSave().data.combat, data.combat);
  data.combat.shockCooldown = 31; assert.equal(writeSave(data), false);
  data.combat.shockCooldown = 0; data.combat.armorRemaining = -1; assert.equal(writeSave(data), false);
});


test('four mining rocks round-trip while older two-rock saves remain valid', () => {
  const data = sample();
  assert.equal(writeSave(data), true);
  assert.deepEqual(readSave().data.ores, data.ores);
  data.ores.push({ id: 'upper_left', remaining: 5, respawn: 0 }, { id: 'lower_right', remaining: 0, respawn: 24 });
  assert.equal(writeSave(data), true);
  assert.deepEqual(readSave().data.ores, data.ores);
  data.ores.push({ id: 'unknown', remaining: 5, respawn: 0 });
  assert.equal(writeSave(data), false);
});
