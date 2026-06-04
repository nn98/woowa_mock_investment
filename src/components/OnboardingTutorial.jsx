import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

const STEPS = [
  {
    icon: '📊',
    title: '시장에서 종목을 찾으세요',
    desc: '120개 코스피 종목과 레버리지 2X 상품이 있습니다. 섹터별 필터로 원하는 종목을 빠르게 찾아보세요.',
  },
  {
    icon: '📡',
    title: '뉴스 이벤트를 주목하세요',
    desc: '날짜가 바뀔 때마다 실제 2020년 이벤트 기반의 힌트·실현·실패 소식이 표시됩니다. 힌트를 참고해 투자하세요.',
  },
  {
    icon: '⚡',
    title: '빠르게 거래하세요',
    desc: '종목 상세 화면에서 수량을 설정하고 바로 매수·매도할 수 있습니다. 내 주식 탭에서도 즉시 거래 가능합니다.',
  },
  {
    icon: '🏆',
    title: '수익률로 경쟁하세요',
    body: '순위 탭에서 실시간 랭킹을 확인하고, 분석 탭에서 내 자산 변화 그래프를 확인하세요.',
    desc: '순위 탭에서 실시간 랭킹을 확인하고, 분석 탭에서 내 자산 변화를 추적하세요.',
  },
];

export default function OnboardingTutorial() {
  const { setOnboardingDone } = useGameStore();
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--surface)', width: '100%', maxWidth: 480,
        borderRadius: '24px 24px 0 0', padding: '32px 24px 40px',
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? 'var(--accent)' : 'var(--border)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{s.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{s.title}</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{s.desc}</div>
        </div>

        <button
          onClick={() => isLast ? setOnboardingDone() : setStep(s => s + 1)}
          style={{
            width: '100%', height: 52, borderRadius: 14, fontWeight: 700, fontSize: 16,
            background: 'var(--accent)', color: '#fff', border: 'none',
          }}
        >
          {isLast ? '시작하기 🚀' : '다음 →'}
        </button>

        <button
          onClick={setOnboardingDone}
          style={{ width: '100%', marginTop: 12, fontSize: 13, color: 'var(--text3)', background: 'none', border: 'none' }}
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
