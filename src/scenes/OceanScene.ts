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

  private zoneIndex = 0;
  private level = 1;
  private exp = 0;
  private expToNext = 50;
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

  private damagePlayer(amount: number, attackerName: string) {
    if (this.playerInvuln > 0) return;
    this.playerHp = Math.max(0, this.playerHp - amount);
    this.playerInvuln = 1.0;
    this.showNotice(`${attackerName}의 공격! (-${amount} HP)`);

    if (this.playerHp <= 0) {
      this.playerHp = this.maxHp;
      this.bag = [];
      this.changeZone(0, 120);
      this.showNotice('체력이 다 떨어져서 초심층으로 복귀했어요! (HP 회복)');
    }
    this.updateHud();
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
      `🌊 ${zone.name}(${depth}m) | ⭐ Lv.${this.level} | ❤️ ${this.playerHp}/${this.maxHp}`
    );
    this.bagText.setText(`🎒 가방: ${this.bag.length}/${this.maxBag}마리 | 물고기: ${this.fishList.length}/${this.maxFishPerZone}`);
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const { width, height } = this.scale;

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
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
        if (Phaser.Math.Distance.Between(b.gfx.x, b.gfx.y, fish.sprite.x, fish.sprite.y) < 38) {
          fish.hp = Math.max(0, fish.hp - this.bulletDamage);
          hit = true;
          if (fish.hp <= 0) {
            fish.stunned = true;
            fish.aggro = false;
            fish.stunTimer = 8;
            if ('setTint' in fish.sprite) {
              fish.sprite.setTint(0x94a3b8);
            }
            fish.sprite.setAngle(180);
          } else if (fish.spec.aggressive) {
            fish.aggro = true;
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
