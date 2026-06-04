import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGameStore, TRADING_DAYS } from '../store/useGameStore';
import NewsToast, { useNewsQueue } from './NewsToast';
import NewsSidebar from './NewsSidebar';

const s = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100dvh' },
  header: {
    position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { fontWeight: 700, fontSize: 17, color: 'var(--accent)', cursor: 'pointer' },
  statusBadge: (status) => ({
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
    background: status === 'running' ? 'rgba(39,174,96,0.12)' : status === 'paused' ? 'rgba(240,165,0,0.12)' : 'var(--bg)',
    color: status === 'running' ? '#27AE60' : status === 'paused' ? '#F0A500' : 'var(--text3)',
  }),
  main: { flex: 1, overflowY: 'auto', paddingBottom: 72, contain: 'paint' },
  nav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: 'var(--surface)', borderTop: '1px solid var(--border)',
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    padding: '6px 0 max(6px, env(safe-area-inset-bottom))',
  },
  navItem: (active) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '4px 0', fontSize: 10, fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text3)',
    textDecoration: 'none', transition: 'color .15s',
  }),
  navIcon: { fontSize: 19 },
};

const STATUS_LABEL = { waiting: '대기중', running: '진행중', paused: '일시정지', finished: '종료' };

function useCountdown(game) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (game?.status !== 'running') { setRemaining(null); return; }
    function tick() {
      const elapsed = (Date.now() - game.startedAt) / 1000;
      setRemaining(Math.ceil(game.secondsPerDay - (elapsed % game.secondsPerDay)));
    }
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [game]);
  return remaining;
}

const NAV_ITEMS = [
  { to: '/', icon: '📊', label: '시장' },
  { to: '/portfolio', icon: '💼', label: '내 주식' },
  { to: '/stats', icon: '📈', label: '분석' },
  { to: '/rankings', icon: '🏆', label: '순위' },
  { to: '/admin', icon: '⚙️', label: '관리' },
];

export default function Layout() {
  const navigate = useNavigate();
  const { game, currentDayIndex, darkMode, toggleDarkMode, newsLog } = useGameStore();
  const status = game?.status ?? 'waiting';
  const progress = game ? Math.round((currentDayIndex / (game.totalDays - 1)) * 100) : 0;
  const remaining = useCountdown(game);
  const urgent = remaining !== null && remaining <= 10;
  const { queue, setQueue } = useNewsQueue();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 960);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 960);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Mark unread dot when new news arrives on mobile
  useEffect(() => {
    if (!isDesktop && newsLog.length > 0) setHasUnread(true);
  }, [newsLog.length, isDesktop]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Mobile news bell */}
          {!isDesktop && (
            <button
              onClick={() => { setSidebarOpen(true); setHasUnread(false); }}
              style={{ position: 'relative', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
            >
              🔔
              {hasUnread && (
                <span style={{
                  position: 'absolute', top: 0, right: 0, width: 8, height: 8,
                  background: 'var(--up)', borderRadius: '50%', border: '1.5px solid var(--surface)',
                }} />
              )}
            </button>
          )}
          <span style={s.logo} onClick={() => navigate('/')}>📈 우아한 모의투자</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {remaining !== null ? (
            <div style={{
              background: urgent ? 'var(--up)' : '#191F28',
              borderRadius: 8, padding: '4px 10px',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>다음날까지</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {remaining >= 60
                  ? `${Math.floor(remaining / 60)}분 ${String(remaining % 60).padStart(2, '0')}초`
                  : `${remaining}초`}
              </span>
            </div>
          ) : (
            <span style={s.statusBadge(status)}>{STATUS_LABEL[status]}</span>
          )}
          {game && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{progress}%</span>}
          <button onClick={toggleDarkMode} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div style={{ height: 2, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 1s linear' }} />
      </div>

      <main style={s.main} className="main-scroll">
        <Outlet />
      </main>

      {/* Desktop sidebar (always visible) */}
      {isDesktop && <NewsSidebar />}

      {/* Mobile sidebar (toggle) */}
      {!isDesktop && (
        <>
          <NewsToast queue={queue} setQueue={setQueue} />
          <NewsSidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
        </>
      )}

      <nav style={s.nav}>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => s.navItem(isActive)}>
            <span style={s.navIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
