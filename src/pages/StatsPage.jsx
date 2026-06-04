import { useState, useEffect } from 'react';
import { useGameStore, TRADING_DAYS } from '../store/useGameStore';
import { getTransactions } from '../firebase/services';
import { fmt } from '../components/PriceChange';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const s = {
  wrap: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  card: {
    background: 'var(--bg)', borderRadius: 14, padding: '16px',
    marginBottom: 12, border: '1px solid var(--border)',
  },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
  statItem: { background: 'var(--bg)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)' },
  statLabel: { fontSize: 11, color: 'var(--text3)', marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: 700 },
  tradeItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid var(--border)',
  },
  typeBadge: (type) => ({
    display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
    background: type === 'buy' ? 'var(--up-bg)' : 'var(--down-bg)',
    color: type === 'buy' ? 'var(--up)' : 'var(--down)',
    marginRight: 6,
  }),
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text3)', marginBottom: 2 }}>DAY {label}</div>
      <div style={{ fontWeight: 700 }}>{fmt(payload[0].value)}원</div>
    </div>
  );
};

export default function StatsPage() {
  const { user, portfolio, valueHistory, currentDayIndex, getCurrentPrice } = useGameStore();
  const [trades, setTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTransactions(user.userId, 50).then(t => {
      setTrades(t);
      setLoadingTrades(false);
    }).catch(() => setLoadingTrades(false));
  }, [user?.userId]);

  if (!portfolio) return <div style={{ padding: 24, color: 'var(--text2)' }}>로딩 중...</div>;

  // Stats
  const holdings = Object.entries(portfolio.holdings || {});
  const stockValue = holdings.reduce((s, [code, h]) => s + getCurrentPrice(code) * h.quantity, 0);
  const totalValue = portfolio.cash + stockValue;
  const totalPnl = totalValue - 1_000_000;
  const totalPnlPct = (totalPnl / 1_000_000) * 100;

  const chartData = valueHistory.map(h => ({
    day: h.day,
    value: h.value,
    label: TRADING_DAYS[h.day]?.slice(5) ?? `D${h.day}`,
  }));

  const minVal = chartData.length ? Math.min(...chartData.map(d => d.value)) * 0.995 : 900000;
  const maxVal = chartData.length ? Math.max(...chartData.map(d => d.value)) * 1.005 : 1100000;
  const isProfit = totalPnl >= 0;

  const buyCount = trades.filter(t => t.type === 'buy').length;
  const sellCount = trades.filter(t => t.type === 'sell').length;
  const totalTradeVol = trades.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <div style={s.wrap}>
      {/* Portfolio chart */}
      <div style={s.section}>
        <div style={s.sectionTitle}>📈 자산 변화</div>
        {chartData.length < 2 ? (
          <div style={{ ...s.card, textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '32px 16px' }}>
            게임이 진행되면 자산 그래프가 그려집니다
          </div>
        ) : (
          <div style={{ ...s.card, padding: '16px 8px 8px' }}>
            <div style={{ padding: '0 8px 12px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>현재 자산</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalValue)}원</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>총 수익</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isProfit ? 'var(--up)' : 'var(--down)' }}>
                  {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}원
                </div>
                <div style={{ fontSize: 13, color: isProfit ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>
                  {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isProfit ? 'var(--up)' : 'var(--down)'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isProfit ? 'var(--up)' : 'var(--down)'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text3)' }} interval="preserveStartEnd" />
                <YAxis domain={[minVal, maxVal]} tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => `${Math.round(v/10000)}만`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={1_000_000} stroke="var(--text3)" strokeDasharray="3 3" />
                <Area
                  type="monotone" dataKey="value"
                  stroke={isProfit ? 'var(--up)' : 'var(--down)'} strokeWidth={2}
                  fill="url(#areaGrad)" dot={false} isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Trade stats */}
      <div style={s.section}>
        <div style={s.sectionTitle}>📊 거래 통계</div>
        <div style={s.statGrid}>
          <div style={s.statItem}>
            <div style={s.statLabel}>총 매수</div>
            <div style={s.statVal}>{buyCount}건</div>
          </div>
          <div style={s.statItem}>
            <div style={s.statLabel}>총 매도</div>
            <div style={s.statVal}>{sellCount}건</div>
          </div>
          <div style={s.statItem}>
            <div style={s.statLabel}>총 거래대금</div>
            <div style={{ ...s.statVal, fontSize: 14 }}>{fmt(totalTradeVol)}원</div>
          </div>
          <div style={s.statItem}>
            <div style={s.statLabel}>보유 종목 수</div>
            <div style={s.statVal}>{holdings.length}종목</div>
          </div>
        </div>
      </div>

      {/* Trade history */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🧾 거래 내역</div>
        {loadingTrades ? (
          <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: 24 }}>불러오는 중...</div>
        ) : trades.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: 24 }}>거래 내역이 없습니다</div>
        ) : (
          trades.map(t => (
            <div key={t.id} style={s.tradeItem}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  <span style={s.typeBadge(t.type)}>{t.type === 'buy' ? '매수' : '매도'}</span>
                  {t.stockName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  {t.quantity}주 × {fmt(t.price)}원
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(t.total)}원</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {t.timestamp?.seconds ? new Date(t.timestamp.seconds * 1000).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
