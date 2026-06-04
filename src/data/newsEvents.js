// 2020-03-02(day0) ~ 2020-12-30(day208), 209 trading days
// type: 'hint'(기대) | 'realized'(실현) | 'fake'(실패) | 'info'
export const NEWS_EVENTS = [
  { day: 0, type: 'info', sector: null,
    headline: '코로나19 국내 확진자 4000명 돌파',
    body: '중국발 바이러스가 국내로 급속 확산되며 소비·여행 섹터에 직격탄이 우려됩니다.' },

  { day: 2, type: 'hint', sector: 'biotech',
    headline: '[기대] 국내 바이오 기업들, 코로나 치료제 개발 착수',
    body: '셀트리온·한미약품 등이 항체 치료제 개발에 돌입. 임상 성공 여부가 관건입니다.' },

  { day: 5, type: 'fake', sector: 'consumer',
    headline: '[실패 예고] 마스크·위생용품 특수주 과열 경보',
    body: '단기 수요 폭발이 예상되나, 정부 가격 통제로 기업 수익성은 제한적일 수 있습니다.' },

  { day: 8, type: 'realized', sector: null,
    headline: '[실현] WHO 코로나19 팬데믹 공식 선언',
    body: '세계보건기구가 팬데믹을 선언했습니다. 글로벌 증시 전반에 공포 심리가 확산됩니다.' },

  { day: 10, type: 'realized', sector: null,
    headline: '[실현] 美 연준, 기준금리 0%대 긴급 인하',
    body: '연준이 코로나 충격 대응을 위해 제로금리를 선언. 글로벌 유동성 공급이 본격화됩니다.' },

  { day: 13, type: 'info', sector: null,
    headline: '코스피 역대 최대 일일 낙폭 — 서킷브레이커 발동',
    body: '투매 심리가 극에 달해 거래소가 매매를 일시 정지했습니다. 패닉셀링 구간입니다.' },

  { day: 16, type: 'hint', sector: 'semiconductor',
    headline: '[기대] 재택근무·원격교육 확산 → 서버·PC 반도체 수요 급증 예상',
    body: '글로벌 클라우드 업체들의 데이터센터 투자가 대폭 확대될 전망입니다.' },

  { day: 19, type: 'realized', sector: null,
    headline: '[실현] 정부 100조 원 금융지원 패키지 발표',
    body: '대규모 유동성 공급 발표에 시장 심리가 빠르게 안정되기 시작했습니다.' },

  { day: 22, type: 'fake', sector: 'airline',
    headline: '[실패] 항공주 구제금융 기대 → 실제는 장기 운항 중단',
    body: '정부 지원이 논의되었으나 국제선 운항 중단이 수개월간 지속될 것으로 보입니다.' },

  { day: 28, type: 'hint', sector: 'tech',
    headline: '[기대] 비대면 경제 가속 — 플랫폼·IT 서비스 수혜 기대',
    body: 'NAVER·카카오의 광고·커머스 트래픽이 급증하고 있습니다. 실적 개선 가능성 높음.' },

  { day: 33, type: 'realized', sector: 'biotech',
    headline: '[실현] 셀트리온, 코로나 항체 후보물질 확보 공시',
    body: '항체 치료제 후보물질 확보 소식에 셀트리온 주가가 강하게 반응했습니다.' },

  { day: 40, type: 'realized', sector: null,
    headline: '[실현] "동학개미운동" 본격화 — 개인투자자 역대 최대 순매수',
    body: '외국인 매도 물량을 개인이 흡수하며 지수 방어에 성공. 새로운 시장 구조가 형성 중.' },

  { day: 45, type: 'hint', sector: 'battery',
    headline: '[기대] 전기차 배터리 수주 잔고 급증 — EV 전환 가속화',
    body: 'LG화학·삼성SDI의 유럽 자동차사향 배터리 수주가 빠르게 늘고 있습니다.' },

  { day: 50, type: 'fake', sector: 'finance',
    headline: '[실패] 금융주 배당 확대 기대 → 보수적 배당 동결',
    body: '불확실한 경기 환경에서 주요 금융사들이 배당을 동결하거나 줄였습니다.' },

  { day: 55, type: 'hint', sector: 'tech',
    headline: '[기대] 카카오·NAVER 1분기 실적 서프라이즈 예상',
    body: '트래픽 폭증과 광고 전환이 맞물려 예상을 뛰어넘는 실적이 기대됩니다.' },

  { day: 60, type: 'realized', sector: 'tech',
    headline: '[실현] NAVER·카카오 역대 최대 분기 실적 발표',
    body: '비대면 특수가 실적으로 확인되었습니다. 플랫폼 섹터 전반에 상승 모멘텀.' },

  { day: 68, type: 'realized', sector: null,
    headline: '[실현] 정부 "한국판 뉴딜" 공식 발표 — 160조 원 투자',
    body: '디지털·그린 뉴딜에 대규모 재정 투입 계획. 관련 섹터가 정책 수혜 구간에 진입합니다.' },

  { day: 73, type: 'hint', sector: 'battery',
    headline: '[기대] 그린뉴딜 → 배터리·태양광·수소 대규모 수혜 예상',
    body: '정책 방향이 친환경으로 확정되면서 배터리 소재·셀 업체들이 주목받습니다.' },

  { day: 80, type: 'fake', sector: 'auto',
    headline: '[실패] 자동차 V자 회복 기대 — 글로벌 수요 부진 지속',
    body: '빠른 반등을 기대했지만 유럽·미국 시장 수요 회복이 생각보다 느렸습니다.' },

  { day: 87, type: 'realized', sector: 'semiconductor',
    headline: '[실현] 삼성전자 2분기 영업이익 예상 크게 상회',
    body: '서버 DRAM·NAND 수요 폭증으로 반도체 부문이 시장 기대를 넘어섰습니다.' },

  { day: 92, type: 'hint', sector: 'semiconductor',
    headline: '[기대] 美 화웨이 제재 강화 → 국내 반도체 반사이익 가능성',
    body: '화웨이향 부품 공급 제한으로 대체 수요가 국내 업체에 유입될 수 있습니다.' },

  { day: 98, type: 'realized', sector: 'battery',
    headline: '[실현] LG화학, 배터리 사업부 분할 결정 — LG에너지솔루션 출범',
    body: '배터리 순수 전문 기업으로 재탄생. 기업가치 재평가 국면이 시작됩니다.' },

  { day: 105, type: 'fake', sector: 'display',
    headline: '[실패] OLED 수요 폭발 기대 → 공급 과잉 우려',
    body: '패널 가격이 예상보다 빠르게 하락하며 디스플레이 업체 마진이 압박받았습니다.' },

  { day: 112, type: 'info', sector: null,
    headline: '코스피 연고점 경신 — 개인 매수세가 시장을 끌어올리다',
    body: '2020년 상반기 바닥 대비 60% 이상 반등. 과열 신호인지, 구조적 상승인지 갈림길.' },

  { day: 120, type: 'realized', sector: null,
    headline: '[실현] 과열 우려 차익실현 — 코스피 급조정',
    body: '빠른 상승에 대한 부담으로 외국인·기관의 매도가 한꺼번에 나왔습니다.' },

  { day: 127, type: 'fake', sector: 'biotech',
    headline: '[실패] 국내 코로나 치료제 연내 상용화 기대 → 임상 일정 지연',
    body: '개발 속도가 기대보다 느려 연내 상용화는 어렵다는 분석이 나왔습니다.' },

  { day: 135, type: 'realized', sector: null,
    headline: '[실현] 유럽 코로나 2차 확산 — 경기 회복 기대 재하향',
    body: '유럽 주요국이 다시 봉쇄에 들어가며 글로벌 경기 회복 속도에 의문이 제기됩니다.' },

  { day: 142, type: 'hint', sector: null,
    headline: '[기대] 글로벌 백신 임상 3상 결과 발표 임박',
    body: '화이자·모더나·아스트라제네카 등 주요 백신의 임상 결과가 수주 내 공개 예정입니다.' },

  { day: 148, type: 'hint', sector: 'auto',
    headline: '[기대] 글로벌 전기차 판매 급증 — 자동차주 재평가 가능성',
    body: '테슬라 효과로 글로벌 완성차 업체들의 EV 전환이 가속화되고 있습니다.' },

  { day: 155, type: 'realized', sector: null,
    headline: '[실현] 화이자 백신 임상 3상 90% 이상 효능 발표 — 역사적 뉴스',
    body: '전 세계가 기다리던 백신 뉴스가 터졌습니다! 글로벌 증시 동반 급등.' },

  { day: 157, type: 'realized', sector: null,
    headline: '[실현] 경기민감주 대규모 로테이션 — 항공·여행·금융 급등',
    body: '백신 기대로 봉쇄 피해주가 강하게 반등. 바이오·IT에서 전통 산업으로 자금이 이동합니다.' },

  { day: 162, type: 'fake', sector: 'biotech',
    headline: '[실패] 국내 바이오 백신 개발 기대 — 상용화 최소 1년 이상 소요',
    body: '국내 업체들의 백신 개발 발표가 있었으나 실제 접종까지는 상당한 시간이 필요합니다.' },

  { day: 168, type: 'realized', sector: 'semiconductor',
    headline: '[실현] 글로벌 반도체 공급 부족 심화 — 삼성 파운드리 풀가동',
    body: '차량용·소비자용 반도체 수요가 공급을 크게 초과. 단가 상승이 본격화됩니다.' },

  { day: 175, type: 'hint', sector: 'semiconductor',
    headline: '[기대] DRAM 슈퍼사이클 신호 — 내년 서버 수요 폭증 전망',
    body: '재고 소진 후 본격 수요 회복이 예상됩니다. 반도체 섹터의 새 업사이클 진입 신호.' },

  { day: 182, type: 'realized', sector: null,
    headline: '[실현] 코스피 2020년 사상 최고치 경신 — 3000 돌파 목전',
    body: '외국인 순매수 전환과 유동성 장세가 맞물리며 역대 최고치를 경신했습니다.' },

  { day: 188, type: 'hint', sector: 'battery',
    headline: '[기대] 내년 전기차 보조금 대폭 확대 예고 — 배터리 수요 급증 전망',
    body: '정부의 전기차 보급 목표 상향으로 LG에너지솔루션·삼성SDI 수주 전망이 밝아졌습니다.' },

  { day: 195, type: 'fake', sector: 'auto',
    headline: '[실패] 수소차 인프라 구축 기대 → 충전소 확대 속도 실망',
    body: '수소충전소 구축이 예상보다 크게 느려 관련주가 단기 조정받았습니다.' },

  { day: 202, type: 'realized', sector: null,
    headline: '[실현] 개인투자자 2020년 코스피 순매수 63조 원 — 역대 최대',
    body: '동학개미운동이 증시 역사를 다시 썼습니다. 코스피 연간 +31% 마감.' },
];

// Returns events for a given day index (±0 day exact match)
export function getEventsForDay(dayIndex) {
  return NEWS_EVENTS.filter(e => e.day === dayIndex);
}
