/** 구역 번호 순서대로 재생할 곡. 구역을 추가하면 여기에도 한 줄 추가합니다. */
export const ZONE_TRACKS = [
  'morning_at_the_reef.mp3', // 0 초심층
  'the_weight_of_water.mp3', // 1 중심층
  'pressure_at_twelve_fathoms.mp3', // 2 심해
  'pressure_and_salt.mp3', // 3 지하세계·수룡 보스전
  'light_through_the_fissure.mp3', // 4 빙하수 골짜기
  'current_and_stone.mp3', // 5 지하세계 2층
  'pressure_and_salt.mp3', // 6 열수분출공층 (전용 곡 전까지 지하세계 곡)
] as const;

/** Stream one looping track; pause preserves its position without decoding every MP3. */
export class ZoneMusic {
  private audio: HTMLAudioElement;
  private zone = 0;
  private unlocked = false;
  private paused = false;
  private destroyed = false;
  private playPending = false;
  private revision = 0;

  constructor(private baseUrl: string) {
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.preload = 'none';
    this.audio.volume = 0.32;
    this.audio.src = this.trackUrl();
  }

  private trackUrl() { return `${this.baseUrl}assets/audio/${ZONE_TRACKS[this.zone]}`; }

  unlock() { this.unlocked = true; this.sync(); }
  setPaused(paused: boolean) { this.paused = paused; this.sync(); }
  setMuted(muted: boolean) { this.audio.volume = muted ? 0 : 0.32; }

  setZone(zone: number) {
    const next = Math.max(0, Math.min(ZONE_TRACKS.length - 1, Math.round(zone)));
    if (next === this.zone || this.destroyed) return;
    const sameTrack = ZONE_TRACKS[next] === ZONE_TRACKS[this.zone];
    this.zone = next;
    // 같은 곡을 쓰는 구역끼리 이동하면 끊지 않고 이어서 재생합니다.
    if (sameTrack) return;
    this.audio.pause();
    this.revision++;
    this.playPending = false;
    this.audio.src = this.trackUrl();
    this.sync();
  }

  private sync() {
    if (this.destroyed) return;
    if (!this.unlocked || this.paused) {
      this.audio.pause();
      return;
    }
    if (!this.audio.paused || this.playPending) return;
    const revision = this.revision;
    this.playPending = true;
    // Autoplay rejection is retried on the next user gesture; never leak a rejection.
    void this.audio.play().catch(() => {}).finally(() => {
      if (revision === this.revision) this.playPending = false;
    });
  }

  destroy() {
    this.destroyed = true;
    this.revision++;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}
