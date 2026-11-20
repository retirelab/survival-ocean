import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceMX3Dialogue, damageMX3, isMX3Save, newMX3, MX3, MX3_INTRO, MX3_REWARDS, mx3MissileSpeed } from '../.test-build/MX3.js';

test('M-X 3 cannot be damaged until the last line of the eavesdropping scene', () => {
  const idle = newMX3();
  assert.equal(idle.hp, 3500);
  assert.equal(MX3.attack, 10);
  assert.strictEqual(damageMX3(idle, 500), idle);
  let state = advanceMX3Dialogue(idle);
  for (let i = 0; i < MX3_INTRO.length; i++) {
    assert.equal(state.phase, 'intro');
    assert.equal(state.line, i);
    assert.equal(isMX3Save(state), true);
    assert.strictEqual(damageMX3(state, 500), state);
    state = advanceMX3Dialogue(state);
  }
  assert.equal(state.phase, 'fight');
  assert.equal(damageMX3(state, MX3.reflectedBombDamage).hp, 3000);
});

test('either answer can be selected and saved before the one-time clear', () => {
  for (const choice of [0, 1]) {
    let state = damageMX3({ phase: 'fight', hp: 500, line: 0 }, 500);
    assert.equal(state.phase, 'outro');
    state = advanceMX3Dialogue(advanceMX3Dialogue(state));
    assert.strictEqual(advanceMX3Dialogue(state), state);
    state = advanceMX3Dialogue(state, choice);
    assert.equal(state.line, 2);
    assert.equal(state.choice, choice);
    assert.equal(isMX3Save(JSON.parse(JSON.stringify(state))), true);
    for (let i = 0; i < 4; i++) state = advanceMX3Dialogue(state);
    assert.equal(state.phase, 'cleared');
    assert.equal(isMX3Save(state), true);
    assert.strictEqual(advanceMX3Dialogue(state), state);
  }
  assert.deepEqual(MX3_REWARDS, ['치유의 보석', '금목걸이', '다이아몬드 반지']);
});

test('missiles slow at the warning threshold and only enemy bombs deal 40 to the player', () => {
  assert.equal(mx3MissileSpeed(MX3.missileWarning + .01), MX3.missileSpeed);
  assert.equal(mx3MissileSpeed(MX3.missileWarning), MX3.missileWarningSpeed);
  assert.ok(MX3.missileWarningSpeed < MX3.missileSpeed);
  assert.equal(MX3.bombDamage, 40);
});
