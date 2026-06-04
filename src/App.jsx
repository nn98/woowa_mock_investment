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
import StatsPage from './pages/StatsPage';
import Layout from './components/Layout';
import OnboardingTutorial from './components/OnboardingTutorial';

function GameSync() {
  const {
    user, game, setGame, setPortfolio, setAllPortfolios,
    setCurrentDayIndex, computeDayIndex, computeTotalValue,
    logout, recordValueSnapshot,
  } = useGameStore();
  const tickRef = useRef(null);
  const resetTokenRef = useRef(null);

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

  useEffect(() => {
    if (!user) return;
    const unsub = subscribePortfolio(user.userId, setPortfolio);
    return unsub;
  }, [user?.userId]);

  useEffect(() => {
    const unsub = subscribeAllPortfolios(setAllPortfolios);
    return unsub;
  }, []);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const idx = computeDayIndex();
      setCurrentDayIndex(idx);
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [game]);

  // Sync total value + record snapshot
  const syncRef = useRef(null);
  const lastSnapshotDay = useRef(-1);
  useEffect(() => {
    if (!user) return;
    if (syncRef.current) clearInterval(syncRef.current);
    syncRef.current = setInterval(() => {
      const { currentDayIndex } = useGameStore.getState();
      const total = computeTotalValue();
      if (total > 0) {
        updateTotalValue(user.userId, total).catch(() => {});
        if (currentDayIndex !== lastSnapshotDay.current) {
          recordValueSnapshot(currentDayIndex, total);
          lastSnapshotDay.current = currentDayIndex;
        }
      }
    }, 5000);
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

function OnboardingGate() {
  const { onboardingDone, user } = useGameStore();
  if (user && !onboardingDone) return <OnboardingTutorial />;
  return null;
}

export default function App() {
  return (
    <>
      <GameSync />
      <OnboardingGate />
      <Routes>
        <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<MarketPage />} />
          <Route path="/stock/:code" element={<StockDetailPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/rankings" element={<RankingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
