export interface Submarine {
  id: string;
  name: string;
  grade: string;
  color: string;
  trim: string;
  price: number;
  speed: number;
}

export const SUBMARINES: readonly Submarine[] = [
  { id: 'basic', name: '노랑 탐험호', grade: '일반', color: '#fde047', trim: '#f59e0b', price: 0, speed: 1 },
  { id: 'coral', name: '산호 탐사호', grade: '희귀', color: '#2dd4bf', trim: '#0f766e', price: 300, speed: 1.1 },
  { id: 'abyss', name: '심해 수호호', grade: '영웅', color: '#a78bfa', trim: '#6d28d9', price: 900, speed: 1.2 },
  { id: 'gold', name: '황금 수룡호', grade: '전설', color: '#fbbf24', trim: '#ea580c', price: 2400, speed: 1.3 },
];
export interface FleetState { coins: number; owned: string[]; equipped: string }
export const newFleet = (): FleetState => ({ coins: 0, owned: ['basic'], equipped: 'basic' });
export const getSubmarine = (id: string) => SUBMARINES.find(sub => sub.id === id) ?? SUBMARINES[0];
export function isFleetState(value: unknown): value is FleetState {
  if (typeof value !== 'object' || !value) return false;
  const state = value as FleetState;
  return Number.isInteger(state.coins) && state.coins >= 0 && state.coins <= 1e9 &&
    Array.isArray(state.owned) && state.owned.length <= SUBMARINES.length &&
    new Set(state.owned).size === state.owned.length && state.owned.includes('basic') &&
    state.owned.every(id => SUBMARINES.some(sub => sub.id === id)) &&
    typeof state.equipped === 'string' && state.owned.includes(state.equipped);
}
export function buyOrEquip(state: FleetState, id: string): { state: FleetState; error: string | null } {
  const sub = SUBMARINES.find(item => item.id === id);
  if (!sub) return { state, error: '없는 잠수함이에요.' };
  const owned = state.owned.includes(id);
  if (!owned && state.coins < sub.price) return { state, error: `코인이 ${(sub.price - state.coins).toLocaleString()}개 부족해요.` };
  return { state: { coins: state.coins - (owned ? 0 : sub.price), owned: owned ? [...state.owned] : [...state.owned, id], equipped: id }, error: null };
}

/** Shared vector artwork for the in-game vehicle and the equipment card. */
export function submarineImage(sub: Submarine): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="76" viewBox="0 0 128 76">
    <g stroke="#082f49" stroke-width="2.5" stroke-linejoin="round">
      <path fill="${sub.trim}" d="M17 28 4 15 4 55 19 45Z"/>
      <path fill="${sub.trim}" d="M47 25V12H64V7H76V16H58V27Z"/>
      <ellipse fill="${sub.color}" cx="67" cy="39" rx="49" ry="23"/>
      <path fill="${sub.trim}" d="M44 53 39 68H70L80 55Z"/>
      <circle fill="#0ea5e9" cx="91" cy="37" r="13"/>
      <circle fill="#7dd3fc" stroke="none" cx="87" cy="33" r="5"/>
      <path fill="#fff" fill-opacity=".4" stroke="none" d="M35 29Q56 12 82 23L77 28Q55 21 35 35Z"/>
      <path stroke="${sub.trim}" stroke-width="4" d="M31 34H44M29 42H42"/>
      <circle fill="#bae6fd" stroke="none" cx="9" cy="64" r="3"/>
      <circle fill="#7dd3fc" stroke="none" cx="3" cy="72" r="2"/>
    </g></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
