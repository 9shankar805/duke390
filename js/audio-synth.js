/**
 * KTM Duke 390 - Web Audio API Procedural Engine Sound Simulator
 * Generates real-time 399cc LC4c Single-Cylinder 4-Stroke Exhaust Notes & Rev-Limiter
 */

class KTMEngineSound {
  constructor() {
    this.ctx = null;
    this.isRunning = false;
    this.isRevving = false;
    this.currentRPM = 1400;
    this.targetRPM = 1400;
    this.idleRPM = 1400;
    this.maxRPM = 10000;
    
    // Audio Nodes
    this.masterGain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.noiseNode = null;
    this.filter = null;
    this.distortion = null;
    
    // Animation loop timer
    this.animFrame = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    // Dynamic Lowpass Resonance Filter (mimics exhaust canister)
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    // Primary Cylinder Piston Thump (Sawtooth)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(23.3, this.ctx.currentTime); // 1400 RPM / 60

    // Secondary Exhaust Resonator (Triangle / Square hybrid)
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(46.6, this.ctx.currentTime);

    // Subtle Airbox Induction Noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    this.noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.filter);

    // Connect oscillators to filter -> Master Gain -> Destination
    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    this.osc1.connect(osc1Gain);
    osc1Gain.connect(this.filter);

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.osc2.connect(osc2Gain);
    osc2Gain.connect(this.filter);

    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.osc1.start();
    this.osc2.start();
    this.noiseNode.start();

    this.startEngineLoop();
  }

  start() {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isRunning = true;
    this.masterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.5);
  }

  stop() {
    if (!this.ctx || !this.isRunning) return;
    this.isRunning = false;
    this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
  }

  toggle() {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  setThrottle(isRevving) {
    if (!this.isRunning) {
      this.start();
    }
    this.isRevving = isRevving;
  }

  startEngineLoop() {
    const loop = () => {
      if (this.isRunning) {
        if (this.isRevving) {
          // Accelerate RPM swiftly
          this.currentRPM += (this.maxRPM - this.currentRPM) * 0.08;
          if (this.currentRPM > 9700) {
            // Rev limiter cut stutter effect
            if (Math.random() > 0.4) {
              this.currentRPM -= 300;
            }
          }
        } else {
          // Fall back to idle
          this.currentRPM += (this.idleRPM - this.currentRPM) * 0.05;
        }

        // Single-cylinder firing frequency = RPM / 60
        const firingFreq = this.currentRPM / 60;
        const now = this.ctx.currentTime;

        this.osc1.frequency.setValueAtTime(Math.max(10, firingFreq), now);
        this.osc2.frequency.setValueAtTime(Math.max(20, firingFreq * 2), now);

        // Filter opens up as RPM climbs (deeper intake roar)
        const cutoff = 200 + (this.currentRPM / this.maxRPM) * 1800;
        this.filter.frequency.setValueAtTime(cutoff, now);
      }

      this.animFrame = requestAnimationFrame(loop);
    };

    loop();
  }
}

// Global instance
window.ktmSound = new KTMEngineSound();
