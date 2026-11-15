import Phaser from 'phaser';
import { FISH_SPRITES } from '../assets/fishSprites';

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
}

interface FishEntity {
  sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;
  label: Phaser.GameObjects.Text;
  spec: FishSpec;
  hp: number;
  vx: number;
  stunned: boolean;
  stunTimer: number;
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
  { id: 1, name: '중심층', minDepth: 100, maxDepth: 200, reqLevel: 30, topColor: 0x0284c7, bottomColor: 0x1e3a8a, floorColor: 0x312e81 },
  { id: 2, name: '심해', minDepth: 200, maxDepth: 300, reqLevel: 60, topColor: 0x1e1b4b, bottomColor: 0x0f172a, floorColor: 0x090d16 },
  { id: 3, name: '지하세계', minDepth: 300, maxDepth: 400, reqLevel: 80, topColor: 0x0f172a, bottomColor: 0x042f2e, floorColor: 0x134e4a },
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

export class OceanScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private facing = 1;
  private speed = 250;
  private readonly bulletDamage = 1;

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

  private zoneIndex = 0;
  private level = 1;
  private exp = 0;
  private expToNext = 50;
  private bag: string[] = [];
  private readonly maxBag = 15;
  private readonly maxFishPerZone = 25;

  private bgGraphics!: Phaser.GameObjects.Graphics;
  private decoGraphics!: Phaser.GameObjects.Graphics;
  private bubbles: Phaser.GameObjects.Arc[] = [];
  private fishList: FishEntity[] = [];
  private bullets: BulletEntity[] = [];

  private hudText!: Phaser.GameObjects.Text;
  private bagText!: Phaser.GameObjects.Text;
  private noticeText!: Phaser.GameObjects.Text;
  private noticeTimer = 0;

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

    this.bgGraphics = this.add.graphics();
    this.decoGraphics = this.add.graphics();

    for (let i = 0; i < 20; i++) {
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
    }

    this.hudText = this.add
      .text(12, 12, '', {
        fontSize: '14px',
        color: '#f0f9ff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 12, 23, 0.6)',
        padding: { x: 10, y: 6 },
      })
      .setDepth(30);

    this.bagText = this.add
      .text(12, 46, '', {
        fontSize: '13px',
        color: '#fde047',
        backgroundColor: 'rgba(2, 12, 23, 0.6)',
        padding: { x: 10, y: 5 },
      })
      .setDepth(30);

    this.noticeText = this.add
      .text(width / 2, height - 98, '', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        padding: { x: 12, y: 8 },
        align: 'center',
        wordWrap: { width: width - 40 },
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setVisible(false);

    this.createActionButtons(width, height);
    this.drawZoneBackdrop();
    this.spawnFishWave(6);
    this.updateHud();
  }

  private createActionButtons(width: number, height: number) {
    const btnY = height - 42;

    const tankBtn = this.add
      .text(width * 0.2, btnY, '🪣 수조 (T)', {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#0f766e',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(35)
      .setInteractive({ useHandCursor: true });

    tankBtn.on('pointerdown', () => {
      this.emptyBagToTank();
    });

    const shootBtn = this.add
      .text(width * 0.52, btnY, '🔫 발사', {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#0284c7',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(35)
      .setInteractive({ useHandCursor: true });

    shootBtn.on('pointerdown', () => {
      this.fireBullet();
    });

    const collectBtn = this.add
      .text(width * 0.82, btnY, 'F 수집', {
        fontSize: '15px',
        color: '#0f172a',
        fontStyle: 'bold',
        backgroundColor: '#facc15',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(35)
      .setInteractive({ useHandCursor: true });

    collectBtn.on('pointerdown', () => {
      this.tryCollectNearbyFish();
    });
  }

  private emptyBagToTank() {
    if (this.bag.length === 0) {
      this.showNotice('가방이 이미 비어 있어요!');
      return;
    }
    const count = this.bag.length;
    this.bag = [];
    this.showNotice(`수조에 물고기 ${count}마리를 옮겨 가방을 비웠어요!`);
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
      for (let x = 50; x < width - 40; x += 110) {
        this.decoGraphics.fillRect(x, height - 56, 8, 34);
        this.decoGraphics.fillRect(x + 14, height - 48, 8, 26);
      }
    } else if (this.zoneIndex === 1) {
      this.decoGraphics.fillStyle(zone.floorColor, 0.9);
      this.decoGraphics.fillRect(0, height - 22, width, 22);
      this.decoGraphics.fillStyle(0xfacc15, 0.85);
      this.decoGraphics.fillTriangle(70, height - 22, 95, height - 85, 120, height - 22);
      this.decoGraphics.fillTriangle(350, height - 22, 380, height - 95, 410, height - 22);
      this.decoGraphics.fillStyle(0xf472b6, 0.85);
      this.decoGraphics.fillCircle(230, height - 32, 16);
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

  private formatFishLabel(fish: { spec: FishSpec; hp: number; stunned: boolean }): string {
    if (fish.stunned) {
      return `💫 ${fish.spec.name} (F 수집)`;
    }
    return `${fish.spec.name} ❤️${fish.hp}/${fish.spec.hp}`;
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

    const spec = Phaser.Utils.Array.GetRandom(SHALLOW_FISH);
    const fromLeft = Math.random() < 0.5;
    const startX = initial
      ? Phaser.Math.Between(50, width - 50)
      : fromLeft
        ? -45
        : width + 45;
    const startY = Phaser.Math.Between(110, height - 120);

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
      .text(startX, startY - 30, this.formatFishLabel({ spec, hp: spec.hp, stunned: false }), {
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
      baseY: startY,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private fireBullet() {
    if (this.shootCooldown > 0) return;
    this.shootCooldown = 0.22;

    const gfx = this.add.circle(this.player.x + this.facing * 22, this.player.y, 6, 0x38bdf8);
    gfx.setStrokeStyle(2, 0xe0f2fe);
    gfx.setDepth(8);

    this.bullets.push({
      gfx,
      vx: this.facing * 520,
      vy: 0,
      life: 1.4,
    });
  }

  private tryCollectNearbyFish() {
    if (this.bag.length >= this.maxBag) {
      this.showNotice('가방이 15마리로 가득 찼어요! 수조 버튼(T)을 눌러 가방을 비우세요.');
      return;
    }

    let collected = false;
    for (let i = 0; i < this.fishList.length; i++) {
      const fish = this.fishList[i];
      if (!fish.stunned) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, fish.sprite.x, fish.sprite.y);
      if (dist <= 72) {
        this.bag.push(fish.spec.name);
        this.gainExp(fish.spec.exp);
        this.showNotice(`${fish.spec.name} 수집! (+${fish.spec.exp} EXP)`);
        fish.sprite.destroy();
        fish.label.destroy();
        this.fishList.splice(i, 1);
        collected = true;
        break;
      }
    }

    if (!collected) {
      this.showNotice('가까이에 기절한 물고기가 없어요! 총알로 먼저 기절시키세요.');
    }
    this.updateHud();
  }

  private gainExp(amount: number) {
    this.exp += amount;
    while (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level += 1;
      this.expToNext = Math.round(this.expToNext * 1.15);
      this.showNotice(`레벨 업! Lv.${this.level} 달성!`);
    }
  }

  private changeZone(nextIndex: number, spawnY: number) {
    for (const f of this.fishList) {
      f.sprite.destroy();
      f.label.destroy();
    }
    this.fishList = [];
    this.zoneIndex = nextIndex;
    this.player.y = spawnY;
    this.drawZoneBackdrop();
    this.spawnFishWave(6);
    this.showNotice(`${ZONES[this.zoneIndex].name} (${ZONES[this.zoneIndex].minDepth}m~${ZONES[this.zoneIndex].maxDepth}m) 진입!`);
    this.updateHud();
  }

  private updateHud() {
    const zone = ZONES[this.zoneIndex];
    const ratio = Phaser.Math.Clamp((this.player.y - 30) / (this.scale.height - 60), 0, 1);
    const depth = Math.round(zone.minDepth + ratio * (zone.maxDepth - zone.minDepth));

    this.hudText.setText(
      `🌊 ${zone.name} (${depth}m) | ⭐ Lv.${this.level} (${this.exp}/${this.expToNext})`
    );
    this.bagText.setText(`🎒 가방: ${this.bag.length}/${this.maxBag}마리 | 물고기: ${this.fishList.length}/25`);
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const { width, height } = this.scale;

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
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

    let vx = 0;
    let vy = 0;
    if (this.cursors) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
    }

    const pointer = this.input.activePointer;
    if (pointer.isDown && pointer.worldY < height - 85) {
      const dx = pointer.worldX - this.player.x;
      const dy = pointer.worldY - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        vx = dx / dist;
        vy = dy / dist;
      }
    } else if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx /= len;
      vy /= len;
    }

    this.player.x = Phaser.Math.Clamp(this.player.x + vx * this.speed * dt, 24, width - 24);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * this.speed * dt, 24, height - 20);

    if (vx < -0.1) {
      this.facing = -1;
      this.player.scaleX = -1;
    } else if (vx > 0.1) {
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

    if (this.player.y >= height - 22 && this.zoneIndex < ZONES.length - 1) {
      const nextZone = ZONES[this.zoneIndex + 1];
      if (this.level >= nextZone.reqLevel) {
        this.changeZone(this.zoneIndex + 1, 56);
        return;
      } else {
        this.player.y = height - 26;
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
        if (Phaser.Math.Distance.Between(b.gfx.x, b.gfx.y, fish.sprite.x, fish.sprite.y) < 36) {
          fish.hp = Math.max(0, fish.hp - this.bulletDamage);
          hit = true;
          if (fish.hp <= 0) {
            fish.stunned = true;
            fish.stunTimer = 8;
            if ('setTint' in fish.sprite) {
              fish.sprite.setTint(0x94a3b8);
            }
            fish.sprite.setAngle(180);
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
          fish.hp = fish.spec.hp;
          if ('clearTint' in fish.sprite) {
            fish.sprite.clearTint();
          }
          fish.sprite.setAngle(0);
          fish.label.setText(this.formatFishLabel(fish));
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
