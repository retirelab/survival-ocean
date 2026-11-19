import { test, beforeEach } from 'node:test';
import { craftOrEquip, damageEquippedSubmarine, emptyResources, repairSeconds } from '../.test-build/Submarines.js';
import assert from 'node:assert/strict';
import { readSave, writeSave, isSaveGame, resolveProgress, SAVE_KEY, MAX_ZONE_INDEX } from '../.test-build/SaveGame.js';

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
    data => data.zoneIndex = MAX_ZONE_INDEX + 1,
    data => data.level = 21,
    data => data.level = 41,
    data => data.progress = { maxLevelExpanded: 'yes', dragonPassUnlocked: true },
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

test('post-dragon depths and expanded levels can be saved and loaded', () => {
  for (const zoneIndex of [4, 5, MAX_ZONE_INDEX]) {
    const data = { ...sample(), zoneIndex, level: 40,
      progress: { maxLevelExpanded: true, dragonPassUnlocked: true } };
    assert.equal(writeSave(data), true, `zone ${zoneIndex}`);
    assert.deepEqual(readSave().data, data);
  }
  // 빙하수 골짜기를 다녀온 뒤 지하세계로 올라와 저장해도 확장 레벨을 유지합니다.
  const back = { ...sample(), zoneIndex: 3, level: 27, progress: { maxLevelExpanded: true, dragonPassUnlocked: true } };
  assert.equal(writeSave(back), true);
  assert.deepEqual(resolveProgress(readSave().data), back.progress);
  // 강화 메뉴의 대기 구역도 새 구역 번호를 허용합니다.
  const pending = { ...sample(), menu: { stage: 3, upgrading: true, nextZone: 5, spawnY: 0.07 } };
  assert.equal(writeSave(pending), true);
});

test('dragon pass opens after the first kill and stays open for older saves', () => {
  const fresh = () => ({ ...sample(), dragonLoot: [], dragon: { state: 'sleeping', hp: 1250, harvests: 0, respawn: 0, cooldown: 5 } });
  assert.deepEqual(resolveProgress(fresh()), { maxLevelExpanded: false, dragonPassUnlocked: false });
  // 막 쓰러뜨려 아직 갈무리하지 않은 상태
  const justKilled = fresh(); justKilled.dragon = { state: 'dead', hp: 0, harvests: 0, respawn: 0, cooldown: 0 };
  assert.equal(resolveProgress(justKilled).dragonPassUnlocked, true);
  // 부활해서 다시 잠든 상태라도 전리품이나 아기 드래곤 잠수함이 있으면 이미 잡은 것입니다.
  assert.equal(resolveProgress({ ...fresh(), dragonLoot: ['수룡의 비늘'] }).dragonPassUnlocked, true);
  assert.equal(resolveProgress({ ...fresh(), submarines: { owned: ['basic', 'baby_dragon'], equipped: 'basic' } }).dragonPassUnlocked, true);
  assert.equal(resolveProgress({ ...fresh(), progress: { maxLevelExpanded: false, dragonPassUnlocked: true } }).dragonPassUnlocked, true);
  assert.deepEqual(resolveProgress({ ...fresh(), zoneIndex: 4 }), { maxLevelExpanded: true, dragonPassUnlocked: true });
});

test('helicoprion nest progress round-trips and rejects broken boss data', () => {
  const data = { ...sample(), zoneIndex: 7, level: 33, progress: { maxLevelExpanded: true, dragonPassUnlocked: true },
    helicoprion: { hp: 1250, respawn: 0, bombs: [0, 12.5, 0, 20] } };
  const corpse = { ...data, dragonLoot: ['헬리코프리온의 아래턱', '낡은 고대의 편지'],
    helicoprion: { hp: 0, respawn: 0, harvests: 2, bombs: [0, 0, 0, 0] } };
  assert.equal(writeSave(corpse), true);
  assert.deepEqual(readSave().data, corpse);
  assert.equal(writeSave(data), true);
  assert.deepEqual(readSave().data, data);
  for (const helicoprion of [
    { hp: 2001, respawn: 0, bombs: [0, 0, 0, 0] },
    { hp: 100, respawn: 301, bombs: [0, 0, 0, 0] },
    { hp: 100, respawn: 0, bombs: [0, 0, 0] },
    { hp: 100, respawn: 0, bombs: [0, 0, 0, 21] },
    null,
  ]) assert.equal(writeSave({ ...data, helicoprion }), false);
});


test('a damaged submarine is kept but cannot be equipped until five minutes after death, even after reload', () => {
  const data = sample();
  const now = data.savedAt;
  const fleet = { owned: ['basic', 'metal', 'ice'], equipped: 'metal' };
  data.submarines = damageEquippedSubmarine(fleet, now);
  assert.equal(writeSave(data), true);
  const restored = readSave().data.submarines;
  assert.deepEqual(restored.owned, fleet.owned);
  assert.equal(restored.equipped, 'basic');
  assert.equal(repairSeconds(restored, 'metal', now), 300);
  const resources = emptyResources();
  assert.match(craftOrEquip(restored, resources, 'metal', now + 299_999).error, /수리 중/);
  const other = craftOrEquip(restored, resources, 'ice', now + 1000).state;
  const secondDeath = damageEquippedSubmarine(other, now + 2000);
  assert.equal(repairSeconds(secondDeath, 'metal', now + 2000), 298);
  assert.equal(repairSeconds(secondDeath, 'ice', now + 2000), 300);
  assert.strictEqual(damageEquippedSubmarine(secondDeath, now + 3000), secondDeath);
  const repaired = craftOrEquip(secondDeath, resources, 'metal', now + 300_000);
  assert.equal(repaired.error, null);
  assert.equal(repaired.state.equipped, 'metal');
  assert.deepEqual(repaired.resources, resources);
  assert.equal(repairSeconds(repaired.state, 'ice', now + 300_000), 2);
});

test('save validation rejects repair records for the basic, equipped, or unowned submarine', () => {
  const data = sample();
  for (const repairUntil of [{ basic: 100 }, { ice: 100 }, { metal: 100 }, { sturdy: -1 }]) {
    data.submarines = { owned: ['basic', 'ice', 'sturdy'], equipped: 'ice', repairUntil };
    assert.equal(writeSave(data), false);
  }
});

test('the hydrothermal dragon fight state is saved and validated', () => {
  const data = { ...sample(), zoneIndex: 6, level: 30, progress: { maxLevelExpanded: true, dragonPassUnlocked: true },
    dragonLoot: ['수룡의 역광비늘', '수룡의 머리뼈+'], abyssDragon: { state: 'evolved', hp: 2750, harvests: 0, respawn: 0 } };
  assert.equal(writeSave(data), true);
  assert.deepEqual(readSave().data, data);
  assert.equal(writeSave({ ...data, abyssDragon: { state: 'evolved', hp: 5000, harvests: 0, respawn: 0 } }), false);
});
