import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getEventsForDay } from '../data/newsEvents';

const TYPE_STYLE = {
  hint:     { bg: '#EAF2FE', border: '#3182F6', color: '#1A5CB0', icon: '📡', label: '기대' },
  realized: { bg: '#E8F8F0', border: '#27AE60', color: '#166534', icon: '✅', label: '실현' },
  fake:     { bg: '#FFF3CD', border: '#F0A500', color: '#7C4700', icon: '⚠️', label: '실패' },
  info:     { bg: '#F3F4F6', border: '#9CA3AF', color: '#374151', icon: '📰', label: '소식' },
};

export default function NewsToast() {
  const { currentDayIndex } = useGameStore();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const prevDayRef = useRef(-1);
  const timerRef = useRef(null);

  // Enqueue events when day changes
  useEffect(() => {
    if (currentDayIndex === prevDayRef.current) return;
    prevDayRef.current = currentDayIndex;
    const events = getEventsForDay(currentDayIndex);
    if (events.length > 0) {
      setQueue(q => [...q, ...events.map((e, i) => ({ ...e, id: `${currentDayIndex}-${i}` }))]);
    }
  }, [currentDayIndex]);

  // Pop from queue
  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue(q => q.slice(1));
  }, [queue, current]);

  // Auto dismiss
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
      onClick={() => setCurrent(null)}
      style={{
        position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', maxWidth: 448, zIndex: 500,
        background: st.bg, border: `1.5px solid ${st.border}`, borderRadius: 14,
        padding: '12px 16px', cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{st.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: st.border, color: '#fff' }}>
              {st.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{current.headline}</span>
          </div>
          <div style={{ fontSize: 12, color: st.color, opacity: 0.85, lineHeight: 1.5 }}>{current.body}</div>
        </div>
        <button style={{ color: st.color, opacity: 0.6, fontSize: 16, flexShrink: 0 }}>✕</button>
      </div>
      {/* Progress bar */}
      <div style={{ marginTop: 8, height: 2, background: `${st.border}30`, borderRadius: 2 }}>
        <div style={{
          height: '100%', background: st.border, borderRadius: 2,
          animation: 'shrink 5s linear forwards',
        }} />
      </div>
      <style>{`@keyframes shrink{from{width:100%}to{width:0%}}`}</style>
    </div>
  );
}
