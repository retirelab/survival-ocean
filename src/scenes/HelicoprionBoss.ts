import Phaser from 'phaser';
import type { GameAudio } from '../audio/GameAudio';
import { BOSS_TRACKS } from '../game/ZoneMusic';
import {
  BOMB_SPOTS, HELICOPRION as H, NEST_ENTRANCE, NEST_HILLS,
  bombHitDuringCharge, chooseAttack, distanceToBounds, newHelicoprion, segmentPointDistance, tickBombs,
  type HelicoprionSave,
} from '../game/Helicoprion';

export interface HelicoprionHost {
  player(): { x: number; y: number };
  damagePlayer(amount: number, attacker: string): void;
  showNotice(message: string): void;
}

type Phase = 'idle' | 'chargeWindup' | 'charging' | 'jawWindup' | 'recover' | 'stunned';

// 원본 이미지(1000×406) 기준 아래턱 회전축과 아래턱 이미지 안의 회전축 위치
const SOURCE_WIDTH = 1000;
const JAW_PIVOT = { x: 820.3 - 500, y: 274.4 - 203 };
const JAW_ORIGIN = { x: 13.3 / 193, y: 22.4 / 109 };
// 몸통을 따라 놓은 원형 판정(머리→꼬리). t는 진행 방향 위치, r은 반지름 (표시 너비 비율)
const HITBOX = [
  { t: 0.42, r: 0.065 },
  { t: 0.2, r: 0.08 },
  { t: -0.05, r: 0.075 },
  { t: -0.3, r: 0.055 },
];
const IDLE_TILT = Phaser.Math.DegToRad(28);

/** 헬리코프리온의 둥지 보스전: 화면 표시, 행동 패턴, 폭탄, 보스 BGM 전환을 담당합니다. */
export class HelicoprionBoss {
  private state: HelicoprionSave = newHelicoprion();
  private active = false;
  private phase: Phase = 'idle';
  private phaseTimer = 0;
  private x = 0;
  private y = 0;
  private heading = Math.PI;
  private displayWidth = 300;
  private charge?: { dx: number; dy: number; remaining: number; hitPlayer: boolean };
  private jawTarget?: { x: number; y: number };

  private container?: Phaser.GameObjects.Container;
  private jaw?: Phaser.GameObjects.Image;
  private bodyImage?: Phaser.GameObjects.Image;
  private bombs: Phaser.GameObjects.Container[] = [];
  private danger?: Phaser.GameObjects.Graphics;
  private dangerText?: Phaser.GameObjects.Text;
  private bar?: Phaser.GameObjects.Graphics;
  private barText?: Phaser.GameObjects.Text;
  private respawnText?: Phaser.GameObjects.Text;

  static preload(scene: Phaser.Scene) {
    scene.load.image('helicoprion_body', 'assets/boss/helicoprion-body.png');
    scene.load.image('helicoprion_jaw', 'assets/boss/helicoprion-jaw.png');
  }

  /** 둥지 배경: 어두운 동굴, 왼쪽 위 노란 출입구, 바닥의 주황 언덕 */
  static drawNest(g: Phaser.GameObjects.Graphics, width: number, height: number) {
    const ew = width * NEST_ENTRANCE.width;
    const eh = height * NEST_ENTRANCE.height;
    g.fillStyle(0xfacc15, 0.16);
    g.fillTriangle(0, 0, ew * 2.1, 0, 0, eh * 2.1);
    g.fillStyle(0xfde047, 0.55);
    g.fillTriangle(0, 0, ew * 1.35, 0, 0, eh * 1.35);
    g.fillStyle(0xfef08a, 0.95);
    g.fillTriangle(0, 0, ew, 0, 0, eh);
    g.fillStyle(0xf97316, 0.95);
    g.fillRect(0, 0, ew * 0.28, eh * 0.75);
    g.fillRect(0, eh * 0.55, ew * 0.55, eh * 0.18);

    const points = NEST_HILLS.map(([x, y]) => new Phaser.Geom.Point(x * width, y * height));
    points.push(new Phaser.Geom.Point(width, height), new Phaser.Geom.Point(0, height));
    g.fillStyle(0xf59e0b, 1);
    g.fillPoints(points, true);
    g.lineStyle(4, 0xfbbf24, 0.85);
    g.strokePoints(points.slice(0, NEST_HILLS.length), false);
    g.lineStyle(3, 0xd97706, 0.55);
    for (let row = 0; row < 5; row++) {
      const y = height * (0.88 + row * 0.025);
      g.lineBetween(width * ((row * 13) % 30) / 100, y, width * (0.55 + ((row * 17) % 40) / 100), y + 4);
    }
  }

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly audio: GameAudio,
    private readonly host: HelicoprionHost,
  ) {}

  load(save: HelicoprionSave | undefined) {
    this.state = save ? { ...save, bombs: [...save.bombs] } : newHelicoprion();
  }

  snapshot(): HelicoprionSave {
    return { hp: this.state.hp, respawn: this.state.respawn, bombs: [...this.state.bombs] };
  }

  get fighting() {
    return this.active && this.state.respawn <= 0 && this.state.hp > 0;
  }

  /** 둥지 입장. 헬리코프리온이 살아 있으면 바로 보스전과 보스 BGM이 시작됩니다. */
  enter() {
    this.active = true;
    const { width, height } = this.scene.scale;
    this.danger = this.scene.add.graphics().setDepth(7);
    this.dangerText = this.scene.add.text(0, 0, '', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: 'rgba(220, 38, 38, 0.9)', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(9).setVisible(false);
    this.bar = this.scene.add.graphics().setDepth(31);
    this.barText = this.scene.add.text(0, 0, '', { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5).setDepth(32);
    this.bombs = BOMB_SPOTS.map(spot => this.createBomb(spot.angle));
    this.x = width * 0.72;
    this.y = height * 0.42;
    this.heading = Math.PI;
    this.layout(width, height);
    if (this.state.respawn > 0) this.showRespawnTimer();
    else this.startFight();
  }

  leave() {
    if (!this.active) return;
    this.active = false;
    this.audio.setBossMusic(null);
    this.destroyBossSprite();
    for (const bomb of this.bombs) bomb.destroy();
    this.bombs = [];
    for (const object of [this.danger, this.dangerText, this.bar, this.barText, this.respawnText]) object?.destroy();
    this.danger = this.dangerText = this.bar = this.barText = this.respawnText = undefined;
    this.charge = undefined;
  }

  layout(width: number, height: number) {
    if (!this.active) return;
    this.displayWidth = Phaser.Math.Clamp(width * 0.36, 180, 340);
    this.clampPosition();
    this.applyTransform();
    const bombHeight = Phaser.Math.Clamp(height * 0.075, 34, 60);
    this.bombs.forEach((bomb, index) => {
      bomb.setPosition(BOMB_SPOTS[index].x * width, BOMB_SPOTS[index].y * height);
      bomb.setScale(bombHeight / 60);
      bomb.setVisible(this.state.bombs[index] <= 0);
    });
    this.barText?.setPosition(width / 2, 145);
    this.respawnText?.setPosition(width * 0.6, height * 0.42);
    this.drawBar();
  }

  /** 매 프레임 호출. 부활·폭탄 재생 시간은 다른 구역에 있어도 흐릅니다. */
  update(dt: number) {
    if (this.state.respawn > 0) {
      this.state.respawn = Math.max(0, this.state.respawn - dt);
      if (this.state.respawn <= 0) {
        this.state.hp = H.maxHp;
        if (this.active) {
          this.respawnText?.destroy();
          this.respawnText = undefined;
          this.host.showNotice('헬리코프리온이 부활했습니다!');
          this.startFight();
        }
      } else if (this.active) {
        const seconds = Math.ceil(this.state.respawn);
        this.respawnText?.setText(`🦈 헬리코프리온 부활까지\n${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`);
      }
    }
    for (const index of tickBombs(this.state.bombs, dt)) {
      const bomb = this.bombs[index];
      if (bomb) {
        bomb.setVisible(true).setAlpha(0);
        this.scene.tweens.add({ targets: bomb, alpha: 1, duration: 400 });
      }
    }
    if (!this.fighting || !this.container) return;
    this.flickerFuses();
    this.phaseTimer -= dt;
    switch (this.phase) {
      case 'idle':
      case 'recover':
        this.drift(dt);
        if (this.phaseTimer <= 0) this.startAttack();
        break;
      case 'chargeWindup':
        // 뒤로 살짝 물러나며 몸을 떠는 돌진 예고
        this.x -= Math.cos(this.heading) * 45 * dt;
        this.y -= Math.sin(this.heading) * 45 * dt;
        this.applyTransform();
        this.container.x += Math.sin(this.phaseTimer * 70) * 3;
        this.dangerText?.setAlpha(0.65 + Math.sin(this.phaseTimer * 24) * 0.35);
        if (this.phaseTimer <= 0) this.beginCharge();
        break;
      case 'charging':
        this.updateCharge(dt);
        break;
      case 'jawWindup':
        this.dangerText?.setAlpha(0.65 + Math.sin(this.phaseTimer * 24) * 0.35);
        if (this.phaseTimer <= 0) this.swingJaw();
        break;
      case 'stunned':
        this.container.angle += Math.sin(this.phaseTimer * 30) * 0.6;
        if (this.phaseTimer <= 0) this.setPhase('recover', 0.6);
        break;
    }
  }

  /** 총알·브레스 선분이 몸에 닿으면 피해를 주고 true를 돌려줍니다. */
  hitSegment(ax: number, ay: number, bx: number, by: number, extraRadius: number, damage: number): boolean {
    if (!this.fighting || !this.container) return false;
    const hit = this.hitCircles().some(c => segmentPointDistance(c.x, c.y, ax, ay, bx, by) <= c.r + extraRadius);
    if (hit) this.damage(damage, false);
    return hit;
  }

  private startFight() {
    if (!this.active) return;
    this.audio.setBossMusic(BOSS_TRACKS.helicoprion);
    this.respawnText?.destroy();
    this.respawnText = undefined;
    if (!this.container) this.createBossSprite();
    this.setPhase('idle', H.openingDelay);
    this.layout(this.scene.scale.width, this.scene.scale.height);
    this.host.showNotice('🦈 헬리코프리온이 나타났다! 멀면 돌진, 가까우면 아래턱을 휘두릅니다.\n💣 B 폭탄 쪽으로 돌진을 유도하면 큰 피해를 줄 수 있어요!');
  }

  private createBossSprite() {
    this.bodyImage = this.scene.add.image(0, 0, 'helicoprion_body');
    this.jaw = this.scene.add.image(JAW_PIVOT.x, JAW_PIVOT.y, 'helicoprion_jaw').setOrigin(JAW_ORIGIN.x, JAW_ORIGIN.y);
    this.container = this.scene.add.container(this.x, this.y, [this.bodyImage, this.jaw]).setDepth(6);
  }

  private destroyBossSprite() {
    if (this.container) this.scene.tweens.killTweensOf([this.container, this.jaw, this.bodyImage]);
    this.container?.destroy();
    this.container = this.jaw = this.bodyImage = undefined;
  }

  private createBomb(angle: number) {
    const g = this.scene.add.graphics();
    g.fillStyle(0x991b1b, 1).fillRoundedRect(-21, -29, 42, 60, 6);
    g.fillStyle(0xdc2626, 1).fillRoundedRect(-18, -26, 36, 54, 5);
    g.lineStyle(5, 0x5b3a1a, 1);
    g.beginPath();
    g.arc(-14, -29, 16, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(345), false);
    g.strokePath();
    const label = this.scene.add.text(0, 1, 'B', { fontSize: '38px', color: '#1f1f1f', fontStyle: 'bold' }).setOrigin(0.5);
    const spark = this.scene.add.circle(-29, -36, 5, 0xfde047).setName('spark');
    return this.scene.add.container(0, 0, [g, label, spark]).setAngle(angle).setDepth(4);
  }

  private flickerFuses() {
    const flicker = 0.55 + Math.random() * 0.45;
    for (const bomb of this.bombs) (bomb.getByName('spark') as Phaser.GameObjects.Arc | null)?.setAlpha(flicker);
  }

  private setPhase(phase: Phase, seconds: number) {
    this.phase = phase;
    this.phaseTimer = seconds;
  }

  private distanceToPlayer() {
    const p = this.host.player();
    return Math.hypot(p.x - this.x, p.y - this.y);
  }

  private drift(dt: number) {
    const p = this.host.player();
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance > H.idleKeepDistance) {
      this.x += (dx / distance) * H.idleSpeed * dt;
      this.y += (dy / distance) * H.idleSpeed * dt;
    }
    this.heading = clampTilt(Math.atan2(dy, dx), IDLE_TILT);
    this.clampPosition();
    this.applyTransform();
  }

  private startAttack() {
    const p = this.host.player();
    if (chooseAttack(this.distanceToPlayer()) === 'charge') {
      // 돌진 방향은 예고 순간의 주인공 위치로 고정하고, 벽에 닿을 때까지 직진합니다.
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const len = Math.hypot(dx, dy) || 1;
      this.heading = Math.atan2(dy, dx);
      this.charge = { dx: dx / len, dy: dy / len, remaining: distanceToBounds(this.x, this.y, dx, dy, this.bounds()), hitPlayer: false };
      this.drawChargeDanger();
      this.audio.playCharge();
      this.setPhase('chargeWindup', H.chargeWindup);
    } else {
      this.heading = clampTilt(Math.atan2(p.y - this.y, p.x - this.x), IDLE_TILT);
      const head = this.headPoint();
      this.jawTarget = { x: head.x + Math.cos(this.heading) * 30, y: head.y + Math.sin(this.heading) * 30 };
      this.drawDangerCircle(this.jawTarget.x, this.jawTarget.y, H.jawRadius, '⚠️ 아래턱!');
      if (this.jaw) this.scene.tweens.add({ targets: this.jaw, angle: 24, duration: H.jawWindup * 900, ease: 'Sine.easeOut' });
      this.setPhase('jawWindup', H.jawWindup);
    }
    this.applyTransform();
  }

  private beginCharge() {
    this.clearDanger();
    this.setPhase('charging', 99);
  }

  private updateCharge(dt: number) {
    const charge = this.charge;
    if (!charge) { this.setPhase('recover', H.chargeRecover); return; }
    const step = Math.min(charge.remaining, H.chargeSpeed * dt);
    const before = this.headPoint();
    this.x += charge.dx * step;
    this.y += charge.dy * step;
    charge.remaining -= step;
    this.applyTransform();
    const after = this.headPoint();

    const { width, height } = this.scene.scale;
    const bombRadius = Phaser.Math.Clamp(height * 0.075, 34, 60) * 0.42;
    const bombIndex = bombHitDuringCharge(before, after, this.displayWidth * HITBOX[0].r, BOMB_SPOTS.map((spot, index) => ({
      x: spot.x * width, y: spot.y * height, radius: bombRadius, armed: this.state.bombs[index] <= 0,
    })));
    if (bombIndex >= 0) { this.explodeBomb(bombIndex); return; }

    if (!charge.hitPlayer) {
      const p = this.host.player();
      if (this.hitCircles().some(c => Math.hypot(c.x - p.x, c.y - p.y) <= c.r + 18)) {
        charge.hitPlayer = true;
        this.host.damagePlayer(H.attack, '헬리코프리온의 돌진');
        if (!this.active) return; // 주인공이 쓰러져 둥지를 떠났습니다.
      }
    }
    if (charge.remaining <= 0) {
      this.charge = undefined;
      this.heading = clampTilt(this.heading, IDLE_TILT);
      this.applyTransform();
      this.setPhase('recover', H.chargeRecover);
    }
  }

  private explodeBomb(index: number) {
    this.state.bombs[index] = H.bombRespawnSeconds;
    const bomb = this.bombs[index];
    const x = bomb?.x ?? this.x;
    const y = bomb?.y ?? this.y;
    bomb?.setVisible(false);
    this.charge = undefined;
    this.audio.playExplosion();
    this.scene.cameras.main.shake(320, 0.012);
    const blast = this.scene.add.circle(x, y, 20, 0xfb923c, 0.9).setDepth(12);
    const core = this.scene.add.circle(x, y, 12, 0xfef08a, 1).setDepth(13);
    this.scene.tweens.add({ targets: blast, radius: 120, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: () => blast.destroy() });
    this.scene.tweens.add({ targets: core, radius: 70, alpha: 0, duration: 380, ease: 'Cubic.easeOut', onComplete: () => core.destroy() });
    this.bodyImage?.setTint(0xfca5a5);
    this.scene.time.delayedCall(260, () => this.bodyImage?.clearTint());
    this.setPhase('stunned', H.stunSeconds);
    this.damage(H.bombDamage, true);
  }

  private swingJaw() {
    this.clearDanger();
    this.audio.playSaw();
    if (this.jaw) {
      this.scene.tweens.killTweensOf(this.jaw);
      this.scene.tweens.chain({
        targets: this.jaw,
        tweens: [
          { angle: -14, duration: 70 }, { angle: 22, duration: 70 }, { angle: -14, duration: 70 },
          { angle: 22, duration: 70 }, { angle: 0, duration: 110 },
        ],
      });
    }
    const target = this.jawTarget;
    this.jawTarget = undefined;
    if (target) {
      const slash = this.scene.add.circle(target.x, target.y, H.jawRadius, 0xcbd5e1, 0.45).setDepth(8);
      this.scene.tweens.add({ targets: slash, alpha: 0, duration: 320, onComplete: () => slash.destroy() });
      const p = this.host.player();
      if (Math.hypot(p.x - target.x, p.y - target.y) <= H.jawRadius) {
        this.host.damagePlayer(H.attack, '헬리코프리온의 아래턱 휘두르기');
        if (!this.active) return;
      }
    }
    this.setPhase('recover', H.jawRecover);
  }

  private damage(amount: number, fromBomb: boolean) {
    if (!this.fighting) return;
    this.state.hp = Math.max(0, this.state.hp - amount);
    if (!fromBomb) this.audio.playHit();
    if (fromBomb) {
      const text = this.scene.add.text(this.x, this.y - 60, `💥 폭탄 명중! -${amount}`, {
        fontSize: '22px', color: '#fde047', fontStyle: 'bold', stroke: '#7c2d12', strokeThickness: 5,
      }).setOrigin(0.5).setDepth(42);
      this.scene.tweens.add({ targets: text, y: text.y - 50, alpha: 0, duration: 1100, ease: 'Cubic.Out', onComplete: () => text.destroy() });
    }
    if (this.state.hp <= 0) this.defeat();
    this.drawBar();
  }

  private defeat() {
    this.state.respawn = H.respawnSeconds;
    this.charge = this.jawTarget = undefined;
    this.clearDanger();
    this.audio.setBossMusic(null);
    this.audio.playBossVictory();
    const container = this.container;
    if (container) {
      this.scene.tweens.killTweensOf(container);
      this.scene.tweens.add({
        targets: container, alpha: 0, y: container.y + 60, angle: container.angle + 25, duration: 900,
        onComplete: () => { if (this.container === container) this.destroyBossSprite(); },
      });
    }
    this.host.showNotice('🦈 헬리코프리온 토벌 성공! 5분 뒤 둥지에서 다시 부활합니다.');
    this.showRespawnTimer();
  }

  private showRespawnTimer() {
    if (!this.active || this.respawnText) return;
    const { width, height } = this.scene.scale;
    this.respawnText = this.scene.add.text(width * 0.6, height * 0.42, '', {
      fontSize: '20px', color: '#fde68a', fontStyle: 'bold',
      backgroundColor: 'rgba(28, 10, 2, 0.82)', padding: { x: 14, y: 9 }, align: 'center',
    }).setOrigin(0.5).setDepth(8);
    this.update(0);
  }

  private drawChargeDanger() {
    if (!this.charge || !this.danger) return;
    const head = this.headPoint();
    const length = this.charge.remaining + this.displayWidth * 0.5;
    const halfWidth = this.displayWidth * 0.11;
    const { dx, dy } = this.charge;
    const px = -dy * halfWidth;
    const py = dx * halfWidth;
    const ex = head.x + dx * length;
    const ey = head.y + dy * length;
    this.danger.clear().fillStyle(0xef4444, 0.3).lineStyle(4, 0xff1f1f, 0.95);
    const points = [
      new Phaser.Geom.Point(head.x + px, head.y + py), new Phaser.Geom.Point(ex + px, ey + py),
      new Phaser.Geom.Point(ex - px, ey - py), new Phaser.Geom.Point(head.x - px, head.y - py),
    ];
    this.danger.fillPoints(points, true).strokePoints(points, true);
    this.dangerText?.setText('⚠️ 돌진!').setPosition(head.x + dx * Math.min(length, 220), head.y + dy * Math.min(length, 220)).setVisible(true);
  }

  private drawDangerCircle(x: number, y: number, radius: number, label: string) {
    this.danger?.clear().fillStyle(0xef4444, 0.32).lineStyle(4, 0xff1f1f, 0.95).fillCircle(x, y, radius).strokeCircle(x, y, radius);
    this.dangerText?.setText(label).setPosition(x, y).setVisible(true);
  }

  private clearDanger() {
    this.danger?.clear();
    this.dangerText?.setVisible(false);
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
    const ratio = Phaser.Math.Clamp(this.state.hp / H.maxHp, 0, 1);
    this.bar.fillStyle(0x1f2937, 0.95).fillRoundedRect(x, 118, barWidth, 18, 7);
    this.bar.fillStyle(0xea580c, 1).fillRoundedRect(x + 3, 121, (barWidth - 6) * ratio, 12, 5);
    this.barText.setText(`헬리코프리온  ${Math.ceil(this.state.hp)}/${H.maxHp}`);
  }

  private bounds() {
    const { width, height } = this.scene.scale;
    const margin = this.displayWidth * 0.32;
    return { left: margin, right: width - margin, top: 70 + this.displayWidth * 0.1, bottom: height - 30 - this.displayWidth * 0.1 };
  }

  private clampPosition() {
    const b = this.bounds();
    this.x = Phaser.Math.Clamp(this.x, b.left, Math.max(b.left, b.right));
    this.y = Phaser.Math.Clamp(this.y, b.top, Math.max(b.top, b.bottom));
  }

  private applyTransform() {
    if (!this.container) return;
    const scale = this.displayWidth / SOURCE_WIDTH;
    const facingLeft = Math.cos(this.heading) < 0;
    this.container.setPosition(this.x, this.y);
    this.container.setScale(facingLeft ? -scale : scale, scale);
    this.container.setRotation(facingLeft ? this.heading - Math.PI : this.heading);
  }

  private headPoint() {
    return {
      x: this.x + Math.cos(this.heading) * this.displayWidth * HITBOX[0].t,
      y: this.y + Math.sin(this.heading) * this.displayWidth * HITBOX[0].t,
    };
  }

  private hitCircles() {
    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);
    return HITBOX.map(({ t, r }) => ({
      x: this.x + cos * this.displayWidth * t,
      y: this.y + sin * this.displayWidth * t,
      r: this.displayWidth * r,
    }));
  }
}

/** 좌우 방향은 유지하고 위아래 기울기만 제한합니다. */
function clampTilt(angle: number, maxTilt: number) {
  const base = Math.cos(angle) < 0 ? Math.PI : 0;
  const delta = Phaser.Math.Angle.Wrap(angle - base);
  return base + Phaser.Math.Clamp(delta, -maxTilt, maxTilt);
}
