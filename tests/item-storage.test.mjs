import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storageView, STORAGE_SECTIONS } from '../.test-build/ItemStorage.js';
import { LOOT_MATERIALS } from '../.test-build/Submarines.js';

test('보관소는 광석·식물·소재 세 줄이다', () => {
  assert.deepEqual(STORAGE_SECTIONS.map(s => s.title), ['광석', '식물', '소재']);
  const materials = STORAGE_SECTIONS[2].groups.map(g => g.title);
  assert.deepEqual(materials, ['수룡 소재', '헬리코프리온 소재', '진화한 수룡 소재', 'M-X 3 전리품']);
});

test('잠수함 재료로 쓰는 보스 전리품은 모두 소재 칸에 있다', () => {
  const names = STORAGE_SECTIONS[2].groups.flatMap(g => g.items.map(i => i.name));
  for (const loot of LOOT_MATERIALS) assert.ok(names.includes(loot), loot);
});

test('가진 개수를 칸마다 센다', () => {
  const view = storageView({ 루비: 3, '슈퍼 루비': 1 }, { 감자: 2 },
    ['수룡의 비늘', '수룡의 비늘', '헬리코프리온의 살점', '금목걸이', '이상한 조개']);
  const find = (section, name) => view.find(v => v.id === section).groups.flatMap(g => g.items).find(i => i.name === name);
  assert.equal(find('ore', '루비').count, 3);
  assert.equal(find('ore', '슈퍼 루비').count, 1);
  assert.equal(find('ore', '다이아몬드').count, 0);
  assert.equal(find('plant', '감자').count, 2);
  assert.equal(find('plant', '쌀').count, 0);
  assert.equal(find('material', '수룡의 비늘').count, 2);
  assert.equal(find('material', '헬리코프리온의 살점').count, 1);
  assert.equal(find('material', '금목걸이').count, 1);
  const extra = view[2].groups.at(-1);
  assert.equal(extra.title, '기타 소재');
  assert.deepEqual(extra.items.map(i => [i.name, i.count]), [['이상한 조개', 1]]);
});

test('모든 칸에 그림이나 이모지가 있다', () => {
  for (const s of STORAGE_SECTIONS) for (const g of s.groups) for (const i of g.items) assert.ok(i.image || i.emoji, i.name);
});

test('소재 칸 이름은 보스 이름을 뺀다', () => {
  const view = storageView({}, {}, []);
  const labels = view[2].groups[1].items.map(i => i.label);
  assert.deepEqual(labels, ['아래턱', '살점', '비늘', '낡은 고대의 편지']);
  assert.equal(view[2].groups[2].items[3].label, '머리뼈+');
});
