import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HELICOPRION, HELICOPRION_HARVEST_REWARDS, BOMB_SPOTS, chooseAttack, harvestHelicoprion, helicoprionStatus, distanceToBounds, bombHitDuringCharge, tickBombs, newHelicoprion, isHelicoprionSave, restoreHelicoprion, newHelicoprionGrip, pressHelicoprionEscape, tickHelicoprionGrip, HELICOPRION_PATTERNS, randomSwordAmbush, swordDashPath, segmentPointDistance,
} from '../.test-build/Helicoprion.js';

test('boss numbers follow the design', () => {
  assert.equal(HELICOPRION.maxHp, 6000);
  assert.equal(HELICOPRION.attack, 30);
  assert.equal(HELICOPRION.bombDamage, 500);
  assert.equal(BOMB_SPOTS.length, 4);
  assert.deepEqual(newHelicoprion(), { hp: 6000, maxHp: 6000, respawn: 0, harvests: 0, bombs: [0, 0, 0, 0] });
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


test('old saves preserve the percentage of health and never revive a corpse', () => {
  const old = { hp: 1200, respawn: 0, bombs: [0, 7, 0, 0] };
  const loaded = restoreHelicoprion(old);
  assert.equal(loaded.hp, 3600);
  assert.equal(loaded.maxHp, 6000);
  assert.deepEqual(loaded.bombs, old.bombs);
  assert.deepEqual(restoreHelicoprion(loaded), loaded);
  assert.equal(restoreHelicoprion({ ...old, hp: 0, harvests: 2 }).hp, 0);
  assert.equal(isHelicoprionSave({ ...loaded, hp: 6001 }), false);
});

test('devour requires eight presses, while Sword Break stun ends in one finishing slash', () => {
  const devour = newHelicoprionGrip('devour');
  assert.equal(tickHelicoprionGrip(devour, 0.95).cuts, 2);
  for (let i = 0; i < 7; i++) assert.equal(pressHelicoprionEscape(devour), false);
  assert.equal(pressHelicoprionEscape(devour), true);
  const finished = tickHelicoprionGrip(devour, 8);
  assert.equal(finished.finished, true);
  assert.equal(finished.finalSlash, false);
  assert.equal(pressHelicoprionEscape(devour), false);

  const sword = newHelicoprionGrip('sword');
  for (let i = 0; i < 12; i++) assert.equal(pressHelicoprionEscape(sword), false);
  assert.deepEqual(tickHelicoprionGrip(sword, 0.65), { cuts: 2, finished: false, finalSlash: false });
  assert.deepEqual(tickHelicoprionGrip(sword, 3), { cuts: 5, finished: true, finalSlash: true });
});


test('Sword Break chooses every entry direction and plans a straight path through the locked point', () => {
  const target = { x: 730, y: 216 };
  const starts = new Set();
  for (let i = 0; i < 8; i++) {
    const samples = [i / 8 + 0.01, i / 8];
    const plan = randomSwordAmbush(() => samples.shift());
    assert.equal(plan.angle, i * Math.PI / 4);
    assert.ok(plan.delay >= 0.35 && plan.delay <= 2.15);
    const { x, y, dx, dy, remaining } = swordDashPath(target, plan.angle, 1000, 640, 155);
    const bx = x + dx * remaining, by = y + dy * remaining;
    const offscreen = (x, y) => x < 0 || x > 1000 || y < 0 || y > 640;
    assert.ok(offscreen(x, y) && offscreen(bx, by));
    assert.ok(segmentPointDistance(target.x, target.y, x, y, bx, by) < 0.01);
    assert.ok(segmentPointDistance(target.x - dy * 75, target.y + dx * 75, x, y, bx, by) > 70);
    starts.add(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  assert.equal(starts.size, 8);
  assert.ok(randomSwordAmbush(() => 0.98).delay - randomSwordAmbush(() => 0.02).delay > 1.5);
});

test('all three skill chains are in order and the spin is faster', () => {
  assert.deepEqual(HELICOPRION_PATTERNS.filter(chain => chain.length > 1), [
    ['charge', 'waves'], ['devour', 'spin'], ['sword', 'charge', 'waves', 'spin'],
  ]);
  assert.ok(HELICOPRION.spinWindup < 0.3);
  assert.ok(HELICOPRION.spinSeconds <= 0.4);
});
