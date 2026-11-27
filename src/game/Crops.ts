/** 수상한 풀 수확: 풀 위치, 수확 횟수, 작물 종류를 정합니다. */

/** 풀 한 포기에서 연속으로 수확할 수 있는 횟수 */
export const GRASS_HARVESTS = 3;
/** 다 수확한 풀이 다시 자라기까지 걸리는 시간(초) */
export const GRASS_REGROW_SECONDS = 60;

/** 수확으로 나오는 작물. 모두 같은 확률로 나옵니다. */
export const CROPS = [
  { name: '쌀', icon: 'crop-rice' },
  { name: '밀', icon: 'crop-wheat' },
  { name: '당근', icon: 'crop-carrot' },
  { name: '양파', icon: 'crop-onion' },
  { name: '대파', icon: 'crop-green-onion' },
  { name: '무', icon: 'crop-radish' },
  { name: '고추', icon: 'crop-chili' },
  { name: '마늘', icon: 'crop-garlic' },
  { name: '감자', icon: 'crop-potato' },
  { name: '설탕', icon: 'crop-sugar' },
] as const;
export type CropName = typeof CROPS[number]['name'];
export const CROP_NAMES = CROPS.map(crop => crop.name) as CropName[];

/** 구역별 풀의 x 위치(화면 비율)와 바닥 높이(px). 초심층·중심층·빙하수 골짜기·지하세계 2층에 3포기씩. */
export const GRASS_LAYOUT: Record<number, { xs: readonly number[]; floor: number }> = {
  0: { xs: [0.2, 0.48, 0.74], floor: 22 },
  1: { xs: [0.48, 0.62, 0.76], floor: 22 },
  4: { xs: [0.22, 0.5, 0.76], floor: 66 },
  5: { xs: [0.36, 0.58, 0.76], floor: 58 },
};
/** 풀 id는 `구역-순번`입니다(예: 4-2). */
export const GRASS_IDS: string[] = Object.entries(GRASS_LAYOUT)
  .flatMap(([zone, layout]) => layout.xs.map((_, index) => `${zone}-${index}`));

export interface GrassState {
  id: string;
  remaining: number;
  regrow: number;
}

export function newGrassStates(): GrassState[] {
  return GRASS_IDS.map(id => ({ id, remaining: GRASS_HARVESTS, regrow: 0 }));
}

/** 0 이상 1 미만의 난수로 작물을 고릅니다. */
export function rollCrop(random = Math.random()): CropName {
  const index = Math.min(CROPS.length - 1, Math.max(0, Math.floor(random * CROPS.length)));
  return CROPS[index].name;
}

/** 한 번 수확합니다. 남은 횟수가 없으면 null을 돌려줍니다. 마지막 수확이면 재성장 시간이 시작됩니다. */
export function harvestGrass(grass: GrassState, random = Math.random()): CropName | null {
  if (grass.remaining <= 0) return null;
  grass.remaining -= 1;
  if (grass.remaining <= 0) grass.regrow = GRASS_REGROW_SECONDS;
  return rollCrop(random);
}

/** 시간을 흘려보냅니다. 이번에 다시 자란 풀이 있으면 true. */
export function tickGrass(grass: GrassState, dt: number): boolean {
  if (grass.remaining > 0 || grass.regrow <= 0) return false;
  grass.regrow = Math.max(0, grass.regrow - dt);
  if (grass.regrow > 0) return false;
  grass.remaining = GRASS_HARVESTS;
  return true;
}

/** 저장된 풀 상태를 검사합니다(없으면 예전 저장이라 허용). */
export function isGrassSave(value: unknown): value is GrassState[] {
  if (!Array.isArray(value) || value.length > GRASS_IDS.length) return false;
  const ids = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'object' || item === null) return false;
    const { id, remaining, regrow } = item as Record<string, unknown>;
    if (typeof id !== 'string' || !GRASS_IDS.includes(id) || ids.has(id)) return false;
    if (typeof remaining !== 'number' || !Number.isInteger(remaining) || remaining < 0 || remaining > GRASS_HARVESTS) return false;
    if (typeof regrow !== 'number' || !Number.isFinite(regrow) || regrow < 0 || regrow > GRASS_REGROW_SECONDS) return false;
    ids.add(id);
  }
  return true;
}

/** 저장된 작물 개수를 검사합니다. */
export function isCropInventory(value: unknown): value is Partial<Record<CropName, number>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.entries(value).every(([name, count]) => (CROP_NAMES as string[]).includes(name) &&
    typeof count === 'number' && Number.isInteger(count) && count >= 0 && count <= 1e9);
}

/** 저장된 풀 상태를 현재 풀 목록에 맞춰 채웁니다. */
export function restoreGrassStates(saved: GrassState[] | undefined): GrassState[] {
  const fresh = newGrassStates();
  for (const grass of fresh) {
    const old = saved?.find(item => item.id === grass.id);
    // 다 캤는데 남은 시간이 0이면 이미 다시 자란 것으로 봅니다.
    if (old && old.remaining <= 0 && old.regrow > 0) Object.assign(grass, { remaining: 0, regrow: old.regrow });
    else if (old && old.remaining > 0) grass.remaining = old.remaining;
  }
  return fresh;
}
