/**
 * KTM Duke 390 - High-Fidelity Procedural LC4c Engine Audio Synthesizer
 * Simulates authentic 399cc Single-Cylinder 4-Stroke Exhaust, Rev Limiter,
 * Throttle-Hold Revving, and Scroll-Velocity Sound Modulation.
 */

class KTMEngineSound {
  constructor() {
    this.ctx = null;
    this.isRunning = false;
    this.isThrottleHeld = false;
    
    // RPM Dynamics
    this.idleRPM = 1600;
    this.maxRPM = 10500;
    this.currentRPM = 1600;
    this.targetRPM = 1600;
    this.throttlePosition = 0; // 0.0 (closed) to 1.0 (WOT)
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

    this.lastActiveTime = 0;
    this.isMuted = false;
    this.hasUserInteracted = false;
    
    this.animLoop = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Volume & Dynamic Limiter
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // Distortion / Exhaust Rasp Node
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.makeDistortionCurve(18);
      this.distortionNode.oversample = '2x';

      // 1. Primary Crankshaft Single-Cylinder Pulse (Sawtooth)
      this.crankOsc = this.ctx.createOscillator();
      this.crankOsc.type = 'sawtooth';
      this.crankOsc.frequency.setValueAtTime(this.idleRPM / 60, this.ctx.currentTime);

      const crankGain = this.ctx.createGain();
      crankGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.crankOsc.connect(crankGain);

      // 2. Harmonic Resonance (Square wave filtered for KTM signature mechanical bark)
      this.harmonicOsc = this.ctx.createOscillator();
      this.harmonicOsc.type = 'triangle';
      this.harmonicOsc.frequency.setValueAtTime((this.idleRPM / 60) * 2, this.ctx.currentTime);

      const harmonicGain = this.ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.harmonicOsc.connect(harmonicGain);

      // 3. Sub-bass Piston Thump (Sine wave for low-end punch)
      this.subBassOsc = this.ctx.createOscillator();
      this.subBassOsc.type = 'sine';
      this.subBassOsc.frequency.setValueAtTime(this.idleRPM / 60, this.ctx.currentTime);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.subBassOsc.connect(subGain);

      // 4. Exhaust Canister Lowpass & Resonant Chamber
      this.exhaustFilter = this.ctx.createBiquadFilter();
      this.exhaustFilter.type = 'lowpass';
      this.exhaustFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.exhaustFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // 5. Airbox Induction Roar (Bandpass Noise)
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

      // Decel Overrun Crackle Node
      this.crackleGain = this.ctx.createGain();
      this.crackleGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.intakeFilter.connect(this.crackleGain);

      // Node Graph Routing:
      // Oscillators -> Exhaust Filter -> Distortion -> Master Gain -> Compressor -> Destination
      crankGain.connect(this.exhaustFilter);
      harmonicGain.connect(this.exhaustFilter);
      subGain.connect(this.exhaustFilter);
      this.intakeGain.connect(this.exhaustFilter);
      this.crackleGain.connect(this.masterGain);

      this.exhaustFilter.connect(this.distortionNode);
      this.distortionNode.connect(this.masterGain);
      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      this.crankOsc.start();
      this.harmonicOsc.start();
      this.subBassOsc.start();
      this.intakeNoise.start();

      this.startEngineLoop();
    } catch (e) {
      console.warn('Web Audio API initialized on user interaction:', e);
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
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isRunning = true;
    this.lastActiveTime = performance.now();
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0.32, now + 0.3);
  }

  stop() {
    if (!this.ctx || !this.isRunning) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
    setTimeout(() => {
      this.isRunning = false;
    }, 550);
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

  // Called when user holds the throttle down
  setThrottle(isHolding) {
    this.isThrottleHeld = isHolding;
    if (isHolding) {
      if (!this.isRunning) this.start();
      this.lastActiveTime = performance.now();
    }
  }

  // Called in real-time when scrolling / sliding at speed
  setScrollVelocity(speedKMH) {
    this.scrollVelocity = Math.max(0, Math.min(240, speedKMH));
    if (this.scrollVelocity > 15) {
      this.lastActiveTime = performance.now();
      if (!this.isRunning) {
        this.start();
      }
    }
  }

  // Standalone one-shot throttle punch
  playThrottleSound(targetRPM = 8000) {
    this.start();
    this.targetRPM = targetRPM;
    this.isThrottleHeld = true;
    setTimeout(() => {
      this.isThrottleHeld = false;
    }, 850);
  }

  startEngineLoop() {
    const update = () => {
      if (this.ctx && this.isRunning) {
        const now = performance.now();
        const timeDelta = Math.max(1, now - this.lastActiveTime);

        // 1. Calculate Target RPM from Throttle Hold & Slide Velocity
        if (this.isThrottleHeld) {
          // Rapid climb to rev limiter
          this.throttlePosition += (1.0 - this.throttlePosition) * 0.18;
          this.targetRPM = this.idleRPM + this.throttlePosition * (this.maxRPM - this.idleRPM);

          // Authentic Bouncing Rev-Limiter (>10,000 RPM)
          if (this.currentRPM > 9900) {
            if (Math.random() > 0.45) {
              // Ignition cut drop
              this.currentRPM -= (280 + Math.random() * 320);
              // Rev limiter crackle pop
              if (this.crackleGain) {
                this.crackleGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                this.crackleGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
              }
            }
          }
        } else if (this.scrollVelocity > 5) {
          // Dynamic RPM scaling from slide velocity (5 KM/H to 220 KM/H)
          this.throttlePosition = Math.min(1.0, this.scrollVelocity / 160);
          this.targetRPM = this.idleRPM + (this.scrollVelocity / 220) * (this.maxRPM - this.idleRPM);
        } else {
          // Closed throttle - deceleration burble back to idle
          this.throttlePosition += (0 - this.throttlePosition) * 0.1;
          this.targetRPM = this.idleRPM;
        }

        // Smooth physical RPM Lerp (Faster rev-up, realistic inertia drop)
        const lerpFactor = this.targetRPM > this.currentRPM ? 0.14 : 0.06;
        this.currentRPM += (this.targetRPM - this.currentRPM) * lerpFactor;

        // Auto-fade to quiet sleep if stationary and no throttle for > 4.5s
        if (!this.isThrottleHeld && this.scrollVelocity < 3 && timeDelta > 4500) {
          this.stop();
        }

        // 2. Synthesize Physical Cylinder Frequencies (4-stroke single = RPM / 60)
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

        // 3. Dynamic Exhaust & Airbox Filter modulation
        // As RPM & throttle open, filter moves from 280Hz (muffled idle) to 2800Hz (screaming open pipe)
        const filterCutoff = 280 + (this.currentRPM / this.maxRPM) * 2400 + (this.throttlePosition * 600);
        if (this.exhaustFilter) {
          this.exhaustFilter.frequency.setTargetAtTime(filterCutoff, audioTime, 0.03);
        }

        // 4. Airbox Induction Hiss & Roar under heavy load
        if (this.intakeGain) {
          const intakeVolume = 0.02 + this.throttlePosition * 0.18;
          this.intakeGain.gain.setTargetAtTime(intakeVolume, audioTime, 0.04);
        }
        if (this.intakeFilter) {
          const intakeCutoff = 350 + (this.currentRPM / this.maxRPM) * 1200;
          this.intakeFilter.frequency.setTargetAtTime(intakeCutoff, audioTime, 0.03);
        }

        // 5. Volume scale with power output
        if (this.masterGain && this.isRunning) {
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
