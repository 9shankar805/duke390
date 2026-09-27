/**
 * KTM Duke 390 - Luxury Horizon Runway & Anatomy Controller
 * High-performance horizontal glide physics and scroll-driven anatomy animations
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined') {
    return;
  }

  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ==========================================================================
     01. LUXURY FACTORY BOTTOM SCROLL RUNWAY (ATLANTIC BLUE DUKE)
     ========================================================================== */
  const cruiserBike = document.getElementById('global-cruiser-bike');
  const speedValEl = document.getElementById('global-speed-val');
  const gearValEl = document.getElementById('global-gear-val');
  const trackFillEl = document.getElementById('global-track-fill');
  const exhaustFlameEl = document.getElementById('cruiser-exhaust-flame');
  const brakeLightEl = document.getElementById('cruiser-brake-light');
  const groundGlowEl = document.getElementById('cruiser-ground-glow');

  let lastScrollY = window.scrollY || window.pageYOffset;
  let lastTimestamp = performance.now();
  let currentSpeed = 0;
  let targetSpeed = 0;
  let scrollDirection = 0;

  function updateLuxuryRunwayPhysics(now) {
    const dt = Math.max(1, now - lastTimestamp);
    lastTimestamp = now;

    const currentScrollY = window.scrollY || window.pageYOffset;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollPercent = Math.min(1, Math.max(0, currentScrollY / maxScroll));

    // Calculate instantaneous velocity (KM/H)
    const rawDelta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    if (Math.abs(rawDelta) > 0.4) {
      scrollDirection = rawDelta > 0 ? 1 : -1;
      const rawVelocity = (Math.abs(rawDelta) / dt) * 1000;
      targetSpeed = Math.min(238, Math.round(rawVelocity * 0.22));
    } else {
      targetSpeed = Math.max(0, targetSpeed * 0.86);
      if (targetSpeed < 1) targetSpeed = 0;
    }

    currentSpeed += (targetSpeed - currentSpeed) * 0.24;
    const displaySpeed = Math.round(currentSpeed);

    // Update Speed & Gear Badge
    if (speedValEl) speedValEl.innerText = displaySpeed;
    if (gearValEl) {
      if (displaySpeed === 0) gearValEl.innerText = 'N';
      else if (displaySpeed < 45) gearValEl.innerText = '1ST';
      else if (displaySpeed < 85) gearValEl.innerText = '2ND';
      else if (displaySpeed < 125) gearValEl.innerText = '3RD';
      else if (displaySpeed < 165) gearValEl.innerText = '4TH';
      else if (displaySpeed < 205) gearValEl.innerText = '5TH';
      else gearValEl.innerText = '6TH';
    }

    // Move Bike along track smoothly (between 4% and 96% of container width)
    if (cruiserBike) {
      const bikePos = 4 + scrollPercent * 92;
      cruiserBike.style.left = `${bikePos}%`;
      cruiserBike.style.transform = `translate(-50%, 0)`;

      // Dynamic acceleration flame & braking light
      if (displaySpeed > 25) {
        if (scrollDirection > 0) {
          if (exhaustFlameEl) exhaustFlameEl.style.opacity = '1';
          if (brakeLightEl) brakeLightEl.style.opacity = '0';
        } else {
          if (brakeLightEl) brakeLightEl.style.opacity = '1';
          if (exhaustFlameEl) exhaustFlameEl.style.opacity = '0';
        }
      } else {
        if (exhaustFlameEl) exhaustFlameEl.style.opacity = '0';
        if (brakeLightEl) brakeLightEl.style.opacity = '0';
      }
    }

    // Update laser progress energy bar
    if (trackFillEl) {
      trackFillEl.style.width = `${scrollPercent * 100}%`;
    }

    if (groundGlowEl) {
      groundGlowEl.style.opacity = `${0.3 + Math.min(0.7, displaySpeed / 120)}`;
    }

    requestAnimationFrame(updateLuxuryRunwayPhysics);
  }

  requestAnimationFrame(updateLuxuryRunwayPhysics);

  /* ==========================================================================
     02. RUNWAY GRAVITY FALL STAGE (Background-Removed Atlantic Blue Drop)
     ========================================================================== */
  const fallingBike = document.getElementById('hero-falling-bike');
  const arena = document.getElementById('scroll-fall-arena');
  const hudSpeed = document.getElementById('fall-hud-speed');
  const hudAlt = document.getElementById('fall-hud-alt');
  const triggerFallBtn = document.getElementById('trigger-fall-btn');
  const trails = document.querySelectorAll('.speed-trail');

  if (fallingBike && arena && typeof ScrollTrigger !== 'undefined') {
    
    // Parallax 3D mouse tilt inside the stage
    arena.addEventListener('mousemove', (e) => {
      const rect = arena.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);

      gsap.to(fallingBike, {
        rotationY: x * 14,
        rotationX: -y * 10,
        transformPerspective: 800,
        ease: 'power1.out',
        duration: 0.3
      });
    });

    arena.addEventListener('mouseleave', () => {
      gsap.to(fallingBike, {
        rotationY: 0,
        rotationX: 0,
        ease: 'power2.out',
        duration: 0.5
      });
    });

    // GSAP ScrollTrigger timeline for Runway Drop
    gsap.timeline({
      scrollTrigger: {
        trigger: '#scroll-fall-arena',
        start: 'top 75%',
        end: 'bottom 25%',
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          const speed = Math.round(progress * 168);
          const alt = Math.round((1 - progress) * 100);
          
          if (hudSpeed) hudSpeed.innerText = `${speed} KM/H`;
          if (hudAlt) hudAlt.innerText = `ALT: ${alt}%`;

          if (trails.length > 0) {
            if (progress > 0.15 && progress < 0.85) {
              gsap.to(trails, { opacity: 0.8, duration: 0.1 });
            } else {
              gsap.to(trails, { opacity: 0, duration: 0.2 });
            }
          }
        }
      }
    })
    .to(fallingBike, {
      y: 220,
      rotationZ: -8,
      scale: 1.12,
      ease: 'power1.inOut'
    })
    .to(fallingBike, {
      rotationZ: 0,
      scale: 1.0,
      ease: 'power1.out'
    });
  }

  /* ==========================================================================
     03. MANUAL "PLAY GRAVITY DROP" SIMULATION TRIGGER
     ========================================================================== */
  if (triggerFallBtn && fallingBike) {
    let isDropping = false;

    triggerFallBtn.addEventListener('click', () => {
      if (isDropping) return;
      isDropping = true;

      if (window.KTMSynth && typeof window.KTMSynth.playThrottleSound === 'function') {
        window.KTMSynth.playThrottleSound(8000);
      }

      triggerFallBtn.classList.add('opacity-50', 'pointer-events-none');

      const dropTl = gsap.timeline({
        onComplete: () => {
          isDropping = false;
          triggerFallBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
      });

      dropTl.to(fallingBike, {
        y: -25,
        scale: 0.96,
        duration: 0.25,
        ease: 'power2.out'
      })
      .to(fallingBike, {
        y: 240,
        rotationZ: -12,
        scale: 1.18,
        duration: 0.75,
        ease: 'power3.in',
        onStart: () => {
          if (trails.length) gsap.to(trails, { opacity: 1, duration: 0.2 });
        }
      })
      .to(fallingBike, {
        y: 190,
        rotationZ: 0,
        scale: 1.05,
        duration: 0.4,
        ease: 'bounce.out',
        onComplete: () => {
          if (trails.length) gsap.to(trails, { opacity: 0, duration: 0.3 });
          
          const cards = document.querySelectorAll('.component-row-card');
          if (cards.length) {
            gsap.fromTo(cards, 
              { scale: 0.95, borderColor: '#0077FF' },
              { scale: 1.0, borderColor: 'rgba(255,255,255,0.1)', stagger: 0.08, duration: 0.5, ease: 'back.out(2)' }
            );
          }
        }
      })
      .to(fallingBike, {
        y: 0,
        scale: 1.0,
        duration: 0.7,
        delay: 0.3,
        ease: 'power2.inOut'
      });
    });
  }

  /* ==========================================================================
     04. EXPLODED HORIZONTAL ROW ANIMATION & INTERACTIVE HUD
     ========================================================================== */
  const componentCards = document.querySelectorAll('.component-row-card');

  if (componentCards.length > 0) {
    // Reveal cards with smooth stagger
    if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
      gsap.fromTo(componentCards, 
        { y: 50, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#engineering-row-section',
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    }

    const selectComponentCard = (card) => {
      componentCards.forEach(c => {
        gsap.to(c, {
          y: 0,
          scale: 1.0,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      gsap.to(card, {
        y: -8,
        scale: 1.03,
        borderColor: '#FF6600',
        boxShadow: '0 18px 40px rgba(255, 102, 0, 0.35)',
        duration: 0.25,
        ease: 'power2.out'
      });

      const title = card.getAttribute('data-title');
      const desc = card.getAttribute('data-desc');
      const spec1 = card.getAttribute('data-spec1');
      const spec2 = card.getAttribute('data-spec2');

      const activeTitleEl = document.getElementById('row-detail-title');
      const activeDescEl = document.getElementById('row-detail-desc');
      const activeSpec1El = document.getElementById('row-detail-spec1');
      const activeSpec2El = document.getElementById('row-detail-spec2');

      if (activeTitleEl && title) activeTitleEl.innerText = title;
      if (activeDescEl && desc) activeDescEl.innerText = desc;
      if (activeSpec1El && spec1) activeSpec1El.innerText = spec1;
      if (activeSpec2El && spec2) activeSpec2El.innerText = spec2;
    };

    componentCards.forEach((card) => {
      card.addEventListener('mouseenter', () => selectComponentCard(card));
      card.addEventListener('click', () => selectComponentCard(card));
      card.addEventListener('touchstart', () => selectComponentCard(card), { passive: true });
    });
  }
});
