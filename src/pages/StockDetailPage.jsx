import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Cell, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer
} from 'recharts';
import { useGameStore, STOCK_DATA, LEVERAGED_DATA, TRADING_DAYS } from '../store/useGameStore';
import { SECTOR_KO } from '../data/users';
import { executeTrade } from '../firebase/services';
import { fmt } from '../components/PriceChange';

const PERIODS = [
  { label: '1주', days: 5 },
  { label: '1달', days: 22 },
  { label: '3달', days: 66 },
  { label: '전체', days: 999 },
];

const s = {
  wrap: { paddingBottom: 220 },
  header: { padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 },
  back: { fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' },
  name: { fontSize: 20, fontWeight: 700 },
  code: { fontSize: 13, color: 'var(--text3)' },
  priceWrap: { padding: '20px 16px 8px' },
  price: { fontSize: 36, fontWeight: 800 },
  chgRow: { display: 'flex', gap: 12, marginTop: 4 },
  chgItem: (d) => ({ fontSize: 15, fontWeight: 600, color: d > 0 ? 'var(--up)' : d < 0 ? 'var(--down)' : 'var(--neutral)' }),
  periodRow: { display: 'flex', gap: 4, padding: '0 16px 8px' },
  periodBtn: (active) => ({
    padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: active ? 600 : 400,
    background: active ? 'var(--text1)' : 'var(--bg)', color: active ? '#fff' : 'var(--text2)',
    border: 'none', cursor: 'pointer',
  }),
  statsRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1,
    background: 'var(--border)', margin: '16px 0',
  },
  statItem: { background: 'var(--surface)', padding: '12px 16px' },
  statLabel: { fontSize: 11, color: 'var(--text3)', marginBottom: 4 },
  statVal: { fontSize: 14, fontWeight: 600 },
  holdingBox: {
    margin: '0 16px 16px', padding: '14px 16px', borderRadius: 12,
    background: 'var(--accent-light)', border: '1px solid var(--border)',
  },
  holdTitle: { fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 },
  holdRow: { display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 },
  // Inline order panel
  orderPanel: {
    position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: 'var(--surface)', borderTop: '1px solid var(--border)',
    padding: '10px 16px 12px',
  },
  tabs: { display: 'flex', gap: 6, marginBottom: 10 },
  tab: (active, type) => ({
    flex: 1, height: 38, borderRadius: 8, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
    background: active ? (type === 'buy' ? 'var(--up)' : 'var(--down)') : 'var(--bg)',
    color: active ? '#fff' : 'var(--text3)',
  }),
  qtyRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
    fontSize: 18, fontWeight: 700, background: 'var(--surface)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  qtyInput: {
    flex: 1, height: 36, border: '1px solid var(--border)', borderRadius: 8,
    textAlign: 'center', fontSize: 16, fontWeight: 600, outline: 'none', minWidth: 0,
  },
  quickBtns: { display: 'flex', gap: 4, marginBottom: 8 },
  quickBtn: (active) => ({
    flex: 1, height: 28, borderRadius: 6, border: '1px solid var(--border)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    background: active ? 'var(--accent-light)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text2)',
  }),
  info: { fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.5 },
  submitBtn: (type, disabled) => ({
    width: '100%', height: 46, borderRadius: 10, fontWeight: 700, fontSize: 15, border: 'none', cursor: disabled ? 'default' : 'pointer',
    background: disabled ? 'var(--border)' : (type === 'buy' ? 'var(--up)' : 'var(--down)'),
    color: disabled ? 'var(--text3)' : '#fff',
  }),
  err: { color: 'var(--up)', fontSize: 12, textAlign: 'center', marginBottom: 6 },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const isUp = d.close >= d.open;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
        <span style={{ color: 'var(--text3)' }}>시가</span><span style={{ fontWeight: 600 }}>{fmt(d.open)}원</span>
        <span style={{ color: 'var(--text3)' }}>종가</span><span style={{ fontWeight: 700, color: isUp ? 'var(--up)' : 'var(--down)' }}>{fmt(d.close)}원</span>
      </div>
    </div>
  );
};

export default function StockDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { getCurrentPrice, getStockPriceHistory, portfolio, currentDayIndex, user, favorites, toggleFavorite } = useGameStore();
  const isFav = favorites.includes(code);
  const [period, setPeriod] = useState('전체');
  const [type, setType] = useState('buy');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const stock = STOCK_DATA.find(s => s.code === code) ?? LEVERAGED_DATA.find(s => s.code === code);
  if (!stock) return <div style={{ padding: 24 }}>종목을 찾을 수 없습니다.</div>;
  const isLiquidated = stock.isLeveraged && getCurrentPrice(code) === 0;

  const price = getCurrentPrice(code);
  const allHistory = getStockPriceHistory(code); // already price-factored
  const base = allHistory[0] ?? price;
  const prev = allHistory.length > 1 ? allHistory[allHistory.length - 2] : base;

  const periodDays = PERIODS.find(p => p.label === period)?.days ?? 999;
  const sliced = allHistory.slice(-Math.min(periodDays, allHistory.length));
  const dateSliced = TRADING_DAYS.slice(
    Math.max(0, currentDayIndex + 1 - sliced.length),
    currentDayIndex + 1
  );
  const ohlcData = sliced.map((close, i) => {
    const open = i === 0 ? close : sliced[i - 1];
    const isUp = close >= open;
    const bodyLow = Math.min(open, close);
    const bodyHigh = Math.max(open, close);
    return {
      date: dateSliced[i]?.slice(5) ?? '',
      open, close, isUp,
      bodyLow,
      bodySize: Math.max(bodyHigh - bodyLow, close * 0.001),
    };
  });

  const dayChg = prev > 0 ? ((price - prev) / prev) * 100 : 0;
  const totalChg = base > 0 ? ((price - base) / base) * 100 : 0;
  const sliceMin = Math.min(...sliced);
  const sliceMax = Math.max(...sliced);

  const holding = portfolio?.holdings?.[code];
  const holdingValue = holding ? price * holding.quantity : 0;
  const holdingPnl = holding ? (price - holding.avgPrice) * holding.quantity : 0;
  const holdingPnlPct = holding ? ((price - holding.avgPrice) / holding.avgPrice) * 100 : 0;

  // Order panel state
  const cash = portfolio?.cash ?? 0;
  const maxBuy = Math.floor(cash / price);
  const maxSell = holding?.quantity ?? 0;
  const total = price * qty;
  const canSubmit = !isLiquidated && qty >= 1 && (type === 'buy' ? total <= cash : qty <= maxSell);

  const maxQty = type === 'buy' ? maxBuy : maxSell;
  function adjQty(delta) { setQty(q => Math.min(Math.max(1, q + delta), maxQty || 1)); }

  async function submit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError('');
    try {
      await executeTrade({ userId: user.userId, stockCode: code, stockName: stock.name, type, quantity: qty, price });
      setQty(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate(-1)}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.name}>
            {stock.name}
            {stock.isLeveraged && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: isLiquidated ? 'rgba(240,68,82,0.15)' : 'rgba(230,126,0,0.15)', color: isLiquidated ? 'var(--up)' : '#E67E00' }}>{isLiquidated ? '청산' : '2X'}</span>}
          </div>
          <div style={s.code}>{code} · {SECTOR_KO[stock.sector] ?? stock.sector}</div>
        </div>
        <button
          onClick={() => toggleFavorite(code)}
          style={{ fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: isFav ? '#F0A500' : 'var(--border)', padding: '0 4px' }}
        >
          {isFav ? '★' : '☆'}
        </button>
      </div>

      <div style={s.priceWrap}>
        <div style={s.price}>{fmt(price)}<span style={{ fontSize: 18, fontWeight: 500 }}>원</span></div>
        <div style={s.chgRow}>
          <span style={s.chgItem(dayChg)}>
            {dayChg > 0 ? '▲' : dayChg < 0 ? '▼' : '─'} {Math.abs(dayChg).toFixed(2)}% (전일비)
          </span>
          <span style={s.chgItem(totalChg)}>
            누적 {totalChg > 0 ? '+' : ''}{totalChg.toFixed(2)}%
          </span>
        </div>
      </div>

      <div style={s.periodRow}>
        {PERIODS.map(p => (
          <button key={p.label} style={s.periodBtn(period === p.label)} onClick={() => setPeriod(p.label)}>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 4px' }}>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={ohlcData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)' }} interval="preserveStartEnd" />
            <YAxis domain={[sliceMin * 0.98, sliceMax * 1.02]} tick={{ fontSize: 10, fill: 'var(--text3)' }} tickFormatter={v => fmt(v)} tickCount={5} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="bodyLow" stackId="c" fill="transparent" stroke="none" isAnimationActive={false} />
            <Bar dataKey="bodySize" stackId="c" isAnimationActive={false} maxBarSize={16} minPointSize={1}>
              {ohlcData.map((d, i) => (
                <Cell key={i} fill={d.isUp ? 'var(--up)' : 'var(--down)'} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div style={s.statsRow}>
        {[
          { label: '시작가', val: fmt(base) + '원' },
          { label: '기간 최고', val: fmt(sliceMax) + '원' },
          { label: '기간 최저', val: fmt(sliceMin) + '원' },
        ].map(({ label, val }) => (
          <div key={label} style={s.statItem}>
            <div style={s.statLabel}>{label}</div>
            <div style={s.statVal}>{val}</div>
          </div>
        ))}
      </div>

      {holding && (
        <div style={s.holdingBox}>
          <div style={s.holdTitle}>📦 보유 중</div>
          <div style={s.holdRow}>
            <span style={{ color: 'var(--text2)' }}>{holding.quantity}주 · 평균 {fmt(holding.avgPrice)}원</span>
            <span style={{ color: holdingPnl >= 0 ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>
              {holdingPnl >= 0 ? '+' : ''}{fmt(holdingPnl)}원 ({holdingPnlPct.toFixed(2)}%)
            </span>
          </div>
          <div style={s.holdRow}>
            <span style={{ color: 'var(--text3)', fontSize: 12 }}>평가금액</span>
            <span style={{ fontWeight: 600 }}>{fmt(holdingValue)}원</span>
          </div>
        </div>
      )}

      {/* Inline order panel */}
      <div style={s.orderPanel}>
        <div style={s.tabs}>
          {['buy', 'sell'].map(t => (
            <button key={t} style={s.tab(type === t, t)} onClick={() => { setType(t); setQty(1); setError(''); }}>
              {t === 'buy' ? '매수' : '매도'}
            </button>
          ))}
        </div>

        <div style={s.qtyRow}>
          <button style={s.qtyBtn} onClick={() => adjQty(-1)}>−</button>
          <input
            style={s.qtyInput}
            type="number" min={1} value={qty}
            onChange={e => setQty(Math.min(Math.max(1, parseInt(e.target.value) || 1), maxQty || 1))}
          />
          <button style={s.qtyBtn} onClick={() => adjQty(1)}>+</button>
        </div>

        <div style={s.quickBtns}>
          <button style={s.quickBtn(qty === 1)} onClick={() => setQty(1)}>1주</button>
          <button style={s.quickBtn(false)} onClick={() => setQty(q => Math.min(q + 5, maxQty || 1))}>+5주</button>
          <button style={s.quickBtn(false)} onClick={() => setQty(q => Math.min(q + 10, maxQty || 1))}>+10주</button>
          <button style={s.quickBtn(false)} onClick={() => setQty(type === 'buy' ? maxBuy : maxSell)}>최대</button>
        </div>

        <div style={s.info}>
          {type === 'buy'
            ? <>총 <b>{fmt(total)}원</b> · 보유 현금 {fmt(cash)}원 · 최대 {maxBuy}주</>
            : <>총 <b>{fmt(total)}원</b> · 보유 수량 {maxSell}주</>}
        </div>

        {error && <div style={s.err}>{error}</div>}

        <button style={s.submitBtn(type, !canSubmit || loading)} disabled={!canSubmit || loading} onClick={submit}>
          {loading ? '처리중...' : type === 'buy' ? `${fmt(total)}원 매수` : `${fmt(total)}원 매도`}
        </button>
      </div>
    </div>
  );
}
