import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMBAT, newFishStatus, applyWeaponStatus, tickFishStatus, fishMovementSeconds, effectiveDefense, weaponForShip, distanceToSegment, segmentHitsRect } from '../.test-build/SubmarineCombat.js';

test('fire burns for two damage each second including the final fifth tick', () => {
  const state = newFishStatus(); applyWeaponStatus(state, 'fire');
  assert.equal(tickFishStatus(state, .99), 0);
  assert.equal(tickFishStatus(state, .01), 2);
  assert.equal(tickFishStatus(state, 4), 8);
  assert.equal(tickFishStatus(state, 10), 0);
  assert.equal(state.burnRemaining, 0);
});
test('repeated fire refreshes the duration without delaying or multiplying the next tick', () => {
  const state = newFishStatus(); applyWeaponStatus(state, 'fire');
  tickFishStatus(state, .6); applyWeaponStatus(state, 'fire');
  assert.equal(tickFishStatus(state, .4), 2);
  assert.equal(state.burnRemaining, 4.6);
});
test('ice slows exactly the active part of a frame and then expires', () => {
  const state = newFishStatus(); applyWeaponStatus(state, 'ice');
  assert.equal(fishMovementSeconds(state, 2), 1); tickFishStatus(state, 2);
  assert.equal(fishMovementSeconds(state, 2), 1.5); tickFishStatus(state, 2);
  assert.equal(state.slowRemaining, 0); assert.equal(fishMovementSeconds(state, 1), 1);
});
test('paralysis fully stops five seconds and allows movement only after expiry', () => {
  const state = newFishStatus(); state.paralyzeRemaining = COMBAT.shockSeconds;
  for (let i = 0; i < 5; i++) { assert.equal(fishMovementSeconds(state, 1), 0); tickFishStatus(state, 1); }
  assert.equal(fishMovementSeconds(state, 1), 1);
});
test('burn still ticks while a fish is paralyzed, and effects have independent lifetimes', () => {
  const state = newFishStatus(); applyWeaponStatus(state, 'fire'); applyWeaponStatus(state, 'ice'); state.paralyzeRemaining = 5;
  assert.equal(tickFishStatus(state, 3), 6);
  assert.equal(state.paralyzeRemaining, 2); assert.equal(state.slowRemaining, 0); assert.equal(state.burnRemaining, 2);
});
test('metal defense is four and reactive armor only applies during its timer', () => {
  assert.equal(effectiveDefense('basic', 1, 5), 1);
  assert.equal(effectiveDefense('metal', 1, 0), 4);
  assert.equal(effectiveDefense('metal', 2, 0), 8);
  assert.equal(effectiveDefense('sturdy', 1, 5), 2);
  assert.equal(effectiveDefense('sturdy', 1, 0), 1);
});
test('weapons retain their original elemental type after being fired', () => {
  assert.equal(weaponForShip('fire'), 'fire'); assert.equal(weaponForShip('ice'), 'ice');
  assert.equal(weaponForShip('metal'), 'laser'); assert.equal(weaponForShip('electric'), 'bullet');
});
test('fast projectiles and long beams hit targets between frames without hitting behind the origin', () => {
  assert.equal(distanceToSegment(50, 0, 0, 0, 100, 0), 0);
  assert.equal(distanceToSegment(-50, 0, 0, 0, 100, 0), 50);
  assert.equal(distanceToSegment(3, 4, 0, 0, 0, 0), 5);
  const rect = { x: 40, y: 20, width: 20, height: 30 };
  assert.equal(segmentHitsRect(0, 35, 100, 35, rect), true);
  assert.equal(segmentHitsRect(0, 0, 100, 0, rect), false);
  assert.equal(segmentHitsRect(50, 0, 50, 100, rect), true);
  assert.equal(segmentHitsRect(0, 0, 20, 10, rect), false);
});
