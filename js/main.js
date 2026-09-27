/**
 * KTM Duke 390 - Interactive Experience Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize Hero Photorealistic 3D / Exploded Frame-Scrub Player
  let heroPlayerInstance = null;
  if (window.KTMHero3DPlayer && document.getElementById('hero-interactive-canvas')) {
    heroPlayerInstance = new KTMHero3DPlayer('hero-interactive-canvas', 100, 'assets/frames', 'frame_');
    window.ktmHeroPlayer = heroPlayerInstance;
  }

  // Initialize 100-Frame Scroll-Scrubbed Exploded Canvas
  let scrubberInstance = null;
  if (window.KTMScrollScrubber && document.getElementById('exploded-scrub-canvas')) {
    scrubberInstance = new KTMScrollScrubber('exploded-scrub-canvas', 100, 'assets/frames', 'frame_');
    window.ktmScrubber = scrubberInstance;
  }

  // 3D Explode Button Toggle
  const toggle3dExplodeBtn = document.getElementById('toggle-3d-explode-btn');
  const explodeBtnText = document.getElementById('explode-btn-text');
  let is3dExploded = false;

  if (toggle3dExplodeBtn && ktm3dInstance) {
    toggle3dExplodeBtn.addEventListener('click', () => {
      is3dExploded = !is3dExploded;
      ktm3dInstance.setCameraView(is3dExploded ? 'engineering' : 'hero');
      if (explodeBtnText) {
        explodeBtnText.innerText = is3dExploded ? 'ASSEMBLE 3D' : 'EXPLODE 3D PARTS';
      }
      toggle3dExplodeBtn.classList.toggle('bg-ktm-orange', is3dExploded);
      toggle3dExplodeBtn.classList.toggle('text-black', is3dExploded);
    });
  }

  // 3D Rotate Toggle
  const toggle3dRotateBtn = document.getElementById('toggle-3d-rotate-btn');
  const rotateBtnText = document.getElementById('rotate-btn-text');
  if (toggle3dRotateBtn && ktm3dInstance && ktm3dInstance.controls) {
    toggle3dRotateBtn.addEventListener('click', () => {
      ktm3dInstance.controls.autoRotate = !ktm3dInstance.controls.autoRotate;
      if (rotateBtnText) {
        rotateBtnText.innerText = ktm3dInstance.controls.autoRotate ? '360° ROTATE: ON' : '360° ROTATE: OFF';
      }
    });
  }

  // 3D Reset Camera View
  const reset3dCameraBtn = document.getElementById('reset-3d-camera-btn');
  if (reset3dCameraBtn && ktm3dInstance) {
    reset3dCameraBtn.addEventListener('click', () => {
      ktm3dInstance.setCameraView('hero');
    });
  }

  // 3D Camera Presets
  const camPresetBtns = document.querySelectorAll('.cam-preset-btn');
  const canvasViewBadge = document.getElementById('canvas-view-badge');

  camPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      camPresetBtns.forEach(b => {
        b.classList.remove('active', 'border-orange-500/40', 'text-orange-400');
        b.classList.add('border-white/10', 'text-zinc-400');
      });
      btn.classList.add('active', 'border-orange-500/40', 'text-orange-400');
      btn.classList.remove('border-white/10', 'text-zinc-400');

      if (ktm3dInstance) {
        ktm3dInstance.setCameraView(preset);
      }

      if (canvasViewBadge) {
        canvasViewBadge.innerText = `PERSPECTIVE: ${preset.toUpperCase()}`;
      }
    });
  });
  const cursorGlow = document.getElementById('cursor-glow');
  if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top = `${e.clientY}px`;
      cursorGlow.style.opacity = '0.6';
    });

    document.addEventListener('mouseleave', () => {
      cursorGlow.style.opacity = '0';
    });
  }

  /* ==========================================================================
     02. HERO 3D TILT EFFECT & PARALLAX
     ========================================================================== */
  const heroCard = document.getElementById('hero-bike-card');
  const heroSection = document.getElementById('hero');

  if (heroCard && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const tiltX = (y / (rect.height / 2)) * -10;
      const tiltY = (x / (rect.width / 2)) * 10;

      heroCard.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    heroSection.addEventListener('mouseleave', () => {
      heroCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  }

  // GIF Switcher toggle
  const toggleGifBtn = document.getElementById('toggle-gif-source');
  const heroGifImg = document.getElementById('hero-gif-img');
  const gifSources = [
    'assets/duke-explode-loop.gif',
    'assets/ezgif.com-gif-maker.gif',
    'assets/Motorcycle_disassembles_in_studio_1080p_20260928040603-ezgif.com-video-to-gif-converter.gif'
  ];
  let currentGifIndex = 0;

  if (toggleGifBtn && heroGifImg) {
    toggleGifBtn.addEventListener('click', () => {
      currentGifIndex = (currentGifIndex + 1) % gifSources.length;
      heroGifImg.style.opacity = '0.2';
      setTimeout(() => {
        heroGifImg.src = gifSources[currentGifIndex];
        heroGifImg.style.opacity = '1';
      }, 200);
    });
  }

  /* ==========================================================================
     03. ANIMATED NUMBER COUNTERS (INTERSECTION OBSERVER)
     ========================================================================== */
  const counters = document.querySelectorAll('.counter');
  const speed = 60; // Counter duration tuning

  const animateCounter = (counter) => {
    const target = +counter.getAttribute('data-target');
    const decimals = +(counter.getAttribute('data-decimals') || 0);
    let count = 0;
    const increment = target / speed;

    const updateCount = () => {
      count += increment;
      if (count < target) {
        counter.innerText = decimals > 0 ? count.toFixed(decimals) : Math.ceil(count);
        requestAnimationFrame(updateCount);
      } else {
        counter.innerText = decimals > 0 ? target.toFixed(decimals) : target;
      }
    };

    updateCount();
  };

  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  /* ==========================================================================
     04. SPECS CATEGORY TABS
     ========================================================================== */
  const tabButtons = document.querySelectorAll('.spec-tab-btn');
  const tabPanels = document.querySelectorAll('.spec-tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Update button styles
      tabButtons.forEach(b => {
        b.classList.remove('active', 'bg-ktm-orange', 'text-black');
        b.classList.add('bg-zinc-900', 'text-zinc-300', 'border-white/10');
      });

      btn.classList.add('active', 'bg-ktm-orange', 'text-black');
      btn.classList.remove('bg-zinc-900', 'text-zinc-300', 'border-white/10');

      // Show/Hide panels
      tabPanels.forEach(panel => {
        panel.classList.add('hidden');
      });

      const activePanel = document.getElementById(`tab-${targetTab}`);
      if (activePanel) {
        activePanel.classList.remove('hidden');
      }
    });
  });

  /* ==========================================================================
     05. ENGINEERING EXPLODED VIEW HOTSPOTS
     ========================================================================== */
  const engineeringParts = {
    frame: {
      number: '01 // SUB-SYSTEM',
      title: 'STEEL TRELLIS & FORGED ALUMINUM SUBFRAME',
      desc: 'The signature steel trellis frame provides legendary torsional rigidity with razor-sharp feedback on extreme lean angles. Paired with an all-new forged aluminum subframe to reduce tail weight.',
      mat: 'MATERIAL: 25CrMo4 STEEL',
      m1: '-1.8 KG',
      m2: '+18% RIGID'
    },
    engine: {
      number: '02 // POWERHOUSE',
      title: 'LC4c 399cc SINGLE-CYLINDER ENGINE',
      desc: 'Redesigned cylinder head, larger airbox, and forged piston delivering 45 PS power and 39 Nm torque with segment-first Launch Control and Quickshifter+ for clutchless up/down gearshifts.',
      mat: 'TYPE: DOHC 4-VALVE LIQUID COOLED',
      m1: '45 PS',
      m2: '39 NM @ 7k'
    },
    forks: {
      number: '03 // FRONT SUSPENSION',
      title: 'WP APEX 43mm INVERTED FORKS',
      desc: 'Open-cartridge front suspension with 5-click toolless compression and rebound adjustability on fork top caps. 150mm wheel travel for race-track precision and street damping.',
      mat: 'SPEC: WP APEX 43 OPEN CARTRIDGE',
      m1: '5-CLICK ADJ',
      m2: '150 MM TRAVEL'
    },
    brakes: {
      number: '04 // BRAKING SYSTEM',
      title: 'BYBRE RADIAL BRAKES & SUPERMOTO ABS',
      desc: 'Massive 320mm front disc with 4-piston radial caliper paired with Bosch 9.3 MP ABS. Includes Supermoto Mode to disable rear wheel ABS for backing into sharp hairpins.',
      mat: 'SYSTEM: BREMBO / BYBRE 320MM',
      m1: '320 MM ROTOR',
      m2: '4-PISTON RADIAL'
    },
    wheels: {
      number: '05 // ROTATIONAL MASS',
      title: 'BIONIC OPEN-HUB ALLOY WHEELS',
      desc: 'Lighter open-hub wheel design with fewer spokes to shed unsprung mass by 1.7kg, dramatically enhancing flickability and directional transition speeds.',
      mat: 'CONSTRUCTION: DIE-CAST LIGHT ALLOY',
      m1: '-1.7 KG MASS',
      m2: '17-INCH RADIAL'
    },
    exhaust: {
      number: '06 // MASS CENTRALIZATION',
      title: 'UNDERSLUNG STAINLESS STEEL EXHAUST',
      desc: 'Euro 5.2 compliant underslung silencer positioned at the lowest center of gravity point. Tuned resonator chamber generates an authoritative 4-stroke thumping bark.',
      mat: 'ALLOY: STAINLESS STEEL EURO 5.2',
      m1: 'OPTIMAL COG',
      m2: 'EURO 5.2'
    }
  };

  const hotspotPins = document.querySelectorAll('.hotspot-pin');
  const partQuickBtns = document.querySelectorAll('.part-quick-btn');
  const activePartCard = document.getElementById('engineering-active-card');
  const activePartNumber = document.getElementById('active-part-number');
  const activePartTitle = document.getElementById('active-part-title');
  const activePartDesc = document.getElementById('active-part-desc');
  const activePartMetric1 = document.getElementById('active-part-metric1');
  const activePartMetric2 = document.getElementById('active-part-metric2');

  const updateEngineeringPart = (partKey) => {
    const data = engineeringParts[partKey];
    if (!data) return;

    // Update pins
    hotspotPins.forEach(pin => {
      pin.classList.toggle('active', pin.getAttribute('data-part') === partKey);
    });

    // Update quick buttons
    partQuickBtns.forEach(btn => {
      const match = btn.getAttribute('data-part') === partKey;
      btn.classList.toggle('active', match);
      btn.classList.toggle('border-orange-500', match);
      btn.classList.toggle('bg-orange-500/20', match);
      btn.classList.toggle('text-white', match);
      if (!match) {
        btn.classList.add('border-white/10', 'bg-zinc-900', 'text-zinc-400');
      }
    });

    // Update 3D Camera view on hotspot click
    if (ktm3dInstance) {
      if (partKey === 'engine' || partKey === 'frame') {
        ktm3dInstance.setCameraView('specs', 1.2);
      } else if (partKey === 'forks' || partKey === 'brakes') {
        ktm3dInstance.setCameraView('hero', 1.2);
      } else if (partKey === 'exhaust') {
        ktm3dInstance.setCameraView('engineering', 1.2);
      }
    }

    // Update content with slick fade animation
    if (activePartCard) {
      activePartCard.style.opacity = '0.4';
      activePartCard.style.transform = 'translateY(6px)';

      setTimeout(() => {
        if (activePartNumber) activePartNumber.innerText = data.number;
        if (activePartTitle) activePartTitle.innerText = data.title;
        if (activePartDesc) activePartDesc.innerText = data.desc;
        if (activePartMetric1) activePartMetric1.innerText = data.m1;
        if (activePartMetric2) activePartMetric2.innerText = data.m2;

        activePartCard.style.opacity = '1';
        activePartCard.style.transform = 'translateY(0)';
      }, 150);
    }
  };

  hotspotPins.forEach(pin => {
    pin.addEventListener('click', () => {
      updateEngineeringPart(pin.getAttribute('data-part'));
    });
    pin.addEventListener('mouseenter', () => {
      updateEngineeringPart(pin.getAttribute('data-part'));
    });
  });

  partQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      updateEngineeringPart(btn.getAttribute('data-part'));
    });
  });

  /* ==========================================================================
     06. COLORWAY / LIVERY CONFIGURATOR
     ========================================================================== */
  const colorwayBtns = document.querySelectorAll('.colorway-btn');
  const colorwayBikeImg = document.getElementById('colorway-bike-img');
  const colorwayNameText = document.getElementById('colorway-name-text');
  const colorwayDescText = document.getElementById('colorway-desc-text');
  const colorwayAmbientGlow = document.getElementById('colorway-ambient-glow');
  const colorwayPillDot = document.getElementById('colorway-pill-dot');

  colorwayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorwayBtns.forEach(b => {
        b.classList.remove('active', 'border-2', 'border-ktm-orange', 'border-blue-400');
        b.classList.add('border-white/20');
      });

      btn.classList.add('active', 'border-2');
      const hex = btn.getAttribute('data-hex');
      btn.style.borderColor = hex;

      const imgPath = btn.getAttribute('data-img');
      const name = btn.getAttribute('data-name');
      const desc = btn.getAttribute('data-desc');

      // Morph image
      if (colorwayBikeImg) {
        colorwayBikeImg.style.opacity = '0.3';
        colorwayBikeImg.style.transform = 'scale(0.96)';

        setTimeout(() => {
          colorwayBikeImg.src = imgPath;
          colorwayBikeImg.alt = `KTM 390 Duke ${name}`;
          colorwayBikeImg.style.opacity = '1';
          colorwayBikeImg.style.transform = 'scale(1)';
        }, 200);
      }

      // Update 3D Model Colorway
      if (ktm3dInstance) {
        const colorKey = btn.getAttribute('data-color');
        ktm3dInstance.setColorway(colorKey);
      }

      if (colorwayNameText) colorwayNameText.innerText = name;
      if (colorwayDescText) colorwayDescText.innerText = desc;
      if (colorwayPillDot) {
        colorwayPillDot.style.backgroundColor = hex;
        colorwayPillDot.style.boxShadow = `0 0 12px ${hex}`;
      }
      if (colorwayAmbientGlow) {
        colorwayAmbientGlow.style.backgroundColor = hex;
      }
    });
  });

  /* ==========================================================================
     07. INTERACTIVE TFT COCKPIT & THROTTLE REV SIMULATOR
     ========================================================================== */
  const throttleBtn = document.getElementById('cockpit-throttle-btn');
  const heroRevBtn = document.getElementById('hero-rev-btn');
  const soundToggleBtn = document.getElementById('engine-sound-toggle');
  const soundBtnText = document.getElementById('sound-btn-text');

  const tftSpeedDisplay = document.getElementById('tft-speed-display');
  const tftGearDisplay = document.getElementById('tft-gear-display');
  const tftRpmNumber = document.getElementById('tft-rpm-number');
  const tftRpmBar = document.getElementById('tft-rpm-bar');
  const tftShiftLight = document.getElementById('tft-shift-light');
  const tftModeBadge = document.getElementById('tft-mode-badge');
  const cockpitModeBtns = document.querySelectorAll('.cockpit-mode-btn');

  let isRevving = false;
  let currentSimRPM = 1400;
  let currentSimSpeed = 0;
  let cockpitAnimFrame = null;

  // Audio Toggle
  if (soundToggleBtn && window.ktmSound) {
    soundToggleBtn.addEventListener('click', () => {
      const active = window.ktmSound.toggle();
      soundToggleBtn.classList.toggle('sound-active', active);
      if (soundBtnText) {
        soundBtnText.innerText = active ? 'ENGINE SOUND: ON (LC4c)' : 'ENGINE SOUND: OFF';
      }
    });
  }

  const startRevving = () => {
    if (isRevving) return;
    isRevving = true;
    if (ktm3dInstance) {
      ktm3dInstance.setThrottle(true);
    }
    if (window.ktmSound) {
      window.ktmSound.setThrottle(true);
      if (soundToggleBtn) soundToggleBtn.classList.add('sound-active');
      if (soundBtnText) soundBtnText.innerText = 'ENGINE SOUND: ON (LC4c)';
    }
  };

  const stopRevving = () => {
    isRevving = false;
    if (ktm3dInstance) {
      ktm3dInstance.setThrottle(false);
    }
    if (window.ktmSound) {
      window.ktmSound.setThrottle(false);
    }
  };

  // Throttle button events
  if (throttleBtn) {
    throttleBtn.addEventListener('mousedown', startRevving);
    throttleBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRevving(); });
    window.addEventListener('mouseup', stopRevving);
    window.addEventListener('touchend', stopRevving);
  }

  // Hero Rev button events
  if (heroRevBtn) {
    heroRevBtn.addEventListener('mousedown', startRevving);
    heroRevBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRevving(); });
  }

  // Spacebar revving listener
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      startRevving();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      stopRevving();
    }
  });

  // TFT Gauge Animation Loop
  const updateCockpitGauges = () => {
    if (isRevving) {
      currentSimRPM += (9950 - currentSimRPM) * 0.12;
      currentSimSpeed += (168 - currentSimSpeed) * 0.08;
      
      // Rev limiter stutter
      if (currentSimRPM > 9600) {
        currentSimRPM = 9600 + (Math.random() * 400 - 200);
      }
    } else {
      currentSimRPM += (1400 - currentSimRPM) * 0.06;
      currentSimSpeed += (0 - currentSimSpeed) * 0.05;
    }

    // Display RPM
    const formattedRpm = Math.round(currentSimRPM).toLocaleString();
    if (tftRpmNumber) tftRpmNumber.innerText = `${formattedRpm} RPM`;

    // RPM Bar Percentage (0 to 10000 RPM)
    const rpmPercent = Math.min(100, Math.max(5, (currentSimRPM / 10000) * 100));
    if (tftRpmBar) {
      tftRpmBar.style.width = `${rpmPercent}%`;
    }

    // Speed & Gear
    const roundedSpeed = Math.round(currentSimSpeed);
    if (tftSpeedDisplay) tftSpeedDisplay.innerText = roundedSpeed;

    if (tftGearDisplay) {
      if (roundedSpeed === 0) {
        tftGearDisplay.innerText = 'N';
        tftGearDisplay.style.color = '#00FF88';
      } else if (roundedSpeed < 35) {
        tftGearDisplay.innerText = '1';
        tftGearDisplay.style.color = '#FFFFFF';
      } else if (roundedSpeed < 70) {
        tftGearDisplay.innerText = '2';
        tftGearDisplay.style.color = '#FFFFFF';
      } else if (roundedSpeed < 105) {
        tftGearDisplay.innerText = '3';
        tftGearDisplay.style.color = '#FFFFFF';
      } else if (roundedSpeed < 135) {
        tftGearDisplay.innerText = '4';
        tftGearDisplay.style.color = '#FFFFFF';
      } else if (roundedSpeed < 155) {
        tftGearDisplay.innerText = '5';
        tftGearDisplay.style.color = '#FFFFFF';
      } else {
        tftGearDisplay.innerText = '6';
        tftGearDisplay.style.color = '#FF6600';
      }
    }

    // Shift Light Alert
    if (tftShiftLight) {
      if (currentSimRPM > 8800) {
        tftShiftLight.classList.add('shift-light-flashing');
        tftShiftLight.innerText = 'SHIFT NOW! // REDLINE';
      } else {
        tftShiftLight.classList.remove('shift-light-flashing');
        tftShiftLight.innerText = 'SHIFT LIGHT: READY';
      }
    }

    cockpitAnimFrame = requestAnimationFrame(updateCockpitGauges);
  };

  cockpitAnimFrame = requestAnimationFrame(updateCockpitGauges);

  // Cockpit Ride Modes
  cockpitModeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      cockpitModeBtns.forEach(b => {
        b.classList.remove('active', 'bg-ktm-orange', 'text-black', 'border-ktm-orange');
        b.classList.add('bg-zinc-900', 'text-zinc-300', 'border-white/10');
      });

      btn.classList.add('active', 'bg-ktm-orange', 'text-black', 'border-ktm-orange');
      btn.classList.remove('bg-zinc-900', 'text-zinc-300', 'border-white/10');

      const mode = btn.getAttribute('data-mode').toUpperCase();
      if (tftModeBadge) {
        tftModeBadge.innerText = `${mode} MODE`;
      }
    });
  });

  /* ==========================================================================
     08. TEST RIDE BOOKING MODAL
     ========================================================================== */
  const modal = document.getElementById('test-ride-modal');
  const openModalTriggers = document.querySelectorAll('.book-test-ride-trigger, #book-test-ride-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const testRideForm = document.getElementById('test-ride-form');
  const bookingSuccess = document.getElementById('booking-success');
  const dismissSuccessBtn = document.getElementById('dismiss-success-btn');

  const openModal = () => {
    if (!modal) return;
    modal.classList.remove('opacity-0', 'pointer-events-none');
    const inner = modal.querySelector('.max-w-xl');
    if (inner) inner.classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    const inner = modal.querySelector('.max-w-xl');
    if (inner) inner.classList.add('scale-95');
    document.body.style.overflow = '';
  };

  openModalTriggers.forEach(btn => btn.addEventListener('click', openModal));
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (testRideForm) {
    testRideForm.addEventListener('submit', (e) => {
      e.preventDefault();
      testRideForm.classList.add('hidden');
      if (bookingSuccess) bookingSuccess.classList.remove('hidden');
    });
  }

  if (dismissSuccessBtn) {
    dismissSuccessBtn.addEventListener('click', () => {
      closeModal();
      setTimeout(() => {
        if (testRideForm) testRideForm.classList.remove('hidden');
        if (bookingSuccess) bookingSuccess.classList.add('hidden');
        if (testRideForm) testRideForm.reset();
      }, 300);
    });
  }

  /* ==========================================================================
     09. GALLERY LIGHTBOX
     ========================================================================== */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeLightboxBtn = document.getElementById('close-lightbox-btn');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-lightbox');
      if (lightbox && lightboxImg && src) {
        lightboxImg.src = src;
        lightbox.classList.remove('opacity-0', 'pointer-events-none');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (closeLightboxBtn && lightbox) {
    closeLightboxBtn.addEventListener('click', () => {
      lightbox.classList.add('opacity-0', 'pointer-events-none');
      document.body.style.overflow = '';
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
      }
    });
  }

  /* ==========================================================================
     10. MOBILE MENU DRAWER
     ========================================================================== */
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  /* ==========================================================================
     11. HEADER SCROLL GLASS EFFECT
     ========================================================================== */
  const header = document.getElementById('main-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('bg-black/90', 'shadow-[0_4px_30px_rgba(0,0,0,0.8)]', 'border-orange-500/20');
      header.classList.remove('bg-black/75', 'border-white/5');
    } else {
      header.classList.add('bg-black/75', 'border-white/5');
      header.classList.remove('bg-black/90', 'shadow-[0_4px_30px_rgba(0,0,0,0.8)]', 'border-orange-500/20');
    }
  });
});
