import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useGameStore, TRADING_DAYS } from '../store/useGameStore';
import {
  initGame, startGame, pauseGame, resumeGame,
  setGameSpeed, resetGame, getGame
} from '../firebase/services';
import { fmt } from '../components/PriceChange';

const ADMIN_PWD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin1234';
const TOTAL_DAYS = TRADING_DAYS.length;
const SPEED_OPTIONS = [
  { label: '느리게 (12초/일)', val: 12 },
  { label: '보통 (8초/일)', val: 8 },
  { label: '빠르게 (5초/일)', val: 5 },
  { label: '아주빠름 (3초/일)', val: 3 },
];

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

const s = {
  wrap: { padding: 20, maxWidth: 480, margin: '0 auto', paddingBottom: 100 },
  topBar: {
    position: 'sticky', top: 0, zIndex: 10, background: '#fff',
    borderBottom: '1px solid var(--border)', padding: '12px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    margin: '-20px -20px 20px',
  },
  topLogo: { fontWeight: 700, fontSize: 18, color: 'var(--accent)' },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  sub: { fontSize: 13, color: 'var(--text2)', marginBottom: 24 },
  card: { background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 12 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  badge: (s) => ({
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: s === 'running' ? '#E8F8F0' : s === 'paused' ? '#FFF3CD' : '#F0F0F0',
    color: s === 'running' ? '#27AE60' : s === 'paused' ? '#E67E00' : 'var(--text3)',
  }),
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  infoItem: { background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' },
  infoLabel: { fontSize: 11, color: 'var(--text3)', marginBottom: 2 },
  infoVal: { fontSize: 14, fontWeight: 600 },
  btn: (color, disabled) => ({
    width: '100%', height: 46, borderRadius: 10, fontWeight: 600, fontSize: 15,
    background: disabled ? 'var(--bg)' : color, color: disabled ? 'var(--text3)' : '#fff',
    marginBottom: 8, border: 'none', cursor: disabled ? 'default' : 'pointer',
  }),
  dangerBtn: {
    width: '100%', height: 40, borderRadius: 10, fontWeight: 600, fontSize: 14,
    background: 'transparent', color: 'var(--up)', border: '1.5px solid var(--up)', cursor: 'pointer',
    marginBottom: 8,
  },
  pwdInput: {
    width: '100%', height: 46, borderRadius: 10, border: '1px solid var(--border)',
    padding: '0 14px', fontSize: 15, outline: 'none', marginBottom: 12,
  },
  select: {
    width: '100%', height: 46, borderRadius: 10, border: '1px solid var(--border)',
    padding: '0 14px', fontSize: 15, outline: 'none', marginBottom: 12, background: '#fff',
  },
  err: { color: 'var(--up)', fontSize: 13, marginBottom: 8 },
  progressBar: (pct) => ({
    height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 4, overflow: 'hidden',
  }),
  progressFill: (pct) => ({
    height: '100%', width: `${pct}%`, background: 'var(--accent)', transition: 'width .5s',
  }),
};

const STATUS_KO = { waiting: '대기중', running: '진행중', paused: '일시정지', finished: '종료' };

function TopBar({ onBack, onLogout, game }) {
  const remaining = useCountdown(game);
  const urgent = remaining !== null && remaining <= 10;
  return (
    <div style={s.topBar}>
      <span style={s.topLogo}>📈 우아한 모의투자</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {remaining !== null && (
          <div style={{
            background: urgent ? 'var(--up)' : 'var(--text1)',
            borderRadius: 8, padding: '3px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>다음날까지</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
              {remaining >= 60 ? `${Math.floor(remaining/60)}분 ${String(remaining%60).padStart(2,'0')}초` : `${remaining}초`}
            </span>
          </div>
        )}
        {onLogout && (
          <button onClick={onLogout} style={{
            height: 32, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--up)',
            fontSize: 13, fontWeight: 600, color: 'var(--up)', background: 'transparent', cursor: 'pointer',
          }}>로그아웃</button>
        )}
        <button onClick={onBack} style={{
          height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)',
          fontSize: 13, fontWeight: 600, color: 'var(--text2)', background: 'var(--bg)', cursor: 'pointer',
        }}>← 나가기</button>
      </div>
    </div>
  );
}

function BottomNav() {
  const navStyle = (active) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '4px 0', fontSize: 11, fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text3)',
    textDecoration: 'none', transition: 'color .15s',
  });
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 480, background: '#fff', borderTop: '1px solid var(--border)',
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
      padding: '8px 0 max(8px, env(safe-area-inset-bottom))', zIndex: 100,
    }}>
      {[
        { to: '/', icon: '📊', label: '시장' },
        { to: '/portfolio', icon: '💼', label: '내 주식' },
        { to: '/rankings', icon: '🏆', label: '순위' },
      ].map(({ to, icon, label }) => (
        <NavLink key={to} to={to} end style={({ isActive }) => navStyle(isActive)}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
      <NavLink to="/admin" style={({ isActive }) => navStyle(isActive)}>
        <span style={{ fontSize: 20 }}>⚙️</span>
        <span>관리</span>
      </NavLink>
    </nav>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState('');
  const [auth, setAuth] = useState(false);
  const [speed, setSpeed] = useState(8);
  const [msg, setMsg] = useState('');
  const { game, currentDayIndex, logout, user } = useGameStore();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const status = game?.status ?? 'waiting';
  const progress = game ? Math.round((currentDayIndex / (TOTAL_DAYS - 1)) * 100) : 0;
  const date = TRADING_DAYS[currentDayIndex] ?? '—';

  function checkPwd() {
    if (pwd === ADMIN_PWD) { setAuth(true); setMsg(''); }
    else setMsg('비밀번호가 틀렸습니다.');
  }

  async function handle(action) {
    setMsg('');
    try {
      if (action === 'init') { await initGame(TOTAL_DAYS, speed); setMsg('게임이 초기화되었습니다.'); }
      else if (action === 'start') { await startGame(); setMsg('게임 시작!'); }
      else if (action === 'pause') { await pauseGame(currentDayIndex); setMsg('일시정지'); }
      else if (action === 'resume') { await resumeGame(currentDayIndex); setMsg('재개'); }
      else if (action === 'speed') { await setGameSpeed(speed, currentDayIndex); setMsg('속도 변경됨'); }
      else if (action === 'reset') {
        if (!confirm('정말 초기화하시겠습니까? 모든 포트폴리오가 삭제됩니다.')) return;
        await resetGame(TOTAL_DAYS, speed);
        setMsg('초기화 완료');
      }
    } catch (e) { setMsg('오류: ' + e.message); }
  }

  if (!auth) {
    return (
      <div style={s.wrap}>
        <TopBar onBack={() => navigate(user ? '/' : '/login')} onLogout={user ? handleLogout : null} game={game} />
        <BottomNav />
        <div style={s.title}>⚙️ 관리자</div>
        <div style={{ ...s.sub, marginBottom: 32 }}>관리자 비밀번호를 입력하세요</div>
        <input
          style={s.pwdInput} type="password" placeholder="비밀번호"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkPwd()}
        />
        <button style={s.btn('var(--accent)', false)} onClick={checkPwd}>확인</button>
        {msg && <div style={s.err}>{msg}</div>}
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <TopBar onBack={() => navigate(user ? '/' : '/login')} onLogout={user ? handleLogout : null} game={game} />
      <BottomNav />
      <div style={s.title}>⚙️ 게임 관리</div>
      <div style={s.sub}>코로나 시대 모의투자 · {TOTAL_DAYS}거래일</div>

      {/* Status card */}
      <div style={s.card}>
        <div style={s.cardTitle}>현재 상태</div>
        <div style={s.statusRow}>
          <span style={s.badge(status)}>{STATUS_KO[status]}</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{date}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>{progress}%</span>
        </div>
        <div style={s.progressBar()}>
          <div style={s.progressFill(progress)} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
          {currentDayIndex + 1} / {TOTAL_DAYS} 거래일 · {TRADING_DAYS[0]} ~ {TRADING_DAYS[TOTAL_DAYS - 1]}
        </div>

        <div style={s.infoGrid}>
          <div style={s.infoItem}>
            <div style={s.infoLabel}>현재 속도</div>
            <div style={s.infoVal}>{game?.secondsPerDay ?? '—'}초/일</div>
          </div>
          <div style={s.infoItem}>
            <div style={s.infoLabel}>예상 소요시간</div>
            <div style={s.infoVal}>
              {game ? Math.round((TOTAL_DAYS * game.secondsPerDay) / 60) : '—'}분
            </div>
          </div>
        </div>
      </div>

      {/* Speed setting */}
      <div style={s.card}>
        <div style={s.cardTitle}>속도 설정</div>
        <select style={s.select} value={speed} onChange={e => setSpeed(Number(e.target.value))}>
          {SPEED_OPTIONS.map(o => <option key={o.val} value={o.val}>{o.label} (~{Math.round(TOTAL_DAYS * o.val / 60)}분)</option>)}
        </select>
      </div>

      {/* Actions */}
      <div style={s.card}>
        <div style={s.cardTitle}>게임 제어</div>

        {!game && (
          <button style={s.btn('#27AE60', false)} onClick={() => handle('init')}>🎮 게임 초기화</button>
        )}
        {game && status === 'waiting' && (
          <button style={s.btn('#27AE60', false)} onClick={() => handle('start')}>▶ 게임 시작</button>
        )}
        {game && status === 'running' && (
          <button style={s.btn('#E67E00', false)} onClick={() => handle('pause')}>⏸ 일시정지</button>
        )}
        {game && status === 'paused' && (
          <button style={s.btn('#27AE60', false)} onClick={() => handle('resume')}>▶ 재개</button>
        )}
        {game && status === 'running' && (
          <button style={s.btn('var(--accent)', false)} onClick={() => handle('speed')}>⚡ 속도 변경 적용</button>
        )}
      </div>

      {/* Reset */}
      <button style={s.dangerBtn} onClick={() => handle('reset')}>🗑 전체 초기화 (포트폴리오 삭제)</button>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg)', fontSize: 14, textAlign: 'center' }}>
          {msg}
        </div>
      )}
    </div>
  );
}
