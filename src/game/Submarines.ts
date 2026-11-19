import { submarineDataUrl } from './SubmarineArt.js';
export const MATERIALS = ['부싯돌', '루비', '사파이어', '토파즈', '다이아몬드', '수룡의 머리뼈', '수룡의 비늘'] as const;
export type Material = typeof MATERIALS[number];
export type Resources = Record<Material, number>;
export interface Submarine {
  id: string; name: string; grade: number; color: string; trim: string;
  recipe: Partial<Resources>; description: string; ability: string; speed: number;
}
export const SUBMARINES: readonly Submarine[] = [
  { id: 'basic', name: '일반 잠수함', grade: 5, color: '#fde047', trim: '#f59e0b', recipe: {}, description: '리벳과 잠망경, 돌아가는 프로펠러를 단 노란 기본 탐험 잠수함', ability: '특수 능력 없음', speed: 1 },
  { id: 'sturdy', name: '튼튼한 검정 잠수함', grade: 4, color: '#94a3b8', trim: '#334155', recipe: { 부싯돌: 10 }, description: '깨뜨린 부싯돌 조각을 이어 붙인 각진 선체와 리벳 철띠, 앞쪽 충각', ability: '물고기 피격 즉시 5초간 방어 2배', speed: 1 },
  { id: 'fire', name: '불속성 잠수함', grade: 3, color: '#fb7185', trim: '#be123c', recipe: { 루비: 5, 부싯돌: 10 }, description: '이글거리는 루비 코어와 불꽃 볏, 꼬리에서 뿜는 화염', ability: '불덩이 명중 시 5초간 매초 화상 2피해', speed: 1 },
  { id: 'ice', name: '얼음속성 잠수함', grade: 3, color: '#60a5fa', trim: '#1d4ed8', recipe: { 사파이어: 5, 부싯돌: 10 }, description: '사파이어 결정 면과 얼음 가시, 고드름이 달린 투명한 선체', ability: '고드름 명중 시 3초간 이동 속도 50% 감소', speed: 1 },
  { id: 'electric', name: '전기속성 잠수함', grade: 3, color: '#fbbf24', trim: '#b45309', recipe: { 토파즈: 6, 부싯돌: 10 }, description: '번개 치는 토파즈 코어와 테슬라 코일, 경고 줄무늬', ability: 'B / 전기일격: 주변 물고기 5초 마비 · 재사용 30초', speed: 1 },
  { id: 'metal', name: '메탈 잠수함', grade: 2, color: '#a5f3fc', trim: '#0891b2', recipe: { 다이아몬드: 7 }, description: '거울 같은 은빛 선체에 박힌 브릴리언트 컷 다이아몬드와 무지갯빛 반짝임', ability: '기본 방어 4배 · 끊어서 쏘는 노란 관통 레이저', speed: 1 },
  { id: 'baby_dragon', name: '아기 드래곤 잠수함', grade: 1, color: '#22d3ee', trim: '#0369a1', recipe: { '수룡의 머리뼈': 1, '수룡의 비늘': 2 }, description: '반짝이는 큰 눈과 볼터치, 작은 뿔과 파닥이는 날개를 가진 동글동글 아기 드래곤', ability: '스페이스바 / 발사를 누르는 동안 긴 푸른 브레스', speed: 1 },
];
const REPAIR_DURATION_MS = 5 * 60 * 1000;
export interface FleetState { owned: string[]; equipped: string; repairUntil?: Record<string, number> }

export function repairSeconds(state: FleetState, id: string, now = Date.now()): number {
  return Math.max(0, Math.ceil(((state.repairUntil?.[id] ?? now) - now) / 1000));
}

export function damageEquippedSubmarine(state: FleetState, now = Date.now()): FleetState {
  if (state.equipped === 'basic') return state;
  const repairs = Object.entries(state.repairUntil ?? {}).filter(([, until]) => until > now);
  return {
    ...state,
    equipped: 'basic',
    repairUntil: { ...Object.fromEntries(repairs), [state.equipped]: now + REPAIR_DURATION_MS },
  };
}
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
  const fleet: FleetState = { owned: [...new Set(owned as string[])], equipped: mapId(state.equipped)! };
  if (state.repairUntil === undefined) return fleet;
  if (!state.repairUntil || typeof state.repairUntil !== 'object' || Array.isArray(state.repairUntil)) return null;
  const repairs: Record<string, number> = {};
  for (const [id, until] of Object.entries(state.repairUntil)) {
    if (id === 'basic' || id === fleet.equipped || !fleet.owned.includes(id) ||
        typeof until !== 'number' || !Number.isSafeInteger(until) || until < 0) return null;
    repairs[id] = until;
  }
  return { ...fleet, repairUntil: repairs };
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
export function craftOrEquip(state: FleetState, resources: Resources, id: string, now = Date.now()): { state: FleetState; resources: Resources; error: string | null } {
  if (MATERIALS.some(name => !Number.isInteger(resources[name]) || resources[name] < 0)) return { state, resources, error: '재료 수량을 확인할 수 없어요.' };
  const sub = SUBMARINES.find(item => item.id === id);
  if (!sub) return { state, resources, error: '없는 잠수함이에요.' };
  const seconds = repairSeconds(state, id, now);
  if (seconds > 0) return { state, resources, error: `수리 중이에요. ${seconds}초 뒤에 탑승할 수 있어요.` };
  const owned = state.owned.includes(id);
  if (!owned) {
    const missing = missingMaterials(sub, resources);
    if (missing.length) return { state, resources, error: `재료가 부족해요: ${missing.join(', ')}` };
  }
  const remaining = { ...resources };
  if (!owned) for (const [name, count] of Object.entries(sub.recipe) as Array<[Material, number]>) remaining[name] -= count;
  const next: FleetState = { owned: owned ? [...state.owned] : [...state.owned, id], equipped: id };
  const repairs = Object.entries(state.repairUntil ?? {}).filter(([, until]) => until > now);
  if (repairs.length) next.repairUntil = Object.fromEntries(repairs);
  return { state: next, resources: remaining, error: null };
}

/** 재료와 능력에 맞춘 잠수함 그림. 세부 디자인은 SubmarineArt.ts에 있습니다. */
export function submarineImage(sub: Submarine): string {
  return submarineDataUrl(sub.id);
}
