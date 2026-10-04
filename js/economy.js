// Economy Module: Shift Cycles, Weather Progression, Debt Interest, Spoilage, and Demand Calculations
(function(window) {
  'use strict';

  function updateEconomy(dt) {
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
        if (window.showFloatingText && window.bankZone) {
          window.showFloatingText(window.bankZone.group.position, `🏦 Debt Interest Paid: -$${dailyInterest.toFixed(2)}`, "#0f766e");
        }
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
        if (window.showFloatingText && window.supplyZone) {
          window.showFloatingText(window.supplyZone.group.position, `⚠️ ${spoiledAmount} Cheese Spoiled Overnight! (-$${wasteCost.toFixed(2)})`, "#ef4444");
        }
        if (window.audio) window.audio.warningBuzz();
      }

      // Phase 3: Trigger End-of-Shift Founder Dilemma (Every few days)
      if (state.monthDay % 2 === 0) {
        if (window.ModalManager) {
          window.ModalManager.triggerEndShiftDilemma();
        }
      }

      // Shift weather forecast
      state.currentWeather = state.forecast[0] || 'sunny';
      state.forecast[0] = state.forecast[1] || 'overcast';
      state.forecast[1] = state.forecast[2] || 'sunny';
      const weathers = ['sunny', 'sunny', 'overcast', 'rainy', 'storm'];
      state.forecast[2] = weathers[Math.floor(Math.random() * weathers.length)];

      // Apply new weather visuals
      if (window.gameScene) {
        window.gameScene.setWeatherVisuals(state.currentWeather);
      }

      // Refresh Rota staffing on new day
      if (window.applyHiredChef) window.applyHiredChef();
      if (window.applyHiredServer) window.applyHiredServer();

      // Reset daily shift metrics
      state.dailyRevenue = 0;
      state.dailyCOGS = 0;
      state.dailyWages = 0;
      state.dailyWasteCost = 0;
      state.dailyPizzasSold = 0;
      state.dailyWalkaways = 0;

      gameState.save();
      if (window.audio) window.audio.beep(587.33, 'triangle', 0.15, 0.14);
      if (window.showFloatingText && window.player) {
        window.showFloatingText(window.player.root.position, `New Shift: ${window.DAY_NAMES[state.dayIndex]}!`, "#facc15");
      }
    }

    // Active Marketing Campaign timer countdown
    if (state.activeCampaign) {
      state.activeCampaign.timer -= dt;
      if (state.activeCampaign.timer <= 0) {
        if (window.showFloatingText && window.player) {
          window.showFloatingText(window.player.root.position, `Promo Ended: ${state.activeCampaign.name}`, "#38bdf8");
        }
        state.activeCampaign = null;
        const badge = document.getElementById('campaign-badge');
        if (badge) badge.classList.add('hidden');
      }
    }
  }

  function getDemandFactor() {
    const dayMult = (window.DAY_FOOTFALL_MULTS && window.DAY_FOOTFALL_MULTS[state.dayIndex]) || 1.0;
    const weatherMult = (window.WEATHER_MULTS && window.WEATHER_MULTS[state.currentWeather] && window.WEATHER_MULTS[state.currentWeather].footfall) || 1.0;
    const isPaydayWeek = (state.monthDay >= 22); // Week 4 = Payday Surge (+40% traffic)
    const paydayMult = isPaydayWeek ? 1.40 : ((state.monthDay >= 8 && state.monthDay <= 21) ? 0.85 : 1.10);
    const marketingMult = state.activeCampaign ? state.activeCampaign.footfallMult : 1.0;
    const priceElasticityMult = gameState.getPriceDemandMultiplier();

    return dayMult * weatherMult * paydayMult * marketingMult * priceElasticityMult;
  }

  window.EconomyManager = {
    updateEconomy,
    getDemandFactor,
  };

})(window);
