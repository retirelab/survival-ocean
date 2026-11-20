import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ZoneMusic, ZONE_TRACKS, BOSS_TRACKS } from '../.test-build/ZoneMusic.js';

let media;
globalThis.Audio = class {
  paused = true;
  currentTime = 0;
  plays = 0;
  fail = false;
  constructor() { media = this; }
  set src(value) { this.url = value; this.currentTime = 0; }
  get src() { return this.url; }
  play() {
    this.plays++;
    if (this.fail) return Promise.reject(new Error('autoplay blocked'));
    this.paused = false;
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  removeAttribute() { this.url = ''; }
  load() {}
};
const settle = () => new Promise(resolve => setImmediate(resolve));

test('every zone maps to its track under the Pages base path', async () => {
  const music = new ZoneMusic('/survival-ocean/');
  assert.equal(media.plays, 0);
  assert.equal(media.loop, true);
  assert.deepEqual(ZONE_TRACKS, ['morning_at_the_reef.mp3', 'the_weight_of_water.mp3', 'pressure_at_twelve_fathoms.mp3',
    'pressure_and_salt.mp3', 'light_through_the_fissure.mp3', 'current_and_stone.mp3', 'pressure_and_salt.mp3',
    'current_and_stone.mp3', 'light_through_the_fissure.mp3', 'light_through_the_fissure.mp3', 'current_and_stone.mp3']);
  music.unlock();
  for (let zone = 0; zone < ZONE_TRACKS.length; zone++) {
    music.setZone(zone);
    assert.equal(media.src, `/survival-ocean/assets/audio/${ZONE_TRACKS[zone]}`);
    assert.equal(media.paused, false);
    await settle();
  }
  music.destroy();
});

test('pause and shop interruptions preserve position, and mute applies to zone audio', async () => {
  const music = new ZoneMusic('/');
  music.unlock();
  await settle();
  media.currentTime = 27;
  music.setPaused(true);
  music.unlock();
  assert.equal(media.paused, true);
  music.setPaused(false);
  await settle();
  assert.equal(media.currentTime, 27);
  assert.equal(media.paused, false);
  music.setZone(0);
  assert.equal(media.currentTime, 27);
  music.setMuted(true);
  assert.equal(media.volume, 0);
  await settle();
  assert.equal(media.currentTime, 27);
  music.setMuted(false);
  assert.equal(media.volume, 0.32);
  music.setPaused(true);
  music.setZone(2);
  assert.equal(media.paused, true);
  assert.equal(media.currentTime, 0);
  music.setPaused(false);
  assert.equal(media.paused, false);
  music.destroy();
  assert.equal(media.paused, true);
  music.unlock();
  assert.equal(media.paused, true);
});

test('autoplay rejection can be retried on a later gesture without overlapping play requests', async () => {
  const music = new ZoneMusic('/');
  media.fail = true;
  music.unlock();
  music.unlock();
  assert.equal(media.plays, 1);
  await settle();
  media.fail = false;
  music.unlock();
  await settle();
  assert.equal(media.plays, 2);
  assert.equal(media.paused, false);
  music.destroy();
});

test('every listed track ships in public/assets/audio', async () => {
  const { existsSync } = await import('node:fs');
  for (const track of [...ZONE_TRACKS, ...Object.values(BOSS_TRACKS)]) assert.ok(existsSync(new URL(`../public/assets/audio/${track}`, import.meta.url)), track);
});

test('zones sharing a track keep playing without restarting', async () => {
  const music = new ZoneMusic('/survival-ocean/');
  music.unlock();
  music.setZone(3);
  await settle();
  media.currentTime = 42;
  const plays = media.plays;
  music.setZone(6);
  assert.equal(media.currentTime, 42);
  assert.equal(media.plays, plays);
  assert.equal(media.paused, false);
  music.setZone(5);
  assert.equal(media.src, '/survival-ocean/assets/audio/current_and_stone.mp3');
  music.destroy();
});

test('boss music starts from the beginning and the zone track returns afterwards', async () => {
  const music = new ZoneMusic('/survival-ocean/');
  music.unlock();
  music.setZone(5);
  await settle();
  // 지하세계 2층 → 둥지는 같은 곡이라 이어지고, 보스전이 시작되면 보스 곡으로 바뀝니다.
  music.setZone(7);
  assert.equal(media.src, '/survival-ocean/assets/audio/current_and_stone.mp3');
  music.setOverride(BOSS_TRACKS.helicoprion);
  assert.equal(media.src, '/survival-ocean/assets/audio/serrated_mandibles.mp3');
  assert.equal(media.currentTime, 0);
  assert.equal(media.paused, false);
  await settle();
  // 보스전 중 일시정지해도 보스 곡을 유지합니다.
  music.setPaused(true);
  assert.equal(media.paused, true);
  music.setPaused(false);
  assert.equal(media.src, '/survival-ocean/assets/audio/serrated_mandibles.mp3');
  await settle();
  music.setOverride(null);
  assert.equal(media.src, '/survival-ocean/assets/audio/current_and_stone.mp3');
  music.destroy();
});
