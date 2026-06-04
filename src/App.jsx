import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useGameStore } from './store/useGameStore';
import { subscribeGame, subscribePortfolio, subscribeAllPortfolios, updateTotalValue } from './firebase/services';
import LoginPage from './pages/LoginPage';
import MarketPage from './pages/MarketPage';
import StockDetailPage from './pages/StockDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import RankingsPage from './pages/RankingsPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';

function GameSync() {
  const { user, game, setGame, setPortfolio, setAllPortfolios,
          setCurrentDayIndex, computeDayIndex, computeTotalValue, logout } = useGameStore();
  const tickRef = useRef(null);
  const resetTokenRef = useRef(null);

  // Subscribe to game state — detect reset
  useEffect(() => {
    const unsub = subscribeGame((g) => {
      setGame(g);
      if (g?.resetToken && resetTokenRef.current !== null && g.resetToken !== resetTokenRef.current) {
        logout();
      }
      if (g?.resetToken) resetTokenRef.current = g.resetToken;
    });
    return unsub;
  }, []);

  // Subscribe to portfolio
  useEffect(() => {
    if (!user) return;
    const unsub = subscribePortfolio(user.userId, setPortfolio);
    return unsub;
  }, [user?.userId]);

  // Subscribe to all portfolios for leaderboard
  useEffect(() => {
    const unsub = subscribeAllPortfolios(setAllPortfolios);
    return unsub;
  }, []);

  // Tick: update day index every second
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const idx = computeDayIndex();
      setCurrentDayIndex(idx);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [game]);

  // Sync total value to Firestore every 10s
  const syncRef = useRef(null);
  useEffect(() => {
    if (!user) return;
    if (syncRef.current) clearInterval(syncRef.current);
    syncRef.current = setInterval(() => {
      const total = computeTotalValue();
      if (total > 0) updateTotalValue(user.userId, total).catch(() => {});
    }, 10000);
    return () => clearInterval(syncRef.current);
  }, [user?.userId, game]);

  return null;
}

function RequireAuth({ children }) {
  const user = useGameStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfAuth({ children }) {
  const user = useGameStore(s => s.user);
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <GameSync />
      <Routes>
        <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<MarketPage />} />
          <Route path="/stock/:code" element={<StockDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
