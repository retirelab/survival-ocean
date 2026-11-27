import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROPS, CROP_NAMES, GRASS_IDS, GRASS_HARVESTS, GRASS_REGROW_SECONDS, harvestGrass, tickGrass, rollCrop,
  newGrassStates, restoreGrassStates, isGrassSave, isCropInventory } from '../.test-build/Crops.js';
import { isSaveGame } from '../.test-build/SaveGame.js';

test('네 구역에 수상한 풀이 3포기씩 있다', () => {
  assert.equal(GRASS_IDS.length, 12);
  for (const zone of [0, 1, 4, 5]) assert.equal(GRASS_IDS.filter(id => id.startsWith(`${zone}-`)).length, 3);
});

test('작물 10종이 모두 같은 확률로 나온다', () => {
  assert.deepEqual(CROP_NAMES, ['쌀', '밀', '당근', '양파', '대파', '무', '고추', '마늘', '감자', '설탕']);
  CROPS.forEach((crop, index) => assert.equal(rollCrop((index + 0.5) / CROPS.length), crop.name));
  assert.equal(rollCrop(0), '쌀');
  assert.equal(rollCrop(0.999999), '설탕');
});

test('3번 수확하면 시들고 60초 뒤 다시 자란다', () => {
  const grass = newGrassStates()[0];
  for (let i = 0; i < GRASS_HARVESTS; i++) assert.ok(harvestGrass(grass, 0.3));
  assert.equal(grass.remaining, 0);
  assert.equal(grass.regrow, GRASS_REGROW_SECONDS);
  assert.equal(harvestGrass(grass, 0.3), null);
  assert.equal(tickGrass(grass, 59), false);
  assert.equal(harvestGrass(grass, 0.3), null);
  assert.equal(tickGrass(grass, 1), true);
  assert.equal(grass.remaining, GRASS_HARVESTS);
  assert.equal(grass.regrow, 0);
});

test('저장된 풀 상태를 되살리고 잘못된 값은 막는다', () => {
  const restored = restoreGrassStates([{ id: '4-1', remaining: 0, regrow: 12 }, { id: '0-0', remaining: 2, regrow: 0 }, { id: '1-2', remaining: 0, regrow: 0 }]);
  assert.equal(restored.length, 12);
  assert.deepEqual(restored.find(g => g.id === '4-1'), { id: '4-1', remaining: 0, regrow: 12 });
  assert.equal(restored.find(g => g.id === '0-0').remaining, 2);
  assert.equal(restored.find(g => g.id === '1-2').remaining, GRASS_HARVESTS);
  assert.equal(restoreGrassStates(undefined).every(g => g.remaining === GRASS_HARVESTS), true);
  assert.ok(isGrassSave([{ id: '5-2', remaining: 1, regrow: 0 }]));
  assert.ok(!isGrassSave([{ id: '9-0', remaining: 1, regrow: 0 }]));
  assert.ok(!isGrassSave([{ id: '5-2', remaining: 4, regrow: 0 }]));
  assert.ok(!isGrassSave([{ id: '5-2', remaining: 1, regrow: 0 }, { id: '5-2', remaining: 1, regrow: 0 }]));
  assert.ok(isCropInventory({ 쌀: 3, 설탕: 0 }));
  assert.ok(!isCropInventory({ 피자: 1 }));
  assert.ok(!isCropInventory({ 쌀: -1 }));
});

test('작물과 풀 상태가 저장에 들어가고 예전 저장도 읽힌다', () => {
  const save = {
    version: 1, savedAt: 1794772800000, zoneIndex: 0, level: 5,
    player: { x: 0.4, y: 0.6, facing: 1, hp: 175 }, bag: [], dragonLoot: [],
    minerals: { 다이아몬드: 0, 루비: 0, 사파이어: 0, 토파즈: 0, 부싯돌: 0 },
    upgrades: { rapid: 0, defense: 0, attack: 0 }, completedStages: [],
    stats: { attack: 1, defense: 1, rapid: 1, bulletSpeed: 1, autoFire: false, regenAmount: 0, regenInterval: 0, regenTimer: 0 },
    dragon: { state: 'sleeping', hp: 1250, harvests: 0, respawn: 0, cooldown: 0 }, ores: [],
    menu: { stage: 0, upgrading: false, nextZone: null, spawnY: 0.1 },
  };
  assert.ok(isSaveGame(save));
  assert.ok(isSaveGame({ ...save, crops: { 감자: 4 }, grasses: [{ id: '0-1', remaining: 0, regrow: 30 }] }));
  assert.ok(!isSaveGame({ ...save, crops: { 감자: 1.5 } }));
  assert.ok(!isSaveGame({ ...save, grasses: [{ id: '0-1', remaining: 0, regrow: 99 }] }));
});
