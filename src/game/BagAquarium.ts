import { controlGamepadDialog, PAD, type GamepadControls } from './GamepadControls.js';
import type { StorageView } from './ItemStorage.js';
import { RECIPES, type Recipe } from './Cooking.js';
import { CookingPanel, type KitchenHandlers } from './CookingPanel.js';

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
  private title = document.createElement('h2');
  private fishPane = document.createElement('section');
  private storagePane = document.createElement('section');
  private fishTab = document.createElement('button');
  private storageTab = document.createElement('button');
  private cookingTab = document.createElement('button');
  private kitchen: CookingPanel;
  private foodStatus = document.createElement('p');
  private view: 'fish' | 'storage' | 'cooking' = 'fish';

  constructor(private handlers: {
    open: () => boolean;
    close: () => void;
    empty: () => void;
    bag: () => readonly string[];
    capacity: number;
    art: (name: string) => FishArt | undefined;
    storage: () => StorageView[];
    kitchen: KitchenHandlers;
  }) {
    this.kitchen = new CookingPanel(handlers.kitchen);
    this.dialog.className = 'bag-aquarium';
    this.dialog.setAttribute('aria-label', '가방 속 물고기');
    this.count.setAttribute('aria-live', 'polite');
    const head = document.createElement('header');
    head.append(this.title, this.count);
    const tabs = document.createElement('nav');
    tabs.className = 'bag-aquarium-tabs';
    for (const [tab, label, view] of [[this.fishTab, '🐟 물고기 · ←', 'fish'],
      [this.cookingTab, '🍳 요리 · → / LB', 'cooking'],
      [this.storageTab, '📦 보관소 · RB', 'storage']] as const) {
      tab.type = 'button';
      tab.textContent = label;
      tab.onclick = () => this.setView(view);
      tabs.append(tab);
    }
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
    this.dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' && this.view !== 'storage') this.setView(this.view === 'fish' ? 'cooking' : 'storage');
      else if (event.key === 'ArrowLeft') this.setView('fish');
      else if (this.view === 'cooking' && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        this.kitchen.moveSelection(event.key === 'ArrowDown' ? 1 : -1);
      } else if (this.view === 'cooking' && event.code === 'KeyQ') {
        if (!event.repeat) this.kitchen.start();
      }
      else return;
      event.preventDefault();
    });
    this.dialog.addEventListener('cancel', event => {
      event.preventDefault();
      this.close();
    });
    this.fishPane.append(this.tank, this.legend);
    this.storagePane.className = 'bag-storage';
    this.foodStatus.setAttribute('role', 'status');
    this.dialog.append(head, tabs, this.fishPane, this.kitchen.element, this.storagePane, actions);
    document.body.append(this.dialog);
  }

  show() {
    if (this.dialog.open || !this.handlers.open()) return false;
    this.view = 'fish';
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
    if (pad.justPressed(PAD.lt) || pad.justPressed(PAD.b)) this.close();
    else if (pad.justPressed(PAD.lb)) this.setView(this.view === 'cooking' ? 'fish' : 'cooking');
    else if (pad.justPressed(PAD.rb)) this.setView(this.view === 'storage' ? 'fish' : 'storage');
    else if (this.view === 'cooking' && pad.justPressed(PAD.y)) this.kitchen.start();
    else if (this.view === 'cooking' && pad.nav.y && this.kitchen.element.contains(document.activeElement)) this.kitchen.moveSelection(pad.nav.y);
    else if (this.view !== 'cooking' && pad.menuLongPressed) this.empty();
    else controlGamepadDialog(pad, this.dialog, () => this.close());
    return true;
  }

  setView(view: typeof this.view) {
    if (!this.dialog.open) return;
    this.view = view;
    this.render();
    if (view === 'cooking') this.kitchen.focusSelection();
    else this.closeButton.focus();
  }

  updateCooking(now: number, finished?: Recipe) {
    if (finished) {
      this.kitchen.finished(finished);
      if (this.dialog.open && this.view === 'storage') this.renderStorage();
    } else if (this.dialog.open && this.view === 'cooking') {
      this.kitchen.updateProgress(now);
    }
  }

  private render() {
    const storage = this.view === 'storage';
    const cooking = this.view === 'cooking';
    this.dialog.classList.toggle('showing-storage', storage || cooking);
    this.title.textContent = cooking ? '요리' : storage ? '아이템 보관소' : '가방 속 물고기';
    this.fishPane.hidden = this.view !== 'fish';
    this.storagePane.hidden = !storage;
    this.kitchen.element.hidden = !cooking;
    this.emptyButton.hidden = this.view !== 'fish';
    this.fishTab.setAttribute('aria-pressed', String(this.view === 'fish'));
    this.storageTab.setAttribute('aria-pressed', String(storage));
    this.cookingTab.setAttribute('aria-pressed', String(cooking));
    if (cooking) {
      this.count.textContent = `${RECIPES.length}가지 음식`;
      this.kitchen.render();
    } else if (storage) this.renderStorage();
    else this.renderFish();
  }

  private renderStorage() {
    const focusedMeal = this.storagePane.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).dataset.recipe : undefined;
    const scrollTop = this.storagePane.scrollTop;
    const sections = this.handlers.storage();
    const total = sections.reduce((sum, section) => sum + section.groups.reduce((a, group) =>
      a + group.items.reduce((b, item) => b + item.count, 0), 0), 0);
    const meals = this.handlers.kitchen.state().meals;
    const { hp, maxHp } = this.handlers.kitchen.health();
    this.count.textContent = `아이템 ${total + Object.values(meals).reduce((sum, count) => sum + count, 0)}개`;
    const food = document.createElement('section');
    food.className = 'bag-food';
    const heading = document.createElement('h3');
    heading.textContent = `완성된 음식 · 체력 ${Math.ceil(hp)}/${maxHp}`;
    const options = document.createElement('div');
    for (const dish of RECIPES) {
      const count = meals[dish.id];
      if (!count) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.recipe = dish.id;
      button.textContent = `${dish.icon} ${dish.name} ×${count} · +${dish.heal} HP`;
      button.onclick = () => {
        const recovered = this.handlers.kitchen.eat(dish.id);
        this.foodStatus.textContent = recovered
          ? `${dish.name} 먹기 · 체력 +${recovered}` : '체력이 가득 차 있어요.';
        if (recovered) this.renderStorage();
      };
      options.append(button);
    }
    if (!options.childElementCount) options.textContent = '완성된 음식이 없어요.';
    food.append(heading, options, this.foodStatus);
    this.storagePane.replaceChildren(food, ...sections.map(section => {
      const row = document.createElement('div');
      row.className = `bag-storage-row ${section.id}`;
      const label = document.createElement('span');
      label.className = 'bag-storage-label';
      label.textContent = section.title;
      const groups = document.createElement('div');
      groups.className = 'bag-storage-groups';
      for (const group of section.groups) {
        const box = document.createElement('div');
        box.className = 'bag-storage-group';
        if (section.groups.length > 1) {
          const heading = document.createElement('h3');
          heading.textContent = group.title;
          box.append(heading);
        }
        const slots = document.createElement('ul');
        for (const item of group.items) {
          const slot = document.createElement('li');
          slot.className = item.count > 0 ? 'has-item' : 'no-item';
          slot.title = `${item.name} ${item.count}개`;
          const art = document.createElement('span');
          art.className = 'bag-storage-art';
          if (item.image) {
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = '';
            art.append(image);
          } else {
            art.textContent = item.emoji ?? '🎁';
          }
          const name = document.createElement('span');
          name.className = 'bag-storage-name';
          name.textContent = item.label ?? item.name;
          const count = document.createElement('small');
          count.textContent = `${item.count}개`;
          slot.append(art, name, count);
          slots.append(slot);
        }
        box.append(slots);
        groups.append(box);
      }
      row.append(label, groups);
      return row;
    }));
    this.storagePane.scrollTop = scrollTop;
    if (focusedMeal) {
      const buttons = Array.from(options.querySelectorAll('button'));
      (buttons.find(button => button.dataset.recipe === focusedMeal) ?? buttons[0] ?? this.closeButton).focus({ preventScroll: true });
    }
  }

  private renderFish() {
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
