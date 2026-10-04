// State management, LocalStorage persistence & P&L Economics
const STORAGE_KEY = 'pizza_tycoon_3d_save_v1';

const defaultState = {
  cash: 25.00,
  pizzasSold: 0,
  totalRevenue: 0,
  totalCOGS: 0,
  totalFees: 0,
  totalWages: 0,
  orderTickets: 0,
  readyBoxesOnTable: 0,
  playerCarrying: 0,

  chefHired: false,
  serverHired: false,
  tablePurchased: false,

  // 7-day Rota Schedule: Array of booleans for [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  chefRota: [true, true, true, true, true, true, true],
  serverRota: [true, true, true, true, true, true, true],

  // Calendar & Day/Night Cycle (Each shift is 90 seconds)
  dayIndex: 0, // 0 = Mon, 1 = Tue, ... 6 = Sun
  monthDay: 1, // 1 to 28 (Week 4 = Payday Surge)
  shiftTimer: 0,
  shiftDuration: 90, // seconds per business day

  // Weather: 'sunny', 'overcast', 'rainy', 'storm'
  currentWeather: 'sunny',
  forecast: ['sunny', 'rainy', 'overcast'],

  // Marketing Campaign: null or { type, name, timer, maxTimer, footfallMult, priceDiscount, roasSpend, roasRev }
  activeCampaign: null,

  chefWagePerSec: 0.15,
  serverWagePerSec: 0.12,

  // Phase 2: Raw Ingredient Inventory & Supply Chain
  inventory: {
    dough: 15,     // in portions
    sauce: 15,     // in portions
    cheese: 15,    // in portions (perishable!)
  },
  maxInventoryCapacity: 60, // per ingredient

  // Menu Pricing Slider & Demand Elasticity ($10 to $26)
  menuPrice: 16.00, // baseline
  elasticityElasticityFactor: 1.0,

  // Spoilage tracking
  spoiledCheeseBatches: 0,
  hasRefrigeration: false, // upgradeable cooler box

  // Phase 3: Work-Life Balance, Founder Dilemmas & Debt Servicing
  founderEnergy: 100,      // 0 to 100%
  maxEnergy: 100,
  familyMorale: 80,        // 0 to 100%
  loanPrincipal: 0,        // Outstanding bank debt
  loanDailyInterestRate: 0.08, // 8% daily interest
  totalDebtInterestPaid: 0,
  totalLoanBorrowed: 0,
  breakRestTimer: 0,       // Resting on bench/rest pad

  costPerPizza: 3.50, // standard baseline unit COGS
  salePrice: 16.00,
  drinkPrice: 4.50,
  drinkCOGS: 0.80,
  cardFeeRate: 0.025,

  chefBakeTimer: 0,
  customerSpawnTimer: 0,
  actionProgress: 0,
  activeAction: null,
  doughTossProgress: 0,

  // Daily tracker for current shift
  dailyRevenue: 0,
  dailyCOGS: 0,
  dailyWages: 0,
  dailyWasteCost: 0,
  dailyPizzasSold: 0,
  dailyWalkaways: 0,
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FOOTFALL_MULTS = [0.55, 0.60, 0.95, 1.05, 1.80, 1.60, 0.75]; // Slow Mon slump to Friday night rush
const WEATHER_MULTS = {
  sunny: { footfall: 1.25, patience: 1.20, label: '☀️ Sunny & Warm' },
  overcast: { footfall: 1.00, patience: 1.00, label: '⛅ Overcast' },
  rainy: { footfall: 0.50, patience: 0.70, label: '🌧️ Rainy' },
  storm: { footfall: 0.25, patience: 0.50, label: '⛈️ Storm Warning' },
};

class GameState {
  constructor() {
    this.data = { ...defaultState };
    this.load();
  }

  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.data = {
          ...defaultState,
          ...parsed,
          chefRota: parsed.chefRota || [...defaultState.chefRota],
          serverRota: parsed.serverRota || [...defaultState.serverRota],
          inventory: parsed.inventory || { ...defaultState.inventory },
          menuPrice: parsed.menuPrice || defaultState.menuPrice,
          hasRefrigeration: parsed.hasRefrigeration || false,
          founderEnergy: parsed.founderEnergy !== undefined ? parsed.founderEnergy : 100,
          familyMorale: parsed.familyMorale !== undefined ? parsed.familyMorale : 80,
          loanPrincipal: parsed.loanPrincipal || 0,
          totalDebtInterestPaid: parsed.totalDebtInterestPaid || 0,
          totalLoanBorrowed: parsed.totalLoanBorrowed || 0,
          orderTickets: parsed.orderTickets || 0,
          readyBoxesOnTable: Math.min(parsed.readyBoxesOnTable || 0, 6),
          playerCarrying: 0,
          actionProgress: 0,
          chefBakeTimer: 0,
          customerSpawnTimer: 0,
          doughTossProgress: 0,
          activeCampaign: null,
          shiftTimer: 0,
          dailyRevenue: 0,
          dailyCOGS: 0,
          dailyWages: 0,
          dailyWasteCost: 0,
          dailyPizzasSold: 0,
          dailyWalkaways: 0,
        };
      }
    } catch (e) {
      console.warn("Could not load saved state from localStorage:", e);
    }
  }

  save() {
    try {
      const toSave = {
        cash: this.data.cash,
        pizzasSold: this.data.pizzasSold,
        totalRevenue: this.data.totalRevenue,
        totalCOGS: this.data.totalCOGS,
        totalFees: this.data.totalFees,
        totalWages: this.data.totalWages,
        chefHired: this.data.chefHired,
        serverHired: this.data.serverHired,
        tablePurchased: this.data.tablePurchased,
        chefRota: this.data.chefRota,
        serverRota: this.data.serverRota,
        inventory: this.data.inventory,
        menuPrice: this.data.menuPrice,
        hasRefrigeration: this.data.hasRefrigeration,
        founderEnergy: this.data.founderEnergy,
        familyMorale: this.data.familyMorale,
        loanPrincipal: this.data.loanPrincipal,
        totalDebtInterestPaid: this.data.totalDebtInterestPaid,
        totalLoanBorrowed: this.data.totalLoanBorrowed,
        dayIndex: this.data.dayIndex,
        monthDay: this.data.monthDay,
        currentWeather: this.data.currentWeather,
        forecast: this.data.forecast,
        orderTickets: this.data.orderTickets,
        readyBoxesOnTable: this.data.readyBoxesOnTable,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = { ...defaultState };
  }

  // Supply Chain: Check & consume ingredients for 1 pizza
  hasIngredientsForPizza() {
    return this.data.inventory.dough >= 1 &&
           this.data.inventory.sauce >= 1 &&
           this.data.inventory.cheese >= 1;
  }

  consumeIngredientsForPizza() {
    if (!this.hasIngredientsForPizza()) return false;
    this.data.inventory.dough -= 1;
    this.data.inventory.sauce -= 1;
    this.data.inventory.cheese -= 1;
    return true;
  }

  // Pricing Demand Elasticity:
  // Base price is $16. If priced lower (e.g. $10), traffic surges (+60%) but lower margin.
  // If priced higher (e.g. $26), traffic drops (-55%) but per-pie profit is maximized.
  getPriceDemandMultiplier() {
    const delta = this.data.menuPrice - 16.00;
    // Elasticity formula: -7% footfall per +$1 above $16, +9% footfall per -$1 below $16
    if (delta > 0) {
      return Math.max(0.35, 1.0 - (delta * 0.065));
    } else {
      return Math.min(1.85, 1.0 + (Math.abs(delta) * 0.09));
    }
  }

  // Phase 3: Energy effects on founder speed
  // 100% energy = 1.0x speed, 0% energy = 0.55x speed (exhausted sluggish movement)
  getFounderSpeedMultiplier() {
    return Math.max(0.55, 0.55 + (this.data.founderEnergy / 100) * 0.45);
  }

  getLaborRatio() {
    if (this.data.totalRevenue <= 0) return 0;
    return ((this.data.totalWages / this.data.totalRevenue) * 100);
  }

  getDailyLaborRatio() {
    if (this.data.dailyRevenue <= 0) return 0;
    return ((this.data.dailyWages / this.data.dailyRevenue) * 100);
  }

  getNetProfit() {
    return this.data.totalRevenue - this.data.totalCOGS - this.data.totalFees - this.data.totalWages - this.data.totalDebtInterestPaid;
  }
}

window.DAY_NAMES = DAY_NAMES;
window.DAY_FOOTFALL_MULTS = DAY_FOOTFALL_MULTS;
window.WEATHER_MULTS = WEATHER_MULTS;

window.gameState = new GameState();
window.state = window.gameState.data;
