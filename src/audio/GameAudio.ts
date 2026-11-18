import { ZoneMusic } from '../game/ZoneMusic';

type AudioContextConstructor = typeof AudioContext;

interface BrowserWindow extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

export class GameAudio {
  private readonly zoneMusic = new ZoneMusic(import.meta.env.BASE_URL);
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;
  private ambientDrone: OscillatorNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private zoneIndex = 0;
  private muted = false;
  private paused = false;
  private readonly lastPlayed = new Map<string, number>();

  unlock() {
    this.zoneMusic.unlock();
    if (!this.context) {
      const AudioContextClass =
        window.AudioContext ?? (window as BrowserWindow).webkitAudioContext;
      if (!AudioContextClass) return;

      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.32;
      this.master.connect(this.context.destination);
      this.startAmbience();
    }

    if (this.paused) {
      if (this.context.state === 'running') void this.context.suspend().catch(() => {});
      return;
    }
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    this.zoneMusic.setPaused(paused);
    if (!this.context || this.context.state === 'closed') return;
    if (paused) void this.context.suspend().catch(() => {});
    else this.unlock();
  }

  setZone(zoneIndex: number) {
    // 배경음은 모든 구역에 곡이 있고, 효과음 분위기는 기존 4단계(0~3)까지만 있습니다.
    this.zoneMusic.setZone(zoneIndex);
    this.zoneIndex = Math.max(0, Math.min(3, Math.round(zoneIndex)));
    this.applyZoneAtmosphere();
  }

  /** 보스전 BGM을 켜거나 끕니다. null이면 현재 구역 곡으로 돌아갑니다. */
  setBossMusic(track: string | null) {
    this.zoneMusic.setOverride(track);
  }

  playExplosion() {
    if (!this.canPlay('explosion', 0.25)) return;
    this.noiseBurst(0.6, 0.22, 420);
    this.tone(90, 0.55, 'sawtooth', 0.16, 34);
    this.tone(160, 0.3, 'square', 0.08, 60, 0.04);
  }

  playCharge() {
    if (!this.canPlay('charge', 0.4)) return;
    this.tone(70, 0.5, 'sawtooth', 0.1, 220);
    this.noiseBurst(0.35, 0.06, 1400);
  }

  playSaw() {
    if (!this.canPlay('saw', 0.3)) return;
    this.tone(240, 0.22, 'sawtooth', 0.08, 520);
    this.tone(520, 0.18, 'square', 0.05, 260, 0.1);
  }

  toggleMute(): boolean {
    this.unlock();
    this.muted = !this.muted;
    this.zoneMusic.setMuted(this.muted);
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : 0.32,
        this.context.currentTime,
        0.03
      );
    }
    return this.muted;
  }

  playShoot() {
    if (!this.canPlay('shoot', 0.06)) return;
    this.tone(460, 0.075, 'square', 0.11, 170);
  }

  playHit() {
    if (!this.canPlay('hit', 0.07)) return;
    this.noiseBurst(0.055, 0.075, 900);
    this.tone(155, 0.07, 'triangle', 0.09, 90);
  }

  playStun() {
    if (!this.canPlay('stun', 0.15)) return;
    this.tone(520, 0.16, 'sine', 0.12, 720);
    this.tone(780, 0.24, 'sine', 0.09, 620, 0.08);
  }

  playBossVictory() {
    if (!this.canPlay('boss-victory', 1.5)) return;
    const notes = [48, 55, 60, 64, 67, 72, 76, 79];
    notes.forEach((midi, index) => {
      this.tone(this.midiToFrequency(midi), 0.42, index < 4 ? 'sawtooth' : 'triangle', 0.085, this.midiToFrequency(midi + 12), index * 0.11);
    });
    this.noiseBurst(0.45, 0.08, 900);
  }

  playCollect() {
    if (!this.canPlay('collect', 0.1)) return;
    this.tone(523.25, 0.13, 'sine', 0.1, 659.25);
    this.tone(659.25, 0.18, 'sine', 0.09, 783.99, 0.07);
  }

  playTank() {
    if (!this.canPlay('tank', 0.2)) return;
    this.tone(360, 0.2, 'sine', 0.1, 170);
    this.noiseBurst(0.12, 0.035, 480);
  }

  playLevelUp() {
    if (!this.canPlay('level', 0.8)) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((note, index) => {
      this.tone(note, 0.22, 'sine', 0.105, note * 1.01, index * 0.085);
    });
  }

  playDamage() {
    if (!this.canPlay('damage', 0.25)) return;
    this.noiseBurst(0.14, 0.1, 260);
    this.tone(115, 0.2, 'sawtooth', 0.13, 58);
  }

  playDeath() {
    if (!this.canPlay('death', 0.8)) return;
    this.noiseBurst(0.35, 0.09, 220);
    this.tone(280, 0.55, 'sawtooth', 0.12, 52);
  }

  playZoneChange(deeper: boolean) {
    if (!this.canPlay('zone', 0.45)) return;
    if (deeper) {
      this.tone(230, 0.45, 'sine', 0.1, 92);
      this.noiseBurst(0.3, 0.035, 320);
    } else {
      this.tone(130, 0.4, 'sine', 0.09, 330);
    }
  }

  playDenied() {
    if (!this.canPlay('denied', 0.8)) return;
    this.tone(185, 0.12, 'square', 0.075, 150);
    this.tone(150, 0.12, 'square', 0.065, 125, 0.13);
  }

  destroy() {
    this.zoneMusic.destroy();
    this.stopNode(this.ambientNoise);
    this.stopNode(this.ambientDrone);
    this.stopNode(this.ambientLfo);
    this.ambientNoise = null;
    this.ambientDrone = null;
    this.ambientLfo = null;
    this.ambienceGain = null;
    this.ambienceFilter = null;

    if (this.context && this.context.state !== 'closed') {
      void this.context.close();
    }
    this.context = null;
    this.master = null;
  }

  private startAmbience() {
    const context = this.context;
    const master = this.master;
    if (!context || !master || this.ambientNoise) return;

    const frameCount = context.sampleRate * 3;
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    let smoothNoise = 0;
    for (let i = 0; i < frameCount; i++) {
      const whiteNoise = Math.random() * 2 - 1;
      smoothNoise = (smoothNoise + 0.035 * whiteNoise) / 1.035;
      data[i] = smoothNoise * 2.8;
    }

    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.7;

    const ambienceGain = context.createGain();
    ambienceGain.gain.value = 0.055;

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.018;

    lfo.connect(lfoGain);
    lfoGain.connect(ambienceGain.gain);
    noise.connect(filter);
    filter.connect(ambienceGain);
    ambienceGain.connect(master);

    const drone = context.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 54;
    const droneGain = context.createGain();
    droneGain.gain.value = 0.018;
    drone.connect(droneGain);
    droneGain.connect(master);

    noise.start();
    drone.start();
    lfo.start();
    this.ambientNoise = noise;
    this.ambientDrone = drone;
    this.ambientLfo = lfo;
    this.ambienceGain = ambienceGain;
    this.ambienceFilter = filter;
    this.applyZoneAtmosphere();
  }

  private applyZoneAtmosphere() {
    const context = this.context;
    if (!context) return;

    const zoneSettings = [
      { noise: 0.032, cutoff: 900, drone: 65.41 },
      { noise: 0.042, cutoff: 650, drone: 55 },
      { noise: 0.058, cutoff: 390, drone: 43.65 },
      { noise: 0.074, cutoff: 240, drone: 36.71 },
    ][this.zoneIndex];
    const now = context.currentTime;

    this.ambienceGain?.gain.setTargetAtTime(zoneSettings.noise, now, 0.7);
    this.ambienceFilter?.frequency.setTargetAtTime(
      zoneSettings.cutoff,
      now,
      0.8
    );
    this.ambientDrone?.frequency.setTargetAtTime(
      zoneSettings.drone,
      now,
      0.8
    );
  }

  private midiToFrequency(midi: number): number {
    return 440 * 2 ** ((midi - 69) / 12);
  }

  private tone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFrequency = frequency,
    delay = 0
  ) {
    const context = this.context;
    const master = this.master;
    if (!context || !master || this.muted || context.state === 'closed') return;

    const start = context.currentTime + delay;
    const end = start + duration;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      end
    );

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  private noiseBurst(duration: number, volume: number, cutoff: number) {
    const context = this.context;
    const master = this.master;
    if (!context || !master || this.muted || context.state === 'closed') return;

    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    gain.gain.value = volume;

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
  }

  private canPlay(name: string, cooldown: number): boolean {
    if (!this.context || !this.master || this.muted) return false;
    const now = this.context.currentTime;
    const last = this.lastPlayed.get(name) ?? -Infinity;
    if (now - last < cooldown) return false;
    this.lastPlayed.set(name, now);
    return true;
  }

  private stopNode(node: AudioScheduledSourceNode | null) {
    if (!node) return;
    try {
      node.stop();
    } catch {
      // 이미 정지된 오디오 노드는 다시 정지할 필요가 없습니다.
    }
  }
}
