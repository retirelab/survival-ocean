import assert from 'node:assert/strict';
import test from 'node:test';
import { GamepadControls, PAD, controlGamepadDialog } from '../.test-build/GamepadControls.js';

function controller({ index = 0, mapping = 'standard', axes = [0, 0, 0, 0], buttons = {} } = {}) {
  return {
    index, id: 'Xbox', connected: true, mapping, axes,
    buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: false, value: buttons[i] ?? 0 })),
  };
}

test('Xbox movement has a dead zone, D-pad diagonals are normalized, and aiming is independent', () => {
  const pad = new GamepadControls();
  pad.update([controller({ axes: [0.15, 0.05, 0, -1] })]);
  assert.deepEqual(pad.move, { x: 0, y: 0 });
  assert.deepEqual(pad.aim, { x: 0, y: -1 });
  pad.update([controller({ buttons: { [PAD.down]: 1, [PAD.right]: 1 } })]);
  assert.ok(Math.abs(Math.hypot(pad.move.x, pad.move.y) - 1) < 1e-9);
  assert.deepEqual(pad.nav, { x: 1, y: 1 });
  pad.update([controller({ buttons: { [PAD.down]: 1, [PAD.right]: 1 } })]);
  assert.deepEqual(pad.nav, { x: 0, y: 0 });
});

test('the right trigger supports tap and hold, and reset or hot unplug cancels a held trigger', () => {
  const pad = new GamepadControls();
  const held = controller({ buttons: { [PAD.rt]: 0.75, [PAD.a]: 1 } });
  pad.update([held]);
  assert.equal(pad.firePressed, true);
  assert.equal(pad.justPressed(PAD.a), true);
  pad.update([held]);
  assert.equal(pad.firePressed, false);
  assert.equal(pad.fireDown, true);
  pad.blockFire();
  assert.equal(pad.fireDown, false);
  pad.update([controller()]);
  pad.update([held]);
  assert.equal(pad.firePressed, true);
  assert.equal(pad.update([null]), true);
  assert.equal(pad.fireDown, false);
  assert.equal(pad.update([null]), false);
});

test('paused dialogs move focus, confirm once per press, and support closing with B', () => {
  const pad = new GamepadControls();
  const document = { activeElement: null };
  let clicks = 0;
  let closed = false;
  const buttons = Array.from({ length: 2 }, () => ({
    focus() { document.activeElement = this; },
    click() { clicks++; },
  }));
  const dialog = { querySelectorAll: () => buttons };
  const run = buttons => {
    pad.update([controller({ buttons })]);
    controlGamepadDialog(pad, dialog, () => { closed = true; });
  };
  globalThis.document = document;
  try {
    buttons[0].focus();
    run({ [PAD.down]: 1 });
    assert.equal(document.activeElement, buttons[1]);
    run({ [PAD.a]: 1 });
    run({ [PAD.a]: 1 });
    assert.equal(clicks, 1);
    run({ [PAD.b]: 1 });
    assert.equal(closed, true);
  } finally {
    delete globalThis.document;
  }
});
