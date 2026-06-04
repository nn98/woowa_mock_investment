import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { USERS } from '../data/users';
import { getOrCreatePortfolio } from '../firebase/services';

const s = {
  wrap: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: '64px 24px 32px' },
  logo: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 40 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 },
  input: {
    width: '100%', height: 52, borderRadius: 12, border: '1.5px solid var(--border)',
    padding: '0 16px', fontSize: 16, outline: 'none', boxSizing: 'border-box',
    marginBottom: 12,
  },
  matchBox: {
    padding: '12px 16px', borderRadius: 12, background: 'var(--accent-light)',
    border: '1.5px solid var(--accent)', marginBottom: 16,
    display: 'flex', alignItems: 'center', gap: 12,
  },
  matchName: { fontSize: 15, fontWeight: 700, color: 'var(--accent)' },
  matchEmail: { fontSize: 12, color: 'var(--text2)', marginTop: 2 },
  btn: (disabled) => ({
    width: '100%', height: 52, borderRadius: 14, fontWeight: 700, fontSize: 16, border: 'none',
    background: disabled ? 'var(--border)' : 'var(--accent)', color: disabled ? 'var(--text3)' : '#fff',
    cursor: disabled ? 'default' : 'pointer',
  }),
  err: { color: 'var(--up)', fontSize: 13, textAlign: 'center', marginTop: 12 },
  hint: { fontSize: 12, color: 'var(--text3)', marginTop: 'auto', paddingTop: 32, textAlign: 'center' },
};

function findUser(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return USERS.find(u =>
    u.nickname.toLowerCase() === q ||
    u.email.toLowerCase() === q ||
    u.name?.toLowerCase() === q
  ) ?? null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useGameStore(s => s.setUser);
  const setPortfolio = useGameStore(s => s.setPortfolio);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const matched = findUser(query);

  async function login() {
    if (!matched || loading) return;
    setLoading(true);
    setError('');
    try {
      const userId = matched.email.replace(/[^a-zA-Z0-9]/g, '_');
      const portfolio = await getOrCreatePortfolio(userId, matched.nickname);
      setUser({ userId, nickname: matched.nickname, name: matched.name, email: matched.email });
      setPortfolio(portfolio);
      navigate('/');
    } catch (e) {
      setError('접속 오류: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.logo}>📈</div>
      <h1 style={s.title}>우아한 모의투자</h1>

      <div style={s.label}>닉네임 또는 이메일</div>
      <input
        style={s.input}
        placeholder="닉네임 또는 이메일 주소 입력"
        value={query}
        onChange={e => { setQuery(e.target.value); setError(''); }}
        onKeyDown={e => e.key === 'Enter' && matched && login()}
        autoFocus
      />

      {matched && (
        <div style={s.matchBox}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div>
            <div style={s.matchName}>{matched.nickname}</div>
            <div style={s.matchEmail}>{matched.email}</div>
          </div>
        </div>
      )}

      <button style={s.btn(!matched || loading)} disabled={!matched || loading} onClick={login}>
        {loading ? '접속 중...' : matched ? `${matched.nickname}으로 입장` : '닉네임 또는 이메일을 입력하세요'}
      </button>

      {error && <div style={s.err}>{error}</div>}

      <div style={s.hint}>입력한 계정 정보는 브라우저에 저장됩니다</div>
    </div>
  );
}
