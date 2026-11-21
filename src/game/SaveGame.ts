import { normalizeFleet, BASE_MINERALS, RARE_MINERALS, type FleetState } from './Submarines.js';
import { isHelicoprionSave, type HelicoprionSave } from './Helicoprion.js';
import { MX3_ZONE_INDEX, isMX3Save, type MX3Save } from './MX3.js';
import { ABYSS_DRAGON, isAbyssDragonSave, type AbyssDragonSave } from './AbyssDragon.js';

export const SAVE_KEY = 'survival-ocean.save.v1';
/** 저장할 수 있는 가장 큰 구역 번호. */
export const MAX_ZONE_INDEX = MX3_ZONE_INDEX;
export const BASE_MAX_LEVEL = 20;
export const EXPANDED_MAX_LEVEL = 40;
/** 강화 메뉴 단계(기본~GOLD)와 수룡 구역 번호. 강화 단계는 0~3까지만 존재합니다. */
const MAX_UPGRADE_STAGE = 3;
/** 광석바위: 중심층 4개 + 지하세계 2층 4개 */
export const ORE_IDS = ['upper', 'lower', 'upper_left', 'lower_right', 'uw2_a', 'uw2_b', 'uw2_c', 'uw2_d'] as const;

export interface SaveProgress {
  /** 빙하수 골짜기 진입으로 최대 레벨이 40으로 확장되었는지 */
  maxLevelExpanded: boolean;
  /** 수룡을 한 번이라도 토벌해 아래 통로가 영구히 열렸는지 */
  dragonPassUnlocked: boolean;
}

export interface SaveGame {
  version: 1;
  submarines?: FleetState;
  combat?: { armorRemaining: number; shockCooldown: number; paralysisRemaining?: number };
  progress?: SaveProgress;
  helicoprion?: HelicoprionSave;
  abyssDragon?: AbyssDragonSave;
  mx3?: MX3Save;
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
      !integer(value.zoneIndex, 0, MAX_ZONE_INDEX) || !integer(value.level, 1, EXPANDED_MAX_LEVEL) ||
      (value.submarines !== undefined && !normalizeFleet(value.submarines))) return false;
  const progress = value.progress;
  if (progress !== undefined && (!object(progress) || typeof progress.maxLevelExpanded !== 'boolean' ||
      typeof progress.dragonPassUnlocked !== 'boolean')) return false;
  if (value.helicoprion !== undefined && !isHelicoprionSave(value.helicoprion)) return false;
  if (value.mx3 !== undefined && !isMX3Save(value.mx3)) return false;
  if (value.abyssDragon !== undefined && !isAbyssDragonSave(value.abyssDragon)) return false;
  const expanded = (object(progress) && progress.maxLevelExpanded === true) || (value.zoneIndex as number) >= 4;
  if (!expanded && (value.level as number) > BASE_MAX_LEVEL) return false;
  if (value.combat !== undefined && (!object(value.combat) || !number(value.combat.armorRemaining, 0, 5) || !number(value.combat.shockCooldown, 0, 30) ||
      (value.combat.paralysisRemaining !== undefined && !number(value.combat.paralysisRemaining, 0, ABYSS_DRAGON.biteParalysisSeconds)))) return false;
  const { player: p, stats: s, dragon: d, menu: m, upgrades: u, minerals: minerals } = value;
  if (!object(p) || !object(s) || !object(d) || !object(m) || !object(u) || !object(minerals)) return false;
  return number(p.x, 0, 1) && number(p.y, 0, 1) && (p.facing === 1 || p.facing === -1) && number(p.hp, 1, 250) &&
    strings(value.bag, 12) && strings(value.dragonLoot, 100000) &&
    BASE_MINERALS.every(key => integer(minerals[key], 0, 1e9)) &&
    // 희귀 광물은 예전 저장에 없을 수 있습니다.
    RARE_MINERALS.every(key => minerals[key] === undefined || integer(minerals[key], 0, 1e9)) &&
    ['rapid', 'defense', 'attack'].every(key => integer(u[key], 0, 4)) &&
    Array.isArray(value.completedStages) && value.completedStages.length <= 4 && value.completedStages.every(v => integer(v, 0, MAX_UPGRADE_STAGE)) &&
    ['attack', 'defense', 'rapid', 'bulletSpeed'].every(key => number(s[key], 0.1, 100)) &&
    typeof s.autoFire === 'boolean' && number(s.regenAmount, 0, 10) && number(s.regenInterval, 0, 20) && number(s.regenTimer, -1, 20) &&
    ['sleeping', 'awake', 'dead', 'respawning'].includes(d.state as string) && number(d.hp, 0, 1250) &&
    integer(d.harvests, 0, 3) && number(d.respawn, 0, 300) && number(d.cooldown, -1, 30) &&
    Array.isArray(value.ores) && value.ores.length <= ORE_IDS.length && new Set(value.ores.map(ore => object(ore) ? ore.id : null)).size === value.ores.length &&
    value.ores.every(ore => object(ore) && (ORE_IDS as readonly string[]).includes(ore.id as string) && integer(ore.remaining, 0, 5) && number(ore.respawn, 0, 60)) &&
    integer(m.stage, 0, MAX_UPGRADE_STAGE) && typeof m.upgrading === 'boolean' &&
    (m.nextZone === null || integer(m.nextZone, 0, MAX_ZONE_INDEX)) && number(m.spawnY, 0, 1);
}

/**
 * 저장에 기록된 진행 플래그를 돌려줍니다. progress가 없는 예전 저장은 남은 정보로 추정합니다.
 * 빙하수 골짜기(4번) 이하로 내려간 적이 있으면 두 플래그 모두 켜진 상태입니다.
 * 통로는 한 번 열리면 닫히지 않으므로, 수룡을 잡은 흔적이 하나라도 있으면 열린 것으로 봅니다.
 */
export function resolveProgress(save: SaveGame): SaveProgress {
  const deep = save.zoneIndex >= 4;
  const killedDragon = save.dragon.state === 'dead' || save.dragon.state === 'respawning' ||
    save.dragon.harvests > 0 || save.dragonLoot.some(item => item.startsWith('수룡')) ||
    (save.submarines?.owned.includes('baby_dragon') ?? false);
  return {
    maxLevelExpanded: deep || save.level > BASE_MAX_LEVEL || (save.progress?.maxLevelExpanded ?? false),
    dragonPassUnlocked: deep || killedDragon || (save.progress?.dragonPassUnlocked ?? false),
  };
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
