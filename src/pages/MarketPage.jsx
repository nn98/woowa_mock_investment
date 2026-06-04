import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, STOCK_DATA, LEVERAGED_DATA } from '../store/useGameStore';
import { SECTOR_KO } from '../data/users';
import MiniChart from '../components/MiniChart';
import { fmt } from '../components/PriceChange';

if (typeof document !== 'undefined' && !document.getElementById('mkt-anim')) {
  const st = document.createElement('style');
  st.id = 'mkt-anim';
  st.textContent = `@keyframes rowFlash{0%{background:#FFF8E1}100%{background:transparent}}`;
  document.head.appendChild(st);
}

const LEVERAGE_UNLOCK_DAY = 20;
const SORTS = ['등락률', '현재가', '이름'];
const SECTOR_LIST = [...new Set(STOCK_DATA.map(s => SECTOR_KO[s.sector] ?? s.sector))].sort();

const PRICE_FACTOR = 0.85;

function getSectorPerf(dayIndex, days = 5) {
  const result = {};
  const sectorStocks = {};
  STOCK_DATA.forEach(s => {
    const key = SECTOR_KO[s.sector] ?? s.sector;
    if (!sectorStocks[key]) sectorStocks[key] = [];
    sectorStocks[key].push(s);
  });
  const fromIdx = Math.max(0, dayIndex - days);
  Object.entries(sectorStocks).forEach(([sec, stocks]) => {
    let total = 0, count = 0;
    stocks.forEach(s => {
      const base = s.prices[fromIdx] ?? s.prices[0];
      const cur = s.prices[dayIndex] ?? s.prices[s.prices.length - 1];
      if (base > 0) { total += (cur - base) / base * 100; count++; }
    });
    result[sec] = count > 0 ? total / count : 0;
  });
  return result;
}

function SectorBar({ dayIndex }) {
  const perf = useMemo(() => getSectorPerf(dayIndex, 5), [dayIndex]);
  const sorted = Object.entries(perf).sort((a, b) => b[1] - a[1]);
  const top3 = sorted.slice(0, 3);
  const bot3 = sorted.slice(-3).reverse();

  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>📊 5일 섹터 강약 (상위/하위 3)</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          {top3.map(([sec, pct]) => (
            <div key={sec} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: Math.min(40, Math.abs(pct) * 3), height: 6, borderRadius: 3, background: 'var(--up)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--up)', minWidth: 36, textAlign: 'right' }}>+{pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1 }}>
          {bot3.map(([sec, pct]) => (
            <div key={sec} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text2)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: Math.min(40, Math.abs(pct) * 3), height: 6, borderRadius: 3, background: 'var(--down)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--down)', minWidth: 36, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { padding: '0' },
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
  sortRow: { display: 'flex', gap: 8, padding: '0 16px 10px', alignItems: 'center' },
  sortBtn: (active) => ({
    fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text3)', border: 'none', background: 'none', cursor: 'pointer',
  }),
  item: {
    display: 'flex', alignItems: 'center', padding: '11px 16px',
    cursor: 'pointer', borderBottom: '1px solid var(--border)', gap: 10,
  },
  itemLeft: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: 600, marginBottom: 2 },
  sector: { fontSize: 11, color: 'var(--text3)' },
  itemRight: { textAlign: 'right' },
  price: { fontSize: 15, fontWeight: 700 },
  chg: (d) => ({
    fontSize: 12, fontWeight: 600, marginTop: 2,
    color: d > 0 ? 'var(--up)' : d < 0 ? 'var(--down)' : 'var(--neutral)',
  }),
  summary: { padding: '12px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, marginTop: 12 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 11, color: 'var(--text3)', marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: 700 },
  star: (active) => ({
    fontSize: 16, color: active ? '#F0A500' : 'var(--border)',
    background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flexShrink: 0,
  }),
  levBadge: { display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 4, background: '#FFF0D0', color: '#E67E00', marginLeft: 4 },
  liquidated: { display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '1px 4px', borderRadius: 4, background: '#FFE0E0', color: 'var(--up)', marginLeft: 4 },
};

export default function MarketPage() {
  const navigate = useNavigate();
  const { getCurrentPrice, getPrevPrice, getStockPriceHistory, portfolio, currentDayIndex, favorites, toggleFavorite } = useGameStore();
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

  const leverageUnlocked = currentDayIndex >= LEVERAGE_UNLOCK_DAY;
  const allStocks = leverageUnlocked ? [...STOCK_DATA, ...LEVERAGED_DATA] : STOCK_DATA;

  const items = useMemo(() => {
    return allStocks.map(stock => {
      const price = getCurrentPrice(stock.code);
      const prevPrice = getPrevPrice(stock.code);
      const chg = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
      return { ...stock, price, chg, isLiquidated: stock.isLeveraged && price === 0 };
    });
  }, [currentDayIndex, leverageUnlocked]);

  const filtered = useMemo(() => {
    let arr = items;
    if (query) arr = arr.filter(s => s.name.includes(query) || s.code.includes(query));
    if (sector === '레버리지') arr = arr.filter(s => s.isLeveraged);
    else if (sector !== '전체') arr = arr.filter(s => !s.isLeveraged && (SECTOR_KO[s.sector] ?? s.sector) === sector);
    if (sort === '등락률') arr = [...arr].sort((a, b) => b.chg - a.chg);
    else if (sort === '현재가') arr = [...arr].sort((a, b) => b.price - a.price);
    else arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    // Favorites on top (only when not sorted by name/price/sector filter)
    const favs = arr.filter(s => favorites.includes(s.code));
    const rest = arr.filter(s => !favorites.includes(s.code));
    return [...favs, ...rest];
  }, [items, query, sector, sort, favorites]);

  const totalValue = (() => {
    if (!portfolio) return 0;
    let v = portfolio.cash;
    for (const [code, h] of Object.entries(portfolio.holdings || {})) v += getCurrentPrice(code) * h.quantity;
    return v;
  })();

  const baseStocks = items.filter(s => !s.isLeveraged);
  const up = baseStocks.filter(s => s.chg > 0).length;
  const down = baseStocks.filter(s => s.chg < 0).length;

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

      {/* 5-day sector bar */}
      <SectorBar dayIndex={currentDayIndex} />

      <div style={{ height: 10 }} />

      <div style={s.search}>
        <span style={{ fontSize: 16 }}>🔍</span>
        <input style={s.searchInput} placeholder="종목명 검색" value={query} onChange={e => setQuery(e.target.value)} />
        {query && <button onClick={() => setQuery('')} style={{ color: 'var(--text3)', fontSize: 16 }}>✕</button>}
      </div>

      <div style={s.sectorRow}>
        {['전체', ...(leverageUnlocked ? ['레버리지'] : []), ...SECTOR_LIST].map(sec => (
          <button key={sec} style={{
            ...s.sectorChip(sector === sec),
            ...(sec === '레버리지' ? { background: sector === '레버리지' ? '#E67E00' : '#FFF0D0', color: sector === '레버리지' ? '#fff' : '#E67E00', border: '1px solid #E67E00' } : {}),
          }} onClick={() => setSector(sec)}>{sec === '레버리지' ? '⚡ 레버리지' : sec}</button>
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
        const isFav = favorites.includes(stock.code);
        return (
          <div key={stock.code} style={s.item}>
            <button style={s.star(isFav)} onClick={e => { e.stopPropagation(); toggleFavorite(stock.code); }}>
              {isFav ? '★' : '☆'}
            </button>
            <div style={{ ...s.itemLeft, cursor: 'pointer' }} onClick={() => navigate(`/stock/${stock.code}`)}>
              <div style={s.name}>
                {stock.name}
                {stock.isLeveraged && !stock.isLiquidated && <span style={s.levBadge}>2X</span>}
                {stock.isLiquidated && <span style={s.liquidated}>청산</span>}
                {held && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>보유</span>}
              </div>
              <div style={s.sector}>{SECTOR_KO[stock.sector] ?? stock.sector}</div>
            </div>
            <MiniChart prices={history} up={isUp} />
            <div
              key={`${stock.code}-${animKey}`}
              style={{ ...s.itemRight, animation: animKey > 0 ? 'rowFlash 0.5s ease-out' : 'none', cursor: 'pointer' }}
              onClick={() => navigate(`/stock/${stock.code}`)}
            >
              <div style={s.price}>{stock.isLiquidated ? '청산' : fmt(stock.price)}</div>
              <div style={s.chg(stock.chg)}>{stock.chg > 0 ? '+' : ''}{stock.chg.toFixed(2)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
