import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PauseControls } from '../.test-build/PauseControls.js';

class Element {
  children = []; style = {}; listeners = new Map(); hidden = false; textContent = '';
  constructor(tag) { this.tag = tag; }
  append(...elements) { this.children.push(...elements); }
  setAttribute() {}
  addEventListener(event, callback) { this.listeners.set(event, callback); }
  querySelector(tag) { return this.children.find(c => c.tag === tag) ?? this.children.map(c => c.querySelector(tag)).find(Boolean); }
  focus() { document.activeElement = this; }
  blur() { if (document.activeElement === this) document.activeElement = null; }
  remove() { this.removed = true; }
  click() { this.listeners.get('click')?.(); }
}
function setup(saveWorks = true) {
  const events = new Map();
  const documentEvents = new Map();
  globalThis.window = { addEventListener: (name, cb) => events.set(name, cb), removeEventListener: name => events.delete(name) };
  globalThis.document = {
    body: new Element('body'), hidden: false, activeElement: null,
    createElement: tag => new Element(tag),
    addEventListener: (name, cb) => documentEvents.set(name, cb), removeEventListener: name => documentEvents.delete(name),
  };
  const calls = { pause: 0, resume: 0, save: 0 };
  const controls = new PauseControls({ pause: () => calls.pause++, resume: () => calls.resume++, save: () => { calls.save++; return saveWorks; } });
  const all = root => [root, ...root.children.flatMap(all)];
  const button = label => all(document.body).find(el => el.tag === 'button' && el.textContent === label);
  const key = (code, repeat = false) => events.get('keydown')?.({ code, repeat, preventDefault() {} });
  return { controls, calls, events, documentEvents, button, key };
}

test('pause and resume work independently of a paused Phaser input manager', () => {
  const s = setup();
  s.key('KeyP'); assert.equal(s.calls.pause, 0); // start screen
  s.controls.setActive(true);
  s.button('⏸ 일시정지').click();
  s.key('KeyP', true); assert.equal(s.calls.pause, 1); assert.equal(s.calls.resume, 0);
  s.events.get('blur')(); assert.equal(s.calls.pause, 1);
  s.key('Escape'); assert.equal(s.calls.resume, 1);
  s.key('KeyP'); assert.equal(s.calls.pause, 2);
  s.button('💾 저장 후 계속하기').click();
  assert.equal(s.calls.save, 1); assert.equal(s.calls.resume, 2);
});

test('failed save never resumes or claims success', () => {
  const s = setup(false); s.controls.setActive(true); s.controls.pause();
  s.button('💾 저장 후 계속하기').click();
  assert.equal(s.calls.save, 1); assert.equal(s.calls.resume, 0);
  const text = document.body.children[0].children[1].children[0].children.map(el => el.textContent).join(' ');
  assert.match(text, /저장하지 못했어요/);
});

test('backgrounding pauses once and requires an explicit resume; cleanup removes listeners', () => {
  const s = setup(); s.controls.setActive(true);
  document.hidden = true; s.documentEvents.get('visibilitychange')();
  assert.equal(s.calls.pause, 1);
  document.hidden = false; s.documentEvents.get('visibilitychange')();
  assert.equal(s.calls.resume, 0);
  s.controls.resume(); assert.equal(s.calls.resume, 1);
  s.controls.destroy();
  assert.equal(s.events.size, 0); assert.equal(s.documentEvents.size, 0);
  assert.equal(document.body.children[0].removed, true);
});
