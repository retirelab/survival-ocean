import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SUBMARINES, MATERIALS, newFleet, isFleetState, normalizeFleet, craftOrEquip, emptyResources, inventoryResources, submarineImage } from '../.test-build/Submarines.js';

const recipes = [
  ['basic', 5, {}], ['sturdy', 4, { 부싯돌: 10 }], ['fire', 3, { 루비: 5, 부싯돌: 10 }],
  ['ice', 3, { 사파이어: 5, 부싯돌: 10 }], ['electric', 3, { 토파즈: 6, 부싯돌: 10 }],
  ['metal', 2, { 다이아몬드: 7 }], ['baby_dragon', 1, { '수룡의 머리뼈': 1, '수룡의 비늘': 2 }],
  ['hi_metal', 0, { 그라시스메탈: 2, 다이아몬드: 5 }],
  ['rainbow', 0, { 레인보우크리스탈: 2, 루비: 1, 사파이어: 1, 토파즈: 1 }],
  ['mega_volcano', 0, { '슈퍼 루비': 2, 루비: 4 }],
  ['mega_blizzard', 0, { '슈퍼 사파이어': 2, 사파이어: 4 }],
  ['mega_voltage', 0, { '슈퍼 토파즈': 2, 토파즈: 4 }],
  ['sword_crusher', 0, { '헬리코프리온의 아래턱': 1, '헬리코프리온의 비늘': 1, 다이아몬드: 4, 그라시스메탈: 1 }],
  ['master_dragon', 0, { '수룡의 역광비늘': 1, '수룡의 불멸의 꼬리가시': 1, '수룡의 퇴화된 날개': 2, '수룡의 머리뼈+': 1 }],
];
test('all fourteen vehicles have the specified grades and recipes', () => {
  assert.deepEqual(SUBMARINES.map(sub => [sub.id, sub.grade, sub.recipe]), recipes);
  assert.deepEqual(newFleet(), { owned: ['basic'], equipped: 'basic' });
});
for (const [id, , recipe] of recipes.slice(1)) {
  test(`${id}: exact materials craft once; one missing material cannot be spent`, () => {
    const available = { ...emptyResources(), ...recipe };
    const original = newFleet();
    const result = craftOrEquip(original, available, id);
    assert.equal(result.error, null);
    assert.deepEqual(result.resources, emptyResources());
    assert.equal(result.state.equipped, id);
    assert.deepEqual(original, newFleet());
    assert.deepEqual(available, { ...emptyResources(), ...recipe });
    for (const material of Object.keys(recipe)) {
      const insufficient = { ...available, [material]: recipe[material] - 1 };
      const failed = craftOrEquip(original, insufficient, id);
      assert.ok(failed.error);
      assert.strictEqual(failed.state, original);
      assert.strictEqual(failed.resources, insufficient);
    }
    const basic = craftOrEquip(result.state, result.resources, 'basic');
    const again = craftOrEquip(basic.state, basic.resources, id);
    assert.equal(again.error, null);
    assert.deepEqual(again.resources, emptyResources());
    assert.deepEqual(again.state.owned, ['basic', id]);
  });
}
test('crafting leaves unrelated and surplus materials untouched', () => {
  const resources = Object.fromEntries(MATERIALS.map(name => [name, 20]));
  const result = craftOrEquip(newFleet(), resources, 'baby_dragon');
  assert.equal(result.resources['수룡의 머리뼈'], 19);
  assert.equal(result.resources['수룡의 비늘'], 18);
  assert.equal(result.resources['다이아몬드'], 20);
  assert.equal(result.resources['부싯돌'], 20);
});
test('inventory uses the same mineral counts and dragon loot as gameplay', () => {
  const resources = inventoryResources({ 부싯돌: 10, 루비: 5 }, ['수룡의 비늘', '수룡의 머리뼈', '수룡의 비늘']);
  assert.equal(resources['부싯돌'], 10); assert.equal(resources['루비'], 5);
  assert.equal(resources['수룡의 머리뼈'], 1); assert.equal(resources['수룡의 비늘'], 2);
  assert.equal(craftOrEquip(newFleet(), resources, 'baby_dragon').error, null);
});
test('unknown fleet IDs, unowned equipment and invalid resource quantities are rejected', () => {
  for (const bad of [
    { ...newFleet(), equipped: 'baby_dragon' }, { ...newFleet(), owned: ['basic', 'unknown'] },
    { ...newFleet(), owned: ['basic', '__proto__'] }, { ...newFleet(), owned: ['basic', 'basic'] },
  ]) assert.equal(normalizeFleet(bad), null);
  assert.equal(isFleetState(newFleet()), true);
  for (const count of [-1, NaN, 2.5]) assert.ok(craftOrEquip(newFleet(), { ...emptyResources(), 부싯돌: count }, 'sturdy').error);
});
test('every vehicle has distinct self-contained vector artwork', () => {
  const drawings = SUBMARINES.map(submarineImage);
  assert.equal(new Set(drawings).size, SUBMARINES.length);
  for (const image of drawings) {
    assert.match(image, /^data:image\/svg\+xml;base64,/);
    assert.match(Buffer.from(image.split(',')[1], 'base64').toString(), /viewBox="0 0 128 76"/);
  }
});
