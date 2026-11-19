import Phaser from 'phaser';
import { FISH_SPRITES } from '../assets/fishSprites';
import { GameAudio } from '../audio/GameAudio';
import { COMBAT, newFishStatus, applyWeaponStatus, tickFishStatus, fishMovementSeconds, effectiveDefense, weaponForShip, distanceToSegment, segmentHitsRect, type FishStatus, type WeaponKind } from '../game/SubmarineCombat';
import { SubmarinePanel } from '../game/SubmarinePanel';
import { SUBMARINES, getSubmarine, newFleet, craftOrEquip, damageEquippedSubmarine, inventoryResources, submarineImage } from '../game/Submarines';
import { PauseControls } from '../game/PauseControls';
import { HelicoprionBoss } from './HelicoprionBoss';
import { AbyssDragonBoss } from './AbyssDragonBoss';
import { NEST_ENTRANCE } from '../game/Helicoprion';
import { readSave, resolveProgress, writeSave, BASE_MAX_LEVEL, EXPANDED_MAX_LEVEL, type SaveGame } from '../game/SaveGame';

const ROCK_BREAM_SPRITE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGkAAABACAMAAAAu/6n2AAAA/1BMVEWcnZtoZ2YkIyPh39xkYmBSUVFJTE7e7/eVlZM5NzYYGBk2MyiNnKV+kJkyN0BAQD6KfX2FhXzHpqbDw68+QEB/AABibYC+w8MAAADT5e0RGCx3h5C0xtCXqLKpu8XB091ZZ3Fse4TJ2+SJmqQtOEdMWWRkc3w5RFGCkpz+/v0EBhEkKTCis72+0NoUFhgwNTkbIzJ+fn5IU1tCTFVVVVSesLoFDCJgbnc2Nzg9PT1JSEdGRkYnKCgUFBQ3NzhWVlUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACJGlR7AAAAQHRSTlMmW50aJpbS/0hbzzD+/uPSFi0LFcEC/zMA//7+/v7+/v7+//7+/v7+/gb9+P7/+fn+Av78BP7+/tMEbrHVqLdxZhXjbgAACqFJREFUeNq1WAl727YSpA4fcZz0tX2HKBAkQFy8RFKkdVh27P//r94sIDlOYjdxmkK2PpESMdjd2dkFosV3R0n/Z10ZHbrpYv6Obq3L9eKtI/ruL24W0WQxHbvp1eCq6fkwKcvFz4zvIq0X5Xg/rZWpOs7aZTG29/uz2Sya39yWvxRpvZg97Oqac8bSgvFrZtradu1dF3lzfx1S+Z/yvuei2HClUm45LxheppPdp8fH2a+0ab24bG3DOF70x5gEksLoqrY+v1yTWevAjvX67yCtbxd71kgB51mmRMEM4/ZaSSaVNaxt6enbp1//deC+F6d3NbduEMIMxrjBjIOgDxaWMWmXV58mmOIwxfg0mYWEeDPSmsJ9+fjgzCissHrpB33ESzvn4EexXLaHw1jXXd+3bQ2sm7cjkU/OpnWrpZRFUSjZe6RRFXTl8FEbYSRz2llVKKBWbfVQLtZvtyma3LftctlLhJ8mD0Zp/1mxcDUKwwrOpGCKuNITVPkGJNAA6jPqMJtQnG/SNC28UT3DR84bVtOVYYgdqMIVOCOlqKu716FetOlfj/daMOGRDE+SVZ7Huai11r2K8zxbJQmj7xxju2EwBS9UIZEFtqvuftx70WI2ue+ERNbAqF5rFYfBAKRrFuf+itc9jFTIZDbAhUxYuI+xtr58zajoW5n7rR2AA5dxhNvR3DADVniH1U2CkeWNc7qu0yTdcNvDAbyQGyAtq+lLIn0LhkXfytzSyYJjwlVseyx8xMwITsI90lKlTZPiloC9jueJd2QN3sCTBRur6fqlqvONTXDdOQhWNE0Wx1kSIsXSBrM3qQlIDRjS8JS+60UCY2kJ9SgLqQSTy3byZVL5tDw7O7uJvrxbnlOg0wwUiLOVClxu/DghpXzDiX2e9ORJvyBjZGGlZEO1nz2LFD6V0cOyqqp30Zc1746oLVd5nJCHGk90x1PyXiY9EqjoLfSr0Bt8ytkWySAH+wHy4SqIYfkMaH5GJm+rj9GXrhOYW3OKTLPZNInYehNXngWqPyL5EZAaGOgZbwoxQCyYrdvPNoFek3ZprRi/sGm9+OOjIA+ZFITaUNgzINVLk+Q04sRTYoPIJIDmPq0bciR3+NHmw7mhktJXJ5vwHu17LZHTy6p9H3123Z93xquM5DTIe4l3mAkZFGfel0We+ZH4RcF2QLlam4YzMRohXLV/8lx0VYP/wpotxCN68mh5PnpZ6CE/SKaNh6IbH5NT7vqoHYFiuQ2MQAwN5BaQ0ggFpb33882pn3ICPLFiua3OTiwvb6OHHrWOfA93NEgn+s9Tmrw5IjU+NKuAlBOSyHwIGT0FKOYc+qeH8vYGSVXe9aIopIWsVVU9OyHdLB6XjHvBFgiSj3m6yoLH0iNSekRarU5IxoN6Skg8UBCdz32UysN0kOrDTqqd1UA6Ze56EdUO7Ui/3NasSdNArxS6ap4hJUQ+neFulq2C9whplfOeUgMP4NdVfRfNf590/UCqy1BPiA+Tch2Fsje/76TidotHBs/jFabjgKBceULyBfDIj5hIr2EfLMQStuIoTLgLjqJVAwonrAIm3f+5WIe27XJvoKkFCqw1jiFLE5ovLfILIjM/zp0ziKo7ITUDwWIAyRHSyqecZkz0VGwKFC5UEiN1heZwTd7DmzNYgHKGa3Q9rEnyQDdexA1qUnGcO+Yj1P10kYM+4SKHfBBSlidu20Hf8Y1IGlInu1NiW50HYYDr9oMFP03PXFW5hCVwvl95ZtMYnYI4mcFRKsbTRWxPSHFceO+BHG6rIZpK1zZPlbWokAU6w0faMERwXWekEKAjOp+qYkomcb5ahal5nIx6DBbmcTo6J+KLb5HgY7KJkAwWmTrHCGmHdgdZu/QlP1pEo4EGFwXnRiOASja0ajCcImXTbNQmwF5ccP2x10pdv4TEAtKS0WNuSAkJy5d1VX0MSPO2QwsASQG1pTNCgtsxaTktPdmpzDgRUM1/dY+kR5fZHJGegoacVkBa5aLjCFthdlmSKiZQ8yHuoWJFXUezZ15W8C33EcpRBr3DCp6LUaSJ6sGFHRoyDrNNFpC0Hk853S8V6lmWC9egE1AszZOUg3uGCn7t1T2qYZC0RZKTrpBkh5DkPokylsRicHqrkQVFcb1DVcXTYXqhtXhColjCe4NBVic+9eE96mSGbdUH73VgeMaF+JD41A9IWZz4JGosXE85QpVn5zMeCXLxhGROSJoEP8/UKGEM6TtPONsZgUcQqDtqbaPJft8OPEttsQEPjkirgJQzHrPeFA21qNLSG5BOkvHcJkJCHyjRHaa8KD4ovzux1N6aKtSRqCxn767aYZNfMHWRhwickDjL4MZ00xS+mWO0RCcu8hOSO6lHAyRyGzNiN3Q1tgTo2SWoB/+5bRDdCPf3+DdNIhm5zYcJKYFJchu6ypRfc+WNslKYUzoR0inRODIBQFyOXTV9jzGBbNG+Bx0q09Vy4pHQ3FEAQcnkWE4zWMLgI26PM1ErhC0HmaXTr5HIGKYFgBQ2BEq0E181Zuc1yCMs8bzao+JHB20V1DvOCkalD1QltjYF/M6Up/xFnFIBsKTOYkg+657e5b5LRx+mixwW7UgC2vvS589s2hpmhfBVY05aftiPO/RZAKFtRKhMXIGJimU5oBJqvjEF/OB6zU5AcePQsgcXoK1WSCIa9ljdqS+6q2sEy+z6qjqU1EeUZ/tOCI+xUQpagX06Om/s1ElqoRPYBhjoytjXDv3xcdCOgHSBaq7CfdquYUF8rCZhu+aTte2sREmp6jLU3Pmh7gz3PUpDG/PNCnknQdhkRaqepn67qVH90R6HPmKVs9pQYJGiCdMDtnOMEtW0bfm5C5s/1u0gILL3vrqX771dbmCKmtWGEFMGI6lzTUjNUO2od4iLXjyRBmWR5cfNgdUOvQnlAAR1Hz3rLDFx1estad9Tvxc9ntXOfijQuqIok+iS5npdOZqRZRLOOwElwqWJb6MJyaMgKOiW51/uAMrJHm0MZOJ5Xz6fokHzQ6rQXaZhzdRX0OSDDECQSLDApAGo4cZQVvNrYcQLu5ro5vHq6vEzUkm79eisqx26p4Ifx4aWnB7RuDs15bhWxvsaOEqQFIDf4Kf7dqd2+8qecDJ5uHLwRaE+g6WnvZr0oMEUJf1NtG5CoE+FHuzQsLb1/147KIi+2hLCuD8O005bROoJzO8CyU/JqROkzQi4g3ywYgeFx8/hP0SpK390n3vjwQ4HXyDVE5YP2vPhb6HSIUTYS1hJBVZAtievnma+dvIRRfAiufGZH78a6KZAICBIzzvor67qaPE2pFtP1MN0D9N2ghT5azjIdNc9TLtB2qobuxGyKLrq/nWgV23yB1SL3yeTf3et5CaQ3wx+GLy6+m4yiRZ3dQeotq3rFu/oVW9+6tTNPzUrDy1Ku0UswOF2+smPd+UsbCnKyXTsL8vZFF88/tUB1fdOEm8I7VBvmN83sDEUn+NCjus/TH7N2TK4NKsHFEqyinW/RT4Vb9bro01kxU0g3M3fOrP0hkXtLgm6piFrL9PnF5zM+1+1grNrdHq76t3Pncv/INJ8cYmuANpmZN3+o0jh6JdOJm3/TyMh4vM7PRbcvRCoX2wTHWXeDQNr9/84EhH5/VR3P2vT/wHMCgk8z33D9AAAAABJRU5ErkJggg==';

interface ZoneConfig {
  id: number;
  name: string;
  minDepth: number;
  maxDepth: number;
  reqLevel: number;
  topColor: number;
  bottomColor: number;
  floorColor: number;
}

interface FishSpec {
  key: string;
  name: string;
  hp: number;
  speed: number;
  exp: number;
  scale: number;
  aggressive?: boolean;
  attack?: number;
  unique?: boolean;
  /** 가까이 가도 먼저 덤비지 않고, 피해를 입었을 때 반격합니다. */
  provokedOnly?: boolean;
  /** 원본 그림이 왼쪽을 보고 있음 */
  facesLeft?: boolean;
}

interface FishEntity {
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  spec: FishSpec;
  hp: number;
  vx: number;
  stunned: boolean;
  stunTimer: number;
  aggro: boolean;
  baseY: number;
  phase: number;
  status: FishStatus;
}

interface BulletEntity {
  gfx: Phaser.GameObjects.Shape;
  weapon: WeaponKind;
  damage: number;
  vx: number;
  vy: number;
  life: number;
  piercing: boolean;
  hitFish: Set<FishEntity>;
}

type DragonState = 'sleeping' | 'awake' | 'dead' | 'respawning';
type DragonAttack = 'breath' | 'arm' | 'tail';
type UpgradeChoice = 'rapid' | 'defense' | 'attack' | 'skip';
type MenuMode = 'start' | 'upgrade' | null;
type MineralType = '다이아몬드' | '루비' | '사파이어' | '토파즈' | '부싯돌';

interface OreNode {
  id: 'upper' | 'lower' | 'upper_left' | 'lower_right';
  x: number;
  y: number;
  remaining: number;
  respawnRemaining: number;
}

interface DragonDangerZone {
  type: DragonAttack;
  shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle | Phaser.Geom.Polygon;
  damage: number;
  timer: number;
  targetX: number;
  targetY: number;
}

const ZONES: ZoneConfig[] = [
  { id: 0, name: '초심층', minDepth: 0, maxDepth: 100, reqLevel: 1, topColor: 0x38bdf8, bottomColor: 0x0369a1, floorColor: 0x1e3a8a },
  { id: 1, name: '중심층', minDepth: 100, maxDepth: 200, reqLevel: 5, topColor: 0x0284c7, bottomColor: 0x1e3a8a, floorColor: 0x312e81 },
  { id: 2, name: '심해', minDepth: 200, maxDepth: 300, reqLevel: 10, topColor: 0x1e1b4b, bottomColor: 0x0f172a, floorColor: 0x090d16 },
  { id: 3, name: '지하세계', minDepth: 300, maxDepth: 400, reqLevel: 18, topColor: 0x0f172a, bottomColor: 0x042f2e, floorColor: 0x134e4a },
  { id: 4, name: '빙하수 골짜기', minDepth: 400, maxDepth: 500, reqLevel: 18, topColor: 0x075985, bottomColor: 0x0c4a6e, floorColor: 0x67e8f9 },
  { id: 5, name: '지하세계 2층', minDepth: 500, maxDepth: 600, reqLevel: 18, topColor: 0x172554, bottomColor: 0x111827, floorColor: 0x9a3412 },
  { id: 6, name: '열수분출공층', minDepth: 600, maxDepth: 700, reqLevel: 18, topColor: 0x0f172a, bottomColor: 0x030712, floorColor: 0x292524 },
  // 지하세계 2층 오른쪽 끝과 이어진 옆 구역. 위아래로는 이동하지 않습니다.
  { id: 7, name: '헬리코프리온의 둥지', minDepth: 500, maxDepth: 600, reqLevel: 18, topColor: 0x1c1917, bottomColor: 0x431407, floorColor: 0xf59e0b },
];

const SHALLOW_FISH: FishSpec[] = [
  { key: 'tuna', name: '참다랑어', hp: 3, speed: 105, exp: 45, scale: 0.62 },
  { key: 'salmon', name: '연어', hp: 2, speed: 95, exp: 30, scale: 0.6 },
  { key: 'red_seabream', name: '참돔', hp: 2, speed: 85, exp: 28, scale: 0.6 },
  { key: 'rock_bream', name: '돌돔', hp: 2, speed: 80, exp: 28, scale: 0.6 },
  { key: 'trout', name: '송어', hp: 1, speed: 100, exp: 22, scale: 0.6 },
  { key: 'shrimp', name: '흰다리새우', hp: 1, speed: 75, exp: 18, scale: 0.68 },
  { key: 'flounder', name: '광어', hp: 2, speed: 70, exp: 25, scale: 0.62 },
  { key: 'eel', name: '붕장어', hp: 2, speed: 100, exp: 32, scale: 0.62 },
];

const MID_FISH: FishSpec[] = [
  { key: 'lobster', name: '랍스터', hp: 4, speed: 75, exp: 60, scale: 0.6 },
  { key: 'squid', name: '오징어', hp: 3, speed: 110, exp: 55, scale: 0.6 },
  { key: 'octopus', name: '문어', hp: 5, speed: 70, exp: 70, scale: 0.62 },
  { key: 'crab', name: '꽃게', hp: 3, speed: 65, exp: 50, scale: 0.6 },
  { key: 'mackerel', name: '전갱이', hp: 2, speed: 115, exp: 40, scale: 0.6 },
  { key: 'shark', name: '백상아리', hp: 50, speed: 120, exp: 400, scale: 0.72, aggressive: true, attack: 20, unique: true },
  { key: 'sailfish', name: '돛세치', hp: 15, speed: 145, exp: 180, scale: 0.68, aggressive: true, attack: 10, unique: true },
  { key: 'marlin', name: '청세치', hp: 15, speed: 140, exp: 180, scale: 0.68, aggressive: true, attack: 10, unique: true },
  { key: 'grouper', name: '다금바리', hp: 10, speed: 90, exp: 120, scale: 0.65, aggressive: true, attack: 3, unique: true },
];

const DEEP_FISH: FishSpec[] = [
  { key: 'shark', name: '백상아리', hp: 100, speed: 125, exp: 600, scale: 0.76, aggressive: true, attack: 20, unique: true },
  { key: 'lobster', name: '랍스터', hp: 30, speed: 85, exp: 180, scale: 0.64, aggressive: true, attack: 10 },
  { key: 'king_crab', name: '킹크랩', hp: 30, speed: 75, exp: 200, scale: 0.68, aggressive: true, attack: 12 },
  { key: 'octopus', name: '문어', hp: 10, speed: 85, exp: 110, scale: 0.62, aggressive: true, attack: 6 },
  { key: 'flounder', name: '광어', hp: 10, speed: 80, exp: 100, scale: 0.62, aggressive: true, attack: 5 },
  { key: 'tuna', name: '참다랑어', hp: 3, speed: 115, exp: 60, scale: 0.62 },
];

// 빙하수 골짜기. 그림은 2배 크기로 저장해 scale 0.5 근처로 표시합니다.
const GLACIAL_FISH: FishSpec[] = [
  { key: 'glacial_mako', name: '청상아리', hp: 120, speed: 150, exp: 700, scale: 0.5, aggressive: true, provokedOnly: true, attack: 25, unique: true },
  { key: 'glacial_marlin', name: '청세치', hp: 40, speed: 155, exp: 260, scale: 0.5, aggressive: true, provokedOnly: true, attack: 15, unique: true },
  { key: 'glacial_sailfish', name: '돛세치', hp: 40, speed: 160, exp: 260, scale: 0.5, aggressive: true, provokedOnly: true, attack: 15, unique: true },
  { key: 'glacial_herring', name: '청어', hp: 8, speed: 120, exp: 80, scale: 0.5 },
  { key: 'glacial_icefish', name: '남극빙어', hp: 10, speed: 90, exp: 90, scale: 0.5, facesLeft: true },
  { key: 'glacial_mackerel', name: '고등어', hp: 8, speed: 125, exp: 80, scale: 0.5 },
  { key: 'glacial_shrimp', name: '흰다리새우', hp: 5, speed: 75, exp: 60, scale: 0.5 },
  { key: 'glacial_squid', name: '오징어', hp: 12, speed: 110, exp: 100, scale: 0.5 },
];
const GLACIAL_FISH_FILES: Record<string, string> = {
  glacial_mako: 'mako', glacial_marlin: 'marlin_blue', glacial_sailfish: 'sailfish_blue', glacial_herring: 'herring',
  glacial_icefish: 'icefish', glacial_mackerel: 'mackerel_atl', glacial_shrimp: 'shrimp_white', glacial_squid: 'squid_red',
};
const GLACIAL_ZONE_INDEX = 4;

const UNDERWORLD_2F_LARGE_PREDATOR_HP = 150;
const UNDERWORLD_2F_FISH: FishSpec[] = [
  { key: 'underworld_great_white', name: '백상아리', hp: UNDERWORLD_2F_LARGE_PREDATOR_HP, speed: 150, exp: 800, scale: 0.5, aggressive: true, provokedOnly: true, attack: 30, unique: true },
  { key: 'underworld_crocodile', name: '바다악어', hp: UNDERWORLD_2F_LARGE_PREDATOR_HP, speed: 105, exp: 800, scale: 0.5, aggressive: true, provokedOnly: true, attack: 30, unique: true },
  { key: 'underworld_horse_mackerel', name: '전갱이', hp: 10, speed: 125, exp: 90, scale: 0.5 },
  { key: 'underworld_octopus', name: '문어', hp: 16, speed: 85, exp: 120, scale: 0.5 },
  { key: 'underworld_squid', name: '오징어', hp: 14, speed: 115, exp: 110, scale: 0.5 },
  { key: 'underworld_lobster', name: '랍스타', hp: 45, speed: 100, exp: 280, scale: 0.5, aggressive: true, provokedOnly: true, attack: 16, unique: true },
  { key: 'underworld_king_crab', name: '킹크랩', hp: 22, speed: 75, exp: 160, scale: 0.5 },
  { key: 'underworld_conger', name: '붕장어', hp: 15, speed: 120, exp: 115, scale: 0.5 },
  { key: 'underworld_grouper', name: '다금바리', hp: 55, speed: 115, exp: 340, scale: 0.5, aggressive: true, provokedOnly: true, attack: 20, unique: true },
];

const DRAGON_ZONE_INDEX = 3;
/** 위아래로 이어진 마지막 구역(열수분출공층). 그 뒤 구역은 옆으로 들어갑니다. */
const LAST_DEPTH_ZONE_INDEX = 6;
const UNDERWORLD_2F_ZONE_INDEX = 5;
const NEST_ZONE_INDEX = 7;
/** 열수분출공층: 잠든 수룡 → 진화한 수룡 보스전 */
const ABYSS_ZONE_INDEX = 6;
const DRAGON_MAX_HP = 1250;
const DRAGON_ATTACK_DAMAGE = 50;
const DRAGON_RESPAWN_SECONDS = 5 * 60;
const ORE_MINES_PER_NODE = 5;
const ORE_RESPAWN_SECONDS = 60;
const MINERAL_TABLE: Array<{ name: MineralType; limit: number; color: number; chance: number }> = [
  { name: '다이아몬드', limit: 0.15, color: 0x67e8f9, chance: 15 },
  { name: '루비', limit: 0.35, color: 0xe11d48, chance: 20 },
  { name: '사파이어', limit: 0.55, color: 0x2563eb, chance: 20 },
  { name: '토파즈', limit: 0.75, color: 0xf59e0b, chance: 20 },
  { name: '부싯돌', limit: 1, color: 0x374151, chance: 25 },
];
const UPGRADE_TITLES = [
  { name: '기본', medal: '🔵', border: 0x0ea5e9, text: '#7dd3fc' },
  { name: 'BRONZE', medal: '🥉', border: 0xb87333, text: '#fdba74' },
  { name: 'SILVER', medal: '🥈', border: 0xc0c0c0, text: '#e2e8f0' },
  { name: 'GOLD', medal: '🥇', border: 0xffd700, text: '#fde047' },
] as const;

export class OceanScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private submarineSprite!: Phaser.GameObjects.Image;
  private fleet = newFleet();
  private submarinePanel?: SubmarinePanel;
  private facing = 1;
  private aimDirection = { x: 1, y: 0 };
  private speed = 250;
  private readonly bulletDamage = 1;
  private attackMultiplier = 1;
  private defenseMultiplier = 1;
  private rapidFireMultiplier = 1;
  private bulletSpeedMultiplier = 1;
  private autoFireEnabled = true;
  private regenAmount = 0;
  private regenInterval = 0;
  private regenTimer = 0;
  private readonly maxHp = 250;
  private playerHp = 250;
  private playerInvuln = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyF!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;
  private keyG!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyB!: Phaser.Input.Keyboard.Key;
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyEnter!: Phaser.Input.Keyboard.Key;
  private keyNumbers: Phaser.Input.Keyboard.Key[] = [];

  private readonly audio = new GameAudio();

  private zoneIndex = 0;
  private level = 1;
  private maxLevel = BASE_MAX_LEVEL;
  private maxLevelExpanded = false;
  private bag: string[] = [];
  private readonly maxBag = 12;
  private readonly maxFishPerZone = 12;

  private bgGraphics!: Phaser.GameObjects.Graphics;
  private decoGraphics!: Phaser.GameObjects.Graphics;
  private bubbles: Phaser.GameObjects.Arc[] = [];
  private fishList: FishEntity[] = [];
  private bullets: BulletEntity[] = [];

  private hudText!: Phaser.GameObjects.Text;
  private bagText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private mineralText!: Phaser.GameObjects.Text;
  private noticeText!: Phaser.GameObjects.Text;
  private noticeTimer = 0;
  private aiming = false;
  private touchAimEnabled = false;
  private aimBtnBg!: Phaser.GameObjects.Arc;
  private aimBtnText!: Phaser.GameObjects.Text;
  private aimLockedUntilRelease = false;
  private aimGraphics!: Phaser.GameObjects.Graphics;
  private aimText!: Phaser.GameObjects.Text;

  // 가상 조이스틱 & 터치 액션 버튼 (모바일/태블릿 멀티터치 대응)
  private joyBase!: Phaser.GameObjects.Arc;
  private joyThumb!: Phaser.GameObjects.Arc;
  private joyLabel!: Phaser.GameObjects.Text;
  private joyPointerId: number | null = null;
  private joyCenter = { x: 96, y: 0 };
  private joyVec = { x: 0, y: 0 };
  private readonly joyRadius = 54;

  private shootBtnBg!: Phaser.GameObjects.Arc;
  private shootBtnText!: Phaser.GameObjects.Text;
  private shootPointerId: number | null = null;
  private shootHolding = false;

  private collectBtnBg!: Phaser.GameObjects.Arc;
  private collectBtnText!: Phaser.GameObjects.Text;

  private tankBtnBg!: Phaser.GameObjects.Arc;
  private tankBtnText!: Phaser.GameObjects.Text;

  private harvestBtnBg!: Phaser.GameObjects.Rectangle;
  private harvestBtnText!: Phaser.GameObjects.Text;
  private mineBtnBg!: Phaser.GameObjects.Rectangle;
  private mineBtnText!: Phaser.GameObjects.Text;
  private oreNodes: OreNode[] = [];
  private nearbyOre?: OreNode;
  private mineralInventory: Record<MineralType, number> = {
    다이아몬드: 0,
    루비: 0,
    사파이어: 0,
    토파즈: 0,
    부싯돌: 0,
  };

  private dragonState: DragonState = 'sleeping';
  private dragonHp = DRAGON_MAX_HP;
  private dragonHarvests = 0;
  private dragonRespawnRemaining = 0;
  private dragonAttackCooldown = 3;
  private lastDragonAttack?: DragonAttack;
  private dragonSprite?: Phaser.GameObjects.Image;
  private dragonStatusText?: Phaser.GameObjects.Text;
  private dragonRespawnText?: Phaser.GameObjects.Text;
  private dragonDanger?: DragonDangerZone;
  private dragonDangerGraphics!: Phaser.GameObjects.Graphics;
  private dragonDangerText!: Phaser.GameObjects.Text;
  private dragonBossBar!: Phaser.GameObjects.Graphics;
  private dragonBossText!: Phaser.GameObjects.Text;
  private dragonLoot: string[] = [];
  private dragonPassUnlocked = false;
  private helicoprion!: HelicoprionBoss;
  private abyssDragon!: AbyssDragonBoss;
  private auraTimer = 0;

  private menuMode: MenuMode = null;
  private menuStage = 0;
  private menuInputLockedUntil = 0;
  private menuObjects: Phaser.GameObjects.GameObject[] = [];
  private menuTargets: Array<{ bounds: Phaser.Geom.Rectangle; action: () => void }> = [];
  private pendingZoneTransition?: { zoneIndex: number; spawnY: number };
  private completedUpgradeStages = new Set<number>();
  private upgradeRanks: Record<'rapid' | 'defense' | 'attack', number> = {
    rapid: 0,
    defense: 0,
    attack: 0,
  };

  private pauseControls?: PauseControls;
  private savedGame = readSave();

  private spawnTimer = 0;
  private shootCooldown = 0;
  private armorRemaining = 0;
  private shockCooldown = 0;
  private shockBtnBg!: Phaser.GameObjects.Arc;
  private shockBtnText!: Phaser.GameObjects.Text;
  private breathGraphics!: Phaser.GameObjects.Graphics;
  private armorGraphics!: Phaser.GameObjects.Graphics;
  private breathDamageTimer = 0;

  constructor() {
    super('OceanScene');
  }

  preload() {
    for (const sub of SUBMARINES) this.load.svg(`submarine-${sub.id}`, submarineImage(sub), { width: 128, height: 76 });
    for (const [key, dataUrl] of Object.entries(FISH_SPRITES)) {
      if (key === 'rock_bream') continue;
      if (!this.textures.exists(key)) {
        this.load.image(key, dataUrl);
      }
    }
    if (!this.textures.exists('rock_bream')) {
      this.load.image('rock_bream', ROCK_BREAM_SPRITE);
    }
    const assetBase = 'assets/boss';
    this.load.image('water_dragon_boss', `${assetBase}/water-dragon-boss.png`);
    this.load.image('water_dragon_skull', `${assetBase}/water-dragon-skull.png`);
    this.load.image('water_dragon_scales', `${assetBase}/water-dragon-scales.png`);
    HelicoprionBoss.preload(this);
    AbyssDragonBoss.preload(this);
    for (const [key, file] of Object.entries(GLACIAL_FISH_FILES)) this.load.image(key, `assets/fish/glacial-${file}.png`);
    for (const { key } of UNDERWORLD_2F_FISH) this.load.image(key, `assets/fish/${key}.png`);
  }

  create() {
    const { width, height } = this.scale;
    this.input.addPointer(3);
    this.audio.setZone(this.zoneIndex);

    this.bgGraphics = this.add.graphics();
    this.decoGraphics = this.add.graphics();

    for (let i = 0; i < 22; i++) {
      const bubble = this.add.circle(
        Phaser.Math.Between(16, width - 16),
        Phaser.Math.Between(40, height - 20),
        Phaser.Math.Between(2, 5),
        0xbae6fd,
        0.3
      );
      this.bubbles.push(bubble);
    }

    this.player = this.add.container(width / 2, 160);
    this.submarineSprite = this.add.image(0, 0, `submarine-${this.fleet.equipped}`).setDisplaySize(62, 37);
    this.player.add(this.submarineSprite);
    this.player.setDepth(10);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
      this.keyG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G);
      this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.keyNumbers = [
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
      ];
    }

    this.hudText = this.add
      .text(14, 14, '', {
        fontSize: '15px',
        color: '#f0f9ff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 12, 23, 0.65)',
        padding: { x: 10, y: 6 },
      })
      .setDepth(30);

    this.bagText = this.add
      .text(14, 48, '', {
        fontSize: '13px',
        color: '#fde047',
        backgroundColor: 'rgba(2, 12, 23, 0.65)',
        padding: { x: 10, y: 5 },
      })
      .setDepth(30);

    this.statsText = this.add
      .text(14, 80, '', {
        fontSize: '12px',
        color: '#e0f2fe',
        backgroundColor: 'rgba(2, 12, 23, 0.65)',
        padding: { x: 10, y: 4 },
      })
      .setDepth(30);

    this.mineralText = this.add
      .text(14, 110, '', {
        fontSize: '12px',
        color: '#fef3c7',
        backgroundColor: 'rgba(2, 12, 23, 0.72)',
        padding: { x: 10, y: 4 },
      })
      .setDepth(30)
      .setVisible(false);

    this.noticeText = this.add
      .text(width / 2, height - 175, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        padding: { x: 12, y: 8 },
        align: 'center',
        wordWrap: { width: Math.max(260, width - 40) },
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setVisible(false);

    this.aimGraphics = this.add.graphics().setDepth(34).setVisible(false);
    this.aimText = this.add
      .text(0, 0, '🎯 조준 중 · 조이스틱/방향키 · 발사하면 해제', {
        fontSize: '13px',
        color: '#fef08a',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 6, 23, 0.84)',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(35)
      .setVisible(false);

    this.dragonDangerGraphics = this.add.graphics().setDepth(7);
    this.dragonDangerText = this.add
      .text(0, 0, '⚠️ ! 위험', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(220, 38, 38, 0.9)',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(9)
      .setVisible(false);
    this.dragonBossBar = this.add.graphics().setDepth(31);
    this.dragonBossText = this.add
      .text(width / 2, 84, '', { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(32)
      .setVisible(false);

    this.helicoprion = new HelicoprionBoss(this, this.audio, {
      player: () => ({ x: this.player.x, y: this.player.y }),
      damagePlayer: (amount, attacker) => this.damagePlayer(amount, attacker),
      showNotice: message => this.showNotice(message),
      setHarvestButton: visible => {
        this.harvestBtnBg.setVisible(visible);
        this.harvestBtnText.setVisible(visible);
      },
      addLoot: item => {
        this.dragonLoot.push(item);
        this.updateHud();
      },
    });

    this.abyssDragon = new AbyssDragonBoss(this, this.audio, {
      player: () => ({ x: this.player.x, y: this.player.y }),
      damagePlayer: (amount, attacker, ignoreInvuln) => this.damagePlayer(amount, attacker, false, ignoreInvuln),
      showNotice: message => this.showNotice(message),
      setHarvestButton: visible => {
        this.harvestBtnBg.setVisible(visible);
        this.harvestBtnText.setVisible(visible);
      },
      addLoot: item => {
        this.dragonLoot.push(item);
        this.updateHud();
      },
    });

    this.pauseControls = new PauseControls({
      pause: () => {
        this.resetHeldInput();
        this.audio.setPaused(true);
        this.scene.pause();
      },
      resume: () => {
        this.resetHeldInput();
        this.audio.setPaused(false);
        this.scene.resume();
      },
      save: () => {
        const data = this.captureSave();
        const saved = writeSave(data);
        if (saved) this.savedGame = { data, error: null };
        return saved;
      },
    });
    this.submarinePanel = new SubmarinePanel(this.fleet, inventoryResources(this.mineralInventory, this.dragonLoot), {
      open: () => this.pauseControls?.openOverlay() ?? false,
      close: () => this.pauseControls?.closeOverlay(),
      select: id => this.selectSubmarine(id),
    });
    this.breathGraphics = this.add.graphics().setDepth(8);
    this.armorGraphics = this.add.graphics().setDepth(11);
    this.createControls();
    this.setupMultiTouchInput();
    this.layoutUI(width, height);

    const unlockAudio = () => this.audio.unlock();
    this.input.keyboard?.on('keydown', unlockAudio);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', unlockAudio);
      this.submarinePanel?.destroy();
      this.pauseControls?.destroy();
      this.scale.off('resize', onResize);
      this.audio.destroy();
    });

    const onResize = (gameSize: Phaser.Structs.Size) => {
      this.layoutUI(gameSize.width, gameSize.height);
    };
    this.scale.on('resize', onResize);

    if (this.zoneIndex === DRAGON_ZONE_INDEX) this.ensureDragonVisual();
    else this.spawnFishWave(6);
    this.updateHud();
    this.showStartMenu();
  }

  private selectSubmarine(id: string): string | null {
    const previous = { fleet: this.fleet, minerals: this.mineralInventory, loot: this.dragonLoot };
    const result = craftOrEquip(this.fleet, inventoryResources(this.mineralInventory, this.dragonLoot), id);
    if (result.error) return result.error;
    this.fleet = result.state;
    this.mineralInventory = { ...previous.minerals };
    for (const name of Object.keys(this.mineralInventory) as MineralType[]) this.mineralInventory[name] = result.resources[name];
    let skulls = result.resources['수룡의 머리뼈'];
    let scales = result.resources['수룡의 비늘'];
    this.dragonLoot = previous.loot.filter(name => {
      if (name === '수룡의 머리뼈') return skulls-- > 0;
      if (name === '수룡의 비늘') return scales-- > 0;
      return true;
    });
    const data = this.captureSave();
    if (!writeSave(data)) {
      this.fleet = previous.fleet;
      this.mineralInventory = previous.minerals;
      this.dragonLoot = previous.loot;
      return '저장하지 못해 제작·교체를 취소했어요. 재료는 사용되지 않았어요.';
    }
    this.savedGame = { data, error: null };
    this.applySubmarine();
    this.updateHud();
    return null;
  }

  private applySubmarine() {
    const sub = getSubmarine(this.fleet.equipped);
    this.submarineSprite?.setTexture(`submarine-${sub.id}`).setDisplaySize(62, 37);
    this.speed = 250 * sub.speed;
    this.submarinePanel?.update(this.fleet, inventoryResources(this.mineralInventory, this.dragonLoot));
    this.breathGraphics?.clear();
    this.shootBtnText?.setText(this.fleet.equipped === 'baby_dragon' ? '🐉\n브레스' : '🔫\n발사');
    this.updateShockButton();
  }

  /** 잠수함 재료에 맞는 작은 효과(다이아몬드 반짝임, 불티, 눈송이, 전기 불꽃 등)를 주변에 띄웁니다. */
  private updateSubmarineAura(dt: number) {
    this.auraTimer -= dt;
    if (this.auraTimer > 0) return;
    const id = this.fleet.equipped;
    const back = -this.facing;
    const px = this.player.x;
    const py = this.player.y;
    const rand = Phaser.Math.FloatBetween;
    const fade = (obj: Phaser.GameObjects.Shape | Phaser.GameObjects.Text, dx: number, dy: number, ms: number, scale = 1) => {
      obj.setDepth(9);
      this.tweens.add({ targets: obj, x: obj.x + dx, y: obj.y + dy, alpha: 0, scale, duration: ms, ease: 'Sine.easeOut', onComplete: () => obj.destroy() });
    };
    switch (id) {
      case 'metal': {
        this.auraTimer = 0.09;
        const color = Phaser.Utils.Array.GetRandom([0xffffff, 0xa5f3fc, 0xf5d0fe, 0xfde68a, 0xbae6fd]);
        const star = this.add.star(px + rand(-30, 30), py + rand(-18, 18), 4, 1, rand(3.5, 6), color).setAngle(rand(0, 45));
        star.setScale(0.2);
        this.tweens.add({ targets: star, scale: 1, angle: star.angle + 45, duration: 220, yoyo: true, onComplete: () => star.destroy() });
        star.setDepth(11);
        break;
      }
      case 'fire': {
        this.auraTimer = 0.05;
        const ember = this.add.circle(px + back * rand(28, 34), py + rand(-3, 3), rand(2.5, 4.5), Phaser.Utils.Array.GetRandom([0xfde047, 0xf97316, 0xef4444]));
        fade(ember, back * rand(14, 30), rand(-14, -4), rand(320, 520), 0.3);
        break;
      }
      case 'ice': {
        this.auraTimer = 0.16;
        const flake = this.add.text(px + rand(-28, 28), py + rand(-16, 16), '*', { fontSize: `${Math.round(rand(10, 15))}px`, color: '#f0f9ff', fontStyle: 'bold' }).setOrigin(0.5);
        fade(flake, back * rand(8, 18), rand(8, 18), rand(700, 1000), 0.6);
        break;
      }
      case 'electric': {
        this.auraTimer = 0.14;
        const angle = rand(0, Math.PI * 2);
        const spark = this.add.line(0, 0, 0, 0, rand(6, 11), 0, 0xfef08a).setLineWidth(2).setOrigin(0, 0.5)
          .setPosition(px + Math.cos(angle) * 22, py + Math.sin(angle) * 14).setRotation(angle);
        fade(spark, Math.cos(angle) * 8, Math.sin(angle) * 8, 160);
        break;
      }
      case 'baby_dragon': {
        this.auraTimer = 0.2;
        const bubble = this.add.circle(px + this.facing * rand(22, 30), py + rand(-14, -4), rand(2, 3.5), 0xcffafe, 0.85).setStrokeStyle(1, 0x67e8f9);
        fade(bubble, rand(-4, 4), -rand(18, 30), rand(700, 1000), 0.6);
        break;
      }
      case 'sturdy': {
        this.auraTimer = 0.22;
        const grit = this.add.rectangle(px + back * rand(26, 32), py + rand(4, 12), 3, 3, 0x71717a).setAngle(rand(0, 90));
        fade(grit, back * rand(4, 10), rand(10, 18), 600);
        break;
      }
      default: {
        this.auraTimer = 0.3;
        const bubble = this.add.circle(px + back * rand(28, 32), py + rand(-2, 4), rand(1.5, 2.8), 0xbae6fd, 0.8);
        fade(bubble, back * rand(6, 12), -rand(14, 22), 800);
      }
    }
  }

  private resetHeldInput() {
    this.joyPointerId = null;
    this.joyVec = { x: 0, y: 0 };
    this.shootPointerId = null;
    this.shootHolding = false;
    this.joyThumb?.setPosition(this.joyCenter.x, this.joyCenter.y);
    this.shootBtnBg?.setScale(1);
    this.input.keyboard?.resetKeys();
    this.touchAimEnabled = false;
    this.aimLockedUntilRelease = false;
    this.setAiming(false);
    this.breathGraphics?.clear();
  }

  private captureSave(): SaveGame {
    const { width, height } = this.scale;
    return {
      combat: { armorRemaining: this.armorRemaining, shockCooldown: this.shockCooldown },
      progress: { maxLevelExpanded: this.maxLevelExpanded, dragonPassUnlocked: this.dragonPassUnlocked },
      submarines: { ...this.fleet, owned: [...this.fleet.owned] },
      version: 1, savedAt: Date.now(), zoneIndex: this.zoneIndex, level: this.level,
      player: { x: this.player.x / width, y: this.player.y / height, facing: this.facing, hp: this.playerHp },
      bag: [...this.bag], dragonLoot: [...this.dragonLoot], minerals: { ...this.mineralInventory },
      upgrades: { ...this.upgradeRanks }, completedStages: [...this.completedUpgradeStages],
      stats: {
        attack: this.attackMultiplier, defense: this.defenseMultiplier, rapid: this.rapidFireMultiplier,
        bulletSpeed: this.bulletSpeedMultiplier, autoFire: this.autoFireEnabled,
        regenAmount: this.regenAmount, regenInterval: this.regenInterval, regenTimer: this.regenTimer,
      },
      dragon: { state: this.dragonState, hp: this.dragonHp, harvests: this.dragonHarvests,
        respawn: this.dragonRespawnRemaining, cooldown: this.dragonAttackCooldown },
      helicoprion: this.helicoprion.snapshot(),
      abyssDragon: this.abyssDragon.snapshot(),
      ores: this.oreNodes.map(ore => ({ id: ore.id, remaining: ore.remaining, respawn: ore.respawnRemaining })),
      menu: { stage: this.menuStage, upgrading: this.menuMode === 'upgrade',
        nextZone: this.pendingZoneTransition?.zoneIndex ?? null,
        spawnY: (this.pendingZoneTransition?.spawnY ?? 56) / height },
    };
  }

  private restoreSave(save: SaveGame) {
    this.resetHeldInput();
    this.destroyMenu();
    this.menuMode = null;
    this.fleet = save.submarines ? { ...save.submarines, owned: [...save.submarines.owned] } : newFleet();
    this.applySubmarine();
    this.armorRemaining = save.combat?.armorRemaining ?? 0;
    this.shockCooldown = save.combat?.shockCooldown ?? 0;
    // 진행 플래그는 changeZone보다 먼저 복원해야 레벨 확장 알림이 다시 뜨지 않습니다.
    const progress = resolveProgress(save);
    this.maxLevelExpanded = progress.maxLevelExpanded;
    this.maxLevel = progress.maxLevelExpanded ? EXPANDED_MAX_LEVEL : BASE_MAX_LEVEL;
    this.dragonPassUnlocked = progress.dragonPassUnlocked;
    this.level = save.level;
    this.playerHp = save.player.hp;
    this.bag = [...save.bag];
    this.dragonLoot = [...save.dragonLoot];
    for (const mineral of MINERAL_TABLE) this.mineralInventory[mineral.name] = save.minerals[mineral.name];
    this.upgradeRanks = { ...save.upgrades };
    this.completedUpgradeStages = new Set(save.completedStages);
    const stats = save.stats;
    this.attackMultiplier = stats.attack;
    this.defenseMultiplier = stats.defense;
    this.rapidFireMultiplier = stats.rapid;
    this.bulletSpeedMultiplier = stats.bulletSpeed;
    this.autoFireEnabled = stats.autoFire;
    this.regenAmount = stats.regenAmount;
    this.regenInterval = stats.regenInterval;
    this.regenTimer = stats.regenTimer;
    this.dragonState = save.dragon.state as DragonState;
    this.dragonHp = save.dragon.hp;
    this.dragonHarvests = save.dragon.harvests;
    this.dragonRespawnRemaining = save.dragon.respawn;
    // Telegraphs and bullets are transient. Give the player time to react after loading.
    this.clearDragonDanger();
    this.dragonAttackCooldown = Math.max(3, save.dragon.cooldown);
    if (this.dragonState === 'dead' && this.dragonHarvests >= 3) {
      this.dragonState = 'respawning';
      this.dragonRespawnRemaining = DRAGON_RESPAWN_SECONDS;
    }
    this.oreNodes = save.ores.map(ore => ({ id: ore.id as OreNode['id'], x: 0, y: 0,
      remaining: ore.remaining, respawnRemaining: ore.respawn }));
    // 둥지에서 이어하면 보스전이 다시 시작되며 첫 공격 전 대기시간을 줍니다.
    this.helicoprion.leave();
    this.helicoprion.load(save.helicoprion);
    this.abyssDragon.leave();
    this.abyssDragon.load(save.abyssDragon);
    const { width, height } = this.scale;
    this.changeZone(save.zoneIndex, Phaser.Math.Clamp(save.player.y * height, 28, height - 28), false);
    this.player.x = Phaser.Math.Clamp(save.player.x * width, 24, width - 24);
    this.facing = save.player.facing;
    this.player.scaleX = this.facing;
    this.aimDirection = { x: this.facing, y: 0 };
    this.playerInvuln = 2;
    this.pauseControls?.setActive(true);
    this.submarinePanel?.setActive(true);
    if (save.menu.upgrading) {
      this.showUpgradeMenu(save.menu.stage, save.menu.nextZone === null ? undefined : {
        zoneIndex: save.menu.nextZone, spawnY: save.menu.spawnY * height,
      });
    }
    this.showNotice('저장한 모험을 이어합니다! 물고기는 다시 배치되고 2초간 보호됩니다.');
    this.updateHud();
  }

  private createControls() {
    // 왼쪽 가상 조이스틱
    this.joyBase = this.add
      .circle(0, 0, this.joyRadius, 0x0f172a, 0.45)
      .setStrokeStyle(3, 0x38bdf8, 0.75)
      .setDepth(35);

    this.joyThumb = this.add
      .circle(0, 0, 24, 0x38bdf8, 0.85)
      .setStrokeStyle(2, 0xe0f2fe, 0.95)
      .setDepth(36);

    this.joyLabel = this.add
      .text(0, 0, '조이스틱', {
        fontSize: '11px',
        color: '#bae6fd',
      })
      .setOrigin(0.5)
      .setDepth(36);

    // 오른쪽 터치 발사 버튼 (누르고 있으면 연속 발사)
    this.shootBtnBg = this.add
      .circle(0, 0, 42, 0x0284c7, 0.85)
      .setStrokeStyle(3, 0x7dd3fc, 0.95)
      .setDepth(35);

    this.shootBtnText = this.add
      .text(0, 0, '🔫\n발사', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(36);

    // 한 번 터치해 조준하고, 조이스틱으로 방향을 바꾼 뒤 발사합니다.
    this.aimBtnBg = this.add.circle(0, 0, 30, 0x334155, 0.95)
      .setStrokeStyle(2, 0xfde047, 0.95)
      .setDepth(35);
    this.aimBtnText = this.add.text(0, 0, '🎯\n조준', {
      fontSize: '12px', color: '#fef08a', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setDepth(36);

    this.shockBtnBg = this.add.circle(0, 0, 32, 0x334155, 0.95)
      .setStrokeStyle(2, 0xfde047).setDepth(35).setVisible(false);
    this.shockBtnText = this.add.text(0, 0, '⚡ B\n전기일격', {
      fontSize: '11px', color: '#fef08a', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setDepth(36).setVisible(false);

    // 수집 버튼 (F)
    this.collectBtnBg = this.add
      .circle(0, 0, 32, 0xfacc15, 0.9)
      .setStrokeStyle(2, 0xfef08a, 0.95)
      .setDepth(35);

    this.collectBtnText = this.add
      .text(0, 0, 'F\n수집', {
        fontSize: '12px',
        color: '#0f172a',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(36);

    // 수조 버튼 (T)
    this.tankBtnBg = this.add
      .circle(0, 0, 32, 0x0f766e, 0.9)
      .setStrokeStyle(2, 0x5eead4, 0.95)
      .setDepth(35);

    this.tankBtnText = this.add
      .text(0, 0, '🪣\n수조(T)', {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(36);

    this.harvestBtnBg = this.add
      .rectangle(0, 0, 118, 46, 0x7f1d1d, 0.95)
      .setStrokeStyle(3, 0xfca5a5, 1)
      .setDepth(35)
      .setVisible(false);
    this.harvestBtnText = this.add
      .text(0, 0, '🗡️ 갈무리 (G)', {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(36)
      .setVisible(false);

    this.mineBtnBg = this.add
      .rectangle(0, 0, 128, 48, 0xb45309, 0.96)
      .setStrokeStyle(3, 0xfde68a, 1)
      .setDepth(35)
      .setVisible(false);
    this.mineBtnText = this.add
      .text(0, 0, '⛏️ 광질 (E)', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(36)
      .setVisible(false);
  }

  private setupMultiTouchInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.audio.unlock();
      const px = pointer.x;
      const py = pointer.y;

      if (this.menuMode) {
        if (this.time.now < this.menuInputLockedUntil) return;
        const target = this.menuTargets.find((item) => item.bounds.contains(px, py));
        target?.action();
        return;
      }

      if (this.shockBtnBg.visible && Phaser.Math.Distance.Between(px, py, this.shockBtnBg.x, this.shockBtnBg.y) <= 34) {
        this.tryElectricShock();
        return;
      }

      if (Phaser.Math.Distance.Between(px, py, this.aimBtnBg.x, this.aimBtnBg.y) <= 34) {
        this.toggleTouchAim();
        return;
      }

      if (
        this.harvestBtnBg.visible &&
        Phaser.Geom.Rectangle.Contains(this.harvestBtnBg.getBounds(), px, py)
      ) {
        this.harvestBtnBg.setScale(0.94);
        this.time.delayedCall(120, () => this.harvestBtnBg.setScale(1));
        this.tryHarvest();
        return;
      }

      if (this.mineBtnBg.visible && Phaser.Geom.Rectangle.Contains(this.mineBtnBg.getBounds(), px, py)) {
        this.mineBtnBg.setScale(0.94);
        this.time.delayedCall(120, () => this.mineBtnBg.setScale(1));
        this.tryMineNearbyOre();
        return;
      }

      // 1) 발사 버튼 체크
      if (Phaser.Math.Distance.Between(px, py, this.shootBtnBg.x, this.shootBtnBg.y) <= 48) {
        this.shootPointerId = pointer.id;
        this.shootHolding = true;
        this.shootBtnBg.setScale(0.92);
        this.fireBullet();
        return;
      }

      // 2) 수집 버튼 체크
      if (Phaser.Math.Distance.Between(px, py, this.collectBtnBg.x, this.collectBtnBg.y) <= 38) {
        this.collectBtnBg.setScale(0.9);
        this.time.delayedCall(120, () => this.collectBtnBg.setScale(1));
        this.tryCollectNearbyFish();
        return;
      }

      // 3) 수조 버튼 체크
      if (Phaser.Math.Distance.Between(px, py, this.tankBtnBg.x, this.tankBtnBg.y) <= 38) {
        this.tankBtnBg.setScale(0.9);
        this.time.delayedCall(120, () => this.tankBtnBg.setScale(1));
        this.emptyBagToTank();
        return;
      }

      // 4) 조이스틱 영역 (화면 왼쪽 절반 또는 조이스틱 근처 터치 시 작동)
      const distToJoy = Phaser.Math.Distance.Between(px, py, this.joyCenter.x, this.joyCenter.y);
      if (this.joyPointerId === null && (distToJoy <= this.joyRadius * 1.8 || px < this.scale.width * 0.5)) {
        this.joyPointerId = pointer.id;
        this.updateJoystick(px, py);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joyPointerId && pointer.isDown) {
        this.updateJoystick(pointer.x, pointer.y);
      }
    });

    const releasePointer = (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.joyPointerId) {
        this.joyPointerId = null;
        this.joyVec.x = 0;
        this.joyVec.y = 0;
        this.joyThumb.setPosition(this.joyCenter.x, this.joyCenter.y);
      }
      if (pointer.id === this.shootPointerId) {
        this.shootPointerId = null;
        this.shootHolding = false;
        this.shootBtnBg.setScale(1);
      }
    };

    this.input.on('pointerup', releasePointer);
    this.input.on('pointerupoutside', releasePointer);
  }

  private updateJoystick(px: number, py: number) {
    const dx = px - this.joyCenter.x;
    const dy = py - this.joyCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 4) {
      this.joyVec.x = 0;
      this.joyVec.y = 0;
      this.joyThumb.setPosition(this.joyCenter.x, this.joyCenter.y);
      return;
    }

    const clamped = Math.min(dist, this.joyRadius);
    const nx = dx / dist;
    const ny = dy / dist;

    this.joyThumb.setPosition(this.joyCenter.x + nx * clamped, this.joyCenter.y + ny * clamped);
    const strength = clamped / this.joyRadius;
    this.joyVec.x = nx * strength;
    this.joyVec.y = ny * strength;
  }

  private toggleTouchAim() {
    this.touchAimEnabled = !this.touchAimEnabled;
    // 조준을 켤 때 연사 중이던 손가락은 놓은 것으로 처리합니다.
    // 다음 발사 터치 전까지 정밀 사격이 자동으로 나가지 않게 합니다.
    if (this.touchAimEnabled) {
      this.shootPointerId = null;
      this.shootHolding = false;
      this.shootBtnBg.setScale(1);
    }
    this.updateAimingInput();
  }

  private updateAimingInput() {
    const zDown = Boolean(this.keyZ?.isDown);
    if (!zDown) this.aimLockedUntilRelease = false;
    this.setAiming(this.touchAimEnabled || (zDown && !this.aimLockedUntilRelease));
  }

  private setAiming(active: boolean) {
    if (this.aiming === active) return;
    this.aiming = active;
    this.aimBtnBg?.setFillStyle(active ? 0xa16207 : 0x334155, 0.95);
    this.aimBtnText?.setText(active ? '🎯\n조준 중' : '🎯\n조준');
    const timeScale = active ? 0.25 : 1;
    this.tweens.timeScale = timeScale;
    this.time.timeScale = timeScale;
    this.aimGraphics.setVisible(active);
    this.aimText.setVisible(active);
    if (!active) this.aimGraphics.clear();
  }

  private releaseAimAfterShot() {
    if (!this.aiming) return;
    this.touchAimEnabled = false;
    this.aimLockedUntilRelease = true;
    this.setAiming(false);
  }

  private drawAimGuide() {
    if (!this.aiming) return;
    const length = Math.hypot(this.scale.width, this.scale.height);
    const endX = this.player.x + this.aimDirection.x * length;
    const endY = this.player.y + this.aimDirection.y * length;
    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(8, 0x0f172a, 0.5);
    this.aimGraphics.lineBetween(this.player.x, this.player.y, endX, endY);
    this.aimGraphics.lineStyle(3, 0xfde047, 0.95);
    this.aimGraphics.lineBetween(this.player.x, this.player.y, endX, endY);
    this.aimGraphics.fillStyle(0xfef08a, 1);
    this.aimGraphics.fillCircle(this.player.x + this.aimDirection.x * 52, this.player.y + this.aimDirection.y * 52, 6);
    this.aimText.setPosition(this.scale.width / 2, Math.max(174, this.scale.height * 0.18));
  }

  private destroyMenu() {
    for (const object of this.menuObjects) object.destroy();
    this.menuObjects = [];
    this.menuTargets = [];
  }

  private addMenuObject<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.menuObjects.push(object);
    return object;
  }

  private showStartMenu() {
    this.menuMode = 'start';
    this.menuInputLockedUntil = this.time.now + 250;
    this.pendingZoneTransition = undefined;
    this.rebuildMenu();
  }

  private showUpgradeMenu(stage: number, pendingZone?: { zoneIndex: number; spawnY: number }) {
    this.pauseControls?.setActive(true);
    this.submarinePanel?.setActive(true);
    this.resetHeldInput();
    this.menuMode = 'upgrade';
    this.menuInputLockedUntil = this.time.now + 250;
    this.menuStage = Phaser.Math.Clamp(stage, 0, 3);
    this.pendingZoneTransition = pendingZone;
    this.rebuildMenu();
  }

  private rebuildMenu() {
    this.destroyMenu();
    if (!this.menuMode) return;
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.96).setDepth(100);
    this.addMenuObject(overlay);

    if (this.menuMode === 'start') {
      const compact = height < 520;
      const title = this.add
        .text(width / 2, height * (compact ? 0.16 : 0.28), '🌊 서바이벌오션', {
          fontSize: `${Math.max(30, Math.min(54, width * 0.085))}px`,
          color: '#7dd3fc',
          fontStyle: 'bold',
          align: 'center',
          stroke: '#082f49',
          strokeThickness: 7,
        })
        .setOrigin(0.5)
        .setDepth(101);
      const subtitle = this.add
        .text(width / 2, height * (compact ? 0.30 : 0.39), '바다를 탐험하고 물고기를 수집하세요!\n구역마다 한 번씩 새로운 강화를 고를 수 있습니다.', {
          fontSize: `${Math.max(14, Math.min(21, width * 0.034))}px`,
          color: '#e0f2fe',
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: Math.max(280, width - 50) },
        })
        .setOrigin(0.5)
        .setDepth(101);
      const buttonWidth = Math.min(360, width - 54);
      const saved = this.savedGame.data;
      const buttonY = height * (saved ? (compact ? 0.77 : 0.71) : 0.59);
      const button = this.add
        .rectangle(width / 2, buttonY, buttonWidth, compact ? 52 : 74, 0x0284c7, 1)
        .setStrokeStyle(4, 0x7dd3fc, 1)
        .setDepth(101);
      const buttonText = this.add
        .text(width / 2, buttonY, saved ? '새 게임 시작' : '서바이벌오션 시작하기', {
          fontSize: `${Math.max(18, Math.min(25, width * 0.045))}px`,
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(102);
      const hint = this.add
        .text(width / 2, buttonY + (compact ? 45 : 62), saved ? '새 게임은 다음 저장 시 기존 저장을 덮어씁니다' : '버튼 터치 또는 Enter', { fontSize: '12px', color: '#94a3b8', wordWrap: { width: buttonWidth }, align: 'center' })
        .setOrigin(0.5)
        .setDepth(101);
      this.menuObjects.push(title, subtitle, button, buttonText, hint);
      this.menuTargets.push({ bounds: button.getBounds(), action: () => this.showUpgradeMenu(0) });
      if (saved) {
        const continueY = height * (compact ? 0.49 : 0.53);
        const continueButton = this.add.rectangle(width / 2, continueY, buttonWidth, compact ? 52 : 64, 0x0f766e)
          .setStrokeStyle(3, 0x5eead4).setDepth(101);
        const continueText = this.add.text(width / 2, continueY, `▶ 이어하기 · Lv.${saved.level}`, {
          fontSize: '21px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(102);
        const savedText = this.add.text(width / 2, continueY + (compact ? 42 : 46),
          `${ZONES[saved.zoneIndex].name} · ${new Date(saved.savedAt).toLocaleString('ko-KR')}`, {
            fontSize: '12px', color: '#a7f3d0', wordWrap: { width: buttonWidth }, align: 'center',
          }).setOrigin(0.5).setDepth(101);
        this.menuObjects.push(continueButton, continueText, savedText);
        this.menuTargets.unshift({ bounds: continueButton.getBounds(), action: () => this.restoreSave(saved) });
      }
      if (this.savedGame.error) {
        const error = this.add.text(width / 2, height * 0.83, this.savedGame.error, {
          fontSize: '13px', color: '#fca5a5', wordWrap: { width: buttonWidth }, align: 'center',
        }).setOrigin(0.5).setDepth(101);
        this.menuObjects.push(error);
      }
      return;
    }

    this.buildUpgradeCards(width, height);
  }

  private getUpgradeCardContent() {
    const rapid = [
      ['난사속도 1.1배', '스페이스바·발사 버튼을 길게 누를 때 조금 더 빠르게 발사'],
      ['난사속도 2배', '연속 발사 속도가 2배로 증가'],
      ['난사속도 4배', '연속 발사 속도가 4배로 증가'],
      ['난사속도 11배', '초고속 연사\n대신 공격력 1/2'],
    ];
    const defense = [
      ['방어력 2배', '받는 피해가 절반으로 감소'],
      ['방어력 4배', '받는 피해 감소\n공격력 2배 추가'],
      ['방어력 5배', '20초마다 체력 5 회복'],
      ['방어력 8배', '10초마다 체력 10 회복'],
    ];
    const attack = [
      ['공격력 2배', '총알 한 발의 공격력이 2배'],
      ['공격력 4배', '총알 한 발의 공격력이 4배'],
      ['공격력 5배', '강력한 총알\n대신 누르기 난사 불가'],
      ['공격력 10배', '최강 공격력\n대신 총알 속도 저하'],
    ];
    const rapidRank = Phaser.Math.Clamp(this.upgradeRanks.rapid, 0, 3);
    const defenseRank = Phaser.Math.Clamp(this.upgradeRanks.defense, 0, 3);
    const attackRank = Phaser.Math.Clamp(this.upgradeRanks.attack, 0, 3);
    return [
      { key: 'rapid', rank: rapidRank, icon: '⚡', title: rapid[rapidRank][0], description: rapid[rapidRank][1], color: '#fde047' },
      { key: 'defense', rank: defenseRank, icon: '🛡️', title: defense[defenseRank][0], description: defense[defenseRank][1], color: '#4ade80' },
      { key: 'attack', rank: attackRank, icon: '⚔️', title: attack[attackRank][0], description: attack[attackRank][1], color: '#fb7185' },
      { key: 'skip', rank: 0, icon: '🚫', title: '강화 포기', description: '“강화 따위 필요 없어!”\n이번 강화를 건너뜁니다', color: '#fb923c' },
    ];
  }

  private buildUpgradeCards(width: number, height: number) {
    const stage = this.menuStage;
    const header = this.add
      .text(width / 2, Math.max(44, height * 0.075), `🌊 강화 선택 ${stage + 1}/4`, {
        fontSize: `${Math.max(22, Math.min(34, width * 0.06))}px`,
        color: '#7dd3fc',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(102);
    const zoneLabel = stage === 0 ? '게임 시작 강화' : `${ZONES[stage].name} 진입 강화`;
    const guide = this.add
      .text(width / 2, Math.max(78, height * 0.13), `${zoneLabel} · 네 가지 중 하나를 고르세요`, {
        fontSize: `${Math.max(13, Math.min(18, width * 0.03))}px`,
        color: '#cbd5e1',
      })
      .setOrigin(0.5)
      .setDepth(102);
    this.menuObjects.push(header, guide);

    const gap = Math.max(10, Math.min(22, width * 0.025));
    const cardWidth = Math.min(310, (width - gap * 3) / 2);
    const availableHeight = height - Math.max(135, height * 0.18) - 40;
    const cardHeight = Math.min(220, Math.max(128, (availableHeight - gap) / 2));
    const gridWidth = cardWidth * 2 + gap;
    const gridHeight = cardHeight * 2 + gap;
    const startX = (width - gridWidth) / 2 + cardWidth / 2;
    const startY = Math.max(130, height * 0.18) + (availableHeight - gridHeight) / 2 + cardHeight / 2;
    const cards = this.getUpgradeCardContent();

    cards.forEach((card, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + column * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);
      const background = this.add
        .rectangle(x, y, cardWidth, cardHeight, 0x0f172a, 0.98)
        .setStrokeStyle(card.rank === 0 ? 4 : 7, UPGRADE_TITLES[card.rank].border, 1)
        .setDepth(101);
      const tier = card.rank === 0 || index === 3 ? '' : `\n${UPGRADE_TITLES[card.rank].name}`;
      const text = this.add
        .text(x, y, `${index + 1}. ${card.icon}\n${card.title}${tier}\n\n${card.description}`, {
          fontSize: `${Math.max(12, Math.min(19, cardWidth * 0.07))}px`,
          color: card.color,
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: 4,
          wordWrap: { width: cardWidth - 20 },
        })
        .setOrigin(0.5)
        .setDepth(102);
      this.menuObjects.push(background, text);
      this.menuTargets.push({
        bounds: background.getBounds(),
        action: () => this.selectUpgrade(card.key as UpgradeChoice),
      });
    });
  }

  private selectUpgrade(choice: UpgradeChoice) {
    const stage = this.menuStage;
    const rank = choice === 'skip' ? 0 : Phaser.Math.Clamp(this.upgradeRanks[choice], 0, 3);
    const message = this.applyUpgrade(choice, rank);
    if (choice !== 'skip') this.upgradeRanks[choice] = Math.min(4, this.upgradeRanks[choice] + 1);
    if (choice === 'skip') this.audio.playDenied();
    else this.audio.playLevelUp();
    this.completedUpgradeStages.add(stage);
    const transition = this.pendingZoneTransition;
    this.menuMode = null;
    this.pendingZoneTransition = undefined;
    this.destroyMenu();
    if (transition) this.changeZone(transition.zoneIndex, transition.spawnY);
    this.showNotice(message);
    this.updateHud();
  }

  private applyUpgrade(choice: UpgradeChoice, rank: number): string {
    if (choice === 'rapid') {
      this.rapidFireMultiplier = [1.1, 2, 4, 11][rank];
      this.autoFireEnabled = true;
      if (rank === 3) this.attackMultiplier *= 0.5;
      return `⚡ 난사 강화 완료! 난사속도 ${this.rapidFireMultiplier}배${rank === 3 ? ' · 공격력 1/2' : ''}`;
    }
    if (choice === 'defense') {
      this.defenseMultiplier = [2, 4, 5, 8][rank];
      if (rank === 1) this.attackMultiplier = Math.max(this.attackMultiplier, 2);
      if (rank === 2) {
        this.regenAmount = 5;
        this.regenInterval = 20;
        this.regenTimer = 20;
      } else if (rank === 3) {
        this.regenAmount = 10;
        this.regenInterval = 10;
        this.regenTimer = 10;
      }
      return `🛡️ 방어 강화 완료! 방어력 ${this.defenseMultiplier}배${rank >= 2 ? ` · ${this.regenInterval}초마다 ${this.regenAmount} 회복` : ''}`;
    }
    if (choice === 'attack') {
      this.attackMultiplier = [2, 4, 5, 10][rank];
      if (rank === 2) this.autoFireEnabled = false;
      if (rank === 3) this.bulletSpeedMultiplier = 0.65;
      return `⚔️ 공격 강화 완료! 공격력 ${this.attackMultiplier}배${rank === 2 ? ' · 난사 불가' : rank === 3 ? ' · 총알 속도 저하' : ''}`;
    }
    return '🚫 이번 강화는 포기했습니다. 현재 능력치를 유지합니다.';
  }

  private requestZoneChange(nextIndex: number, spawnY: number) {
    if (nextIndex <= DRAGON_ZONE_INDEX && nextIndex > this.zoneIndex && !this.completedUpgradeStages.has(nextIndex)) {
      this.showUpgradeMenu(nextIndex, { zoneIndex: nextIndex, spawnY });
      return;
    }
    this.changeZone(nextIndex, spawnY);
  }

  private updateMenuKeyboard() {
    if (!this.menuMode) return;
    if (this.menuMode === 'start' && this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
      if (this.savedGame.data) this.restoreSave(this.savedGame.data);
      else this.showUpgradeMenu(0);
      return;
    }
    if (this.menuMode === 'upgrade') {
      const choices: UpgradeChoice[] = ['rapid', 'defense', 'attack', 'skip'];
      this.keyNumbers.forEach((key, index) => {
        if (Phaser.Input.Keyboard.JustDown(key)) this.selectUpgrade(choices[index]);
      });
    }
  }

  private layoutUI(width: number, height: number) {
    this.drawZoneBackdrop();

    // 조이스틱 위치 (좌측 하단)
    const joyX = Math.max(76, Math.min(115, width * 0.2));
    const joyY = height - 86;
    this.joyCenter = { x: joyX, y: joyY };
    this.joyBase.setPosition(joyX, joyY);
    if (this.joyPointerId === null) {
      this.joyThumb.setPosition(joyX, joyY);
    }
    this.joyLabel.setPosition(joyX, joyY + this.joyRadius + 14);

    // 우측 하단 액션 버튼 클러스터 (발사 / 수집 / 수조)
    const shootX = width - Math.max(66, Math.min(95, width * 0.16));
    const shootY = height - 74;
    this.shootBtnBg.setPosition(shootX, shootY);
    this.shootBtnText.setPosition(shootX, shootY);

    const collectX = shootX - 82;
    const collectY = height - 62;
    this.collectBtnBg.setPosition(collectX, collectY);
    this.collectBtnText.setPosition(collectX, collectY);

    const tankX = shootX - 18;
    const tankY = shootY - 82;
    this.tankBtnBg.setPosition(tankX, tankY);
    this.tankBtnText.setPosition(tankX, tankY);

    const aimX = shootX + 6;
    const aimY = shootY - 164;
    this.aimBtnBg.setPosition(aimX, aimY);
    this.aimBtnText.setPosition(aimX, aimY);

    this.shockBtnBg.setPosition(shootX - 78, aimY);
    this.shockBtnText.setPosition(shootX - 78, aimY);
    this.updateShockButton();

    const harvestX = width / 2;
    const harvestY = height - 82;
    this.harvestBtnBg.setPosition(harvestX, harvestY);
    this.harvestBtnText.setPosition(harvestX, harvestY);
    this.mineBtnBg.setPosition(harvestX, harvestY);
    this.mineBtnText.setPosition(harvestX, harvestY);

    this.noticeText.setPosition(width / 2, height - 170);
    this.noticeText.setWordWrapWidth(Math.max(260, width - 40));

    this.player.x = Phaser.Math.Clamp(this.player.x, 24, width - 24);
    this.player.y = Phaser.Math.Clamp(this.player.y, 24, height - 20);
    this.hudText.setFontSize(width < 640 ? 12 : 15).setWordWrapWidth(Math.max(100, width - 224));
    for (const text of [this.bagText, this.statsText, this.mineralText]) text.setWordWrapWidth(Math.max(200, width - 48));
    this.statsText.setX(14);
    this.mineralText.setX(14);
    this.updateHud();
    this.layoutDragon();
    this.helicoprion?.layout(width, height);
    this.abyssDragon?.layout(width, height);
    this.updateMiningInteraction();
    if (this.menuMode) this.rebuildMenu();
  }

  private ensureDragonVisual() {
    if (this.zoneIndex !== DRAGON_ZONE_INDEX) return;

    if (this.dragonState === 'respawning') {
      if (!this.dragonRespawnText) {
        this.dragonRespawnText = this.add
          .text(0, 0, '', {
            fontSize: '20px',
            color: '#bfdbfe',
            fontStyle: 'bold',
            backgroundColor: 'rgba(2, 12, 23, 0.82)',
            padding: { x: 14, y: 9 },
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(8);
      }
      this.dragonRespawnText.setVisible(true);
      this.layoutDragon();
      return;
    }

    if (!this.dragonSprite) {
      this.dragonSprite = this.add.image(0, 0, 'water_dragon_boss').setDepth(5);
      this.dragonStatusText = this.add
        .text(0, 0, '', {
          fontSize: '16px',
          color: '#e0f2fe',
          fontStyle: 'bold',
          backgroundColor: 'rgba(2, 12, 23, 0.72)',
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(8);
    }
    this.dragonSprite.setVisible(true);
    this.dragonStatusText?.setVisible(true);
    this.dragonRespawnText?.setVisible(false);
    this.applyDragonAppearance();
    this.layoutDragon();
    this.refreshDragonUi();
  }

  private layoutDragon() {
    if (this.zoneIndex !== DRAGON_ZONE_INDEX) return;
    const { width, height } = this.scale;

    if (this.dragonSprite?.visible) {
      const source = this.dragonSprite.texture.getSourceImage() as HTMLImageElement;
      const targetWidth = Math.min(width * 0.64, 620);
      const targetHeight = Math.min(height * 0.58, 500);
      const scale = Math.min(targetWidth / source.width, targetHeight / source.height);
      this.dragonSprite.setScale(scale);
      this.dragonSprite.setPosition(width * 0.64, height * 0.49);
      this.dragonStatusText?.setPosition(this.dragonSprite.x, this.dragonSprite.y - this.dragonSprite.displayHeight * 0.48 - 18);
    }

    this.dragonRespawnText?.setPosition(width * 0.64, height * 0.49);
    this.dragonBossText.setPosition(width / 2, 145);
  }

  private applyDragonAppearance() {
    if (!this.dragonSprite || !this.dragonStatusText) return;
    this.dragonSprite.clearTint();
    this.dragonSprite.setAlpha(1);

    if (this.dragonState === 'sleeping') {
      this.dragonSprite.setTint(0x64748b).setAlpha(0.72);
      this.dragonStatusText.setText('💤 잠든 수룡 · 총알을 맞히면 깨어납니다');
    } else if (this.dragonState === 'awake') {
      this.dragonStatusText.setText('🐉 수룡');
    } else if (this.dragonState === 'dead') {
      this.dragonSprite.setTintFill(0x7b8794).setAlpha(0.92);
      this.dragonStatusText.setText(`☠️ 수룡의 사체 · 갈무리 ${this.dragonHarvests}/3`);
    }
  }

  private wakeDragon() {
    if (this.dragonState !== 'sleeping') return;
    this.dragonState = 'awake';
    this.dragonAttackCooldown = 2.5;
    this.applyDragonAppearance();
    this.showNotice('수룡이 깨어났습니다! 공격 전 붉은 위험 표시에서 벗어나세요!');
  }

  private getDragonHitboxes() {
    if (!this.dragonSprite?.visible) return undefined;
    const sprite = this.dragonSprite;
    const direction = sprite.flipX ? -1 : 1;
    const body = new Phaser.Geom.Rectangle(
      sprite.x - sprite.displayWidth * 0.25,
      sprite.y - sprite.displayHeight * 0.23,
      sprite.displayWidth * 0.5,
      sprite.displayHeight * 0.52
    );
    const head = new Phaser.Geom.Circle(
      sprite.x + direction * sprite.displayWidth * 0.27,
      sprite.y - sprite.displayHeight * 0.12,
      Math.min(sprite.displayWidth * 0.095, sprite.displayHeight * 0.16)
    );
    return { body, head };
  }

  private preventPlayerInsideDragon(previousX: number, previousY: number) {
    if (this.zoneIndex !== DRAGON_ZONE_INDEX || this.dragonState === 'respawning') return;
    const hitboxes = this.getDragonHitboxes();
    if (!hitboxes) return;
    const playerRadius = 21;
    const expandedBody = Phaser.Geom.Rectangle.Clone(hitboxes.body);
    Phaser.Geom.Rectangle.Inflate(expandedBody, playerRadius, playerRadius);
    const expandedHead = new Phaser.Geom.Circle(hitboxes.head.x, hitboxes.head.y, hitboxes.head.radius + playerRadius);
    if (
      Phaser.Geom.Rectangle.Contains(expandedBody, this.player.x, this.player.y) ||
      Phaser.Geom.Circle.Contains(expandedHead, this.player.x, this.player.y)
    ) {
      this.player.setPosition(previousX, previousY);
    }
  }

  private damageDragon(amount: number, critical = false, hitX?: number, hitY?: number) {
    if (this.dragonState === 'sleeping') this.wakeDragon();
    if (this.dragonState !== 'awake') return;
    this.dragonHp = Math.max(0, this.dragonHp - amount);
    this.audio.playHit();
    if (critical && hitX !== undefined && hitY !== undefined) {
      const text = this.add
        .text(hitX, hitY - 10, `크리티컬!  -${Math.round(amount)}`, {
          fontSize: '12px',
          color: '#fde047',
          fontStyle: 'bold',
          stroke: '#7c2d12',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(42);
      this.tweens.add({
        targets: text,
        y: hitY - 42,
        alpha: 0,
        duration: 720,
        ease: 'Cubic.Out',
        onComplete: () => text.destroy(),
      });
    }
    if (this.dragonHp <= 0) this.defeatDragon();
    this.refreshDragonUi();
  }

  private defeatDragon() {
    this.dragonState = 'dead';
    this.dragonHarvests = 0;
    if (this.dragonSprite) {
      this.tweens.killTweensOf(this.dragonSprite);
      this.dragonSprite.setAngle(0);
    }
    this.clearDragonDanger();
    this.audio.playBossVictory();
    this.applyDragonAppearance();
    const firstKill = !this.dragonPassUnlocked;
    // 첫 토벌부터 아래 통로가 영구히 열립니다. 갈무리는 전리품용으로만 남습니다.
    this.dragonPassUnlocked = true;
    this.showNotice(firstKill
      ? '수룡 토벌 성공! 🔓 이제 언제든 빙하수 골짜기로 내려갈 수 있습니다.\n회색 사체 가까이에서 갈무리 버튼을 누르세요. (총 3회)'
      : '수룡 토벌 성공! 회색 사체 가까이에서 갈무리 버튼을 누르세요. (총 3회)');
  }

  private startDragonAttack() {
    if (this.dragonState !== 'awake' || !this.dragonSprite || this.zoneIndex !== DRAGON_ZONE_INDEX) return;
    const { width, height } = this.scale;
    const attacks: DragonAttack[] = ['breath', 'arm', 'tail'];
    const availableAttacks = attacks.filter((candidate) => candidate !== this.lastDragonAttack);
    const attack = Phaser.Utils.Array.GetRandom<DragonAttack>(availableAttacks);
    this.lastDragonAttack = attack;
    const targetX = Phaser.Math.Clamp(this.player.x, 28, width - 28);
    const targetY = Phaser.Math.Clamp(this.player.y, 90, height - 35);
    let shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle | Phaser.Geom.Polygon;

    const headDirection = targetX < this.dragonSprite.x ? -1 : 1;
    this.dragonSprite.setFlipX(headDirection < 0);

    if (attack === 'breath') {
      const mouthX = this.dragonSprite.x + headDirection * this.dragonSprite.displayWidth * 0.28;
      const mouthY = this.dragonSprite.y - this.dragonSprite.displayHeight * 0.12;
      shape = this.createDragonBeam(mouthX, mouthY, targetX, targetY, Math.hypot(width, height) * 1.25, 105);
      const angle = Phaser.Math.RadToDeg(Math.atan2(targetY - mouthY, targetX - mouthX));
      const visualAngle = headDirection < 0 ? angle - 180 : angle;
      this.tweens.add({
        targets: this.dragonSprite,
        angle: Phaser.Math.Clamp(visualAngle * 0.12, -9, 9),
        duration: 180,
        ease: 'Sine.easeOut',
      });
      this.dragonDangerText.setPosition((mouthX + targetX) / 2, (mouthY + targetY) / 2);
    } else if (attack === 'arm') {
      shape = new Phaser.Geom.Circle(targetX, targetY, Math.min(105, width * 0.22));
      this.dragonDangerText.setPosition(shape.x, shape.y);
      this.tweens.add({
        targets: this.dragonSprite,
        y: this.dragonSprite.y - 12,
        duration: 150,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
      });
    } else {
      shape = new Phaser.Geom.Circle(targetX, targetY, Math.min(125, width * 0.26));
      this.dragonDangerText.setPosition(shape.x, shape.y);
      const twitchAngle = headDirection < 0 ? -6 : 6;
      this.tweens.add({
        targets: this.dragonSprite,
        angle: twitchAngle,
        duration: 105,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
    }

    this.dragonDanger = { type: attack, shape, damage: DRAGON_ATTACK_DAMAGE, timer: 1.15, targetX, targetY };
    this.drawDragonDanger();
    this.dragonDangerText.setVisible(true);
  }

  private createDragonBeam(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    length: number,
    beamWidth: number
  ): Phaser.Geom.Polygon {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = dx / distance;
    const uy = dy / distance;
    const px = -uy * (beamWidth / 2);
    const py = ux * (beamWidth / 2);
    const endX = startX + ux * length;
    const endY = startY + uy * length;
    return new Phaser.Geom.Polygon([
      new Phaser.Geom.Point(startX + px, startY + py),
      new Phaser.Geom.Point(endX + px, endY + py),
      new Phaser.Geom.Point(endX - px, endY - py),
      new Phaser.Geom.Point(startX - px, startY - py),
    ]);
  }

  private drawDragonDanger() {
    this.dragonDangerGraphics.clear();
    if (!this.dragonDanger) return;
    this.dragonDangerGraphics.fillStyle(0xef4444, 0.34);
    this.dragonDangerGraphics.lineStyle(4, 0xff1f1f, 0.95);
    const shape = this.dragonDanger.shape;
    if (shape instanceof Phaser.Geom.Rectangle) {
      this.dragonDangerGraphics.fillRectShape(shape).strokeRectShape(shape);
    } else if (shape instanceof Phaser.Geom.Circle) {
      this.dragonDangerGraphics.fillCircleShape(shape).strokeCircleShape(shape);
    } else {
      this.dragonDangerGraphics.fillPoints(shape.points, true).strokePoints(shape.points, true);
    }
  }

  private executeDragonAttack() {
    if (!this.dragonDanger) return;
    const { type, shape, damage, targetX, targetY } = this.dragonDanger;
    const hit =
      shape instanceof Phaser.Geom.Rectangle
        ? Phaser.Geom.Rectangle.Contains(shape, this.player.x, this.player.y)
        : shape instanceof Phaser.Geom.Circle
          ? Phaser.Geom.Circle.Contains(shape, this.player.x, this.player.y)
          : Phaser.Geom.Polygon.Contains(shape, this.player.x, this.player.y);
    const color = type === 'breath' ? 0x38bdf8 : 0xf97316;
    const effect = this.add.graphics().setDepth(8);
    effect.fillStyle(color, 0.72);
    if (shape instanceof Phaser.Geom.Rectangle) effect.fillRectShape(shape);
    else if (shape instanceof Phaser.Geom.Circle) effect.fillCircleShape(shape);
    else effect.fillPoints(shape.points, true);
    this.tweens.add({ targets: effect, alpha: 0, duration: 360, onComplete: () => effect.destroy() });

    if (type === 'arm') this.playDragonArmSlam(targetX, targetY);
    else if (type === 'tail') this.playDragonTailSwing(targetX, targetY);
    else if (this.dragonSprite) {
      this.tweens.add({
        targets: this.dragonSprite,
        x: this.dragonSprite.x + (this.dragonSprite.flipX ? 8 : -8),
        duration: 90,
        yoyo: true,
        onComplete: () => this.dragonSprite?.setAngle(0),
      });
    }
    if (hit) {
      const attackName = type === 'breath' ? '푸른 빛의 브레스' : type === 'arm' ? '팔 휘두르기' : '꼬리 휘두르기';
      this.damagePlayer(damage, `수룡의 ${attackName}`);
    }
    this.clearDragonDanger();
    this.dragonAttackCooldown = 0;
  }

  private playDragonArmSlam(targetX: number, targetY: number) {
    const arm = this.add
      .rectangle(targetX, targetY - 145, 34, 150, 0xf97316, 0.88)
      .setOrigin(0.5, 1)
      .setStrokeStyle(4, 0xfed7aa, 0.95)
      .setDepth(9);
    const claw = this.add.circle(targetX, targetY - 145, 28, 0xfb923c, 0.9).setDepth(9);
    this.tweens.add({
      targets: [arm, claw],
      y: targetY + 18,
      duration: 180,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        arm.destroy();
        claw.destroy();
        this.dragonSprite?.setAngle(0);
      },
    });
  }

  private playDragonTailSwing(targetX: number, targetY: number) {
    if (!this.dragonSprite) return;
    const direction = this.dragonSprite.flipX ? 1 : -1;
    const tailX = this.dragonSprite.x + direction * this.dragonSprite.displayWidth * 0.32;
    const tailY = this.dragonSprite.y + this.dragonSprite.displayHeight * 0.05;
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(tailX, tailY),
      new Phaser.Math.Vector2((tailX + targetX) / 2, Math.min(tailY, targetY) - 110),
      new Phaser.Math.Vector2(targetX, targetY)
    );
    const tailEffect = this.add.graphics().setDepth(9);
    tailEffect.lineStyle(26, 0x0f766e, 0.9).strokePoints(curve.getPoints(28), false);
    tailEffect.lineStyle(5, 0x5eead4, 0.95).strokePoints(curve.getPoints(28), false);
    this.tweens.add({ targets: tailEffect, alpha: 0, duration: 320, onComplete: () => tailEffect.destroy() });
    this.tweens.add({
      targets: this.dragonSprite,
      angle: this.dragonSprite.flipX ? 12 : -12,
      duration: 110,
      yoyo: true,
      onComplete: () => this.dragonSprite?.setAngle(0),
    });
  }

  private clearDragonDanger() {
    this.dragonDanger = undefined;
    this.dragonDangerGraphics?.clear();
    this.dragonDangerText?.setVisible(false);
  }

  private tryHarvest() {
    if (this.zoneIndex === NEST_ZONE_INDEX) this.helicoprion.tryHarvest();
    else if (this.zoneIndex === ABYSS_ZONE_INDEX) this.abyssDragon.tryHarvest();
    else this.tryHarvestDragon();
  }

  private tryHarvestDragon() {
    if (this.zoneIndex !== DRAGON_ZONE_INDEX || this.dragonState !== 'dead' || this.dragonHarvests >= 3 || !this.dragonSprite) return;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.dragonSprite.x, this.dragonSprite.y);
    if (distance > Math.max(150, this.dragonSprite.displayWidth * 0.42)) {
      this.audio.playDenied();
      this.showNotice('수룡의 사체에 더 가까이 가야 갈무리할 수 있어요.');
      return;
    }

    const rewards = ['수룡의 비늘', '수룡의 머리뼈', '수룡의 비늘'];
    const reward = rewards[this.dragonHarvests];
    this.dragonHarvests += 1;
    this.dragonLoot.push(reward);
    this.audio.playCollect();
    this.showDragonLoot(reward);
    this.applyDragonAppearance();
    if (this.dragonHarvests >= 3) {
      this.showNotice(`${reward} 획득! 갈무리 3/3`);
      this.time.delayedCall(450, () => this.beginDragonRespawn());
    } else {
      this.showNotice(`${reward} 획득! 갈무리 ${this.dragonHarvests}/3`);
    }
    this.updateHud();
  }

  private showDragonLoot(reward: string) {
    const key = reward === '수룡의 머리뼈' ? 'water_dragon_skull' : 'water_dragon_scales';
    const icon = this.add.image(this.player.x, this.player.y - 45, key).setDepth(45);
    const source = icon.texture.getSourceImage() as HTMLImageElement;
    icon.setScale(Math.min(68 / source.width, 68 / source.height));
    this.tweens.add({
      targets: icon,
      y: icon.y - 55,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => icon.destroy(),
    });
  }

  private beginDragonRespawn() {
    this.dragonSprite?.destroy();
    this.dragonStatusText?.destroy();
    this.dragonSprite = undefined;
    this.dragonStatusText = undefined;
    this.dragonState = 'respawning';
    this.dragonRespawnRemaining = DRAGON_RESPAWN_SECONDS;
    this.harvestBtnBg.setVisible(false);
    this.harvestBtnText.setVisible(false);
    this.ensureDragonVisual();
    this.showNotice('갈무리를 마쳤습니다. 수룡은 5분 뒤 이 자리에서 부활합니다.');
  }

  private updateDragon(dt: number) {
    if (this.dragonState === 'respawning') {
      this.dragonRespawnRemaining = Math.max(0, this.dragonRespawnRemaining - dt);
      if (this.dragonRespawnRemaining <= 0) {
        this.dragonState = 'sleeping';
        this.dragonHp = DRAGON_MAX_HP;
        this.dragonHarvests = 0;
        this.dragonRespawnText?.destroy();
        this.dragonRespawnText = undefined;
        if (this.zoneIndex === DRAGON_ZONE_INDEX) {
          this.ensureDragonVisual();
          this.showNotice('수룡이 다시 부활해 잠들었습니다.');
        }
      } else if (this.zoneIndex === DRAGON_ZONE_INDEX) {
        const seconds = Math.ceil(this.dragonRespawnRemaining);
        const minutes = Math.floor(seconds / 60);
        const remain = seconds % 60;
        this.dragonRespawnText?.setText(`🐉 수룡 부활까지\n${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`);
      }
    }

    if (this.zoneIndex !== DRAGON_ZONE_INDEX) return;
    if (this.dragonState === 'awake') {
      if (this.dragonDanger) {
        this.dragonDanger.timer -= dt;
        this.dragonDangerText.setAlpha(0.65 + Math.sin(this.dragonDanger.timer * 24) * 0.35);
        if (this.dragonDanger.timer <= 0) this.executeDragonAttack();
      } else {
        this.dragonAttackCooldown -= dt;
        if (this.dragonAttackCooldown <= 0) this.startDragonAttack();
      }
    }

    const closeEnough =
      this.dragonState === 'dead' &&
      !!this.dragonSprite &&
      Phaser.Math.Distance.Between(this.player.x, this.player.y, this.dragonSprite.x, this.dragonSprite.y) <=
        Math.max(150, this.dragonSprite.displayWidth * 0.42);
    this.harvestBtnBg.setVisible(closeEnough);
    this.harvestBtnText.setVisible(closeEnough);
    this.refreshDragonUi();
  }

  private refreshDragonUi() {
    const showBar = this.zoneIndex === DRAGON_ZONE_INDEX && this.dragonState === 'awake';
    this.dragonBossText.setVisible(showBar);
    if (showBar) {
      this.refreshDragonBossBar();
    } else {
      this.dragonBossBar.clear();
    }
  }

  private refreshDragonBossBar() {
    if (this.zoneIndex !== DRAGON_ZONE_INDEX || this.dragonState !== 'awake') return;
    this.dragonBossText.setVisible(true);
    const width = this.scale.width;
    const barWidth = Math.min(width - 48, 560);
    const x = (width - barWidth) / 2;
    const y = 118;
    const ratio = Phaser.Math.Clamp(this.dragonHp / DRAGON_MAX_HP, 0, 1);
    this.dragonBossBar.clear();
    this.dragonBossBar.fillStyle(0x1f2937, 0.95).fillRoundedRect(x, y, barWidth, 18, 7);
    this.dragonBossBar.fillStyle(0xdc2626, 1).fillRoundedRect(x + 3, y + 3, (barWidth - 6) * ratio, 12, 5);
    this.dragonBossText.setText(`수룡  ${this.dragonHp}/${DRAGON_MAX_HP}`);
  }

  private setDragonZoneVisibility(visible: boolean) {
    this.dragonSprite?.setVisible(visible);
    this.dragonStatusText?.setVisible(visible);
    this.dragonRespawnText?.setVisible(visible && this.dragonState === 'respawning');
    if (!visible) {
      this.clearDragonDanger();
      this.dragonBossBar.clear();
      this.dragonBossText.setVisible(false);
      this.harvestBtnBg.setVisible(false);
      this.harvestBtnText.setVisible(false);
    }
  }

  private emptyBagToTank() {
    if (this.bag.length === 0) {
      this.audio.playDenied();
      this.showNotice('가방이 이미 비어 있어요!');
      return;
    }
    const count = this.bag.length;
    this.bag = [];
    if (count >= this.maxBag) {
      if (this.level < this.maxLevel) {
        this.level += 1;
        this.audio.playLevelUp();
        this.showNotice(`가득 찬 가방(${count}마리)을 수조에 비워 레벨 업! ⭐ Lv.${this.level}/${this.maxLevel}`);
      } else {
        this.audio.playTank();
        this.showNotice(`최대 레벨(Lv.${this.maxLevel})이에요! 가방(${count}마리)을 수조에 비웠습니다.`);
      }
    } else {
      this.audio.playTank();
      this.showNotice(`수조에 ${count}마리를 비웠어요! (${this.maxBag}마리 가득 채워 비우면 Lv UP)`);
    }
    this.updateHud();
  }

  private drawZoneBackdrop() {
    const { width, height } = this.scale;
    const zone = ZONES[this.zoneIndex];

    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(zone.topColor, zone.topColor, zone.bottomColor, zone.bottomColor, 1);
    this.bgGraphics.fillRect(0, 0, width, height);

    this.decoGraphics.clear();

    if (this.zoneIndex === 0) {
      this.decoGraphics.fillStyle(0xe0f2fe, 0.35);
      this.decoGraphics.fillRect(0, 0, width, 18);
      this.decoGraphics.fillStyle(zone.floorColor, 0.9);
      this.decoGraphics.fillRect(0, height - 22, width, 22);
      this.decoGraphics.fillStyle(0x22c55e, 0.8);
      const step = Math.max(90, Math.floor(width / 5));
      for (let x = 50; x < width - 40; x += step) {
        this.decoGraphics.fillRect(x, height - 56, 8, 34);
        this.decoGraphics.fillRect(x + 14, height - 48, 8, 26);
      }
    } else if (this.zoneIndex === 1) {
      this.decoGraphics.fillStyle(zone.floorColor, 0.9);
      this.decoGraphics.fillRect(0, height - 22, width, 22);
      this.ensureOreNodes();
      this.layoutOreNodes(width, height);
      this.drawRockShelf(width * 0.56, height * 0.16, width * 0.48, height * 0.2, false);
      this.drawRockShelf(-width * 0.04, height * 0.66, width * 0.46, height * 0.19, true);
      for (const ore of this.oreNodes) this.drawOreNode(ore);
    } else if (this.zoneIndex === 2) {
      this.decoGraphics.fillStyle(zone.floorColor, 0.95);
      this.decoGraphics.fillRect(0, height - 20, width, 20);
    } else if (this.zoneIndex === 3) {
      this.decoGraphics.fillStyle(zone.floorColor, 1);
      this.decoGraphics.fillRect(0, height - 36, width, 36);
      this.decoGraphics.fillStyle(0xef4444, 0.9);
      this.decoGraphics.fillCircle(width - 50, height - 24, 12);
    } else if (this.zoneIndex === 4) {
      this.drawGlacialValley(width, height);
    } else if (this.zoneIndex === 5) {
      this.drawUnderworldSecondFloor(width, height);
    } else if (this.zoneIndex === 6) {
      this.drawHydrothermalVents(width, height);
    } else if (this.zoneIndex === NEST_ZONE_INDEX) {
      HelicoprionBoss.drawNest(this.decoGraphics, width, height);
    }
  }

  private drawGlacialValley(width: number, height: number) {
    const g = this.decoGraphics;
    g.fillStyle(0x7dd3fc, 0.96);
    g.fillRect(0, 0, width, 54);
    g.fillRect(0, height - 66, width, 66);
    g.fillStyle(0xbae6fd, 0.95);
    const step = Math.max(64, width / 9);
    for (let x = -step; x < width + step; x += step) {
      const topLength = 48 + ((Math.floor(x / step) + 12) % 3) * 28;
      const bottomLength = 50 + ((Math.floor(x / step) + 11) % 4) * 22;
      g.fillTriangle(x, 50, x + step * 0.48, 50 + topLength, x + step, 50);
      g.fillTriangle(x, height - 62, x + step * 0.48, height - 62 - bottomLength, x + step, height - 62);
    }
    g.lineStyle(4, 0xe0f2fe, 0.8);
    g.lineBetween(0, 54, width, 54);
    g.lineBetween(0, height - 66, width, height - 66);
    g.fillStyle(0xffffff, 0.38);
    for (let index = 0; index < 12; index++) {
      g.fillCircle(width * ((index * 37) % 100) / 100, 100 + ((index * 83) % Math.max(120, height - 220)), 3 + (index % 3));
    }
  }

  private drawUnderworldSecondFloor(width: number, height: number) {
    const g = this.decoGraphics;
    g.fillStyle(0x7c2d12, 0.94);
    g.fillRect(0, height - 58, width, 58);
    g.fillStyle(0xc2410c, 0.92);
    g.fillRoundedRect(width * 0.68, height * 0.08, width * 0.34, height * 0.3, 18);
    g.fillRoundedRect(-width * 0.06, height * 0.57, width * 0.38, height * 0.24, 18);
    g.fillStyle(0xfb923c, 0.72);
    g.fillTriangle(width * 0.68, height * 0.38, width * 0.75, height * 0.48, width * 0.82, height * 0.38);
    g.fillTriangle(width * 0.86, height * 0.38, width * 0.92, height * 0.5, width, height * 0.38);
    g.fillTriangle(width * 0.06, height * 0.57, width * 0.13, height * 0.48, width * 0.2, height * 0.57);
    g.lineStyle(5, 0xfdba74, 0.5);
    g.lineBetween(width * 0.7, height * 0.18, width * 0.95, height * 0.3);
    g.lineBetween(width * 0.03, height * 0.68, width * 0.28, height * 0.62);
    g.fillStyle(0x38bdf8, 0.62);
    for (let index = 0; index < 11; index++) {
      const bx = width * (0.12 + ((index * 19) % 70) / 100);
      const by = height * (0.18 + ((index * 13) % 64) / 100);
      g.fillCircle(bx, by, 3 + (index % 4));
    }
    // 오른쪽 끝: 헬리코프리온의 둥지로 가는 노란 빛 통로
    g.fillStyle(0xfacc15, 0.22);
    g.fillTriangle(width, height * 0.4, width - 70, height * 0.52, width, height * 0.64);
    g.fillStyle(0xfde047, 0.6);
    g.fillRect(width - 10, height * 0.42, 10, height * 0.2);
  }

  private drawHydrothermalVents(width: number, height: number) {
    const g = this.decoGraphics;
    g.fillStyle(0x1c1917, 1);
    g.fillRect(0, height - 50, width, 50);
    const vents = [
      { x: width * 0.22, y: height - 48, w: 105, h: 235 },
      { x: width * 0.55, y: height - 48, w: 130, h: 315 },
      { x: width * 0.82, y: height - 48, w: 90, h: 195 },
    ];
    for (const vent of vents) {
      g.fillStyle(0x3f3f46, 1);
      g.fillTriangle(vent.x - vent.w / 2, vent.y, vent.x - vent.w * 0.28, vent.y - vent.h, vent.x + vent.w / 2, vent.y);
      g.fillStyle(0x18181b, 1);
      g.fillEllipse(vent.x - vent.w * 0.1, vent.y - vent.h, vent.w * 0.56, 24);
      g.fillStyle(0xf97316, 0.95);
      g.fillEllipse(vent.x - vent.w * 0.1, vent.y - vent.h + 2, vent.w * 0.4, 13);
      g.lineStyle(5, 0xef4444, 0.9);
      g.lineBetween(vent.x - vent.w * 0.18, vent.y - vent.h * 0.78, vent.x, vent.y - vent.h * 0.35);
      g.lineBetween(vent.x, vent.y - vent.h * 0.35, vent.x - vent.w * 0.2, vent.y - 18);
      g.fillStyle(0x38bdf8, 0.7);
      for (let bubble = 0; bubble < 6; bubble++) {
        g.fillCircle(
          vent.x - vent.w * 0.1 + Math.sin(bubble * 2.1) * 18,
          vent.y - vent.h - 28 - bubble * 32,
          3 + (bubble % 3) * 2
        );
      }
    }
  }

  private ensureOreNodes() {
    // 예전 저장의 채굴 횟수와 재생 시간은 유지하고 없는 바위만 추가합니다.
    const ids: OreNode['id'][] = ['upper', 'lower', 'upper_left', 'lower_right'];
    for (const id of ids) {
      if (!this.oreNodes.some(ore => ore.id === id)) {
        this.oreNodes.push({ id, x: 0, y: 0, remaining: ORE_MINES_PER_NODE, respawnRemaining: 0 });
      }
    }
  }

  private layoutOreNodes(width: number, height: number) {
    const positions: Record<OreNode['id'], [number, number]> = {
      upper: [0.76, 0.36], lower: [0.22, 0.62],
      upper_left: [0.22, 0.36], lower_right: [0.76, 0.62],
    };
    for (const ore of this.oreNodes) {
      const [x, y] = positions[ore.id];
      ore.x = width * x;
      ore.y = height * y;
    }
  }

  private drawRockShelf(x: number, y: number, width: number, height: number, pointsUp: boolean) {
    const g = this.decoGraphics;
    g.fillStyle(0x111827, 0.98);
    g.fillRoundedRect(x, y, width, height, 18);
    g.fillStyle(0x334155, 0.95);
    g.fillRoundedRect(x + 10, y + 10, width - 20, height - 24, 14);
    g.fillStyle(0x475569, 0.85);
    const baseY = pointsUp ? y : y + height;
    const tipY = pointsUp ? y - 34 : y + height + 34;
    for (let step = 0; step < 4; step++) {
      const px = x + width * (0.12 + step * 0.22);
      g.fillTriangle(px, baseY, px + width * 0.1, tipY, px + width * 0.2, baseY);
    }
    g.lineStyle(3, 0x94a3b8, 0.4);
    g.lineBetween(x + 18, y + height * 0.55, x + width * 0.62, y + height * 0.28);
    g.lineBetween(x + width * 0.42, y + height * 0.75, x + width - 20, y + height * 0.48);
  }

  private drawOreNode(ore: OreNode) {
    const g = this.decoGraphics;
    const exhausted = ore.remaining <= 0;
    const rockColor = exhausted ? 0x4b5563 : 0x172033;
    g.fillStyle(0x020617, 0.95);
    g.fillTriangle(ore.x - 38, ore.y + 28, ore.x - 8, ore.y - 38, ore.x + 38, ore.y + 28);
    g.fillStyle(rockColor, 1);
    g.fillTriangle(ore.x - 31, ore.y + 22, ore.x - 6, ore.y - 30, ore.x + 31, ore.y + 22);
    if (!exhausted) {
      const chips = [
        { dx: -15, dy: 6, color: 0x67e8f9 },
        { dx: 1, dy: -12, color: 0xe11d48 },
        { dx: 15, dy: 7, color: 0x2563eb },
        { dx: -2, dy: 13, color: 0xf59e0b },
      ];
      for (const chip of chips) {
        g.fillStyle(chip.color, 1);
        g.fillCircle(ore.x + chip.dx, ore.y + chip.dy, 6);
      }
    }
  }

  private updateMiningInteraction() {
    if (this.zoneIndex !== 1) {
      this.nearbyOre = undefined;
      this.mineBtnBg.setVisible(false);
      this.mineBtnText.setVisible(false);
      return;
    }
    this.ensureOreNodes();
    let nearest: OreNode | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const ore of this.oreNodes) {
      if (ore.remaining <= 0) continue;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, ore.x, ore.y);
      if (distance <= 92 && distance < nearestDistance) {
        nearest = ore;
        nearestDistance = distance;
      }
    }
    this.nearbyOre = nearest;
    this.mineBtnBg.setVisible(Boolean(nearest));
    this.mineBtnText.setVisible(Boolean(nearest));
    if (nearest) this.mineBtnText.setText(`⛏️ 광질 (E) ${nearest.remaining}/5`);
  }

  private tryMineNearbyOre() {
    if (this.zoneIndex !== 1 || !this.nearbyOre || this.nearbyOre.remaining <= 0) {
      this.audio.playDenied();
      this.showNotice('채굴할 수 있는 광석바위 가까이 다가가세요!');
      return;
    }
    const roll = Math.random();
    const mineral = MINERAL_TABLE.find((entry) => roll < entry.limit) ?? MINERAL_TABLE[MINERAL_TABLE.length - 1];
    this.nearbyOre.remaining -= 1;
    if (this.nearbyOre.remaining <= 0) this.nearbyOre.respawnRemaining = ORE_RESPAWN_SECONDS;
    this.mineralInventory[mineral.name] += 1;
    this.audio.playCollect();
    this.showMinedMineral(this.nearbyOre, mineral.name, mineral.color);
    const remaining = this.nearbyOre.remaining;
    this.showNotice(
      `⛏️ ${mineral.name} 획득! (확률 ${mineral.chance}%)\n광석바위 남은 광질 ${remaining}/${ORE_MINES_PER_NODE}`
    );
    this.drawZoneBackdrop();
    this.updateMiningInteraction();
    this.updateHud();
  }

  private updateOreRespawns(dt: number) {
    let regenerated = false;
    for (const ore of this.oreNodes) {
      if (ore.remaining > 0 || ore.respawnRemaining <= 0) continue;
      ore.respawnRemaining = Math.max(0, ore.respawnRemaining - dt);
      if (ore.respawnRemaining <= 0) {
        ore.remaining = ORE_MINES_PER_NODE;
        regenerated = true;
      }
    }
    if (!regenerated) return;
    if (this.zoneIndex === 1) {
      this.drawZoneBackdrop();
      this.updateMiningInteraction();
      this.showNotice('✨ 광석바위가 다시 생성되어 5번 채굴할 수 있습니다!');
    }
  }

  private showMinedMineral(ore: OreNode, name: MineralType, color: number) {
    const gem = this.add
      .polygon(ore.x, ore.y - 8, [0, -16, 14, -5, 10, 14, 0, 20, -10, 14, -14, -5], color, 1)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setDepth(20);
    const label = this.add
      .text(ore.x, ore.y - 38, name, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 6, 23, 0.8)',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.tweens.add({
      targets: [gem, label],
      y: '-=55',
      alpha: 0,
      duration: 950,
      ease: 'Cubic.Out',
      onComplete: () => {
        gem.destroy();
        label.destroy();
      },
    });
  }

  private showNotice(msg: string) {
    this.noticeText.setText(msg);
    this.noticeText.setVisible(true);
    this.noticeTimer = 2.2;
  }

  private formatFishLabel(fish: { spec: FishSpec; hp: number; stunned: boolean; aggro: boolean; status?: FishStatus }): string {
    if (fish.stunned) {
      return `💫 ${fish.spec.name} (F 수집)`;
    }
    const effects = `${fish.status?.burnRemaining ? '🔥' : ''}${fish.status?.slowRemaining ? '❄️' : ''}${fish.status?.paralyzeRemaining ? '⚡' : ''}`;
    const prefix = effects + (fish.aggro ? '⚔️ ' : '');
    return `${prefix}${fish.spec.name} ❤️${fish.hp}/${fish.spec.hp}`;
  }

  private getPoolForCurrentZone(): FishSpec[] {
    if (this.zoneIndex === 0) return SHALLOW_FISH;
    if (this.zoneIndex === 1) return MID_FISH;
    if (this.zoneIndex === 2) return DEEP_FISH;
    if (this.zoneIndex === GLACIAL_ZONE_INDEX) return GLACIAL_FISH;
    if (this.zoneIndex === UNDERWORLD_2F_ZONE_INDEX) return UNDERWORLD_2F_FISH;
    return [];
  }

  private spawnFishWave(count: number) {
    if (this.zoneIndex === DRAGON_ZONE_INDEX) return;
    for (let i = 0; i < count; i++) {
      this.spawnOneFish(true);
    }
  }

  private spawnOneFish(initial = false) {
    const { width, height } = this.scale;
    if (this.zoneIndex === DRAGON_ZONE_INDEX) return;

    if (this.fishList.length >= this.maxFishPerZone) {
      const oldest = this.fishList.shift();
      if (oldest) {
        oldest.sprite.destroy();
        oldest.label.destroy();
      }
    }

    const pool = this.getPoolForCurrentZone();
    const existingKeys = new Set(this.fishList.map((f) => f.spec.key));
    const available = pool.filter((s) => !s.unique || !existingKeys.has(s.key));
    if (available.length === 0) return;

    const spec = Phaser.Utils.Array.GetRandom(available);
    const fromLeft = Math.random() < 0.5;
    const startX = initial
      ? Phaser.Math.Between(50, Math.max(100, width - 50))
      : fromLeft
        ? -45
        : width + 45;
    const startY = Phaser.Math.Between(100, Math.max(160, height - 150));

    let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;
    if (this.textures.exists(spec.key)) {
      const img = this.add.image(startX, startY, spec.key);
      img.setScale(spec.scale);
      this.setFishFacing(img, spec, fromLeft);
      sprite = img;
    } else {
      sprite = this.add.ellipse(startX, startY, 56, 26, 0xfb923c);
    }
    sprite.setDepth(5);

    const label = this.add
      .text(startX, startY - 30, this.formatFishLabel({ spec, hp: spec.hp, stunned: false, aggro: false }), {
        fontSize: '11px',
        color: '#e0f2fe',
        backgroundColor: 'rgba(2, 12, 23, 0.6)',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(6);

    const vx = (fromLeft ? 1 : -1) * spec.speed;
    this.fishList.push({
      sprite,
      label,
      spec,
      hp: spec.hp,
      vx,
      stunned: false,
      stunTimer: 0,
      aggro: false,
      baseY: startY,
      phase: Math.random() * Math.PI * 2,
      status: newFishStatus(),
    });
  }

  private setFishFacing(sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse, spec: FishSpec, movingRight: boolean) {
    if (!('setFlipX' in sprite)) return;
    const artworkFacesLeft = spec.facesLeft || spec.key === 'red_seabream' || spec.key === 'rock_bream';
    sprite.setFlipX(artworkFacesLeft ? movingRight : !movingRight);
  }

  private fireBullet() {
    if (this.fleet.equipped === 'baby_dragon') { this.releaseAimAfterShot(); return; }
    if (this.shootCooldown > 0) return;
    const precisionShot = this.aiming;
    const weapon = weaponForShip(this.fleet.equipped);
    this.shootCooldown = 0.22 / this.rapidFireMultiplier;
    this.audio.playShoot();
    const x = this.player.x + this.aimDirection.x * 30;
    const y = this.player.y + this.aimDirection.y * 30;
    const angle = Math.atan2(this.aimDirection.y, this.aimDirection.x);
    let gfx: Phaser.GameObjects.Shape;
    if (weapon === 'ice') gfx = this.add.triangle(x, y, 0, 0, 28, 6, 0, 12, 0x7dd3fc).setStrokeStyle(2, 0xe0f2fe).setRotation(angle);
    else if (weapon === 'laser') gfx = this.add.rectangle(x, y, 32, 5, 0xfde047).setStrokeStyle(1, 0xffffff).setRotation(angle);
    else gfx = this.add.circle(x, y, weapon === 'fire' ? 9 : precisionShot ? 8 : 6,
      weapon === 'fire' ? 0xf97316 : precisionShot ? 0xfde047 : 0x38bdf8).setStrokeStyle(2, weapon === 'fire' ? 0xfde047 : 0xe0f2fe);
    gfx.setDepth(8);
    const speed = (precisionShot ? 1450 : weapon === 'laser' ? 1100 : 520) * this.bulletSpeedMultiplier;
    this.bullets.push({ gfx, weapon, damage: this.bulletDamage * this.attackMultiplier,
      vx: this.aimDirection.x * speed, vy: this.aimDirection.y * speed,
      life: precisionShot ? 2 : 1.5, piercing: precisionShot || weapon === 'laser', hitFish: new Set<FishEntity>() });
    this.releaseAimAfterShot();
  }

  private damageFish(fish: FishEntity, amount: number) {
    if (fish.stunned) return;
    fish.hp = Math.max(0, fish.hp - amount);
    if (fish.hp <= 0) {
      fish.stunned = true; fish.aggro = false; fish.stunTimer = 8;
      fish.status = newFishStatus();
      this.audio.playStun(); fish.sprite.setAngle(180);
    } else {
      if (fish.spec.aggressive) fish.aggro = true;
      this.audio.playHit();
    }
    this.refreshFishStatus(fish);
  }

  private refreshFishStatus(fish: FishEntity) {
    if ('setTint' in fish.sprite) {
      if (fish.stunned) fish.sprite.setTint(0x94a3b8);
      else if (fish.status.paralyzeRemaining > 0) fish.sprite.setTint(0xfef08a);
      else if (fish.status.slowRemaining > 0) fish.sprite.setTint(0x7dd3fc);
      else if (fish.status.burnRemaining > 0) fish.sprite.setTint(0xfb923c);
      else fish.sprite.clearTint();
    }
    fish.label.setText(this.formatFishLabel(fish));
  }

  private nearbyShockTargets() {
    return this.fishList.filter(fish => !fish.stunned && Math.hypot(fish.sprite.x - this.player.x, fish.sprite.y - this.player.y) <= COMBAT.shockRadius);
  }

  private updateShockButton() {
    if (!this.shockBtnBg) return;
    const visible = this.fleet.equipped === 'electric';
    const ready = visible && this.shockCooldown <= 0 && this.nearbyShockTargets().length > 0;
    this.shockBtnBg.setVisible(visible).setFillStyle(ready ? 0xa16207 : 0x334155, ready ? 1 : 0.65);
    this.shockBtnText.setVisible(visible).setText(this.shockCooldown > 0
      ? `⚡ B\n${Math.ceil(this.shockCooldown)}초` : ready ? '⚡ B\n전기일격' : '⚡ B\n대상 없음');
  }

  private tryElectricShock() {
    if (this.fleet.equipped !== 'electric') return;
    if (this.shockCooldown > 0) { this.showNotice(`전기일격 재사용까지 ${Math.ceil(this.shockCooldown)}초`); return; }
    const targets = this.nearbyShockTargets();
    if (!targets.length) { this.showNotice('전기일격 범위에 물고기가 없어요.'); return; }
    this.shockCooldown = COMBAT.shockCooldown;
    for (const fish of targets) { fish.status.paralyzeRemaining = COMBAT.shockSeconds; this.refreshFishStatus(fish); }
    const flash = this.add.circle(this.player.x, this.player.y, COMBAT.shockRadius, 0xfde047, 0.16)
      .setStrokeStyle(4, 0xfef08a).setDepth(12);
    this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
    this.audio.playHit(); this.showNotice(`⚡ 물고기 ${targets.length}마리 5초 마비!`); this.updateShockButton();
  }

  private updateDragonBreath(dt: number) {
    this.breathGraphics.clear();
    this.breathDamageTimer = Math.max(0, this.breathDamageTimer - dt);
    if (this.fleet.equipped !== 'baby_dragon' || !(this.shootHolding || this.keySpace?.isDown)) return;
    this.releaseAimAfterShot();
    const ax = this.player.x + this.aimDirection.x * 28;
    const ay = this.player.y + this.aimDirection.y * 28;
    const bx = ax + this.aimDirection.x * COMBAT.breathLength;
    const by = ay + this.aimDirection.y * COMBAT.breathLength;
    this.breathGraphics.lineStyle(COMBAT.breathRadius * 2, 0x0284c7, 0.3).lineBetween(ax, ay, bx, by);
    this.breathGraphics.lineStyle(22, 0x38bdf8, 0.75).lineBetween(ax, ay, bx, by);
    this.breathGraphics.lineStyle(7, 0xe0f2fe, 0.95).lineBetween(ax, ay, bx, by);
    if (this.breathDamageTimer > 0) return;
    this.breathDamageTimer = COMBAT.breathInterval / this.rapidFireMultiplier;
    this.audio.playShoot();
    for (const fish of this.fishList) {
      if (!fish.stunned && distanceToSegment(fish.sprite.x, fish.sprite.y, ax, ay, bx, by) <= COMBAT.breathRadius + 20) this.damageFish(fish, this.bulletDamage * this.attackMultiplier);
    }
    const hitboxes = this.getDragonHitboxes();
    if (this.zoneIndex === DRAGON_ZONE_INDEX && hitboxes && (this.dragonState === 'awake' || this.dragonState === 'sleeping')) {
      if (distanceToSegment(hitboxes.head.x, hitboxes.head.y, ax, ay, bx, by) <= hitboxes.head.radius + COMBAT.breathRadius)
        this.damageDragon(this.bulletDamage * this.attackMultiplier * 2, true, hitboxes.head.x, hitboxes.head.y);
      else if (segmentHitsRect(ax, ay, bx, by, hitboxes.body)) this.damageDragon(this.bulletDamage * this.attackMultiplier);
    }
    if (this.zoneIndex === NEST_ZONE_INDEX) this.helicoprion.hitSegment(ax, ay, bx, by, COMBAT.breathRadius, this.bulletDamage * this.attackMultiplier);
    if (this.zoneIndex === ABYSS_ZONE_INDEX) this.abyssDragon.hitSegment(ax, ay, bx, by, COMBAT.breathRadius, this.bulletDamage * this.attackMultiplier);
  }

  private tryCollectNearbyFish() {
    if (this.bag.length >= this.maxBag) {
      this.audio.playDenied();
      this.showNotice(`가방이 ${this.maxBag}마리로 가득 찼어요! 수조 버튼(T)을 눌러 가방을 비우세요.`);
      return;
    }

    let collected = false;
    for (let i = 0; i < this.fishList.length; i++) {
      const fish = this.fishList[i];
      if (!fish.stunned) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, fish.sprite.x, fish.sprite.y);
      if (dist <= 76) {
        const bagCount = Phaser.Math.Clamp(this.zoneIndex + 1, 1, 3);
        if (this.bag.length + bagCount > this.maxBag) {
          this.audio.playDenied();
          this.showNotice(
            `${ZONES[this.zoneIndex].name} 물고기는 가방에 ${bagCount}마리로 저장돼요. 가방을 먼저 수조(T)에 비워주세요!`
          );
          return;
        }
        for (let count = 0; count < bagCount; count++) {
          this.bag.push(fish.spec.name);
        }
        this.audio.playCollect();
        if (this.bag.length >= this.maxBag) {
          this.showNotice(
            `${fish.spec.name} 수집 (${bagCount}마리 저장)! 가방이 가득 찼으니 수조(T)에 비워 레벨업하세요!`
          );
        } else {
          this.showNotice(`${fish.spec.name} 수집 (${bagCount}마리 저장)! (가방 ${this.bag.length}/${this.maxBag})`);
        }
        fish.sprite.destroy();
        fish.label.destroy();
        this.fishList.splice(i, 1);
        collected = true;
        break;
      }
    }

    if (!collected) {
      this.audio.playDenied();
      this.showNotice('가까이에 기절한 물고기가 없어요! 총알로 먼저 기절시키세요.');
    }
    this.updateHud();
  }

  private damagePlayer(amount: number, attackerName: string, fromFish = false, ignoreInvuln = false): boolean {
    if (this.playerInvuln > 0 && !ignoreInvuln) return false;
    if (fromFish && this.fleet.equipped === 'sturdy') this.armorRemaining = COMBAT.armorSeconds;
    const defense = effectiveDefense(this.fleet.equipped, this.defenseMultiplier, this.armorRemaining);
    const reducedAmount = Math.max(1, Math.ceil(amount / defense));
    this.playerHp = Math.max(0, this.playerHp - reducedAmount);
    // 긴 브레스처럼 연속으로 들어오는 피해는 무적시간을 만들지 않습니다.
    if (!ignoreInvuln) this.playerInvuln = 1.0;
    this.showNotice(`${attackerName}의 공격! (-${reducedAmount} HP)`);

    if (this.playerHp <= 0) {
      this.respawnAfterDeath();
      return true;
    }
    this.audio.playDamage();
    this.updateHud();
    return false;
  }

  private respawnAfterDeath() {
    const previousSub = this.fleet.equipped;
    this.audio.playDeath();
    this.playerHp = this.maxHp;
    this.bag = [];
    this.dragonLoot = [];
    for (const { name } of MINERAL_TABLE) this.mineralInventory[name] = 0;
    this.fleet = damageEquippedSubmarine(this.fleet);
    this.armorRemaining = 0;
    this.armorGraphics.clear();
    this.resetHeldInput();
    for (const bullet of this.bullets) bullet.gfx.destroy();
    this.bullets = [];
    this.applySubmarine();

    const { width, height } = this.scale;
    this.player.x = width / 2;
    this.changeZone(0, Math.min(120, height / 2), false);

    // 저장 후 새로고침해도 잃은 소재나 파손 전 잠수함이 복구되지 않습니다.
    const data = this.captureSave();
    const saved = writeSave(data);
    this.savedGame = { data, error: null };
    const repair = previousSub === 'basic' ? '' : `\n${getSubmarine(previousSub).name} 파손 · 일반 잠수함으로 교체 (5분 수리)`;
    const saveNotice = saved ? '' : '\n자동 저장 실패. 브라우저 저장 설정을 확인해 주세요.';
    this.showNotice(`초심층으로 복귀했어요! HP 회복 · 보유 소재와 가방 속 물고기 전부 잃음${repair}${saveNotice}`);
  }

  private changeZone(nextIndex: number, spawnY: number, playSound = true) {
    const previousZoneIndex = this.zoneIndex;
    if (previousZoneIndex === DRAGON_ZONE_INDEX) this.setDragonZoneVisibility(false);
    if (previousZoneIndex === NEST_ZONE_INDEX) this.helicoprion.leave();
    if (previousZoneIndex === ABYSS_ZONE_INDEX) this.abyssDragon.leave();
    for (const f of this.fishList) {
      f.sprite.destroy();
      f.label.destroy();
    }
    this.fishList = [];
    this.zoneIndex = nextIndex;
    const expandedNow = this.zoneIndex === 4 && !this.maxLevelExpanded;
    if (expandedNow) {
      this.maxLevelExpanded = true;
      this.maxLevel = EXPANDED_MAX_LEVEL;
      this.audio.playLevelUp();
    }
    this.audio.setZone(this.zoneIndex);
    if (playSound) {
      this.audio.playZoneChange(nextIndex > previousZoneIndex);
    }
    this.player.y = spawnY;
    this.drawZoneBackdrop();
    this.updateMiningInteraction();
    if (this.zoneIndex === DRAGON_ZONE_INDEX) {
      this.ensureDragonVisual();
    } else {
      this.spawnFishWave(6);
    }
    this.showNotice(
      `${ZONES[this.zoneIndex].name} (${ZONES[this.zoneIndex].minDepth}m~${ZONES[this.zoneIndex].maxDepth}m) 진입!${
        expandedNow ? '\n⭐ 최대 레벨이 Lv.40으로 확장되었습니다!' : ''
      }`
    );
    if (this.zoneIndex === NEST_ZONE_INDEX) this.helicoprion.enter();
    if (this.zoneIndex === ABYSS_ZONE_INDEX) this.abyssDragon.enter();
    this.updateHud();
  }

  private updateHud() {
    const zone = ZONES[this.zoneIndex];
    const ratio = Phaser.Math.Clamp((this.player.y - 30) / Math.max(1, this.scale.height - 60), 0, 1);
    const depth = Math.round(zone.minDepth + ratio * (zone.maxDepth - zone.minDepth));

    const compactHud = this.scale.width < 640;
    this.hudText.setText(compactHud
      ? `🌊 ${zone.name}(${depth}m)\n⭐ Lv.${this.level}/${this.maxLevel}\n❤️ ${this.playerHp}/${this.maxHp}`
      : `🌊 ${zone.name}(${depth}m) | ⭐ Lv.${this.level}/${this.maxLevel} | ❤️ ${this.playerHp}/${this.maxHp}`);
    this.submarinePanel?.update(this.fleet, inventoryResources(this.mineralInventory, this.dragonLoot));
    const lootCounts = new Map<string, number>();
    for (const loot of this.dragonLoot) lootCounts.set(loot, (lootCounts.get(loot) ?? 0) + 1);
    const lootSummary = lootCounts.size > 0
      ? ` | 전리품: ${[...lootCounts].map(([name, count]) => `${name.replace('헬리코프리온의 ', '헬리 ').replace('수룡의 ', '수룡 ')}×${count}`).join(' ')}`
      : '';
    const population = this.zoneIndex === DRAGON_ZONE_INDEX || this.zoneIndex === ABYSS_ZONE_INDEX ? '수룡 전용 구역'
      : this.zoneIndex === NEST_ZONE_INDEX ? '헬리코프리온 전용 구역' : `물고기: ${this.fishList.length}/${this.maxFishPerZone}`;
    this.bagText.setText(`🎒 가방: ${this.bag.length}/${this.maxBag}마리 | ${population}${lootSummary}`);
    this.updateShockButton();
    const defense = effectiveDefense(this.fleet.equipped, this.defenseMultiplier, this.armorRemaining);
    const armorText = this.fleet.equipped === 'sturdy' && this.armorRemaining > 0 ? ` · 🛡️ ${Math.ceil(this.armorRemaining)}초` : '';
    const rapidText = this.fleet.equipped === 'baby_dragon' ? '브레스 연속 발사' : this.autoFireEnabled ? `난사×${this.rapidFireMultiplier}` : '난사 불가';
    const speedText = this.bulletSpeedMultiplier < 1 ? ' · 총알 느림' : '';
    const regenText = this.regenAmount > 0 ? ` · 회복+${this.regenAmount}/${this.regenInterval}초` : '';
    this.statsText.setText(
      `⚔️ 공격×${this.attackMultiplier}  🛡️ 방어×${defense}${armorText}  ⚡ ${rapidText}${speedText}${regenText}  🎯 조준 버튼 / Z`
    );
    const mineralTotal = Object.values(this.mineralInventory).reduce((sum, count) => sum + count, 0);
    const mineralSummary = (Object.entries(this.mineralInventory) as Array<[MineralType, number]>)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => `${name}×${count}`)
      .join('  ');
    const oreRespawns = this.oreNodes
      .filter((ore) => ore.remaining <= 0 && ore.respawnRemaining > 0)
      .map((ore) => `${({ upper: '오른쪽 위', lower: '왼쪽 아래', upper_left: '왼쪽 위', lower_right: '오른쪽 아래' })[ore.id]} ${Math.ceil(ore.respawnRemaining)}초`)
      .join(' · ');
    const oreTimerText = this.zoneIndex === 1 && oreRespawns ? `\n🪨 광석 재생까지: ${oreRespawns}` : '';
    this.mineralText
      .setText(
        `${mineralTotal > 0 ? `⛏️ 광물: ${mineralSummary}` : '⛏️ 광물: 아직 채굴한 광물이 없어요'}${oreTimerText}`
      )
      .setVisible(this.zoneIndex === 1 || mineralTotal > 0);
    this.bagText.setY(Math.max(132, this.hudText.y + this.hudText.height + 6));
    this.statsText.setY(this.bagText.y + this.bagText.height + 4);
    this.mineralText.setY(this.statsText.y + this.statsText.height + 4);
  }

  update(_time: number, delta: number) {
    const rawDt = delta / 1000;
    const { width, height } = this.scale;

    if (this.menuMode) {
      this.updateMenuKeyboard();
      return;
    }

    this.updateAimingInput();
    const dt = rawDt * (this.aiming ? 0.25 : 1);
    this.armorRemaining = Math.max(0, this.armorRemaining - rawDt);
    this.shockCooldown = Math.max(0, this.shockCooldown - rawDt);
    this.armorGraphics.clear();
    if (this.fleet.equipped === 'sturdy' && this.armorRemaining > 0)
      this.armorGraphics.lineStyle(3, 0xcbd5e1, 0.85).strokeCircle(this.player.x, this.player.y, 36);
    this.updateOreRespawns(rawDt);

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.fleet.equipped !== 'baby_dragon' && this.autoFireEnabled && this.shootHolding && this.shootCooldown <= 0) {
      this.fireBullet();
    }

    if (this.regenAmount > 0 && this.regenInterval > 0) {
      this.regenTimer -= dt;
      if (this.regenTimer <= 0) {
        this.regenTimer = this.regenInterval;
        if (this.playerHp < this.maxHp) {
          const healed = Math.min(this.regenAmount, this.maxHp - this.playerHp);
          this.playerHp += healed;
          this.showNotice(`💚 자동 회복 +${healed} HP`);
          this.audio.playCollect();
        }
      }
    }

    if (this.playerInvuln > 0) {
      this.playerInvuln -= dt;
      this.player.setAlpha(Math.floor(this.playerInvuln * 12) % 2 === 0 ? 0.45 : 1);
    } else {
      this.player.setAlpha(1);
    }

    if (this.noticeTimer > 0) {
      this.noticeTimer -= dt;
      if (this.noticeTimer <= 0) this.noticeText.setVisible(false);
    }

    for (const bubble of this.bubbles) {
      bubble.y -= 35 * dt;
      if (bubble.y < -10) {
        bubble.y = height + 10;
        bubble.x = Phaser.Math.Between(16, width - 16);
      }
    }

    // 키보드 + 가상 조이스틱 이동 결합
    let vx = 0;
    let vy = 0;
    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx /= len;
      vy /= len;
    } else if (this.joyPointerId !== null) {
      vx = this.joyVec.x;
      vy = this.joyVec.y;
    }

    const aimLength = Math.hypot(vx, vy);
    if (aimLength > 0.08) {
      this.aimDirection.x = vx / aimLength;
      this.aimDirection.y = vy / aimLength;
    }

    const previousPlayerX = this.player.x;
    const previousPlayerY = this.player.y;
    if (!this.aiming) {
      this.player.x = Phaser.Math.Clamp(this.player.x + vx * this.speed * dt, 24, width - 24);
      this.player.y = Phaser.Math.Clamp(this.player.y + vy * this.speed * dt, 24, height - 20);
    }
    this.preventPlayerInsideDragon(previousPlayerX, previousPlayerY);
    if (this.zoneIndex === ABYSS_ZONE_INDEX && this.abyssDragon.blocksPlayer(this.player.x, this.player.y)) {
      this.player.setPosition(previousPlayerX, previousPlayerY);
    }
    this.drawAimGuide();
    this.updateMiningInteraction();

    if (vx < -0.08) {
      this.facing = -1;
      this.player.scaleX = -1;
    } else if (vx > 0.08) {
      this.facing = 1;
      this.player.scaleX = 1;
    }

    if (this.keySpace) {
      if (this.autoFireEnabled && this.keySpace.isDown && this.shootCooldown <= 0) {
        this.fireBullet();
      } else if (!this.autoFireEnabled && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.fireBullet();
      }
    }
    if (this.keyB && Phaser.Input.Keyboard.JustDown(this.keyB)) this.tryElectricShock();
    if (this.keyF && Phaser.Input.Keyboard.JustDown(this.keyF)) {
      this.tryCollectNearbyFish();
    }
    if (this.keyT && Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.emptyBagToTank();
    }
    if (this.keyG && Phaser.Input.Keyboard.JustDown(this.keyG)) {
      this.tryHarvest();
    }
    if (this.keyE && Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.tryMineNearbyOre();
    }
    if (this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM)) {
      const muted = this.audio.toggleMute();
      this.showNotice(muted ? '🔇 사운드 꺼짐 (M)' : '🔊 사운드 켜짐 (M)');
      if (!muted) this.audio.playCollect();
    }

    if (this.zoneIndex === UNDERWORLD_2F_ZONE_INDEX && this.player.x >= width - 26) {
      this.changeZone(NEST_ZONE_INDEX, height * NEST_ENTRANCE.height * 0.6);
      this.player.x = width * NEST_ENTRANCE.width + 40;
      return;
    }
    if (this.zoneIndex === NEST_ZONE_INDEX && (
      (this.player.x <= 26 && this.player.y <= height * NEST_ENTRANCE.height) ||
      (this.player.y <= 26 && this.player.x <= width * NEST_ENTRANCE.width))) {
      this.changeZone(UNDERWORLD_2F_ZONE_INDEX, height * 0.52);
      this.player.x = width - 70;
      return;
    }

    if (this.player.y >= height - 22 && this.zoneIndex < LAST_DEPTH_ZONE_INDEX) {
      if (this.zoneIndex === DRAGON_ZONE_INDEX && !this.dragonPassUnlocked) {
        this.player.y = height - 26;
        this.audio.playDenied();
        this.showNotice('수룡을 한 번 토벌하면 아래 통로가 열립니다!');
        return;
      }
      const nextZone = ZONES[this.zoneIndex + 1];
      if (this.level >= nextZone.reqLevel) {
        this.requestZoneChange(this.zoneIndex + 1, 56);
        return;
      } else {
        this.player.y = height - 26;
        this.audio.playDenied();
        this.showNotice(`${nextZone.name} 입장은 Lv.${nextZone.reqLevel} 이상 필요합니다! (현재 Lv.${this.level})`);
      }
    }

    if (this.player.y <= 26 && this.zoneIndex > 0 && this.zoneIndex !== NEST_ZONE_INDEX) {
      this.changeZone(this.zoneIndex - 1, height - 56);
      return;
    }

    this.spawnTimer += dt;
    if (this.zoneIndex !== DRAGON_ZONE_INDEX && this.spawnTimer >= 2.2) {
      this.spawnTimer = 0;
      this.spawnOneFish(false);
    }

    this.updateSubmarineAura(dt);
    const zoneBeforeBoss = this.zoneIndex;
    this.updateDragon(dt);
    if (this.zoneIndex !== zoneBeforeBoss) return;
    this.helicoprion.update(dt);
    // 보스 공격으로 쓰러지면 초심층으로 이동하므로 이번 프레임은 여기서 끝냅니다.
    if (this.zoneIndex !== zoneBeforeBoss) return;
    this.abyssDragon.update(dt);
    if (this.zoneIndex !== zoneBeforeBoss) return;
    this.updateDragonBreath(dt);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const previousX = b.gfx.x; const previousY = b.gfx.y;
      b.gfx.x += b.vx * dt;
      b.gfx.y += b.vy * dt;
      b.life -= dt;

      let hit = false;
      const dragonHitboxes = this.getDragonHitboxes();
      if (
        this.zoneIndex === DRAGON_ZONE_INDEX &&
        this.dragonSprite?.visible &&
        (this.dragonState === 'sleeping' || this.dragonState === 'awake') &&
        dragonHitboxes &&
        distanceToSegment(dragonHitboxes.head.x, dragonHitboxes.head.y, previousX, previousY, b.gfx.x, b.gfx.y) <= dragonHitboxes.head.radius
      ) {
        this.damageDragon(b.damage * 2, true, b.gfx.x, b.gfx.y);
        hit = true;
      } else if (
        this.zoneIndex === DRAGON_ZONE_INDEX &&
        this.dragonSprite?.visible &&
        (this.dragonState === 'sleeping' || this.dragonState === 'awake') &&
        dragonHitboxes &&
        segmentHitsRect(previousX, previousY, b.gfx.x, b.gfx.y, dragonHitboxes.body)
      ) {
        this.damageDragon(b.damage);
        hit = true;
      } else if (this.zoneIndex === NEST_ZONE_INDEX && this.helicoprion.hitSegment(previousX, previousY, b.gfx.x, b.gfx.y, 6, b.damage)) {
        hit = true;
      } else if (this.zoneIndex === ABYSS_ZONE_INDEX && this.abyssDragon.hitSegment(previousX, previousY, b.gfx.x, b.gfx.y, 0, b.damage)) {
        hit = true;
      }
      for (const fish of this.fishList) {
        if (hit) break;
        if (fish.stunned || b.hitFish.has(fish)) continue;
        if (distanceToSegment(fish.sprite.x, fish.sprite.y, previousX, previousY, b.gfx.x, b.gfx.y) < 38) {
          b.hitFish.add(fish);
          this.damageFish(fish, b.damage);
          if (!fish.stunned) { applyWeaponStatus(fish.status, b.weapon); this.refreshFishStatus(fish); }
          hit = !b.piercing;
          if (!b.piercing) break;
        }
      }

      if (
        hit ||
        b.life <= 0 ||
        b.gfx.x < -20 ||
        b.gfx.x > width + 20 ||
        b.gfx.y < -20 ||
        b.gfx.y > height + 20
      ) {
        b.gfx.destroy();
        this.bullets.splice(i, 1);
      }
    }

    for (let i = this.fishList.length - 1; i >= 0; i--) {
      const fish = this.fishList[i];
      const fishDt = rawDt > 0 ? fishMovementSeconds(fish.status, rawDt) * dt / rawDt : 0;
      const burnDamage = tickFishStatus(fish.status, rawDt);
      if (burnDamage > 0) this.damageFish(fish, burnDamage);
      this.refreshFishStatus(fish);
      if (fish.stunned) {
        fish.stunTimer -= dt;
        if (fish.stunTimer <= 0) {
          fish.stunned = false;
          fish.aggro = false;
          fish.hp = fish.spec.hp;
          if ('clearTint' in fish.sprite) {
            fish.sprite.clearTint();
          }
          fish.sprite.setAngle(0);
          fish.label.setText(this.formatFishLabel(fish));
        }
      } else if (fishDt <= 0) {
        // 마비는 이동과 접촉 공격만 막으며 수집 가능한 기절 상태와 구분합니다.
      } else if (fish.aggro) {
        const dx = this.player.x - fish.sprite.x;
        const dy = this.player.y - fish.sprite.y;
        const dist = Math.hypot(dx, dy) || 1;
        const chaseSpeed = fish.spec.speed * 1.15;
        fish.sprite.x += (dx / dist) * chaseSpeed * fishDt;
        fish.sprite.y += (dy / dist) * chaseSpeed * fishDt;
        this.setFishFacing(fish.sprite, fish.spec, dx > 0);
        if (dist < 34 && this.damagePlayer(fish.spec.attack ?? 5, fish.spec.name, true)) return;
      } else {
        if (this.zoneIndex >= 2 && fish.spec.aggressive && !fish.spec.provokedOnly) {
          const distToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, fish.sprite.x, fish.sprite.y);
          if (distToPlayer < 115) {
            fish.aggro = true;
            fish.label.setText(this.formatFishLabel(fish));
          }
        }
        fish.phase += fishDt * 2.5;
        fish.sprite.x += fish.vx * fishDt;
        fish.sprite.y = fish.baseY + Math.sin(fish.phase) * 12;

        if (fish.sprite.x < -50 && fish.vx < 0) {
          fish.vx = Math.abs(fish.vx);
          this.setFishFacing(fish.sprite, fish.spec, true);
        } else if (fish.sprite.x > width + 50 && fish.vx > 0) {
          fish.vx = -Math.abs(fish.vx);
          this.setFishFacing(fish.sprite, fish.spec, false);
        }
      }
      fish.label.setPosition(fish.sprite.x, fish.sprite.y - 30);
    }

    this.updateHud();
  }
}
