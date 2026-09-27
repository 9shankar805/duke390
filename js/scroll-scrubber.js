/**
 * KTM Duke 390 - 4K Scroll-Scrubbed Exploded Animation Engine
 * Preloads image sequence and binds canvas frame rendering to page scroll & interactive scrubber
 */

class KTMScrollScrubber {
  constructor(canvasId, frameCount = 100, frameDir = 'assets/frames', framePrefix = 'frame_') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.frameCount = frameCount;
    this.frameDir = frameDir;
    this.framePrefix = framePrefix;
    
    this.images = [];
    this.loadedImages = 0;
    this.currentFrame = 1;
    this.targetFrame = 1;
    this.isPlaying = false;
    this.playDirection = 1;
    this.animId = null;

    this.progressBar = document.getElementById('scrubber-progress');
    this.slider = document.getElementById('scrub-slider');
    this.frameDisplay = document.getElementById('scrub-frame-val');
    this.playBtn = document.getElementById('scrub-play-btn');

    this.init();
  }

  init() {
    this.preloadImages();
    this.setupResize();
    this.setupScrollBinding();
    this.setupControls();
  }

  preloadImages() {
    const pad = (num, size) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };

    for (let i = 1; i <= this.frameCount; i++) {
      const img = new Image();
      const fileName = `${this.frameDir}/${this.framePrefix}${pad(i, 4)}.jpg`;
      img.src = fileName;
      img.onload = () => {
        this.loadedImages++;
        if (this.loadedImages === 1) {
          this.renderFrame(1);
        }
      };
      this.images.push(img);
    }
  }

  setupResize() {
    const resize = () => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      this.canvas.width = rect.width * (window.devicePixelRatio || 1);
      this.canvas.height = rect.height * (window.devicePixelRatio || 1);
      this.renderFrame(this.currentFrame);
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 100);
  }

  renderFrame(frameIndex) {
    if (!this.ctx || this.images.length === 0) return;
    
    const index = Math.max(0, Math.min(this.frameCount - 1, Math.round(frameIndex) - 1));
    const img = this.images[index];

    if (img && img.complete && img.naturalWidth !== 0) {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      // Aspect contain
      const hRatio = cw / iw;
      const vRatio = ch / ih;
      const ratio = Math.min(hRatio, vRatio);
      
      const centerShiftX = (cw - iw * ratio) / 2;
      const centerShiftY = (ch - ih * ratio) / 2;

      this.ctx.clearRect(0, 0, cw, ch);
      this.ctx.drawImage(img, 0, 0, iw, ih, centerShiftX, centerShiftY, iw * ratio, ih * ratio);

      this.currentFrame = index + 1;
      
      if (this.slider && document.activeElement !== this.slider) {
        this.slider.value = this.currentFrame;
      }
      if (this.frameDisplay) {
        this.frameDisplay.innerText = `${padZero(this.currentFrame, 3)} / ${this.frameCount}`;
      }
      if (this.progressBar) {
        const pct = ((this.currentFrame - 1) / (this.frameCount - 1)) * 100;
        this.progressBar.style.width = `${pct}%`;
      }
    }
  }

  setupScrollBinding() {
    const container = document.getElementById('scrub-section-trigger') || document.getElementById('engineering');
    if (!container) return;

    window.addEventListener('scroll', () => {
      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress when section is in view
      const start = rect.top - windowHeight * 0.2;
      const totalDist = rect.height + windowHeight * 0.4;
      let progress = -start / totalDist;
      progress = Math.max(0, Math.min(1, progress));

      const target = Math.floor(progress * (this.frameCount - 1)) + 1;
      this.renderFrame(target);
    });
  }

  setupControls() {
    if (this.slider) {
      this.slider.addEventListener('input', (e) => {
        this.renderFrame(+e.target.value);
      });
    }

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        this.playBtn.innerHTML = this.isPlaying 
          ? '<i data-lucide="pause" class="w-3.5 h-3.5"></i><span>PAUSE</span>' 
          : '<i data-lucide="play" class="w-3.5 h-3.5"></i><span>AUTO-PLAY</span>';
        if (window.lucide) window.lucide.createIcons();

        if (this.isPlaying) {
          this.startLoop();
        } else {
          cancelAnimationFrame(this.animId);
        }
      });
    }
  }

  startLoop() {
    const loop = () => {
      if (!this.isPlaying) return;

      let next = this.currentFrame + this.playDirection;
      if (next >= this.frameCount) {
        next = this.frameCount;
        this.playDirection = -1;
      } else if (next <= 1) {
        next = 1;
        this.playDirection = 1;
      }

      this.renderFrame(next);
      setTimeout(() => {
        this.animId = requestAnimationFrame(loop);
      }, 35);
    };

    loop();
  }
}

function padZero(num, size) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

window.KTMScrollScrubber = KTMScrollScrubber;
