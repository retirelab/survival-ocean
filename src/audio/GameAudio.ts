type AudioContextConstructor = typeof AudioContext;

interface BrowserWindow extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

export class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;
  private ambientDrone: OscillatorNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private musicBus: GainNode | null = null;
  private musicNoiseBuffer: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private nextMusicStep = 0;
  private musicStep = 0;
  private zoneIndex = 0;
  private dragonBattle = false;
  private muted = false;
  private paused = false;
  private readonly lastPlayed = new Map<string, number>();

  unlock() {
    if (!this.context) {
      const AudioContextClass =
        window.AudioContext ?? (window as BrowserWindow).webkitAudioContext;
      if (!AudioContextClass) return;

      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.32;
      this.master.connect(this.context.destination);
      this.startAmbience();
      this.startMusic();
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
    if (!this.context || this.context.state === 'closed') return;
    if (paused) void this.context.suspend().catch(() => {});
    else this.unlock();
  }

  setZone(zoneIndex: number) {
    const nextZone = Math.max(0, Math.min(3, Math.round(zoneIndex)));
    const changed = nextZone !== this.zoneIndex;
    this.zoneIndex = nextZone;

    const context = this.context;
    if (!context) return;
    this.applyZoneAtmosphere();

    if (changed && this.musicBus) {
      const now = context.currentTime;
      const targetVolume = this.getMusicVolume(nextZone);
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setValueAtTime(
        Math.max(0.0001, this.musicBus.gain.value),
        now
      );
      this.musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      this.musicBus.gain.linearRampToValueAtTime(targetVolume, now + 1.1);
      this.musicStep = 0;
      this.nextMusicStep = now + 0.24;
    }
  }

  setDragonBattle(active: boolean) {
    if (this.dragonBattle === active) return;
    this.dragonBattle = active;
    const context = this.context;
    if (!context || !this.musicBus) return;
    const now = context.currentTime;
    this.musicBus.gain.cancelScheduledValues(now);
    this.musicBus.gain.setValueAtTime(Math.max(0.0001, this.musicBus.gain.value), now);
    this.musicBus.gain.linearRampToValueAtTime(0.0001, now + 0.16);
    this.musicBus.gain.linearRampToValueAtTime(this.getMusicVolume(this.zoneIndex), now + 0.75);
    this.musicStep = 0;
    this.nextMusicStep = now + 0.18;
  }

  toggleMute(): boolean {
    this.unlock();
    this.muted = !this.muted;
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
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.stopNode(this.ambientNoise);
    this.stopNode(this.ambientDrone);
    this.stopNode(this.ambientLfo);
    this.ambientNoise = null;
    this.ambientDrone = null;
    this.ambientLfo = null;
    this.ambienceGain = null;
    this.ambienceFilter = null;
    this.musicBus = null;
    this.musicNoiseBuffer = null;

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

  private startMusic() {
    const context = this.context;
    const master = this.master;
    if (!context || !master || this.musicBus) return;

    const musicBus = context.createGain();
    musicBus.gain.value = this.getMusicVolume(this.zoneIndex);
    musicBus.connect(master);
    this.musicBus = musicBus;

    const noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    this.musicNoiseBuffer = noiseBuffer;

    this.musicStep = 0;
    this.nextMusicStep = context.currentTime + 0.08;
    this.scheduleMusic();
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 80);
  }

  private scheduleMusic() {
    const context = this.context;
    if (!context || !this.musicBus || context.state !== 'running') return;

    const now = context.currentTime;
    if (this.nextMusicStep < now - 0.5) {
      this.nextMusicStep = now + 0.05;
      this.musicStep = 0;
    }

    const stepDuration = 30 / this.getBpm(this.zoneIndex);
    while (this.nextMusicStep < now + 0.35) {
      this.scheduleZoneMusic(
        this.zoneIndex,
        this.musicStep,
        this.nextMusicStep,
        stepDuration
      );
      this.musicStep += 1;
      this.nextMusicStep += stepDuration;
    }
  }

  private scheduleZoneMusic(
    zone: number,
    step: number,
    start: number,
    stepDuration: number
  ) {
    if (zone === 0) {
      this.scheduleShallowMusic(step, start, stepDuration);
    } else if (zone === 1) {
      this.scheduleMidMusic(step, start, stepDuration);
    } else if (zone === 2) {
      this.scheduleDeepMusic(step, start, stepDuration);
    } else if (this.dragonBattle) {
      this.scheduleDragonBossMusic(step, start, stepDuration);
    } else {
      this.scheduleHorrorMusic(step, start, stepDuration);
    }
  }

  private scheduleDragonBossMusic(step: number, start: number, unit: number) {
    const melody: Array<number | null> = [
      69, 69, 72, 74, 76, 74, 72, 69,
      67, 67, 69, 72, 74, 76, 79, 76,
      69, 72, 76, 81, 79, 76, 74, 72,
      67, 69, 72, 74, 76, 74, 72, 69,
    ];
    const roots = [33, 36, 31, 38];
    const position = step % 32;
    const beat = step % 8;
    const root = roots[Math.floor(step / 8) % roots.length];
    const lead = melody[position];

    if (lead !== null) {
      this.musicNote(lead, unit * 0.85, start, 'square', 0.075, 0.008, 2200, lead + (position % 8 === 7 ? 12 : 0));
      this.musicNote(lead - 12, unit * 0.72, start, 'triangle', 0.035, 0.012, 1300);
    }
    if (beat === 0) {
      for (const interval of [0, 3, 7, 12]) {
        this.musicNote(root + interval, unit * 7.5, start, 'sawtooth', 0.045, 0.08, 900);
      }
    }
    if (beat === 0 || beat === 2 || beat === 4 || beat === 6) {
      this.musicNote(root - 12, unit * 1.35, start, 'sine', beat === 0 || beat === 4 ? 0.13 : 0.09, 0.01, 240);
      this.musicNoise(start, unit * 0.42, beat === 0 || beat === 4 ? 0.075 : 0.045, 520);
    }
    if (beat === 3 || beat === 7) {
      this.musicNoise(start, unit * 0.23, 0.035, 4200);
    }
  }

  private scheduleShallowMusic(step: number, start: number, unit: number) {
    const melody: Array<number | null> = [
      72, null, 76, 79, 76, 74, 72, null,
      74, null, 77, 81, 79, 77, 76, 74,
    ];
    const roots = [48, 53, 45, 55];
    const position = step % 16;
    const chordPosition = step % 8;
    const root = roots[Math.floor(step / 8) % roots.length];
    const note = melody[position];

    if (note !== null) {
      this.musicNote(note, unit * 0.82, start, 'triangle', 0.115, 0.012, 2600);
    }
    if (chordPosition === 0) {
      for (const interval of [0, 4, 7]) {
        this.musicNote(root + 12 + interval, unit * 7.2, start, 'sine', 0.032, 0.08, 1800);
      }
    }
    if (chordPosition === 0 || chordPosition === 4) {
      this.musicNote(root, unit * 1.8, start, 'sine', 0.085, 0.02, 900);
    }
    if (position % 2 === 0) {
      this.musicNoise(start, 0.035, 0.012, 4200);
    }
  }

  private scheduleMidMusic(step: number, start: number, unit: number) {
    const melody: Array<number | null> = [
      69, null, 72, 74, 76, 74, 72, null,
      67, null, 69, 72, 74, 76, 79, 76,
    ];
    const roots = [45, 48, 43, 47];
    const position = step % 16;
    const chordPosition = step % 8;
    const root = roots[Math.floor(step / 8) % roots.length];
    const note = melody[position];

    if (note !== null) {
      this.musicNote(note, unit * 0.9, start, 'triangle', 0.105, 0.015, 1900);
    }
    if (chordPosition === 0) {
      for (const interval of [0, 3, 7]) {
        this.musicNote(root + 12 + interval, unit * 7.3, start, 'triangle', 0.038, 0.12, 1250);
      }
    }
    if (chordPosition === 0 || chordPosition === 4) {
      this.musicNote(root, unit * 2.6, start, 'sawtooth', 0.07, 0.03, 620);
      this.musicNote(root + 7, unit * 0.65, start + unit * 0.5, 'sine', 0.05, 0.01, 1200);
    }
    if (position === 0 || position === 4 || position === 8 || position === 12) {
      this.musicNoise(start, 0.09, 0.022, 720);
    }
  }

  private scheduleDeepMusic(step: number, start: number, unit: number) {
    const roots = [38, 34, 36, 33];
    const leadNotes = [62, 65, 69, 68];
    const position = step % 16;
    const chordPosition = step % 8;
    const progression = Math.floor(step / 8) % roots.length;
    const root = roots[progression];

    if (chordPosition === 0) {
      for (const interval of [0, 3, 7, 12]) {
        this.musicNote(root + interval, unit * 7.6, start, 'sawtooth', 0.043, 0.3, 680);
      }
      this.musicNote(root - 12, unit * 4.5, start, 'sine', 0.095, 0.08, 260);
      this.musicNoise(start, 0.32, 0.04, 240);
    }
    if (position === 3 || position === 7 || position === 11 || position === 15) {
      const lead = leadNotes[Math.floor(position / 4)];
      this.musicNote(lead, unit * 2.2, start, 'sine', 0.065, 0.12, 1100);
    }
    if (position === 6 || position === 14) {
      this.musicNote(root + 19, unit * 1.5, start, 'triangle', 0.04, 0.06, 1500);
    }
  }

  private scheduleHorrorMusic(step: number, start: number, unit: number) {
    const roots = [37, 38, 32, 31];
    const highPattern: Array<number | null> = [
      null, null, null, 73, null, null, null, null,
      null, 74, null, null, null, null, 80, null,
      null, null, 77, null, null, null, null, 76,
      null, null, null, null, 85, null, 79, null,
    ];
    const position = step % 32;
    const chordPosition = step % 8;
    const root = roots[Math.floor(step / 8) % roots.length];
    const highNote = highPattern[position];

    if (chordPosition === 0) {
      for (const interval of [0, 1, 6]) {
        this.musicNote(root + interval, unit * 7.8, start, 'sawtooth', 0.037, 0.55, 390);
      }
      this.musicNote(root - 12, unit * 5, start, 'sine', 0.1, 0.12, 180);
    }
    if (highNote !== null) {
      this.musicNote(highNote, unit * 2.4, start, 'sine', 0.055, 0.2, 1350, highNote - 1);
    }
    if (chordPosition === 0 || chordPosition === 3) {
      this.musicNote(32, unit * 0.85, start, 'sine', 0.085, 0.025, 150, 29);
    }
    if (position === 7 || position === 15 || position === 30) {
      this.musicNoise(start, 0.5, 0.038, 330);
    }
  }

  private musicNote(
    midi: number,
    duration: number,
    start: number,
    type: OscillatorType,
    volume: number,
    attack: number,
    cutoff: number,
    endMidi = midi
  ) {
    const context = this.context;
    const bus = this.musicBus;
    if (!context || !bus || this.muted || context.state === 'closed') return;

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const end = start + duration;
    const safeAttack = Math.min(attack, duration * 0.4);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(this.midiToFrequency(midi), start);
    oscillator.frequency.exponentialRampToValueAtTime(
      this.midiToFrequency(endMidi),
      end
    );
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.65;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + safeAttack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  }

  private musicNoise(start: number, duration: number, volume: number, cutoff: number) {
    const context = this.context;
    const bus = this.musicBus;
    const buffer = this.musicNoiseBuffer;
    if (!context || !bus || !buffer || this.muted || context.state === 'closed') return;

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const end = start + duration;

    source.buffer = buffer;
    filter.type = cutoff < 500 ? 'lowpass' : 'bandpass';
    filter.frequency.value = cutoff;
    filter.Q.value = 0.9;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    source.start(start, 0, Math.min(duration, buffer.duration));
  }

  private midiToFrequency(midi: number): number {
    return 440 * 2 ** ((midi - 69) / 12);
  }

  private getBpm(zone: number): number {
    if (zone === 3 && this.dragonBattle) return 138;
    return [112, 100, 76, 58][zone] ?? 76;
  }

  private getMusicVolume(zone: number): number {
    if (zone === 3 && this.dragonBattle) return 0.7;
    return [0.5, 0.54, 0.58, 0.5][zone] ?? 0.52;
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
