import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { executeTrade } from '../firebase/services';
import { fmt } from './PriceChange';

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'flex-end', zIndex: 200,
  },
  sheet: {
    background: '#fff', width: '100%', maxWidth: 480, margin: '0 auto',
    borderRadius: '20px 20px 0 0', padding: 24, paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  price: { fontSize: 28, fontWeight: 700, marginBottom: 20 },
  label: { fontSize: 13, color: 'var(--text2)', marginBottom: 6 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border)',
    fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qtyInput: {
    flex: 1, height: 40, border: '1px solid var(--border)', borderRadius: 8,
    textAlign: 'center', fontSize: 18, fontWeight: 600, outline: 'none',
  },
  info: { fontSize: 13, color: 'var(--text2)', marginBottom: 20 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: (active, type) => ({
    flex: 1, height: 44, borderRadius: 10, fontWeight: 600, fontSize: 15,
    border: `1.5px solid ${active ? (type === 'buy' ? 'var(--up)' : 'var(--down)') : 'var(--border)'}`,
    background: active ? (type === 'buy' ? 'var(--up-bg)' : 'var(--down-bg)') : 'transparent',
    color: active ? (type === 'buy' ? 'var(--up)' : 'var(--down)') : 'var(--text3)',
  }),
  submitBtn: (type, disabled) => ({
    width: '100%', height: 52, borderRadius: 12, fontWeight: 700, fontSize: 16,
    background: disabled ? 'var(--border)' : (type === 'buy' ? 'var(--up)' : 'var(--down)'),
    color: disabled ? 'var(--text3)' : '#fff',
    marginBottom: 8,
  }),
  cancelBtn: {
    width: '100%', height: 44, borderRadius: 12, fontWeight: 600, fontSize: 15,
    background: 'var(--bg)', color: 'var(--text2)',
  },
  err: { color: 'var(--up)', fontSize: 13, textAlign: 'center', marginBottom: 8 },
};

export default function OrderModal({ stock, onClose }) {
  const { user, portfolio, getCurrentPrice, game } = useGameStore();
  const [type, setType] = useState('buy');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const price = getCurrentPrice(stock.code);
  const holding = portfolio?.holdings?.[stock.code];
  const cash = portfolio?.cash ?? 0;
  const maxBuy = Math.floor(cash / price);
  const maxSell = holding?.quantity ?? 0;
  const total = price * qty;

  const disabled = qty < 1 || (type === 'buy' && total > cash) || (type === 'sell' && qty > maxSell);

  async function submit() {
    if (disabled) return;
    setLoading(true);
    setError('');
    try {
      await executeTrade({
        userId: user.userId, stockCode: stock.code,
        stockName: stock.name, type, quantity: qty, price,
      });
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function adjQty(delta) {
    setQty(q => Math.max(1, q + delta));
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.sheet}>
        <div style={s.title}>{stock.name}</div>
        <div style={{ ...s.price, color: 'var(--text1)' }}>
          {fmt(price)}원
        </div>

        <div style={s.tabs}>
          {['buy', 'sell'].map(t => (
            <button key={t} style={s.tab(type === t, t)} onClick={() => { setType(t); setQty(1); }}>
              {t === 'buy' ? '매수' : '매도'}
            </button>
          ))}
        </div>

        <div style={s.label}>수량</div>
        <div style={s.qtyRow}>
          <button style={s.qtyBtn} onClick={() => adjQty(-1)}>−</button>
          <input
            style={s.qtyInput}
            type="number" min={1} value={qty}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <button style={s.qtyBtn} onClick={() => adjQty(1)}>+</button>
        </div>

        <div style={s.info}>
          {type === 'buy' ? (
            <>총 <b>{fmt(total)}원</b> · 보유 현금 {fmt(cash)}원 · 최대 {maxBuy}주</>
          ) : (
            <>총 <b>{fmt(total)}원</b> · 보유 수량 {maxSell}주</>
          )}
        </div>

        {/* Quick qty buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 5, 10].map(n => (
            <button key={n} onClick={() => setQty(n)} style={{
              flex: 1, height: 32, borderRadius: 8, border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 500, background: qty === n ? 'var(--accent-light)' : 'transparent',
              color: qty === n ? 'var(--accent)' : 'var(--text2)',
            }}>{n}주</button>
          ))}
          <button onClick={() => setQty(type === 'buy' ? maxBuy : maxSell)} style={{
            flex: 1, height: 32, borderRadius: 8, border: '1px solid var(--border)',
            fontSize: 13, fontWeight: 500, color: 'var(--text2)', background: 'transparent',
          }}>최대</button>
        </div>

        {error && <div style={s.err}>{error}</div>}

        <button style={s.submitBtn(type, disabled || loading)} disabled={disabled || loading} onClick={submit}>
          {loading ? '처리중...' : type === 'buy' ? `${fmt(total)}원 매수` : `${fmt(total)}원 매도`}
        </button>
        <button style={s.cancelBtn} onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
