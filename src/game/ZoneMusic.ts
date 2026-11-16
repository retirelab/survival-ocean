export const ZONE_TRACKS = [
  'morning_at_the_reef.mp3',
  'the_weight_of_water.mp3',
  'pressure_at_twelve_fathoms.mp3',
  'pressure_and_salt.mp3',
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
    const next = Math.max(0, Math.min(3, Math.round(zone)));
    if (next === this.zone || this.destroyed) return;
    this.zone = next;
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
