// UI Manager: Top HUD, Objective Banners, Floating Feedback Text, and Capital Card Drawer
(function(window) {
  'use strict';

  const hudCash = document.getElementById('cash-amount');
  const hudSold = document.getElementById('hud-sold');
  const hudTickets = document.getElementById('hud-tickets');
  const capitalCard = document.getElementById('capital-card');
  const capitalDetails = document.getElementById('capital-card-details');
  const capitalToggleIcon = document.getElementById('capital-toggle-icon');
  const hudSoldMini = document.getElementById('hud-sold-mini');
  const hudEnergyMini = document.getElementById('hud-energy-mini');
  const stepBadge = document.getElementById('step-badge');
  const stepDesc = document.getElementById('step-desc');

  // Interactive Capital Card toggle (compact summary vs detailed view)
  if (capitalCard && capitalDetails) {
    capitalCard.addEventListener('click', () => {
      const isHidden = capitalDetails.classList.contains('hidden');
      if (isHidden) {
        capitalDetails.classList.remove('hidden');
        capitalDetails.classList.add('flex');
        if (capitalToggleIcon) capitalToggleIcon.innerText = '▴';
      } else {
        capitalDetails.classList.add('hidden');
        capitalDetails.classList.remove('flex');
        if (capitalToggleIcon) capitalToggleIcon.innerText = '▾';
      }
    });
  }

  function showFloatingText(worldPos, text, color = '#ffffff') {
    if (!window.gameScene || !window.gameScene.camera) return;
    const el = document.createElement('div');
    el.className = 'float-text';
    el.innerText = text;
    el.style.color = color;

    const tempV = new THREE.Vector3().copy(worldPos);
    tempV.y += 1.8;
    tempV.project(window.gameScene.camera);
    el.style.left = `${(tempV.x * 0.5 + 0.5) * window.innerWidth}px`;
    el.style.top = `${(-(tempV.y * 0.5) + 0.5) * window.innerHeight}px`;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1250);
  }
  window.showFloatingText = showFloatingText;

  function updateHUD() {
    if (hudCash) hudCash.innerText = Math.max(0, state.cash).toFixed(2);
    if (hudSold) hudSold.innerText = state.pizzasSold;
    if (hudSoldMini) hudSoldMini.innerText = state.pizzasSold;
    if (hudTickets) hudTickets.innerText = state.orderTickets;

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
      if (hudEnergyMini) hudEnergyMini.innerText = `${e}%`;
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
      const dayName = window.DAY_NAMES ? window.DAY_NAMES[state.dayIndex] : 'Mon';
      dayBadge.innerText = `${dayName} (W${weekNum} D${state.monthDay})`;
      if (weekNum === 4) {
        dayBadge.className = "font-bold text-emerald-400";
      } else {
        dayBadge.className = "font-bold text-amber-400";
      }
    }
  }

  function updateObjectiveBanner(customers) {
    if (!stepBadge || !stepDesc) return;
    const hasCustWaiting = customers && customers.length > 0 && customers[0].state === 'waiting_order';

    if (!state.chefHired && !state.serverHired) {
      if (state.orderTickets === 0 && hasCustWaiting) {
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

  window.UIManager = {
    updateHUD,
    updateObjectiveBanner,
    showFloatingText,
  };

})(window);
