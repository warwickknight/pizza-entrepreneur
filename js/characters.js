// Character generators, Box meshes, and Customer Archetypes
const boxMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
const boxRedPrintMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

function createPizzaBoxMesh() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.85), boxMat);
  b.castShadow = true;
  const logo = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), boxRedPrintMat);
  logo.position.y = 0.09;
  g.add(b);
  g.add(logo);
  return g;
}

function createChibiHuman(scene, bodyColor, hatType = 'none', scale = 1.0, hairColor = 0x3e2723) {
  const charGroup = new THREE.Group();

  // Dynamic Contact Shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55 * scale, 16),
    new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.38 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.22;
  charGroup.add(shadow);

  // Torso / Shirt
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38 * scale, 0.44 * scale, 0.9 * scale, 14),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55 })
  );
  body.position.y = 0.85 * scale;
  body.castShadow = true;
  body.receiveShadow = true;
  charGroup.add(body);

  // Apron (if chef or server)
  const isWorker = (hatType === 'chef' || hatType === 'cap');
  if (isWorker) {
    const apronMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(0.38 * scale, 0.62 * scale), apronMat);
    apron.position.set(0, 0.85 * scale, 0.43 * scale);
    charGroup.add(apron);

    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.32 * scale, 0.05 * scale, 0.04 * scale), apronMat);
    strap.position.set(0, 1.18 * scale, 0.38 * scale);
    charGroup.add(strap);
  }

  // Head
  const headGeo = new THREE.SphereGeometry(0.42 * scale, 18, 18);
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.55 });
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.62 * scale;
  head.castShadow = true;
  charGroup.add(head);

  // Hair Toupee & Bangs
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.7 });
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.44 * scale, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
  hairBack.position.set(0, 1.66 * scale, -0.04 * scale);
  charGroup.add(hairBack);

  const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.48 * scale, 0.16 * scale, 0.22 * scale), hairMat);
  hairBangs.position.set(0, 1.90 * scale, 0.32 * scale);
  charGroup.add(hairBangs);

  // Expressive Anime Eyes (Glossy black pupils + white highlight reflection)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-0.14, 0.14].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065 * scale, 8, 8), eyeMat);
    eye.scale.set(1, 1.3, 0.6);
    eye.position.set(x * scale, 1.66 * scale, 0.39 * scale);
    charGroup.add(eye);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.025 * scale, 6, 6), glintMat);
    glint.position.set((x + 0.02) * scale, 1.70 * scale, 0.42 * scale);
    charGroup.add(glint);
  });

  // Rosy Cheek Blushes
  const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.65 });
  [-0.23, 0.23].forEach(x => {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.06 * scale, 8), blushMat);
    blush.position.set(x * scale, 1.54 * scale, 0.40 * scale);
    charGroup.add(blush);
  });

  // Friendly Smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05 * scale, 0.015 * scale, 6, 8, Math.PI), eyeMat);
  smile.rotation.z = Math.PI;
  smile.position.set(0, 1.51 * scale, 0.41 * scale);
  charGroup.add(smile);

  // Hats
  if (hatType === 'chef') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.36 * scale, 0.36 * scale, 0.25 * scale, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    stem.position.y = 1.98 * scale;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.48 * scale, 14, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
    puff.position.y = 2.18 * scale;
    charGroup.add(stem);
    charGroup.add(puff);
  } else if (hatType === 'cap') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44 * scale, 0.45 * scale, 0.18 * scale, 14), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    cap.position.y = 1.94 * scale;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5 * scale, 0.05 * scale, 0.3 * scale), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    visor.position.set(0, 1.88 * scale, 0.42 * scale);
    charGroup.add(cap);
    charGroup.add(visor);
  } else if (hatType === 'commuter_hat') {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.45 * scale, 0.24 * scale, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
    hat.position.y = 2.02 * scale;
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.46 * scale, 0.46 * scale, 0.06 * scale, 14), new THREE.MeshStandardMaterial({ color: 0xb91c1c }));
    ribbon.position.y = 1.93 * scale;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.66 * scale, 0.66 * scale, 0.04 * scale, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }));
    brim.position.y = 1.90 * scale;
    charGroup.add(hat);
    charGroup.add(ribbon);
    charGroup.add(brim);
  }

  // Legs & Shoes
  const legGeo = new THREE.CylinderGeometry(0.12 * scale, 0.12 * scale, 0.5 * scale, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });

  const leftLeg = new THREE.Mesh(legGeo, legMat); leftLeg.position.set(-0.2 * scale, 0.32 * scale, 0);
  const rightLeg = new THREE.Mesh(legGeo, legMat); rightLeg.position.set(0.2 * scale, 0.32 * scale, 0);

  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22 * scale, 0.14 * scale, 0.32 * scale), shoeMat);
  leftShoe.position.set(-0.2 * scale, 0.07 * scale, 0.05 * scale);
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22 * scale, 0.14 * scale, 0.32 * scale), shoeMat);
  rightShoe.position.set(0.2 * scale, 0.07 * scale, 0.05 * scale);

  charGroup.add(leftLeg); charGroup.add(rightLeg);
  charGroup.add(leftShoe); charGroup.add(rightShoe);

  // Arms & Hands
  const armGeo = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 0.55 * scale, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.6 });
  const handGeo = new THREE.SphereGeometry(0.11 * scale, 8, 8);

  const leftArm = new THREE.Mesh(armGeo, armMat); leftArm.position.set(-0.52 * scale, 0.85 * scale, 0);
  const leftHand = new THREE.Mesh(handGeo, skinMat); leftHand.position.set(0, -0.28 * scale, 0);
  leftArm.add(leftHand);

  const rightArm = new THREE.Mesh(armGeo, armMat); rightArm.position.set(0.52 * scale, 0.85 * scale, 0);
  const rightHand = new THREE.Mesh(handGeo, skinMat); rightHand.position.set(0, -0.28 * scale, 0);
  rightArm.add(rightHand);

  charGroup.add(leftArm); charGroup.add(rightArm);

  scene.add(charGroup);
  return { root: charGroup, head, leftLeg, rightLeg, leftArm, rightArm, leftShoe, rightShoe, scale };
}

// 3 Archetypes as designated in Phase 1:
// 1. Regular: vibrant emerald green, standard speed, 1 pie, normal patience
// 2. Impatient Commuter: electric cyan-blue, fast walking, strict patience timer, commuter fedora
// 3. Bulk Family Order: rich vivid amber-orange, slower walking, 2 pies, gives larger tip
const ARCHETYPES = [
  { type: 'regular', name: 'Regular', color: 0x10b981, hat: 'none', hairColor: 0x7c2d12, speed: 3.5, orderPies: 1, maxPatience: 35, scale: 1.0 },
  { type: 'commuter', name: 'Commuter', color: 0x06b6d4, hat: 'commuter_hat', hairColor: 0x18181b, speed: 4.6, orderPies: 1, maxPatience: 18, scale: 0.95 },
  { type: 'family', name: 'Family', color: 0xf59e0b, hat: 'none', hairColor: 0xd97706, speed: 2.8, orderPies: 2, maxPatience: 45, scale: 1.15 },
];

class Customer {
  constructor(index, gameScene, bubbleContainer) {
    this.index = index;
    this.gameScene = gameScene;
    this.bubbleContainer = bubbleContainer;

    const chosen = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    this.archetype = chosen;
    this.orderPies = chosen.orderPies;
    this.remainingPies = chosen.orderPies;
    this.speed = chosen.speed;
    this.patience = chosen.maxPatience;
    this.maxPatience = chosen.maxPatience;

    this.char = createChibiHuman(gameScene.scene, chosen.color, chosen.hat, chosen.scale, chosen.hairColor);
    this.char.root.position.set(-12 - (index * 2), 0, 7.5);
    this.state = 'walk_to_counter';
    this.walkCycle = Math.random() * 10;

    // Families arrive with a child who tags along
    if (chosen.type === 'family') {
      this.child = createChibiHuman(gameScene.scene, 0xec4899, 'none', 0.62, 0x3e2723);
      this.child.root.position.copy(this.char.root.position).add(new THREE.Vector3(0.9, 0, -0.3));
    }

    this.bubble = document.createElement('div');
    this.bubble.className = 'world-bubble bubble-order';
    this.bubble.innerHTML = this.moodHTML();
    this.bubbleContainer.appendChild(this.bubble);
  }

  // Happy face while patience is above 50%, angry below. Commuters get a clock icon.
  isAngry() {
    return (this.patience / this.maxPatience) < 0.5;
  }

  moodHTML(extra = '') {
    const clock = this.archetype.type === 'commuter' ? '⏰ ' : '';
    return `${clock}${this.isAngry() ? '😠' : '😊'}${extra ? ' ' + extra : ''}`;
  }

  setMoodBubble(extra = '') {
    this.bubble.className = 'world-bubble ' + (this.isAngry() ? 'bubble-angry' : 'bubble-order');
    this.bubble.innerHTML = this.moodHTML(extra);
  }

  update(dt, camera) {
    this.walkCycle += dt * 10;
    const queueSlotZ = 4.8 + (this.index * 1.6);

    // Patience countdown while waiting in queue
    if (this.state === 'waiting_order' || this.state === 'waiting_pizza') {
      this.patience -= dt;
      if (this.patience <= 0) {
        // Customer storm-out due to operational bottleneck!
        this.state = 'leaving';
        this.stormed = true;
        this.bubble.className = 'world-bubble bubble-angry';
        this.bubble.innerHTML = '😠';
        window.audio.warningBuzz();
        // Return false to remove from active customer queue and hand over to departing list
        window.departingCustomers && window.departingCustomers.push(this);
        return false;
      }
    }

    // Weather check: when it rains, customers outdoors run home!
    const isRaining = window.state && (window.state.currentWeather === 'rainy' || window.state.currentWeather === 'storm');
    if (isRaining && this.state !== 'leaving') {
      if (this.state === 'walk_to_table' || this.state === 'eating_at_table') {
        if (this.diningPizza && window.removeTablePizza) {
          window.removeTablePizza(this.diningPizza);
          this.diningPizza = null;
        }
        if (this.tableSlot) {
          this.tableSlot.occupied = false;
          if (window.onTableMess) window.onTableMess(this.tableSlot);
        }
        this.state = 'leaving';
        this.fleeingRain = true;
        this.bubble.className = 'world-bubble bubble-angry';
        this.bubble.innerHTML = '🌧️🏃';
        window.departingCustomers && window.departingCustomers.push(this);
        return false;
      } else if (this.state === 'walk_to_counter' || this.state === 'waiting_order') {
        this.state = 'leaving';
        this.fleeingRain = true;
        this.bubble.className = 'world-bubble bubble-angry';
        this.bubble.innerHTML = '🌧️🏠';
        window.departingCustomers && window.departingCustomers.push(this);
        return false;
      }
    }

    if (this.state === 'walk_to_counter') {
      const dest = new THREE.Vector3(0, 0, queueSlotZ);
      this.moveTowards(dest, this.speed, dt);
      if (this.char.root.position.distanceTo(dest) < 0.2) {
        if (this.index === 0) {
          this.state = 'waiting_order';
          this.setMoodBubble('🍕'.repeat(this.orderPies));
        } else {
          this.setMoodBubble();
        }
      }
    } else if (this.state === 'waiting_order') {
      // Step forward if queue moved up
      const dest = new THREE.Vector3(0, 0, queueSlotZ);
      if (this.char.root.position.distanceTo(dest) > 0.25) {
        this.moveTowards(dest, this.speed, dt);
      } else {
        this.idleAnimation();
      }
      if (this.index === 0) {
        this.setMoodBubble('🍕'.repeat(this.orderPies));
      } else {
        this.setMoodBubble();
      }
    } else if (this.state === 'waiting_pizza') {
      const dest = new THREE.Vector3(0, 0, queueSlotZ);
      if (this.char.root.position.distanceTo(dest) > 0.25) {
        this.moveTowards(dest, this.speed, dt);
      } else {
        this.idleAnimation();
      }
      this.setMoodBubble('🔥' + '🍕'.repeat(this.remainingPies));
    } else if (this.state === 'walk_to_table') {
      const chairX = this.tableSlot ? this.tableSlot.chairX : 10.0;
      const chairZ = this.tableSlot ? this.tableSlot.chairZ : -3.2;
      const tableChairPos = new THREE.Vector3(chairX, 0, chairZ);
      this.moveTowards(tableChairPos, 3.2, dt);
      if (this.char.root.position.distanceTo(tableChairPos) < 0.25) {
        this.state = 'eating_at_table';
        this.eatDuration = 6.0;
        this.eatTimer = this.eatDuration;
        this.bubble.className = 'world-bubble bubble-done';
        this.bubble.innerHTML = '🍕';
        this.char.root.rotation.y = Math.PI / 2; // Face the dining table
        this.char.leftArm.rotation.x = -0.7;
        this.char.rightArm.rotation.x = -0.7;
        if (window.spawnTablePizza && this.tableSlot) {
          this.diningPizza = window.spawnTablePizza(this.tableSlot);
        }
      }
    } else if (this.state === 'eating_at_table') {
      this.eatTimer -= dt;
      const progress = Math.max(0, Math.min(1, 1 - (this.eatTimer / (this.eatDuration || 6.0))));
      if (this.diningPizza && window.updateTablePizzaSlices) {
        window.updateTablePizzaSlices(this.diningPizza, progress);
      }
      // Gentle eating animation (head bob & munching)
      this.char.head.rotation.x = Math.sin(this.walkCycle * 0.8) * 0.12;
      this.char.leftArm.rotation.x = -0.7 + Math.sin(this.walkCycle * 0.6) * 0.15;
      this.char.rightArm.rotation.x = -0.7 - Math.sin(this.walkCycle * 0.6) * 0.15;

      if (this.eatTimer <= 0) {
        this.state = 'leaving';
        this.char.head.rotation.x = 0;
        this.bubble.className = 'world-bubble bubble-done';
        this.bubble.innerHTML = '😋';
        if (this.diningPizza && window.removeTablePizza) {
          window.removeTablePizza(this.diningPizza);
          this.diningPizza = null;
        }
        if (this.tableSlot) {
          this.tableSlot.occupied = false;
          if (window.onTableMess) window.onTableMess(this.tableSlot);
        }
      }
    } else if (this.state === 'leaving') {
      const exitDest = new THREE.Vector3(18.5, 0, 7.5);
      const leaveSpeed = this.fleeingRain ? 5.8 : 3.8;
      this.moveTowards(exitDest, leaveSpeed, dt);

      if (this.fleeingRain) {
        // Running in the rain: hands shielding head
        this.char.leftArm.rotation.x = -1.6;
        this.char.rightArm.rotation.x = -1.6;
      }

      // Takeaway customers sometimes drop litter on the way out
      if (!this.dineIn && !this.stormed && !this.fleeingRain && !this.litterChecked && this.char.root.position.x > 1.5) {
        this.litterChecked = true;
        if (Math.random() < 0.5 && window.spawnLitter) window.spawnLitter(this.char.root.position);
      }
      if (!this.stormed && !this.fleeingRain && this.bubble.className !== 'world-bubble bubble-done') {
        this.bubble.className = 'world-bubble bubble-done';
        this.bubble.innerHTML = '😋';
      }

      // Customer carries their purchased pizza box(es) happily (if takeaway)
      if (!this.dineIn && this.bubble.className === 'world-bubble bubble-done' && !this.carriedBoxesAttached) {
        this.carriedBoxesAttached = true;
        this.carriedBoxes = [];
        const scale = this.char.scale || 1.0;
        for (let i = 0; i < this.orderPies; i++) {
          const box = createPizzaBoxMesh();
          box.scale.setScalar(scale);
          box.position.set(0, (0.88 * scale) + (i * 0.20 * scale), 0.50 * scale);
          this.char.root.add(box);
          this.carriedBoxes.push(box);
        }
      }

      if (this.char.root.position.distanceTo(exitDest) < 0.6) {
        this.destroy();
        return false;
      }
    }

    this.updateChild(dt);
    this.updateBubblePos(camera);
    return true;
  }

  // Child trails beside the parent, mirroring walk/idle
  updateChild(dt) {
    if (!this.child) return;
    const c = this.child.root;
    const target = new THREE.Vector3(0.9, 0, -0.3).add(this.char.root.position);
    target.y = 0;
    const before = c.position.clone();
    c.position.lerp(target, Math.min(1, dt * 6));
    const moved = c.position.distanceTo(before) / Math.max(dt, 0.0001);
    c.rotation.y = this.char.root.rotation.y;
    if (moved > 0.4) {
      const s = Math.sin(this.walkCycle * 1.3) * 0.6;
      this.child.leftLeg.rotation.x = s;
      this.child.rightLeg.rotation.x = -s;
    } else {
      this.child.leftLeg.rotation.x = 0;
      this.child.rightLeg.rotation.x = 0;
    }
  }

  moveTowards(dest, speed, dt) {
    const dir = new THREE.Vector3().subVectors(dest, this.char.root.position);
    dir.y = 0;
    if (dir.length() > 0.05) {
      dir.normalize();
      this.char.root.position.addScaledVector(dir, speed * dt);
      this.char.root.rotation.y = Math.atan2(dir.x, dir.z);
      this.char.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.6;
      this.char.rightLeg.rotation.x = -Math.sin(this.walkCycle) * 0.6;

      if (this.carriedBoxesAttached) {
        // Carry posture: hold hands forward and wobble boxes slightly
        this.char.leftArm.rotation.x = -1.1;
        this.char.rightArm.rotation.x = -1.1;
        if (this.carriedBoxes) {
          this.carriedBoxes.forEach((b, i) => {
            b.rotation.z = Math.sin(this.walkCycle) * (0.04 + i * 0.02);
          });
        }
      } else {
        this.char.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.5;
        this.char.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.5;
      }
    }
  }

  idleAnimation() {
    this.char.leftLeg.rotation.x = 0;
    this.char.rightLeg.rotation.x = 0;
    this.char.leftArm.rotation.x = 0;
    this.char.rightArm.rotation.x = 0;
    this.char.root.position.y = Math.sin(this.walkCycle * 0.5) * 0.03;
    this.char.head.rotation.z = Math.sin(this.walkCycle * 0.25) * 0.04;
  }

  updateBubblePos(camera) {
    const tempV = new THREE.Vector3();
    this.char.head.getWorldPosition(tempV);
    tempV.y += 0.8 * this.char.scale;
    tempV.project(camera);
    const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;
    this.bubble.style.left = `${x}px`;
    this.bubble.style.top = `${y}px`;
  }

  destroy() {
    if (this.bubble && this.bubble.parentNode) this.bubble.parentNode.removeChild(this.bubble);
    this.gameScene.scene.remove(this.char.root);
    if (this.child) this.gameScene.scene.remove(this.child.root);
    if (this.diningPizza && window.removeTablePizza) {
      window.removeTablePizza(this.diningPizza);
      this.diningPizza = null;
    }
    if (this.tableSlot) {
      this.tableSlot.occupied = false;
    }
  }
}

window.createChibiHuman = createChibiHuman;
window.createPizzaBoxMesh = createPizzaBoxMesh;
window.Customer = Customer;
