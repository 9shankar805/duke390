/**
 * KTM Duke 390 - Interactive 3D WebGL Engine (Three.js)
 * High-performance 3D Motorcycle, Exploded CAD Animation, Real-time Materials & Camera Director
 */

class KTM3DExperience {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Bike Parts Group & Hierarchy
    this.bikeGroup = new THREE.Group();
    this.parts = {};
    this.explodedOffsets = {};
    this.isExploded = false;
    this.explodeFactor = 0; // 0 (assembled) to 1 (fully exploded)
    
    // 3D Particles & Visual FX
    this.particles = null;
    this.sparkParticles = null;
    this.headlightBeam = null;
    this.groundUnderglow = null;
    
    // Animation & State
    this.currentViewMode = 'hero';
    this.isRevving = false;
    this.wheelRotationSpeed = 0;
    this.currentColorway = 'orange';
    
    // Materials Dictionary for Live Swapping
    this.materials = {};

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x060608, 0.035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(4.2, 1.6, 4.8);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
      this.controls.minDistance = 2.5;
      this.controls.maxDistance = 12;
      this.controls.target.set(0, 0.85, 0);
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.6;
    }

    // 5. Build Scene Elements
    this.initMaterials();
    this.build3DMotorcycle();
    this.buildEnvironment();
    this.buildParticles();
    this.setupLighting();

    // 6. Listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.setupScrollSync();

    // 7. Start Render Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  initMaterials() {
    // KTM Signature Colors
    const ktmOrangeHex = 0xFF6600;
    const matteBlackHex = 0x121214;
    const darkSteelHex = 0x242528;
    const chromeHex = 0xDDDDDD;
    const goldForkHex = 0xD4AF37;
    const brakeDiscHex = 0x888890;

    // PBR Materials
    this.materials.trellis = new THREE.MeshStandardMaterial({
      color: ktmOrangeHex,
      roughness: 0.25,
      metalness: 0.45,
      emissive: 0x331100,
      emissiveIntensity: 0.2
    });

    this.materials.bodyOrange = new THREE.MeshStandardMaterial({
      color: ktmOrangeHex,
      roughness: 0.15,
      metalness: 0.35,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    });

    this.materials.bodyBlue = new THREE.MeshStandardMaterial({
      color: 0x0055FF,
      roughness: 0.15,
      metalness: 0.6,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08
    });

    this.materials.bodyTrack = new THREE.MeshStandardMaterial({
      color: 0x1A1A1D,
      roughness: 0.3,
      metalness: 0.8
    });

    this.materials.matteBlack = new THREE.MeshStandardMaterial({
      color: matteBlackHex,
      roughness: 0.7,
      metalness: 0.2
    });

    this.materials.engineBlock = new THREE.MeshStandardMaterial({
      color: darkSteelHex,
      roughness: 0.4,
      metalness: 0.8
    });

    this.materials.chrome = new THREE.MeshStandardMaterial({
      color: chromeHex,
      roughness: 0.1,
      metalness: 0.95
    });

    this.materials.wpGold = new THREE.MeshStandardMaterial({
      color: goldForkHex,
      roughness: 0.2,
      metalness: 0.85
    });

    this.materials.rubberTire = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.85,
      metalness: 0.05
    });

    this.materials.brakeDisc = new THREE.MeshStandardMaterial({
      color: brakeDiscHex,
      roughness: 0.3,
      metalness: 0.9
    });

    this.materials.rimTape = new THREE.MeshBasicMaterial({
      color: ktmOrangeHex
    });

    this.materials.headlightGlow = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF
    });

    this.materials.ledDrl = new THREE.MeshBasicMaterial({
      color: ktmOrangeHex
    });

    this.materials.exhaustGlow = new THREE.MeshStandardMaterial({
      color: 0x776655,
      roughness: 0.3,
      metalness: 0.85
    });
  }

  build3DMotorcycle() {
    this.bikeGroup.position.set(0, 0, 0);

    // ==========================================
    // 01. TRELLIS FRAME (Signature KTM Orange)
    // ==========================================
    const frameGroup = new THREE.Group();
    const tubeMat = this.materials.trellis;

    // Diagonal Trellis Truss Bars
    const createTube = (x1, y1, z1, x2, y2, z2, radius = 0.032) => {
      const v1 = new THREE.Vector3(x1, y1, z1);
      const v2 = new THREE.Vector3(x2, y2, z2);
      const dist = v1.distanceTo(v2);
      const geom = new THREE.CylinderGeometry(radius, radius, dist, 12);
      geom.translate(0, dist / 2, 0);
      geom.rotateX(Math.PI / 2);
      const mesh = new THREE.Mesh(geom, tubeMat);
      mesh.position.copy(v1);
      mesh.lookAt(v2);
      mesh.castShadow = true;
      return mesh;
    };

    // Main Cage
    frameGroup.add(createTube(-0.4, 0.7, 0.15, 0.4, 1.1, 0.12));
    frameGroup.add(createTube(-0.4, 0.7, -0.15, 0.4, 1.1, -0.12));
    frameGroup.add(createTube(-0.4, 0.7, 0.15, 0.0, 0.5, 0.18));
    frameGroup.add(createTube(-0.4, 0.7, -0.15, 0.0, 0.5, -0.18));
    frameGroup.add(createTube(0.0, 0.5, 0.18, 0.4, 1.1, 0.12));
    frameGroup.add(createTube(0.0, 0.5, -0.18, 0.4, 1.1, -0.12));
    frameGroup.add(createTube(0.4, 1.1, 0.12, 0.7, 1.25, 0.06));
    frameGroup.add(createTube(0.4, 1.1, -0.12, 0.7, 1.25, -0.06));

    // Cross Members
    frameGroup.add(createTube(-0.4, 0.7, -0.15, -0.4, 0.7, 0.15, 0.025));
    frameGroup.add(createTube(0.4, 1.1, -0.12, 0.4, 1.1, 0.12, 0.025));

    // Subframe (Die-cast Aluminum rear trellis)
    const subframeMat = this.materials.matteBlack;
    const subGeom = new THREE.BoxGeometry(0.7, 0.08, 0.22);
    const subMesh = new THREE.Mesh(subGeom, subframeMat);
    subMesh.position.set(-0.75, 0.98, 0);
    subMesh.rotation.z = 0.22;
    frameGroup.add(subMesh);

    this.parts.frame = frameGroup;
    this.explodedOffsets.frame = new THREE.Vector3(0, 0.8, 0);
    this.bikeGroup.add(frameGroup);

    // ==========================================
    // 02. ENGINE (LC4c 399cc Single-Cylinder)
    // ==========================================
    const engineGroup = new THREE.Group();
    
    // Crankcase
    const crankGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 16);
    crankGeom.rotateZ(Math.PI / 2);
    const crankMesh = new THREE.Mesh(crankGeom, this.materials.engineBlock);
    crankMesh.position.set(0.05, 0.52, 0);
    crankMesh.castShadow = true;
    engineGroup.add(crankMesh);

    // KTM Ignition Cover (Copper / Orange Accent)
    const coverGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
    coverGeom.rotateZ(Math.PI / 2);
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x994411, metalness: 0.7, roughness: 0.3 });
    const coverMesh = new THREE.Mesh(coverGeom, coverMat);
    coverMesh.position.set(0.05, 0.52, 0.18);
    engineGroup.add(coverMesh);

    // Cylinder & DOHC Head
    const cylGeom = new THREE.BoxGeometry(0.22, 0.32, 0.24);
    const cylMesh = new THREE.Mesh(cylGeom, this.materials.engineBlock);
    cylMesh.position.set(0.18, 0.72, 0);
    cylMesh.rotation.z = -0.3;
    cylMesh.castShadow = true;
    engineGroup.add(cylMesh);

    // Cooling Fins
    for (let i = 0; i < 4; i++) {
      const finGeom = new THREE.BoxGeometry(0.26, 0.015, 0.28);
      const finMesh = new THREE.Mesh(finGeom, this.materials.matteBlack);
      finMesh.position.set(0.18, 0.64 + i * 0.05, 0);
      finMesh.rotation.z = -0.3;
      engineGroup.add(finMesh);
    }

    // Curved Radiator with Fans
    const radGeom = new THREE.BoxGeometry(0.08, 0.36, 0.38);
    const radMesh = new THREE.Mesh(radGeom, this.materials.matteBlack);
    radMesh.position.set(0.52, 0.78, 0);
    radMesh.rotation.z = -0.15;
    engineGroup.add(radMesh);

    this.parts.engine = engineGroup;
    this.explodedOffsets.engine = new THREE.Vector3(0, -0.6, 0);
    this.bikeGroup.add(engineGroup);

    // ==========================================
    // 03. FUEL TANK & AGGRESSIVE BODYWORK
    // ==========================================
    const tankGroup = new THREE.Group();

    // Sculpted Steel Fuel Tank
    const tankGeom = new THREE.BoxGeometry(0.65, 0.36, 0.36);
    const tankMesh = new THREE.Mesh(tankGeom, this.materials.bodyOrange);
    tankMesh.position.set(0.22, 1.22, 0);
    tankMesh.rotation.z = -0.22;
    tankMesh.castShadow = true;
    tankGroup.add(tankMesh);

    // Sharp Angular Tank Spoilers / Shrouds (Duke Signature Wings)
    const shroudGeom = new THREE.ConeGeometry(0.28, 0.68, 4);
    shroudGeom.rotateZ(Math.PI / 2 + 0.3);
    const shroudLeft = new THREE.Mesh(shroudGeom, this.materials.bodyOrange);
    shroudLeft.position.set(0.48, 1.08, 0.22);
    shroudLeft.scale.set(0.8, 0.5, 0.4);
    tankGroup.add(shroudLeft);

    const shroudRight = shroudLeft.clone();
    shroudRight.position.z = -0.22;
    tankGroup.add(shroudRight);

    // Fuel Cap
    const capGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
    const capMesh = new THREE.Mesh(capGeom, this.materials.matteBlack);
    capMesh.position.set(0.24, 1.4, 0);
    tankGroup.add(capMesh);

    // Racing Seat (Rider & Pillion with Orange Stitching)
    const seatGeom = new THREE.BoxGeometry(0.55, 0.08, 0.24);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1E1E22, roughness: 0.9 });
    const seatMesh = new THREE.Mesh(seatGeom, seatMat);
    seatMesh.position.set(-0.35, 1.05, 0);
    seatMesh.rotation.z = 0.18;
    tankGroup.add(seatMesh);

    const pillionGeom = new THREE.BoxGeometry(0.32, 0.06, 0.16);
    const pillionMesh = new THREE.Mesh(pillionGeom, this.materials.bodyOrange);
    pillionMesh.position.set(-0.75, 1.18, 0);
    pillionMesh.rotation.z = 0.28;
    tankGroup.add(pillionMesh);

    this.parts.tank = tankGroup;
    this.explodedOffsets.tank = new THREE.Vector3(0, 0.9, 0);
    this.bikeGroup.add(tankGroup);

    // ==========================================
    // 04. FRONT SUSPENSION & COCKPIT (WP APEX 43)
    // ==========================================
    const frontForkGroup = new THREE.Group();

    // Inverted 43mm Gold/Orange WP Fork Stanchions
    const createForkLeg = (zOffset) => {
      const leg = new THREE.Group();
      // Outer Upper Tube (WP Inverted)
      const outerGeom = new THREE.CylinderGeometry(0.042, 0.042, 0.52, 16);
      const outerMesh = new THREE.Mesh(outerGeom, this.materials.wpGold);
      outerMesh.position.set(0, 0.22, 0);
      leg.add(outerMesh);

      // Inner Chrome Slider
      const innerGeom = new THREE.CylinderGeometry(0.032, 0.032, 0.48, 16);
      const innerMesh = new THREE.Mesh(innerGeom, this.materials.chrome);
      innerMesh.position.set(0, -0.22, 0);
      leg.add(innerMesh);

      // Lower Axle Lug
      const lugGeom = new THREE.BoxGeometry(0.08, 0.1, 0.06);
      const lugMesh = new THREE.Mesh(lugGeom, this.materials.matteBlack);
      lugMesh.position.set(0, -0.44, 0);
      leg.add(lugMesh);

      leg.position.set(1.0, 0.88, zOffset);
      leg.rotation.z = -0.42; // Rake angle ~ 24 degrees
      return leg;
    };

    frontForkGroup.add(createForkLeg(0.12));
    frontForkGroup.add(createForkLeg(-0.12));

    // Triple Clamps
    const clampGeom = new THREE.BoxGeometry(0.12, 0.04, 0.32);
    const clampUpper = new THREE.Mesh(clampGeom, this.materials.matteBlack);
    clampUpper.position.set(0.92, 1.25, 0);
    clampUpper.rotation.z = -0.42;
    frontForkGroup.add(clampUpper);

    // Handlebars
    const barGeom = new THREE.CylinderGeometry(0.016, 0.016, 0.72, 12);
    barGeom.rotateX(Math.PI / 2);
    const barMesh = new THREE.Mesh(barGeom, this.materials.matteBlack);
    barMesh.position.set(0.85, 1.34, 0);
    frontForkGroup.add(barMesh);

    // TFT Display Unit
    const tftUnitGeom = new THREE.BoxGeometry(0.14, 0.09, 0.04);
    const tftUnitMesh = new THREE.Mesh(tftUnitGeom, this.materials.matteBlack);
    tftUnitMesh.position.set(0.96, 1.32, 0);
    tftUnitMesh.rotation.x = -0.4;
    frontForkGroup.add(tftUnitMesh);

    // Predatory Split LED Headlamp
    const headlampGroup = new THREE.Group();
    const lampGeom = new THREE.ConeGeometry(0.16, 0.28, 4);
    lampGeom.rotateZ(-Math.PI / 2);
    const lampMesh = new THREE.Mesh(lampGeom, this.materials.matteBlack);
    lampMesh.position.set(1.22, 1.15, 0);
    headlampGroup.add(lampMesh);

    // LED Glow Elements
    const ledGeom = new THREE.BoxGeometry(0.04, 0.16, 0.08);
    const ledMesh = new THREE.Mesh(ledGeom, this.materials.headlightGlow);
    ledMesh.position.set(1.32, 1.15, 0);
    headlampGroup.add(ledMesh);

    frontForkGroup.add(headlampGroup);

    this.parts.forks = frontForkGroup;
    this.explodedOffsets.forks = new THREE.Vector3(0.8, 0.4, 0);
    this.bikeGroup.add(frontForkGroup);

    // ==========================================
    // 05. FRONT WHEEL & BYBRE BRAKES (17" Radial)
    // ==========================================
    const frontWheelGroup = new THREE.Group();
    frontWheelGroup.position.set(1.24, 0.48, 0);

    // Tire
    const frontTireGeom = new THREE.TorusGeometry(0.48, 0.08, 16, 32);
    const frontTireMesh = new THREE.Mesh(frontTireGeom, this.materials.rubberTire);
    frontTireMesh.castShadow = true;
    frontWheelGroup.add(frontTireMesh);

    // Bionic 5-Spoke Lightweight Wheel Rim
    const rimGeom = new THREE.TorusGeometry(0.42, 0.02, 16, 32);
    const rimMesh = new THREE.Mesh(rimGeom, this.materials.matteBlack);
    frontWheelGroup.add(rimMesh);

    // Orange Rim Tape Accent
    const rimTapeGeom = new THREE.TorusGeometry(0.415, 0.008, 12, 32);
    const rimTapeMesh = new THREE.Mesh(rimTapeGeom, this.materials.rimTape);
    frontWheelGroup.add(rimTapeMesh);

    // Spokes
    for (let i = 0; i < 5; i++) {
      const spokeGeom = new THREE.CylinderGeometry(0.015, 0.012, 0.42, 8);
      const angle = (i * Math.PI * 2) / 5;
      spokeGeom.rotateZ(angle);
      const spokeMesh = new THREE.Mesh(spokeGeom, this.materials.matteBlack);
      frontWheelGroup.add(spokeMesh);
    }

    // 320mm Perforated Brake Disc
    const discGeom = new THREE.RingGeometry(0.2, 0.36, 32);
    const discMesh = new THREE.Mesh(discGeom, this.materials.brakeDisc);
    discMesh.position.z = 0.08;
    frontWheelGroup.add(discMesh);

    // 4-Piston Radial ByBre Brake Caliper
    const caliperGeom = new THREE.BoxGeometry(0.12, 0.16, 0.07);
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });
    const caliperMesh = new THREE.Mesh(caliperGeom, caliperMat);
    caliperMesh.position.set(0.15, 0.22, 0.09);
    frontWheelGroup.add(caliperMesh);

    this.parts.frontWheel = frontWheelGroup;
    this.explodedOffsets.frontWheel = new THREE.Vector3(1.2, 0, 0);
    this.bikeGroup.add(frontWheelGroup);

    // ==========================================
    // 06. REAR WHEEL & SWINGARM & SUSPENSION
    // ==========================================
    const rearAssemblyGroup = new THREE.Group();

    // Curved Gravity Die-Cast Swingarm
    const armGeom = new THREE.BoxGeometry(0.85, 0.08, 0.06);
    const armLeft = new THREE.Mesh(armGeom, this.materials.matteBlack);
    armLeft.position.set(-0.7, 0.52, 0.14);
    armLeft.rotation.z = -0.15;
    armLeft.castShadow = true;
    rearAssemblyGroup.add(armLeft);

    const armRight = armLeft.clone();
    armRight.position.z = -0.14;
    rearAssemblyGroup.add(armRight);

    // WP APEX Off-Center Monoshock (Orange Spring)
    const shockGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.36, 16);
    const shockMesh = new THREE.Mesh(shockGeom, this.materials.trellis);
    shockMesh.position.set(-0.35, 0.76, 0.08);
    shockMesh.rotation.z = 0.52;
    rearAssemblyGroup.add(shockMesh);

    // Rear Wheel (Fatter 150-section tire)
    const rearWheelGroup = new THREE.Group();
    rearWheelGroup.position.set(-1.18, 0.48, 0);

    const rearTireGeom = new THREE.TorusGeometry(0.48, 0.11, 16, 32);
    const rearTireMesh = new THREE.Mesh(rearTireGeom, this.materials.rubberTire);
    rearTireMesh.castShadow = true;
    rearWheelGroup.add(rearTireMesh);

    const rearRimTape = new THREE.Mesh(rimTapeGeom, this.materials.rimTape);
    rearWheelGroup.add(rearRimTape);

    // Rear Spokes
    for (let i = 0; i < 5; i++) {
      const spokeGeom = new THREE.CylinderGeometry(0.016, 0.012, 0.42, 8);
      const angle = (i * Math.PI * 2) / 5;
      spokeGeom.rotateZ(angle);
      const spokeMesh = new THREE.Mesh(spokeGeom, this.materials.matteBlack);
      rearWheelGroup.add(spokeMesh);
    }

    // Rear Brake Disc & Sprocket Chain Drive
    const sprocketGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24);
    sprocketGeom.rotateX(Math.PI / 2);
    const sprocketMesh = new THREE.Mesh(sprocketGeom, this.materials.engineBlock);
    sprocketMesh.position.z = -0.09;
    rearWheelGroup.add(sprocketMesh);

    rearAssemblyGroup.add(rearWheelGroup);

    this.parts.rearAssembly = rearAssemblyGroup;
    this.parts.rearWheel = rearWheelGroup;
    this.explodedOffsets.rearAssembly = new THREE.Vector3(-1.2, 0, 0);
    this.bikeGroup.add(rearAssemblyGroup);

    // ==========================================
    // 07. UNDERSLUNG STAINLESS STEEL EXHAUST
    // ==========================================
    const exhaustGroup = new THREE.Group();

    // Header Pipe from Cylinder Head
    const pipeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.52, 12);
    const pipeMesh = new THREE.Mesh(pipeGeom, this.materials.exhaustGlow);
    pipeMesh.position.set(0.38, 0.48, 0.08);
    pipeMesh.rotation.z = 0.6;
    exhaustGroup.add(pipeMesh);

    // Underslung Chamber / Silencer Box
    const boxGeom = new THREE.BoxGeometry(0.42, 0.16, 0.22);
    const boxMesh = new THREE.Mesh(boxGeom, this.materials.matteBlack);
    boxMesh.position.set(-0.05, 0.28, 0);
    boxMesh.castShadow = true;
    exhaustGroup.add(boxMesh);

    // Exhaust Tip
    const tipGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16);
    tipGeom.rotateZ(Math.PI / 2 - 0.2);
    const tipMesh = new THREE.Mesh(tipGeom, this.materials.chrome);
    tipMesh.position.set(-0.24, 0.26, 0.12);
    exhaustGroup.add(tipMesh);

    this.parts.exhaust = exhaustGroup;
    this.explodedOffsets.exhaust = new THREE.Vector3(0, -0.8, 0.4);
    this.bikeGroup.add(exhaustGroup);

    // Add whole bike to the 3D scene
    this.scene.add(this.bikeGroup);
  }

  buildEnvironment() {
    // 1. Dark Reflective Pedestal Floor
    const floorGeom = new THREE.CircleGeometry(16, 64);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x08080A,
      roughness: 0.15,
      metalness: 0.75
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. Circular Glowing Neon Orange Podium Rings
    const ringGeom1 = new THREE.RingGeometry(2.8, 2.86, 64);
    ringGeom1.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xFF6600, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeom1, ringMat);
    ring1.position.y = 0.01;
    this.scene.add(ring1);

    const ringGeom2 = new THREE.RingGeometry(4.2, 4.24, 64);
    ringGeom2.rotateX(-Math.PI / 2);
    const ring2 = new THREE.Mesh(ringGeom2, ringMat);
    ring2.position.y = 0.01;
    this.scene.add(ring2);

    // 3. Ambient Orange Underglow Light Plane
    this.groundUnderglow = new THREE.PointLight(0xFF6600, 3.5, 6);
    this.groundUnderglow.position.set(0, 0.15, 0);
    this.scene.add(this.groundUnderglow);
  }

  buildParticles() {
    // Atmospheric Dust & Embers
    const count = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 5 + 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      scales[i] = Math.random() * 0.04 + 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.PointsMaterial({
      color: 0xFF7A00,
      size: 0.06,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setupLighting() {
    // Ambient Base
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    this.scene.add(ambientLight);

    // Main Studio Key Light
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.2);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // KTM Orange Rim Spotlight (gives edge glow)
    const rimLight = new THREE.SpotLight(0xFF6600, 5.0, 15, Math.PI / 4, 0.5, 1);
    rimLight.position.set(-6, 4, -4);
    rimLight.lookAt(0, 0.8, 0);
    this.scene.add(rimLight);

    // Front Predatory Headlight Glow
    const frontBeam = new THREE.SpotLight(0xFFFFFF, 4.0, 10, Math.PI / 6, 0.3, 1);
    frontBeam.position.set(1.4, 1.15, 0);
    frontBeam.target.position.set(5, 0, 0);
    this.scene.add(frontBeam);
    this.scene.add(frontBeam.target);
  }

  // Camera Director & Cinematic Section Choreography
  setCameraView(viewName, duration = 1.6) {
    this.currentViewMode = viewName;
    if (!window.gsap) return;

    let targetPos = { x: 4.2, y: 1.6, z: 4.8 };
    let lookTarget = { x: 0, y: 0.85, z: 0 };
    let targetExplode = 0;

    switch (viewName) {
      case 'hero':
        targetPos = { x: 4.2, y: 1.5, z: 4.8 };
        lookTarget = { x: 0, y: 0.85, z: 0 };
        targetExplode = 0;
        if (this.controls) this.controls.autoRotate = true;
        break;

      case 'specs':
        // Close-up on Engine & Trellis
        targetPos = { x: 1.8, y: 0.9, z: 1.9 };
        lookTarget = { x: 0.1, y: 0.65, z: 0 };
        targetExplode = 0;
        if (this.controls) this.controls.autoRotate = false;
        break;

      case 'engineering':
        // Exploded 3D Blueprint View
        targetPos = { x: 3.6, y: 2.2, z: 3.4 };
        lookTarget = { x: 0, y: 0.9, z: 0 };
        targetExplode = 1.0; // Explode parts apart
        if (this.controls) this.controls.autoRotate = false;
        break;

      case 'colorways':
        // Side Studio Profile
        targetPos = { x: 0.2, y: 1.2, z: 4.5 };
        lookTarget = { x: 0, y: 0.85, z: 0 };
        targetExplode = 0;
        if (this.controls) this.controls.autoRotate = false;
        break;

      case 'cockpit':
        // Handlebars / Rider POV View
        targetPos = { x: 0.1, y: 1.55, z: 0.0 };
        lookTarget = { x: 3.0, y: 1.1, z: 0.0 };
        targetExplode = 0;
        if (this.controls) this.controls.autoRotate = false;
        break;

      default:
        targetPos = { x: 4.0, y: 1.6, z: 4.0 };
        lookTarget = { x: 0, y: 0.85, z: 0 };
        targetExplode = 0;
    }

    // Smooth GSAP Tween
    window.gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: duration,
      ease: 'power3.inOut'
    });

    if (this.controls) {
      window.gsap.to(this.controls.target, {
        x: lookTarget.x,
        y: lookTarget.y,
        z: lookTarget.z,
        duration: duration,
        ease: 'power3.inOut'
      });
    }

    window.gsap.to(this, {
      explodeFactor: targetExplode,
      duration: duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.updateExplosion();
      }
    });
  }

  updateExplosion() {
    // Interpolate all sub-assemblies to exploded positions
    for (const [key, partGroup] of Object.entries(this.parts)) {
      const offset = this.explodedOffsets[key];
      if (offset && partGroup) {
        partGroup.position.set(
          offset.x * this.explodeFactor,
          offset.y * this.explodeFactor,
          offset.z * this.explodeFactor
        );
      }
    }
  }

  setColorway(colorKey) {
    this.currentColorway = colorKey;
    let mainMaterial = this.materials.bodyOrange;
    let rimTapeColor = 0xFF6600;
    let glowColor = 0xFF6600;

    if (colorKey === 'blue') {
      mainMaterial = this.materials.bodyBlue;
      rimTapeColor = 0x0077FF;
      glowColor = 0x0066FF;
    } else if (colorKey === 'track') {
      mainMaterial = this.materials.bodyTrack;
      rimTapeColor = 0xFF4400;
      glowColor = 0xFF3300;
    }

    // Apply to tank and shrouds
    if (this.parts.tank) {
      this.parts.tank.traverse((child) => {
        if (child.isMesh && (child.material === this.materials.bodyOrange || child.material === this.materials.bodyBlue || child.material === this.materials.bodyTrack)) {
          child.material = mainMaterial;
        }
      });
    }

    if (this.materials.rimTape) {
      this.materials.rimTape.color.setHex(rimTapeColor);
    }
    if (this.groundUnderglow) {
      this.groundUnderglow.color.setHex(glowColor);
    }
  }

  setThrottle(isRevving) {
    this.isRevving = isRevving;
  }

  setupScrollSync() {
    // Link section visibility to 3D Camera Angles
    const sections = ['hero', 'specs', 'engineering', 'colorways', 'cockpit', 'gallery'];
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          const id = entry.target.id;
          this.setCameraView(id);
        }
      });
    }, { threshold: [0.45] });

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Update OrbitControls
    if (this.controls) {
      this.controls.update();
    }

    // Wheel Rotation & Throttle Dynamics
    if (this.isRevving) {
      this.wheelRotationSpeed += (0.45 - this.wheelRotationSpeed) * 0.1;
      // Slight engine / bike vibration under revs
      this.bikeGroup.position.y = (Math.random() - 0.5) * 0.008;
      this.bikeGroup.position.x = (Math.random() - 0.5) * 0.004;
    } else {
      this.wheelRotationSpeed += (0 - this.wheelRotationSpeed) * 0.05;
      this.bikeGroup.position.y += (0 - this.bikeGroup.position.y) * 0.1;
      this.bikeGroup.position.x += (0 - this.bikeGroup.position.x) * 0.1;
    }

    if (this.parts.frontWheel && this.explodeFactor === 0) {
      this.parts.frontWheel.rotation.z -= this.wheelRotationSpeed;
    }
    if (this.parts.rearWheel && this.explodeFactor === 0) {
      this.parts.rearWheel.rotation.z -= this.wheelRotationSpeed;
    }

    // Ambient floating particles drift
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.004;
        if (positions[i + 1] > 5) {
          positions[i + 1] = 0.1;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Global 3D Manager Hook
window.KTM3DExperience = KTM3DExperience;
