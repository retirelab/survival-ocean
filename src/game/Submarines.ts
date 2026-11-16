export const MATERIALS = ['부싯돌', '루비', '사파이어', '토파즈', '다이아몬드', '수룡의 머리뼈', '수룡의 비늘'] as const;
export type Material = typeof MATERIALS[number];
export type Resources = Record<Material, number>;
export interface Submarine {
  id: string; name: string; grade: number; color: string; trim: string;
  recipe: Partial<Resources>; description: string; speed: number;
}
export const SUBMARINES: readonly Submarine[] = [
  { id: 'basic', name: '일반 잠수함', grade: 5, color: '#fde047', trim: '#f59e0b', recipe: {}, description: '노란 선체와 파란 창의 기본 탐험 잠수함', speed: 1 },
  { id: 'sturdy', name: '튼튼한 검정 잠수함', grade: 4, color: '#94a3b8', trim: '#334155', recipe: { 부싯돌: 10 }, description: '검은 부싯돌 장갑과 두꺼운 철판', speed: 1 },
  { id: 'fire', name: '불속성 잠수함', grade: 3, color: '#fb7185', trim: '#be123c', recipe: { 루비: 5, 부싯돌: 10 }, description: '붉은 루비 코어와 타오르는 불꽃 장식', speed: 1 },
  { id: 'ice', name: '얼음속성 잠수함', grade: 3, color: '#60a5fa', trim: '#1d4ed8', recipe: { 사파이어: 5, 부싯돌: 10 }, description: '푸른 사파이어 선체와 뾰족한 얼음 결정', speed: 1 },
  { id: 'electric', name: '전기속성 잠수함', grade: 3, color: '#fbbf24', trim: '#b45309', recipe: { 토파즈: 6, 부싯돌: 10 }, description: '주황빛 토파즈 코어와 번개·코일 장식', speed: 1 },
  { id: 'metal', name: '메탈 잠수함', grade: 2, color: '#a5f3fc', trim: '#0891b2', recipe: { 다이아몬드: 7 }, description: '은빛 금속 장갑과 청록색 다이아몬드', speed: 1 },
  { id: 'baby_dragon', name: '아기 드래곤 잠수함', grade: 1, color: '#22d3ee', trim: '#0369a1', recipe: { '수룡의 머리뼈': 1, '수룡의 비늘': 2 }, description: '수룡의 뿔·비늘·꼬리를 품은 아기 드래곤', speed: 1 },
];
export interface FleetState { owned: string[]; equipped: string }
export const newFleet = (): FleetState => ({ owned: ['basic'], equipped: 'basic' });
export const getSubmarine = (id: string) => SUBMARINES.find(sub => sub.id === id) ?? SUBMARINES[0];
export const emptyResources = (): Resources => Object.fromEntries(MATERIALS.map(name => [name, 0])) as Resources;
export function inventoryResources(minerals: Record<string, number>, loot: string[]): Resources {
  const resources = emptyResources();
  for (const name of MATERIALS) resources[name] = name.startsWith('수룡') ? loot.filter(item => item === name).length : minerals[name] ?? 0;
  return resources;
}
const LEGACY_IDS: Record<string, string> = { coral: 'sturdy', abyss: 'ice', gold: 'metal' };
/** Preserve prior ownership when loading the earlier four-vehicle shop. */
export function normalizeFleet(value: unknown): FleetState | null {
  if (typeof value !== 'object' || !value) return null;
  const state = value as Record<string, unknown>;
  if (!Array.isArray(state.owned) || state.owned.length > SUBMARINES.length || !state.owned.includes('basic') ||
      new Set(state.owned).size !== state.owned.length || typeof state.equipped !== 'string' || !state.owned.includes(state.equipped)) return null;
  const mapId = (id: unknown): string | undefined => typeof id === 'string'
    ? SUBMARINES.find(sub => sub.id === id)?.id ?? Object.entries(LEGACY_IDS).find(([key]) => key === id)?.[1] : undefined;
  const owned = state.owned.map(mapId);
  if (owned.some(id => !id)) return null;
  return { owned: [...new Set(owned as string[])], equipped: mapId(state.equipped)! };
}
export function isFleetState(value: unknown): value is FleetState {
  const normalized = normalizeFleet(value);
  if (!normalized) return false;
  const state = value as FleetState;
  return state.owned.every(id => SUBMARINES.some(sub => sub.id === id));
}
export function missingMaterials(sub: Submarine, resources: Resources): string[] {
  return (Object.entries(sub.recipe) as Array<[Material, number]>)
    .filter(([name, count]) => resources[name] < count)
    .map(([name, count]) => `${name} ${count - resources[name]}개`);
}
export function craftOrEquip(state: FleetState, resources: Resources, id: string): { state: FleetState; resources: Resources; error: string | null } {
  if (MATERIALS.some(name => !Number.isInteger(resources[name]) || resources[name] < 0)) return { state, resources, error: '재료 수량을 확인할 수 없어요.' };
  const sub = SUBMARINES.find(item => item.id === id);
  if (!sub) return { state, resources, error: '없는 잠수함이에요.' };
  const owned = state.owned.includes(id);
  if (!owned) {
    const missing = missingMaterials(sub, resources);
    if (missing.length) return { state, resources, error: `재료가 부족해요: ${missing.join(', ')}` };
  }
  const remaining = { ...resources };
  if (!owned) for (const [name, count] of Object.entries(sub.recipe) as Array<[Material, number]>) remaining[name] -= count;
  return { state: { owned: owned ? [...state.owned] : [...state.owned, id], equipped: id }, resources: remaining, error: null };
}

/** Each material changes the silhouette, fittings and surface of the craft. */
export function submarineImage(sub: Submarine): string {
  const commonHull = `<path fill="${sub.trim}" d="M22 29 8 15 8 58 24 45Z"/>
    <path fill="${sub.trim}" d="M48 25V12H64V7H76V16H59V27Z"/>
    <ellipse fill="${sub.id === 'sturdy' ? '#27272a' : sub.color}" cx="68" cy="41" rx="46" ry="21"/>
    <path fill="${sub.trim}" d="M46 54 39 67H73L82 56Z"/>`;
  const window = `<circle fill="#082f49" cx="91" cy="39" r="13"/><circle fill="#38bdf8" cx="91" cy="39" r="9"/>
    <circle fill="#e0f2fe" stroke="none" cx="88" cy="36" r="3"/>`;
  const variants: Record<string, string> = {
    basic: `${commonHull}${window}<path stroke="#f59e0b" stroke-width="4" d="M34 36H46M32 44H44"/>`,
    sturdy: `${commonHull}<path fill="#3f3f46" stroke="#94a3b8" d="M35 24 56 22 60 40 48 57 31 50Z M61 22 78 24 81 56 60 60Z"/>
      <path stroke="#a1a1aa" d="M37 31 48 27M35 46 43 50M65 30 73 33"/>
      <g fill="#cbd5e1"><circle cx="34" cy="31" r="2"/><circle cx="49" cy="51" r="2"/><circle cx="68" cy="26" r="2"/><circle cx="68" cy="53" r="2"/></g>${window}`,
    fire: `<path fill="#ef4444" stroke="#7f1d1d" d="M27 37Q-1 30 5 12L19 23 21 6 37 32Z"/>
      ${commonHull}<path fill="#f97316" stroke="#fbbf24" d="M43 26 48 9 57 20 62 4 71 25Z"/>
      <path fill="#be123c" stroke="#fda4af" d="M49 29 63 25 73 37 62 50 48 43Z"/>
      <path fill="#fb7185" stroke="none" d="M49 29 62 35 73 37 63 25Z"/>${window}`,
    ice: `${commonHull}<path fill="#bae6fd" stroke="#60a5fa" d="M33 25 38 7 48 24 60 2 67 23 79 9 84 26Z"/>
      <path fill="#dbeafe" stroke="#38bdf8" d="M50 49 45 71 61 59 74 72 77 52Z"/>
      <path stroke="#eff6ff" stroke-width="2" d="M54 30V46M47 34 61 42M47 42 61 34"/>${window}`,
    electric: `${commonHull}<path fill="#f59e0b" stroke="#fef3c7" d="M56 21 72 19 63 34 75 32 54 54 59 39 49 41Z"/>
      <path stroke="#92400e" stroke-width="4" d="M29 29V52M36 27V55M43 27V55"/>
      <path fill="none" stroke="#fef08a" stroke-width="2" d="M17 11 25 7 22 17 30 13 M93 10 102 6 99 17 109 12"/>${window}`,
    metal: `<path fill="#94a3b8" d="M22 29 5 19 5 56 24 46Z"/>
      <path fill="#e2e8f0" stroke="#475569" d="M24 30 48 19 88 19 115 32 119 44 101 58 44 61 23 48Z"/>
      <path fill="#94a3b8" stroke="#64748b" d="M44 24 65 23 57 56 39 53Z M69 23 86 23 80 56 61 56Z"/>
      <path fill="#a5f3fc" stroke="#06b6d4" d="M54 29 65 27 72 36 61 48 50 38Z"/>
      <path stroke="#ecfeff" d="M54 29 61 36 65 27M50 38 61 36 72 36M61 36V48"/>
      <path fill="#cbd5e1" d="M49 59 44 69H80L87 56Z"/>${window}`,
    baby_dragon: `<path fill="#0369a1" stroke="#0c4a6e" d="M42 40Q10 54 7 24L22 34 15 16 37 30Z"/>
      <path fill="#38bdf8" stroke="#075985" d="M37 34 32 9 51 20 65 6 69 33Z"/>
      <ellipse fill="#0891b2" cx="64" cy="44" rx="35" ry="20"/>
      <path fill="#bae6fd" stroke="#0284c7" d="M52 48Q63 42 77 48L77 61Q63 68 52 59Z"/>
      <path fill="#22d3ee" stroke="#075985" d="M72 29Q82 14 103 23L118 38 114 50 93 54 80 47Z"/>
      <path fill="#fef3c7" stroke="#a8a29e" d="M82 25 78 7 91 23 M98 24 104 10 107 30"/>
      <path fill="#0284c7" d="M38 55 34 65H52L56 57 M76 56 80 66H96L91 53Z"/>
      <circle fill="#082f49" cx="100" cy="35" r="7"/><circle fill="#7dd3fc" cx="100" cy="35" r="4"/>
      <circle fill="#fff" stroke="none" cx="101" cy="33" r="1.5"/>
      <path fill="#e0f2fe" d="M113 44 109 50 105 45Z"/>
      <path fill="none" stroke="#67e8f9" stroke-width="2" d="m38 37 5 5 5-5m0 9 5 5 5-5m-2-12 5 5 5-5m-2 10 5 5 5-5"/>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="76" viewBox="0 0 128 76"><g stroke="#082f49" stroke-width="2.2" stroke-linejoin="round">${variants[sub.id] ?? variants.basic}<circle fill="#7dd3fc" stroke="none" cx="10" cy="65" r="2.5"/><circle fill="#bae6fd" stroke="none" cx="3" cy="71" r="1.5"/></g></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
