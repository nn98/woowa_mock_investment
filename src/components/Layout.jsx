import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGameStore, TRADING_DAYS } from '../store/useGameStore';

const s = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100dvh' },
  header: {
    position: 'sticky', top: 0, zIndex: 100, background: '#fff',
    borderBottom: '1px solid var(--border)',
    padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { fontWeight: 700, fontSize: 18, color: 'var(--accent)' },
  gameInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  date: { fontSize: 12, color: 'var(--text2)', fontWeight: 500 },
  statusBadge: (status) => ({
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
    background: status === 'running' ? '#E8F8F0' : status === 'paused' ? '#FFF3CD' : '#F0F0F0',
    color: status === 'running' ? '#27AE60' : status === 'paused' ? '#F0A500' : 'var(--text3)',
  }),
  main: { flex: 1, overflowY: 'auto', paddingBottom: 72 },
  nav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: '#fff', borderTop: '1px solid var(--border)',
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
  },
  navItem: (active) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '4px 0', fontSize: 11, fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text3)',
    textDecoration: 'none', transition: 'color .15s',
  }),
  navIcon: { fontSize: 20 },
};

const STATUS_LABEL = { waiting: '대기중', running: '진행중', paused: '일시정지', finished: '종료' };

function useCountdown(game) {
  const [remaining, setRemaining] = useState(null);
  useEffect(() => {
    if (game?.status !== 'running') { setRemaining(null); return; }
    function tick() {
      const elapsed = (Date.now() - game.startedAt) / 1000;
      const rem = Math.ceil(game.secondsPerDay - (elapsed % game.secondsPerDay));
      setRemaining(rem);
    }
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [game]);
  return remaining;
}

function fmtCountdown(sec) {
  if (sec === null) return null;
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return { text: '다음날까지', num: `${m}분 ${String(s).padStart(2, '0')}초` };
  }
  return { text: '다음날까지', num: `${sec}초` };
}

export default function Layout() {
  const navigate = useNavigate();
  const { game, currentDayIndex } = useGameStore();
  const status = game?.status ?? 'waiting';
  const progress = game ? Math.round((currentDayIndex / (game.totalDays - 1)) * 100) : 0;
  const remaining = useCountdown(game);

  return (
    <div style={s.wrap}>
      <header style={s.header}>
        <span style={{ ...s.logo, cursor: 'pointer' }} onClick={() => navigate('/')}>📈 우아한 모의투자</span>
        <div style={s.gameInfo}>
          {(() => {
            const cd = fmtCountdown(remaining);
            if (!cd) return <span style={s.statusBadge(status)}>{STATUS_LABEL[status]}</span>;
            const urgent = remaining !== null && remaining <= 10;
            return (
              <div style={{
                background: urgent ? 'var(--up)' : 'var(--text1)',
                borderRadius: 10, padding: '5px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.3 }}>
                  {cd.text}
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 800, lineHeight: 1.2,
                  color: '#fff', letterSpacing: -0.3,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {cd.num}
                </span>
              </div>
            );
          })()}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{progress}%</span>
            <span style={s.statusBadge(status)}>{STATUS_LABEL[status]}</span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--border)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 1s linear' }} />
      </div>

      <main style={s.main}>
        <Outlet />
      </main>

      <nav style={s.nav}>
        {[
          { to: '/', icon: '📊', label: '시장' },
          { to: '/portfolio', icon: '💼', label: '내 주식' },
          { to: '/rankings', icon: '🏆', label: '순위' },
        ].map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end style={({ isActive }) => s.navItem(isActive)}>
            <span style={s.navIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink to="/admin" style={({ isActive }) => s.navItem(isActive)}>
          <span style={s.navIcon}>⚙️</span>
          <span>관리</span>
        </NavLink>
      </nav>
    </div>
  );
}
