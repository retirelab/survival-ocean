import type Phaser from 'phaser';
import type { GameAudio } from '../audio/GameAudio';
import { advanceMX3Dialogue, damageMX3, MX3, MX3_CHOICES, MX3_INTRO, MX3_OUTRO, MX3_REWARDS,
  mx3MissileSpeed, newMX3, type MX3Save } from '../game/MX3';
import { BOSS_TRACKS } from '../game/ZoneMusic';
import { distanceToSegment } from '../game/SubmarineCombat';

type Point = { x: number; y: number };
interface Projectile extends Point { vx: number; vy: number; remaining: number }
interface Missile extends Projectile { angle: number }
interface Bomb extends Projectile { thrown: boolean }
type Attack = 'spray' | 'missiles' | 'bomb';
const PATTERN: readonly Attack[] = ['spray', 'missiles', 'bomb'];
// Draw the seven emitters and spawn every shot from the same positions.
const PORTS = [[0, -1.05], [-0.48, -0.87], [0.48, -0.87], [-0.96, -0.36], [0.96, -0.36], [-0.19, -0.29], [0.21, -0.28]] as const;

interface Host {
  player(): Point;
  aim(): Point;
  bombKnockback(origin: Point): void;
  damage(amount: number, label: string): void;
  stopInput(): void;
  notify(message: string): void;
  reward(items: readonly string[]): void;
}

export class MX3Boss {
  private state = newMX3();
  private active = false;
  private art?: Phaser.GameObjects.Graphics;
  private effects?: Phaser.GameObjects.Graphics;
  private panel?: Phaser.GameObjects.Graphics;
  private prompt?: Phaser.GameObjects.Text;
  private subtitle?: Phaser.GameObjects.Text;
  private options: Phaser.GameObjects.Text[] = [];
  private beams: Projectile[] = [];
  private missiles: Missile[] = [];
  private bombs: Bomb[] = [];
  private blasts: Array<Point & { radius: number; remaining: number }> = [];
  private carrying = false;
  private nextAttack = 0;
  private cooldown = 1.6;
  private sprayTime = 0;
  private nextVolley = 0;

  constructor(private scene: Phaser.Scene, private audio: GameAudio, private host: Host) {}

  get talking() { return this.active && (this.state.phase === 'intro' || this.state.phase === 'outro'); }
  get choosing() { return this.talking && this.state.phase === 'outro' && this.state.line === 2 && this.state.choice === undefined; }

  snapshot(): MX3Save { return { ...this.state }; }
  load(save?: MX3Save) { this.state = save ? { ...save } : newMX3(); }

  enter() {
    this.active = true;
    this.nextAttack = 0;
    this.cooldown = 1.6;
    this.art = this.scene.add.graphics().setDepth(4);
    this.effects = this.scene.add.graphics().setDepth(12);
    this.panel = this.scene.add.graphics().setDepth(71);
    const style = { fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#f1f5f9' };
    this.prompt = this.scene.add.text(0, 0, '', { ...style, align: 'center', backgroundColor: '#15132b', padding: { x: 8, y: 5 } }).setOrigin(0.5).setDepth(29);
    this.subtitle = this.scene.add.text(0, 0, '', style).setDepth(72);
    this.options = [0, 1].map(() => this.scene.add.text(0, 0, '', { ...style, color: '#fef08a' }).setDepth(72));
    this.layout();
    if (this.state.phase === 'fight') this.audio.setBossMusic(BOSS_TRACKS.mx3);
  }

  leave() {
    if (!this.active) return;
    this.active = false;
    if (this.state.phase === 'fight') this.audio.setBossMusic(null);
    this.clearAttacks();
    for (const object of [this.art, this.effects, this.panel, this.prompt, this.subtitle, ...this.options]) object?.destroy();
    this.art = this.effects = this.panel = undefined;
    this.prompt = this.subtitle = undefined;
    this.options = [];
  }

  layout() {
    if (!this.active) return;
    this.drawHull();
    this.drawDialogue();
    this.drawStatus();
  }

  private hull() {
    const { width, height } = this.scene.scale;
    return { x: width / 2, y: height * 0.96, rx: Math.min(width * 0.39, 470), ry: Math.min(height * 0.33, 260) };
  }

  private port(index: number): Point {
    const { x, y, rx, ry } = this.hull();
    const [px, py] = PORTS[index];
    return { x: x + px * rx, y: y + py * ry };
  }

  private drawHull() {
    const g = this.art;
    if (!g) return;
    g.clear();
    if (this.state.phase === 'cleared') return;
    const { x, y, rx, ry } = this.hull();
    const retreating = this.state.phase === 'outro';
    g.fillStyle(0x13172f).fillEllipse(x, y + ry * 0.14, rx * 2.08, ry * 2.16);
    g.fillStyle(retreating ? 0x6b7280 : 0xb7c8d5).fillEllipse(x, y + ry * 0.15, rx * 2, ry * 2.10);
    g.lineStyle(4, 0x26314a).strokeEllipse(x, y + ry * 0.15, rx * 2, ry * 2.10);
    g.fillStyle(0x303d59).fillEllipse(x, y + ry * 0.25, rx * 0.92, ry * 1.15);
    g.lineStyle(3, 0x46c4a6, 0.9);
    for (const side of [-1, 1]) {
      g.lineBetween(x + side * rx * 0.17, y - ry * 0.40, x + side * rx * 0.29, y - ry * 0.82);
      g.lineBetween(x + side * rx * 0.35, y - ry * 0.12, x + side * rx * 0.80, y - ry * 0.47);
      g.fillStyle(0x6829a8).fillRoundedRect(x + side * rx * 0.60 - rx * 0.13, y - ry * .40, rx * .26, ry * .20, 5);
      g.fillStyle(0xb85df5).fillRoundedRect(x + side * rx * 0.60 - rx * 0.11, y - ry * .37, rx * .22, ry * .11, 3);
      g.fillStyle(0x279dff).fillRoundedRect(x + side * rx * .20 - rx * .065, y - ry * .15, rx * .13, ry * .3, 6);
    }
    g.fillStyle(0x8b38cc).fillRoundedRect(x - rx * .16, y - ry * .69, rx * .32, ry * .22, 6);
    PORTS.forEach((_, index) => {
      const muzzle = this.port(index);
      const w = rx * (index === 0 ? .14 : .09);
      const h = ry * (index === 0 ? .23 : .16);
      g.fillStyle(0x333247).fillRoundedRect(muzzle.x - w, muzzle.y + h * .72, w * 2, h * 1.02, 5);
      g.fillStyle(retreating ? 0x947946 : 0xfde047).fillTriangle(muzzle.x, muzzle.y, muzzle.x - w, muzzle.y + h, muzzle.x + w, muzzle.y + h);
      g.lineStyle(2, 0xfff1a6, .85).lineBetween(muzzle.x - w, muzzle.y + h, muzzle.x, muzzle.y);
    });
  }

  private nearSubmarine() {
    const { x, y, rx, ry } = this.hull();
    const p = this.host.player();
    return Math.hypot((p.x - x) / (rx + 38), (p.y - y) / (ry + 82)) < 1;
  }

  private drawStatus() {
    if (!this.prompt) return;
    const { width, height } = this.scene.scale;
    if (this.state.phase === 'fight') {
      this.prompt.setVisible(true).setText(`M-X 3  ·  ${Math.ceil(this.state.hp)} / ${MX3.hp}`).setPosition(width / 2, Math.min(145, height * .24));
    } else if (this.state.phase === 'idle' && this.nearSubmarine()) {
      const { y, ry } = this.hull();
      this.prompt.setVisible(true).setText('F / 수집 / Xbox A · 엿듣기').setPosition(width / 2, y - ry - 35);
    } else {
      this.prompt.setVisible(false);
    }
  }

  private drawDialogue() {
    if (!this.panel || !this.subtitle) return;
    this.panel.clear();
    this.subtitle.setVisible(this.talking);
    for (const option of this.options) option.setVisible(this.choosing);
    if (!this.talking) return;
    const { width, height } = this.scene.scale;
    const w = Math.min(720, width - 24);
    const x = (width - w) / 2;
    const intro = this.state.phase === 'intro';
    const chosen = !intro && this.state.line === 2 ? this.state.choice : undefined;
    const speaker = (intro && this.state.line === MX3_INTRO.length - 1) || chosen !== undefined ? '주인공' : '???';
    const line = chosen !== undefined ? `${MX3_CHOICES[chosen]}${chosen === 1 ? ' (놀리듯)' : ''}`
      : intro ? MX3_INTRO[this.state.line] : MX3_OUTRO[this.state.line];
    this.subtitle.setWordWrapWidth(w - 32).setText(this.choosing ? '주인공 · 대사 선택 (1·2 / 터치 / Xbox A·B)' : `${speaker}  ${line}\n\nF / 자막 터치 / Xbox A · 다음`);
    let panelHeight = this.subtitle.height + 30;
    if (this.choosing) {
      this.options.forEach((option, i) => {
        const tone = i === 1 ? ' (놀리듯)' : '';
        option.setWordWrapWidth(w - 32).setText(`${i + 1}. ${MX3_CHOICES[i]}${tone}`);
        panelHeight += option.height + 14;
      });
    }
    const y = height - panelHeight - 14;
    this.panel.fillStyle(0x0f1329, .97).fillRoundedRect(x, y, w, panelHeight, 14);
    this.panel.lineStyle(2, 0xb4a1f4, .9).strokeRoundedRect(x, y, w, panelHeight, 14);
    this.subtitle.setPosition(x + 16, y + 14);
    let optionY = y + this.subtitle.height + 28;
    for (const option of this.options) {
      option.setPosition(x + 16, optionY);
      optionY += option.height + 14;
    }
  }

  handlePointer(x: number, y: number, onCollectButton: boolean) {
    if (!this.talking) return false;
    if (this.choosing) {
      const index = this.options.findIndex(option => {
        const bounds = option.getBounds();
        return x >= bounds.x - 10 && x <= this.scene.scale.width - bounds.x + 10 &&
          y >= bounds.y - 5 && y <= bounds.bottom + 5;
      });
      if (index === 0 || index === 1) this.advance(index);
    } else if (onCollectButton || y >= (this.subtitle?.y ?? Infinity) - 14) {
      this.advance();
    }
    return true;
  }

  advance(choice?: 0 | 1) {
    const next = advanceMX3Dialogue(this.state, choice);
    if (this.state === next) return;
    this.state = next;
    if (next.phase === 'fight') {
      this.cooldown = 1.4;
      this.audio.setBossMusic(BOSS_TRACKS.mx3);
      this.host.notify('M-X 3 전투 시작!');
    }
    this.layout();
    if (next.phase === 'cleared') this.host.reward(MX3_REWARDS);
  }

  collect() {
    if (this.state.phase === 'idle') {
      if (this.nearSubmarine()) {
        this.host.stopInput();
        this.advance();
      } else this.host.notify('큰 잠수함 가까이에서 엿들을 수 있어요.');
      return;
    }
    if (this.talking) { this.advance(); return; }
    if (this.state.phase !== 'fight') return;
    const p = this.host.player();
    if (this.carrying) {
      const aim = this.host.aim();
      this.carrying = false;
      this.bombs.push({ ...p, vx: aim.x * 545, vy: aim.y * 545, remaining: 1.7, thrown: true });
      this.audio.playShoot();
      return;
    }
    const index = this.bombs.findIndex(b => !b.thrown && Math.hypot(b.x - p.x, b.y - p.y) <= MX3.bombPickupRadius);
    if (index < 0) { this.host.notify('폭탄 가까이에서 수집을 누르세요.'); return; }
    this.bombs.splice(index, 1);
    this.carrying = true;
    this.audio.playCollect();
    this.host.notify('폭탄을 들었어요! M-X 3 방향을 보고 수집을 다시 누르면 던집니다.');
  }

  hitSegment(ax: number, ay: number, bx: number, by: number, radius: number, amount: number) {
    if (this.state.phase !== 'fight') return false;
    const { x, y, rx, ry } = this.hull();
    if (distanceToSegment(0, 0, (ax - x) / (rx + radius), (ay - y) / (ry + radius),
      (bx - x) / (rx + radius), (by - y) / (ry + radius)) > 1) return false;
    this.state = damageMX3(this.state, amount);
    this.audio.playHit();
    if (this.state.phase === 'outro') {
      this.audio.setBossMusic(null);
      this.clearAttacks();
      this.effects?.clear();
      this.host.stopInput();
      this.layout();
    }
    return true;
  }

  private clearAttacks() {
    this.beams = [];
    this.missiles = [];
    this.bombs = [];
    this.blasts = [];
    this.carrying = false;
    this.sprayTime = 0;
    this.nextVolley = 0;
  }

  private launch(attack: Attack) {
    const p = this.host.player();
    if (attack === 'spray') {
      this.sprayTime = 1.9;
      this.nextVolley = 0;
      this.cooldown = 3.25;
      this.host.notify('M-X 3 · 마구쏘기!');
    } else if (attack === 'missiles') {
      for (const [index, angle] of [[3, -2.2], [4, -0.95]]) {
        this.missiles.push({ ...this.port(index), vx: 0, vy: 0, angle, remaining: MX3.missileLifetime });
      }
      this.cooldown = 5.1;
      this.host.notify('M-X 3 · 추적 미사일 2발!');
      this.audio.playCharge();
    } else {
      const port = this.port(0);
      const angle = Math.atan2(p.y - port.y, p.x - port.x);
      this.bombs.push({ ...port, vx: Math.cos(angle) * 275, vy: Math.sin(angle) * 275, remaining: MX3.bombFuse, thrown: false });
      this.cooldown = 4.5;
      this.host.notify('M-X 3 · 폭탄! 터지기 전에 수집할 수 있어요.');
      this.audio.playShoot();
    }
  }

  update(dt: number) {
    if (!this.active) return;
    this.drawStatus();
    if (this.state.phase !== 'fight') return;
    dt = Math.min(dt, .075);
    this.cooldown -= dt;
    if (this.cooldown <= 0) {
      this.launch(PATTERN[this.nextAttack]);
      this.nextAttack = (this.nextAttack + 1) % PATTERN.length;
    }
    if (this.sprayTime > 0) {
      this.sprayTime -= dt;
      this.nextVolley -= dt;
      if (this.nextVolley <= 0) {
        this.nextVolley += .12;
        PORTS.forEach((_, i) => {
          const angle = -Math.PI * Math.random();
          const speed = 430 + Math.random() * 190;
          this.beams.push({ ...this.port(i), vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, remaining: 1.9 });
        });
      }
    }
    const p = this.host.player();
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const beam = this.beams[i];
      const hit = this.advanceProjectile(beam, dt, p, 20);
      if (hit || beam.remaining <= 0 || this.offscreen(beam)) this.beams.splice(i, 1);
      if (hit) this.host.damage(MX3.attack, 'M-X 3의 빔');
      if (!this.active) return;
    }
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const missile = this.missiles[i];
      const desired = Math.atan2(p.y - missile.y, p.x - missile.x);
      const turn = Math.atan2(Math.sin(desired - missile.angle), Math.cos(desired - missile.angle));
      missile.angle += Math.max(-4.2 * dt, Math.min(4.2 * dt, turn));
      const targetDistance = Math.hypot(p.x - missile.x, p.y - missile.y);
      const speed = mx3MissileSpeed(missile.remaining - dt);
      if (missile.remaining <= MX3.missileWarning && targetDistance < 28) {
        missile.remaining = Math.min(missile.remaining, .22);
      }
      missile.vx = Math.cos(missile.angle) * speed;
      missile.vy = Math.sin(missile.angle) * speed;
      this.advanceProjectile(missile, dt, p, 0);
      if (missile.remaining > 0) continue;
      this.missiles.splice(i, 1);
      this.explode(missile, 54);
      if (Math.hypot(missile.x - p.x, missile.y - p.y) <= 54) this.host.damage(MX3.attack, 'M-X 3의 추적 미사일');
      if (!this.active) return;
    }
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      const { x, y } = bomb;
      this.advanceProjectile(bomb, dt, p, 0);
      if (bomb.thrown && this.hitSegment(x, y, bomb.x, bomb.y, 14, MX3.reflectedBombDamage)) {
        if (this.state.phase !== 'fight') return;
        this.bombs.splice(i, 1);
        this.explode(bomb, 64);
        this.host.notify('폭탄 명중! M-X 3에 500 피해');
        continue;
      }
      if (!bomb.thrown) {
        const { width, height } = this.scene.scale;
        bomb.vx *= Math.exp(-2.2 * dt);
        bomb.vy *= Math.exp(-2.2 * dt);
        bomb.x = Math.min(width - 24, Math.max(24, bomb.x));
        bomb.y = Math.min(height - 24, Math.max(24, bomb.y));
      }
      if (bomb.remaining > 0 && !this.offscreen(bomb)) continue;
      this.bombs.splice(i, 1);
      this.explode(bomb, MX3.bombBlastRadius);
      if (!bomb.thrown && Math.hypot(bomb.x - p.x, bomb.y - p.y) <= MX3.bombBlastRadius) this.host.bombKnockback(bomb);
      if (!this.active) return;
    }
    this.drawEffects(dt);
  }

  private advanceProjectile(projectile: Projectile, dt: number, player: Point, hitRadius: number) {
    const { x, y } = projectile;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.remaining -= dt;
    return hitRadius > 0 && distanceToSegment(player.x, player.y, x, y, projectile.x, projectile.y) <= hitRadius;
  }

  private offscreen(p: Point) {
    const { width, height } = this.scene.scale;
    return p.x < -40 || p.x > width + 40 || p.y < -40 || p.y > height + 40;
  }

  private explode(p: Point, radius: number) {
    this.blasts.push({ x: p.x, y: p.y, radius, remaining: .32 });
    this.audio.playExplosion();
  }

  private drawEffects(dt: number) {
    const g = this.effects;
    if (!g) return;
    g.clear();
    for (const beam of this.beams) {
      g.lineStyle(4, 0xfef08a, .95).lineBetween(beam.x - beam.vx * .045, beam.y - beam.vy * .045, beam.x, beam.y);
    }
    for (const missile of this.missiles) {
      const warning = missile.remaining <= MX3.missileWarning;
      g.lineStyle(9, warning ? 0xf87171 : 0xe2e8f0, .95).lineBetween(
        missile.x - Math.cos(missile.angle) * 19, missile.y - Math.sin(missile.angle) * 19, missile.x, missile.y);
      g.fillStyle(0xfb923c).fillCircle(missile.x - Math.cos(missile.angle) * 22, missile.y - Math.sin(missile.angle) * 22, 4);
      if (warning) g.lineStyle(2, 0xfb7185, .8).strokeCircle(missile.x, missile.y, 54);
    }
    for (const bomb of this.bombs) {
      g.fillStyle(bomb.thrown ? 0x34d399 : 0x27243a).fillCircle(bomb.x, bomb.y, 14);
      g.lineStyle(3, bomb.remaining < .9 ? 0xfb7185 : 0xfbbf24).strokeCircle(bomb.x, bomb.y, 14);
      if (!bomb.thrown && bomb.remaining < .9) g.lineStyle(2, 0xfb7185, .6).strokeCircle(bomb.x, bomb.y, MX3.bombBlastRadius);
    }
    if (this.carrying) {
      const p = this.host.player();
      g.fillStyle(0x34d399).fillCircle(p.x, p.y - 26, 10);
      g.lineStyle(2, 0xd1fae5).strokeCircle(p.x, p.y - 26, 10);
    }
    this.blasts = this.blasts.filter(blast => {
      blast.remaining -= dt;
      if (blast.remaining <= 0) return false;
      g.fillStyle(0xfb923c, blast.remaining * 1.8).fillCircle(blast.x, blast.y, blast.radius * (1 - blast.remaining));
      return true;
    });
    const { width, height } = this.scene.scale;
    const barWidth = Math.min(width * .68, 620);
    const x = (width - barWidth) / 2;
    const y = Math.min(162, height * .29);
    g.fillStyle(0x2b2034, .95).fillRoundedRect(x, y, barWidth, 10, 5);
    g.fillStyle(0xf87171).fillRoundedRect(x, y, barWidth * this.state.hp / MX3.hp, 10, 5);
  }
}
