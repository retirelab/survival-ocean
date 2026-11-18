import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HELICOPRION, HELICOPRION_HARVEST_REWARDS, BOMB_SPOTS, chooseAttack, harvestHelicoprion, helicoprionStatus, distanceToBounds, bombHitDuringCharge, tickBombs, newHelicoprion, isHelicoprionSave,
} from '../.test-build/Helicoprion.js';

test('boss numbers follow the design', () => {
  assert.equal(HELICOPRION.maxHp, 2000);
  assert.equal(HELICOPRION.attack, 30);
  assert.equal(HELICOPRION.bombDamage, 500);
  assert.equal(BOMB_SPOTS.length, 4);
  assert.deepEqual(newHelicoprion(), { hp: 2000, respawn: 0, harvests: 0, bombs: [0, 0, 0, 0] });
  assert.equal(isHelicoprionSave(newHelicoprion()), true);
});

test('far away it charges, up close it swings the lower jaw', () => {
  assert.equal(chooseAttack(HELICOPRION.nearDistance + 1), 'charge');
  assert.equal(chooseAttack(600), 'charge');
  assert.equal(chooseAttack(HELICOPRION.nearDistance), 'jaw');
  assert.equal(chooseAttack(40), 'jaw');
});

test('a charge keeps going past the player until it reaches the wall', () => {
  const box = { left: 0, top: 0, right: 1000, bottom: 600 };
  assert.equal(distanceToBounds(100, 300, 1, 0, box), 900);
  assert.equal(distanceToBounds(500, 100, 0, 5, box), 500);
  assert.ok(Math.abs(distanceToBounds(0, 0, 3, 4, box) - 750) < 1e-9);
  assert.equal(distanceToBounds(10, 10, 0, 0, box), 0);
});

test('a fast charge cannot skip over a bomb between frames and hits the nearest one first', () => {
  const bombs = [
    { x: 520, y: 300, radius: 20, armed: true },
    { x: 380, y: 305, radius: 20, armed: true },
    { x: 450, y: 420, radius: 20, armed: true },
  ];
  assert.equal(bombHitDuringCharge({ x: 300, y: 300 }, { x: 560, y: 300 }, 15, bombs), 1);
  assert.equal(bombHitDuringCharge({ x: 300, y: 300 }, { x: 340, y: 300 }, 15, bombs), -1);
  bombs[1].armed = false;
  assert.equal(bombHitDuringCharge({ x: 300, y: 300 }, { x: 560, y: 300 }, 15, bombs), 0);
});

test('exploded bombs come back after their respawn time', () => {
  const bombs = [0, HELICOPRION.bombRespawnSeconds, 3, 0];
  assert.deepEqual(tickBombs(bombs, 2), []);
  assert.deepEqual(bombs, [0, HELICOPRION.bombRespawnSeconds - 2, 1, 0]);
  assert.deepEqual(tickBombs(bombs, 1.5), [2]);
  assert.equal(bombs[2], 0);
});

test('the grey corpse gives five harvests, then the boss starts its respawn timer', () => {
  const boss = { ...newHelicoprion(), hp: 0 };
  assert.equal(helicoprionStatus(boss), 'dead');
  const rewards = [];
  for (let i = 0; i < 5; i++) rewards.push(harvestHelicoprion(boss));
  assert.deepEqual(rewards, ['헬리코프리온의 아래턱', '헬리코프리온의 살점', '헬리코프리온의 살점', '헬리코프리온의 비늘', '낡은 고대의 편지']);
  assert.deepEqual(rewards, [...HELICOPRION_HARVEST_REWARDS]);
  assert.equal(helicoprionStatus(boss), 'respawning');
  assert.equal(boss.respawn, HELICOPRION.respawnSeconds);
  assert.equal(harvestHelicoprion(boss), null);
});

test('a living or respawning boss cannot be harvested and harvest progress is validated', () => {
  assert.equal(harvestHelicoprion(newHelicoprion()), null);
  assert.equal(harvestHelicoprion({ ...newHelicoprion(), hp: 0, respawn: 30 }), null);
  const halfway = { hp: 0, respawn: 0, harvests: 3, bombs: [0, 0, 0, 0] };
  assert.equal(isHelicoprionSave(halfway), true);
  assert.equal(harvestHelicoprion(halfway), '헬리코프리온의 비늘');
  // 예전 저장(harvests 없음)도 그대로 읽습니다.
  assert.equal(isHelicoprionSave({ hp: 0, respawn: 0, bombs: [0, 0, 0, 0] }), true);
  for (const harvests of [5, -1, 1.5]) assert.equal(isHelicoprionSave({ ...halfway, harvests }), false);
});
