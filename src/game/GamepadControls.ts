// Button and axis indices of the browser's standard gamepad layout.
export const PAD = {
  a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, rt: 7, view: 8, menu: 9,
  up: 12, down: 13, left: 14, right: 15,
} as const;

export class GamepadControls {
  private pad?: Gamepad;
  private buttons = 0;
  private pressed = 0;
  private fireBlocked = false;
  private navX = 0;
  private navY = 0;
  move = { x: 0, y: 0 };
  aim = { x: 0, y: 0 };
  nav = { x: 0, y: 0 };

  /** Returns true when the previously active controller was disconnected or replaced. */
  update(pads: ArrayLike<Gamepad | null>) {
    const previous = this.pad;
    const usable = (pad: Gamepad | null | undefined): pad is Gamepad => !!pad?.connected && pad.mapping === 'standard';
    const same = previous && pads[previous.index];
    this.pad = usable(same) && same.id === previous?.id ? same : Array.from(pads).find(usable);
    const disconnected = !!previous && (this.pad?.id !== previous.id || this.pad.index !== previous.index);
    const previousButtons = disconnected ? 0 : this.buttons;
    this.buttons = this.pad?.buttons.reduce((mask, button, index) =>
      index < 16 && (button.pressed || button.value >= 0.5) ? mask | (1 << index) : mask, 0) ?? 0;
    this.pressed = this.buttons & ~previousButtons;
    if (!this.down(PAD.rt)) this.fireBlocked = false;
    if (disconnected) this.blockFire();

    const stickX = this.pad?.axes[0] ?? 0;
    const stickY = this.pad?.axes[1] ?? 0;
    const dx = Number(this.down(PAD.right)) - Number(this.down(PAD.left));
    const dy = Number(this.down(PAD.down)) - Number(this.down(PAD.up));
    const x = dx || dy ? dx : stickX;
    const y = dx || dy ? dy : stickY;
    const length = Math.hypot(x, y);
    const speed = length > 0.2 ? Math.min(1, (length - 0.2) / 0.8) / length : 0;
    this.move = { x: x * speed, y: y * speed };
    const aimX = this.pad?.axes[2] ?? 0;
    const aimY = this.pad?.axes[3] ?? 0;
    const aimLength = Math.hypot(aimX, aimY);
    this.aim = aimLength > 0.2 ? { x: aimX / aimLength, y: aimY / aimLength } : { x: 0, y: 0 };

    // Menus move one selection per tilt. Release toward center before stepping again.
    const navX = dx || this.menuAxis(x, this.navX);
    const navY = dy || this.menuAxis(y, this.navY);
    this.nav = { x: navX !== this.navX ? navX : 0, y: navY !== this.navY ? navY : 0 };
    this.navX = navX;
    this.navY = navY;
    return disconnected;
  }

  private menuAxis(value: number, previous: number) {
    return Math.abs(value) >= 0.65 ? Math.sign(value) : Math.abs(value) < 0.4 ? 0 : previous;
  }

  down(button: number) { return (this.buttons & (1 << button)) !== 0; }
  justPressed(button: number) { return (this.pressed & (1 << button)) !== 0; }
  get fireDown() { return !this.fireBlocked && this.down(PAD.rt); }
  get firePressed() { return !this.fireBlocked && this.justPressed(PAD.rt); }
  blockFire() { this.fireBlocked = this.down(PAD.rt); }
  consumePresses() {
    this.pressed = 0;
    this.nav = { x: 0, y: 0 };
  }
}

/** DOM dialogs remain controllable while the Phaser scene is paused. */
export function controlGamepadDialog(pad: GamepadControls, dialog: HTMLElement, close: () => void) {
  if (pad.justPressed(PAD.b) || pad.justPressed(PAD.menu)) { close(); return; }
  const step = pad.nav.y || pad.nav.x;
  if (!step && !pad.justPressed(PAD.a)) return;
  const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (step && buttons.length) {
    buttons[current < 0 ? 0 : (current + step + buttons.length) % buttons.length].focus();
  }
  if (pad.justPressed(PAD.a) && buttons.includes(document.activeElement as HTMLButtonElement)) {
    (document.activeElement as HTMLButtonElement).click();
  }
}
