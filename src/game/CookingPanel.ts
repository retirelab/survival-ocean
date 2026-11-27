import { COOK_TIME_MS, RECIPES, recipeById, type CookingSave, type Recipe } from './Cooking.js';

export interface KitchenHandlers {
  ingredients: (recipe: Recipe) => { name: string; available: number; source: string }[];
  state: () => CookingSave;
  start: (recipe: Recipe) => boolean;
  eat: (id: string) => number;
  health: () => { hp: number; maxHp: number };
}

export class CookingPanel {
  readonly element = document.createElement('section');
  private recipe = RECIPES[0];
  private details = document.createElement('div');
  private list = document.createElement('div');
  private action = document.createElement('button');
  private progress = document.createElement('progress');
  private timerText = document.createElement('span');
  private message = document.createElement('p');
  private buttons = new Map<Recipe, HTMLButtonElement>();

  constructor(private handlers: KitchenHandlers) {
    this.element.className = 'bag-kitchen';
    this.details.className = 'kitchen-recipe';
    this.list.className = 'kitchen-list';
    this.list.setAttribute('aria-label', '요리 50가지');
    for (const recipe of RECIPES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${recipe.icon} ${recipe.name}`;
      button.onclick = () => this.select(recipe);
      button.onfocus = () => { if (recipe !== this.recipe) this.select(recipe); };
      this.list.append(button);
      this.buttons.set(recipe, button);
    }

    const station = document.createElement('div');
    station.className = 'kitchen-station';
    const counter = document.createElement('div');
    counter.className = 'kitchen-counter';
    counter.setAttribute('aria-hidden', 'true');
    const utensils = document.createElement('div');
    utensils.className = 'kitchen-utensils';
    utensils.textContent = '🔪';
    const pan = document.createElement('div');
    pan.className = 'kitchen-pan';
    counter.append(utensils, pan);
    this.action.type = 'button';
    this.action.textContent = '요리 시작 · Q / Y';
    this.action.onclick = () => this.start();
    this.progress.max = COOK_TIME_MS;
    this.progress.setAttribute('aria-label', '조리 진행률');
    this.message.setAttribute('role', 'status');
    this.message.className = 'kitchen-message';
    station.append(counter, this.action, this.progress, this.timerText, this.message);
    this.element.append(this.details, station, this.list);
  }

  private select(recipe: Recipe) {
    this.recipe = recipe;
    this.render();
  }

  moveSelection(step: number) {
    this.select(RECIPES[(RECIPES.indexOf(this.recipe) + step + RECIPES.length) % RECIPES.length]);
    this.focusSelection();
  }

  focusSelection() { this.buttons.get(this.recipe)?.focus(); }

  start() {
    if (this.handlers.state().job) return;
    if (this.handlers.start(this.recipe)) {
      this.message.textContent = `${this.recipe.name} 조리 중`;
      this.render();
    } else {
      this.message.textContent = '가방과 아이템 보관소에 필요한 재료를 준비하세요.';
    }
  }

  finished(recipe: Recipe) {
    this.message.textContent = `${recipe.name} 완성! 아이템 보관소에 넣었어요.`;
    this.render();
  }

  updateProgress(now: number) {
    const job = this.handlers.state().job;
    if (!job || this.element.hidden) return;
    const remaining = Math.max(0, job.readyAt - now);
    this.progress.value = COOK_TIME_MS - remaining;
    this.timerText.textContent = `${recipeById(job.recipeId)?.name ?? ''} · ${(remaining / 1000).toFixed(1)}초`;
  }

  render() {
    const recipe = this.recipe;
    const ingredients = this.handlers.ingredients(recipe);
    for (const [dish, button] of this.buttons) {
      button.setAttribute('aria-pressed', String(dish === recipe));
    }
    const title = document.createElement('h3');
    title.textContent = recipe.name;
    const heal = document.createElement('strong');
    heal.textContent = `체력 +${recipe.heal}`;
    const list = document.createElement('ul');
    for (const ingredient of ingredients) {
      const item = document.createElement('li');
      item.textContent = `${ingredient.name}  ${ingredient.available}/1 (${ingredient.source})`;
      item.classList.toggle('missing', ingredient.available < 1);
      list.append(item);
    }
    this.details.replaceChildren(title, heal, list);
    const busy = Boolean(this.handlers.state().job);
    this.element.classList.toggle('cooking', busy);
    this.action.disabled = busy || ingredients.some(ingredient => ingredient.available < 1);
    this.progress.hidden = this.timerText.hidden = !busy;
    this.updateProgress(Date.now());
  }
}
