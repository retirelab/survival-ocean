import { normalizeFleet, type FleetState } from './Submarines.js';

export const SAVE_KEY = 'survival-ocean.save.v1';

export interface SaveGame {
  version: 1;
  submarines?: FleetState;
  savedAt: number;
  zoneIndex: number;
  level: number;
  player: { x: number; y: number; facing: number; hp: number };
  bag: string[];
  dragonLoot: string[];
  minerals: Record<string, number>;
  upgrades: { rapid: number; defense: number; attack: number };
  completedStages: number[];
  stats: {
    attack: number; defense: number; rapid: number; bulletSpeed: number;
    autoFire: boolean; regenAmount: number; regenInterval: number; regenTimer: number;
  };
  dragon: { state: string; hp: number; harvests: number; respawn: number; cooldown: number };
  ores: Array<{ id: string; remaining: number; respawn: number }>;
  menu: { stage: number; upgrading: boolean; nextZone: number | null; spawnY: number };
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, min: number, max: number) => number(value, min, max) && Number.isInteger(value);
const strings = (value: unknown, max: number) => Array.isArray(value) && value.length <= max &&
  value.every(item => typeof item === 'string' && item.length <= 50);

export function isSaveGame(value: unknown): value is SaveGame {
  if (!object(value) || value.version !== 1 || !number(value.savedAt, 0, 1e15) ||
      !integer(value.zoneIndex, 0, 3) || !integer(value.level, 1, 20) ||
      (value.submarines !== undefined && !normalizeFleet(value.submarines))) return false;
  const { player: p, stats: s, dragon: d, menu: m, upgrades: u, minerals: minerals } = value;
  if (!object(p) || !object(s) || !object(d) || !object(m) || !object(u) || !object(minerals)) return false;
  return number(p.x, 0, 1) && number(p.y, 0, 1) && (p.facing === 1 || p.facing === -1) && number(p.hp, 1, 250) &&
    strings(value.bag, 12) && strings(value.dragonLoot, 100000) &&
    ['다이아몬드', '루비', '사파이어', '토파즈', '부싯돌'].every(key => integer(minerals[key], 0, 1e9)) &&
    ['rapid', 'defense', 'attack'].every(key => integer(u[key], 0, 4)) &&
    Array.isArray(value.completedStages) && value.completedStages.length <= 4 && value.completedStages.every(v => integer(v, 0, 3)) &&
    ['attack', 'defense', 'rapid', 'bulletSpeed'].every(key => number(s[key], 0.1, 100)) &&
    typeof s.autoFire === 'boolean' && number(s.regenAmount, 0, 10) && number(s.regenInterval, 0, 20) && number(s.regenTimer, -1, 20) &&
    ['sleeping', 'awake', 'dead', 'respawning'].includes(d.state as string) && number(d.hp, 0, 1250) &&
    integer(d.harvests, 0, 3) && number(d.respawn, 0, 300) && number(d.cooldown, -1, 30) &&
    Array.isArray(value.ores) && value.ores.length <= 2 && new Set(value.ores.map(ore => object(ore) ? ore.id : null)).size === value.ores.length &&
    value.ores.every(ore => object(ore) && ['upper', 'lower'].includes(ore.id as string) && integer(ore.remaining, 0, 5) && number(ore.respawn, 0, 60)) &&
    integer(m.stage, 0, 3) && typeof m.upgrading === 'boolean' &&
    (m.nextZone === null || integer(m.nextZone, 0, 3)) && number(m.spawnY, 0, 1);
}

export function readSave(): { data: SaveGame | null; error: string | null } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { data: null, error: null };
    const data: unknown = JSON.parse(raw);
    if (!isSaveGame(data)) throw new Error('invalid save');
    if (data.submarines) data.submarines = normalizeFleet(data.submarines)!;
    return { data, error: null };
  } catch {
    return { data: null, error: '저장 데이터를 읽을 수 없어요. 브라우저 저장 설정 또는 저장 파일을 확인하세요.' };
  }
}

export function writeSave(data: SaveGame): boolean {
  try {
    if (!isSaveGame(data)) return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
