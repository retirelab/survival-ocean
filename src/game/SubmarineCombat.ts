export type WeaponKind = 'bullet' | 'fire' | 'ice' | 'laser';
export interface FishStatus { burnRemaining: number; burnTick: number; slowRemaining: number; paralyzeRemaining: number }
export const COMBAT = { armorSeconds: 5, armorMultiplier: 2, metalDefense: 4, burnSeconds: 5, burnDamage: 2,
  slowSeconds: 3, slowMultiplier: 0.5, shockSeconds: 5, shockCooldown: 30, shockRadius: 140,
  breathLength: 420, breathRadius: 24, breathInterval: 0.12 } as const;
export const newFishStatus = (): FishStatus => ({ burnRemaining: 0, burnTick: 1, slowRemaining: 0, paralyzeRemaining: 0 });
export function applyWeaponStatus(status: FishStatus, weapon: WeaponKind) {
  if (weapon === 'fire') {
    if (status.burnRemaining <= 0) status.burnTick = 1;
    status.burnRemaining = COMBAT.burnSeconds;
  }
  if (weapon === 'ice') status.slowRemaining = COMBAT.slowSeconds;
}
export function tickFishStatus(status: FishStatus, seconds: number): number {
  const dt = Math.max(0, seconds);
  let burnDamage = 0;
  if (status.burnRemaining > 0) {
    const active = Math.min(dt, status.burnRemaining);
    status.burnRemaining = Math.max(0, status.burnRemaining - dt);
    status.burnTick -= active;
    while (status.burnTick <= 1e-9) { burnDamage += COMBAT.burnDamage; status.burnTick += 1; }
  }
  status.slowRemaining = Math.max(0, status.slowRemaining - dt);
  status.paralyzeRemaining = Math.max(0, status.paralyzeRemaining - dt);
  return burnDamage;
}
/** Integrate movement across status expiry, including a partially frozen frame. */
export function fishMovementSeconds(status: FishStatus, seconds: number): number {
  const dt = Math.max(0, seconds);
  const frozen = Math.min(dt, status.paralyzeRemaining);
  const slowed = Math.max(0, Math.min(dt, status.slowRemaining) - frozen);
  return dt - frozen - slowed * (1 - COMBAT.slowMultiplier);
}
export const effectiveDefense = (ship: string, upgrade: number, armorRemaining: number): number =>
  upgrade * (ship === 'metal' ? COMBAT.metalDefense : ship === 'sturdy' && armorRemaining > 0 ? COMBAT.armorMultiplier : 1);
export const weaponForShip = (ship: string): WeaponKind =>
  ship === 'fire' ? 'fire' : ship === 'ice' ? 'ice' : ship === 'metal' ? 'laser' : 'bullet';

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
