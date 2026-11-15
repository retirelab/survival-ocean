import Phaser from 'phaser';
import { FISH_SPRITES } from '../assets/fishSprites';

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
  { key: 'tuna', name: '참다랑어', hp: 3, speed: 120, exp: 45, scale: 0.72 },
  { key: 'salmon', name: '연어', hp: 2, speed: 105, exp: 30, scale: 0.68 },
  { key: 'red_seabream', name: '참돔', hp: 2, speed: 95, exp: 28, scale: 0.68 },
  { key: 'rock_bream', name: '돌돔', hp: 2, speed: 90, exp: 28, scale: 0.68 },
  { key: 'trout', name: '송어', hp: 1, speed: 110, exp: 22, scale: 0.68 },
  { key: 'shrimp', name: '흰다리새우', hp: 1, speed: 80, exp: 18, scale: 0.75 },
  { key: 'flounder', name: '광어', hp: 2, speed: 75, exp: 25, scale: 0.7 },
  { key: 'eel', name: '붕장어', hp: 2, speed: 115, exp: 32, scale: 0.7 },
];

export class OceanScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private facing = 1;
  private speed = 240;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyF!: Phaser.Input.Keyboard.Key;

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
      if (!this.textures.exists(key)) {
        this.load.image(key, dataUrl);
      }
    }
  }

  create() {
    const { width, height } = this.scale;

    this.bgGraphics = this.add.graphics();
    this.decoGraphics = this.add.graphics();

    for (let i = 0; i < 18; i++) {
      const bubble = this.add.circle(
        Phaser.Math.Between(20, width - 20),
        Phaser.Math.Between(40, height - 20),
        Phaser.Math.Between(2, 5),
        0xbae6fd,
        0.3
      );
      this.bubbles.push(bubble);
    }

    this.player = this.add.container(width / 2, 120);
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
    }

    this.hudText = this.add
      .text(16, 14, '', {
        fontSize: '16px',
        color: '#f0f9ff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(2, 12, 23, 0.55)',
        padding: { x: 10, y: 6 },
      })
      .setDepth(30);

    this.bagText = this.add
      .text(16, 52, '', {
        fontSize: '14px',
        color: '#fde047',
        backgroundColor: 'rgba(2, 12, 23, 0.55)',
        padding: { x: 10, y: 5 },
      })
      .setDepth(30);

    this.noticeText = this.add
      .text(width / 2, height - 48, '', {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(40)
      .setVisible(false);

    this.createMobileButtons(width, height);
    this.drawZoneBackdrop();
    this.spawnFishWave(6);
    this.updateHud();
  }

  private createMobileButtons(width: number, height: number) {
    const shootBtn = this.add
      .text(width - 150, height - 48, '🔫 발사', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#0284c7',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(35)
      .setInteractive({ useHandCursor: true });

    shootBtn.on('pointerdown', () => {
      this.fireBullet();
    });

    const collectBtn = this.add
      .text(width - 56, height - 48, 'F 수집', {
        fontSize: '16px',
        color: '#0f172a',
        fontStyle: 'bold',
        backgroundColor: '#facc15',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(35)
      .setInteractive({ useHandCursor: true });

    collectBtn.on('pointerdown', () => {
      this.tryCollectNearbyFish();
    });
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
      for (let x = 90; x < width - 80; x += 140) {
        this.decoGraphics.fillRect(x, height - 56, 8, 34);
        this.decoGraphics.fillRect(x + 14, height - 48, 8, 26);
      }
    } else if (this.zoneIndex === 1) {
      this.decoGraphics.fillStyle(zone.floorColor, 0.9);
      this.decoGraphics.fillRect(0, height - 22, width, 22);
      this.decoGraphics.fillStyle(0xfacc15, 0.85);
      this.decoGraphics.fillTriangle(140, height - 22, 165, height - 85, 190, height - 22);
      this.decoGraphics.fillTriangle(620, height - 22, 650, height - 95, 680, height - 22);
      this.decoGraphics.fillStyle(0xf472b6, 0.85);
      this.decoGraphics.fillCircle(390, height - 32, 16);
    } else if (this.zoneIndex === 2) {
      this.decoGraphics.fillStyle(zone.floorColor, 0.95);
      this.decoGraphics.fillRect(0, height - 20, width, 20);
    } else {
      this.decoGraphics.fillStyle(zone.floorColor, 1);
      this.decoGraphics.fillRect(0, height - 36, width, 36);
      this.decoGraphics.fillStyle(0xef4444, 0.9);
      this.decoGraphics.fillCircle(width - 60, height - 24, 12);
    }
  }

  private showNotice(msg: string) {
    this.noticeText.setText(msg);
    this.noticeText.setVisible(true);
    this.noticeTimer = 2.2;
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
      ? Phaser.Math.Between(60, width - 60)
      : fromLeft
        ? -45
        : width + 45;
    const startY = Phaser.Math.Between(95, height - 75);

    let sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;
    if (this.textures.exists(spec.key)) {
      const img = this.add.image(startX, startY, spec.key);
      img.setScale(spec.scale);
      img.setFlipX(!fromLeft);
      sprite = img;
    } else {
      sprite = this.add.ellipse(startX, startY, 64, 30, 0xfb923c);
    }
    sprite.setDepth(5);

    const label = this.add
      .text(startX, startY - 34, spec.name, {
        fontSize: '11px',
        color: '#e0f2fe',
        backgroundColor: 'rgba(2, 12, 23, 0.5)',
        padding: { x: 4, y: 2 },
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
      life: 1.6,
    });
  }

  private tryCollectNearbyFish() {
    if (this.bag.length >= this.maxBag) {
      this.showNotice('가방이 15마리로 가득 찼어요! 초심층 맨 위(0m)로 올라가 비우세요.');
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
    this.bagText.setText(`🎒 물고기 가방: ${this.bag.length} / ${this.maxBag}마리 | 현재 물고기: ${this.fishList.length}/25`);
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
        bubble.x = Phaser.Math.Between(20, width - 20);
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
    if (pointer.isDown && pointer.worldY < height - 90) {
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

    if (this.zoneIndex === 0 && this.player.y <= 34 && this.bag.length > 0) {
      const count = this.bag.length;
      this.bag = [];
      this.showNotice(`수면에서 물고기 ${count}마리를 정리하고 가방을 비웠어요!`);
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
          fish.hp -= 1;
          hit = true;
          if (fish.hp <= 0) {
            fish.stunned = true;
            fish.stunTimer = 8;
            if ('setTint' in fish.sprite) {
              fish.sprite.setTint(0x94a3b8);
            }
            fish.sprite.setAngle(180);
            fish.label.setText(`💫 ${fish.spec.name} (F 수집)`);
          }
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
          fish.label.setText(fish.spec.name);
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
      fish.label.setPosition(fish.sprite.x, fish.sprite.y - 34);
    }

    this.updateHud();
  }
}
