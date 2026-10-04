// Synthetic Web Audio Engine & Haptic Integration
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  vibrate(pattern) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }
  beep(freq, type = 'sine', duration = 0.1, gainVal = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  posCardTap() {
    if (!this.enabled) return;
    this.init();
    this.vibrate(40);
    this.beep(1760, 'sine', 0.1, 0.16);
    setTimeout(() => this.beep(2349, 'sine', 0.15, 0.16), 80);
  }
  cashRegister() {
    if (!this.enabled) return;
    this.init();
    this.vibrate([30, 40, 30]);
    this.beep(987, 'triangle', 0.08, 0.14);
    setTimeout(() => this.beep(1318, 'triangle', 0.18, 0.14), 60);
  }
  orderChit() {
    if (!this.enabled) return;
    this.init();
    this.vibrate(25);
    this.beep(750, 'sine', 0.08, 0.12);
    setTimeout(() => this.beep(1000, 'triangle', 0.1, 0.12), 70);
  }
  boxPickup() {
    if (!this.enabled) return;
    this.vibrate(20);
    this.beep(880, 'sine', 0.06, 0.12);
  }
  ovenSizzle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate([20, 50, 30]);
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }
  upgradeFanfare() {
    if (!this.enabled) return;
    this.init();
    this.vibrate([60, 40, 80, 40, 120]);
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => this.beep(f, 'triangle', 0.2, 0.16), i * 85);
    });
  }
  warningBuzz() {
    if (!this.enabled) return;
    this.vibrate([80, 50, 80]);
    this.beep(220, 'sawtooth', 0.18, 0.12);
  }
}
window.audio = new AudioEngine();
