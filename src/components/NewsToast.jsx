import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getEventsForDay } from '../data/newsEvents';

export const TYPE_STYLE = {
  hint:     { bg: 'rgba(49,130,246,0.12)',  border: '#3182F6', color: '#3182F6', icon: '📡', label: '기대' },
  realized: { bg: 'rgba(39,174,96,0.12)',   border: '#27AE60', color: '#27AE60', icon: '✅', label: '실현' },
  fake:     { bg: 'rgba(240,165,0,0.12)',   border: '#F0A500', color: '#F0A500', icon: '⚠️', label: '실패' },
  info:     { bg: 'rgba(107,114,128,0.12)', border: '#9CA3AF', color: 'var(--text2)', icon: '📰', label: '소식' },
};

// Manages news queue and populates newsLog — rendered in Layout
export function useNewsQueue() {
  const { currentDayIndex, addNewsItem } = useGameStore();
  const [queue, setQueue] = useState([]);
  // Initialize to currentDayIndex so remounts don't re-fire past events
  const prevDayRef = useRef(currentDayIndex);

  useEffect(() => {
    if (currentDayIndex === prevDayRef.current) return;
    prevDayRef.current = currentDayIndex;
    const events = getEventsForDay(currentDayIndex);
    if (events.length > 0) {
      const items = events.map((e, i) => ({ ...e, id: `${currentDayIndex}-${i}`, dayIndex: currentDayIndex }));
      items.forEach(it => addNewsItem(it));
      setQueue(q => [...q, ...items]);
    }
  }, [currentDayIndex]);

  return { queue, setQueue };
}

// Mobile-only toast popup
export default function NewsToast({ queue, setQueue }) {
  const [current, setCurrent] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue(q => q.slice(1));
  }, [queue, current]);

  useEffect(() => {
    if (!current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCurrent(null), 5000);
    return () => clearTimeout(timerRef.current);
  }, [current]);

  if (!current) return null;
  const st = TYPE_STYLE[current.type] ?? TYPE_STYLE.info;

  return (
    <div
      onClick={() => { clearTimeout(timerRef.current); setCurrent(null); }}
      style={{
        position: 'fixed', top: 68, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', maxWidth: 448, zIndex: 500,
        background: 'var(--surface)', border: `1.5px solid ${st.border}`, borderRadius: 14,
        padding: '12px 16px', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes shrink{from{width:100%}to{width:0%}}
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{st.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: st.border, color: '#fff' }}>{st.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{current.headline}</span>
          </div>
          <div style={{ fontSize: 12, color: st.color, opacity: 0.85, lineHeight: 1.5 }}>{current.body}</div>
        </div>
        <span style={{ color: st.color, opacity: 0.5, fontSize: 14 }}>✕</span>
      </div>
      <div style={{ marginTop: 8, height: 2, background: `${st.border}30`, borderRadius: 2 }}>
        <div style={{ height: '100%', background: st.border, borderRadius: 2, animation: 'shrink 5s linear forwards' }} />
      </div>
    </div>
  );
}
