import Phaser from 'phaser';
import { FISH_SPRITES } from '../assets/fishSprites';
import { GameAudio } from '../audio/GameAudio';

const ROCK_BREAM_SPRITE =
  'data:image/png;base64,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';

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
}

interface BulletEntity {
  gfx: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
}

type DragonState = 'sleeping' | 'awake' | 'dead' | 'respawning';
type DragonAttack = 'breath' | 'arm' | 'tail';
type UpgradeChoice = 'rapid' | 'defense' | 'attack' | 'skip';
type MenuMode = 'start' | 'upgrade' | null;

interface DragonDangerZone {
  type: DragonAttack;
  shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle;
  damage: number;
  timer: number;
}

const ZONES: ZoneConfig[] = [
  { id: 0, name: '초심층', minDepth: 0, maxDepth: 100, reqLevel: 1, topColor: 0x38bdf8, bottomColor: 0x0369a1, floorColor: 0x1e3a8a },
  { id: 1, name: '중심층', minDepth: 100, maxDepth: 200, reqLevel: 5, topColor: 0x0284c7, bottomColor: 0x1e3a8a, floorColor: 0x312e81 },
  { id: 2, name: '심해', minDepth: 200, maxDepth: 300, reqLevel: 10, topColor: 0x1e1b4b, bottomColor: 0x0f172a, floorColor: 0x090d16 },
  { id: 3, name: '지하세계', minDepth: 300, maxDepth: 400, reqLevel: 18, topColor: 0x0f172a, bottomColor: 0x042f2e, floorColor: 0x134e4a },
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

const DRAGON_ZONE_INDEX = 3;
const DRAGON_MAX_HP = 1250;
const DRAGON_RESPAWN_SECONDS = 5 * 60;
const UPGRADE_TITLES = [
  { name: '기본', medal: '🔵', border: 0x0ea5e9, text: '#7dd3fc' },
  { name: 'BRONZE', medal: '🥉', border: 0xb87333, text: '#fdba74' },
  { name: 'SILVER', medal: '🥈', border: 0xc0c0c0, text: '#e2e8f0' },
  { name: 'GOLD', medal: '🥇', border: 0xffd700, text: '#fde047' },
] as const;

export class OceanScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private facing = 1;
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
  private keyEnter!: Phaser.Input.Keyboard.Key;
  private keyNumbers: Phaser.Input.Keyboard.Key[] = [];

  private readonly audio = new GameAudio();

  private zoneIndex = 0;
  private level = 1;
  private readonly maxLevel = 20;
  private bag: string[] = [];
  private readonly maxBag = 15;
  private readonly maxFishPerZone = 12;

  private bgGraphics!: Phaser.GameObjects.Graphics;
  private decoGraphics!: Phaser.GameObjects.Graphics;
  private bubbles: Phaser.GameObjects.Arc[] = [];
  private fishList: FishEntity[] = [];
  private bullets: BulletEntity[] = [];

  private hudText!: Phaser.GameObjects.Text;
  private bagText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private noticeText!: Phaser.GameObjects.Text;
  private noticeTimer = 0;

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

  private dragonState: DragonState = 'sleeping';
  private dragonHp = DRAGON_MAX_HP;
  private dragonHarvests = 0;
  private dragonRespawnRemaining = 0;
  private dragonAttackCooldown = 3;
  private dragonSprite?: Phaser.GameObjects.Image;
  private dragonStatusText?: Phaser.GameObjects.Text;
  private dragonRespawnText?: Phaser.GameObjects.Text;
  private dragonDanger?: DragonDangerZone;
  private dragonDangerGraphics!: Phaser.GameObjects.Graphics;
  private dragonDangerText!: Phaser.GameObjects.Text;
  private dragonBossBar!: Phaser.GameObjects.Graphics;
  private dragonBossText!: Phaser.GameObjects.Text;
  private dragonLoot: string[] = [];

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

  private spawnTimer = 0;
  private shootCooldown = 0;

  constructor() {
    super('OceanScene');
  }

  preload() {
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
    const body = this.add.circle(0, 0, 18, 0xfacc15);
    const visor = this.add.rectangle(9, -3, 13, 9, 0x38bdf8);
    const tank = this.add.rectangle(-14, 0, 8, 16, 0x0284c7);
    this.player.add([tank, body, visor]);
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

    this.createControls();
    this.setupMultiTouchInput();
    this.layoutUI(width, height);

    const unlockAudio = () => this.audio.unlock();
    this.input.keyboard?.on('keydown', unlockAudio);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', unlockAudio);
      this.audio.destroy();
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.layoutUI(gameSize.width, gameSize.height);
    });

    if (this.zoneIndex === DRAGON_ZONE_INDEX) this.ensureDragonVisual();
    else this.spawnFishWave(6);
    this.updateHud();
    this.showStartMenu();
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

      if (
        this.harvestBtnBg.visible &&
        Phaser.Geom.Rectangle.Contains(this.harvestBtnBg.getBounds(), px, py)
      ) {
        this.harvestBtnBg.setScale(0.94);
        this.time.delayedCall(120, () => this.harvestBtnBg.setScale(1));
        this.tryHarvestDragon();
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
      const title = this.add
        .text(width / 2, height * 0.28, '🌊 서바이벌오션', {
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
        .text(width / 2, height * 0.39, '바다를 탐험하고 물고기를 수집하세요!\n구역마다 한 번씩 새로운 강화를 고를 수 있습니다.', {
          fontSize: `${Math.max(14, Math.min(21, width * 0.034))}px`,
          color: '#e0f2fe',
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: Math.max(280, width - 50) },
        })
        .setOrigin(0.5)
        .setDepth(101);
      const buttonWidth = Math.min(360, width - 54);
      const buttonY = height * 0.59;
      const button = this.add
        .rectangle(width / 2, buttonY, buttonWidth, 74, 0x0284c7, 1)
        .setStrokeStyle(4, 0x7dd3fc, 1)
        .setDepth(101);
      const buttonText = this.add
        .text(width / 2, buttonY, '서바이벌오션 시작하기', {
          fontSize: `${Math.max(18, Math.min(25, width * 0.045))}px`,
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(102);
      const hint = this.add
        .text(width / 2, buttonY + 62, '버튼 터치 또는 Enter', { fontSize: '13px', color: '#94a3b8' })
        .setOrigin(0.5)
        .setDepth(101);
      this.menuObjects.push(title, subtitle, button, buttonText, hint);
      this.menuTargets.push({ bounds: button.getBounds(), action: () => this.showUpgradeMenu(0) });
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
    if (nextIndex > this.zoneIndex && !this.completedUpgradeStages.has(nextIndex)) {
      this.showUpgradeMenu(nextIndex, { zoneIndex: nextIndex, spawnY });
      return;
    }
    this.changeZone(nextIndex, spawnY);
  }

  private updateMenuKeyboard() {
    if (!this.menuMode) return;
    if (this.menuMode === 'start' && this.keyEnter && Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
      this.showUpgradeMenu(0);
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

    const harvestX = width / 2;
    const harvestY = height - 82;
    this.harvestBtnBg.setPosition(harvestX, harvestY);
    this.harvestBtnText.setPosition(harvestX, harvestY);

    this.noticeText.setPosition(width / 2, height - 170);
    this.noticeText.setWordWrapWidth(Math.max(260, width - 40));

    this.player.x = Phaser.Math.Clamp(this.player.x, 24, width - 24);
    this.player.y = Phaser.Math.Clamp(this.player.y, 24, height - 20);
    this.statsText.setPosition(14, 80);
    this.layoutDragon();
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

  private damageDragon(amount: number) {
    if (this.dragonState === 'sleeping') this.wakeDragon();
    if (this.dragonState !== 'awake') return;
    this.dragonHp = Math.max(0, this.dragonHp - amount);
    this.audio.playHit();
    if (this.dragonHp <= 0) this.defeatDragon();
    this.refreshDragonUi();
  }

  private defeatDragon() {
    this.dragonState = 'dead';
    this.dragonHarvests = 0;
    this.clearDragonDanger();
    this.audio.playStun();
    this.applyDragonAppearance();
    this.showNotice('수룡 토벌 성공! 회색 사체 가까이에서 갈무리 버튼을 누르세요. (총 3회)');
  }

  private startDragonAttack() {
    if (this.dragonState !== 'awake' || !this.dragonSprite || this.zoneIndex !== DRAGON_ZONE_INDEX) return;
    const { width, height } = this.scale;
    const attack = Phaser.Utils.Array.GetRandom<DragonAttack>(['breath', 'arm', 'tail']);
    let shape: Phaser.Geom.Rectangle | Phaser.Geom.Circle;
    let damage: number;

    if (attack === 'breath') {
      shape = new Phaser.Geom.Rectangle(0, this.dragonSprite.y - 62, width, 124);
      damage = 35;
      this.dragonDangerText.setPosition(width / 2, this.dragonSprite.y);
    } else if (attack === 'arm') {
      shape = new Phaser.Geom.Circle(this.dragonSprite.x + this.dragonSprite.displayWidth * 0.2, this.dragonSprite.y + 35, Math.min(130, width * 0.27));
      damage = 25;
      this.dragonDangerText.setPosition(shape.x, shape.y);
    } else {
      shape = new Phaser.Geom.Circle(this.dragonSprite.x - this.dragonSprite.displayWidth * 0.3, this.dragonSprite.y + 45, Math.min(145, width * 0.3));
      damage = 30;
      this.dragonDangerText.setPosition(shape.x, shape.y);
    }

    this.dragonDanger = { type: attack, shape, damage, timer: 1.15 };
    this.drawDragonDanger();
    this.dragonDangerText.setVisible(true);
  }

  private drawDragonDanger() {
    this.dragonDangerGraphics.clear();
    if (!this.dragonDanger) return;
    this.dragonDangerGraphics.fillStyle(0xef4444, 0.34);
    this.dragonDangerGraphics.lineStyle(4, 0xff1f1f, 0.95);
    const shape = this.dragonDanger.shape;
    if (shape instanceof Phaser.Geom.Rectangle) {
      this.dragonDangerGraphics.fillRectShape(shape).strokeRectShape(shape);
    } else {
      this.dragonDangerGraphics.fillCircleShape(shape).strokeCircleShape(shape);
    }
  }

  private executeDragonAttack() {
    if (!this.dragonDanger) return;
    const { type, shape, damage } = this.dragonDanger;
    const hit = shape.contains(this.player.x, this.player.y);
    const color = type === 'breath' ? 0x38bdf8 : 0xf97316;
    const effect = this.add.graphics().setDepth(8);
    effect.fillStyle(color, 0.72);
    if (shape instanceof Phaser.Geom.Rectangle) effect.fillRectShape(shape);
    else effect.fillCircleShape(shape);
    this.tweens.add({ targets: effect, alpha: 0, duration: 360, onComplete: () => effect.destroy() });
    if (hit) {
      const attackName = type === 'breath' ? '푸른 빛의 브레스' : type === 'arm' ? '팔 휘두르기' : '꼬리 휘두르기';
      this.damagePlayer(damage, `수룡의 ${attackName}`);
    }
    this.clearDragonDanger();
    this.dragonAttackCooldown = Phaser.Math.FloatBetween(3.6, 5.6);
  }

  private clearDragonDanger() {
    this.dragonDanger = undefined;
    this.dragonDangerGraphics?.clear();
    this.dragonDangerText?.setVisible(false);
  }

  private tryHarvestDragon() {
    if (this.zoneIndex !== DRAGON_ZONE_INDEX || this.dragonState !== 'dead' || !this.dragonSprite) return;
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
    this.showNotice(`${reward} 획득! 갈무리 ${this.dragonHarvests}/3`);

    if (this.dragonHarvests >= 3) {
      this.time.delayedCall(450, () => this.beginDragonRespawn());
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
      this.showNotice(`수조에 ${count}마리를 비웠어요! (15마리 가득 채워 비우면 Lv UP)`);
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
      this.decoGraphics.fillStyle(0xfacc15, 0.85);
      this.decoGraphics.fillTriangle(width * 0.15, height - 22, width * 0.2, height - 85, width * 0.25, height - 22);
      this.decoGraphics.fillTriangle(width * 0.72, height - 22, width * 0.78, height - 95, width * 0.84, height - 22);
      this.decoGraphics.fillStyle(0xf472b6, 0.85);
      this.decoGraphics.fillCircle(width * 0.48, height - 32, 16);
    } else if (this.zoneIndex === 2) {
      this.decoGraphics.fillStyle(zone.floorColor, 0.95);
      this.decoGraphics.fillRect(0, height - 20, width, 20);
    } else {
      this.decoGraphics.fillStyle(zone.floorColor, 1);
      this.decoGraphics.fillRect(0, height - 36, width, 36);
      this.decoGraphics.fillStyle(0xef4444, 0.9);
      this.decoGraphics.fillCircle(width - 50, height - 24, 12);
    }
  }

  private showNotice(msg: string) {
    this.noticeText.setText(msg);
    this.noticeText.setVisible(true);
    this.noticeTimer = 2.2;
  }

  private formatFishLabel(fish: { spec: FishSpec; hp: number; stunned: boolean; aggro: boolean }): string {
    if (fish.stunned) {
      return `💫 ${fish.spec.name} (F 수집)`;
    }
    const prefix = fish.aggro ? '⚔️ ' : '';
    return `${prefix}${fish.spec.name} ❤️${fish.hp}/${fish.spec.hp}`;
  }

  private getPoolForCurrentZone(): FishSpec[] {
    if (this.zoneIndex === 0) return SHALLOW_FISH;
    if (this.zoneIndex === 1) return MID_FISH;
    if (this.zoneIndex === 2) return DEEP_FISH;
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
      img.setFlipX(!fromLeft);
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
    });
  }

  private fireBullet() {
    if (this.shootCooldown > 0) return;
    this.shootCooldown = 0.22 / this.rapidFireMultiplier;
    this.audio.playShoot();

    const gfx = this.add.circle(this.player.x + this.facing * 22, this.player.y, 6, 0x38bdf8);
    gfx.setStrokeStyle(2, 0xe0f2fe);
    gfx.setDepth(8);

    this.bullets.push({
      gfx,
      vx: this.facing * 520 * this.bulletSpeedMultiplier,
      vy: 0,
      life: 1.5,
    });
  }

  private tryCollectNearbyFish() {
    if (this.bag.length >= this.maxBag) {
      this.audio.playDenied();
      this.showNotice('가방이 15마리로 가득 찼어요! 수조 버튼(T)을 눌러 가방을 비우세요.');
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

  private damagePlayer(amount: number, attackerName: string) {
    if (this.playerInvuln > 0) return;
    const reducedAmount = Math.max(1, Math.ceil(amount / this.defenseMultiplier));
    this.playerHp = Math.max(0, this.playerHp - reducedAmount);
    this.playerInvuln = 1.0;
    this.showNotice(`${attackerName}의 공격! (-${reducedAmount} HP)`);

    if (this.playerHp <= 0) {
      this.audio.playDeath();
      this.playerHp = this.maxHp;
      this.bag = [];
      this.changeZone(0, 120, false);
      this.showNotice('체력이 다 떨어져서 초심층으로 복귀했어요! (HP 회복)');
    } else {
      this.audio.playDamage();
    }
    this.updateHud();
  }

  private changeZone(nextIndex: number, spawnY: number, playSound = true) {
    const previousZoneIndex = this.zoneIndex;
    if (previousZoneIndex === DRAGON_ZONE_INDEX) this.setDragonZoneVisibility(false);
    for (const f of this.fishList) {
      f.sprite.destroy();
      f.label.destroy();
    }
    this.fishList = [];
    this.zoneIndex = nextIndex;
    this.audio.setZone(this.zoneIndex);
    if (playSound) {
      this.audio.playZoneChange(nextIndex > previousZoneIndex);
    }
    this.player.y = spawnY;
    this.drawZoneBackdrop();
    if (this.zoneIndex === DRAGON_ZONE_INDEX) {
      this.ensureDragonVisual();
    } else {
      this.spawnFishWave(6);
    }
    this.showNotice(`${ZONES[this.zoneIndex].name} (${ZONES[this.zoneIndex].minDepth}m~${ZONES[this.zoneIndex].maxDepth}m) 진입!`);
    this.updateHud();
  }

  private updateHud() {
    const zone = ZONES[this.zoneIndex];
    const ratio = Phaser.Math.Clamp((this.player.y - 30) / Math.max(1, this.scale.height - 60), 0, 1);
    const depth = Math.round(zone.minDepth + ratio * (zone.maxDepth - zone.minDepth));

    this.hudText.setText(
      `🌊 ${zone.name}(${depth}m) | ⭐ Lv.${this.level}/${this.maxLevel} | ❤️ ${this.playerHp}/${this.maxHp}`
    );
    const scaleCount = this.dragonLoot.filter((loot) => loot === '수룡의 비늘').length;
    const skullCount = this.dragonLoot.filter((loot) => loot === '수룡의 머리뼈').length;
    const lootSummary =
      this.dragonLoot.length > 0 ? ` | 전리품: 비늘×${scaleCount} 머리뼈×${skullCount}` : '';
    const population = this.zoneIndex === DRAGON_ZONE_INDEX ? '수룡 전용 구역' : `물고기: ${this.fishList.length}/${this.maxFishPerZone}`;
    this.bagText.setText(`🎒 가방: ${this.bag.length}/${this.maxBag}마리 | ${population}${lootSummary}`);
    const rapidText = this.autoFireEnabled ? `난사×${this.rapidFireMultiplier}` : '난사 불가';
    const speedText = this.bulletSpeedMultiplier < 1 ? ' · 총알 느림' : '';
    const regenText = this.regenAmount > 0 ? ` · 회복+${this.regenAmount}/${this.regenInterval}초` : '';
    this.statsText.setText(
      `⚔️ 공격×${this.attackMultiplier}  🛡️ 방어×${this.defenseMultiplier}  ⚡ ${rapidText}${speedText}${regenText}`
    );
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const { width, height } = this.scale;

    if (this.menuMode) {
      this.updateMenuKeyboard();
      return;
    }

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.autoFireEnabled && this.shootHolding && this.shootCooldown <= 0) {
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

    this.player.x = Phaser.Math.Clamp(this.player.x + vx * this.speed * dt, 24, width - 24);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * this.speed * dt, 24, height - 20);

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
    if (this.keyF && Phaser.Input.Keyboard.JustDown(this.keyF)) {
      this.tryCollectNearbyFish();
    }
    if (this.keyT && Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.emptyBagToTank();
    }
    if (this.keyG && Phaser.Input.Keyboard.JustDown(this.keyG)) {
      this.tryHarvestDragon();
    }
    if (this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM)) {
      const muted = this.audio.toggleMute();
      this.showNotice(muted ? '🔇 사운드 꺼짐 (M)' : '🔊 사운드 켜짐 (M)');
      if (!muted) this.audio.playCollect();
    }

    if (this.player.y >= height - 22 && this.zoneIndex < ZONES.length - 1) {
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

    if (this.player.y <= 26 && this.zoneIndex > 0) {
      this.changeZone(this.zoneIndex - 1, height - 56);
      return;
    }

    this.spawnTimer += dt;
    if (this.zoneIndex !== DRAGON_ZONE_INDEX && this.spawnTimer >= 2.2) {
      this.spawnTimer = 0;
      this.spawnOneFish(false);
    }

    this.updateDragon(dt);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.gfx.x += b.vx * dt;
      b.gfx.y += b.vy * dt;
      b.life -= dt;

      let hit = false;
      if (
        this.zoneIndex === DRAGON_ZONE_INDEX &&
        this.dragonSprite?.visible &&
        (this.dragonState === 'sleeping' || this.dragonState === 'awake') &&
        this.dragonSprite.getBounds().contains(b.gfx.x, b.gfx.y)
      ) {
        this.damageDragon(this.bulletDamage * this.attackMultiplier);
        hit = true;
      }
      for (const fish of this.fishList) {
        if (hit) break;
        if (fish.stunned) continue;
        if (Phaser.Math.Distance.Between(b.gfx.x, b.gfx.y, fish.sprite.x, fish.sprite.y) < 38) {
          fish.hp = Math.max(0, fish.hp - this.bulletDamage * this.attackMultiplier);
          hit = true;
          if (fish.hp <= 0) {
            fish.stunned = true;
            fish.aggro = false;
            fish.stunTimer = 8;
            this.audio.playStun();
            if ('setTint' in fish.sprite) {
              fish.sprite.setTint(0x94a3b8);
            }
            fish.sprite.setAngle(180);
          } else {
            if (fish.spec.aggressive) fish.aggro = true;
            this.audio.playHit();
          }
          fish.label.setText(this.formatFishLabel(fish));
          break;
        }
      }

      if (hit || b.life <= 0 || b.gfx.x < -20 || b.gfx.x > width + 20) {
        b.gfx.destroy();
        this.bullets.splice(i, 1);
      }
    }

    for (let i = this.fishList.length - 1; i >= 0; i--) {
      const fish = this.fishList[i];
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
      } else if (fish.aggro) {
        const dx = this.player.x - fish.sprite.x;
        const dy = this.player.y - fish.sprite.y;
        const dist = Math.hypot(dx, dy) || 1;
        const chaseSpeed = fish.spec.speed * 1.15;
        fish.sprite.x += (dx / dist) * chaseSpeed * dt;
        fish.sprite.y += (dy / dist) * chaseSpeed * dt;
        if ('setFlipX' in fish.sprite) {
          fish.sprite.setFlipX(dx < 0);
        }
        if (dist < 34) {
          this.damagePlayer(fish.spec.attack ?? 5, fish.spec.name);
        }
      } else {
        if (this.zoneIndex >= 2 && fish.spec.aggressive) {
          const distToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, fish.sprite.x, fish.sprite.y);
          if (distToPlayer < 115) {
            fish.aggro = true;
            fish.label.setText(this.formatFishLabel(fish));
          }
        }
        fish.phase += dt * 2.5;
        fish.sprite.x += fish.vx * dt;
        fish.sprite.y = fish.baseY + Math.sin(fish.phase) * 12;

        if (fish.sprite.x < -50 && fish.vx < 0) {
          fish.vx = Math.abs(fish.vx);
          if ('setFlipX' in fish.sprite) fish.sprite.setFlipX(false);
        } else if (fish.sprite.x > width + 50 && fish.vx > 0) {
          fish.vx = -Math.abs(fish.vx);
          if ('setFlipX' in fish.sprite) fish.sprite.setFlipX(true);
        }
      }
      fish.label.setPosition(fish.sprite.x, fish.sprite.y - 30);
    }

    this.updateHud();
  }
}
