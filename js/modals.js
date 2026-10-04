// UI & Modal Management Module: Supply, Pricing, Bank Loan, Staff Rota, Marketing, Dilemmas, P&L Statement
(function(window) {
  'use strict';

  // Cooldown timers (in seconds) to prevent proximity triggers from instantly reopening modals on close
  const cooldowns = {
    rota: 0,
    marketing: 0,
    supply: 0,
    loan: 0,
    dilemma: 0,
  };

  // Helper to open/close modals smoothly
  function showModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('opacity-0', 'pointer-events-none');
    modalEl.classList.add('opacity-100', 'pointer-events-auto');
  }

  function hideModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('opacity-0', 'pointer-events-none');
    modalEl.classList.remove('opacity-100', 'pointer-events-auto');
  }

  function isModalOpen(modalEl) {
    return modalEl && modalEl.classList.contains('opacity-100');
  }

  // --- 1. Supply Chain & Restock Modal ---
  const supplyModal = document.getElementById('supply-modal');
  const btnSupply = document.getElementById('btn-supply');
  const btnCloseSupply = document.getElementById('btn-close-supply');
  const btnDailyBatch = document.getElementById('btn-buy-daily-batch');
  const btnWholesalePallet = document.getElementById('btn-buy-wholesale-pallet');
  const btnBuyFridge = document.getElementById('btn-buy-fridge');

  function openSupplyModal() {
    if (window.audio) window.audio.init();
    updateSupplyModalStock();
    showModal(supplyModal);
  }

  function closeSupplyModal() {
    hideModal(supplyModal);
    cooldowns.supply = 3.5;
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
  if (btnCloseSupply) btnCloseSupply.addEventListener('click', closeSupplyModal);

  if (btnDailyBatch) {
    btnDailyBatch.addEventListener('click', () => {
      if (state.cash < 22) {
        if (window.audio) window.audio.warningBuzz();
        if (window.showFloatingText && window.player) {
          window.showFloatingText(window.player.root.position, "Need $22.00 for Daily Batch!", "#ef4444");
        }
        return;
      }
      state.cash -= 22;
      state.inventory.dough = Math.min(state.maxInventoryCapacity, state.inventory.dough + 10);
      state.inventory.sauce = Math.min(state.maxInventoryCapacity, state.inventory.sauce + 10);
      state.inventory.cheese = Math.min(state.maxInventoryCapacity, state.inventory.cheese + 10);
      gameState.save();
      if (window.audio) window.audio.cashRegister();
      if (window.showFloatingText && window.player) {
        window.showFloatingText(window.player.root.position, "+10 Ingredients Restocked!", "#10b981");
      }
      updateSupplyModalStock();
    });
  }

  if (btnWholesalePallet) {
    btnWholesalePallet.addEventListener('click', () => {
      if (state.cash < 49) {
        if (window.audio) window.audio.warningBuzz();
        if (window.showFloatingText && window.player) {
          window.showFloatingText(window.player.root.position, "Need $49.00 for Wholesale Pallet!", "#ef4444");
        }
        return;
      }
      state.cash -= 49;
      state.inventory.dough = Math.min(state.maxInventoryCapacity, state.inventory.dough + 35);
      state.inventory.sauce = Math.min(state.maxInventoryCapacity, state.inventory.sauce + 35);
      state.inventory.cheese = Math.min(state.maxInventoryCapacity, state.inventory.cheese + 35);
      gameState.save();
      if (window.audio) window.audio.upgradeFanfare();
      if (window.showFloatingText && window.supplyZone) {
        window.showFloatingText(window.supplyZone.group.position, "📦 WHOLESALE PALLET DELIVERED!", "#f59e0b");
      }
      updateSupplyModalStock();
    });
  }

  if (btnBuyFridge) {
    btnBuyFridge.addEventListener('click', () => {
      if (state.hasRefrigeration) return;
      if (state.cash < 30) {
        if (window.audio) window.audio.warningBuzz();
        if (window.showFloatingText && window.player) {
          window.showFloatingText(window.player.root.position, "Need $30.00 for Walk-in Cooler!", "#ef4444");
        }
        return;
      }
      state.cash -= 30;
      state.hasRefrigeration = true;
      gameState.save();
      if (window.audio) window.audio.upgradeFanfare();
      if (window.showFloatingText && window.player) {
        window.showFloatingText(window.player.root.position, "❄️ WALK-IN COOLER INSTALLED!", "#38bdf8");
      }
      updateSupplyModalStock();
    });
  }

  // --- 2. Menu Pricing Elasticity Modal ---
  const pricingModal = document.getElementById('pricing-modal');
  const btnPricing = document.getElementById('btn-pricing');
  const btnClosePricing = document.getElementById('btn-close-pricing');
  const btnApplyPricing = document.getElementById('btn-apply-pricing');
  const priceSlider = document.getElementById('price-slider');
  const sliderPriceDisplay = document.getElementById('slider-price-display');
  const elasticityTraffic = document.getElementById('elasticity-traffic');
  const elasticityMargin = document.getElementById('elasticity-margin');
  const elasticitySummary = document.getElementById('elasticity-summary');

  function openPricingModal() {
    if (window.audio) window.audio.init();
    if (priceSlider) priceSlider.value = state.menuPrice;
    updateElasticityDisplay(state.menuPrice);
    showModal(pricingModal);
  }

  function closePricingModal() {
    hideModal(pricingModal);
  }

  function updateElasticityDisplay(val) {
    if (!sliderPriceDisplay) return;
    sliderPriceDisplay.innerText = `$${val.toFixed(2)}`;
    const marginPerPie = val - state.costPerPizza;
    const marginPct = ((marginPerPie / val) * 100).toFixed(0);
    if (elasticityMargin) elasticityMargin.innerText = `$${marginPerPie.toFixed(2)} (${marginPct}%)`;

    const delta = val - 16.00;
    let mult = 1.0;
    if (delta > 0) {
      mult = Math.max(0.35, 1.0 - (delta * 0.065));
    } else {
      mult = Math.min(1.85, 1.0 + (Math.abs(delta) * 0.09));
    }
    const pctTraffic = (mult * 100).toFixed(0);
    if (elasticityTraffic) elasticityTraffic.innerText = `${pctTraffic}% of Normal`;

    if (elasticityTraffic && elasticitySummary) {
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
  }

  if (btnPricing) btnPricing.addEventListener('click', openPricingModal);
  if (btnClosePricing) btnClosePricing.addEventListener('click', closePricingModal);

  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      updateElasticityDisplay(parseFloat(e.target.value));
    });
  }

  if (btnApplyPricing) {
    btnApplyPricing.addEventListener('click', () => {
      state.menuPrice = parseFloat(priceSlider.value);
      gameState.save();
      if (window.audio) window.audio.pop();
      if (window.showFloatingText && window.player) {
        window.showFloatingText(window.player.root.position, `Menu Price: $${state.menuPrice.toFixed(2)}`, "#facc15");
      }
      closePricingModal();
    });
  }

  // --- 3. Bank Loan & Debt Servicing Modal ---
  const loanModal = document.getElementById('loan-modal');
  const btnLoan = document.getElementById('btn-loan');
  const btnCloseLoan = document.getElementById('btn-close-loan');
  const btnBorrowLoan = document.getElementById('btn-borrow-loan');
  const btnRepayLoan = document.getElementById('btn-repay-loan');

  const btnBorrowCommercial = document.getElementById('btn-borrow-commercial');
  const btnRepayLarge = document.getElementById('btn-repay-large');

  function openLoanModal() {
    if (window.audio) window.audio.init();
    updateLoanModalDisplay();
    showModal(loanModal);
  }

  function closeLoanModal() {
    hideModal(loanModal);
    cooldowns.loan = 3.5;
  }

  function updateLoanModalDisplay() {
    const balEl = document.getElementById('loan-balance-display');
    if (balEl) {
      if (state.loanPrincipal > 0) {
        balEl.innerText = `-$${state.loanPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        balEl.innerText = "$0.00";
      }
    }
  }

  if (btnLoan) btnLoan.addEventListener('click', openLoanModal);
  if (btnCloseLoan) btnCloseLoan.addEventListener('click', closeLoanModal);

  function borrowAmount(amt, label) {
    state.cash += amt;
    state.loanPrincipal += amt;
    state.totalLoanBorrowed += amt;
    gameState.save();
    if (window.audio) window.audio.cashRegister();
    if (window.showFloatingText && window.player) {
      window.showFloatingText(window.player.root.position, `+$${amt} ${label} DISBURSED!`, "#10b981");
    }
    updateLoanModalDisplay();
  }

  function repayAmount(amt) {
    if (state.loanPrincipal <= 0) {
      if (window.showFloatingText && window.player) {
        window.showFloatingText(window.player.root.position, "No loan balance to repay!", "#94a3b8");
      }
      return;
    }
    const repayment = Math.min(amt, state.loanPrincipal);
    if (state.cash < repayment) {
      if (window.audio) window.audio.warningBuzz();
      if (window.showFloatingText && window.player) {
        window.showFloatingText(window.player.root.position, `Need $${repayment.toFixed(2)} to repay!`, "#ef4444");
      }
      return;
    }
    state.cash -= repayment;
    state.loanPrincipal -= repayment;
    gameState.save();
    if (window.audio) window.audio.posCardTap();
    if (window.showFloatingText && window.bankZone) {
      window.showFloatingText(window.bankZone.group.position, `-$${repayment.toFixed(2)} Debt Paid!`, "#38bdf8");
    }
    updateLoanModalDisplay();
  }

  if (btnBorrowLoan) {
    btnBorrowLoan.addEventListener('click', () => borrowAmount(500, "MICRO-LOAN"));
  }
  if (btnBorrowCommercial) {
    btnBorrowCommercial.addEventListener('click', () => borrowAmount(2000, "COMMERCIAL LOAN"));
  }

  if (btnRepayLoan) {
    btnRepayLoan.addEventListener('click', () => repayAmount(250));
  }
  if (btnRepayLarge) {
    btnRepayLarge.addEventListener('click', () => repayAmount(1000));
  }

  // --- 4. Staff Rota Clipboard Modal ---
  const rotaModal = document.getElementById('rota-modal');
  const btnRota = document.getElementById('btn-rota');
  const btnCloseRota = document.getElementById('btn-close-rota');
  const btnConfirmRota = document.getElementById('btn-confirm-rota');

  function openRotaModal() {
    if (window.audio) window.audio.init();
    renderRotaModal();
    showModal(rotaModal);
  }

  function closeRotaModal() {
    hideModal(rotaModal);
    cooldowns.rota = 3.5;
    gameState.save();
  }
  window.onCloseRotaModal = closeRotaModal;

  function renderRotaModal() {
    const forecastGrid = document.getElementById('forecast-grid');
    if (!forecastGrid) return;
    forecastGrid.innerHTML = '';
    const iconMap = { sunny: '☀️', overcast: '⛅', rainy: '🌧️', storm: '⛈️' };

    for (let i = 0; i < 3; i++) {
      const dayOffset = (state.dayIndex + i + 1) % 7;
      const w = state.forecast[i] || 'sunny';
      const dayCol = document.createElement('div');
      dayCol.className = 'p-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center gap-0.5';
      dayCol.innerHTML = `
        <span class="text-[10px] font-bold text-slate-400">${window.DAY_NAMES ? window.DAY_NAMES[dayOffset] : dayOffset}</span>
        <span class="text-base">${iconMap[w] || '☀️'}</span>
        <span class="text-[9px] text-amber-300 font-semibold">${w.toUpperCase()}</span>
      `;
      forecastGrid.appendChild(dayCol);
    }

    // Chef Rota row
    const chefRow = document.getElementById('chef-days-row');
    if (chefRow) {
      chefRow.innerHTML = '';
      const chefStatus = document.getElementById('chef-hired-status');
      if (chefStatus) chefStatus.innerText = state.chefHired ? "Status: Employed" : "Not Hired Yet ($45)";

      (window.DAY_NAMES || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).forEach((day, idx) => {
        const isToday = (idx === state.dayIndex);
        const active = state.chefRota[idx];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-1.5 rounded-lg border text-xs font-bold transition ${active ? 'bg-purple-600/80 border-purple-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'} ${isToday ? 'ring-2 ring-amber-400' : ''}`;
        btn.innerText = day;
        btn.disabled = !state.chefHired;
        btn.title = active ? "Scheduled to work" : "Day off";
        btn.onclick = () => {
          if (window.audio) window.audio.init();
          state.chefRota[idx] = !state.chefRota[idx];
          renderRotaModal();
          if (window.applyHiredChef) window.applyHiredChef();
        };
        chefRow.appendChild(btn);
      });
    }

    // Server Rota row
    const serverRow = document.getElementById('server-days-row');
    if (serverRow) {
      serverRow.innerHTML = '';
      const serverStatus = document.getElementById('server-hired-status');
      if (serverStatus) serverStatus.innerText = state.serverHired ? "Status: Employed" : "Not Hired Yet ($60)";

      (window.DAY_NAMES || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).forEach((day, idx) => {
        const isToday = (idx === state.dayIndex);
        const active = state.serverRota[idx];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-1.5 rounded-lg border text-xs font-bold transition ${active ? 'bg-pink-600/80 border-pink-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'} ${isToday ? 'ring-2 ring-amber-400' : ''}`;
        btn.innerText = day;
        btn.disabled = !state.serverHired;
        btn.title = active ? "Scheduled to work" : "Day off";
        btn.onclick = () => {
          if (window.audio) window.audio.init();
          state.serverRota[idx] = !state.serverRota[idx];
          renderRotaModal();
          if (window.applyHiredServer) window.applyHiredServer();
        };
        serverRow.appendChild(btn);
      });
    }

    // Drive-Thru Server Rota row
    const dtServerRow = document.getElementById('dt-server-days-row');
    if (dtServerRow) {
      dtServerRow.innerHTML = '';
      const dtServerStatus = document.getElementById('dt-server-hired-status');
      if (dtServerStatus) dtServerStatus.innerText = state.driveThruServerHired ? "Status: Employed" : "Not Hired Yet ($60)";

      (window.DAY_NAMES || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).forEach((day, idx) => {
        const isToday = (idx === state.dayIndex);
        const active = state.driveThruServerRota ? state.driveThruServerRota[idx] : true;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `py-1.5 rounded-lg border text-xs font-bold transition ${active ? 'bg-amber-600/80 border-amber-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'} ${isToday ? 'ring-2 ring-amber-400' : ''}`;
        btn.innerText = day;
        btn.disabled = !state.driveThruServerHired;
        btn.title = active ? "Scheduled to work" : "Day off";
        btn.onclick = () => {
          if (window.audio) window.audio.init();
          if (!state.driveThruServerRota) state.driveThruServerRota = [true, true, true, true, true, true, true];
          state.driveThruServerRota[idx] = !state.driveThruServerRota[idx];
          renderRotaModal();
          if (window.applyHiredDriveThruServer) window.applyHiredDriveThruServer();
        };
        dtServerRow.appendChild(btn);
      });
    }
  }

  if (btnRota) btnRota.addEventListener('click', openRotaModal);
  if (btnCloseRota) btnCloseRota.addEventListener('click', closeRotaModal);
  if (btnConfirmRota) btnConfirmRota.addEventListener('click', closeRotaModal);

  // --- 5. Growth Marketing Campaigns Modal ---
  const marketingModal = document.getElementById('marketing-modal');
  const btnMarketing = document.getElementById('btn-marketing');
  const btnCloseMarketing = document.getElementById('btn-close-marketing');
  const btnFlyers = document.getElementById('btn-launch-flyers');
  const btnSocial = document.getElementById('btn-launch-social');
  const btnCoupon = document.getElementById('btn-launch-coupon');

  function openMarketingModal() {
    if (window.audio) window.audio.init();
    showModal(marketingModal);
  }

  function closeMarketingModal() {
    hideModal(marketingModal);
    cooldowns.marketing = 3.5;
  }

  function launchCampaign(name, cost, duration, footfallMult, priceDiscount = 0) {
    if (state.cash < cost) {
      if (window.audio) window.audio.warningBuzz();
      if (window.showFloatingText && window.player) {
        window.showFloatingText(window.player.root.position, `Need $${cost.toFixed(2)} for ${name}!`, "#ef4444");
      }
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
    if (window.audio) window.audio.upgradeFanfare();
    if (window.showFloatingText && window.player) {
      window.showFloatingText(window.player.root.position, `PROMO LAUNCHED: ${name}!`, "#38bdf8");
    }
    const badge = document.getElementById('campaign-badge');
    if (badge) badge.classList.remove('hidden');
    closeMarketingModal();
  }

  if (btnMarketing) btnMarketing.addEventListener('click', openMarketingModal);
  if (btnCloseMarketing) btnCloseMarketing.addEventListener('click', closeMarketingModal);
  if (btnFlyers) btnFlyers.addEventListener('click', () => launchCampaign("Local Flyers", 15, 45, 1.25));
  if (btnSocial) btnSocial.addEventListener('click', () => launchCampaign("Social Media Blitz", 40, 30, 1.75));
  if (btnCoupon) btnCoupon.addEventListener('click', () => launchCampaign("2-for-1 Coupon", 10, 45, 2.20, 5.00));

  // --- 6. End-of-Shift Founder Dilemmas ---
  const dilemmaModal = document.getElementById('dilemma-modal');
  const btnOptA = document.getElementById('btn-dilemma-opt-a');
  const btnOptB = document.getElementById('btn-dilemma-opt-b');

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
    if (isModalOpen(dilemmaModal)) return;
    const d = DILEMMAS[Math.floor(Math.random() * DILEMMAS.length)];
    activeDilemma = d;

    const iconEl = document.getElementById('dilemma-icon');
    const titleEl = document.getElementById('dilemma-title');
    const descEl = document.getElementById('dilemma-desc');
    const optATitle = document.getElementById('dilemma-opt-a-title');
    const optACon = document.getElementById('dilemma-opt-a-consequence');
    const optBTitle = document.getElementById('dilemma-opt-b-title');
    const optBCon = document.getElementById('dilemma-opt-b-consequence');

    if (iconEl) iconEl.innerText = d.icon;
    if (titleEl) titleEl.innerText = d.title;
    if (descEl) descEl.innerText = d.desc;
    if (optATitle) optATitle.innerText = d.optA.title;
    if (optACon) optACon.innerText = d.optA.con;
    if (optBTitle) optBTitle.innerText = d.optB.title;
    if (optBCon) optBCon.innerText = d.optB.con;

    showModal(dilemmaModal);
    if (window.audio) window.audio.upgradeFanfare();
  }

  function resolveDilemma(choice) {
    if (!isModalOpen(dilemmaModal)) return;
    if (!activeDilemma) activeDilemma = DILEMMAS[0];
    const opt = choice === 'A' ? activeDilemma.optA : activeDilemma.optB;
    hideModal(dilemmaModal);
    activeDilemma = null;

    state.familyMorale = Math.max(0, Math.min(100, state.familyMorale + opt.morale));
    state.founderEnergy = Math.max(5, Math.min(100, state.founderEnergy + opt.energy));
    if (opt.cash !== 0) {
      state.cash = Math.max(0, state.cash + opt.cash);
    }

    gameState.save();
    if (window.audio) window.audio.pop();
    if (window.showFloatingText && window.player) {
      window.showFloatingText(window.player.root.position, choice === 'A' ? "Priority: Life & Well-Being ❤️" : "Priority: Business Revenue 💼", "#f59e0b");
    }
  }
  window.resolveDilemma = resolveDilemma;

  [[btnOptA, 'A'], [btnOptB, 'B']].forEach(([btn, choice]) => {
    if (!btn) return;
    btn.removeAttribute('onclick');
    // pointerup/click both resolve; resolveDilemma ignores the second call once closed
    ['pointerup', 'click'].forEach(evt => {
      btn.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        resolveDilemma(choice);
      });
    });
  });

  // --- 7. Live P&L Statement Modal ---
  const plModal = document.getElementById('pl-modal');
  const btnPL = document.getElementById('btn-pl');
  const btnClosePL = document.getElementById('btn-close-pl');
  const btnConfirmPL = document.getElementById('btn-confirm-pl');

  function openPLModal() {
    if (window.audio) window.audio.init();
    const soldEl = document.getElementById('pl-sold-count');
    const revEl = document.getElementById('pl-rev');
    const cogsEl = document.getElementById('pl-cogs');
    const feesEl = document.getElementById('pl-fees');
    const staffEl = document.getElementById('pl-staff-count');
    const wagesEl = document.getElementById('pl-wages');
    const wasteEl = document.getElementById('pl-waste');
    const interestEl = document.getElementById('pl-debt-interest');
    const laborRatioEl = document.getElementById('pl-labor-ratio');
    const netEl = document.getElementById('pl-net');

    if (soldEl) soldEl.innerText = state.pizzasSold;
    if (revEl) revEl.innerText = `$${state.totalRevenue.toFixed(2)}`;
    if (cogsEl) cogsEl.innerText = `-$${state.totalCOGS.toFixed(2)}`;
    if (feesEl) feesEl.innerText = `-$${state.totalFees.toFixed(2)}`;

    const isChef = window.isChefWorkingToday ? window.isChefWorkingToday() : false;
    const isServer = window.isServerWorkingToday ? window.isServerWorkingToday() : false;
    const isDtServer = window.isDriveThruServerWorkingToday ? window.isDriveThruServerWorkingToday() : false;
    if (staffEl) staffEl.innerText = (isChef ? 1 : 0) + (isServer ? 1 : 0) + (isDtServer ? 1 : 0);
    if (wagesEl) wagesEl.innerText = `-$${state.totalWages.toFixed(2)}`;

    if (wasteEl) {
      const totalWaste = (state.spoiledCheeseBatches || 0) * 1.20;
      wasteEl.innerText = `-$${totalWaste.toFixed(2)}`;
    }
    if (interestEl) interestEl.innerText = `-$${state.totalDebtInterestPaid.toFixed(2)}`;

    const laborRatio = gameState.getLaborRatio();
    if (laborRatioEl) {
      laborRatioEl.innerText = `${laborRatio.toFixed(1)}%`;
      if (laborRatio >= 25 && laborRatio <= 35) {
        laborRatioEl.className = "font-mono font-bold text-emerald-400";
      } else if (laborRatio > 45) {
        laborRatioEl.className = "font-mono font-bold text-rose-400";
      } else {
        laborRatioEl.className = "font-mono font-bold text-amber-400";
      }
    }

    const netProfit = gameState.getNetProfit();
    if (netEl) {
      netEl.innerText = `${netProfit >= 0 ? '$' : '-$'}${Math.abs(netProfit).toFixed(2)}`;
      netEl.className = `font-fredoka text-base ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }

    if (plModal) plModal.classList.add('active');
  }

  function closePLModal() {
    if (plModal) plModal.classList.remove('active');
  }

  if (btnPL) btnPL.addEventListener('click', openPLModal);
  if (btnClosePL) btnClosePL.addEventListener('click', closePLModal);
  if (btnConfirmPL) btnConfirmPL.addEventListener('click', closePLModal);

  // Sound toggle & Reset Progress buttons
  const btnSound = document.getElementById('btn-sound');
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      if (!window.audio) return;
      window.audio.enabled = !window.audio.enabled;
      const soundIcon = document.getElementById('sound-icon');
      if (soundIcon) soundIcon.textContent = window.audio.enabled ? '🔊' : '🔇';
    });
  }

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm("Reset pizzeria data and start fresh?")) {
        gameState.reset();
        window.location.reload();
      }
    });
  }

  // Update cooldown timers on each frame
  function updateCooldowns(dt) {
    if (cooldowns.rota > 0) cooldowns.rota -= dt;
    if (cooldowns.marketing > 0) cooldowns.marketing -= dt;
    if (cooldowns.supply > 0) cooldowns.supply -= dt;
    if (cooldowns.loan > 0) cooldowns.loan -= dt;
    if (cooldowns.dilemma > 0) cooldowns.dilemma -= dt;
  }

  // Export module globally
  window.ModalManager = {
    cooldowns,
    updateCooldowns,
    openSupplyModal,
    closeSupplyModal,
    openPricingModal,
    closePricingModal,
    openLoanModal,
    closeLoanModal,
    openRotaModal,
    closeRotaModal,
    renderRotaModal,
    openMarketingModal,
    closeMarketingModal,
    triggerEndShiftDilemma,
    resolveDilemma,
    openPLModal,
    closePLModal,
    isSupplyOpen: () => isModalOpen(supplyModal),
    isPricingOpen: () => isModalOpen(pricingModal),
    isLoanOpen: () => isModalOpen(loanModal),
    isRotaOpen: () => isModalOpen(rotaModal),
    isMarketingOpen: () => isModalOpen(marketingModal),
    isDilemmaOpen: () => isModalOpen(dilemmaModal),
    isPLOpen: () => plModal && plModal.classList.contains('active'),
  };

})(window);
