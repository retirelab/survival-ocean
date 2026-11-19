import Phaser from 'phaser';
import type { GameAudio } from '../audio/GameAudio';
import { BOSS_TRACKS } from '../game/ZoneMusic';
import { segmentHitsRect } from '../game/SubmarineCombat';
import {
  ABYSS_DRAGON as A, attackFor, chooseAbyssAttack, curtainSafeY, harvestAbyssDragon, inCurtain, maxHpFor,
  newAbyssDragon, tickAbyssRespawn, type AbyssAttack, type AbyssDragonSave,
} from '../game/AbyssDragon';

export interface AbyssDragonHost {
  player(): { x: number; y: number };
  /** ignoreInvuln: 긴 브레스처럼 무적시간과 상관없이 연속으로 들어가는 피해 */
  damagePlayer(amount: number, attacker: string, ignoreInvuln?: boolean): void;
  showNotice(message: string): void;
  setHarvestButton(visible: boolean): void;
  addLoot(item: string): void;
}

type Shape = Phaser.Geom.Circle | Phaser.Geom.Polygon | Phaser.Geom.Rectangle;
interface Danger { type: AbyssAttack; shape: Shape; timer: number; targetX: number; targetY: number }
interface Spike { gfx: Phaser.GameObjects.Triangle; vx: number; vy: number }

const LOOT_ICONS: Record<string, string> = {
  '수룡의 역광비늘': 'abyss_loot_scales',
  '수룡의 불멸의 꼬리가시': 'abyss_loot_tail_spike',
  '수룡의 퇴화된 날개': 'abyss_loot_wing',
  '수룡의 머리뼈+': 'abyss_loot_skull_plus',
};

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / lengthSq, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

/**
 * 열수분출공층 보스. 잠든 수룡(지하세계 수룡과 같은 능력)을 쓰러뜨리면 화면이 하얗게 번쩍이며
 * 진화한 수룡(체력 4000, 공격력 80)으로 변합니다. 진화 뒤에는 넓은 브레스, 사방으로 날아가는 꼬리가시,
 * 화면 맨 아래만 피할 수 있는 긴 브레스를 씁니다.
 */
export class AbyssDragonBoss {
  private state: AbyssDragonSave = newAbyssDragon();
  private active = false;
  private evolving = false;
  private cooldown = 0;
  private lastAttack?: AbyssAttack;
  private sinceCurtain = 0;
  private danger?: Danger;
  private curtain?: { remaining: number; tick: number };
  private spikes: Spike[] = [];

  private sprite?: Phaser.GameObjects.Image;
  private statusText?: Phaser.GameObjects.Text;
  private respawnText?: Phaser.GameObjects.Text;
  private dangerGraphics?: Phaser.GameObjects.Graphics;
  private dangerText?: Phaser.GameObjects.Text;
  private curtainGraphics?: Phaser.GameObjects.Graphics;
  private bar?: Phaser.GameObjects.Graphics;
  private barText?: Phaser.GameObjects.Text;
  private flash?: Phaser.GameObjects.Rectangle;

  static preload(scene: Phaser.Scene) {
    scene.load.image('abyss_dragon_evolved', 'assets/boss/abyss-dragon-evolved.png');
    scene.load.image('abyss_loot_scales', 'assets/boss/abyss-loot-scales.png');
    scene.load.image('abyss_loot_tail_spike', 'assets/boss/abyss-loot-tail-spike.png');
    scene.load.image('abyss_loot_wing', 'assets/boss/abyss-loot-wing.png');
    scene.load.image('abyss_loot_skull_plus', 'assets/boss/abyss-loot-skull-plus.png');
  }

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly audio: GameAudio,
    private readonly host: AbyssDragonHost,
  ) {}

  load(save: AbyssDragonSave | undefined) {
    this.state = save ? { ...save } : newAbyssDragon();
  }

  snapshot(): AbyssDragonSave {
    return { ...this.state };
  }

  /** 총알·브레스가 닿을 수 있는 상태(잠듦 포함) */
  private get targetable() {
    return this.active && !this.evolving && !!this.sprite &&
      (this.state.state === 'sleeping' || this.state.state === 'awake' || this.state.state === 'evolved');
  }

  private get fighting() {
    return this.active && !this.evolving && (this.state.state === 'awake' || this.state.state === 'evolved');
  }

  enter() {
    this.active = true;
    this.dangerGraphics = this.scene.add.graphics().setDepth(7);
    this.curtainGraphics = this.scene.add.graphics().setDepth(8);
    this.dangerText = this.scene.add.text(0, 0, '', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold', align: 'center',
      backgroundColor: 'rgba(220, 38, 38, 0.9)', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(9).setVisible(false);
    this.bar = this.scene.add.graphics().setDepth(31);
    this.barText = this.scene.add.text(0, 0, '', { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(32);
    this.cooldown = A.openingDelay;
    this.lastAttack = undefined;
    this.sinceCurtain = 0;
    this.refreshVisual();
    if (this.state.state === 'evolved') {
      this.audio.setBossMusic(BOSS_TRACKS.abyssDragon);
      this.host.showNotice('🔥 진화한 수룡이 기다리고 있습니다!');
    }
  }

  leave() {
    if (!this.active) return;
    // 진화 연출 도중 나가면 진화는 끝난 것으로 처리합니다.
    if (this.evolving) this.finishEvolution(false);
    this.active = false;
    this.evolving = false;
    this.audio.setBossMusic(null);
    this.host.setHarvestButton(false);
    this.clearDanger();
    this.stopCurtain();
    for (const spike of this.spikes) spike.gfx.destroy();
    this.spikes = [];
    if (this.sprite) this.scene.tweens.killTweensOf(this.sprite);
    for (const object of [this.sprite, this.statusText, this.respawnText, this.dangerGraphics, this.dangerText,
      this.curtainGraphics, this.bar, this.barText, this.flash]) object?.destroy();
    this.sprite = this.statusText = this.respawnText = this.dangerText = this.barText = undefined;
    this.dangerGraphics = this.curtainGraphics = this.bar = undefined;
    this.flash = undefined;
  }

  layout(width: number, height: number) {
    if (!this.active) return;
    if (this.sprite) {
      const source = this.sprite.texture.getSourceImage() as HTMLImageElement;
      const scale = Math.min(Math.min(width * 0.64, 620) / source.width, Math.min(height * 0.58, 500) / source.height);
      this.sprite.setScale(scale).setPosition(width * 0.64, height * 0.49);
      this.statusText?.setPosition(this.sprite.x, this.sprite.y - this.sprite.displayHeight * 0.48 - 18);
    }
    this.respawnText?.setPosition(width * 0.64, height * 0.49);
    this.barText?.setPosition(width / 2, 145);
    this.flash?.setSize(width, height).setPosition(0, 0);
    this.drawBar();
  }

  update(dt: number) {
    if (tickAbyssRespawn(this.state, dt) && this.active) {
      this.refreshVisual();
      this.host.showNotice('수룡이 다시 부활해 열수분출공 깊은 곳에서 잠들었습니다.');
    }
    if (!this.active) return;
    if (this.state.state === 'respawning') {
      const seconds = Math.ceil(this.state.respawn);
      this.respawnText?.setText(`🐉 수룡 부활까지\n${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
    }
    this.updateSpikes(dt);
    if (!this.active) return;
    if (this.curtain) {
      this.updateCurtain(dt);
      if (!this.active) return;
    } else if (this.fighting) {
      if (this.danger) {
        this.danger.timer -= dt;
        this.dangerText?.setAlpha(0.65 + Math.sin(this.danger.timer * 24) * 0.35);
        if (this.danger.timer <= 0) this.executeAttack();
      } else {
        this.cooldown -= dt;
        if (this.cooldown <= 0) this.startAttack();
      }
    }
    if (!this.active) return;
    if (this.state.state === 'dead') this.host.setHarvestButton(this.nearCorpse());
    this.drawBar();
  }

  /** 총알·브레스 선분이 닿으면 피해를 주고 true. 머리는 2배 크리티컬입니다. */
  hitSegment(ax: number, ay: number, bx: number, by: number, extraRadius: number, damage: number): boolean {
    if (!this.targetable) return false;
    const boxes = this.hitboxes();
    if (!boxes) return false;
    if (distanceToSegment(boxes.head.x, boxes.head.y, ax, ay, bx, by) <= boxes.head.radius + extraRadius) {
      this.damage(damage * 2, bx, by);
      return true;
    }
    const body = Phaser.Geom.Rectangle.Clone(boxes.body);
    if (extraRadius > 0) Phaser.Geom.Rectangle.Inflate(body, extraRadius, extraRadius);
    if (segmentHitsRect(ax, ay, bx, by, body)) {
      this.damage(damage);
      return true;
    }
    return false;
  }

  /** 주인공이 수룡 몸 안으로 들어가면 true(이동을 되돌려야 함) */
  blocksPlayer(x: number, y: number): boolean {
    if (!this.active || this.state.state === 'respawning') return false;
    const boxes = this.hitboxes();
    if (!boxes) return false;
    const r = 21;
    const body = Phaser.Geom.Rectangle.Clone(boxes.body);
    Phaser.Geom.Rectangle.Inflate(body, r, r);
    return Phaser.Geom.Rectangle.Contains(body, x, y) || Math.hypot(x - boxes.head.x, y - boxes.head.y) <= boxes.head.radius + r;
  }

  tryHarvest(): boolean {
    if (!this.active || this.state.state !== 'dead') return false;
    if (!this.nearCorpse()) {
      this.audio.playDenied();
      this.host.showNotice('진화한 수룡의 사체에 더 가까이 가야 갈무리할 수 있어요.');
      return true;
    }
    const done = this.state.harvests + 1;
    const reward = harvestAbyssDragon(this.state);
    if (!reward) return true;
    this.host.addLoot(reward);
    this.audio.playCollect();
    this.showLoot(reward);
    if ((this.state.state as string) === 'respawning') {
      this.host.setHarvestButton(false);
      this.host.showNotice(`${reward} 획득! 갈무리 ${done}/${A.harvestCount}\n갈무리를 마쳤습니다. 수룡은 5분 뒤 다시 잠든 모습으로 부활합니다.`);
      const sprite = this.sprite;
      if (sprite) this.scene.tweens.add({ targets: sprite, alpha: 0, duration: 450, onComplete: () => { if (this.sprite === sprite) this.refreshVisual(); } });
      this.statusText?.setVisible(false);
    } else {
      this.host.showNotice(`${reward} 획득! 갈무리 ${done}/${A.harvestCount}`);
      this.refreshStatus();
    }
    return true;
  }

  // ---- 화면 ----

  private refreshVisual() {
    if (!this.active) return;
    const { width, height } = this.scene.scale;
    if (this.state.state === 'respawning') {
      this.sprite?.destroy();
      this.statusText?.destroy();
      this.sprite = this.statusText = undefined;
      if (!this.respawnText) {
        this.respawnText = this.scene.add.text(0, 0, '', {
          fontSize: '20px', color: '#fed7aa', fontStyle: 'bold', align: 'center',
          backgroundColor: 'rgba(28, 10, 2, 0.82)', padding: { x: 14, y: 9 },
        }).setOrigin(0.5).setDepth(8);
      }
      this.layout(width, height);
      return;
    }
    this.respawnText?.destroy();
    this.respawnText = undefined;
    const texture = this.state.state === 'evolved' || this.state.state === 'dead' ? 'abyss_dragon_evolved' : 'water_dragon_boss';
    if (!this.sprite) this.sprite = this.scene.add.image(0, 0, texture).setDepth(5);
    else this.sprite.setTexture(texture);
    if (!this.statusText) {
      this.statusText = this.scene.add.text(0, 0, '', {
        fontSize: '16px', color: '#e0f2fe', fontStyle: 'bold',
        backgroundColor: 'rgba(2, 12, 23, 0.72)', padding: { x: 8, y: 5 },
      }).setOrigin(0.5).setDepth(8);
    }
    this.sprite.setAngle(0).setFlipX(false).setVisible(true);
    this.refreshStatus();
    this.layout(width, height);
  }

  private refreshStatus() {
    if (!this.sprite || !this.statusText) return;
    this.sprite.clearTint().setAlpha(1);
    this.statusText.setVisible(true);
    switch (this.state.state) {
      case 'sleeping':
        this.sprite.setTint(0x64748b).setAlpha(0.72);
        this.statusText.setText('💤 깊은 잠에 든 수룡 · 공격하면 깨어납니다');
        break;
      case 'awake':
        this.statusText.setText('🐉 수룡');
        break;
      case 'evolved':
        this.statusText.setText('🔥 진화한 수룡');
        break;
      case 'dead':
        this.sprite.setTintFill(0x7b8794).setAlpha(0.92);
        this.statusText.setText(`☠️ 진화한 수룡의 사체 · 갈무리 ${this.state.harvests}/${A.harvestCount}`);
        break;
    }
  }

  private drawBar() {
    if (!this.bar || !this.barText) return;
    this.bar.clear();
    const show = this.fighting;
    this.barText.setVisible(show);
    if (!show) return;
    const width = this.scene.scale.width;
    const barWidth = Math.min(width - 48, 560);
    const x = (width - barWidth) / 2;
    const max = maxHpFor(this.state.state);
    const evolved = this.state.state === 'evolved';
    this.bar.fillStyle(0x1f2937, 0.95).fillRoundedRect(x, 118, barWidth, 18, 7);
    this.bar.fillStyle(evolved ? 0xf97316 : 0xdc2626, 1)
      .fillRoundedRect(x + 3, 121, (barWidth - 6) * Phaser.Math.Clamp(this.state.hp / max, 0, 1), 12, 5);
    this.barText.setText(`${evolved ? '진화한 수룡' : '수룡'}  ${Math.ceil(this.state.hp)}/${max}`);
  }

  private hitboxes() {
    if (!this.sprite?.visible) return undefined;
    const s = this.sprite;
    const direction = s.flipX ? -1 : 1;
    return {
      body: new Phaser.Geom.Rectangle(s.x - s.displayWidth * 0.25, s.y - s.displayHeight * 0.23, s.displayWidth * 0.5, s.displayHeight * 0.52),
      head: new Phaser.Geom.Circle(s.x + direction * s.displayWidth * 0.27, s.y - s.displayHeight * 0.12,
        Math.min(s.displayWidth * 0.095, s.displayHeight * 0.16)),
    };
  }

  private nearCorpse() {
    if (!this.sprite) return false;
    const p = this.host.player();
    return Math.hypot(p.x - this.sprite.x, p.y - this.sprite.y) <= Math.max(150, this.sprite.displayWidth * 0.42);
  }

  private showLoot(reward: string) {
    const p = this.host.player();
    const icon = this.scene.add.image(p.x, p.y - 45, LOOT_ICONS[reward] ?? 'abyss_loot_scales').setDepth(45);
    const source = icon.texture.getSourceImage() as HTMLImageElement;
    icon.setScale(Math.min(68 / source.width, 68 / source.height));
    this.scene.tweens.add({ targets: icon, y: icon.y - 55, alpha: 0, duration: 1200, ease: 'Cubic.easeOut', onComplete: () => icon.destroy() });
  }

  // ---- 피해와 진화 ----

  private damage(amount: number, critX?: number, critY?: number) {
    if (this.state.state === 'sleeping') {
      this.state.state = 'awake';
      this.cooldown = 2.5;
      this.refreshStatus();
      this.host.showNotice('깊은 잠에 든 수룡이 깨어났습니다! 붉은 위험 표시에서 벗어나세요!');
    }
    if (!this.fighting) return;
    this.state.hp = Math.max(0, this.state.hp - amount);
    this.audio.playHit();
    if (critX !== undefined && critY !== undefined) {
      const text = this.scene.add.text(critX, critY - 10, `크리티컬!  -${Math.round(amount)}`, {
        fontSize: '12px', color: '#fde047', fontStyle: 'bold', stroke: '#7c2d12', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(42);
      this.scene.tweens.add({ targets: text, y: critY - 42, alpha: 0, duration: 720, ease: 'Cubic.Out', onComplete: () => text.destroy() });
    }
    if (this.state.hp > 0) return;
    if (this.state.state === 'awake') this.startEvolution();
    else this.defeat();
  }

  /** 1단계 수룡을 쓰러뜨리면 화면 전체가 하얗게 변했다가 진화한 수룡이 나타납니다. */
  private startEvolution() {
    this.evolving = true;
    this.clearDanger();
    this.stopCurtain();
    if (this.sprite) { this.scene.tweens.killTweensOf(this.sprite); this.sprite.setAngle(0); }
    this.audio.playExplosion();
    this.host.showNotice('수룡의 몸에서 눈부신 빛이 터져 나옵니다…!');
    const { width, height } = this.scene.scale;
    this.flash = this.scene.add.rectangle(0, 0, width, height, 0xffffff, 1).setOrigin(0, 0).setDepth(100).setAlpha(0);
    this.scene.tweens.add({
      targets: this.flash, alpha: 1, duration: 500, ease: 'Sine.easeIn',
      onComplete: () => {
        if (!this.active || !this.evolving) return;
        this.finishEvolution(true);
        this.scene.time.delayedCall(450, () => {
          if (!this.flash) return;
          this.scene.tweens.add({
            targets: this.flash, alpha: 0, duration: 900, ease: 'Sine.easeOut',
            onComplete: () => { this.flash?.destroy(); this.flash = undefined; },
          });
        });
      },
    });
  }

  private finishEvolution(announce: boolean) {
    this.evolving = false;
    this.state.state = 'evolved';
    this.state.hp = A.evolvedHp;
    this.cooldown = A.openingDelay + 1.4;
    this.lastAttack = undefined;
    this.sinceCurtain = 0;
    if (!announce) return;
    this.refreshVisual();
    this.audio.setBossMusic(BOSS_TRACKS.abyssDragon);
    this.audio.playLevelUp();
    this.scene.cameras.main.shake(500, 0.01);
    this.host.showNotice('🔥 수룡이 진화했다! 진화한 수룡 (체력 4000 · 공격력 80)\n긴 브레스는 화면 맨 아래로 피하세요!');
  }

  private defeat() {
    this.state.state = 'dead';
    this.state.hp = 0;
    this.state.harvests = 0;
    this.clearDanger();
    this.stopCurtain();
    for (const spike of this.spikes) spike.gfx.destroy();
    this.spikes = [];
    if (this.sprite) { this.scene.tweens.killTweensOf(this.sprite); this.sprite.setAngle(0); }
    this.audio.setBossMusic(null);
    this.audio.playBossVictory();
    this.refreshStatus();
    this.host.showNotice(`🔥 진화한 수룡 토벌 성공! 회색 사체 가까이에서 갈무리 버튼을 누르세요. (총 ${A.harvestCount}회)`);
  }

  // ---- 공격 ----

  private startAttack() {
    if (!this.sprite) return;
    const { width, height } = this.scene.scale;
    const evolved = this.state.state === 'evolved';
    const attack = chooseAbyssAttack(evolved, this.lastAttack, this.sinceCurtain);
    this.lastAttack = attack;
    this.sinceCurtain = attack === 'curtain' ? 0 : this.sinceCurtain + 1;
    const p = this.host.player();
    const targetX = Phaser.Math.Clamp(p.x, 28, width - 28);
    const targetY = Phaser.Math.Clamp(p.y, 90, height - 35);
    const headDirection = targetX < this.sprite.x ? -1 : 1;
    this.sprite.setFlipX(headDirection < 0);
    let shape: Shape;

    if (attack === 'curtain') {
      shape = new Phaser.Geom.Rectangle(0, 0, width, curtainSafeY(height));
      this.dangerText?.setText('⚠️ 긴 브레스!\n⬇ 화면 맨 아래로 피하세요 ⬇').setPosition(width / 2, height * 0.42);
      this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 18, duration: 600, yoyo: true, ease: 'Sine.easeInOut' });
      this.danger = { type: attack, shape, timer: A.curtainWindup, targetX, targetY };
    } else if (attack === 'breath') {
      const mouthX = this.sprite.x + headDirection * this.sprite.displayWidth * 0.28;
      const mouthY = this.sprite.y - this.sprite.displayHeight * 0.12;
      shape = beam(mouthX, mouthY, targetX, targetY, Math.hypot(width, height) * 1.25, evolved ? A.evolvedBreathWidth : A.baseBreathWidth);
      const angle = Phaser.Math.RadToDeg(Math.atan2(targetY - mouthY, targetX - mouthX));
      this.scene.tweens.add({ targets: this.sprite, angle: Phaser.Math.Clamp((headDirection < 0 ? angle - 180 : angle) * 0.12, -9, 9), duration: 180 });
      this.dangerText?.setText(evolved ? '⚠️ 넓은 브레스!' : '⚠️').setPosition((mouthX + targetX) / 2, (mouthY + targetY) / 2);
    } else if (attack === 'arm') {
      shape = new Phaser.Geom.Circle(targetX, targetY, Math.min(105, width * 0.22));
      this.dangerText?.setText('⚠️').setPosition(targetX, targetY);
      this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 12, duration: 150, yoyo: true, repeat: 1 });
    } else {
      shape = new Phaser.Geom.Circle(targetX, targetY, Math.min(125, width * 0.26));
      this.dangerText?.setText(evolved ? '⚠️ 꼬리가시!' : '⚠️').setPosition(targetX, targetY);
      this.scene.tweens.add({ targets: this.sprite, angle: headDirection < 0 ? -6 : 6, duration: 105, yoyo: true, repeat: 2 });
    }
    if (!this.danger) this.danger = { type: attack, shape, timer: A.telegraph, targetX, targetY };
    this.drawDanger();
    this.dangerText?.setVisible(true);
  }

  private drawDanger() {
    const g = this.dangerGraphics;
    if (!g || !this.danger) return;
    g.clear().fillStyle(0xef4444, this.danger.type === 'curtain' ? 0.22 : 0.34).lineStyle(4, 0xff1f1f, 0.95);
    const shape = this.danger.shape;
    if (shape instanceof Phaser.Geom.Rectangle) g.fillRectShape(shape).strokeRectShape(shape);
    else if (shape instanceof Phaser.Geom.Circle) g.fillCircleShape(shape).strokeCircleShape(shape);
    else g.fillPoints(shape.points, true).strokePoints(shape.points, true);
    if (this.danger.type === 'curtain') {
      const { width, height } = this.scene.scale;
      const safeY = curtainSafeY(height);
      g.fillStyle(0x22c55e, 0.25).fillRect(0, safeY, width, height - safeY);
      g.lineStyle(3, 0x4ade80, 0.9).lineBetween(0, safeY, width, safeY);
    }
  }

  private clearDanger() {
    this.danger = undefined;
    this.dangerGraphics?.clear();
    this.dangerText?.setVisible(false);
  }

  private executeAttack() {
    const danger = this.danger;
    if (!danger) return;
    if (danger.type === 'curtain') {
      this.clearDanger();
      this.curtain = { remaining: A.curtainDuration, tick: 0 };
      this.audio.playCharge();
      return;
    }
    const p = this.host.player();
    const { shape, type, targetX, targetY } = danger;
    const hit = shape instanceof Phaser.Geom.Rectangle ? Phaser.Geom.Rectangle.Contains(shape, p.x, p.y)
      : shape instanceof Phaser.Geom.Circle ? Phaser.Geom.Circle.Contains(shape, p.x, p.y)
        : Phaser.Geom.Polygon.Contains(shape, p.x, p.y);
    const effect = this.scene.add.graphics().setDepth(8);
    effect.fillStyle(type === 'breath' ? 0x38bdf8 : 0xf97316, 0.72);
    if (shape instanceof Phaser.Geom.Circle) effect.fillCircleShape(shape);
    else if (shape instanceof Phaser.Geom.Polygon) effect.fillPoints(shape.points, true);
    this.scene.tweens.add({ targets: effect, alpha: 0, duration: 360, onComplete: () => effect.destroy() });
    if (type === 'arm') this.playArmSlam(targetX, targetY);
    else if (type === 'tail') this.playTailSwing(targetX, targetY);
    else if (this.sprite) {
      const sprite = this.sprite;
      this.scene.tweens.add({ targets: sprite, x: sprite.x + (sprite.flipX ? 8 : -8), duration: 90, yoyo: true, onComplete: () => sprite.setAngle(0) });
    }
    this.clearDanger();
    this.cooldown = 0;
    if (hit) {
      const name = type === 'breath' ? (this.state.state === 'evolved' ? '넓은 푸른 빛의 브레스' : '푸른 빛의 브레스')
        : type === 'arm' ? '팔 휘두르기' : '꼬리 휘두르기';
      this.host.damagePlayer(attackFor(this.state.state), `수룡의 ${name}`);
    }
  }

  private playArmSlam(targetX: number, targetY: number) {
    const arm = this.scene.add.rectangle(targetX, targetY - 145, 34, 150, 0xf97316, 0.88).setOrigin(0.5, 1).setStrokeStyle(4, 0xfed7aa, 0.95).setDepth(9);
    const claw = this.scene.add.circle(targetX, targetY - 145, 28, 0xfb923c, 0.9).setDepth(9);
    this.scene.tweens.add({ targets: [arm, claw], y: targetY + 18, duration: 180, ease: 'Cubic.easeIn', onComplete: () => { arm.destroy(); claw.destroy(); this.sprite?.setAngle(0); } });
  }

  private playTailSwing(targetX: number, targetY: number) {
    if (!this.sprite) return;
    const sprite = this.sprite;
    const direction = sprite.flipX ? 1 : -1;
    const tailX = sprite.x + direction * sprite.displayWidth * 0.32;
    const tailY = sprite.y + sprite.displayHeight * 0.05;
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(tailX, tailY),
      new Phaser.Math.Vector2((tailX + targetX) / 2, Math.min(tailY, targetY) - 110),
      new Phaser.Math.Vector2(targetX, targetY),
    );
    const effect = this.scene.add.graphics().setDepth(9);
    effect.lineStyle(26, 0x0f766e, 0.9).strokePoints(curve.getPoints(28), false);
    effect.lineStyle(5, this.state.state === 'evolved' ? 0xfb923c : 0x5eead4, 0.95).strokePoints(curve.getPoints(28), false);
    this.scene.tweens.add({ targets: effect, alpha: 0, duration: 320, onComplete: () => effect.destroy() });
    this.scene.tweens.add({ targets: sprite, angle: sprite.flipX ? 12 : -12, duration: 110, yoyo: true, onComplete: () => sprite.setAngle(0) });
    if (this.state.state === 'evolved') this.launchSpikes(targetX, targetY);
  }

  /** 진화한 수룡의 꼬리 휘두르기: 꼬리가 닿은 곳에서 가시가 사방으로 날아갑니다. */
  private launchSpikes(x: number, y: number) {
    const offset = Math.random() * Math.PI * 2;
    for (let i = 0; i < A.spikeCount; i++) {
      const angle = offset + (i / A.spikeCount) * Math.PI * 2;
      const gfx = this.scene.add.triangle(x, y, 0, -5, 18, 0, 0, 5, 0xf8fafc).setStrokeStyle(1.5, 0xf97316).setDepth(9).setRotation(angle);
      this.spikes.push({ gfx, vx: Math.cos(angle) * A.spikeSpeed, vy: Math.sin(angle) * A.spikeSpeed });
    }
  }

  private updateSpikes(dt: number) {
    if (this.spikes.length === 0) return;
    const { width, height } = this.scene.scale;
    const p = this.host.player();
    for (let i = this.spikes.length - 1; i >= 0; i--) {
      const spike = this.spikes[i];
      const px = spike.gfx.x;
      const py = spike.gfx.y;
      spike.gfx.x += spike.vx * dt;
      spike.gfx.y += spike.vy * dt;
      const hit = distanceToSegment(p.x, p.y, px, py, spike.gfx.x, spike.gfx.y) <= A.spikeRadius + 8;
      const gone = spike.gfx.x < -30 || spike.gfx.x > width + 30 || spike.gfx.y < -30 || spike.gfx.y > height + 30;
      if (hit || gone) {
        spike.gfx.destroy();
        this.spikes.splice(i, 1);
      }
      if (hit) {
        this.host.damagePlayer(attackFor(this.state.state), '수룡의 꼬리가시');
        if (!this.active) return;
      }
    }
  }

  private updateCurtain(dt: number) {
    const curtain = this.curtain;
    if (!curtain) return;
    curtain.remaining -= dt;
    curtain.tick -= dt;
    const { width, height } = this.scene.scale;
    const safeY = curtainSafeY(height);
    const g = this.curtainGraphics;
    if (g) {
      const pulse = 0.5 + Math.sin(curtain.remaining * 30) * 0.12;
      g.clear().fillStyle(0x0284c7, 0.45 + pulse * 0.2).fillRect(0, 0, width, safeY);
      for (let i = 0; i < 9; i++) {
        const x = ((i + 0.5) / 9) * width + Math.sin(curtain.remaining * 9 + i) * 14;
        g.fillStyle(0x7dd3fc, 0.55).fillRect(x - 10, 0, 20, safeY);
        g.fillStyle(0xe0f2fe, 0.8).fillRect(x - 3, 0, 6, safeY);
      }
      g.fillStyle(0xe0f2fe, 0.9).fillRect(0, safeY - 6, width, 6);
    }
    const p = this.host.player();
    while (curtain.tick <= 0) {
      curtain.tick += A.curtainTick;
      if (inCurtain(p.y, height)) {
        this.host.damagePlayer(A.curtainDamage, '수룡의 긴 브레스', true);
        if (!this.active) return;
      }
    }
    if (curtain.remaining <= 0) {
      this.stopCurtain();
      this.cooldown = 0.6;
    }
  }

  private stopCurtain() {
    this.curtain = undefined;
    this.curtainGraphics?.clear();
  }
}

function beam(sx: number, sy: number, tx: number, ty: number, length: number, beamWidth: number) {
  const dx = tx - sx;
  const dy = ty - sy;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const px = -uy * beamWidth / 2;
  const py = ux * beamWidth / 2;
  const ex = sx + ux * length;
  const ey = sy + uy * length;
  return new Phaser.Geom.Polygon([
    new Phaser.Geom.Point(sx + px, sy + py), new Phaser.Geom.Point(ex + px, ey + py),
    new Phaser.Geom.Point(ex - px, ey - py), new Phaser.Geom.Point(sx - px, sy - py),
  ]);
}
