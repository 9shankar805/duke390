/**
 * KTM Duke 390 - Flagship 3D Exploded Engine & Scroll Scrub Controller
 * Features seamless background dark blending, mobile touch responsiveness, and sub-pixel lerping
 */

class KTMHero3DPlayer {
  constructor(canvasId, frameCount = 100, frameDir = 'assets/frames', framePrefix = 'frame_') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.frameCount = frameCount;
    this.frameDir = frameDir;
    this.framePrefix = framePrefix;

    this.images = [];
    this.loadedCount = 0;
    this.currentFrame = 1;
    this.targetFrame = 1;
    this.scrollProgress = 0;
    
    // Snappy responsiveness (0.26 lerp)
    this.lerpSpeed = 0.26;
    this.currentScale = 1.0;
    this.targetScale = 1.0;
    
    this.isDragging = false;
    this.startX = 0;
    this.startFrame = 1;
    this.isAutoPlaying = false;
    this.autoPlayDirection = 1;

    // UI Badges & Overlays
    this.frameBadge = document.getElementById('hero-frame-counter');
    this.statusBadge = document.getElementById('hero-3d-status');
    this.togglePlayBtn = document.getElementById('hero-toggle-play-btn');
    this.explodeBtn = document.getElementById('hero-explode-toggle-btn');
    this.resetBtn = document.getElementById('hero-reset-view-btn');

    // Floating Interactive Engineering Annotations
    this.calloutLeft1 = document.getElementById('hero-callout-1');
    this.calloutLeft2 = document.getElementById('hero-callout-2');
    this.calloutRight1 = document.getElementById('hero-callout-3');
    this.calloutRight2 = document.getElementById('hero-callout-4');

    this.init();
  }

  init() {
    this.preloadFrames();
    this.setupResize();
    this.setupStickyScrollTrigger();
    this.setupTouchAndMouse();
    this.startRenderLoop();
  }

  preloadFrames() {
    const pad = (num, size) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };

    for (let i = 1; i <= this.frameCount; i++) {
      const img = new Image();
      img.src = `${this.frameDir}/${this.framePrefix}${pad(i, 4)}.jpg`;
      img.onload = () => {
        this.loadedCount++;
        if (this.loadedCount === 1) {
          this.render(1, 1.0);
        }
      };
      this.images.push(img);
    }
  }

  setupResize() {
    const resize = () => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.render(this.currentFrame, this.currentScale);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    setTimeout(resize, 40);
  }

  render(frameIndex, scale = 1.0) {
    if (!this.ctx || this.images.length === 0) return;

    const idx = Math.max(0, Math.min(this.frameCount - 1, Math.round(frameIndex) - 1));
    const img = this.images[idx];

    if (img && img.complete && img.naturalWidth !== 0) {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      // Base Ratio with Dynamic Zoom Scaling
      const hRatio = cw / iw;
      const vRatio = ch / ih;
      const baseRatio = Math.min(hRatio, vRatio);
      const ratio = baseRatio * scale * 1.06;

      const shiftX = (cw - iw * ratio) / 2;
      const shiftY = (ch - ih * ratio) / 2;

      this.ctx.clearRect(0, 0, cw, ch);

      // 1. Draw High-Res Frame
      this.ctx.drawImage(img, 0, 0, iw, ih, shiftX, shiftY, iw * ratio, ih * ratio);

      // 2. Seamless Dark Studio Vignette Overlay
      const gradient = this.ctx.createRadialGradient(
        cw / 2, ch / 2, Math.min(cw, ch) * 0.25,
        cw / 2, ch / 2, Math.max(cw, ch) * 0.55
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.55, 'rgba(8, 8, 10, 0.45)');
      gradient.addColorStop(0.85, 'rgba(8, 8, 10, 0.95)');
      gradient.addColorStop(1, '#08080a');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, cw, ch);

      // 3. Orange Horizon Glow at Pedestal Base
      const glowGrad = this.ctx.createRadialGradient(
        cw / 2, ch * 0.85, 10,
        cw / 2, ch * 0.85, cw * 0.45
      );
      glowGrad.addColorStop(0, 'rgba(255, 102, 0, 0.18)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = glowGrad;
      this.ctx.fillRect(0, ch * 0.6, cw, ch * 0.4);

      this.currentFrame = idx + 1;

      if (this.frameBadge) {
        const pad3 = (n) => (n < 10 ? '00' : n < 100 ? '0' : '') + n;
        this.frameBadge.innerText = `FRAME: ${pad3(this.currentFrame)} / ${this.frameCount}`;
      }
    }
  }

  setupStickyScrollTrigger() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = Math.max(400, hero.offsetHeight * 0.42);

      let progress = scrollY / heroHeight;
      progress = Math.max(0, Math.min(1, progress));
      this.scrollProgress = progress;

      if (!this.isDragging && !this.isAutoPlaying) {
        this.targetFrame = Math.round(progress * (this.frameCount - 1)) + 1;
        this.targetScale = 1.0 + Math.sin(progress * Math.PI) * 0.25;
      }

      this.updateCallouts(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  updateCallouts(progress) {
    if (this.statusBadge) {
      if (progress > 0.85) {
        this.statusBadge.innerText = 'REASSEMBLED';
        this.statusBadge.classList.add('text-green-400');
        this.statusBadge.classList.remove('text-orange-400');
      } else if (progress > 0.15) {
        this.statusBadge.innerText = 'EXPLODED VIEW';
        this.statusBadge.classList.add('text-orange-400');
        this.statusBadge.classList.remove('text-green-400');
      } else {
        this.statusBadge.innerText = 'READY TO RACE';
        this.statusBadge.classList.add('text-orange-400');
      }
    }

    const toggleCallout = (el, active) => {
      if (!el) return;
      if (active) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) scale(1)';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px) scale(0.95)';
        el.style.pointerEvents = 'none';
      }
    };

    toggleCallout(this.calloutLeft1, progress > 0.18 && progress < 0.82);
    toggleCallout(this.calloutLeft2, progress > 0.30 && progress < 0.82);
    toggleCallout(this.calloutRight1, progress > 0.24 && progress < 0.82);
    toggleCallout(this.calloutRight2, progress > 0.36 && progress < 0.82);
  }

  setupTouchAndMouse() {
    const el = this.canvas.parentElement;
    if (!el) return;

    const onStart = (clientX) => {
      this.isDragging = true;
      this.isAutoPlaying = false;
      this.startX = clientX;
      this.startFrame = this.currentFrame;
      if (this.togglePlayBtn) {
        this.togglePlayBtn.innerHTML = '<i data-lucide="play" class="w-3.5 h-3.5"></i><span>PLAY</span>';
        if (window.lucide) window.lucide.createIcons();
      }
    };

    const onMove = (clientX) => {
      if (!this.isDragging) return;
      const deltaX = clientX - this.startX;
      const sensitivity = 0.28;
      let newFrame = this.startFrame + (deltaX * sensitivity);

      if (newFrame > this.frameCount) newFrame = ((newFrame - 1) % this.frameCount) + 1;
      if (newFrame < 1) newFrame = this.frameCount + ((newFrame - 1) % this.frameCount);

      this.targetFrame = newFrame;
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    el.addEventListener('mousedown', (e) => onStart(e.clientX));
    window.addEventListener('mousemove', (e) => onMove(e.clientX));
    window.addEventListener('mouseup', onEnd);

    el.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) onStart(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) onMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', onEnd);

    if (this.togglePlayBtn) {
      this.togglePlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.isAutoPlaying = !this.isAutoPlaying;
        this.togglePlayBtn.innerHTML = this.isAutoPlaying
          ? '<i data-lucide="pause" class="w-3.5 h-3.5"></i><span>PAUSE</span>'
          : '<i data-lucide="play" class="w-3.5 h-3.5"></i><span>PLAY</span>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    if (this.explodeBtn) {
      let isExploded = false;
      this.explodeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isExploded = !isExploded;
        this.isAutoPlaying = false;
        this.targetFrame = isExploded ? this.frameCount : 1;
        this.targetScale = isExploded ? 1.25 : 1.0;
        this.explodeBtn.classList.toggle('bg-ktm-orange', isExploded);
        this.explodeBtn.classList.toggle('text-black', isExploded);
        this.explodeBtn.innerHTML = isExploded
          ? '<i data-lucide="minimize-2" class="w-3.5 h-3.5"></i><span>ASSEMBLE</span>'
          : '<i data-lucide="split" class="w-3.5 h-3.5"></i><span>EXPLODE</span>';
        if (window.lucide) window.lucide.createIcons();
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.targetFrame = 1;
        this.targetScale = 1.0;
        this.isAutoPlaying = false;
        if (this.togglePlayBtn) {
          this.togglePlayBtn.innerHTML = '<i data-lucide="play" class="w-3.5 h-3.5"></i><span>PLAY</span>';
          if (window.lucide) window.lucide.createIcons();
        }
      });
    }
  }

  startRenderLoop() {
    const loop = () => {
      if (this.isAutoPlaying) {
        let next = this.currentFrame + (0.75 * this.autoPlayDirection);
        if (next >= this.frameCount) {
          next = this.frameCount;
          this.autoPlayDirection = -1;
        } else if (next <= 1) {
          next = 1;
          this.autoPlayDirection = 1;
        }
        this.targetFrame = next;
      }

      const frameDiff = this.targetFrame - this.currentFrame;
      if (Math.abs(frameDiff) > 0.02) {
        this.currentFrame += frameDiff * this.lerpSpeed;
      }

      const scaleDiff = this.targetScale - this.currentScale;
      if (Math.abs(scaleDiff) > 0.001) {
        this.currentScale += scaleDiff * this.lerpSpeed;
      }

      this.render(this.currentFrame, this.currentScale);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.KTMHero3DPlayer = KTMHero3DPlayer;
