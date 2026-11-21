/** 헬리코프리온 보스전의 수치와 순수 계산 로직. 화면 표시는 scenes/HelicoprionBoss.ts가 담당합니다. */

export const HELICOPRION = {
  maxHp: 6000,
  escapePresses: 8,
  devourSeconds: 3.4,
  swordStunSeconds: 2.25,
  comboTick: 0.32,
  devourTickDamage: 12,
  swordTickDamage: 15,
  swordFinalDamage: 65,
  swordSpeed: 2600,
  swordWaitMin: 0.35,
  swordWaitMax: 2.15,
  spinWindup: 0.22,
  spinSeconds: 0.40,
  comboRecovery: 0.16,
  attack: 30,
  bombDamage: 500,
  /** 이 거리(px)보다 멀면 돌진, 가까우면 아래턱 휘두르기 */
  nearDistance: 230,
  chargeWindup: 0.85,
  chargeSpeed: 1350,
  chargeRecover: 1.3,
  jawWindup: 0.65,
  jawRecover: 1.1,
  jawRadius: 105,
  /** 폭탄에 맞으면 잠깐 휘청거립니다 */
  stunSeconds: 1.6,
  idleSpeed: 95,
  idleKeepDistance: 150,
  bombRespawnSeconds: 20,
  respawnSeconds: 5 * 60,
  harvestCount: 5,
  harvestRange: 150,
  /** 전투 시작·이어하기 직후 첫 공격까지 최소 대기 */
  openingDelay: 2.5,
} as const;

/** 둥지 언덕 위 폭탄 위치(화면 비율)와 기울기. 그림의 B 폭탄 4개 위치를 따릅니다. */
export const BOMB_SPOTS = [
  { x: 0.215, y: 0.8, angle: -6 },
  { x: 0.44, y: 0.81, angle: -35 },
  { x: 0.645, y: 0.64, angle: 0 },
  { x: 0.935, y: 0.645, angle: -12 },
] as const;

/** 둥지 바닥 언덕 윤곽(화면 비율). 그림의 주황색 언덕 모양을 따릅니다. */
export const NEST_HILLS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.88], [0.13, 0.78], [0.2, 0.85], [0.36, 0.72], [0.43, 0.86], [0.48, 0.85],
  [0.56, 0.75], [0.68, 0.68], [0.79, 0.87], [0.84, 0.82], [0.92, 0.71], [1, 0.7],
];

/** 노란 출입구(왼쪽 위 모서리) 영역. 지하세계 2층으로 돌아갑니다. */
export const NEST_ENTRANCE = { width: 0.17, height: 0.3 } as const;

/** 갈무리 보상(순서대로 한 번에 하나씩, 총 5회) */
export const HELICOPRION_HARVEST_REWARDS = [
  '헬리코프리온의 아래턱',
  '헬리코프리온의 살점',
  '헬리코프리온의 살점',
  '헬리코프리온의 비늘',
  '낡은 고대의 편지',
] as const;

export type HelicoprionAttack = 'charge' | 'jaw';
export const HELICOPRION_PATTERNS = [
  ['charge', 'waves'],
  ['normal'],
  ['devour', 'spin'],
  ['sword', 'charge', 'waves', 'spin'],
] as const;
export type HelicoprionMove = typeof HELICOPRION_PATTERNS[number][number];

export function randomSwordAmbush(random = Math.random) {
  return {
    angle: Math.floor(random() * 8) * Math.PI / 4,
    delay: HELICOPRION.swordWaitMin + random() * (HELICOPRION.swordWaitMax - HELICOPRION.swordWaitMin),
  };
}

/** Plan a straight pass through the target, beginning and ending beyond the visible arena. */
export function swordDashPath(target: { x: number; y: number }, angle: number, width: number, height: number, margin: number) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  const bounds = { left: -margin, top: -margin, right: width + margin, bottom: height + margin };
  const approach = distanceToBounds(target.x, target.y, -dx, -dy, bounds);
  const exit = distanceToBounds(target.x, target.y, dx, dy, bounds);
  return { x: target.x - dx * approach, y: target.y - dy * approach, dx, dy, remaining: approach + exit };
}

export type HelicoprionStatus = 'alive' | 'dead' | 'respawning';

export interface HelicoprionSave {
  hp: number;
  maxHp?: typeof HELICOPRION.maxHp;
  /** 0보다 크면 부활까지 남은 초 */
  respawn: number;
  /** 사체에서 갈무리한 횟수. hp 0·respawn 0이면 회색 사체로 남아 있습니다. 예전 저장에는 없습니다. */
  harvests?: number;
  /** 폭탄별 재생까지 남은 초. 0이면 설치되어 있음 */
  bombs: number[];
}

export function newHelicoprion(): HelicoprionSave {
  return { hp: HELICOPRION.maxHp, maxHp: HELICOPRION.maxHp, respawn: 0, harvests: 0, bombs: BOMB_SPOTS.map(() => 0) };
}

const LEGACY_MAX_HP = 2000;

export function restoreHelicoprion(save?: HelicoprionSave): HelicoprionSave {
  if (!save) return newHelicoprion();
  const hp = save.maxHp === undefined ? save.hp * HELICOPRION.maxHp / LEGACY_MAX_HP : save.hp;
  return { ...save, hp, maxHp: HELICOPRION.maxHp, harvests: save.harvests ?? 0, bombs: [...save.bombs] };
}

export type GripKind = 'devour' | 'sword';
export interface HelicoprionGrip { kind: GripKind; remaining: number; untilCut: number; presses: number }

export function newHelicoprionGrip(kind: GripKind): HelicoprionGrip {
  return { kind, remaining: kind === 'devour' ? HELICOPRION.devourSeconds : HELICOPRION.swordStunSeconds, untilCut: HELICOPRION.comboTick, presses: 0 };
}

/** Each call represents a new press. A held button and the ultimate stun cannot grant escapes. */
export function pressHelicoprionEscape(grip: HelicoprionGrip): boolean {
  if (grip.kind !== 'devour' || grip.remaining <= 0) return false;
  grip.presses += 1;
  return grip.presses >= HELICOPRION.escapePresses;
}

export function tickHelicoprionGrip(grip: HelicoprionGrip, dt: number) {
  const elapsed = Math.min(dt, grip.remaining);
  grip.remaining -= elapsed;
  grip.untilCut -= elapsed;
  let cuts = 0;
  while (grip.untilCut <= 1e-9) {
    cuts += 1;
    grip.untilCut += HELICOPRION.comboTick;
  }
  return { cuts, finished: grip.remaining <= 0, finalSlash: grip.remaining <= 0 && grip.kind === 'sword' };
}

export function helicoprionStatus(save: HelicoprionSave): HelicoprionStatus {
  if (save.respawn > 0) return 'respawning';
  return save.hp <= 0 ? 'dead' : 'alive';
}

/**
 * 사체를 한 번 갈무리합니다. 받은 보상을 돌려주고, 다섯 번째 갈무리 뒤에는 부활 대기를 시작합니다.
 * 갈무리할 수 없으면 null.
 */
export function harvestHelicoprion(save: HelicoprionSave): string | null {
  const harvests = save.harvests ?? 0;
  if (helicoprionStatus(save) !== 'dead' || harvests >= HELICOPRION.harvestCount) return null;
  const reward = HELICOPRION_HARVEST_REWARDS[harvests];
  save.harvests = harvests + 1;
  if (save.harvests >= HELICOPRION.harvestCount) {
    save.respawn = HELICOPRION.respawnSeconds;
    save.harvests = 0;
  }
  return reward;
}

export function isHelicoprionSave(value: unknown): value is HelicoprionSave {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const finite = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
  if (v.harvests !== undefined && !(Number.isInteger(v.harvests) && finite(v.harvests, 0, HELICOPRION.harvestCount - 1))) return false;
  if (v.maxHp !== undefined && v.maxHp !== HELICOPRION.maxHp) return false;
  return finite(v.hp, 0, v.maxHp ?? LEGACY_MAX_HP) && finite(v.respawn, 0, HELICOPRION.respawnSeconds) &&
    Array.isArray(v.bombs) && v.bombs.length === BOMB_SPOTS.length &&
    v.bombs.every(t => finite(t, 0, HELICOPRION.bombRespawnSeconds));
}

export function chooseAttack(distance: number): HelicoprionAttack {
  return distance > HELICOPRION.nearDistance ? 'charge' : 'jaw';
}

/**
 * (x, y)에서 (dx, dy) 방향으로 나아가 사각형 경계에 닿을 때까지의 거리.
 * 돌진은 조준한 지점에서 멈추지 않고 벽까지 이어지므로, 주인공이 피하면 뒤쪽 폭탄에 부딪힙니다.
 */
export function distanceToBounds(
  x: number, y: number, dx: number, dy: number,
  bounds: { left: number; top: number; right: number; bottom: number },
): number {
  const len = Math.hypot(dx, dy);
  if (len === 0) return 0;
  const ux = dx / len;
  const uy = dy / len;
  let t = Number.POSITIVE_INFINITY;
  if (ux > 0) t = Math.min(t, (bounds.right - x) / ux);
  if (ux < 0) t = Math.min(t, (bounds.left - x) / ux);
  if (uy > 0) t = Math.min(t, (bounds.bottom - y) / uy);
  if (uy < 0) t = Math.min(t, (bounds.top - y) / uy);
  return Math.max(0, Number.isFinite(t) ? t : 0);
}

/** 선분 a→b 위의 점 중 (px, py)에 가장 가까운 거리 */
export function segmentPointDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/**
 * 한 프레임 동안 돌진한 머리(prev→next, 반지름 headRadius)가 닿은 첫 폭탄 번호. 없으면 -1.
 * 빠른 돌진이 프레임 사이에 폭탄을 건너뛰지 않도록 선분으로 검사합니다.
 */
export function bombHitDuringCharge(
  prev: { x: number; y: number }, next: { x: number; y: number }, headRadius: number,
  bombs: ReadonlyArray<{ x: number; y: number; radius: number; armed: boolean }>,
): number {
  let best = -1;
  let bestAlong = Number.POSITIVE_INFINITY;
  for (let index = 0; index < bombs.length; index++) {
    const bomb = bombs[index];
    if (!bomb.armed) continue;
    if (segmentPointDistance(bomb.x, bomb.y, prev.x, prev.y, next.x, next.y) > headRadius + bomb.radius) continue;
    const along = Math.hypot(bomb.x - prev.x, bomb.y - prev.y);
    if (along < bestAlong) { best = index; bestAlong = along; }
  }
  return best;
}

/** 폭탄 재생 시간을 진행시키고 다시 설치된 폭탄 번호를 돌려줍니다. */
export function tickBombs(bombs: number[], dt: number): number[] {
  const restored: number[] = [];
  bombs.forEach((remaining, index) => {
    if (remaining <= 0) return;
    bombs[index] = Math.max(0, remaining - dt);
    if (bombs[index] === 0) restored.push(index);
  });
  return restored;
}
