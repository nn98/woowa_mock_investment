import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, STOCK_DATA, LEVERAGED_DATA } from '../store/useGameStore';
import { SECTOR_KO } from '../data/users';
import MiniChart from '../components/MiniChart';
import { fmt } from '../components/PriceChange';

// inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('mkt-anim')) {
  const st = document.createElement('style');
  st.id = 'mkt-anim';
  st.textContent = `@keyframes rowFlash { 0%{background:#FFF8E1} 100%{background:transparent} }`;
  document.head.appendChild(st);
}

const ALL_STOCKS = [...STOCK_DATA, ...LEVERAGED_DATA];
const SORTS = ['등락률', '현재가', '이름'];
const SECTORS = ['전체', ...new Set(ALL_STOCKS.map(s => SECTOR_KO[s.sector] ?? s.sector))].sort((a, b) => a === '전체' ? -1 : 0);

const s = {
  wrap: { padding: '16px 0' },
  search: {
    margin: '0 16px 12px', display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg)', borderRadius: 10, padding: '10px 14px',
  },
  searchInput: { flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text1)' },
  sectorRow: { display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' },
  sectorChip: (active) => ({
    flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    background: active ? 'var(--accent)' : 'var(--bg)',
    color: active ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer',
  }),
  sortRow: { display: 'flex', gap: 8, padding: '0 16px 12px', alignItems: 'center' },
  sortBtn: (active) => ({
    fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text3)', border: 'none', background: 'none', cursor: 'pointer',
  }),
  item: {
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    cursor: 'pointer', borderBottom: '1px solid var(--border)', gap: 12,
  },
  itemLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: 600, marginBottom: 2 },
  sector: { fontSize: 12, color: 'var(--text3)' },
  itemRight: { textAlign: 'right' },
  price: { fontSize: 16, fontWeight: 700 },
  chg: (d) => ({
    fontSize: 13, fontWeight: 600, marginTop: 2,
    color: d > 0 ? 'var(--up)' : d < 0 ? 'var(--down)' : 'var(--neutral)',
  }),
  summary: { padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 11, color: 'var(--text3)', marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: 700 },
  levBadge: {
    display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '1px 5px',
    borderRadius: 4, background: '#FFF0D0', color: '#E67E00', marginLeft: 4,
  },
  liquidated: {
    display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '1px 5px',
    borderRadius: 4, background: '#FFE0E0', color: 'var(--up)', marginLeft: 4,
  },
};

export default function MarketPage() {
  const navigate = useNavigate();
  const { getCurrentPrice, getPrevPrice, getStockPriceHistory, portfolio, currentDayIndex } = useGameStore();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('전체');
  const [sort, setSort] = useState('등락률');
  const [animKey, setAnimKey] = useState(0);
  const prevDayRef = useRef(currentDayIndex);

  useEffect(() => {
    if (prevDayRef.current !== currentDayIndex) {
      prevDayRef.current = currentDayIndex;
      setAnimKey(k => k + 1);
    }
  }, [currentDayIndex]);

  const items = useMemo(() => {
    return ALL_STOCKS.map(stock => {
      const price = getCurrentPrice(stock.code);
      const prevPrice = getPrevPrice(stock.code);
      const chg = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
      const isLiquidated = stock.isLeveraged && price === 0;
      return { ...stock, price, prevPrice, chg, isLiquidated };
    });
  }, [currentDayIndex]);

  const filtered = useMemo(() => {
    let arr = items;
    if (query) arr = arr.filter(s => s.name.includes(query) || s.code.includes(query));
    if (sector !== '전체') arr = arr.filter(s => (SECTOR_KO[s.sector] ?? s.sector) === sector);
    if (sort === '등락률') arr = [...arr].sort((a, b) => b.chg - a.chg);
    else if (sort === '현재가') arr = [...arr].sort((a, b) => b.price - a.price);
    else arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [items, query, sector, sort]);

  const totalValue = (() => {
    if (!portfolio) return 0;
    let v = portfolio.cash;
    for (const [code, h] of Object.entries(portfolio.holdings || {})) {
      v += getCurrentPrice(code) * h.quantity;
    }
    return v;
  })();

  const up = items.filter(s => s.chg > 0 && !s.isLeveraged).length;
  const down = items.filter(s => s.chg < 0 && !s.isLeveraged).length;

  return (
    <div style={s.wrap}>
      {portfolio && (
        <div style={s.summary}>
          <div style={s.summaryItem}>
            <div style={s.summaryLabel}>내 자산</div>
            <div style={s.summaryValue}>{fmt(totalValue)}원</div>
          </div>
          <div style={s.summaryItem}>
            <div style={s.summaryLabel}>수익률</div>
            <div style={{ ...s.summaryValue, color: totalValue >= 1_000_000 ? 'var(--up)' : 'var(--down)' }}>
              {totalValue >= 1_000_000 ? '+' : ''}{((totalValue - 1_000_000) / 1_000_000 * 100).toFixed(2)}%
            </div>
          </div>
          <div style={s.summaryItem}>
            <div style={s.summaryLabel}>시장 ({up}↑ {down}↓)</div>
            <div style={s.summaryValue}>{STOCK_DATA.length}종목</div>
          </div>
        </div>
      )}

      <div style={s.search}>
        <span style={{ fontSize: 16 }}>🔍</span>
        <input
          style={s.searchInput} placeholder="종목명 검색"
          value={query} onChange={e => setQuery(e.target.value)}
        />
        {query && <button onClick={() => setQuery('')} style={{ color: 'var(--text3)', fontSize: 16 }}>✕</button>}
      </div>

      <div style={s.sectorRow}>
        {SECTORS.map(sec => (
          <button key={sec} style={s.sectorChip(sector === sec)} onClick={() => setSector(sec)}>{sec}</button>
        ))}
      </div>

      <div style={s.sortRow}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>정렬:</span>
        {SORTS.map(sv => (
          <button key={sv} style={s.sortBtn(sort === sv)} onClick={() => setSort(sv)}>{sv}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filtered.length}종목</span>
      </div>

      {filtered.map(stock => {
        const history = getStockPriceHistory(stock.code);
        const isUp = stock.chg >= 0;
        const held = portfolio?.holdings?.[stock.code];
        return (
          <div
            key={stock.code}
            style={{
              ...s.item,
              animation: `rowFlash 0.5s ease-out`,
              animationPlayState: 'running',
            }}
            onClick={() => navigate(`/stock/${stock.code}`)}
          >
            <div style={s.itemLeft}>
              <div style={s.name}>
                {stock.name}
                {stock.isLeveraged && !stock.isLiquidated && <span style={s.levBadge}>2X</span>}
                {stock.isLiquidated && <span style={s.liquidated}>청산</span>}
                {held && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>보유</span>}
              </div>
              <div style={s.sector}>{SECTOR_KO[stock.sector] ?? stock.sector}</div>
            </div>
            <MiniChart prices={history} up={isUp} />
            <div
              key={`${stock.code}-${animKey}`}
              style={{
                ...s.itemRight,
                animation: animKey > 0 ? 'rowFlash 0.5s ease-out' : 'none',
              }}
            >
              <div style={s.price}>{stock.isLiquidated ? '청산' : fmt(stock.price)}</div>
              <div style={s.chg(stock.chg)}>
                {stock.chg > 0 ? '+' : ''}{stock.chg.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
