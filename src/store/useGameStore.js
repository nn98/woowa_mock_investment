import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TRADING_DAYS, STOCK_DATA } from '../data/stockData';
import { LEVERAGED_DATA, LEVERAGED_MAP } from '../data/leveragedData';

const PRICE_FACTOR = 0.85;

const STOCK_MAP = {};
STOCK_DATA.forEach((s, i) => { STOCK_MAP[s.code] = i; });

function getRawPrices(code) {
  if (LEVERAGED_MAP[code] !== undefined) return LEVERAGED_DATA[LEVERAGED_MAP[code]].prices;
  if (STOCK_MAP[code] !== undefined) return STOCK_DATA[STOCK_MAP[code]].prices;
  return null;
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      user: null,
      game: null,
      portfolio: null,
      allPortfolios: [],
      currentDayIndex: 0,

      // Favorites: Set serialized as array
      favorites: [],

      // Dark mode
      darkMode: false,

      // Portfolio value history: [{day, value}]
      valueHistory: [],

      // Onboarding seen
      onboardingDone: false,

      // News log (in-memory only, not persisted)
      newsLog: [],

      setUser: (user) => set({ user }),
      setGame: (game) => set({ game }),
      setPortfolio: (portfolio) => set({ portfolio }),
      setAllPortfolios: (all) => set({ allPortfolios: all }),
      setCurrentDayIndex: (i) => set({ currentDayIndex: i }),
      logout: () => set({ user: null, portfolio: null, valueHistory: [] }),

      toggleFavorite: (code) => set(state => {
        const favs = state.favorites.includes(code)
          ? state.favorites.filter(c => c !== code)
          : [...state.favorites, code];
        return { favorites: favs };
      }),

      toggleDarkMode: () => {
        const next = !get().darkMode;
        document.documentElement.classList.toggle('dark', next);
        set({ darkMode: next });
      },

      setOnboardingDone: () => set({ onboardingDone: true }),

      addNewsItem: (item) => set(state => ({
        newsLog: [item, ...state.newsLog].slice(0, 60),
      })),

      recordValueSnapshot: (day, value) => set(state => {
        const h = state.valueHistory;
        if (h.length > 0 && h[h.length - 1].day === day) return state;
        return { valueHistory: [...h, { day, value }] };
      }),

      getCurrentPrice: (code) => {
        const prices = getRawPrices(code);
        if (!prices) return 0;
        const dayIdx = Math.min(get().currentDayIndex, TRADING_DAYS.length - 1);
        return Math.round((prices[dayIdx] ?? 0) * PRICE_FACTOR);
      },

      getPrevPrice: (code) => {
        const prices = getRawPrices(code);
        if (!prices) return 0;
        const dayIdx = Math.min(get().currentDayIndex, TRADING_DAYS.length - 1);
        return Math.round((prices[Math.max(0, dayIdx - 1)] ?? 0) * PRICE_FACTOR);
      },

      getStockPriceHistory: (code) => {
        const prices = getRawPrices(code);
        if (!prices) return [];
        const dayIdx = Math.min(get().currentDayIndex, TRADING_DAYS.length - 1);
        return prices.slice(0, dayIdx + 1).map(p => Math.round(p * PRICE_FACTOR));
      },

      computeTotalValue: () => {
        const { portfolio, getCurrentPrice } = get();
        if (!portfolio) return 0;
        let total = portfolio.cash;
        for (const [code, h] of Object.entries(portfolio.holdings || {})) {
          total += getCurrentPrice(code) * h.quantity;
        }
        return total;
      },

      computeDayIndex: () => {
        const { game } = get();
        if (!game || game.status === 'waiting') return 0;
        if (game.status === 'paused') return game.pausedDayIndex ?? 0;
        const elapsed = (Date.now() - game.startedAt) / 1000;
        return Math.min(Math.floor(elapsed / game.secondsPerDay), game.totalDays - 1);
      },
    }),
    {
      name: 'woowa-session',
      partialize: (state) => ({
        user: state.user,
        favorites: state.favorites,
        darkMode: state.darkMode,
        valueHistory: state.valueHistory,
        onboardingDone: state.onboardingDone,
      }),
    }
  )
);

export { TRADING_DAYS, STOCK_DATA, STOCK_MAP, LEVERAGED_DATA };
