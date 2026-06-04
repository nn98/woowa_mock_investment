import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { TYPE_STYLE } from './NewsToast';

function useIsDesktop(breakpoint = 960) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= breakpoint);
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [breakpoint]);
  return isDesktop;
}

function NewsItem({ item }) {
  const st = TYPE_STYLE[item.type] ?? TYPE_STYLE.info;
  return (
    <div style={{
      background: 'var(--surface)', border: `1.5px solid ${st.border}`, borderRadius: 10,
      padding: '10px 12px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 14 }}>{st.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: st.border, color: '#fff', flexShrink: 0 }}>{st.label}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: st.color, marginBottom: 3, lineHeight: 1.4 }}>{item.headline}</div>
      <div style={{ fontSize: 11, color: st.color, opacity: 0.8, lineHeight: 1.5 }}>{item.body}</div>
    </div>
  );
}

function SidebarContent({ newsLog, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text1)' }}>📰 뉴스 피드</div>
        {onClose && (
          <button onClick={onClose} style={{ fontSize: 18, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {newsLog.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            게임이 진행되면 뉴스가 쌓입니다
          </div>
        ) : (
          newsLog.map(item => <NewsItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

export default function NewsSidebar({ mobileOpen, onMobileClose }) {
  const { newsLog } = useGameStore();
  const isDesktop = useIsDesktop(960);

  // Desktop: fixed sidebar to the left of the app
  if (isDesktop) {
    return (
      <div style={{
        position: 'fixed',
        right: 'calc(50% + 252px)',   // just left of the 480px app container
        top: 56,
        width: 'min(240px, calc(50vw - 260px))',
        maxHeight: 'calc(100vh - 72px)',
        overflowY: 'auto',
        padding: '12px',
        zIndex: 90,
      }}>
        <SidebarContent newsLog={newsLog} />
      </div>
    );
  }

  // Mobile: overlay drawer from left
  if (!mobileOpen) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex' }}
      onClick={e => e.target === e.currentTarget && onMobileClose()}
    >
      <div style={{
        width: 300, maxWidth: '85vw', height: '100%',
        background: 'var(--surface)', borderRight: '1.5px solid var(--border)',
        padding: '56px 16px 16px',
        overflowY: 'auto',
        animation: 'slideInLeft 0.25s ease-out',
      }}>
        <style>{`@keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
        <SidebarContent newsLog={newsLog} onClose={onMobileClose} />
      </div>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} onClick={onMobileClose} />
    </div>
  );
}
