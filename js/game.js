// Interactive Zones, Main Loop, Input Handling, and Game Coordination
const gameCanvas = document.getElementById('webgl-canvas');
const gameScene = new GameScene(gameCanvas);
const bubbleContainer = document.getElementById('bubble-container');

// 1. Zone Rings
function createGroundZoneRing(scene, radius, colorHex, labelText, subText, options = {}) {
  const group = new THREE.Group();
  const showLabel = options.showLabel !== false;
  const popupOnStep = !!options.popupOnStep;

  // Elevate above patio floor (patio surface is at y = 0.245)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.16, radius, 32),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.265;
  ring.renderOrder = 3;
  group.add(ring);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.17, 32),
    new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.26;
  disc.renderOrder = 2;
  group.add(disc);

  let sprite = null, canvasText = null, ctx = null, tex = null;
  if (showLabel) {
    canvasText = document.createElement('canvas');
    canvasText.width = 256;
    canvasText.height = 128;
    ctx = canvasText.getContext('2d');

    // Dark high-contrast background pill
    ctx.fillStyle = 'rgba(11, 17, 32, 0.88)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(10, 12, 236, 104, 20);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.fillRect(10, 12, 236, 104);
    }

    // High contrast title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText(labelText, 128, 56);

    if (subText) {
      ctx.fillStyle = '#facc15';
      ctx.font = '700 22px sans-serif';
      ctx.shadowBlur = 3;
      ctx.fillText(subText, 128, 94);
    }
    tex = new THREE.CanvasTexture(canvasText);
    sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(3.2, 1.6, 1);
    sprite.position.y = 1.35;
    if (popupOnStep) {
      sprite.visible = false;
    }
    group.add(sprite);
  }

  scene.add(group);
  return { group, sprite, ring, canvasText, ctx, tex, radius, popupOnStep, showLabel };
}

function updateZoneText(zone, top, sub) {
  if (!zone || !zone.showLabel || !zone.ctx) return;
  const ctx = zone.ctx;
  ctx.clearRect(0, 0, 256, 128);

  ctx.fillStyle = 'rgba(11, 17, 32, 0.88)';
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(10, 12, 236, 104, 20);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    ctx.fillRect(10, 12, 236, 104);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 4;
  ctx.fillText(top, 128, 56);

  if (sub) {
    ctx.fillStyle = '#34d399';
    ctx.font = '700 22px sans-serif';
    ctx.shadowBlur = 3;
    ctx.fillText(sub, 128, 94);
  }
  zone.tex.needsUpdate = true;
}

// Workstation Stations
const zoneOrder = createGroundZoneRing(gameScene.scene, 1.2, 0x0ea5e9, "TAKE ORDER", "Counter", { showLabel: false });
zoneOrder.group.position.set(0, 0, 1.8);

const zoneCook = createGroundZoneRing(gameScene.scene, 1.3, 0xf97316, "BAKE PIZZA", "Prep Table", { showLabel: false });
zoneCook.group.position.set(-2.5, 0, -3.2);

const zonePickup = createGroundZoneRing(gameScene.scene, 1.2, 0x10b981, "PICK UP", "Boxed Pies", { showLabel: false });
zonePickup.group.position.set(0, 0, -3.2);

// Hiring & Expansion Circles (Spaced out for spacious arcade layout)
const hireChefZone = createGroundZoneRing(gameScene.scene, 1.4, 0xa855f7, "HIRE CHEF", "$45 · Preps Pies", { popupOnStep: true });
hireChefZone.group.position.set(6.2, 0, -5.2);

const hireServerZone = createGroundZoneRing(gameScene.scene, 1.4, 0xec4899, "HIRE SERVER", "$60 · Serves Cash", { popupOnStep: true });
hireServerZone.group.position.set(6.2, 0, 4.2);

// Expansion: Dining Table with drinks pad ($35)
const buyTableZone = createGroundZoneRing(gameScene.scene, 1.4, 0x06b6d4, "BUY TABLE", "$35 · Dine-In & Drinks", { popupOnStep: true });
buyTableZone.group.position.set(5.5, 0, -0.8);

// Phase 2: Supply Chain Restock Pad (Supply Box Station - well clear of oven)
const supplyZone = createGroundZoneRing(gameScene.scene, 1.4, 0x10b981, "RESTOCK", "Supplies & Pallets", { popupOnStep: true });
supplyZone.group.position.set(-5.9, 0, -1.8); // Just east of the supply table (collision box ends at x=-7.0)

// Phase 3: Rest Zone (Outdoor Park Bench on the Lawn · Recharges Energy & Coffee)
const restZone = createGroundZoneRing(gameScene.scene, 1.4, 0xf59e0b, "TAKE BREAK", "Rest on Bench ⚡", { popupOnStep: true });
restZone.group.position.set(10.5, 0, 1.5);

// Phase 3: Bank Micro-Loan ATM Zone
const bankZone = createGroundZoneRing(gameScene.scene, 1.3, 0x14b8a6, "BANK ATM", "Loans & Debt 🏦", { popupOnStep: true });
bankZone.group.position.set(-6.5, 0, 1.8);


const allGroundZones = [zoneOrder, zoneCook, zonePickup, hireChefZone, hireServerZone, buyTableZone, supplyZone, restZone, bankZone];
const popupZones = [hireChefZone, hireServerZone, buyTableZone, supplyZone, restZone, bankZone];
function updateZonePopupVisibility(playerPos) {
  popupZones.forEach(z => {
    if (z && z.sprite && z.popupOnStep) {
      const dist = playerPos.distanceTo(z.group.position);
      z.sprite.visible = dist < 2.0;
    }
  });
}

// Instantiate 3D In-World Physical Props
const physicalClipboard = gameScene.createClipboardProp(); // Small desk & clipboard at (-5.6, 0.12, -5.5)
const physicalChalkboard = gameScene.createChalkboardProp();
const physicalPallet = gameScene.createSupplyPalletMeshes(); // Supply box table at (-8.0, 0.12, -2.0)
const physicalGrassBench = gameScene.createOutdoorGrassBenchMesh(); // Out on the lawn at (10.5, 0.02, 1.5)
const physicalAtm = gameScene.createBankAtmProp();

let diningTableMesh = null;
window.tableOccupied = false;

function applyPurchasedTable() {
  updateZoneText(buyTableZone, "TERRACE DINING", "Open For Seating");
  buyTableZone.ring.material.color.setHex(0x0369a1);
  buyTableZone.group.visible = false; // Hide pad once bought so customers can sit freely

  if (!diningTableMesh) {
    diningTableMesh = gameScene.createDiningTableMesh();
    gameScene.scene.add(diningTableMesh);
  }
}

if (state.tablePurchased) {
  applyPurchasedTable();
}

function purchaseTable() {
  state.tablePurchased = true;
  gameState.save();
  window.audio.upgradeFanfare();
  showFloatingText(buyTableZone.group.position, "PATIO TABLE UNLOCKED!", "#0284c7");
  applyPurchasedTable();
}

// 2. Characters & Visual Inventory
const player = createChibiHuman(gameScene.scene, 0x2563eb, 'chef');
player.root.position.set(0, 0, 1.8);

const playerStack = [];
const MAX_CARRY = 3;
const tableBoxes = [];
const MAX_TABLE_BOXES = 6;

function syncTableBoxesVisual(count) {
  while (tableBoxes.length > 0) gameScene.scene.remove(tableBoxes.pop());
  for (let i = 0; i < count; i++) {
    const b = createPizzaBoxMesh();
    b.position.set(0, 1.35 + (i * 0.18), -4.5);
    gameScene.scene.add(b);
    tableBoxes.push(b);
  }
}

function updatePlayerStackVisual() {
  while (playerStack.length > 0) player.root.remove(playerStack.pop());
  for (let i = 0; i < state.playerCarrying; i++) {
    const box = createPizzaBoxMesh();
    // Position stacked in front of player's torso/hands: y: 0.9 + i*0.22, z: 0.55
    box.position.set(0, 0.92 + (i * 0.22), 0.55);
    player.root.add(box);
    playerStack.push(box);
  }
}

let serverCarriedBox = null;
function updateServerCarryingVisual() {
  if (!hiredServer) return;
  if (hiredServer.carrying > 0 && !serverCarriedBox) {
    serverCarriedBox = createPizzaBoxMesh();
    serverCarriedBox.position.set(0, 0.92, 0.55);
    hiredServer.root.add(serverCarriedBox);
    hiredServer.leftArm.rotation.x = -1.1;
    hiredServer.rightArm.rotation.x = -1.1;
  } else if (hiredServer.carrying === 0 && serverCarriedBox) {
    hiredServer.root.remove(serverCarriedBox);
    serverCarriedBox = null;
    hiredServer.leftArm.rotation.x = 0;
    hiredServer.rightArm.rotation.x = 0;
  }
}

// Restore table boxes from saved state
// 3. Hired Workers Setup
let hiredChef = null;
let hiredServer = null;

function isChefWorkingToday() {
  return state.chefHired && state.chefRota[state.dayIndex];
}

function isServerWorkingToday() {
  return state.serverHired && state.serverRota[state.dayIndex];
}

function applyHiredChef() {
  const working = isChefWorkingToday();
  if (working) {
    updateZoneText(hireChefZone, "CHEF ON SHIFT", "Auto Baking");
    hireChefZone.ring.material.color.setHex(0x581c87);

    if (!hiredChef) {
      hiredChef = createChibiHuman(gameScene.scene, 0xffffff, 'chef');
      hiredChef.root.position.set(-2.5, 0, -3.2);
      hiredChef.root.rotation.y = Math.PI;
    } else {
      hiredChef.root.visible = true;
    }
  } else {
    // Scheduled off today on rota!
    if (hiredChef) hiredChef.root.visible = false;
    if (state.chefHired) {
      updateZoneText(hireChefZone, "CHEF DAY OFF", "Unscheduled on Rota");
      hireChefZone.ring.material.color.setHex(0x3b0764);
    }
  }
}

function applyHiredServer() {
  const working = isServerWorkingToday();
  if (working) {
    updateZoneText(hireServerZone, "SERVER ON SHIFT", "Auto Serving");
    hireServerZone.ring.material.color.setHex(0x831843);

    if (!hiredServer) {
      hiredServer = createChibiHuman(gameScene.scene, 0xdc2626, 'cap');
      hiredServer.root.position.set(0, 0, 1.8);
      hiredServer.state = 'idle';
      hiredServer.carrying = 0;
    } else {
      hiredServer.root.visible = true;
    }
  } else {
    // Scheduled off today on rota!
    if (hiredServer) hiredServer.root.visible = false;
    if (state.serverHired) {
      updateZoneText(hireServerZone, "SERVER DAY OFF", "Unscheduled on Rota");
      hireServerZone.ring.material.color.setHex(0x500724);
    }
  }
}

if (state.chefHired) applyHiredChef();
if (state.serverHired) applyHiredServer();

function hireChef() {
  state.chefHired = true;
  gameState.save();
  window.audio.upgradeFanfare();
  showFloatingText(hireChefZone.group.position, "CHEF HIRED!", "#a855f7");
  applyHiredChef();
}

function hireServer() {
  state.serverHired = true;
  gameState.save();
  window.audio.upgradeFanfare();
  showFloatingText(hireServerZone.group.position, "SERVER HIRED!", "#ec4899");
  applyHiredServer();
}

// 4. UI Elements & Action Ring
const actionRing = document.getElementById('action-ring');
const ringProgress = document.getElementById('ring-progress');

function updateActionRing(progress, worldPos) {
  if (progress <= 0 || progress >= 1) {
    actionRing.style.display = 'none';
    return;
  }
  actionRing.style.display = 'block';
  ringProgress.setAttribute('stroke-dasharray', `${Math.floor(progress * 100)}, 100`);

  const tempV = new THREE.Vector3().copy(worldPos);
  tempV.y += 2.2;
  tempV.project(gameScene.camera);
  actionRing.style.left = `${(tempV.x * 0.5 + 0.5) * window.innerWidth}px`;
  actionRing.style.top = `${(-(tempV.y * 0.5) + 0.5) * window.innerHeight}px`;
}

function showFloatingText(worldPos, text, color = '#10b981') {
  const el = document.createElement('div');
  el.className = 'float-text';
  el.innerText = text;
  el.style.color = color;

  const tempV = new THREE.Vector3().copy(worldPos);
  tempV.y += 1.8;
  tempV.project(gameScene.camera);
  el.style.left = `${(tempV.x * 0.5 + 0.5) * window.innerWidth}px`;
  el.style.top = `${(-(tempV.y * 0.5) + 0.5) * window.innerHeight}px`;

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1250);
}

// 5. Customers Queue Management
const customers = [];
const departingCustomers = [];
window.departingCustomers = departingCustomers;

function spawnCustomer() {
  if (customers.length < 4) {
    customers.push(new Customer(customers.length, gameScene, bubbleContainer));
  }
}
spawnCustomer();
spawnCustomer();

let chefWarnCooldown = 0;
let serverWarnCooldown = 0;
let tableWarnCooldown = 0;
let rotaTriggerCooldown = 0;
let marketingTriggerCooldown = 0;
let supplyTriggerCooldown = 0;
let loanTriggerCooldown = 0;
let saveTimer = 0;

// 7. Main Animation Loop
let lastTime = performance.now();
let playerWalkCycle = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Autosave periodically every 3 seconds
  saveTimer += dt;
  if (saveTimer > 3.0) {
    saveTimer = 0;
    gameState.save();
  }

  if (chefWarnCooldown > 0) chefWarnCooldown -= dt;
  if (serverWarnCooldown > 0) serverWarnCooldown -= dt;
  if (tableWarnCooldown > 0) tableWarnCooldown -= dt;
  if (window.ModalManager) window.ModalManager.updateCooldowns(dt);

  // 1. Movement & Box Wobble
  const moveVec = window.GameInput ? window.GameInput.getMovementVector() : { x: 0, y: 0 };
  let moveX = moveVec.x, moveZ = moveVec.y;

  const moveMag = Math.hypot(moveX, moveZ);
  // Phase 3: Energy effects on founder speed
  const energySpeedFactor = gameState.getFounderSpeedMultiplier();
  const speed = 5.2 * energySpeedFactor;

  if (moveMag > 0.05) {
    const dirX = moveX / moveMag;
    const dirZ = moveZ / moveMag;
    player.root.position.x += dirX * speed * dt;
    player.root.position.z += dirZ * speed * dt;
    player.root.rotation.y = Math.atan2(dirX, dirZ);

    // Drain energy slowly during continuous physical work (approx 1% per 4 seconds of walking)
    state.founderEnergy = Math.max(5, state.founderEnergy - (dt * 0.22));

    playerWalkCycle += dt * 14 * energySpeedFactor;
    player.leftLeg.rotation.x = Math.sin(playerWalkCycle) * 0.7;
    player.rightLeg.rotation.x = -Math.sin(playerWalkCycle) * 0.7;

    // Natural arm swinging (or steady carry posture if holding pizza boxes)
    if (state.playerCarrying > 0) {
      player.leftArm.rotation.x = -1.1;
      player.rightArm.rotation.x = -1.1;
    } else {
      player.leftArm.rotation.x = -Math.sin(playerWalkCycle) * 0.6;
      player.rightArm.rotation.x = Math.sin(playerWalkCycle) * 0.6;
    }

    playerStack.forEach((box, i) => {
      box.rotation.z = Math.sin(playerWalkCycle) * (0.05 + i * 0.03);
      box.rotation.x = Math.cos(playerWalkCycle) * (0.04 + i * 0.02);
    });
  } else {
    player.leftLeg.rotation.x = 0;
    player.rightLeg.rotation.x = 0;
    if (state.playerCarrying > 0) {
      player.leftArm.rotation.x = -1.1;
      player.rightArm.rotation.x = -1.1;
    } else {
      player.leftArm.rotation.x = 0;
      player.rightArm.rotation.x = 0;
    }
    playerStack.forEach(box => { box.rotation.z = 0; box.rotation.x = 0; });
  }

  // Collision Boundaries & Solid Obstacles (Stone oven, Prep table, Box table, Service counter, Supply table, Patio trim)
  const OBSTACLES = [
    // Stone Oven: x: -5.5, z: -4.5, base: 3.0 x 3.0
    { minX: -7.2, maxX: -3.8, minZ: -6.2, maxZ: -2.8 },
    // Prep Table: x: -2.5, z: -4.5, size: 2.2 x 1.6
    { minX: -3.8, maxX: -1.2, minZ: -5.5, maxZ: -3.5 },
    // Box table: x: 0, z: -4.5, size: 2.0 x 1.6
    { minX: -1.2, maxX: 1.2, minZ: -5.5, maxZ: -3.5 },
    // Service Counter: x: 0, z: 3.2, size: 6.8 x 1.6
    { minX: -3.6, maxX: 3.6, minZ: 2.2, maxZ: 4.2 },
    // Supply Table: x: -8.0, z: -2.0, size: 1.8 x 1.8
    { minX: -9.0, maxX: -7.0, minZ: -3.0, maxZ: -1.0 },
    // Low back wall
    { minX: -10, maxX: 10, minZ: -8.5, maxZ: -7.1 },
  ];

  // Resolve player collision against solid obstacles
  const playerRadius = 0.42;
  OBSTACLES.forEach(obs => {
    // Find closest point on obstacle to player
    const closestX = Math.max(obs.minX, Math.min(obs.maxX, player.root.position.x));
    const closestZ = Math.max(obs.minZ, Math.min(obs.maxZ, player.root.position.z));
    const dx = player.root.position.x - closestX;
    const dz = player.root.position.z - closestZ;
    const distSq = dx * dx + dz * dz;

    if (distSq < playerRadius * playerRadius) {
      const dist = Math.sqrt(distSq);
      if (dist > 0.0001) {
        const overlap = playerRadius - dist;
        player.root.position.x += (dx / dist) * overlap;
        player.root.position.z += (dz / dist) * overlap;
      } else {
        // Fallback ejection
        player.root.position.z += playerRadius;
      }
    }
  });

  // Spacious world perimeter: allow full exploration around patio, out to grass lawn and park bench!
  player.root.position.x = Math.max(-10.5, Math.min(12.5, player.root.position.x));
  player.root.position.z = Math.max(-7.0, Math.min(7.5, player.root.position.z));

  // Dynamic zone popup update on step
  updateZonePopupVisibility(player.root.position);

  // 2. Interactive Workstation Step-on Triggers
  const pPos = player.root.position;
  const distToOrderZone = pPos.distanceTo(zoneOrder.group.position);
  const frontCust = customers[0];

  // Step 1: Take Order at Counter
  if (distToOrderZone < 1.3 && frontCust && frontCust.state === 'waiting_order') {
    state.actionProgress += dt / 1.0;
    updateActionRing(state.actionProgress, pPos);
    if (state.actionProgress >= 1) {
      state.actionProgress = 0;
      state.orderTickets += frontCust.orderPies;
      frontCust.state = 'waiting_pizza';
      gameScene.chitMesh.visible = true;
      window.audio.orderChit();
      showFloatingText(zoneOrder.group.position, `+${frontCust.orderPies} Order Taken!`, "#38bdf8");
    }
  }

  // Step 2: Dough Toss & Baking (if no chef)
  const distToCookZone = pPos.distanceTo(zoneCook.group.position);
  if (!state.chefHired && distToCookZone < 1.4 && state.orderTickets > 0 && state.readyBoxesOnTable < MAX_TABLE_BOXES) {
    if (!gameState.hasIngredientsForPizza()) {
      updateActionRing(0, pPos);
      gameScene.doughMesh.visible = false;
      if (chefWarnCooldown <= 0) {
        showFloatingText(zoneCook.group.position, "Out of ingredients! Restock pallet!", "#ef4444");
        window.audio.warningBuzz();
        chefWarnCooldown = 2.5;
      }
    } else {
      state.actionProgress += dt / 2.2;
      updateActionRing(state.actionProgress, pPos);

      // Visual Dough Toss
      gameScene.doughMesh.visible = true;
      const tossH = Math.sin(state.actionProgress * Math.PI * 4) * 0.45;
      gameScene.doughMesh.position.y = 1.35 + Math.max(0, tossH);
      gameScene.doughMesh.rotation.y += dt * 8;

      if (state.actionProgress >= 1) {
        state.actionProgress = 0;
        gameScene.doughMesh.visible = false;
        if (gameState.consumeIngredientsForPizza()) {
          state.orderTickets--;
          state.readyBoxesOnTable++;
          syncTableBoxesVisual(state.readyBoxesOnTable);
          if (state.orderTickets === 0) gameScene.chitMesh.visible = false;
          window.audio.ovenSizzle();
          showFloatingText(zoneCook.group.position, "🍕 Baked & Boxed!", "#f97316");
        }
      }
    }
  } else if (!state.chefHired && distToCookZone >= 1.4) {
    gameScene.doughMesh.visible = false;
  }

  // Step 3: Pick up Boxed Pizza from Table
  const distToPickupZone = pPos.distanceTo(zonePickup.group.position);
  if (distToPickupZone < 1.3 && state.readyBoxesOnTable > 0 && state.playerCarrying < MAX_CARRY) {
    state.readyBoxesOnTable--;
    state.playerCarrying++;
    syncTableBoxesVisual(state.readyBoxesOnTable);
    updatePlayerStackVisual();
    window.audio.boxPickup();
    showFloatingText(zonePickup.group.position, "+1 Box", "#10b981");
  }

  // Step 4: Deliver & Collect Payment
  if (distToOrderZone < 1.3 && state.playerCarrying > 0 && frontCust && frontCust.state === 'waiting_pizza') {
    state.playerCarrying--;
    updatePlayerStackVisual();
    frontCust.remainingPies--;

    if (frontCust.remainingPies <= 0) {
      const willDineIn = state.tablePurchased && !window.tableOccupied;
      frontCust.dineIn = willDineIn;

      const isCard = Math.random() > 0.3;
      const discount = state.activeCampaign ? (state.activeCampaign.priceDiscount || 0) : 0;
      const activePizzaPrice = Math.max(8, state.menuPrice - discount);
      const pizzaSale = activePizzaPrice * frontCust.orderPies;
      const drinkSale = willDineIn ? state.drinkPrice : 0;
      const rawSale = pizzaSale + drinkSale;

      const fee = isCard ? (rawSale * state.cardFeeRate) : 0;
      const netCash = rawSale - fee;

      const pizzaCOGS = state.costPerPizza * frontCust.orderPies;
      const drinkCOGS = willDineIn ? state.drinkCOGS : 0;

      state.cash += netCash;
      state.totalRevenue += rawSale;
      state.dailyRevenue += rawSale;
      state.totalCOGS += (pizzaCOGS + drinkCOGS);
      state.dailyCOGS += (pizzaCOGS + drinkCOGS);
      state.totalFees += fee;
      state.pizzasSold += frontCust.orderPies;
      state.dailyPizzasSold += frontCust.orderPies;

      if (willDineIn) {
        window.tableOccupied = true;
        frontCust.state = 'walk_to_table';
        frontCust.bubble.className = 'world-bubble bubble-done';
        frontCust.bubble.innerHTML = '🥤 Dine-In (+Drink $4.50)';
      } else {
        frontCust.state = 'leaving';
      }

      if (isCard) {
        window.audio.posCardTap();
        showFloatingText(zoneOrder.group.position, `+$${netCash.toFixed(2)} (Card${willDineIn ? ' +Drink' : ''})`, "#10b981");
      } else {
        window.audio.cashRegister();
        showFloatingText(zoneOrder.group.position, `+$${rawSale.toFixed(2)} (Cash${willDineIn ? ' +Drink' : ''})`, "#facc15");
      }

      departingCustomers.push(frontCust);
      customers.shift();
      customers.forEach((c, idx) => c.index = idx);
    } else {
      window.audio.boxPickup();
      showFloatingText(zoneOrder.group.position, `1 Delivered (${frontCust.remainingPies} left)`, "#38bdf8");
    }
  }

  // UPGRADE: HIRE CHEF ($45)
  const distToHireChef = pPos.distanceTo(hireChefZone.group.position);
  if (!state.chefHired && distToHireChef < 1.4) {
    if (state.cash >= 45) {
      state.actionProgress += dt / 1.2;
      updateActionRing(state.actionProgress, pPos);
      if (state.actionProgress >= 1) {
        state.actionProgress = 0;
        state.cash -= 45;
        hireChef();
      }
    } else {
      updateActionRing(0, pPos);
      if (chefWarnCooldown <= 0) {
        const needed = (45 - state.cash).toFixed(2);
        showFloatingText(hireChefZone.group.position, `Need $${needed} more!`, "#ef4444");
        window.audio.warningBuzz();
        chefWarnCooldown = 2.5;
      }
    }
  }

  // UPGRADE: HIRE SERVER ($60)
  const distToHireServer = pPos.distanceTo(hireServerZone.group.position);
  if (!state.serverHired && distToHireServer < 1.4) {
    if (state.cash >= 60) {
      state.actionProgress += dt / 1.2;
      updateActionRing(state.actionProgress, pPos);
      if (state.actionProgress >= 1) {
        state.actionProgress = 0;
        state.cash -= 60;
        hireServer();
      }
    } else {
      updateActionRing(0, pPos);
      if (serverWarnCooldown <= 0) {
        const needed = (60 - state.cash).toFixed(2);
        showFloatingText(hireServerZone.group.position, `Need $${needed} more!`, "#ef4444");
        window.audio.warningBuzz();
        serverWarnCooldown = 2.5;
      }
    }
  }

  // UPGRADE: BUY DINING TABLE ($35)
  const distToBuyTable = pPos.distanceTo(buyTableZone.group.position);
  if (!state.tablePurchased && distToBuyTable < 1.4) {
    if (state.cash >= 35) {
      state.actionProgress += dt / 1.2;
      updateActionRing(state.actionProgress, pPos);
      if (state.actionProgress >= 1) {
        state.actionProgress = 0;
        state.cash -= 35;
        purchaseTable();
      }
    } else {
      updateActionRing(0, pPos);
      if (tableWarnCooldown <= 0) {
        const needed = (35 - state.cash).toFixed(2);
        showFloatingText(buyTableZone.group.position, `Need $${needed} more!`, "#ef4444");
        window.audio.warningBuzz();
        tableWarnCooldown = 2.5;
      }
    }
  }

  // Phase 2: Supply Chain Restock Pallet Station
  const distToSupply = pPos.distanceTo(supplyZone.group.position);
  if (distToSupply < 1.4 && window.ModalManager && window.ModalManager.cooldowns.supply <= 0 && !window.ModalManager.isSupplyOpen()) {
    state.actionProgress += dt / 0.8;
    updateActionRing(state.actionProgress, pPos);
    if (state.actionProgress >= 1) {
      state.actionProgress = 0;
      updateActionRing(0, pPos);
      window.ModalManager.openSupplyModal();
    }
  }

  // Phase 3: Founder Rest Bench Trigger (Recharges Energy + Coffee)
  const distToRest = pPos.distanceTo(restZone.group.position);
  if (distToRest < 1.4) {
    if (state.founderEnergy < 100) {
      state.founderEnergy = Math.min(100, state.founderEnergy + (dt * 18.0)); // Recharges ~18% per second
      updateActionRing(state.founderEnergy / 100, pPos);
      if (Math.random() < 0.04) {
        showFloatingText(restZone.group.position, "☕ Resting... Energy Restored!", "#f59e0b");
        window.audio.pop();
      }
    } else {
      updateActionRing(0, pPos);
    }
  }

  // Phase 3: Bank Micro-Loan ATM Trigger
  const distToBank = pPos.distanceTo(bankZone.group.position);
  if (distToBank < 1.4 && window.ModalManager && window.ModalManager.cooldowns.loan <= 0 && !window.ModalManager.isLoanOpen()) {
    state.actionProgress += dt / 0.8;
    updateActionRing(state.actionProgress, pPos);
    if (state.actionProgress >= 1) {
      state.actionProgress = 0;
      updateActionRing(0, pPos);
      window.ModalManager.openLoanModal();
    }
  }

  // Physical 3D In-World Proximity Triggers
  const distToClipboard = pPos.distanceTo(new THREE.Vector3(-5.6, 0, -5.5));
  if (distToClipboard < 1.3 && window.ModalManager && window.ModalManager.cooldowns.rota <= 0 && !window.ModalManager.isRotaOpen()) {
    window.ModalManager.openRotaModal();
    window.audio.pop();
  }

  const distToChalkboard = pPos.distanceTo(new THREE.Vector3(-6.5, 0, 5.2));
  if (distToChalkboard < 1.3 && window.ModalManager && window.ModalManager.cooldowns.marketing <= 0 && !window.ModalManager.isMarketingOpen()) {
    window.ModalManager.openMarketingModal();
    window.audio.pop();
  }

  // Reset ring if moved off any station
  if (distToOrderZone >= 1.3 && distToCookZone >= 1.4 && distToHireChef >= 1.4 && distToHireServer >= 1.4 && distToBuyTable >= 1.4 && distToSupply >= 1.4 && distToRest >= 1.4 && distToBank >= 1.4) {
    if (state.actionProgress > 0) {
      state.actionProgress = 0;
      updateActionRing(0, pPos);
    }
  }

  // 3. Automated Worker Updates (Governed by Weekly Rota Shift Schedule)
  if (isChefWorkingToday()) {
    // Committed shift wage paid while on duty
    if (state.cash > 0) {
      state.cash -= state.chefWagePerSec * dt;
      state.totalWages += state.chefWagePerSec * dt;
      state.dailyWages += state.chefWagePerSec * dt;
    }

    if (state.orderTickets > 0 && state.readyBoxesOnTable < MAX_TABLE_BOXES) {
      if (!gameState.hasIngredientsForPizza()) {
        // Chef can't cook without ingredients
        hiredChef.leftArm.rotation.x = 0;
        hiredChef.rightArm.rotation.x = 0;
        if (chefWarnCooldown <= 0) {
          showFloatingText(zoneCook.group.position, "Chef waiting for ingredients!", "#ef4444");
          chefWarnCooldown = 3.5;
        }
      } else {
        state.chefBakeTimer += dt;
        hiredChef.leftArm.rotation.x = Math.sin(now * 0.01) * 0.7;
        hiredChef.rightArm.rotation.x = -Math.sin(now * 0.01) * 0.7;

        if (state.chefBakeTimer >= 2.0) {
          state.chefBakeTimer = 0;
          if (gameState.consumeIngredientsForPizza()) {
            state.orderTickets--;
            state.readyBoxesOnTable++;
            syncTableBoxesVisual(state.readyBoxesOnTable);
            if (state.orderTickets === 0) gameScene.chitMesh.visible = false;
            window.audio.ovenSizzle();
            showFloatingText(zoneCook.group.position, "Chef Baked Pie!", "#a855f7");
          }
        }
      }
    } else {
      // Idle bored animation on slow shifts (scratch head / idle arms)
      hiredChef.leftArm.rotation.x = Math.sin(now * 0.002) * 0.15;
      hiredChef.rightArm.rotation.x = Math.cos(now * 0.002) * 0.15;
    }
  }

  if (isServerWorkingToday()) {
    if (state.cash > 0) {
      state.cash -= state.serverWagePerSec * dt;
      state.totalWages += state.serverWagePerSec * dt;
      state.dailyWages += state.serverWagePerSec * dt;
    }

    const serverSpeed = 4.0;
    const currentFront = customers[0];

    if (hiredServer.state === 'idle') {
      if (currentFront && currentFront.state === 'waiting_order') hiredServer.state = 'taking_order';
      else if (state.readyBoxesOnTable > 0 && currentFront && currentFront.state === 'waiting_pizza') hiredServer.state = 'fetching_pizza';
    } else if (hiredServer.state === 'taking_order') {
      const dest = new THREE.Vector3(0, 0, 1.8);
      moveNpcTowards(hiredServer, dest, serverSpeed, dt);
      if (hiredServer.root.position.distanceTo(dest) < 0.2) {
        if (currentFront && currentFront.state === 'waiting_order') {
          state.orderTickets += currentFront.orderPies;
          currentFront.state = 'waiting_pizza';
          gameScene.chitMesh.visible = true;
          window.audio.orderChit();
          showFloatingText(hiredServer.root.position, `Server took order (${currentFront.orderPies}x)`, "#ec4899");
        }
        hiredServer.state = 'idle';
      }
    } else if (hiredServer.state === 'fetching_pizza') {
      const dest = new THREE.Vector3(0, 0, -3.2);
      moveNpcTowards(hiredServer, dest, serverSpeed, dt);
      if (hiredServer.root.position.distanceTo(dest) < 0.2) {
        if (state.readyBoxesOnTable > 0) {
          state.readyBoxesOnTable--;
          syncTableBoxesVisual(state.readyBoxesOnTable);
          hiredServer.carrying = 1;
          hiredServer.state = 'serving';
          updateServerCarryingVisual();
        } else hiredServer.state = 'idle';
      }
    } else if (hiredServer.state === 'serving') {
      const dest = new THREE.Vector3(0, 0, 1.8);
      moveNpcTowards(hiredServer, dest, serverSpeed, dt);
      if (hiredServer.root.position.distanceTo(dest) < 0.2) {
        if (currentFront && currentFront.state === 'waiting_pizza') {
          hiredServer.carrying = 0;
          updateServerCarryingVisual();
          currentFront.remainingPies--;

          if (currentFront.remainingPies <= 0) {
            const willDineIn = state.tablePurchased && !window.tableOccupied;
            currentFront.dineIn = willDineIn;

            const isCard = Math.random() > 0.3;
            const discount = state.activeCampaign ? (state.activeCampaign.priceDiscount || 0) : 0;
            const activePizzaPrice = Math.max(8, state.menuPrice - discount);
            const pizzaSale = activePizzaPrice * currentFront.orderPies;
            const drinkSale = willDineIn ? state.drinkPrice : 0;
            const rawSale = pizzaSale + drinkSale;

            const fee = isCard ? (rawSale * state.cardFeeRate) : 0;
            const netCash = rawSale - fee;

            const pizzaCOGS = state.costPerPizza * currentFront.orderPies;
            const drinkCOGS = willDineIn ? state.drinkCOGS : 0;

            state.cash += netCash;
            state.totalRevenue += rawSale;
            state.dailyRevenue += rawSale;
            state.totalCOGS += (pizzaCOGS + drinkCOGS);
            state.dailyCOGS += (pizzaCOGS + drinkCOGS);
            state.totalFees += fee;
            state.pizzasSold += currentFront.orderPies;
            state.dailyPizzasSold += currentFront.orderPies;

            if (willDineIn) {
              window.tableOccupied = true;
              currentFront.state = 'walk_to_table';
              currentFront.bubble.className = 'world-bubble bubble-done';
              currentFront.bubble.innerHTML = '🥤 Dine-In (+Drink $4.50)';
            } else {
              currentFront.state = 'leaving';
            }

            if (isCard) { window.audio.posCardTap(); showFloatingText(dest, `+$${netCash.toFixed(2)} (Card${willDineIn ? ' +Drink' : ''})`, "#10b981"); }
            else { window.audio.cashRegister(); showFloatingText(dest, `+$${rawSale.toFixed(2)} (Cash${willDineIn ? ' +Drink' : ''})`, "#facc15"); }

            departingCustomers.push(currentFront);
            customers.shift();
            customers.forEach((c, idx) => c.index = idx);
          }
        }
        hiredServer.state = 'idle';
      }
    }
  }

  // 4. Calendar Shift Timer, Weather Transition & Dynamic Demand Engine
  // 4. Economy, Shifts & Demand Progression from modular system
  if (window.EconomyManager) {
    window.EconomyManager.updateEconomy(dt);
  }

  const totalDemandFactor = window.EconomyManager ? window.EconomyManager.getDemandFactor() : 1.0;
  const spawnInterval = Math.max(1.0, Math.min(9.5, 4.2 / totalDemandFactor));

  state.customerSpawnTimer += dt;
  if (state.customerSpawnTimer >= spawnInterval) {
    state.customerSpawnTimer = 0;
    spawnCustomer();
  }

  for (let i = customers.length - 1; i >= 0; i--) {
    if (!customers[i].update(dt, gameScene.camera)) {
      customers.splice(i, 1);
      customers.forEach((c, idx) => c.index = idx);
    }
  }

  for (let i = departingCustomers.length - 1; i >= 0; i--) {
    if (!departingCustomers[i].update(dt, gameScene.camera)) {
      departingCustomers.splice(i, 1);
    }
  }

  // 5. Environmental & VFX Animations
  gameScene.ovenFireLight.intensity = 2.2 + Math.sin(now * 0.015) * 0.6;
  const pulseFactor = 0.35 + Math.sin(now * 0.005) * 0.12;
  allGroundZones.forEach(z => {
    if (z && z.disc && z.disc.material) {
      z.disc.material.opacity = pulseFactor;
    }
  });
  gameScene.updateParticles(dt);
  gameScene.updateCameraFollow(player.root.position, dt);

  // 6. Modular UI updates
  if (window.UIManager) {
    window.UIManager.updateHUD();
    window.UIManager.updateObjectiveBanner(customers);
  }

  gameScene.renderer.render(gameScene.scene, gameScene.camera);
}

function moveNpcTowards(npc, dest, speed, dt) {
  const dir = new THREE.Vector3().subVectors(dest, npc.root.position);
  dir.y = 0;
  if (dir.length() > 0.05) {
    dir.normalize();
    npc.root.position.addScaledVector(dir, speed * dt);
    npc.root.rotation.y = Math.atan2(dir.x, dir.z);
  }
}

// Global references needed by modules
window.gameScene = gameScene;
window.player = player;
window.supplyZone = supplyZone;
window.bankZone = bankZone;
window.applyHiredChef = applyHiredChef;
window.applyHiredServer = applyHiredServer;
window.isChefWorkingToday = isChefWorkingToday;
window.isServerWorkingToday = isServerWorkingToday;

// Start 60 FPS animation loop
requestAnimationFrame(animate);
