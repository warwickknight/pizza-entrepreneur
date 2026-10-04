// Interactive Zones, Main Loop, Input Handling, and Game Coordination
const gameCanvas = document.getElementById('webgl-canvas');
const gameScene = new GameScene(gameCanvas);
const bubbleContainer = document.getElementById('bubble-container');

// 1. Zone Rings
function createGroundZoneRing(scene, radius, colorHex, labelText, subText) {
  const group = new THREE.Group();

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius - 0.15, radius, 32),
    new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.23;
  group.add(ring);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius - 0.16, 32),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.22;
  group.add(disc);

  const canvasText = document.createElement('canvas');
  canvasText.width = 256;
  canvasText.height = 128;
  const ctx = canvasText.getContext('2d');

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
  const tex = new THREE.CanvasTexture(canvasText);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(3.2, 1.6, 1);
  sprite.position.y = 1.35;
  group.add(sprite);

  scene.add(group);
  return { group, sprite, ring, canvasText, ctx, tex, radius };
}

function updateZoneText(zone, top, sub) {
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
const zoneOrder = createGroundZoneRing(gameScene.scene, 1.2, 0x0ea5e9, "TAKE ORDER", "Counter");
zoneOrder.group.position.set(0, 0, 1.8);

const zoneCook = createGroundZoneRing(gameScene.scene, 1.3, 0xf97316, "BAKE PIZZA", "Prep Table");
zoneCook.group.position.set(-2.5, 0, -3.2);

const zonePickup = createGroundZoneRing(gameScene.scene, 1.2, 0x10b981, "PICK UP", "Boxed Pies");
zonePickup.group.position.set(0, 0, -3.2);

// Hiring & Expansion Circles (Spaced out for spacious arcade layout)
const hireChefZone = createGroundZoneRing(gameScene.scene, 1.4, 0xa855f7, "HIRE CHEF", "$45 · Preps Pies");
hireChefZone.group.position.set(6.2, 0, -5.2);

const hireServerZone = createGroundZoneRing(gameScene.scene, 1.4, 0xec4899, "HIRE SERVER", "$60 · Serves Cash");
hireServerZone.group.position.set(6.2, 0, 4.2);

// Expansion: Dining Table with drinks pad ($35)
const buyTableZone = createGroundZoneRing(gameScene.scene, 1.4, 0x06b6d4, "BUY TABLE", "$35 · Dine-In & Drinks");
buyTableZone.group.position.set(5.5, 0, -0.8);

// Phase 2: Supply Chain Restock Pad (Pallet Station)
const supplyZone = createGroundZoneRing(gameScene.scene, 1.4, 0x10b981, "RESTOCK", "Supplies & Pallets");
supplyZone.group.position.set(-6.2, 0, -2.5);

// Phase 3: Rest Zone (Cozy Corner Armchair · Recharges Energy & Coffee)
const restZone = createGroundZoneRing(gameScene.scene, 1.4, 0xf59e0b, "TAKE BREAK", "Rest & Recharge ⚡");
restZone.group.position.set(-7.2, 0, -5.5);

// Phase 3: Bank Micro-Loan ATM Zone
const bankZone = createGroundZoneRing(gameScene.scene, 1.3, 0x14b8a6, "BANK ATM", "Loans & Debt 🏦");
bankZone.group.position.set(-6.5, 0, 1.8);

// Instantiate 3D In-World Physical Props
const physicalClipboard = gameScene.createClipboardProp(); // Small desk & clipboard at (-5.6, 0.12, -5.5)
const physicalChalkboard = gameScene.createChalkboardProp();
const physicalPallet = gameScene.createSupplyPalletMeshes();
const physicalRestChair = gameScene.createRestChairMesh(); // Corner rest chair at (-7.2, 0.12, -5.5)
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
    document.getElementById('badge-chef').classList.remove('hidden');
    document.getElementById('badge-chef').innerText = "👨‍🍳 Chef On Shift";

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
    document.getElementById('badge-chef').classList.add('hidden');
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
    document.getElementById('badge-server').classList.remove('hidden');
    document.getElementById('badge-server').innerText = "🛎️ Server On Shift";

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
    document.getElementById('badge-server').classList.add('hidden');
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

// 5. Input Setup: Virtual Joystick & Keyboard
const joyBase = document.getElementById('joystick-base');
const joyStick = document.getElementById('joystick-stick');
const joyZone = document.getElementById('joystick-zone');

const input = { x: 0, y: 0, active: false };
let joyTouchId = null;
let joyCenter = { x: 0, y: 0 };
const maxRadius = 45;

joyZone.addEventListener('pointerdown', (e) => {
  // If clicking on or inside any active modal or interactive UI, do not activate joystick
  if (e.target.closest('#dilemma-modal, #pl-modal, #rota-modal, #marketing-modal, #supply-modal, #pricing-modal, #loan-modal, header, footer')) {
    return;
  }
  // Check if any modal is currently visible
  const anyModalActive = document.querySelector('.opacity-100:not(.opacity-0), .active#pl-modal');
  if (anyModalActive && anyModalActive.id && anyModalActive.id.includes('modal')) {
    return;
  }

  window.audio.init();
  joyTouchId = e.pointerId;
  input.active = true;
  joyCenter = { x: e.clientX, y: e.clientY };
  joyBase.style.left = `${e.clientX}px`;
  joyBase.style.top = `${e.clientY}px`;
  joyBase.style.display = 'block';
});

window.addEventListener('pointermove', (e) => {
  if (!input.active || e.pointerId !== joyTouchId) return;
  const dx = e.clientX - joyCenter.x;
  const dy = e.clientY - joyCenter.y;
  const dist = Math.min(Math.hypot(dx, dy), maxRadius);
  const angle = Math.atan2(dy, dx);

  const stickX = Math.cos(angle) * dist;
  const stickY = Math.sin(angle) * dist;
  joyStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

  const nx = stickX / maxRadius;
  const ny = stickY / maxRadius;
  // 45-degree isometric projection transform
  input.x = (nx + ny) * 0.7071;
  input.y = (ny - nx) * 0.7071;
});

const resetJoystick = () => {
  input.active = false;
  input.x = 0; input.y = 0;
  joyBase.style.display = 'none';
  joyTouchId = null;
};
window.addEventListener('pointerup', resetJoystick);
window.addEventListener('pointercancel', resetJoystick);

const keys = {};
window.addEventListener('keydown', (e) => { window.audio.init(); keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function getKeyboardInput() {
  let kx = 0, ky = 0;
  if (keys['w'] || keys['arrowup']) ky -= 1;
  if (keys['s'] || keys['arrowdown']) ky += 1;
  if (keys['a'] || keys['arrowleft']) kx -= 1;
  if (keys['d'] || keys['arrowright']) kx += 1;
  if (kx !== 0 || ky !== 0) {
    return { x: (kx + ky) * 0.7071, y: (ky - kx) * 0.7071 };
  }
  return null;
}

// 6. Customers Queue Management
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
  if (rotaTriggerCooldown > 0) rotaTriggerCooldown -= dt;

  // 1. Movement & Box Wobble
  let moveX = input.x, moveZ = input.y;
  const kbd = getKeyboardInput();
  if (kbd) { moveX = kbd.x; moveZ = kbd.y; }

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

  player.root.position.x = Math.max(-8, Math.min(8, player.root.position.x));
  player.root.position.z = Math.max(-7, Math.min(2.2, player.root.position.z));

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
  if (distToSupply < 1.4) {
    state.actionProgress += dt / 0.8;
    updateActionRing(state.actionProgress, pPos);
    if (state.actionProgress >= 1) {
      state.actionProgress = 0;
      openSupplyModal();
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
  if (distToBank < 1.4) {
    state.actionProgress += dt / 0.8;
    updateActionRing(state.actionProgress, pPos);
    if (state.actionProgress >= 1) {
      state.actionProgress = 0;
      openLoanModal();
    }
  }

  // Physical 3D In-World Proximity Triggers
  const distToClipboard = pPos.distanceTo(new THREE.Vector3(-5.6, 0, -5.5));
  if (distToClipboard < 1.3 && rotaTriggerCooldown <= 0 && !rotaModal.classList.contains('opacity-100')) {
    renderRotaModal();
    rotaModal.classList.remove('opacity-0', 'pointer-events-none');
    rotaModal.classList.add('opacity-100', 'pointer-events-auto');
    window.audio.pop();
  }

  const distToChalkboard = pPos.distanceTo(new THREE.Vector3(-6.5, 0, 5.2));
  if (distToChalkboard < 1.3 && !marketingModal.classList.contains('opacity-100')) {
    marketingModal.classList.remove('opacity-0', 'pointer-events-none');
    marketingModal.classList.add('opacity-100', 'pointer-events-auto');
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
  state.shiftTimer += dt;
  if (state.shiftTimer >= state.shiftDuration) {
    state.shiftTimer = 0;
    // Advance day
    state.dayIndex = (state.dayIndex + 1) % 7;
    state.monthDay = (state.monthDay % 28) + 1;

    // Phase 3: Bank Debt Daily Interest Servicing (8% daily)
    if (state.loanPrincipal > 0) {
      const dailyInterest = state.loanPrincipal * state.loanDailyInterestRate;
      state.totalDebtInterestPaid += dailyInterest;
      state.cash = Math.max(0, state.cash - dailyInterest);
      showFloatingText(bankZone.group.position, `🏦 Debt Interest Paid: -$${dailyInterest.toFixed(2)}`, "#0f766e");
    }

    // Phase 2: Overnight Spoilage & Working Capital Risk
    // If player does not have refrigeration cooler and left excess cheese unmanaged overnight
    if (!state.hasRefrigeration && state.inventory.cheese > 10) {
      const spoiledAmount = Math.floor(state.inventory.cheese * 0.45); // 45% spoils without cooler
      state.inventory.cheese -= spoiledAmount;
      const wasteCost = spoiledAmount * 1.20; // wholesale cheese write-off value
      state.totalCOGS += wasteCost;
      state.dailyWasteCost += wasteCost;
      state.spoiledCheeseBatches += spoiledAmount;
      showFloatingText(supplyZone.group.position, `⚠️ ${spoiledAmount} Cheese Spoiled Overnight! (-$${wasteCost.toFixed(2)})`, "#ef4444");
      window.audio.warningBuzz();
    }

    // Phase 3: Trigger End-of-Shift Founder Dilemma (Every few days)
    if (state.monthDay % 2 === 0) {
      triggerEndShiftDilemma();
    }

    // Shift weather forecast
    state.currentWeather = state.forecast[0] || 'sunny';
    state.forecast[0] = state.forecast[1] || 'overcast';
    state.forecast[1] = state.forecast[2] || 'sunny';
    const weathers = ['sunny', 'sunny', 'overcast', 'rainy', 'storm'];
    state.forecast[2] = weathers[Math.floor(Math.random() * weathers.length)];

    // Apply new weather visuals
    gameScene.setWeatherVisuals(state.currentWeather);

    // Refresh Rota staffing on new day
    applyHiredChef();
    applyHiredServer();

    // Reset daily shift metrics
    state.dailyRevenue = 0;
    state.dailyCOGS = 0;
    state.dailyWages = 0;
    state.dailyWasteCost = 0;
    state.dailyPizzasSold = 0;
    state.dailyWalkaways = 0;

    gameState.save();
    window.audio.beep(587.33, 'triangle', 0.15, 0.14);
    showFloatingText(player.root.position, `New Shift: ${DAY_NAMES[state.dayIndex]}!`, "#facc15");
  }

  // Active Marketing Campaign timer countdown
  if (state.activeCampaign) {
    state.activeCampaign.timer -= dt;
    if (state.activeCampaign.timer <= 0) {
      showFloatingText(player.root.position, `Promo Ended: ${state.activeCampaign.name}`, "#38bdf8");
      state.activeCampaign = null;
      document.getElementById('campaign-badge').classList.add('hidden');
    }
  }

  // Calculate dynamic footfall multiplier:
  // Day mult * Weather mult * Payday mult * Marketing mult * Price Elasticity factor
  const dayMult = DAY_FOOTFALL_MULTS[state.dayIndex] || 1.0;
  const weatherMult = (WEATHER_MULTS[state.currentWeather] && WEATHER_MULTS[state.currentWeather].footfall) || 1.0;
  const isPaydayWeek = (state.monthDay >= 22); // Week 4 = Payday Surge (+40% traffic)
  const paydayMult = isPaydayWeek ? 1.40 : ((state.monthDay >= 8 && state.monthDay <= 21) ? 0.85 : 1.10);
  const marketingMult = state.activeCampaign ? state.activeCampaign.footfallMult : 1.0;
  const priceElasticityMult = gameState.getPriceDemandMultiplier();

  const totalDemandFactor = dayMult * weatherMult * paydayMult * marketingMult * priceElasticityMult;
  // Baseline interval 4.2 seconds divided by demand factor (capped between 1.0s and 9.5s)
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
  gameScene.updateParticles(dt);
  updateUI();
  updateObjectiveBanner();

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

// 8. HUD & UI Updates
const hudCash = document.getElementById('cash-amount');
const hudSold = document.getElementById('hud-sold');
const hudTickets = document.getElementById('hud-tickets');
const stepBadge = document.getElementById('step-badge');
const stepDesc = document.getElementById('step-desc');

function updateUI() {
  hudCash.innerText = Math.max(0, state.cash).toFixed(2);
  hudSold.innerText = state.pizzasSold;
  hudTickets.innerText = state.orderTickets;

  // Phase 2 Inventory Stock Display
  const invDough = document.getElementById('inv-dough');
  const invSauce = document.getElementById('inv-sauce');
  const invCheese = document.getElementById('inv-cheese');
  if (invDough && state.inventory) invDough.innerText = state.inventory.dough;
  if (invSauce && state.inventory) invSauce.innerText = state.inventory.sauce;
  if (invCheese && state.inventory) invCheese.innerText = state.inventory.cheese;

  // Price tag display
  const priceTag = document.getElementById('hud-price-tag');
  if (priceTag) priceTag.innerText = `$${state.menuPrice.toFixed(2)}`;

  // Phase 3 Founder Energy & Family Morale Displays
  const energyText = document.getElementById('hud-energy-text');
  const energyBar = document.getElementById('hud-energy-bar');
  if (energyText && energyBar) {
    const e = Math.round(state.founderEnergy);
    energyText.innerText = `${e}%`;
    energyBar.style.width = `${e}%`;
    if (e < 25) {
      energyBar.className = "h-full bg-red-500 animate-pulse transition-all duration-300";
    } else {
      energyBar.className = "h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300";
    }
  }

  const moraleText = document.getElementById('hud-morale-text');
  const moraleBar = document.getElementById('hud-morale-bar');
  if (moraleText && moraleBar) {
    const m = Math.round(state.familyMorale);
    moraleText.innerText = `${m}%`;
    moraleBar.style.width = `${m}%`;
  }

  // Calendar & Weather HUD display
  const weatherIcon = document.getElementById('weather-icon');
  const dayBadge = document.getElementById('day-badge');
  if (weatherIcon && dayBadge) {
    const iconMap = { sunny: '☀️', overcast: '⛅', rainy: '🌧️', storm: '⛈️' };
    weatherIcon.innerText = iconMap[state.currentWeather] || '☀️';
    const weekNum = Math.ceil(state.monthDay / 7);
    const dayName = DAY_NAMES[state.dayIndex];
    dayBadge.innerText = `${dayName} (W${weekNum} D${state.monthDay})`;
    if (weekNum === 4) {
      dayBadge.className = "font-bold text-emerald-400"; // Payday surge styling
    } else {
      dayBadge.className = "font-bold text-amber-400";
    }
  }
}
function updateObjectiveBanner() {
  if (!state.chefHired && !state.serverHired) {
    if (state.orderTickets === 0 && customers.length > 0 && customers[0].state === 'waiting_order') {
      stepBadge.innerText = "STEP 1";
      stepDesc.innerText = "Take Customer's Order at the Counter";
    } else if (state.orderTickets > 0 && state.readyBoxesOnTable === 0 && state.playerCarrying === 0) {
      stepBadge.innerText = "STEP 2";
      stepDesc.innerText = "Stand at the Oven/Prep Table to Knead & Bake";
    } else if (state.readyBoxesOnTable > 0 && state.playerCarrying === 0) {
      stepBadge.innerText = "STEP 3";
      stepDesc.innerText = "Pick Up Boxed Pizza from Table";
    } else if (state.playerCarrying > 0) {
      stepBadge.innerText = "STEP 4";
      stepDesc.innerText = "Deliver to Customer & Collect Payment!";
    } else if (state.cash >= 35 && !state.tablePurchased) {
      stepBadge.innerText = "UPGRADE";
      stepDesc.innerText = "Buy Dining Table ($35) for Dine-In Drink Profits!";
    } else if (state.cash >= 45 && !state.chefHired) {
      stepBadge.innerText = "EXPAND";
      stepDesc.innerText = "Step on Purple Circle to Hire Chef ($45)!";
    }
  } else if (state.chefHired && !state.serverHired) {
    if (state.cash >= 35 && !state.tablePurchased) {
      stepBadge.innerText = "UPGRADE";
      stepDesc.innerText = "Buy Dining Table ($35) for Dine-In Drink Profits!";
    } else if (state.cash >= 60) {
      stepBadge.innerText = "SCALE";
      stepDesc.innerText = "Step on Pink Circle to Hire Server ($60)!";
    } else {
      stepBadge.innerText = "DELEGATING";
      stepDesc.innerText = "Chef is cooking! You focus on serving.";
    }
  } else {
    if (!state.tablePurchased) {
      stepBadge.innerText = "DINE-IN";
      stepDesc.innerText = "Unlock Terrace Table ($35) to boost margins with drinks!";
    } else {
      stepBadge.innerText = "PATIO PIZZERIA";
      stepDesc.innerText = "Automated kitchen + Terrace dining active!";
    }
  }
}

// 9. Staff Rota Clipboard Handlers
const rotaModal = document.getElementById('rota-modal');
const btnRota = document.getElementById('btn-rota');

function renderRotaModal() {
  const forecastGrid = document.getElementById('forecast-grid');
  forecastGrid.innerHTML = '';
  const iconMap = { sunny: '☀️', overcast: '⛅', rainy: '🌧️', storm: '⛈️' };

  for (let i = 0; i < 3; i++) {
    const dayOffset = (state.dayIndex + i + 1) % 7;
    const w = state.forecast[i] || 'sunny';
    const dayCol = document.createElement('div');
    dayCol.className = 'p-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center gap-0.5';
    dayCol.innerHTML = `
      <span class="text-[10px] font-bold text-slate-400">${DAY_NAMES[dayOffset]}</span>
      <span class="text-base">${iconMap[w]}</span>
      <span class="text-[9px] text-amber-300 font-semibold">${w.toUpperCase()}</span>
    `;
    forecastGrid.appendChild(dayCol);
  }

  // Chef Rota row
  const chefRow = document.getElementById('chef-days-row');
  chefRow.innerHTML = '';
  document.getElementById('chef-hired-status').innerText = state.chefHired ? "Status: Employed" : "Not Hired Yet ($45)";

  DAY_NAMES.forEach((day, idx) => {
    const isToday = (idx === state.dayIndex);
    const active = state.chefRota[idx];
    const btn = document.createElement('button');
    btn.className = `py-1.5 rounded-lg border text-xs font-bold transition ${active ? 'bg-purple-600/80 border-purple-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'} ${isToday ? 'ring-2 ring-amber-400' : ''}`;
    btn.innerText = day;
    btn.disabled = !state.chefHired;
    btn.title = active ? "Scheduled to work" : "Day off";
    btn.onclick = () => {
      window.audio.init();
      state.chefRota[idx] = !state.chefRota[idx];
      renderRotaModal();
      applyHiredChef();
    };
    chefRow.appendChild(btn);
  });

  // Server Rota row
  const serverRow = document.getElementById('server-days-row');
  serverRow.innerHTML = '';
  document.getElementById('server-hired-status').innerText = state.serverHired ? "Status: Employed" : "Not Hired Yet ($60)";

  DAY_NAMES.forEach((day, idx) => {
    const isToday = (idx === state.dayIndex);
    const active = state.serverRota[idx];
    const btn = document.createElement('button');
    btn.className = `py-1.5 rounded-lg border text-xs font-bold transition ${active ? 'bg-pink-600/80 border-pink-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'} ${isToday ? 'ring-2 ring-amber-400' : ''}`;
    btn.innerText = day;
    btn.disabled = !state.serverHired;
    btn.title = active ? "Scheduled to work" : "Day off";
    btn.onclick = () => {
      window.audio.init();
      state.serverRota[idx] = !state.serverRota[idx];
      renderRotaModal();
      applyHiredServer();
    };
    serverRow.appendChild(btn);
  });
}

if (btnRota) {
  btnRota.addEventListener('click', () => {
    window.audio.init();
    renderRotaModal();
    rotaModal.classList.remove('opacity-0', 'pointer-events-none');
    rotaModal.classList.add('opacity-100', 'pointer-events-auto');
  });
}
function closeRotaModal() {
  rotaModal.classList.add('opacity-0', 'pointer-events-none');
  rotaModal.classList.remove('opacity-100', 'pointer-events-auto');
  rotaTriggerCooldown = 2.5; // Prevent instant reopening while standing near the desk
  gameState.save();
}
window.onCloseRotaModal = closeRotaModal;

document.getElementById('btn-close-rota').addEventListener('click', closeRotaModal);
document.getElementById('btn-confirm-rota').addEventListener('click', closeRotaModal);

// 10. Growth Marketing Board Handlers
const marketingModal = document.getElementById('marketing-modal');
const btnMarketing = document.getElementById('btn-marketing');

if (btnMarketing) {
  btnMarketing.addEventListener('click', () => {
    window.audio.init();
    marketingModal.classList.remove('opacity-0', 'pointer-events-none');
    marketingModal.classList.add('opacity-100', 'pointer-events-auto');
  });
}
document.getElementById('btn-close-marketing').addEventListener('click', () => {
  marketingModal.classList.add('opacity-0', 'pointer-events-none');
  marketingModal.classList.remove('opacity-100', 'pointer-events-auto');
});

function launchCampaign(name, cost, duration, footfallMult, priceDiscount = 0) {
  if (state.cash < cost) {
    window.audio.warningBuzz();
    alert(`Need $${cost.toFixed(2)} to launch this campaign!`);
    return;
  }
  state.cash -= cost;
  state.activeCampaign = {
    name,
    timer: duration,
    maxTimer: duration,
    footfallMult,
    priceDiscount,
  };
  window.audio.upgradeFanfare();
  showFloatingText(player.root.position, `PROMO LAUNCHED: ${name}!`, "#38bdf8");
  document.getElementById('campaign-badge').classList.remove('hidden');
  marketingModal.classList.add('opacity-0', 'pointer-events-none');
  marketingModal.classList.remove('opacity-100', 'pointer-events-auto');
}

document.getElementById('btn-launch-flyers').addEventListener('click', () => {
  launchCampaign("Local Flyers", 15, 45, 1.25);
});
document.getElementById('btn-launch-social').addEventListener('click', () => {
  launchCampaign("Social Media Blitz", 40, 30, 1.75);
});
document.getElementById('btn-launch-coupon').addEventListener('click', () => {
  launchCampaign("2-for-1 Coupon", 10, 45, 2.20, 5.00);
});

// 11. Supply Chain & Pallet Restock Handlers
const supplyModal = document.getElementById('supply-modal');
const btnSupply = document.getElementById('btn-supply');

function openSupplyModal() {
  window.audio.init();
  updateSupplyModalStock();
  supplyModal.classList.remove('opacity-0', 'pointer-events-none');
  supplyModal.classList.add('opacity-100', 'pointer-events-auto');
}

function updateSupplyModalStock() {
  const md = document.getElementById('modal-inv-dough');
  const ms = document.getElementById('modal-inv-sauce');
  const mc = document.getElementById('modal-inv-cheese');
  if (md) md.innerText = `${state.inventory.dough} / ${state.maxInventoryCapacity}`;
  if (ms) ms.innerText = `${state.inventory.sauce} / ${state.maxInventoryCapacity}`;
  if (mc) mc.innerText = `${state.inventory.cheese} / ${state.maxInventoryCapacity}`;

  const fridgeDesc = document.getElementById('fridge-desc');
  const btnFridge = document.getElementById('btn-buy-fridge');
  const risk = document.getElementById('cheese-spoilage-risk');
  if (state.hasRefrigeration) {
    if (fridgeDesc) fridgeDesc.innerText = "Active: Walk-in cooler protecting all cheese from spoilage! ❄️";
    if (btnFridge) {
      btnFridge.innerText = "Installed ✓";
      btnFridge.className = "px-3.5 py-2 bg-slate-800 text-sky-400 font-fredoka font-bold rounded-xl text-xs shadow whitespace-nowrap cursor-default";
      btnFridge.disabled = true;
    }
    if (risk) {
      risk.innerText = "❄️ Refrigerated (Safe)";
      risk.className = "text-[9px] text-sky-400 font-semibold mt-0.5";
    }
  }
}

if (btnSupply) btnSupply.addEventListener('click', openSupplyModal);
document.getElementById('btn-close-supply').addEventListener('click', () => {
  supplyModal.classList.add('opacity-0', 'pointer-events-none');
  supplyModal.classList.remove('opacity-100', 'pointer-events-auto');
});

// Daily Batch ($22 for +10 each)
document.getElementById('btn-buy-daily-batch').addEventListener('click', () => {
  if (state.cash < 22) {
    window.audio.warningBuzz();
    alert("Need $22.00 to purchase daily batch restock!");
    return;
  }
  state.cash -= 22;
  state.inventory.dough = Math.min(state.maxInventoryCapacity, state.inventory.dough + 10);
  state.inventory.sauce = Math.min(state.maxInventoryCapacity, state.inventory.sauce + 10);
  state.inventory.cheese = Math.min(state.maxInventoryCapacity, state.inventory.cheese + 10);
  gameState.save();
  window.audio.cashRegister();
  showFloatingText(player.root.position, "+10 Ingredients Restocked!", "#10b981");
  updateSupplyModalStock();
});

// Wholesale Pallet ($49 for +35 each)
document.getElementById('btn-buy-wholesale-pallet').addEventListener('click', () => {
  if (state.cash < 49) {
    window.audio.warningBuzz();
    alert("Need $49.00 to purchase wholesale pallet delivery!");
    return;
  }
  state.cash -= 49;
  state.inventory.dough = Math.min(state.maxInventoryCapacity, state.inventory.dough + 35);
  state.inventory.sauce = Math.min(state.maxInventoryCapacity, state.inventory.sauce + 35);
  state.inventory.cheese = Math.min(state.maxInventoryCapacity, state.inventory.cheese + 35);
  gameState.save();
  window.audio.upgradeFanfare();
  showFloatingText(supplyZone.group.position, "📦 WHOLESALE PALLET DELIVERED!", "#f59e0b");
  updateSupplyModalStock();
});

// Walk-in Cooler Compressor ($30)
document.getElementById('btn-buy-fridge').addEventListener('click', () => {
  if (state.hasRefrigeration) return;
  if (state.cash < 30) {
    window.audio.warningBuzz();
    alert("Need $30.00 to install the walk-in cooler compressor!");
    return;
  }
  state.cash -= 30;
  state.hasRefrigeration = true;
  gameState.save();
  window.audio.upgradeFanfare();
  showFloatingText(player.root.position, "❄️ WALK-IN COOLER INSTALLED!", "#38bdf8");
  updateSupplyModalStock();
});

// 12. Menu Pricing & Demand Elasticity Handlers
const pricingModal = document.getElementById('pricing-modal');
const btnPricing = document.getElementById('btn-pricing');
const priceSlider = document.getElementById('price-slider');
const sliderPriceDisplay = document.getElementById('slider-price-display');
const elasticityTraffic = document.getElementById('elasticity-traffic');
const elasticityMargin = document.getElementById('elasticity-margin');
const elasticitySummary = document.getElementById('elasticity-summary');

function updateElasticityDisplay(val) {
  sliderPriceDisplay.innerText = `$${val.toFixed(2)}`;
  const marginPerPie = val - state.costPerPizza;
  const marginPct = ((marginPerPie / val) * 100).toFixed(0);
  elasticityMargin.innerText = `$${marginPerPie.toFixed(2)} (${marginPct}%)`;

  const delta = val - 16.00;
  let mult = 1.0;
  if (delta > 0) {
    mult = Math.max(0.35, 1.0 - (delta * 0.065));
  } else {
    mult = Math.min(1.85, 1.0 + (Math.abs(delta) * 0.09));
  }
  const pctTraffic = (mult * 100).toFixed(0);
  elasticityTraffic.innerText = `${pctTraffic}% of Normal`;

  if (val <= 12) {
    elasticityTraffic.className = "font-bold text-emerald-400";
    elasticitySummary.innerText = "Heavy rush! High risk of bottleneck walkouts";
  } else if (val >= 21) {
    elasticityTraffic.className = "font-bold text-rose-400";
    elasticitySummary.innerText = "Low traffic, but maximum profit per customer";
  } else {
    elasticityTraffic.className = "font-bold text-amber-300";
    elasticitySummary.innerText = "Balanced flow matching steady kitchen capacity";
  }
}

if (btnPricing) {
  btnPricing.addEventListener('click', () => {
    window.audio.init();
    priceSlider.value = state.menuPrice;
    updateElasticityDisplay(state.menuPrice);
    pricingModal.classList.remove('opacity-0', 'pointer-events-none');
    pricingModal.classList.add('opacity-100', 'pointer-events-auto');
  });
}

document.getElementById('btn-close-pricing').addEventListener('click', () => {
  pricingModal.classList.add('opacity-0', 'pointer-events-none');
  pricingModal.classList.remove('opacity-100', 'pointer-events-auto');
});

priceSlider.addEventListener('input', (e) => {
  updateElasticityDisplay(parseFloat(e.target.value));
});

document.getElementById('btn-apply-pricing').addEventListener('click', () => {
  state.menuPrice = parseFloat(priceSlider.value);
  gameState.save();
  window.audio.pop();
  showFloatingText(player.root.position, `Menu Price: $${state.menuPrice.toFixed(2)}`, "#facc15");
  pricingModal.classList.add('opacity-0', 'pointer-events-none');
  pricingModal.classList.remove('opacity-100', 'pointer-events-auto');
});

// 13. Bank Micro-Loan & Debt Servicing Handlers
const loanModal = document.getElementById('loan-modal');
const btnLoan = document.getElementById('btn-loan');

function openLoanModal() {
  window.audio.init();
  updateLoanModalDisplay();
  loanModal.classList.remove('opacity-0', 'pointer-events-none');
  loanModal.classList.add('opacity-100', 'pointer-events-auto');
}

function updateLoanModalDisplay() {
  const balEl = document.getElementById('loan-balance-display');
  if (balEl) balEl.innerText = `$${state.loanPrincipal.toFixed(2)}`;
}

if (btnLoan) btnLoan.addEventListener('click', openLoanModal);
document.getElementById('btn-close-loan').addEventListener('click', () => {
  loanModal.classList.add('opacity-0', 'pointer-events-none');
  loanModal.classList.remove('opacity-100', 'pointer-events-auto');
});

// Borrow $200 Micro-Loan
document.getElementById('btn-borrow-loan').addEventListener('click', () => {
  state.cash += 200;
  state.loanPrincipal += 200;
  state.totalLoanBorrowed += 200;
  gameState.save();
  window.audio.cashRegister();
  showFloatingText(player.root.position, "+$200 LOAN DISBURSED!", "#10b981");
  updateLoanModalDisplay();
});

// Repay $50 Principal
document.getElementById('btn-repay-loan').addEventListener('click', () => {
  if (state.loanPrincipal <= 0) {
    alert("You have no outstanding loan balance to repay!");
    return;
  }
  const repayment = Math.min(50, state.loanPrincipal);
  if (state.cash < repayment) {
    window.audio.warningBuzz();
    alert(`Need $${repayment.toFixed(2)} cash to make this loan repayment!`);
    return;
  }
  state.cash -= repayment;
  state.loanPrincipal -= repayment;
  gameState.save();
  window.audio.posCardTap();
  showFloatingText(bankZone.group.position, `-$${repayment.toFixed(2)} Debt Paid!`, "#38bdf8");
  updateLoanModalDisplay();
});

// 14. Phase 3: Founder Work-Life Dilemmas Engine
const dilemmaModal = document.getElementById('dilemma-modal');
const DILEMMAS = [
  {
    icon: "🎭",
    title: "Daughter's School Play",
    desc: "Your daughter has the lead role in her primary school play tonight during the dinner rush. Do you close early to be there, or keep baking to pay supplier invoices?",
    optA: { title: "Attend the Play (Close Early)", con: "+25 Morale · +20 Energy · -$15 Lost Sales", morale: 25, energy: 20, cash: -15 },
    optB: { title: "Stay Open for Rush", con: "+$35 Sales · -20 Morale · -15 Energy", morale: -20, energy: -15, cash: 35 },
  },
  {
    icon: "🏥",
    title: "Health & Fatigue Checkup",
    desc: "Your shoulders and lower back are aching from continuous dough kneading. Do you take tomorrow morning off for a physio clinic session, or push through the pain?",
    optA: { title: "Visit Clinic & Rest", con: "+40 Energy · +10 Morale · -$25 Clinic Fee", morale: 10, energy: 40, cash: -25 },
    optB: { title: "Work Through The Pain", con: "+$0 Spent · -30 Energy · Slower Movement", morale: -10, energy: -30, cash: 0 },
  },
  {
    icon: "🎂",
    title: "Partner's Birthday Dinner",
    desc: "It is your partner's birthday tonight. A local food critic just tweeted they might drop by around 8 PM. Where do your priorities lie?",
    optA: { title: "Cook Family Dinner at Home", con: "+30 Family Morale · +15 Energy", morale: 30, energy: 15, cash: 0 },
    optB: { title: "Wait for the Food Critic", con: "+$40 High-End Sales · -25 Morale · -20 Energy", morale: -25, energy: -20, cash: 40 },
  },
  {
    icon: "⚽",
    title: "Son's Football Championship",
    desc: "Your son's youth team reached the cup final on Saturday morning. The morning deliveries arrive at the same hour. What do you do?",
    optA: { title: "Cheer from the Sidelines", con: "+25 Family Morale · +20 Energy · -$10 Delay Fee", morale: 25, energy: 20, cash: -10 },
    optB: { title: "Unload Delivery Solo", con: "+$20 Saved · -20 Family Morale · -15 Energy", morale: -20, energy: -15, cash: 20 },
  }
];

let activeDilemma = null;
function triggerEndShiftDilemma() {
  const d = DILEMMAS[Math.floor(Math.random() * DILEMMAS.length)];
  activeDilemma = d;

  document.getElementById('dilemma-icon').innerText = d.icon;
  document.getElementById('dilemma-title').innerText = d.title;
  document.getElementById('dilemma-desc').innerText = d.desc;

  document.getElementById('dilemma-opt-a-title').innerText = d.optA.title;
  document.getElementById('dilemma-opt-a-consequence').innerText = d.optA.con;

  document.getElementById('dilemma-opt-b-title').innerText = d.optB.title;
  document.getElementById('dilemma-opt-b-consequence').innerText = d.optB.con;

  dilemmaModal.classList.remove('opacity-0', 'pointer-events-none');
  dilemmaModal.classList.add('opacity-100', 'pointer-events-auto');
  window.audio.upgradeFanfare();
}

function resolveDilemma(choice) {
  if (!activeDilemma) {
    // If modal was shown without activeDilemma, default to first dilemma
    activeDilemma = DILEMMAS[0];
  }
  const opt = choice === 'A' ? activeDilemma.optA : activeDilemma.optB;

  state.familyMorale = Math.max(0, Math.min(100, state.familyMorale + opt.morale));
  state.founderEnergy = Math.max(5, Math.min(100, state.founderEnergy + opt.energy));
  if (opt.cash !== 0) {
    state.cash = Math.max(0, state.cash + opt.cash);
  }

  gameState.save();
  window.audio.pop();
  showFloatingText(player.root.position, choice === 'A' ? "Priority: Life & Well-Being ❤️" : "Priority: Business Revenue 💼", "#f59e0b");

  dilemmaModal.classList.add('opacity-0', 'pointer-events-none');
  dilemmaModal.classList.remove('opacity-100', 'pointer-events-auto');
  activeDilemma = null;
}
window.resolveDilemma = resolveDilemma;

const btnOptA = document.getElementById('btn-dilemma-opt-a');
const btnOptB = document.getElementById('btn-dilemma-opt-b');
if (btnOptA) {
  ['click', 'pointerdown', 'touchend'].forEach(evt => {
    btnOptA.addEventListener(evt, (e) => {
      e.stopPropagation();
      resolveDilemma('A');
    });
  });
}
if (btnOptB) {
  ['click', 'pointerdown', 'touchend'].forEach(evt => {
    btnOptB.addEventListener(evt, (e) => {
      e.stopPropagation();
      resolveDilemma('B');
    });
  });
}

// 15. P&L Statement Handlers
const plModal = document.getElementById('pl-modal');
document.getElementById('btn-pl').addEventListener('click', () => {
  window.audio.init();
  document.getElementById('pl-sold-count').innerText = state.pizzasSold;
  document.getElementById('pl-rev').innerText = `$${state.totalRevenue.toFixed(2)}`;
  document.getElementById('pl-cogs').innerText = `-$${state.totalCOGS.toFixed(2)}`;
  document.getElementById('pl-fees').innerText = `-$${state.totalFees.toFixed(2)}`;

  const staffCount = (isChefWorkingToday() ? 1 : 0) + (isServerWorkingToday() ? 1 : 0);
  document.getElementById('pl-staff-count').innerText = staffCount;
  document.getElementById('pl-wages').innerText = `-$${state.totalWages.toFixed(2)}`;

  const plWaste = document.getElementById('pl-waste');
  if (plWaste) {
    const totalWaste = (state.spoiledCheeseBatches || 0) * 1.20;
    plWaste.innerText = `-$${totalWaste.toFixed(2)}`;
  }

  const plInterest = document.getElementById('pl-debt-interest');
  if (plInterest) {
    plInterest.innerText = `-$${state.totalDebtInterestPaid.toFixed(2)}`;
  }

  const laborRatio = gameState.getLaborRatio();
  const laborRatioEl = document.getElementById('pl-labor-ratio');
  laborRatioEl.innerText = `${laborRatio.toFixed(1)}%`;
  if (laborRatio >= 25 && laborRatio <= 35) {
    laborRatioEl.className = "font-mono font-bold text-emerald-400";
  } else if (laborRatio > 45) {
    laborRatioEl.className = "font-mono font-bold text-rose-400";
  } else {
    laborRatioEl.className = "font-mono font-bold text-amber-400";
  }

  const netProfit = gameState.getNetProfit();
  const netEl = document.getElementById('pl-net');
  netEl.innerText = `${netProfit >= 0 ? '$' : '-$'}${Math.abs(netProfit).toFixed(2)}`;
  netEl.className = `font-fredoka text-base ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

  plModal.classList.add('active');
});

document.getElementById('btn-close-pl').addEventListener('click', () => {
  plModal.classList.remove('active');
});
document.getElementById('btn-confirm-pl').addEventListener('click', () => {
  plModal.classList.remove('active');
});

// Sound toggle
document.getElementById('btn-sound').addEventListener('click', () => {
  window.audio.enabled = !window.audio.enabled;
  document.getElementById('sound-icon').textContent = window.audio.enabled ? '🔊' : '🔇';
});

// Reset progress button
const btnReset = document.getElementById('btn-reset');
if (btnReset) {
  btnReset.addEventListener('click', () => {
    if (confirm("Reset pizzeria data and start fresh?")) {
      gameState.reset();
      window.location.reload();
    }
  });
}

// Start 60 FPS animation loop
requestAnimationFrame(animate);
