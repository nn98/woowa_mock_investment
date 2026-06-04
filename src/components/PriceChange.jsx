export function fmt(n) {
  return new Intl.NumberFormat('ko-KR').format(n);
}

export function fmtMoney(n) {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${fmt(n)}`;
}

export default function PriceChange({ current, base, showAbs = false, style }) {
  if (!base || base === 0) return null;
  const diff = current - base;
  const pct = (diff / base) * 100;
  const cls = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={cls} style={style}>
      {showAbs && `${sign}${fmt(diff)} `}
      {sign}{pct.toFixed(2)}%
    </span>
  );
}
