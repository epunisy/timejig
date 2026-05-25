// 다국어 키 모음
// 나중에 영어·중국어 추가할 때 ko 옆에 en, zh 만 추가하면 됨

const translations = {
  ko: {
    // 공통
    appName: 'TimeJig',
    appSubtitle: '시간퍼즐',
    
    // 시작 화면
    welcome: '환영해요! 👋',
    setupGuide: '시간표 이름을 알려주세요',
    namePlaceholder: '예: 민준',
    start: '시작하기',
    setupHint: '월–금, 8:00–16:00, 파스텔로 시작해요.\n나중에 ⚙ 설정에서 다 바꿀 수 있어요.',
    
    // 메인 화면
    addTimetable: '+',
    timetableName: '시간표 이름',
    duplicate: '복제',
    deleteTimetable: '시간표 삭제',
    backgroundButton: '🖼 배경화면',
    settingsButton: '⚙ 설정',
    
    // 과목 팔레트
    subjects: '과목',
    addSubject: '+ 추가',
    emptySubjects: '아직 과목이 없어요.\n+ 추가로 시작!',
    edit: '편집',
    activate: '활성',
    deactivate: '비활성',
    delete: '삭제',
    
    // 과목 모달
    subjectName: '과목명',
    subjectDuration: '소요시간 (분)',
    colorBand: '색띠',
    cancel: '취소',
    save: '저장',
    
    // 설정
    settings: '설정',
    weekRange: '요일 범위',
    monFri: '월 – 금',
    monSun: '월 – 일',
    timeRange: '시간 범위',
    accentNone: '없음',
    accentPastel: '파스텔',
    accentMono: '흑백',
    showTutorial: '튜토리얼 다시 보기',
    done: '완료',
    
    // 튜토리얼
    tutorialTitle: '👋 시작하기 전에',
    tutorialStep1Title: '과목 추가',
    tutorialStep1: '오른쪽 + 추가로 과목을 만들어요. 기본으로 국어, 영어, 수학이 있어요.',
    tutorialStep2Title: '드래그',
    tutorialStep2: '과목을 시간표로 끌어다 놓으세요. 10분 단위로 자동 정렬돼요.',
    tutorialStep3Title: '이동·삭제',
    tutorialStep3: '시간표 블록은 다시 끌어서 이동 가능. 하단 휴지통으로 끌면 삭제돼요.',
    tutorialStep4Title: '시간표 관리',
    tutorialStep4: '상단 탭 옆의 ⎘ 로 시간표 복제, + 로 새 시간표. ⚙ 설정에서 요일·시간·색띠 변경.',
    dontShowAgain: '다시 보지 않기',
    gotIt: '알겠어요',
    
    // 배경화면 만들기
    backButton: '← 돌아가기',
    backgroundTitle: '배경화면 만들기',
    section1: '1. 시간표 선택 (콜라주)',
    section2: '2. 폰 비율',
    section3: '3. 표시 옵션',
    autoFit: '내 폰에 맞춤 (자동)',
    recommended: '권장',
    normalPhone: '일반 폰',
    longPhone: '긴 화면',
    squarePhone: '정사각형에 가까움',
    foldPhone: '폴드 펼침',
    showMorePhones: '▼ 다른 폰 비율 보기',
    subjectOnly: '과목명만',
    subjectWithTime: '과목명 + 시간',
    downloadPNG: '📥 PNG 다운로드',
    selectAtLeastOne: '시간표를 1개 이상 선택하세요',
    selectedCount: (n) => `${n}개 시간표 선택됨`,
    
    // 휴지통
    trashHint: '🗑 시간표 블록을 여기로 끌어서 삭제',
    
    // 확인 모달
    confirmDelete: '삭제',
    timetableDeleteConfirm: (name) => `${name} 시간표를 삭제할까요?`,
    timetableDeleteWarn: '배치된 블록도 함께 사라집니다.',
    subjectDeleteConfirm: (name) => `${name} 과목을 삭제할까요?`,
    subjectDeleteWarn: (count) => `배치된 ${count}개의 블록도 사라집니다.`,
    
    // 기본 과목
    defaultSubject1: '국어',
    defaultSubject2: '영어',
    defaultSubject3: '수학',
    
    // 요일
    days: ['월','화','수','목','금','토','일'],
  },
  
  // 영어 (나중에 추가할 자리)
  en: {
    // TODO: 영어 번역
  },
  
  // 중국어 (나중에 추가할 자리)
  zh: {
    // TODO: 중국어 번역
  },
};

// 현재 언어 감지 (폰 언어 자동 감지)
export function getLocale() {
  const lang = navigator.language || 'ko';
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('en')) return 'en';
  return 'ko'; // 기본은 한국어
}

// 번역 함수
export function t(key, ...args) {
  const locale = getLocale();
  const dict = translations[locale] || translations.ko;
  const value = dict[key] !== undefined ? dict[key] : translations.ko[key];
  
  // 함수면 인자 넣어서 호출 (예: t('selectedCount', 3))
  if (typeof value === 'function') return value(...args);
  return value;
}