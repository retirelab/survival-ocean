import { controlGamepadDialog, PAD, type GamepadControls } from './GamepadControls.js';

interface FishArt {
  src: string;
  facesLeft: boolean;
}

export class BagAquarium {
  private dialog = document.createElement('dialog');
  private count = document.createElement('p');
  private tank = document.createElement('div');
  private legend = document.createElement('ul');
  private emptyButton = document.createElement('button');
  private closeButton = document.createElement('button');

  constructor(private handlers: {
    open: () => boolean;
    close: () => void;
    empty: () => void;
    bag: () => readonly string[];
    capacity: number;
    art: (name: string) => FishArt | undefined;
  }) {
    this.dialog.className = 'bag-aquarium';
    this.dialog.setAttribute('aria-label', '가방 속 물고기');
    this.count.setAttribute('aria-live', 'polite');
    const title = document.createElement('h2');
    title.textContent = '가방 속 물고기';
    const head = document.createElement('header');
    head.append(title, this.count);
    this.tank.className = 'bag-aquarium-water';
    this.tank.setAttribute('aria-hidden', 'true');
    this.legend.className = 'bag-aquarium-species';

    const actions = document.createElement('footer');
    this.closeButton.type = this.emptyButton.type = 'button';
    this.closeButton.textContent = '닫기 · B';
    this.closeButton.onclick = () => this.close();
    this.emptyButton.textContent = '수조에 비우기';
    this.emptyButton.onclick = () => this.empty();
    actions.append(this.emptyButton, this.closeButton);
    this.dialog.addEventListener('cancel', event => {
      event.preventDefault();
      this.close();
    });
    this.dialog.append(head, this.tank, this.legend, actions);
    document.body.append(this.dialog);
  }

  show() {
    if (this.dialog.open || !this.handlers.open()) return false;
    this.render();
    this.dialog.showModal();
    this.closeButton.focus();
    return true;
  }

  private close() {
    this.dialog.close();
    this.handlers.close();
  }

  private empty() {
    if (!this.handlers.bag().length) return;
    this.handlers.empty();
    this.render();
    this.closeButton.focus();
  }

  handleGamepad(pad: GamepadControls) {
    if (!this.dialog.open) return false;
    if (pad.justPressed(PAD.lt)) this.close();
    else if (pad.menuLongPressed) this.empty();
    else controlGamepadDialog(pad, this.dialog, () => this.close());
    return true;
  }

  private render() {
    const fish = this.handlers.bag();
    const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(fish.length))));
    this.tank.style.setProperty('--tank-columns', String(columns));
    this.tank.style.setProperty('--tank-rows', String(Math.max(1, Math.ceil(fish.length / columns))));
    this.count.textContent = `${fish.length} / ${this.handlers.capacity}마리`;
    this.emptyButton.disabled = fish.length === 0;
    this.tank.replaceChildren();
    this.legend.replaceChildren();
    if (fish.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'bag-aquarium-empty';
      empty.textContent = '가방이 비어 있어요';
      this.tank.append(empty);
      return;
    }

    const counts = new Map<string, number>();
    fish.forEach((name, index) => {
      counts.set(name, (counts.get(name) ?? 0) + 1);
      const lane = document.createElement('span');
      lane.className = 'bag-aquarium-fish';
      lane.style.setProperty('--swim-time', `${4 + index % 5 * 0.65}s`);
      lane.style.setProperty('--swim-delay', `-${index * 0.9}s`);
      const art = this.handlers.art(name);
      if (art) {
        const image = document.createElement('img');
        image.src = art.src;
        image.alt = '';
        if (art.facesLeft) image.className = 'faces-left';
        lane.append(image);
      } else {
        lane.textContent = '🐟';
      }
      this.tank.append(lane);
    });
    for (const [name, quantity] of counts) {
      const item = document.createElement('li');
      item.textContent = `${name} ×${quantity}`;
      this.legend.append(item);
    }
  }

  destroy() { this.dialog.remove(); }
}
