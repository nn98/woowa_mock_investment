import { STOCK_DATA } from './stockData.js';

const LEVERAGE_TARGETS = [
  { code: '005930', sector: 'semiconductor' },
  { code: '068270', sector: 'biotech' },
  { code: '051910', sector: 'battery' },
  { code: '035420', sector: 'tech' },
  { code: '005380', sector: 'auto' },
  { code: '105560', sector: 'finance' },
  { code: '066570', sector: 'electronics' },
  { code: '017670', sector: 'telecom' },
];

function computeLeveragedPrices(basePrices, startPrice = 10000) {
  const prices = [startPrice];
  for (let i = 1; i < basePrices.length; i++) {
    const prev = basePrices[i - 1];
    const curr = basePrices[i];
    const dailyReturn = prev > 0 ? (curr - prev) / prev : 0;
    const prevLev = prices[prices.length - 1];
    if (prevLev === 0) {
      prices.push(0);
    } else {
      prices.push(Math.max(0, Math.round(prevLev * (1 + 2 * dailyReturn))));
    }
  }
  return prices;
}

export const LEVERAGED_DATA = LEVERAGE_TARGETS.map(target => {
  const base = STOCK_DATA.find(s => s.code === target.code);
  if (!base) return null;
  return {
    code: `LV-${target.code}`,
    name: `${base.name} 레버리지 2X`,
    sector: target.sector,
    leverage: 2,
    baseCode: target.code,
    prices: computeLeveragedPrices(base.prices),
    isLeveraged: true,
  };
}).filter(Boolean);

export const LEVERAGED_MAP = {};
LEVERAGED_DATA.forEach((s, i) => { LEVERAGED_MAP[s.code] = i; });
