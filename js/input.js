// Input Handling Module: Virtual Joystick (Touch) & Keyboard controls
(function(window) {
  'use strict';

  const joyBase = document.getElementById('joystick-base');
  const joyStick = document.getElementById('joystick-stick');
  const joyZone = document.getElementById('joystick-zone');

  const input = { x: 0, y: 0, active: false };
  let joyTouchId = null;
  let joyCenter = { x: 0, y: 0 };
  const maxRadius = 45;

  // Listen on window for pointerdown, but ignore if hitting active modals, header, or footer
  window.addEventListener('pointerdown', (e) => {
    // Check if clicking inside interactive overlays
    if (e.target.closest('#dilemma-modal, #pl-modal, #rota-modal, #marketing-modal, #supply-modal, #pricing-modal, #loan-modal, header, footer, button, input')) {
      return;
    }
    // Check if any modal is currently visible
    if (window.ModalManager) {
      if (window.ModalManager.isSupplyOpen() || window.ModalManager.isPricingOpen() ||
          window.ModalManager.isLoanOpen() || window.ModalManager.isRotaOpen() ||
          window.ModalManager.isMarketingOpen() || window.ModalManager.isDilemmaOpen() ||
          window.ModalManager.isPLOpen()) {
        return;
      }
    }

    if (window.audio) window.audio.init();
    joyTouchId = e.pointerId;
    input.active = true;
    joyCenter = { x: e.clientX, y: e.clientY };
    if (joyBase) {
      joyBase.style.left = `${e.clientX}px`;
      joyBase.style.top = `${e.clientY}px`;
      joyBase.style.display = 'block';
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!input.active || e.pointerId !== joyTouchId) return;
    const dx = e.clientX - joyCenter.x;
    const dy = e.clientY - joyCenter.y;
    const dist = Math.min(Math.hypot(dx, dy), maxRadius);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * dist;
    const stickY = Math.sin(angle) * dist;
    if (joyStick) {
      joyStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
    }

    const nx = stickX / maxRadius;
    const ny = stickY / maxRadius;
    // 45-degree isometric projection transform
    input.x = (nx + ny) * 0.7071;
    input.y = (ny - nx) * 0.7071;
  });

  const resetJoystick = () => {
    input.active = false;
    input.x = 0;
    input.y = 0;
    if (joyBase) joyBase.style.display = 'none';
    joyTouchId = null;
  };
  window.addEventListener('pointerup', resetJoystick);
  window.addEventListener('pointercancel', resetJoystick);

  // Keyboard controls (WASD / Arrows)
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (window.audio) window.audio.init();
    keys[e.key.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

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

  function getMovementVector() {
    const kbd = getKeyboardInput();
    if (kbd) return kbd;
    return { x: input.x, y: input.y };
  }

  window.GameInput = {
    input,
    getMovementVector,
    resetJoystick,
  };

})(window);
