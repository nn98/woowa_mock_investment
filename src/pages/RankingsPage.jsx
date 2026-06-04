import { useGameStore, STOCK_DATA } from '../store/useGameStore';
import { fmt } from '../components/PriceChange';

const MEDALS = ['🥇', '🥈', '🥉'];

const s = {
  wrap: { padding: '0' },
  title: { fontSize: 17, fontWeight: 700, padding: '16px 16px 12px' },
  item: (isMe, rank) => ({
    display: 'flex', alignItems: 'center', padding: '14px 16px', gap: 12,
    background: isMe ? 'var(--accent-light)' : rank <= 3 ? 'var(--bg)' : 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    borderLeft: isMe ? '3px solid var(--accent)' : '3px solid transparent',
  }),
  rank: { fontSize: 18, width: 32, textAlign: 'center', fontWeight: 700 },
  info: { flex: 1 },
  nickname: { fontSize: 15, fontWeight: 600 },
  name: { fontSize: 12, color: 'var(--text3)', marginTop: 2 },
  right: { textAlign: 'right' },
  total: { fontSize: 15, fontWeight: 700 },
  pnl: (n) => ({
    fontSize: 13, fontWeight: 600, marginTop: 2,
    color: n >= 0 ? 'var(--up)' : 'var(--down)',
  }),
  empty: { textAlign: 'center', padding: '60px 0', color: 'var(--text3)' },
  badge: (isMe) => ({
    fontSize: 11, padding: '2px 8px', borderRadius: 10,
    background: isMe ? 'var(--accent)' : 'transparent',
    color: isMe ? '#fff' : 'transparent',
    fontWeight: 600,
  }),
};

export default function RankingsPage() {
  const { allPortfolios, getCurrentPrice, user } = useGameStore();

  const ranked = allPortfolios
    .map(p => {
      let total = p.cash;
      for (const [code, h] of Object.entries(p.holdings || {})) {
        total += getCurrentPrice(code) * h.quantity;
      }
      const pnl = total - 1_000_000;
      const pnlPct = (pnl / 1_000_000) * 100;
      return { ...p, total, pnl, pnlPct };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div style={s.wrap}>
      <div style={s.title}>🏆 실시간 순위</div>

      {ranked.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏁</div>
          <div>아직 참여자가 없습니다</div>
        </div>
      ) : (
        ranked.map((p, i) => {
          const rank = i + 1;
          const isMe = p.userId === user?.userId;
          return (
            <div key={p.userId} style={s.item(isMe, rank)}>
              <div style={s.rank}>
                {rank <= 3 ? MEDALS[rank - 1] : rank}
              </div>
              <div style={s.info}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={s.nickname}>{p.nickname}</span>
                  <span style={s.badge(isMe)}>{isMe ? 'ME' : ''}</span>
                </div>
                <div style={s.name}>
                  보유 현금 {fmt(p.cash)}원
                </div>
              </div>
              <div style={s.right}>
                <div style={s.total}>{fmt(p.total)}원</div>
                <div style={s.pnl(p.pnl)}>
                  {p.pnl >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
