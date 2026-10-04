// Three.js Isometric View Setup, Lighting, Environment & Kitchen Props
class GameScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    // Vibrant arcade sky: bright azure cyan
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.012);

    this.frustumD = 11;
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -this.frustumD * aspect, this.frustumD * aspect,
      this.frustumD, -this.frustumD,
      1, 150
    );
    this.cameraOffset = new THREE.Vector3(20, 26, 20);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);

    this.setupLighting();
    this.setupEnvironment();
    this.setupKitchen();
    this.setupParticles();

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Punchy, bright, sunny mobile lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambientLight);

    this.sun = new THREE.DirectionalLight(0xfffbeb, 1.15);
    this.sun.position.set(16, 32, 14);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.width = 1024;
    this.sun.shadow.mapSize.height = 1024;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 65;
    const shadowD = 16;
    this.sun.shadow.camera.left = -shadowD;
    this.sun.shadow.camera.right = shadowD;
    this.sun.shadow.camera.top = shadowD;
    this.sun.shadow.camera.bottom = -shadowD;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);

    // Warm hearth fire glow
    this.ovenFireLight = new THREE.PointLight(0xff6a00, 3.2, 8.5);
    this.ovenFireLight.position.set(-5.5, 1.8, -4.5);
    this.scene.add(this.ovenFireLight);
  }

  createTileTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Bright, cheerful Mediterranean terracotta & cream checkered tiles
    const tileSize = 64;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        const isCheck = ((x / tileSize) + (y / tileSize)) % 2 === 0;
        ctx.fillStyle = isCheck ? '#fef3c7' : '#ea580c'; // Warm cream vs rich terracotta orange
        ctx.fillRect(x, y, tileSize, tileSize);

        // Crisp white / amber border bevel
        ctx.strokeStyle = isCheck ? '#fde68a' : '#c2410c';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);

        // Highlight sheen
        ctx.fillStyle = isCheck ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x + 4, y + 4, tileSize - 8, 4);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  createCobblestoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // Lush vibrant emerald plaza lawn/stone base
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 512, 512);

    const stoneCols = ['#22c55e', '#16a34a', '#4ade80', '#15803d'];
    for (let y = 0; y < 512; y += 32) {
      const offsetX = (y / 32) % 2 === 0 ? 0 : 24;
      for (let x = -24; x < 512 + 24; x += 48) {
        ctx.fillStyle = stoneCols[Math.floor(Math.random() * stoneCols.length)];
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x + offsetX + 2, y + 2, 44, 28, 8) : ctx.rect(x + offsetX + 2, y + 2, 44, 28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(21, 128, 61, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  createDeckTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich teak / honey cedar wood base
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 512, 512);

    const plankH = 32;
    const plankColors = ['#9a3412', '#b45309', '#c2410c', '#854d0e', '#a16207', '#78350f'];

    for (let y = 0; y < 512; y += plankH) {
      // Individual plank tone variation
      ctx.fillStyle = plankColors[Math.floor(Math.random() * plankColors.length)];
      ctx.fillRect(0, y + 2, 512, plankH - 4);

      // Fine wood grain streaks
      ctx.fillStyle = 'rgba(67, 20, 7, 0.18)';
      for (let g = 0; g < 4; g++) {
        const gy = y + 4 + Math.random() * (plankH - 8);
        ctx.fillRect(0, gy, 512, 1.5);
      }

      // Dark shadow groove between planks
      ctx.fillStyle = '#290f04';
      ctx.fillRect(0, y, 512, 2);
      ctx.fillRect(0, y + plankH - 2, 512, 2);

      // Screw / fastener dots on plank ends and joints
      ctx.fillStyle = '#451a03';
      for (let x = 16; x < 512; x += 128) {
        ctx.beginPath();
        ctx.arc(x, y + 8, 2.2, 0, Math.PI * 2);
        ctx.arc(x, y + plankH - 8, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    return tex;
  }

  setupEnvironment() {
    // Lush plaza ground
    const cobblestoneTex = this.createCobblestoneTexture();
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      new THREE.MeshStandardMaterial({ map: cobblestoneTex, roughness: 0.65 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Warm vibrant terracotta checkered patio
    const patioTileTex = this.createTileTexture();
    const patioMat = new THREE.MeshStandardMaterial({
      map: patioTileTex,
      roughness: 0.35,
      metalness: 0.05
    });
    const patio = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.25, 16.5), patioMat);
    patio.position.set(0, 0.12, -1);
    patio.receiveShadow = true;
    patio.castShadow = true;
    this.scene.add(patio);

    // Golden honey wooden perimeter trim
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
    const trimFront = new THREE.Mesh(new THREE.BoxGeometry(18.7, 0.28, 0.35), trimMat);
    trimFront.position.set(0, 0.14, 7.2);
    trimFront.receiveShadow = true;
    this.scene.add(trimFront);

    // Outdoor Garden Decked Seating Terrace
    this.outdoorDeckGroup = this.setupOutdoorDeck();
    if (this.outdoorDeckGroup && window.state && !window.state.terraceUnlocked) {
      this.outdoorDeckGroup.visible = false;
    }

    // Rustic back low wall & warm lanterns
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d1a08, roughness: 0.85 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.75 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(18.5, 1.4, 0.5), darkWoodMat);
    backWall.position.set(0, 0.8, -7.5);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Herb planters with leafy green detail
    [-6.5, 6.5].forEach(x => {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.6, 0.8), woodMat);
      planter.position.set(x, 1.45, -7.4);
      planter.castShadow = true;
      const herb = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 }));
      herb.position.set(x, 1.85, -7.4);
      herb.castShadow = true;
      this.scene.add(planter);
      this.scene.add(herb);
    });

    // Street Curb & Roadway
    const curb = new THREE.Mesh(new THREE.BoxGeometry(42, 0.45, 1.2), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 }));
    curb.position.set(2.5, 0.22, 7.8);
    curb.receiveShadow = true;
    this.scene.add(curb);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(48, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 14.5);
    road.receiveShadow = true;
    this.scene.add(road);

    for (let i = -20; i <= 20; i += 5) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.35), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      line.rotation.x = -Math.PI / 2;
      line.position.set(i, 0.03, 14.5);
      this.scene.add(line);
    }
  }

  setupOutdoorDeck() {
    const deckGroup = new THREE.Group();
    const deckTex = this.createDeckTexture();
    const deckMat = new THREE.MeshStandardMaterial({
      map: deckTex,
      roughness: 0.5,
      metalness: 0.05
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.75 });
    const warmWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const glowBulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const flowerRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const flowerPurpleMat = new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.5 });
    const flowerWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfef2f2, roughness: 0.5 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

    // 1. Main Deck Flooring Platform (width: 8.6, depth: 8.4, height: 0.14)
    // Centered at x = 13.1, z = -1.1 (spans x: [8.8, 17.4], z: [-5.3, 3.1])
    const deckPlatform = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.14, 8.4), deckMat);
    deckPlatform.position.set(13.1, 0.07, -1.1);
    deckPlatform.receiveShadow = true;
    deckPlatform.castShadow = true;
    deckGroup.add(deckPlatform);

    // 2. Beveled Dark Wood Fascia Edge Trim around perimeter
    // East trim (x = 17.42)
    const trimEast = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 8.45), darkWoodMat);
    trimEast.position.set(17.42, 0.08, -1.1);
    trimEast.receiveShadow = true;
    deckGroup.add(trimEast);

    // North trim (z = -5.32)
    const trimNorth = new THREE.Mesh(new THREE.BoxGeometry(8.65, 0.16, 0.18), darkWoodMat);
    trimNorth.position.set(13.1, 0.08, -5.32);
    trimNorth.receiveShadow = true;
    deckGroup.add(trimNorth);

    // South trim (z = 3.12)
    const trimSouth = new THREE.Mesh(new THREE.BoxGeometry(8.65, 0.16, 0.18), darkWoodMat);
    trimSouth.position.set(13.1, 0.08, 3.12);
    trimSouth.receiveShadow = true;
    deckGroup.add(trimSouth);

    // Smooth beveled threshold step at South walkway (z = 3.32)
    const step = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.07, 0.35), warmWoodMat);
    step.position.set(13.1, 0.035, 3.35);
    step.receiveShadow = true;
    deckGroup.add(step);

    // 3. Four Rustic Timber Pergola Corner Posts
    const postPositions = [
      [8.85, -5.25],
      [17.35, -5.25],
      [8.85, 3.05],
      [17.35, 3.05]
    ];

    postPositions.forEach(([px, pz]) => {
      // Main timber post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.7, 0.18), warmWoodMat);
      post.position.set(px, 1.35, pz);
      post.castShadow = true;
      deckGroup.add(post);

      // Pyramidal brass cap
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.12, 4), brassMat);
      cap.position.set(px, 2.76, pz);
      cap.rotation.y = Math.PI / 4;
      deckGroup.add(cap);

      // Post lantern bracket & warm glowing bulb
      const lanternArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.16), darkWoodMat);
      lanternArm.position.set(px, 2.2, pz + (pz > 0 ? -0.12 : 0.12));
      deckGroup.add(lanternArm);

      const lanternGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), glowBulbMat);
      lanternGlow.position.set(px, 2.12, pz + (pz > 0 ? -0.18 : 0.18));
      deckGroup.add(lanternGlow);
    });

    // 4. Overhead Pergola Crossbeams at y = 2.62
    [-5.25, 3.05].forEach(bz => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 0.14), warmWoodMat);
      beam.position.set(13.1, 2.62, bz);
      beam.castShadow = true;
      deckGroup.add(beam);
    });

    [10.2, 12.0, 14.2, 16.0].forEach(bx => {
      const rafter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 8.5), warmWoodMat);
      rafter.position.set(bx, 2.72, -1.1);
      rafter.castShadow = true;
      deckGroup.add(rafter);
    });

    // 5. Festoon String Fairy Lights draped across terrace
    const bulbCount = 14;
    for (let i = 0; i < bulbCount; i++) {
      const t = (i + 0.5) / bulbCount;
      const bx = 9.2 + t * 7.8;
      const sag = Math.sin(t * Math.PI) * 0.16;
      const bz = -4.5 + t * 7.0;
      const by = 2.58 - sag;

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), glowBulbMat);
      bulb.position.set(bx, by, bz);
      deckGroup.add(bulb);

      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6), darkWoodMat);
      cord.position.set(bx, by + 0.05, bz);
      deckGroup.add(cord);
    }

    // Warm terrace ambient glow light
    const deckLight = new THREE.PointLight(0xfef08a, 0.75, 12);
    deckLight.position.set(13.1, 2.4, -1.1);
    deckGroup.add(deckLight);

    // 6. Planter Boxes with colorful flowers along outer edges
    const planterConfigs = [
      { x: 17.3, z: -3.0, w: 0.45, d: 2.2 },
      { x: 17.3, z: 0.8, w: 0.45, d: 2.2 },
      { x: 15.5, z: 3.05, w: 2.2, d: 0.45 }
    ];

    planterConfigs.forEach(cfg => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(cfg.w, 0.38, cfg.d), warmWoodMat);
      box.position.set(cfg.x, 0.28, cfg.z);
      box.castShadow = true;
      box.receiveShadow = true;
      deckGroup.add(box);

      const soil = new THREE.Mesh(new THREE.BoxGeometry(cfg.w - 0.08, 0.08, cfg.d - 0.08), darkWoodMat);
      soil.position.set(cfg.x, 0.44, cfg.z);
      deckGroup.add(soil);

      const flowerCount = 6;
      for (let f = 0; f < flowerCount; f++) {
        const isLongD = cfg.d > cfg.w;
        const fOffset = (f - (flowerCount - 1) / 2) * (isLongD ? (cfg.d - 0.4) / flowerCount : (cfg.w - 0.4) / flowerCount);
        const fx = cfg.x + (isLongD ? 0 : fOffset);
        const fz = cfg.z + (isLongD ? fOffset : 0);

        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), foliageMat);
        bush.position.set(fx, 0.50, fz);
        deckGroup.add(bush);

        const flMat = f % 3 === 0 ? flowerRedMat : (f % 3 === 1 ? flowerPurpleMat : flowerWhiteMat);
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), flMat);
        flower.position.set(fx, 0.58, fz);
        deckGroup.add(flower);
      }
    });

    this.scene.add(deckGroup);
    return deckGroup;
  }

  setupKitchen() {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 }); // Golden amber wood
    const counterWoodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.5 });

    // 1. Stone Brick Pizza Oven
    this.ovenGroup = new THREE.Group();
    this.ovenGroup.position.set(-5.5, 0, -4.5);

    const ovenBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.3, 3.0), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 }));
    ovenBase.position.y = 0.65;
    ovenBase.castShadow = true;
    ovenBase.receiveShadow = true;
    this.ovenGroup.add(ovenBase);

    // Rich terracotta crimson dome
    const ovenDome = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }));
    ovenDome.position.y = 1.95;
    ovenDome.castShadow = true;
    this.ovenGroup.add(ovenDome);

    const ovenMouth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.7), new THREE.MeshBasicMaterial({ color: 0x0f172a }));
    ovenMouth.position.set(0, 1.7, 1.2);
    this.ovenGroup.add(ovenMouth);

    const ovenFire = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.5), new THREE.MeshBasicMaterial({ color: 0xff3b00 }));
    ovenFire.position.set(0, 1.4, 1.15);
    this.ovenGroup.add(ovenFire);

    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x475569 }));
    chimney.position.set(0, 3.0, -0.4);
    this.ovenGroup.add(chimney);
    this.scene.add(this.ovenGroup);

    // 2. Prep Table
    this.prepTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.6), woodMat);
    this.prepTable.position.set(-2.5, 0.6, -4.5);
    this.prepTable.castShadow = true;
    this.prepTable.receiveShadow = true;
    this.scene.add(this.prepTable);

    const rollingPin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    rollingPin.rotation.z = Math.PI / 2;
    rollingPin.position.set(-2.5, 1.28, -4.5);
    this.scene.add(rollingPin);

    // Interactive Floating Dough (toss animation when prepping)
    this.doughMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.06, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 })
    );
    this.doughMesh.position.set(-2.5, 1.35, -4.5);
    this.doughMesh.visible = false;
    this.scene.add(this.doughMesh);

    // Order Chit on Kitchen Rail
    const ticketRail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.1), new THREE.MeshStandardMaterial({ color: 0xcfd8dc }));
    ticketRail.position.set(-2.5, 1.7, -5.2);
    this.scene.add(ticketRail);

    this.chitMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide }));
    this.chitMesh.position.set(-2.5, 1.45, -5.15);
    this.chitMesh.visible = false;
    this.scene.add(this.chitMesh);

    // 3. Boxing Table
    this.boxTable = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 1.6), woodMat);
    this.boxTable.position.set(0, 0.6, -4.5);
    this.boxTable.castShadow = true;
    this.boxTable.receiveShadow = true;
    this.scene.add(this.boxTable);

    // 4. Service Counter & Contactless POS (Bright arcade oak with polished white marble top)
    this.counterGroup = new THREE.Group();
    this.counterGroup.position.set(0, 0, 3.2);

    const counterBase = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.3, 1.4), counterWoodMat);
    counterBase.position.y = 0.65;
    counterBase.castShadow = true;
    this.counterGroup.add(counterBase);

    // Clean polished bright white marble top with glossy reflection
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.15, 1.6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    counterTop.position.y = 1.35;
    this.counterGroup.add(counterTop);

    const posBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    posBase.position.set(1.5, 1.5, 0);
    posBase.rotation.y = -0.2;
    this.counterGroup.add(posBase);

    const posScreen = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.35), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    posScreen.position.set(1.5, 1.63, -0.04);
    posScreen.rotation.x = 0.35;
    this.counterGroup.add(posScreen);

    const tillBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.65), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 }));
    tillBox.position.set(-1.5, 1.5, 0);
    this.counterGroup.add(tillBox);

    this.scene.add(this.counterGroup);
  }

  createDiningTableMesh(x = 5.5, z = -0.8) {
    const tableGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 }); // Red Italian bistro table
    const whiteClothMat = new THREE.MeshStandardMaterial({ color: 0xfef2f2, roughness: 0.5 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });

    // Central Table Pedestal & Base
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.1, 24), clothMat);
    tableTop.position.y = 1.1;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    const tableCenterMat = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.11, 24), whiteClothMat);
    tableCenterMat.position.y = 1.11;
    tableGroup.add(tableCenterMat);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 12), metalMat);
    leg.position.y = 0.55;
    leg.castShadow = true;
    tableGroup.add(leg);

    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.08, 16), metalMat);
    foot.position.y = 0.05;
    foot.receiveShadow = true;
    tableGroup.add(foot);

    // Two Wooden Bistro Chairs
    [-1.2, 1.2].forEach((xOffset, idx) => {
      const chair = new THREE.Group();
      chair.position.set(xOffset, 0, 0);
      chair.rotation.y = idx === 0 ? Math.PI / 2 : -Math.PI / 2;

      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 12), woodMat);
      seat.position.y = 0.55;
      seat.castShadow = true;
      chair.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.08), woodMat);
      backrest.position.set(0, 0.95, -0.38);
      backrest.castShadow = true;
      chair.add(backrest);

      const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.52, 8), metalMat);
      chairLeg.position.y = 0.26;
      chair.add(chairLeg);

      tableGroup.add(chair);
    });

    // Refreshing Iced Drink on Table
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, roughness: 0.1 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.35, 12), glassMat);
    glass.position.set(0.3, 1.32, 0.2);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    straw.rotation.z = 0.25;
    straw.position.set(0.33, 1.42, 0.2);
    tableGroup.add(glass);
    tableGroup.add(straw);

    tableGroup.position.set(x, 0.14, z);
    return tableGroup;
  }

  createDiningPlatterMesh() {
    const platterGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const crustMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const pepMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 });

    // Wooden Round Serving Board
    const board = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.48, 0.04, 20), woodMat);
    board.position.y = 0.02;
    board.castShadow = true;
    board.receiveShadow = true;
    platterGroup.add(board);

    // 4 Slices of Pizza
    const slices = [];
    const sliceCount = 4;
    for (let i = 0; i < sliceCount; i++) {
      const sliceGroup = new THREE.Group();
      const thetaStart = i * (Math.PI * 2 / sliceCount);
      const thetaLen = (Math.PI * 2 / sliceCount) * 0.94; // slight gap

      const crust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.44, 0.035, 8, 1, false, thetaStart, thetaLen),
        crustMat
      );
      crust.position.y = 0.04;
      crust.castShadow = true;
      sliceGroup.add(crust);

      const cheese = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.04, 8, 1, false, thetaStart, thetaLen),
        cheeseMat
      );
      cheese.position.y = 0.045;
      sliceGroup.add(cheese);

      // 2 Pepperoni slices per quarter
      for (let p = 0; p < 2; p++) {
        const midAngle = thetaStart + (p === 0 ? 0.28 : 0.62) * thetaLen;
        const dist = 0.22 + p * 0.12;
        const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), pepMat);
        pep.position.set(Math.cos(midAngle) * dist, 0.05, Math.sin(midAngle) * dist);
        sliceGroup.add(pep);
      }

      platterGroup.add(sliceGroup);
      slices.push(sliceGroup);
    }
    platterGroup.slices = slices;
    platterGroup.position.y = 1.15; // Sits on dining tabletop
    return platterGroup;
  }

  createRubbishBinMesh(x = 9.4, z = 3.2) {
    const binGroup = new THREE.Group();
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.4 });
    const greenBody = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5 }); // Dark park green
    const linerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const emblemMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

    // Weighted base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.08, 16), darkMetal);
    base.position.y = 0.04;
    base.castShadow = true;
    base.receiveShadow = true;
    binGroup.add(base);

    // Main barrel
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.95, 18), greenBody);
    body.position.y = 0.52;
    body.castShadow = true;
    binGroup.add(body);

    // Dark liner bag rim
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.06, 18), linerMat);
    liner.position.y = 1.0;
    binGroup.add(liner);

    // Hood / Domed cover with front disposal aperture
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.40, 0.40, 0.24, 18), darkMetal);
    hood.position.y = 1.12;
    hood.castShadow = true;
    binGroup.add(hood);

    const aperture = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.12), linerMat);
    aperture.position.set(0, 1.12, 0.35);
    binGroup.add(aperture);

    // Recycling / trash green emblem icon
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12), emblemMat);
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 0.68, 0.37);
    binGroup.add(emblem);

    binGroup.position.set(x, 0, z);
    this.scene.add(binGroup);
    return binGroup;
  }

  // 3D Physical Small Table & Clipboard (Staff Rota Station)
  createClipboardProp() {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 }); // Rustic wooden desk
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }); // Brown clipboard
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.5 }); // Cream paper
    const clipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 }); // Silver clip

    // Small square wooden side table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), woodMat);
    tableTop.position.y = 0.82;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // 4 sturdy wooden table legs
    [-0.36, 0.36].forEach(x => {
      [-0.36, 0.36].forEach(z => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), woodMat);
        leg.position.set(x, 0.4, z);
        leg.castShadow = true;
        group.add(leg);
      });
    });

    // Clipboard resting angled on the table top
    const clipGroup = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.03, 0.52), boardMat);
    board.castShadow = true;
    clipGroup.add(board);

    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.032, 0.44), paperMat);
    clipGroup.add(paper);

    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.08), clipMat);
    clip.position.set(0, 0.02, -0.2);
    clipGroup.add(clip);

    // Pen attached
    const penMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 8), penMat);
    pen.rotation.z = Math.PI / 2;
    pen.position.set(0.19, 0.02, 0.05);
    clipGroup.add(pen);

    clipGroup.position.set(0, 0.87, 0);
    clipGroup.rotation.y = -0.2;
    group.add(clipGroup);

    // Positioned right next to the corner rest chair
    group.position.set(-5.6, 0.12, -5.5);
    this.scene.add(group);
    return group;
  }

  // 3D Sidewalk A-Frame Chalkboard (Marketing Promos)
  createChalkboardProp() {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }); // Dark slate chalkboard

    // Left easel leg & board
    const boardLeft = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.06), boardMat);
    boardLeft.position.set(0, 0.75, 0);
    boardLeft.rotation.x = 0.2;
    boardLeft.castShadow = true;
    group.add(boardLeft);

    const boardRight = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.06), boardMat);
    boardRight.position.set(0, 0.75, 0.18);
    boardRight.rotation.x = -0.2;
    boardRight.castShadow = true;
    group.add(boardRight);

    // Chalk text banner sprite on board face
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PIZZA', 64, 38);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SPECIALS', 64, 70);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('★ PROMOS ★', 64, 104);
    const tex = new THREE.CanvasTexture(canvas);

    const signSprite = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    signSprite.position.set(0, 0.76, -0.04);
    signSprite.rotation.x = 0.2;
    group.add(signSprite);

    group.position.set(-6.5, 0, 5.2);
    group.rotation.y = 0.35;
    this.scene.add(group);
    return group;
  }

  // Supply Chain: Elevated Rustic Wooden Supply Box & Ingredient Crates
  createSupplyPalletMeshes() {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 }); // Rich warm cedar
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 }); // Sturdy crate corners
    const sackMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.95 }); // White flour sacks
    const sauceMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }); // Bright red tomato cans
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.4 }); // Can lid / brass
    const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 }); // Fresh mozzarella cheese blocks
    const herbMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 }); // Basil / garnish

    // Elevated Wooden Work Crate / Stand (Waist height, clearly visible above floor)
    const standLegs = [
      [-0.75, 0.45, -0.75],
      [0.75, 0.45, -0.75],
      [-0.75, 0.45, 0.75],
      [0.75, 0.45, 0.75]
    ];
    standLegs.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), darkWoodMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      group.add(leg);
    });

    // Elevated Supply Table / Crate Base (at y = 0.88m)
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.8), woodMat);
    tableTop.position.y = 0.88;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // Deep Kitchen Supply Box / Bin rim
    const boxBack = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 0.1), woodMat);
    boxBack.position.set(0, 1.08, -0.8);
    group.add(boxBack);

    const boxFront = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 0.1), woodMat);
    boxFront.position.set(0, 1.01, 0.8);
    group.add(boxFront);

    const boxLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 1.6), woodMat);
    boxLeft.position.set(-0.8, 1.08, 0);
    group.add(boxLeft);

    const boxRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 1.6), woodMat);
    boxRight.position.set(0.8, 1.08, 0);
    group.add(boxRight);

    // Wooden Divider Slats inside crate
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 1.5), darkWoodMat);
    divider.position.set(-0.25, 1.04, 0);
    group.add(divider);

    // 1. INGREDIENT: Flour & Dough Sacks (Left section)
    const flourBag1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.55), sackMat);
    flourBag1.position.set(-0.52, 1.12, -0.35);
    flourBag1.castShadow = true;
    group.add(flourBag1);

    const flourBag2 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.5), sackMat);
    flourBag2.position.set(-0.52, 1.12, 0.3);
    flourBag2.rotation.y = 0.15;
    flourBag2.castShadow = true;
    group.add(flourBag2);

    // Round Dough Balls ready in a wooden tray
    const dough1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), cheeseMat);
    dough1.position.set(-0.52, 1.34, -0.35);
    group.add(dough1);

    // 2. INGREDIENT: Italian San Marzano Tomato Sauce Cans (Right section)
    const canPositions = [
      [0.18, 1.12, -0.45],
      [0.52, 1.12, -0.45],
      [0.35, 1.12, -0.15]
    ];
    canPositions.forEach(([cx, cy, cz]) => {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 16), sauceMat);
      can.position.set(cx, cy, cz);
      can.castShadow = true;
      group.add(can);

      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.132, 0.132, 0.04, 16), goldMat);
      lid.position.set(cx, cy + 0.16, cz);
      group.add(lid);
    });

    // 3. INGREDIENT: Mozzarella Cheese Wheels / Blocks (Front right)
    const cheese1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 16), cheeseMat);
    cheese1.position.set(0.35, 1.08, 0.42);
    cheese1.castShadow = true;
    group.add(cheese1);

    const cheeseWedge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.2), cheeseMat);
    cheeseWedge.position.set(0.32, 1.25, 0.42);
    cheeseWedge.rotation.y = 0.4;
    group.add(cheeseWedge);

    // Fresh Basil Garnish Pot
    const herbPot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.15, 12), darkWoodMat);
    herbPot.position.set(-0.25, 1.25, 0.65);
    group.add(herbPot);

    const herbBush = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), herbMat);
    herbBush.position.set(-0.25, 1.38, 0.65);
    group.add(herbBush);

    // Prominent Supply Box Wooden Plaque / Label Banner ("SUPPLIES")
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 64;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#1e293b';
    if (sCtx.roundRect) {
      sCtx.beginPath();
      sCtx.roundRect(4, 4, 248, 56, 12);
      sCtx.fill();
      sCtx.strokeStyle = '#f59e0b';
      sCtx.lineWidth = 3;
      sCtx.stroke();
    } else {
      sCtx.fillRect(4, 4, 248, 56);
    }
    sCtx.fillStyle = '#fef08a';
    sCtx.font = 'bold 26px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('📦 INGREDIENTS', 128, 40);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
    );
    signMesh.position.set(0, 1.02, 0.87);
    group.add(signMesh);

    // Position the supply box safely behind the oven
    group.position.set(-6.5, 0.12, -6.2);
    this.scene.add(group);
    return group;
  }

  // Phase 3: Founder Rest Corner Armchair (Recharge Stamina / Coffee)
  createRestChairMesh() {
    const group = new THREE.Group();
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 }); // Deep cozy velvet burgundy
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }); // Dark walnut wood frame
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }); // White ceramic coffee mug
    const coffeeMat = new THREE.MeshStandardMaterial({ color: 0x3f200c, roughness: 0.1 });

    // Armchair Seat Cushion
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.25, 0.95), cushionMat);
    seat.position.y = 0.42;
    seat.castShadow = true;
    group.add(seat);

    // Thick cozy Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 0.22), cushionMat);
    back.position.set(0, 0.85, -0.42);
    back.rotation.x = -0.08;
    back.castShadow = true;
    group.add(back);

    // Left & Right Armrests
    [-0.52, 0.52].forEach(x => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.92), woodMat);
      arm.position.set(x, 0.62, 0);
      arm.castShadow = true;
      group.add(arm);
    });

    // 4 Chair Legs
    [-0.42, 0.42].forEach(x => {
      [-0.42, 0.42].forEach(z => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.35, 8), woodMat);
        leg.position.set(x, 0.175, z);
        leg.castShadow = true;
        group.add(leg);
      });
    });

    // Steaming Coffee Mug on right armrest
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.11, 10), cupMat);
    mug.position.set(0.52, 0.84, 0.18);
    const coffeeSurface = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 10), coffeeMat);
    coffeeSurface.position.set(0.52, 0.88, 0.18);
    group.add(mug);
    group.add(coffeeSurface);

    // Placed in the peaceful back-left corner
    group.position.set(-7.2, 0.12, -5.5);
    group.rotation.y = 0.35; // Angled invitingly into the corner
    this.scene.add(group);
    return group;
  }

  // Outdoor Park Bench out on the lush grass lawn
  createOutdoorGrassBenchMesh() {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.65 }); // Rich cedar slats
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 }); // Cast iron frame

    // Wooden slat seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.6), woodMat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    seat.receiveShadow = true;
    group.add(seat);

    // Bench Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.07), woodMat);
    back.position.set(0, 0.8, -0.27);
    back.rotation.x = -0.1;
    back.castShadow = true;
    group.add(back);

    // Bench Cast Iron legs & armrests
    [-0.85, 0.85].forEach(x => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.58), metalMat);
      leg.position.set(x, 0.225, 0);
      leg.castShadow = true;
      group.add(leg);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.55), metalMat);
      arm.position.set(x, 0.62, 0.02);
      arm.castShadow = true;
      group.add(arm);
    });

    // Positioned out on the emerald grass lawn
    group.position.set(13.0, 0.02, 4.8);
    group.rotation.y = 0; // Facing north toward the garden dining tables
    this.scene.add(group);
    return group;
  }

  // Phase 3: Bank Micro-Loan ATM Terminal
  createBankAtmProp() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.4, metalness: 0.3 }); // Emerald bank chassis
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Glowing blue screen
    const keypadMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.6), metalMat);
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.04), screenMat);
    screen.position.set(0, 1.15, 0.31);
    group.add(screen);

    const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.08), keypadMat);
    keypad.position.set(0, 0.82, 0.32);
    keypad.rotation.x = -0.3;
    group.add(keypad);

    // Bank Signage sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BANK ATM', 64, 40);
    const tex = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.32), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    sign.position.set(0, 1.5, 0.31);
    group.add(sign);

    group.position.set(-6.5, 0, 1.8);
    group.rotation.y = Math.PI / 2;
    this.scene.add(group);
    return group;
  }

  setupParticles() {
    // Oven Chimney Steam Emitter (Phase 1 visual polish)
    const particleCount = 14;
    this.steamParticles = [];
    const steamMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.45 });
    const steamGeo = new THREE.SphereGeometry(0.12, 6, 6);

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(steamGeo, steamMat.clone());
      mesh.position.set(-5.5 + (Math.random() - 0.5) * 0.2, 3.8 + Math.random() * 1.5, -4.9 + (Math.random() - 0.5) * 0.2);
      mesh.userData = {
        speedY: 0.6 + Math.random() * 0.4,
        baseY: 3.8,
        maxY: 5.4 + Math.random() * 0.6,
        wobble: Math.random() * 10,
      };
      this.scene.add(mesh);
      this.steamParticles.push(mesh);
    }
  }

  updateParticles(dt) {
    this.steamParticles.forEach(p => {
      p.position.y += p.userData.speedY * dt;
      p.userData.wobble += dt * 3;
      p.position.x += Math.sin(p.userData.wobble) * 0.008;

      const progress = (p.position.y - p.userData.baseY) / (p.userData.maxY - p.userData.baseY);
      p.scale.setScalar(1 + progress * 1.6);
      p.material.opacity = Math.max(0, 0.45 * (1 - progress));

      if (p.position.y >= p.userData.maxY) {
        p.position.y = p.userData.baseY;
        p.position.x = -5.5 + (Math.random() - 0.5) * 0.15;
        p.position.z = -4.9 + (Math.random() - 0.5) * 0.15;
        p.scale.setScalar(1);
        p.material.opacity = 0.45;
      }
    });

    // Animate falling rain streaks if rainy or storm
    if (this.isRaining && this.rainLines && this.rainGeometry) {
      const positions = this.rainGeometry.attributes.position.array;
      const count = this.rainCount;
      const rainSpeed = this.weatherType === 'storm' ? 24 : 16;
      for (let i = 0; i < count; i++) {
        const yIdx = i * 6 + 1;
        const yEndIdx = i * 6 + 4;
        positions[yIdx] -= rainSpeed * dt;
        positions[yEndIdx] -= rainSpeed * dt;

        if (positions[yIdx] < 0) {
          const resetY = 16 + Math.random() * 6;
          positions[yIdx] = resetY;
          positions[yEndIdx] = resetY - (this.weatherType === 'storm' ? 1.2 : 0.8);
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;
    }
  }

  setupRain() {
    this.rainCount = 350;
    const positions = new Float32Array(this.rainCount * 6); // 2 vertices per line streak
    for (let i = 0; i < this.rainCount; i++) {
      const x = (Math.random() - 0.5) * 36;
      const y = Math.random() * 18;
      const z = (Math.random() - 0.5) * 32;

      // Top vertex
      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      // Bottom vertex
      positions[i * 6 + 3] = x - 0.2;
      positions[i * 6 + 4] = y - 0.8;
      positions[i * 6 + 5] = z;
    }

    this.rainGeometry = new THREE.BufferGeometry();
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainMaterial = new THREE.LineBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.6 });
    this.rainLines = new THREE.LineSegments(this.rainGeometry, this.rainMaterial);
    this.rainLines.visible = false;
    this.scene.add(this.rainLines);
  }

  setWeatherVisuals(weatherType) {
    this.weatherType = weatherType;
    if (!this.rainLines) this.setupRain();

    if (weatherType === 'sunny') {
      this.isRaining = false;
      this.rainLines.visible = false;
      this.scene.background.setHex(0x38bdf8); // Sky blue
      this.scene.fog.color.setHex(0x38bdf8);
      this.ambientLight.intensity = 0.95;
      this.sun.color.setHex(0xfffbeb);
      this.sun.intensity = 1.15;
    } else if (weatherType === 'overcast') {
      this.isRaining = false;
      this.rainLines.visible = false;
      this.scene.background.setHex(0x7dd3fc); // Soft sky cyan
      this.scene.fog.color.setHex(0x7dd3fc);
      this.ambientLight.intensity = 0.82;
      this.sun.color.setHex(0xf1f5f9);
      this.sun.intensity = 0.80;
    } else if (weatherType === 'rainy') {
      this.isRaining = true;
      this.rainLines.visible = true;
      this.rainMaterial.opacity = 0.65;
      this.scene.background.setHex(0x3b82f6); // Deep vibrant rain blue
      this.scene.fog.color.setHex(0x3b82f6);
      this.ambientLight.intensity = 0.68;
      this.sun.intensity = 0.55;
    } else if (weatherType === 'storm') {
      this.isRaining = true;
      this.rainLines.visible = true;
      this.rainMaterial.opacity = 0.85;
      this.scene.background.setHex(0x1e3a8a); // Indigo storm
      this.scene.fog.color.setHex(0x1e3a8a);
      this.ambientLight.intensity = 0.52;
      this.sun.intensity = 0.35;
    }
  }

  updateCameraFollow(targetPos, dt = 0.016) {
    if (!targetPos) return;
    // Smooth damp towards player
    const lerpFactor = 1.0 - Math.exp(-6.0 * dt);
    this.cameraTarget.lerp(new THREE.Vector3(targetPos.x, 0, targetPos.z), lerpFactor);
    this.camera.position.set(
      this.cameraTarget.x + this.cameraOffset.x,
      this.cameraOffset.y,
      this.cameraTarget.z + this.cameraOffset.z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  createDriveThruProps() {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const signMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const yellowGlow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    // 1. Dark Asphalt Side Drive-Thru Lane (shifted further west to x=-14.2 to provide ample space)
    const sideLane = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 34), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
    sideLane.rotation.x = -Math.PI / 2;
    sideLane.position.set(-14.2, 0.02, -1.0);
    sideLane.receiveShadow = true;
    group.add(sideLane);

    // Yellow outer guideline
    const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 34), yellowGlow);
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.set(-16.5, 0.03, -1.0);
    edgeLine.receiveShadow = true;
    group.add(edgeLine);

    // White stop bar at service window (z=1.5)
    const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.55), whiteMat);
    stopLine.rotation.x = -Math.PI / 2;
    stopLine.position.set(-14.2, 0.03, 1.5);
    stopLine.receiveShadow = true;
    group.add(stopLine);

    // Painted directional arrows pointing North
    [-5.0, 7.5].forEach(az => {
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.8), whiteMat);
      shaft.rotation.x = -Math.PI / 2;
      shaft.position.set(-14.2, 0.03, az);
      group.add(shaft);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 3), whiteMat);
      head.rotation.x = -Math.PI / 2;
      head.position.set(-14.2, 0.03, az - 1.2);
      group.add(head);
    });

    // 2. Illuminated Drive-Thru Menu & Intercom Pillar (Lane entry at south: x=-15.8, z=9.0 facing South)
    const pillar = new THREE.Group();
    pillar.position.set(-15.8, 0, 9.0);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.4, 12), metalMat);
    post.position.y = 1.2;
    post.castShadow = true;
    pillar.add(post);

    const menuBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.22), signMat);
    menuBox.position.set(0, 1.9, 0);
    menuBox.castShadow = true;
    pillar.add(menuBox);

    const menuScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.95), yellowGlow);
    menuScreen.position.set(0, 1.9, 0.12);
    pillar.add(menuScreen);

    // Speaker box
    const speaker = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.18), metalMat);
    speaker.position.set(0.65, 1.0, 0.05);
    speaker.castShadow = true;
    pillar.add(speaker);

    group.add(pillar);

    // Paved Service Bay Connector Platform (bridges main patio x=-9.25 out to service counter x=-11.2)
    const connectorPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.22, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    connectorPlatform.position.set(-10.25, 0.11, 1.5);
    connectorPlatform.receiveShadow = true;
    group.add(connectorPlatform);

    // 3. Side Service Window Counter & Striped Canopy (positioned at x=-11.2, z=1.5)
    const serviceBay = new THREE.Group();
    serviceBay.position.set(-11.2, 0, 1.5);

    // Stainless steel counter shelf facing west
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 2.5), metalMat);
    shelf.position.set(0, 0.72, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    serviceBay.add(shelf);

    // Awning support posts
    [-1.0, 1.0].forEach(pz => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), metalMat);
      pole.position.set(-0.35, 1.15, pz);
      pole.castShadow = true;
      serviceBay.add(pole);
    });

    // Striped Awning overhead sloping towards the west drive lane
    const awning = new THREE.Group();
    awning.position.set(-0.15, 2.2, 0);
    awning.rotation.z = 0.25; // slope down towards drive-thru car
    const stripeCount = 6;
    for (let s = 0; s < stripeCount; s++) {
      const stripeW = 2.5 / stripeCount;
      const stripeMat = s % 2 === 0 ? redMat : whiteMat;
      const piece = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, stripeW), stripeMat);
      piece.position.z = -1.25 + (s + 0.5) * stripeW;
      piece.castShadow = true;
      awning.add(piece);
    }
    serviceBay.add(awning);
    group.add(serviceBay);

    group.position.set(0, 0, 0);
    this.scene.add(group);
    return group;
  }

  createCarMesh(type = 'sedan', colorHex = 0x2563eb) {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, transparent: true, opacity: 0.75 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const wheelRubberMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.3 });
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Chassis / lower body
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.46, 1.55), bodyMat);
    lowerBody.position.y = 0.42;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    car.add(lowerBody);

    // Bumpers
    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 1.5), darkMat);
    frontBumper.position.set(1.65, 0.32, 0);
    car.add(frontBumper);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 1.5), darkMat);
    rearBumper.position.set(-1.65, 0.32, 0);
    car.add(rearBumper);

    // Cabin / Roof based on type
    let cabin, windshield;
    if (type === 'suv') {
      cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.60, 1.45), bodyMat);
      cabin.position.set(-0.15, 0.90, 0);
      cabin.castShadow = true;
      car.add(cabin);

      windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.48, 1.3), glassMat);
      windshield.position.set(0.96, 0.88, 0);
      windshield.rotation.z = -0.3;
      car.add(windshield);

      // Rear window
      const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.48, 1.3), glassMat);
      rearGlass.position.set(-1.26, 0.88, 0);
      car.add(rearGlass);
    } else if (type === 'pickup') {
      cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.54, 1.45), bodyMat);
      cabin.position.set(-0.35, 0.88, 0);
      cabin.castShadow = true;
      car.add(cabin);

      windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.46, 1.3), glassMat);
      windshield.position.set(0.26, 0.86, 0);
      windshield.rotation.z = -0.35;
      car.add(windshield);

      // Open cargo bed sides
      const bedWallL = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.32, 0.12), bodyMat);
      bedWallL.position.set(0.95, 0.72, 0.68);
      car.add(bedWallL);
      const bedWallR = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.32, 0.12), bodyMat);
      bedWallR.position.set(0.95, 0.72, -0.68);
      car.add(bedWallR);
    } else {
      // Sedan
      cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.48, 1.4), bodyMat);
      cabin.position.set(-0.1, 0.85, 0);
      cabin.castShadow = true;
      car.add(cabin);

      windshield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 1.25), glassMat);
      windshield.position.set(0.74, 0.82, 0);
      windshield.rotation.z = -0.4;
      car.add(windshield);

      const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 1.25), glassMat);
      rearGlass.position.set(-0.94, 0.82, 0);
      rearGlass.rotation.z = 0.4;
      car.add(rearGlass);
    }

    // Side windows
    [-0.72, 0.72].forEach(z => {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.36, 0.04), glassMat);
      sideGlass.position.set(-0.1, 0.86, z);
      car.add(sideGlass);
    });

    // Lights
    [-0.55, 0.55].forEach(z => {
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.28), headlightMat);
      headlight.position.set(1.61, 0.48, z);
      car.add(headlight);

      const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.26), taillightMat);
      taillight.position.set(-1.61, 0.50, z);
      car.add(taillight);
    });

    // 4 Wheels
    const wheels = [];
    const wheelPositions = [
      [1.0, 0.28, 0.82],
      [1.0, 0.28, -0.82],
      [-1.0, 0.28, 0.82],
      [-1.0, 0.28, -0.82]
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(wx, wy, wz);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.20, 16), wheelRubberMat);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.21, 12), rimMat);
      rim.rotation.x = Math.PI / 2;
      wheelGroup.add(rim);

      car.add(wheelGroup);
      wheels.push(wheelGroup);
    });

    car.wheels = wheels;
    return car;
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const asp = w / h;
    this.camera.left = -this.frustumD * asp;
    this.camera.right = this.frustumD * asp;
    this.camera.top = this.frustumD;
    this.camera.bottom = -this.frustumD;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

window.GameScene = GameScene;
