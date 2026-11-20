import { getSubmarine } from './Submarines.js';
export type WeaponKind = 'bullet' | 'fire' | 'ice' | 'laser' | 'greenLaser' | 'rainbow' | 'blade' | 'volt' | 'flame';
export interface FishStatus {
  burnRemaining: number; burnTick: number; slowRemaining: number; paralyzeRemaining: number;
  /** 화상 1초마다 들어가는 피해(불속성 2, 메가 볼케이노 화염방사 8) */
  burnDamage: number;
  /** 이동 속도 배율. 얼음칼날을 맞을 때마다 점점 작아집니다. */
  slowFactor: number;
  slowStacks: number;
}
export const COMBAT = { armorSeconds: 5, armorMultiplier: 2, metalDefense: 4, burnSeconds: 5, burnDamage: 2,
  slowSeconds: 3, slowMultiplier: 0.5, shockSeconds: 5, shockCooldown: 30, shockRadius: 140,
  breathLength: 420, breathRadius: 24, breathInterval: 0.12,
  /** 메가 볼케이노 화염방사 */
  flameLength: 210, flameRadius: 42, flameBurnDamage: 8,
  /** 메가 블리자드 얼음칼날: 맞을 때마다 속도 ×0.75, 최저 10% */
  bladeSlowStep: 0.75, bladeSlowMin: 0.1,
  /** 메가 볼티지 */
  megaShockRadius: 260, voltLevel2: 0.6, voltLevel3: 1.5, voltRingRadius: 95, voltCannonSeconds: 2, voltCannonRadius: 46,
  /** 소드 크러셔 */
  dashDistance: 190, dashCooldown: 0.35, boostDelay: 0.25, boostMax: 2.8, boostRate: 0.9, sawCooldown: 0.4,
  /** 마스터 드래곤 하이퍼 브레스 */
  hyperRadius: 40,
  /** 무지개빛 잠수함 회복 */
  rainbowRegenAmount: 15, rainbowRegenSeconds: 10 } as const;
export const newFishStatus = (): FishStatus => ({ burnRemaining: 0, burnTick: 1, slowRemaining: 0, paralyzeRemaining: 0,
  burnDamage: COMBAT.burnDamage, slowFactor: COMBAT.slowMultiplier, slowStacks: 0 });
export function applyWeaponStatus(status: FishStatus, weapon: WeaponKind) {
  if (weapon === 'fire' || weapon === 'flame') {
    if (status.burnRemaining <= 0) status.burnTick = 1;
    status.burnRemaining = COMBAT.burnSeconds;
    status.burnDamage = Math.max(weapon === 'flame' ? COMBAT.flameBurnDamage : COMBAT.burnDamage, status.burnRemaining > 0 ? status.burnDamage : 0);
  }
  if (weapon === 'ice') {
    status.slowRemaining = COMBAT.slowSeconds;
    status.slowFactor = Math.min(status.slowStacks > 0 ? status.slowFactor : 1, COMBAT.slowMultiplier);
  }
  if (weapon === 'blade') {
    if (status.slowRemaining <= 0) { status.slowStacks = 0; status.slowFactor = 1; }
    status.slowStacks += 1;
    status.slowFactor = Math.max(COMBAT.bladeSlowMin, COMBAT.bladeSlowStep ** status.slowStacks);
    status.slowRemaining = COMBAT.slowSeconds;
  }
}
/** 메가 볼티지: 누른 시간에 따른 차지 단계(1~3) */
export const voltChargeLevel = (heldSeconds: number): 1 | 2 | 3 =>
  heldSeconds >= COMBAT.voltLevel3 ? 3 : heldSeconds >= COMBAT.voltLevel2 ? 2 : 1;
/** 소드 크러셔: 누르고 있는 시간에 따라 올라가는 속도 배율 */
export const sawBoost = (heldSeconds: number): number =>
  Math.min(COMBAT.boostMax, 1 + Math.max(0, heldSeconds - COMBAT.boostDelay) * COMBAT.boostRate);
export function tickFishStatus(status: FishStatus, seconds: number): number {
  const dt = Math.max(0, seconds);
  let burnDamage = 0;
  if (status.burnRemaining > 0) {
    const active = Math.min(dt, status.burnRemaining);
    status.burnRemaining = Math.max(0, status.burnRemaining - dt);
    status.burnTick -= active;
    while (status.burnTick <= 1e-9) { burnDamage += status.burnDamage; status.burnTick += 1; }
    if (status.burnRemaining <= 0) status.burnDamage = COMBAT.burnDamage;
  }
  status.slowRemaining = Math.max(0, status.slowRemaining - dt);
  if (status.slowRemaining <= 0) { status.slowStacks = 0; status.slowFactor = COMBAT.slowMultiplier; }
  status.paralyzeRemaining = Math.max(0, status.paralyzeRemaining - dt);
  return burnDamage;
}
/** Integrate movement across status expiry, including a partially frozen frame. */
export function fishMovementSeconds(status: FishStatus, seconds: number): number {
  const dt = Math.max(0, seconds);
  const frozen = Math.min(dt, status.paralyzeRemaining);
  const slowed = Math.max(0, Math.min(dt, status.slowRemaining) - frozen);
  return dt - frozen - slowed * (1 - status.slowFactor);
}
export const effectiveDefense = (ship: string, upgrade: number, armorRemaining: number): number =>
  upgrade * getSubmarine(ship).defense * (ship === 'sturdy' && armorRemaining > 0 ? COMBAT.armorMultiplier : 1);
/** 잠수함 자체 공격 배율(강화 배율에 곱함) */
export const shipAttack = (ship: string): number => getSubmarine(ship).attack;
const SHIP_WEAPONS: Record<string, WeaponKind> = {
  fire: 'fire', ice: 'ice', metal: 'laser', hi_metal: 'greenLaser', rainbow: 'rainbow', mega_blizzard: 'blade', mega_voltage: 'volt',
};
export const weaponForShip = (ship: string): WeaponKind => SHIP_WEAPONS[ship] ?? 'bullet';
/** 발사 버튼을 누르고 있는 동안 계속 나가는 무기(브레스·화염방사) */
export const holdWeapon = (ship: string): 'breath' | 'hyper' | 'flame' | null =>
  ship === 'baby_dragon' ? 'breath' : ship === 'master_dragon' ? 'hyper' : ship === 'mega_volcano' ? 'flame' : null;

export function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax; const dy = by - ay;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length2));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
export function segmentHitsRect(ax: number, ay: number, bx: number, by: number, rect: { x: number; y: number; width: number; height: number }): boolean {
  let start = 0; let end = 1;
  for (const [position, delta, min, max] of [[ax, bx - ax, rect.x, rect.x + rect.width], [ay, by - ay, rect.y, rect.y + rect.height]]) {
    if (Math.abs(delta) < 1e-9) { if (position < min || position > max) return false; }
    else {
      const t1 = (min - position) / delta; const t2 = (max - position) / delta;
      start = Math.max(start, Math.min(t1, t2)); end = Math.min(end, Math.max(t1, t2));
      if (start > end) return false;
    }
  }
  return true;
}
