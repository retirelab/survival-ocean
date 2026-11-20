import { submarineDataUrl } from './SubmarineArt.js';
/** 광석바위에서 캐는 기본 광물 */
export const BASE_MINERALS = ['다이아몬드', '루비', '사파이어', '토파즈', '부싯돌'] as const;
/** 빙하수 골짜기에 한 번이라도 가면 광석바위에서 아주 낮은 확률로 나오는 희귀 광물 */
export const RARE_MINERALS = ['그라시스메탈', '레인보우크리스탈', '슈퍼 루비', '슈퍼 사파이어', '슈퍼 토파즈'] as const;
export const ALL_MINERALS = [...BASE_MINERALS, ...RARE_MINERALS] as const;
export type MineralName = typeof ALL_MINERALS[number];
/** 보스 갈무리로 얻어 전리품 목록에 쌓이는 재료 */
export const LOOT_MATERIALS = [
  '수룡의 머리뼈', '수룡의 비늘', '헬리코프리온의 아래턱', '헬리코프리온의 비늘',
  '수룡의 역광비늘', '수룡의 불멸의 꼬리가시', '수룡의 퇴화된 날개', '수룡의 머리뼈+',
] as const;
export const MATERIALS = ['부싯돌', '루비', '사파이어', '토파즈', '다이아몬드', ...RARE_MINERALS, ...LOOT_MATERIALS] as const;
export type Material = typeof MATERIALS[number];
export type Resources = Record<Material, number>;
export interface Submarine {
  id: string; name: string;
  /** 1~5등급. 0이면 등급이 없는 특별 잠수함 */
  grade: number; color: string; trim: string;
  recipe: Partial<Resources>; description: string; ability: string; speed: number;
  /** 공격력·방어력 배율(강화 배율에 곱함) */
  attack: number; defense: number;
  /** 빙하수 골짜기에 처음 들어간 뒤 상점에 나타남 */
  glacial?: boolean;
}
export const SUBMARINES: readonly Submarine[] = [
  { id: 'basic', name: '일반 잠수함', grade: 5, color: '#fde047', trim: '#f59e0b', recipe: {}, description: '리벳과 잠망경, 돌아가는 프로펠러를 단 노란 기본 탐험 잠수함', ability: '특수 능력 없음', speed: 1, attack: 1, defense: 1 },
  { id: 'sturdy', name: '튼튼한 검정 잠수함', grade: 4, color: '#94a3b8', trim: '#334155', recipe: { 부싯돌: 10 }, description: '깨뜨린 부싯돌 조각을 이어 붙인 각진 선체와 리벳 철띠, 앞쪽 충각', ability: '물고기 피격 즉시 5초간 방어 2배', speed: 1, attack: 1, defense: 1 },
  { id: 'fire', name: '불속성 잠수함', grade: 3, color: '#fb7185', trim: '#be123c', recipe: { 루비: 5, 부싯돌: 10 }, description: '이글거리는 루비 코어와 불꽃 볏, 꼬리에서 뿜는 화염', ability: '불덩이 명중 시 5초간 매초 화상 2피해', speed: 1, attack: 1, defense: 1 },
  { id: 'ice', name: '얼음속성 잠수함', grade: 3, color: '#60a5fa', trim: '#1d4ed8', recipe: { 사파이어: 5, 부싯돌: 10 }, description: '사파이어 결정 면과 얼음 가시, 고드름이 달린 투명한 선체', ability: '고드름 명중 시 3초간 이동 속도 50% 감소', speed: 1, attack: 1, defense: 1 },
  { id: 'electric', name: '전기속성 잠수함', grade: 3, color: '#fbbf24', trim: '#b45309', recipe: { 토파즈: 6, 부싯돌: 10 }, description: '번개 치는 토파즈 코어와 테슬라 코일, 경고 줄무늬', ability: 'B / 전기일격: 주변 물고기 5초 마비 · 재사용 30초', speed: 1, attack: 1, defense: 1 },
  { id: 'metal', name: '메탈 잠수함', grade: 2, color: '#a5f3fc', trim: '#0891b2', recipe: { 다이아몬드: 7 }, description: '거울 같은 은빛 선체에 박힌 브릴리언트 컷 다이아몬드와 무지갯빛 반짝임', ability: '기본 방어 4배 · 끊어서 쏘는 노란 관통 레이저', speed: 1, attack: 1, defense: 4 },
  { id: 'baby_dragon', name: '아기 드래곤 잠수함', grade: 1, color: '#22d3ee', trim: '#0369a1', recipe: { '수룡의 머리뼈': 1, '수룡의 비늘': 2 }, description: '수룡의 뿔·비늘·꼬리를 품은 아기 드래곤', ability: '스페이스바 / 발사를 누르는 동안 긴 푸른 브레스', speed: 1, attack: 1, defense: 1 },
  { id: 'hi_metal', name: '하이메탈 잠수함', grade: 0, color: '#86efac', trim: '#15803d', glacial: true, recipe: { 그라시스메탈: 2, 다이아몬드: 5 }, description: '그라시스메탈로 덧댄 얼음빛 장갑과 초록 레이저 포신', ability: '방어 10배 · 공격 5배 · 끊어서 쏘는 초록 관통 레이저', speed: 1, attack: 5, defense: 10 },
  { id: 'rainbow', name: '무지개빛 잠수함', grade: 0, color: '#f0abfc', trim: '#7c3aed', glacial: true, recipe: { 레인보우크리스탈: 2, 루비: 1, 사파이어: 1, 토파즈: 1 }, description: '레인보우크리스탈이 일곱 빛깔로 빛나는 프리즘 선체', ability: '방어 5배 · 공격 10배 · 무지개빛 총알 · 10초마다 체력 15 회복', speed: 1, attack: 10, defense: 5 },
  { id: 'mega_volcano', name: '메가 볼케이노 잠수함', grade: 0, color: '#f97316', trim: '#7f1d1d', glacial: true, recipe: { '슈퍼 루비': 2, 루비: 4 }, description: '슈퍼 루비 용암 코어와 화산 분화구 포신', ability: '방어 5배 · 공격 5배 · 누르는 동안 화염방사 · 화상 매초 8피해', speed: 1, attack: 5, defense: 5 },
  { id: 'mega_blizzard', name: '메가 블리자드 잠수함', grade: 0, color: '#bae6fd', trim: '#1e3a8a', glacial: true, recipe: { '슈퍼 사파이어': 2, 사파이어: 4 }, description: '슈퍼 사파이어 빙결 엔진과 칼날 같은 얼음 지느러미', ability: '방어 5배 · 공격 5배 · 날카로운 얼음칼날 · 맞힐수록 물고기가 점점 느려짐', speed: 1, attack: 5, defense: 5 },
  { id: 'mega_voltage', name: '메가 볼티지 잠수함', grade: 0, color: '#fde047', trim: '#1d4ed8', glacial: true, recipe: { '슈퍼 토파즈': 2, 토파즈: 4 }, description: '슈퍼 토파즈 축전기와 푸른 전자기 고리', ability: '방어 5배 · 공격 5배 · 전기일격 범위 증가 · 길게 눌러 3단계 차지(전기총알→고리 전기총알→볼티지 캐논)', speed: 1, attack: 5, defense: 5 },
  { id: 'sword_crusher', name: '소드 크러셔 잠수함', grade: 0, color: '#cbd5e1', trim: '#0f766e', glacial: true, recipe: { '헬리코프리온의 아래턱': 1, '헬리코프리온의 비늘': 1, 다이아몬드: 4, 그라시스메탈: 1 }, description: '헬리코프리온의 톱날 아래턱을 단 돌격 잠수함', ability: '방어 3배 · 공격 15배 · 총알 대신 대시로 앞쪽 전기톱을 들이박음 · 길게 누르면 점점 빨라짐', speed: 1, attack: 15, defense: 3 },
  { id: 'master_dragon', name: '마스터 드래곤 잠수함', grade: 0, color: '#fb923c', trim: '#0f766e', glacial: true, recipe: { '수룡의 역광비늘': 1, '수룡의 불멸의 꼬리가시': 1, '수룡의 퇴화된 날개': 2, '수룡의 머리뼈+': 1 }, description: '진화한 수룡의 역광비늘과 꼬리가시로 만든 용 잠수함', ability: '방어 15배 · 공격 15배 · 길게 누르면 매우 긴 하이퍼 브레스', speed: 1, attack: 15, defense: 15 },
];
export const gradeLabel = (sub: Submarine) => sub.grade > 0 ? `${sub.grade}등급` : '특별 잠수함';
/** 빙하수 골짜기에 가 보기 전에는 특별 잠수함을 상점에 보이지 않습니다. */
export const shopSubmarines = (glacialVisited: boolean) => SUBMARINES.filter(sub => !sub.glacial || glacialVisited);
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
  const lootNames = new Set<string>(LOOT_MATERIALS);
  for (const name of MATERIALS) resources[name] = lootNames.has(name) ? loot.filter(item => item === name).length : minerals[name] ?? 0;
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
