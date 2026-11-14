import Phaser from 'phaser';

export class OceanScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private bubbles: Phaser.GameObjects.Arc[] = [];
  private speed = 240;

  constructor() {
    super('OceanScene');
  }

  preload() {
    // 나중에 public/assets/ 이미지를 여기서 불러옵니다.
  }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0b4f7c, 0x0b4f7c, 0x041526, 0x041526, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 20; i++) {
      const bubble = this.add.circle(
        Phaser.Math.Between(20, width - 20),
        Phaser.Math.Between(20, height - 20),
        Phaser.Math.Between(2, 6),
        0x7dd3fc,
        0.35
      );
      this.bubbles.push(bubble);
    }

    this.player = this.add.container(width / 2, height / 2);
    const body = this.add.circle(0, 0, 20, 0xfacc15);
    const visor = this.add.rectangle(10, -3, 14, 10, 0x38bdf8);
    this.player.add([body, visor]);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    this.add.text(20, 20, '서바이벌오션 (Survival Ocean)', {
      fontSize: '24px',
      color: '#e0f2fe',
      fontStyle: 'bold',
    });
    this.add.text(20, 54, 'PC: 방향키/WASD 이동 | 모바일: 화면 터치/드래그로 이동', {
      fontSize: '14px',
      color: '#7dd3fc',
    });
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    const { width, height } = this.scale;

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
    if (pointer.isDown) {
      const dx = pointer.worldX - this.player.x;
      const dy = pointer.worldY - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        vx = dx / dist;
        vy = dy / dist;
      }
    } else if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx /= len;
      vy /= len;
    }

    this.player.x = Phaser.Math.Clamp(this.player.x + vx * this.speed * dt, 24, width - 24);
    this.player.y = Phaser.Math.Clamp(this.player.y + vy * this.speed * dt, 24, height - 24);

    if (vx < -0.1) this.player.scaleX = -1;
    else if (vx > 0.1) this.player.scaleX = 1;
  }
}
