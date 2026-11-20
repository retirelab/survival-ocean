import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GLACIAL_ZONE_INDEX, FIRST_GLACIAL_PASSAGE, SECOND_GLACIAL_PASSAGE,
  hitsGlacialWall, glacialPassageExit,
} from '../.test-build/GlacialPassages.js';
import { MX3_ZONE_INDEX } from '../.test-build/MX3.js';
import { ZONE_TRACKS } from '../.test-build/ZoneMusic.js';

test('first and second glacial passages connect both ways without trapping the submarine', () => {
  for (const [width, height] of [[360, 700], [640, 320], [320, 240], [1280, 720]]) {
    const first = glacialPassageExit(GLACIAL_ZONE_INDEX, 24, height / 2, width, height);
    assert.equal(first.zone, FIRST_GLACIAL_PASSAGE);
    assert.equal(hitsGlacialWall(first.zone, first.x, first.y, width, height), false);
    const queue = [[first.x, first.y]];
    const seen = new Set();
    let second;
    // Find a continuous route using the same small steps and screen bounds as swimming.
    for (let i = 0; i < queue.length && !second; i++) {
      const [x, y] = queue[i];
      if (y >= height - 22) {
        second = glacialPassageExit(first.zone, x, y, width, height);
        break;
      }
      for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4]]) {
        const nx = Math.max(24, Math.min(width - 24, x + dx));
        const ny = Math.max(24, Math.min(height - 20, y + dy));
        const key = `${Math.round(nx)}:${Math.round(ny)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!hitsGlacialWall(first.zone, nx, ny, width, height)) queue.push([nx, ny]);
      }
    }
    assert.equal(second?.zone, SECOND_GLACIAL_PASSAGE, `no route at ${width}×${height}`);
    assert.equal(hitsGlacialWall(second.zone, second.x, second.y, width, height), false);
    const back = glacialPassageExit(second.zone, second.x, 24, width, height);
    assert.equal(back.zone, FIRST_GLACIAL_PASSAGE);
    assert.equal(hitsGlacialWall(back.zone, back.x, back.y, width, height), false);
    assert.equal(glacialPassageExit(back.zone, width - 24, first.y, width, height).zone, GLACIAL_ZONE_INDEX);
  }
});

test('ice walls and icicles block the player and the second passage opens into Underworld 3F', () => {
  const width = 1000, height = 700;
  for (const [zone, x, y] of [[FIRST_GLACIAL_PASSAGE, .1, .7], [FIRST_GLACIAL_PASSAGE, .45, .48],
    [FIRST_GLACIAL_PASSAGE, .9, .85], [SECOND_GLACIAL_PASSAGE, .8, .4]]) {
    assert.equal(hitsGlacialWall(zone, x * width, y * height, width, height), true);
  }
  assert.equal(hitsGlacialWall(SECOND_GLACIAL_PASSAGE, width * .45, height - 20, width, height), false);
  const arena = glacialPassageExit(SECOND_GLACIAL_PASSAGE, width * .45, height - 20, width, height);
  assert.equal(arena.zone, MX3_ZONE_INDEX);
  assert.equal(glacialPassageExit(arena.zone, arena.x, 24, width, height).zone, SECOND_GLACIAL_PASSAGE);
  assert.equal(ZONE_TRACKS[FIRST_GLACIAL_PASSAGE], ZONE_TRACKS[GLACIAL_ZONE_INDEX]);
  assert.equal(ZONE_TRACKS[SECOND_GLACIAL_PASSAGE], ZONE_TRACKS[GLACIAL_ZONE_INDEX]);
});
