import { useGameStore } from '../store/useGameStore';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { fmt } from '../components/PriceChange';
import { executeTrade } from '../firebase/services';

// inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('pf-anim')) {
  const style = document.createElement('style');
  style.id = 'pf-anim';
  style.textContent = `
    @keyframes priceFlash {
      0%   { background: #FFF8E1; transform: scaleY(1.08); }
      60%  { background: #FFF8E1; }
      100% { background: transparent; transform: scaleY(1); }
    }
  `;
  document.head.appendChild(style);
}

const s = {
  wrap: { padding: 16 },
  totalBox: {
    background: 'var(--text1)', color: '#fff', borderRadius: 14, padding: '20px 20px', marginBottom: 16,
  },
  totalLabel: { fontSize: 13, opacity: 0.6, marginBottom: 4 },
  totalVal: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
  totalRow: { display: 'flex', gap: 20 },
  totalSub: { fontSize: 13, opacity: 0.7 },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  holdItem: { borderBottom: '1px solid var(--border)' },
  holdTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '14px 0 6px', cursor: 'pointer',
  },
  holdName: { fontSize: 15, fontWeight: 600 },
  holdQty: { fontSize: 12, color: 'var(--text3)', marginTop: 2 },
  holdVal: { fontSize: 15, fontWeight: 700, textAlign: 'right' },
  holdPnl: (p) => ({ fontSize: 13, fontWeight: 600, textAlign: 'right', color: p >= 0 ? 'var(--up)' : 'var(--down)' }),
  priceRow: (flash) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, color: 'var(--text2)',
    padding: '4px 6px', borderRadius: 6, marginBottom: 10,
    animation: flash ? 'priceFlash 0.5s ease-out' : 'none',
    transformOrigin: 'top',
  }),
  priceArrow: (chg) => ({
    fontSize: 12, fontWeight: 700,
    color: chg > 0 ? 'var(--up)' : chg < 0 ? 'var(--down)' : 'var(--text3)',
  }),
  priceNow: (chg) => ({
    fontWeight: 800, fontSize: 15,
    color: chg > 0 ? 'var(--up)' : chg < 0 ? 'var(--down)' : 'var(--text1)',
    fontVariantNumeric: 'tabular-nums',
  }),
  tradeRow: {
    display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 12,
  },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
    fontSize: 16, fontWeight: 700, background: '#fff', cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qtyInput: {
    width: 52, height: 32, border: '1px solid var(--border)', borderRadius: 8,
    textAlign: 'center', fontSize: 14, fontWeight: 600, outline: 'none',
  },
  buyBtn: {
    flex: 1, height: 34, borderRadius: 8, fontWeight: 700, fontSize: 13, border: 'none',
    background: 'var(--up)', color: '#fff', cursor: 'pointer',
  },
  sellBtn: (has) => ({
    flex: 1, height: 34, borderRadius: 8, fontWeight: 700, fontSize: 13, border: 'none',
    background: has ? 'var(--down)' : 'var(--border)', color: has ? '#fff' : 'var(--text3)',
    cursor: has ? 'pointer' : 'default',
  }),
  emptyHold: { textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 14 },
  cashBox: {
    background: 'var(--bg)', borderRadius: 12, padding: '14px 16px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  cashLabel: { fontSize: 14, color: 'var(--text2)' },
  cashVal: { fontSize: 16, fontWeight: 700 },
  errText: { fontSize: 11, color: 'var(--up)', marginLeft: 4 },
};

function HoldingItem({ item, cash, onNavigate }) {
  const { user } = useGameStore();
  const [qty, setQty] = useState(1);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [loadingSell, setLoadingSell] = useState(false);
  const [flash, setFlash] = useState(false);
  const prevPriceRef = useRef(item.price);

  useEffect(() => {
    if (prevPriceRef.current !== item.price) {
      prevPriceRef.current = item.price;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [item.price]);

  const maxSell = item.quantity;
  const maxBuy = Math.floor(cash / item.price);
  const canBuy = qty >= 1 && item.price * qty <= cash;
  const canSell = qty >= 1 && qty <= maxSell;

  async function trade(type) {
    const setLoading = type === 'buy' ? setLoadingBuy : setLoadingSell;
    if (type === 'buy' ? !canBuy : !canSell) return;
    setLoading(true);
    try {
      await executeTrade({ userId: user.userId, stockCode: item.code, stockName: item.name, type, quantity: qty, price: item.price });
      setQty(1);
    } catch (_) {}
    setLoading(false);
  }

  return (
    <div style={s.holdItem}>
      <div style={s.holdTop} onClick={() => onNavigate(item.code)}>
        <div>
          <div style={s.holdName}>{item.name}</div>
          <div style={s.holdQty}>{item.quantity}주 · 평단 {fmt(item.avgPrice)}원</div>
        </div>
        <div>
          <div style={s.holdVal}>{fmt(item.value)}원</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginBottom: 1 }}>
            구매액 {fmt(Math.round(item.avgPrice * item.quantity))}원
          </div>
          <div style={s.holdPnl(item.pnl)}>
            {item.pnl >= 0 ? '+' : ''}{fmt(item.pnl)}원 ({item.pnlPct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 전일 → 당일 가격 */}
      <div key={item.price} style={s.priceRow(flash)}>
        <span style={{ color: 'var(--text3)', fontSize: 11 }}>전일가</span>
        <span style={{ color: 'var(--text2)' }}>{fmt(item.prevPrice)}원</span>
        <span style={s.priceArrow(item.dayChg)}>
          {item.dayChg > 0 ? '▲' : item.dayChg < 0 ? '▼' : '─'}
        </span>
        <span style={s.priceNow(item.dayChg)}>{fmt(item.price)}원</span>
        <span style={{ ...s.priceArrow(item.dayChg), fontSize: 11 }}>
          ({item.dayChg > 0 ? '+' : ''}{item.dayChg.toFixed(2)}%)
        </span>
      </div>

      {/* 인라인 거래 */}
      <div style={s.tradeRow}>
        <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
        <input
          style={s.qtyInput} type="number" min={1} value={qty}
          onChange={e => {
            const v = parseInt(e.target.value) || 1;
            setQty(Math.min(Math.max(1, v), maxSell));
          }}
        />
        <button style={s.qtyBtn} onClick={() => setQty(q => Math.min(q + 1, maxSell))}>+</button>
        <button style={s.buyBtn} disabled={!canBuy || loadingBuy} onClick={() => trade('buy')}>
          {loadingBuy ? '...' : '매수'}
        </button>
        <button style={{
          height: 34, padding: '0 8px', borderRadius: 8, border: 'none', flexShrink: 0,
          fontSize: 12, fontWeight: 700, background: '#FFD0D5', color: 'var(--up)', cursor: 'pointer',
        }} onClick={() => setQty(maxBuy)}>MAX</button>
        <button style={s.sellBtn(canSell)} disabled={!canSell || loadingSell} onClick={() => trade('sell')}>
          {loadingSell ? '...' : '매도'}
        </button>
        <button style={{
          height: 34, padding: '0 8px', borderRadius: 8, border: 'none', flexShrink: 0,
          fontSize: 12, fontWeight: 700, background: '#D0DEFF', color: 'var(--down)', cursor: 'pointer',
        }} onClick={() => setQty(maxSell)}>MAX</button>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { portfolio, getCurrentPrice, getPrevPrice, user } = useGameStore();

  if (!portfolio) return <div style={{ padding: 24, color: 'var(--text2)' }}>로딩 중...</div>;

  const holdings = Object.entries(portfolio.holdings || {});
  const stockValue = holdings.reduce((sum, [code, h]) => sum + getCurrentPrice(code) * h.quantity, 0);
  const totalValue = portfolio.cash + stockValue;
  const totalPnl = totalValue - 1_000_000;
  const totalPnlPct = (totalPnl / 1_000_000) * 100;

  const holdingItems = holdings.map(([code, h]) => {
    const price = getCurrentPrice(code);
    const prevPrice = getPrevPrice(code);
    const dayChg = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
    const value = price * h.quantity;
    const pnl = (price - h.avgPrice) * h.quantity;
    const pnlPct = ((price - h.avgPrice) / h.avgPrice) * 100;
    return { code, ...h, price, prevPrice, dayChg, value, pnl, pnlPct };
  }).sort((a, b) => b.value - a.value);

  return (
    <div style={s.wrap}>
      <div style={s.totalBox}>
        <div style={s.totalLabel}>총 자산 ({user?.nickname})</div>
        <div style={s.totalVal}>{fmt(totalValue)}<span style={{ fontSize: 18, fontWeight: 500 }}>원</span></div>
        <div style={s.totalRow}>
          <div style={s.totalSub}>
            수익 <span style={{ color: totalPnl >= 0 ? '#FF8080' : '#80B0FF', fontWeight: 700 }}>
              {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)}원
            </span>
          </div>
          <div style={s.totalSub}>
            수익률 <span style={{ color: totalPnl >= 0 ? '#FF8080' : '#80B0FF', fontWeight: 700 }}>
              {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div style={s.cashBox}>
        <span style={s.cashLabel}>💵 보유 현금</span>
        <span style={s.cashVal}>{fmt(portfolio.cash)}원</span>
      </div>
      <div style={{ ...s.cashBox, marginBottom: 16 }}>
        <span style={s.cashLabel}>📦 주식 평가액</span>
        <span style={s.cashVal}>{fmt(stockValue)}원</span>
      </div>

      <div style={s.sectionTitle}>보유 종목 ({holdingItems.length})</div>

      {holdingItems.length === 0 ? (
        <div style={s.emptyHold}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div>보유 종목이 없습니다</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>시장에서 종목을 매수해보세요</div>
        </div>
      ) : (
        holdingItems.map(item => (
          <HoldingItem
            key={item.code}
            item={item}
            cash={portfolio.cash}
            onNavigate={(code) => navigate(`/stock/${code}`)}
          />
        ))
      )}
    </div>
  );
}
