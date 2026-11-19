/** 열수분출공층의 수룡 → 진화한 수룡 보스전 수치와 순수 계산 로직. 화면은 scenes/AbyssDragonBoss.ts. */

export const ABYSS_DRAGON = {
  /** 1단계: 지하세계 수룡과 같은 수치 */
  baseHp: 1250,
  baseAttack: 50,
  /** 2단계: 진화한 수룡 */
  evolvedHp: 4000,
  evolvedAttack: 80,
  telegraph: 1.15,
  baseBreathWidth: 105,
  evolvedBreathWidth: 210,
  /** 꼬리 휘두르기 때 사방으로 날아가는 가시 */
  spikeCount: 16,
  spikeSpeed: 340,
  spikeRadius: 16,
  /** 위에서 아래까지 덮는 긴 브레스. 화면 맨 아래 띠만 안전합니다. */
  curtainWindup: 1.8,
  curtainDuration: 2.6,
  curtainTick: 0.08,
  curtainDamage: 10,
  curtainSafeBand: 0.13,
  /** 이 횟수만큼 다른 공격을 하면 반드시 긴 브레스를 씁니다 */
  curtainMaxGap: 5,
  curtainChance: 0.25,
  openingDelay: 2.5,
  harvestCount: 5,
  respawnSeconds: 5 * 60,
} as const;

export const ABYSS_HARVEST_REWARDS = [
  '수룡의 역광비늘',
  '수룡의 불멸의 꼬리가시',
  '수룡의 퇴화된 날개',
  '수룡의 퇴화된 날개',
  '수룡의 머리뼈+',
] as const;

export type AbyssDragonState = 'sleeping' | 'awake' | 'evolved' | 'dead' | 'respawning';
export type AbyssAttack = 'breath' | 'arm' | 'tail' | 'curtain';

export interface AbyssDragonSave {
  state: AbyssDragonState;
  hp: number;
  harvests: number;
  respawn: number;
}

export function newAbyssDragon(): AbyssDragonSave {
  return { state: 'sleeping', hp: ABYSS_DRAGON.baseHp, harvests: 0, respawn: 0 };
}

export function maxHpFor(state: AbyssDragonState): number {
  return state === 'evolved' || state === 'dead' ? ABYSS_DRAGON.evolvedHp : ABYSS_DRAGON.baseHp;
}

export function attackFor(state: AbyssDragonState): number {
  return state === 'evolved' ? ABYSS_DRAGON.evolvedAttack : ABYSS_DRAGON.baseAttack;
}

const STATES: readonly AbyssDragonState[] = ['sleeping', 'awake', 'evolved', 'dead', 'respawning'];

export function isAbyssDragonSave(value: unknown): value is AbyssDragonSave {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const finite = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  if (typeof v.state !== 'string' || !STATES.includes(v.state as AbyssDragonState)) return false;
  const state = v.state as AbyssDragonState;
  return finite(v.hp, 0, maxHpFor(state)) && Number.isInteger(v.harvests) && finite(v.harvests, 0, ABYSS_DRAGON.harvestCount - 1) &&
    finite(v.respawn, 0, ABYSS_DRAGON.respawnSeconds) && (state === 'respawning') === ((v.respawn as number) > 0);
}

/**
 * 다음 공격을 고릅니다. 1단계는 지하세계 수룡처럼 브레스·팔·꼬리를 연속으로 겹치지 않게 고르고,
 * 진화 뒤에는 가끔(적어도 curtainMaxGap번에 한 번) 긴 브레스를 섞습니다.
 */
export function chooseAbyssAttack(
  evolved: boolean, last: AbyssAttack | undefined, sinceCurtain: number, random: () => number = Math.random,
): AbyssAttack {
  if (evolved && last !== 'curtain' && (sinceCurtain >= ABYSS_DRAGON.curtainMaxGap || random() < ABYSS_DRAGON.curtainChance)) return 'curtain';
  const pool = (['breath', 'arm', 'tail'] as const).filter(attack => attack !== last);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/** 긴 브레스가 닿지 않는 화면 맨 아래 띠의 시작 높이 */
export function curtainSafeY(height: number): number {
  return height * (1 - ABYSS_DRAGON.curtainSafeBand);
}

export function inCurtain(y: number, height: number): boolean {
  return y < curtainSafeY(height);
}

/**
 * 사체를 한 번 갈무리합니다. 다섯 번째 뒤에는 부활 대기를 시작합니다. 갈무리할 수 없으면 null.
 */
export function harvestAbyssDragon(save: AbyssDragonSave): string | null {
  if (save.state !== 'dead' || save.harvests >= ABYSS_DRAGON.harvestCount) return null;
  const reward = ABYSS_HARVEST_REWARDS[save.harvests];
  save.harvests += 1;
  if (save.harvests >= ABYSS_DRAGON.harvestCount) {
    save.state = 'respawning';
    save.respawn = ABYSS_DRAGON.respawnSeconds;
    save.harvests = 0;
    save.hp = 0;
  }
  return reward;
}

/** 부활 대기 시간을 진행시키고, 부활하면 1단계 잠든 수룡으로 되돌립니다. 부활했으면 true. */
export function tickAbyssRespawn(save: AbyssDragonSave, dt: number): boolean {
  if (save.state !== 'respawning') return false;
  save.respawn = Math.max(0, save.respawn - dt);
  if (save.respawn > 0) return false;
  Object.assign(save, newAbyssDragon());
  return true;
}
