import type { CropName } from './Crops.js';

export interface Recipe {
  id: string;
  name: string;
  fish: string;
  crops: readonly CropName[];
  heal: number;
  icon: string;
}

const dishes: ReadonlyArray<readonly [string, string, string, number, string, ...CropName[]]> = [
  ['salmon-steak', '연어 스테이크', '연어', 10, '🍳', '대파', '양파'],
  ['salmon-sushi', '연어초밥', '연어', 8, '🍣', '쌀'],
  ['seabream-sushi', '참돔초밥', '참돔', 8, '🍣', '쌀'],
  ['rock-bream-sushi', '돌돔초밥', '돌돔', 8, '🍣', '쌀'],
  ['tuna-sushi', '참다랑어초밥', '참다랑어', 9, '🍣', '쌀'],
  ['flounder-sushi', '광어초밥', '광어', 8, '🍣', '쌀'],
  ['shrimp-sushi', '새우초밥', '흰다리새우', 8, '🍣', '쌀'],
  ['squid-sushi', '오징어초밥', '오징어', 9, '🍣', '쌀'],
  ['octopus-sushi', '문어초밥', '문어', 9, '🍣', '쌀'],
  ['marlin-sushi', '청세치초밥', '청세치', 11, '🍣', '쌀'],
  ['tuna-rice', '참다랑어 덮밥', '참다랑어', 13, '🍚', '쌀', '대파'],
  ['salmon-rice', '연어 덮밥', '연어', 13, '🍚', '쌀', '양파'],
  ['eel-rice', '붕장어 덮밥', '붕장어', 17, '🍚', '쌀', '마늘', '설탕'],
  ['octopus-rice', '매콤 문어 덮밥', '문어', 16, '🍚', '쌀', '고추'],
  ['squid-rice', '오징어 볶음밥', '오징어', 16, '🍚', '쌀', '당근', '대파'],
  ['shrimp-rice', '새우 볶음밥', '흰다리새우', 14, '🍚', '쌀', '당근'],
  ['crab-rice', '꽃게살 볶음밥', '꽃게', 16, '🍚', '쌀', '양파', '대파'],
  ['king-crab-rice', '킹크랩 솥밥', '킹크랩', 23, '🍚', '쌀', '당근', '대파'],
  ['lobster-rice', '랍스터 리소토', '랍스터', 20, '🍚', '쌀', '양파'],
  ['grouper-rice', '다금바리 솥밥', '다금바리', 22, '🍚', '쌀', '무', '대파'],
  ['seabream-soup', '참돔 맑은탕', '참돔', 14, '🍲', '무', '대파'],
  ['rock-bream-soup', '돌돔 매운탕', '돌돔', 17, '🍲', '무', '고추', '대파'],
  ['flounder-soup', '광어 지리', '광어', 13, '🍲', '무', '대파'],
  ['crab-soup', '꽃게탕', '꽃게', 18, '🍲', '무', '고추', '마늘'],
  ['grouper-soup', '다금바리 매운탕', '다금바리', 24, '🍲', '무', '고추', '대파'],
  ['icefish-soup', '남극빙어 감자 수프', '남극빙어', 16, '🍲', '감자', '양파'],
  ['lobster-soup', '랍스타 비스크', '랍스타', 24, '🍲', '양파', '당근', '감자'],
  ['eel-soup', '붕장어국', '붕장어', 15, '🍲', '무', '대파'],
  ['shrimp-soup', '새우 감자 수프', '흰다리새우', 14, '🍲', '감자', '양파'],
  ['shark-soup', '백상아리 스튜', '백상아리', 25, '🍲', '감자', '당근', '양파'],
  ['trout-grill', '마늘 송어구이', '송어', 11, '🍳', '마늘'],
  ['mackerel-grill', '고등어구이', '고등어', 12, '🍳', '대파'],
  ['horse-mackerel-grill', '전갱이 마늘구이', '전갱이', 12, '🍳', '마늘'],
  ['seabream-grill', '참돔 채소구이', '참돔', 15, '🍳', '당근', '양파'],
  ['marlin-steak', '청세치 스테이크', '청세치', 18, '🍳', '마늘', '감자'],
  ['sailfish-steak', '돛세치 스테이크', '돛세치', 18, '🍳', '마늘', '양파'],
  ['mako-steak', '청상아리 스테이크', '청상아리', 23, '🍳', '마늘', '감자'],
  ['crocodile-steak', '바다악어 스테이크', '바다악어', 26, '🍳', '마늘', '감자', '양파'],
  ['king-crab-steam', '대파 킹크랩찜', '킹크랩', 21, '🦀', '대파', '마늘'],
  ['herring-braise', '청어 무조림', '청어', 15, '🍲', '무', '설탕'],
  ['mackerel-braise', '고등어 고추조림', '고등어', 17, '🍲', '무', '고추', '설탕'],
  ['octopus-stir-fry', '매운 문어볶음', '문어', 18, '🍳', '고추', '마늘', '대파'],
  ['squid-pancake', '오징어 파전', '오징어', 16, '🥞', '밀', '대파'],
  ['shrimp-fry', '새우튀김', '흰다리새우', 12, '🍤', '밀'],
  ['icefish-fry', '남극빙어튀김', '남극빙어', 13, '🍤', '밀'],
  ['horse-mackerel-fry', '전갱이튀김', '전갱이', 12, '🍤', '밀'],
  ['flounder-chips', '광어 피시 앤 칩스', '광어', 17, '🍟', '밀', '감자'],
  ['herring-sandwich', '청어 샌드위치', '청어', 14, '🥪', '밀', '양파'],
  ['lobster-roll', '랍스터 롤', '랍스터', 19, '🥪', '밀', '대파'],
  ['crab-noodles', '꽃게 칼국수', '꽃게', 18, '🍜', '밀', '대파', '마늘'],
];

export const RECIPES: readonly Recipe[] = dishes.map(([id, name, fish, heal, icon, ...crops]) =>
  ({ id, name, fish, heal, icon, crops }));
const recipes = new Map(RECIPES.map(recipe => [recipe.id, recipe]));
export const recipeById = (id: string) => recipes.get(id);
export const COOK_TIME_MS = 4000;

export interface CookingSave {
  meals: Record<string, number>;
  job?: { recipeId: string; readyAt: number };
}

export function takeIngredients(recipe: Recipe, bag: string[], crops: Partial<Record<CropName, number>>) {
  const fishIndex = bag.indexOf(recipe.fish);
  if (fishIndex < 0 || recipe.crops.some(crop => !crops[crop])) return false;
  bag.splice(fishIndex, 1);
  for (const crop of recipe.crops) crops[crop] = (crops[crop] ?? 0) - 1;
  return true;
}

export function completeCooking(state: CookingSave, now: number) {
  const job = state.job;
  if (!job || now < job.readyAt) return;
  const recipe = recipeById(job.recipeId);
  state.job = undefined;
  if (!recipe) return;
  state.meals[recipe.id] = (state.meals[recipe.id] ?? 0) + 1;
  return recipe;
}

export function eatMeal(state: CookingSave, id: string, hp: number, maxHp: number) {
  const recipe = recipeById(id);
  if (!recipe || !state.meals[id] || hp >= maxHp) return 0;
  state.meals[id] -= 1;
  if (!state.meals[id]) delete state.meals[id];
  return Math.min(maxHp - hp, recipe.heal);
}

export function isCookingSave(value: unknown): value is CookingSave {
  if (!value || typeof value !== 'object') return false;
  const { meals, job } = value as CookingSave;
  if (!meals || typeof meals !== 'object' || Array.isArray(meals) ||
    !Object.entries(meals).every(([id, count]) => recipes.has(id) && Number.isSafeInteger(count) && count > 0 && count <= 1e9)) return false;
  return job === undefined || (!!job && typeof job === 'object' && recipes.has(job.recipeId) &&
    Number.isSafeInteger(job.readyAt) && job.readyAt >= 0);
}
