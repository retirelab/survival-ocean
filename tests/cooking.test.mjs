import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { CROP_NAMES } from '../.test-build/Crops.js';
import { COOK_TIME_MS, RECIPES, completeCooking, eatMeal, isCookingSave, recipeById, takeIngredients } from '../.test-build/Cooking.js';

test('all 50 unique dishes can be made with resources obtainable in the game', () => {
  const scene = readFileSync(new URL('../src/scenes/OceanScene.ts', import.meta.url), 'utf8');
  const fish = new Set([...scene.matchAll(/\{ key: '[^']+', name: '([^']+)', hp:/g)].map(match => match[1]));
  assert.equal(RECIPES.length, 50);
  assert.equal(new Set(RECIPES.map(recipe => recipe.id)).size, 50);
  assert.equal(new Set(RECIPES.map(recipe => recipe.name)).size, 50);
  for (const recipe of RECIPES) {
    assert.ok(fish.has(recipe.fish), recipe.name);
    assert.ok(recipe.crops.length && recipe.crops.every(crop => CROP_NAMES.includes(crop)), recipe.name);
    assert.equal(recipe.crops.length, new Set(recipe.crops).size);
    const inventory = Object.fromEntries(recipe.crops.map(crop => [crop, 1]));
    assert.equal(takeIngredients(recipe, [recipe.fish], inventory), true);
    assert.ok(Object.values(inventory).every(count => count === 0));
  }
});

test('cooking validates both inventories and only grants one meal after four seconds', () => {
  const recipe = recipeById('seabream-sushi');
  const bag = ['연어', '참돔', '참돔'];
  assert.equal(takeIngredients(recipe, bag, { 밀: 1 }), false);
  assert.equal(bag.length, 3);
  const crops = { 쌀: 1, 밀: 1 };
  assert.equal(takeIngredients(recipe, bag, crops), true);
  assert.deepEqual(bag, ['연어', '참돔']);
  assert.deepEqual(crops, { 쌀: 0, 밀: 1 });
  const state = { meals: {}, job: { recipeId: recipe.id, readyAt: 100 + COOK_TIME_MS } };
  assert.equal(isCookingSave(state), true);
  assert.equal(completeCooking(state, 4099), undefined);
  assert.equal(completeCooking(state, 4100), recipe);
  assert.equal(completeCooking(state, 4200), undefined);
  assert.deepEqual(state.meals, { 'seabream-sushi': 1 });
});

test('eating caps health and consumes nothing if already at full health', () => {
  const state = { meals: { 'salmon-steak': 2 } };
  assert.equal(eatMeal(state, 'salmon-steak', 250, 250), 0);
  assert.equal(state.meals['salmon-steak'], 2);
  assert.equal(eatMeal(state, 'salmon-steak', 200, 250), 10);
  assert.equal(eatMeal(state, 'salmon-steak', 247, 250), 3);
  assert.equal(eatMeal(state, 'salmon-steak', 200, 250), 0);
  assert.equal(isCookingSave(state), true);
  assert.equal(isCookingSave({ meals: { 'salmon-steak': -1 } }), false);
  assert.equal(isCookingSave({ meals: {}, job: { recipeId: 'missing', readyAt: 4000 } }), false);
});
