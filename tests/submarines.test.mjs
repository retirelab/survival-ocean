import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SUBMARINES, newFleet, isFleetState, buyOrEquip, submarineImage } from '../.test-build/Submarines.js';

test('new players always own and equip the free common submarine', () => {
  const a = newFleet(); const b = newFleet();
  assert.deepEqual(a, { coins: 0, owned: ['basic'], equipped: 'basic' });
  a.owned.push('coral'); assert.deepEqual(b.owned, ['basic']);
  assert.equal(SUBMARINES[0].grade, '일반');
});
test('buying deducts the price once and automatically equips the vehicle', () => {
  const original = { ...newFleet(), coins: 1200 };
  const purchase = buyOrEquip(original, 'coral');
  assert.equal(purchase.error, null);
  assert.equal(purchase.state.coins, 900);
  assert.equal(purchase.state.equipped, 'coral');
  assert.deepEqual(original, { ...newFleet(), coins: 1200 });
  const basic = buyOrEquip(purchase.state, 'basic');
  const again = buyOrEquip(basic.state, 'coral');
  assert.equal(again.state.coins, 900);
  assert.deepEqual(again.state.owned, ['basic', 'coral']);
});
test('insufficient funds and unknown vehicles never change the fleet', () => {
  const state = newFleet();
  for (const id of ['coral', 'abyss', 'gold', 'unknown']) {
    const result = buyOrEquip(state, id);
    assert.ok(result.error); assert.strictEqual(result.state, state);
  }
});
test('save validation rejects negative currency and unowned equipment', () => {
  for (const bad of [
    { ...newFleet(), coins: -1 }, { ...newFleet(), coins: 1.5 },
    { ...newFleet(), equipped: 'gold' }, { ...newFleet(), owned: ['basic', 'unknown'] },
    { ...newFleet(), owned: ['basic', 'basic'] }, { ...newFleet(), owned: [] },
  ]) assert.equal(isFleetState(bad), false);
  assert.equal(isFleetState(buyOrEquip({ ...newFleet(), coins: 300 }, 'coral').state), true);
});
test('every catalog vehicle has self-contained vector artwork', () => {
  for (const sub of SUBMARINES) {
    const image = submarineImage(sub);
    assert.match(image, /^data:image\/svg\+xml;base64,/);
    const svg = Buffer.from(image.split(',')[1], 'base64').toString();
    assert.match(svg, /viewBox="0 0 128 76"/);
    assert.ok(svg.includes(sub.color));
  }
});
