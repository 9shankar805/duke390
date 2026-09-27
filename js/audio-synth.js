/**
 * KTM Duke 390 - High-Fidelity Procedural LC4c Engine Audio Synthesizer
 * Supports real-time throttle revving, velocity modulation, and dedicated Sound On/Off Toggle.
 */

class KTMEngineSound {
  constructor() {
    this.ctx = null;
    this.isRunning = false;
    this.isMuted = false;
    this.isThrottleHeld = false;
    
    // RPM Dynamics
    this.idleRPM = 1600;
    this.maxRPM = 10500;
    this.currentRPM = 1600;
    this.targetRPM = 1600;
    this.throttlePosition = 0; // 0.0 to 1.0
    this.scrollVelocity = 0;   // In KM/H
    
    // Audio Nodes
    this.masterGain = null;
    this.crankOsc = null;
    this.harmonicOsc = null;
    this.subBassOsc = null;
    this.exhaustFilter = null;
    this.intakeFilter = null;
    this.intakeNoise = null;
    this.intakeGain = null;
    this.crackleGain = null;
    this.distortionNode = null;
    this.compressor = null;

    this.lastActiveTime = 0;
    this.animLoop = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Volume
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // Distortion Node
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.makeDistortionCurve(18);
      this.distortionNode.oversample = '2x';

      // 1. Primary Crankshaft Single-Cylinder Pulse
      this.crankOsc = this.ctx.createOscillator();
      this.crankOsc.type = 'sawtooth';
      this.crankOsc.frequency.setValueAtTime(this.idleRPM / 60, this.ctx.currentTime);

      const crankGain = this.ctx.createGain();
      crankGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.crankOsc.connect(crankGain);

      // 2. Harmonic Resonance (Triangle/Square)
      this.harmonicOsc = this.ctx.createOscillator();
      this.harmonicOsc.type = 'triangle';
      this.harmonicOsc.frequency.setValueAtTime((this.idleRPM / 60) * 2, this.ctx.currentTime);

      const harmonicGain = this.ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.harmonicOsc.connect(harmonicGain);

      // 3. Sub-bass Piston Thump
      this.subBassOsc = this.ctx.createOscillator();
      this.subBassOsc.type = 'sine';
      this.subBassOsc.frequency.setValueAtTime(this.idleRPM / 60, this.ctx.currentTime);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.subBassOsc.connect(subGain);

      // 4. Exhaust Lowpass Resonant Filter
      this.exhaustFilter = this.ctx.createBiquadFilter();
      this.exhaustFilter.type = 'lowpass';
      this.exhaustFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.exhaustFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // 5. Airbox Induction Roar
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.intakeNoise = this.ctx.createBufferSource();
      this.intakeNoise.buffer = noiseBuffer;
      this.intakeNoise.loop = true;

      this.intakeFilter = this.ctx.createBiquadFilter();
      this.intakeFilter.type = 'bandpass';
      this.intakeFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.intakeFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      this.intakeGain = this.ctx.createGain();
      this.intakeGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

      this.intakeNoise.connect(this.intakeFilter);
      this.intakeFilter.connect(this.intakeGain);

      // Crackle Node
      this.crackleGain = this.ctx.createGain();
      this.crackleGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.intakeFilter.connect(this.crackleGain);

      // Routing
      crankGain.connect(this.exhaustFilter);
      harmonicGain.connect(this.exhaustFilter);
      subGain.connect(this.exhaustFilter);
      this.intakeGain.connect(this.exhaustFilter);
      this.crackleGain.connect(this.masterGain);

      this.exhaustFilter.connect(this.distortionNode);
      this.distortionNode.connect(this.masterGain);
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.crankOsc.start();
      this.harmonicOsc.start();
      this.subBassOsc.start();
      this.intakeNoise.start();

      this.startEngineLoop();
    } catch (e) {
      console.warn('Audio Context initialization error:', e);
    }
  }

  makeDistortionCurve(amount = 20) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  start() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isRunning = true;
    this.lastActiveTime = performance.now();
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0.32, now + 0.2);
  }

  stop() {
    if (!this.ctx) return;
    this.isRunning = false;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0.00001, now + 0.15);
  }

  toggle() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.isMuted && this.isRunning) {
      // User wants Sound OFF
      this.isMuted = true;
      this.stop();
      return false;
    } else {
      // User wants Sound ON
      this.isMuted = false;
      this.start();
      return true;
    }
  }

  setThrottle(isHolding) {
    if (this.isMuted) return;
    this.isThrottleHeld = isHolding;
    if (isHolding) {
      if (!this.isRunning) this.start();
      this.lastActiveTime = performance.now();
    }
  }

  setScrollVelocity(speedKMH) {
    if (this.isMuted) return;
    this.scrollVelocity = Math.max(0, Math.min(240, speedKMH));
    if (this.scrollVelocity > 15) {
      this.lastActiveTime = performance.now();
      if (!this.isRunning) {
        this.start();
      }
    }
  }

  playThrottleSound(targetRPM = 8000) {
    if (this.isMuted) return;
    this.start();
    this.targetRPM = targetRPM;
    this.isThrottleHeld = true;
    setTimeout(() => {
      this.isThrottleHeld = false;
    }, 850);
  }

  startEngineLoop() {
    const update = () => {
      if (this.ctx && this.isRunning && !this.isMuted) {
        const now = performance.now();
        const timeDelta = Math.max(1, now - this.lastActiveTime);

        // 1. Calculate Target RPM
        if (this.isThrottleHeld) {
          this.throttlePosition += (1.0 - this.throttlePosition) * 0.18;
          this.targetRPM = this.idleRPM + this.throttlePosition * (this.maxRPM - this.idleRPM);

          if (this.currentRPM > 9900) {
            if (Math.random() > 0.45) {
              this.currentRPM -= (280 + Math.random() * 320);
              if (this.crackleGain) {
                this.crackleGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                this.crackleGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
              }
            }
          }
        } else if (this.scrollVelocity > 5) {
          this.throttlePosition = Math.min(1.0, this.scrollVelocity / 160);
          this.targetRPM = this.idleRPM + (this.scrollVelocity / 220) * (this.maxRPM - this.idleRPM);
        } else {
          this.throttlePosition += (0 - this.throttlePosition) * 0.1;
          this.targetRPM = this.idleRPM;
        }

        const lerpFactor = this.targetRPM > this.currentRPM ? 0.14 : 0.06;
        this.currentRPM += (this.targetRPM - this.currentRPM) * lerpFactor;

        // Auto-silence when idle
        if (!this.isThrottleHeld && this.scrollVelocity < 3 && timeDelta > 4500) {
          this.stop();
        }

        // 2. Synthesize Physical Frequencies
        const audioTime = this.ctx.currentTime;
        const firingFreq = Math.max(12, this.currentRPM / 60);

        if (this.crankOsc) {
          this.crankOsc.frequency.setTargetAtTime(firingFreq, audioTime, 0.03);
        }
        if (this.harmonicOsc) {
          this.harmonicOsc.frequency.setTargetAtTime(firingFreq * 2, audioTime, 0.03);
        }
        if (this.subBassOsc) {
          this.subBassOsc.frequency.setTargetAtTime(Math.max(15, firingFreq * 0.5), audioTime, 0.04);
        }

        // 3. Dynamic Filter modulation
        const filterCutoff = 280 + (this.currentRPM / this.maxRPM) * 2400 + (this.throttlePosition * 600);
        if (this.exhaustFilter) {
          this.exhaustFilter.frequency.setTargetAtTime(filterCutoff, audioTime, 0.03);
        }

        // 4. Airbox Induction
        if (this.intakeGain) {
          const intakeVolume = 0.02 + this.throttlePosition * 0.18;
          this.intakeGain.gain.setTargetAtTime(intakeVolume, audioTime, 0.04);
        }
        if (this.intakeFilter) {
          const intakeCutoff = 350 + (this.currentRPM / this.maxRPM) * 1200;
          this.intakeFilter.frequency.setTargetAtTime(intakeCutoff, audioTime, 0.03);
        }

        // 5. Volume
        if (this.masterGain && this.isRunning && !this.isMuted) {
          const dynamicGain = 0.28 + (this.currentRPM / this.maxRPM) * 0.26;
          this.masterGain.gain.setTargetAtTime(dynamicGain, audioTime, 0.05);
        }
      }

      this.animLoop = requestAnimationFrame(update);
    };

    update();
  }
}

// Global Singleton Instance
window.ktmSound = new KTMEngineSound();
window.KTMSynth = window.ktmSound;
