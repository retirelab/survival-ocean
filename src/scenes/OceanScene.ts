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

export class OceanScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private facing = 1;
  private speed = 250;
  private readonly bulletDamage = 1;
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

    this.spawnFishWave(6);
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
  }

  private setupMultiTouchInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.audio.unlock();
      const px = pointer.x;
      const py = pointer.y;

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

    this.noticeText.setPosition(width / 2, height - 170);
    this.noticeText.setWordWrapWidth(Math.max(260, width - 40));

    this.player.x = Phaser.Math.Clamp(this.player.x, 24, width - 24);
    this.player.y = Phaser.Math.Clamp(this.player.y, 24, height - 20);
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
    return MID_FISH;
  }

  private spawnFishWave(count: number) {
    for (let i = 0; i < count; i++) {
      this.spawnOneFish(true);
    }
  }

  private spawnOneFish(initial = false) {
    const { width, height } = this.scale;

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
    this.shootCooldown = 0.22;
    this.audio.playShoot();

    const gfx = this.add.circle(this.player.x + this.facing * 22, this.player.y, 6, 0x38bdf8);
    gfx.setStrokeStyle(2, 0xe0f2fe);
    gfx.setDepth(8);

    this.bullets.push({
      gfx,
      vx: this.facing * 520,
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
        this.bag.push(fish.spec.name);
        this.audio.playCollect();
        if (this.bag.length >= this.maxBag) {
          this.showNotice(`${fish.spec.name} 수집! 가방이 가득 찼으니 수조(T)에 비워 레벨업하세요!`);
        } else {
          this.showNotice(`${fish.spec.name} 수집! (가방 ${this.bag.length}/${this.maxBag})`);
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
    this.playerHp = Math.max(0, this.playerHp - amount);
    this.playerInvuln = 1.0;
    this.showNotice(`${attackerName}의 공격! (-${amount} HP)`);

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
    this.spawnFishWave(6);
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
    this.bagText.setText(`🎒 가방: ${this.bag.length}/${this.maxBag}마리 | 물고기: ${this.fishList.length}/${this.maxFishPerZone}`);
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const { width, height } = this.scale;

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.shootHolding && this.shootCooldown <= 0) {
      this.fireBullet();
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

    if (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.fireBullet();
    }
    if (this.keyF && Phaser.Input.Keyboard.JustDown(this.keyF)) {
      this.tryCollectNearbyFish();
    }
    if (this.keyT && Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.emptyBagToTank();
    }
    if (this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM)) {
      const muted = this.audio.toggleMute();
      this.showNotice(muted ? '🔇 사운드 꺼짐 (M)' : '🔊 사운드 켜짐 (M)');
      if (!muted) this.audio.playCollect();
    }

    if (this.player.y >= height - 22 && this.zoneIndex < ZONES.length - 1) {
      const nextZone = ZONES[this.zoneIndex + 1];
      if (this.level >= nextZone.reqLevel) {
        this.changeZone(this.zoneIndex + 1, 56);
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
    if (this.spawnTimer >= 2.2) {
      this.spawnTimer = 0;
      this.spawnOneFish(false);
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.gfx.x += b.vx * dt;
      b.gfx.y += b.vy * dt;
      b.life -= dt;

      let hit = false;
      for (const fish of this.fishList) {
        if (fish.stunned) continue;
        if (Phaser.Math.Distance.Between(b.gfx.x, b.gfx.y, fish.sprite.x, fish.sprite.y) < 38) {
          fish.hp = Math.max(0, fish.hp - this.bulletDamage);
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
