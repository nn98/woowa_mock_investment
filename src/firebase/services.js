import {
  doc, getDoc, setDoc, updateDoc, onSnapshot,
  collection, getDocs, writeBatch, serverTimestamp, increment,
  query, where, orderBy, limit
} from 'firebase/firestore';
import { db } from './config';

const GAME_ID = 'main';
const INITIAL_CASH = 1_000_000;

// ── Game State ───────────────────────────────────────────────────────────────

export function subscribeGame(cb) {
  return onSnapshot(doc(db, 'games', GAME_ID), snap => {
    cb(snap.exists() ? snap.data() : null);
  });
}

export async function getGame() {
  const snap = await getDoc(doc(db, 'games', GAME_ID));
  return snap.exists() ? snap.data() : null;
}

export async function initGame(totalDays, secondsPerDay = 8) {
  await setDoc(doc(db, 'games', GAME_ID), {
    status: 'waiting',
    currentDayIndex: 0,
    totalDays,
    secondsPerDay,
    startedAt: null,
    pausedAt: null,
    pausedDayIndex: 0,
    createdAt: serverTimestamp(),
  });
}

export async function startGame() {
  await updateDoc(doc(db, 'games', GAME_ID), {
    status: 'running',
    startedAt: Date.now(),
    pausedAt: null,
    pausedDayIndex: 0,
  });
}

export async function pauseGame(dayIndex) {
  await updateDoc(doc(db, 'games', GAME_ID), {
    status: 'paused',
    pausedAt: Date.now(),
    pausedDayIndex: dayIndex,
  });
}

export async function resumeGame(dayIndex) {
  // Rebase startedAt so dayIndex stays consistent
  const game = await getGame();
  const newStartedAt = Date.now() - dayIndex * game.secondsPerDay * 1000;
  await updateDoc(doc(db, 'games', GAME_ID), {
    status: 'running',
    startedAt: newStartedAt,
    pausedAt: null,
  });
}

export async function setGameSpeed(secondsPerDay, currentDayIndex) {
  // Rebase startedAt to keep current position
  const newStartedAt = Date.now() - currentDayIndex * secondsPerDay * 1000;
  await updateDoc(doc(db, 'games', GAME_ID), {
    secondsPerDay,
    startedAt: newStartedAt,
  });
}

export async function resetGame(totalDays, secondsPerDay = 8) {
  const resetToken = Date.now();
  await setDoc(doc(db, 'games', GAME_ID), {
    status: 'waiting',
    currentDayIndex: 0,
    totalDays,
    secondsPerDay,
    startedAt: null,
    pausedAt: null,
    pausedDayIndex: 0,
    resetToken,
    createdAt: serverTimestamp(),
  });
  // Reset all portfolios
  const snaps = await getDocs(collection(db, 'portfolios'));
  const batch = writeBatch(db);
  snaps.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export async function getOrCreatePortfolio(userId, nickname) {
  const ref = doc(db, 'portfolios', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const data = { userId, nickname, cash: INITIAL_CASH, holdings: {}, totalValue: INITIAL_CASH, updatedAt: serverTimestamp() };
    await setDoc(ref, data);
    return data;
  }
  return snap.data();
}

export function subscribePortfolio(userId, cb) {
  return onSnapshot(doc(db, 'portfolios', userId), snap => {
    cb(snap.exists() ? snap.data() : null);
  });
}

export function subscribeAllPortfolios(cb) {
  return onSnapshot(collection(db, 'portfolios'), snap => {
    cb(snap.docs.map(d => d.data()));
  });
}

export async function executeTrade({ userId, stockCode, stockName, type, quantity, price }) {
  const ref = doc(db, 'portfolios', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('포트폴리오 없음');
  const p = snap.data();

  const total = price * quantity;
  let { cash, holdings } = p;
  const h = holdings[stockCode] || { quantity: 0, avgPrice: 0 };

  if (type === 'buy') {
    if (cash < total) throw new Error('잔액 부족');
    const newQty = h.quantity + quantity;
    const newAvg = Math.round((h.avgPrice * h.quantity + total) / newQty);
    await updateDoc(ref, {
      cash: cash - total,
      [`holdings.${stockCode}`]: { quantity: newQty, avgPrice: newAvg, name: stockName },
      updatedAt: serverTimestamp(),
    });
  } else {
    if (h.quantity < quantity) throw new Error('보유 수량 부족');
    const newQty = h.quantity - quantity;
    if (newQty === 0) {
      const newHoldings = { ...holdings };
      delete newHoldings[stockCode];
      await updateDoc(ref, { cash: cash + total, holdings: newHoldings, updatedAt: serverTimestamp() });
    } else {
      await updateDoc(ref, {
        cash: cash + total,
        [`holdings.${stockCode}`]: { quantity: newQty, avgPrice: h.avgPrice, name: stockName },
        updatedAt: serverTimestamp(),
      });
    }
  }

  // Record transaction
  await setDoc(doc(collection(db, 'transactions')), {
    userId, stockCode, stockName, type, quantity, price, total,
    timestamp: serverTimestamp(),
  });
}

export async function updateTotalValue(userId, totalValue) {
  await updateDoc(doc(db, 'portfolios', userId), { totalValue, updatedAt: serverTimestamp() });
}

export async function getTransactions(userId, maxCount = 100) {
  const q = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(maxCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
