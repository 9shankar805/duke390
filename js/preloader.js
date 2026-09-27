/**
 * KTM Duke 390 - High-Performance Asset Preloader & Cinematic System Orchestrator
 * Ensures 100% smooth frame delivery, zero layout shifts, and mobile & desktop optimization.
 */

class KTMRacePreloader {
  constructor() {
    this.preloaderEl = document.getElementById('ktm-preloader');
    this.progressValEl = document.getElementById('preloader-pct');
    this.progressBarEl = document.getElementById('preloader-progress-bar');
    this.statusTextEl = document.getElementById('preloader-status-text');
    this.tachoArcEl = document.getElementById('preloader-tacho-arc');
    this.revNeedleEl = document.getElementById('preloader-rev-needle');

    this.totalAssets = 0;
    this.loadedAssets = 0;
    this.displayProgress = 0;
    this.targetProgress = 0;
    this.isComplete = false;

    // Critical static images to preload
    this.criticalImages = [
      'assets/duke-390-blue-side-forward.png',
      'assets/ktm_duke_orange_isolated.png',
      'assets/ktm_engine_isolated.png',
      'assets/ktm_trellis_frame.jpg',
      'assets/ktm_wp_suspension.jpg',
      'assets/ktm_bybre_brakes.jpg',
      'assets/ktm_exhaust_system.jpg',
      'assets/ktm_duke_390_orange.jpg',
      'assets/ktm_duke_track.jpg',
      'assets/product-67bffb36283611.webp',
      'assets/pulsar_ns400z.webp'
    ];

    // Status messages based on progress milestones
    this.statusMessages = [
      { at: 0, msg: 'IGNITION SEQUENCE INITIALIZED...' },
      { at: 15, msg: 'CALIBRATING 399cc LC4c ENGINE CAD MESH...' },
      { at: 35, msg: 'BUFFERING 100-FRAME 3D DISASSEMBLY ARRAY...' },
      { at: 65, msg: 'TUNING WP APEX 43mm COMPRESSION VALVING...' },
      { at: 85, msg: 'SYNCING 5" TFT COCKPIT & LAUNCH CONTROL...' },
      { at: 98, msg: 'ENGAGING READY TO RACE TELEMETRY...' },
      { at: 100, msg: 'READY TO RACE // SYSTEM GO' }
    ];

    this.init();
  }

  init() {
    // Lock scroll during preloading
    document.documentElement.classList.add('preload-locked');
    document.body.classList.add('preload-locked');

    // Setup total count (Static images + 100 3D frames + Fonts)
    this.totalAssets = this.criticalImages.length + 100 + 1; // 1 for fonts
    
    // Start RAF ticker for buttery smooth number interpolation
    this.ticker = requestAnimationFrame(() => this.updateLoop());

    // Begin async asset prefetching
    this.preloadAllAssets();

    // Fallback safety timeout (ensure user is never blocked even on ultra slow network)
    setTimeout(() => {
      if (!this.isComplete) {
        this.targetProgress = 100;
      }
    }, 6500);
  }

  preloadAllAssets() {
    // 1. Preload Fonts
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        this.recordAssetLoaded();
      }).catch(() => {
        this.recordAssetLoaded();
      });
    } else {
      this.recordAssetLoaded();
    }

    // 2. Preload Static Images
    this.criticalImages.forEach(src => {
      const img = new Image();
      img.onload = () => this.recordAssetLoaded();
      img.onerror = () => this.recordAssetLoaded();
      img.src = src;
    });

    // 3. Preload 100 HD Exploded 3D Hero Frames
    const pad = (num, size) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };

    for (let i = 1; i <= 100; i++) {
      const img = new Image();
      img.onload = () => this.recordAssetLoaded();
      img.onerror = () => this.recordAssetLoaded();
      img.src = `assets/frames/frame_${pad(i, 4)}.jpg`;
    }
  }

  recordAssetLoaded() {
    this.loadedAssets++;
    this.targetProgress = Math.min(100, Math.round((this.loadedAssets / this.totalAssets) * 100));
  }

  updateLoop() {
    // Smooth Lerp towards targetProgress (faster when close to finish)
    const diff = this.targetProgress - this.displayProgress;
    if (diff > 0) {
      this.displayProgress += Math.max(0.5, diff * 0.14);
      if (this.displayProgress > 99.4 && this.targetProgress >= 100) {
        this.displayProgress = 100;
      }
    }

    const roundedPct = Math.min(100, Math.floor(this.displayProgress));

    // Update Percentage Text
    if (this.progressValEl) {
      this.progressValEl.innerText = `${roundedPct}`;
    }

    // Update Progress Bar Width
    if (this.progressBarEl) {
      this.progressBarEl.style.width = `${this.displayProgress}%`;
    }

    // Update Tachometer SVG Arc & Rev Needle (-120deg to +120deg)
    const strokeDash = 283 - (283 * (this.displayProgress / 100));
    if (this.tachoArcEl) {
      this.tachoArcEl.style.strokeDashoffset = strokeDash;
    }
    if (this.revNeedleEl) {
      const needleAngle = -120 + (this.displayProgress / 100) * 240;
      this.revNeedleEl.style.transform = `rotate(${needleAngle}deg)`;
    }

    // Update Dynamic Status Text
    if (this.statusTextEl) {
      for (let i = this.statusMessages.length - 1; i >= 0; i--) {
        if (roundedPct >= this.statusMessages[i].at) {
          this.statusTextEl.innerText = this.statusMessages[i].msg;
          break;
        }
      }
    }

    // Check completion
    if (this.displayProgress >= 100 && !this.isComplete) {
      this.isComplete = true;
      setTimeout(() => this.finishPreloader(), 350);
      return;
    }

    if (!this.isComplete) {
      this.ticker = requestAnimationFrame(() => this.updateLoop());
    }
  }

  finishPreloader() {
    cancelAnimationFrame(this.ticker);

    if (typeof gsap !== 'undefined' && this.preloaderEl) {
      const tl = gsap.timeline({
        onComplete: () => {
          if (this.preloaderEl) {
            this.preloaderEl.style.display = 'none';
          }
          // Unlock scroll
          document.documentElement.classList.remove('preload-locked');
          document.body.classList.remove('preload-locked');

          // Trigger smooth hero entrance animations
          this.triggerHeroEntrance();

          // Refresh all GSAP ScrollTriggers now that geometry is 100% computed
          if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh(true);
          }
        }
      });

      // Quick ignition orange flash & expansion
      tl.to('#preloader-tacho-wrap', {
        scale: 1.15,
        opacity: 1,
        duration: 0.25,
        ease: 'power2.out'
      })
      .to(this.preloaderEl, {
        opacity: 0,
        yPercent: -100,
        duration: 0.85,
        ease: 'power4.inOut'
      }, '+=0.1');

    } else {
      // Graceful fallback
      if (this.preloaderEl) {
        this.preloaderEl.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        this.preloaderEl.style.opacity = '0';
        this.preloaderEl.style.transform = 'translateY(-100%)';
        setTimeout(() => {
          this.preloaderEl.style.display = 'none';
          document.documentElement.classList.remove('preload-locked');
          document.body.classList.remove('preload-locked');
          this.triggerHeroEntrance();
        }, 600);
      }
    }
  }

  triggerHeroEntrance() {
    // Orchestrate smooth hero component reveals
    if (typeof gsap === 'undefined') return;

    gsap.fromTo('#hero h1', {
      opacity: 0,
      y: 40,
      skewY: 3
    }, {
      opacity: 1,
      y: 0,
      skewY: 0,
      duration: 1.0,
      ease: 'power3.out'
    });

    gsap.fromTo('#hero-interactive-canvas', {
      opacity: 0,
      scale: 0.94
    }, {
      opacity: 1,
      scale: 1.0,
      duration: 1.2,
      ease: 'power3.out',
      delay: 0.2
    });

    gsap.fromTo('.hero-spec-pill', {
      opacity: 0,
      y: 20
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'back.out(1.4)',
      delay: 0.4
    });

    gsap.fromTo('#global-scroll-rider', {
      opacity: 0,
      y: 50
    }, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.6
    });

    // Notify window that system is ready
    window.dispatchEvent(new CustomEvent('ktm:ready'));
  }
}

// Instantiate preloader immediately upon script execution
window.ktmPreloader = new KTMRacePreloader();
