import { useState, useEffect } from 'react';
import './App.css';
import { saveData, loadData } from './storage';
import Setup from './components/Setup';
import Main from './components/Main';
import Export from './components/Export';

// 색띠 옵션
export const ACCENT_PASTEL = [
  '#B5D4F4','#9FE1CB','#F5C4B3','#CECBF6',
  '#FAC775','#F4C0D1','#C0DD97','#D3D1C7'
];
export const ACCENT_MONO = [
  '#E0E0E0','#C4C4C4','#A8A8A8','#888888',
  '#666666','#444444','#222222','#000000'
];

export function getAccents(accent) {
  if (accent === 'pastel') return ACCENT_PASTEL;
  if (accent === 'mono') return ACCENT_MONO;
  return null;
}

// 글씨체 (시간표/배경화면에만 적용) — 나중에 골라서 줄일 예정
export const FONTS = [
  { key: 'system', label: '기본', family: null },
  { key: 'jua', label: '주아', family: "'Jua', sans-serif" },
  { key: 'hand', label: '개구', family: "'Gaegu', cursive" },
  { key: 'gowun', label: '고운돋움', family: "'Gowun Dodum', sans-serif" },
  { key: 'myeongjo', label: '나눔명조', family: "'Nanum Myeongjo', serif" },
  { key: 'dohyeon', label: '도현', family: "'Do Hyeon', sans-serif" },
  { key: 'gamja', label: '감자꽃', family: "'Gamja Flower', cursive" },
  { key: 'himelody', label: '하이멜로디', family: "'Hi Melody', cursive" },
  { key: 'poorstory', label: '포어스토리', family: "'Poor Story', cursive" },
  { key: 'yeonsung', label: '연성', family: "'Yeon Sung', cursive" },
  { key: 'caveat', label: 'Caveat', family: "'Caveat', 'Apple SD Gothic Neo', 'Noto Sans KR', cursive" },
  { key: 'patrick', label: 'Patrick', family: "'Patrick Hand', 'Apple SD Gothic Neo', 'Noto Sans KR', cursive" },
];

export function getFontFamily(font) {
  const f = FONTS.find(x => x.key === font);
  return f ? f.family : null; // 기본(시스템 고딕)이면 null
}

// 배경 테마 (시간표 표를 제외한 배경화면 전체에 적용)
function svgBg(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const NS = "xmlns='http://www.w3.org/2000/svg'";
export const BACKGROUNDS = [
  { key: 'white', label: '기본', css: '#ffffff', text: '#444444' },
  { key: 'black', label: '블랙', css: '#1f1f1f', text: '#ededed' },
  { key: 'cream', label: '크림', css: '#fbf3e4', text: '#7a6a4f' },
  { key: 'pink', label: '핑크', css: '#ffd9e6', text: '#8a5566' },
  { key: 'blue', label: '파랑', css: '#d7e8ff', text: '#3a5a86' },
  { key: 'green', label: '초록', css: '#0b6b4f', text: '#ffffff' },
  {
    key: 'graph', label: '모눈', text: '#5a5a5a',
    css: svgBg(`<svg ${NS} width='26' height='26'><rect width='26' height='26' fill='#ffffff'/><path d='M26 0H0V26' fill='none' stroke='#d7e3f0' stroke-width='1'/></svg>`),
  },
  {
    key: 'check', label: '체크', text: '#8a5566',
    css: svgBg(`<svg ${NS} width='40' height='40'><rect width='40' height='40' fill='#ffe9f0'/><rect width='20' height='20' fill='#ffffff'/><rect x='20' y='20' width='20' height='20' fill='#ffffff'/></svg>`),
  },
  {
    key: 'gingham', label: '깅엄체크', text: '#5a4a4a',
    css: svgBg(`<svg ${NS} width='40' height='40'><rect width='40' height='40' fill='#ffffff'/><rect width='20' height='40' fill='#f59ab4' opacity='0.4'/><rect width='40' height='20' fill='#f59ab4' opacity='0.4'/></svg>`),
  },
  {
    key: 'cloud', label: '구름', text: '#3a5a86',
    css: svgBg(`<svg ${NS} width='120' height='90'><rect width='120' height='90' fill='#d7ecff'/><g fill='#ffffff'><ellipse cx='28' cy='30' rx='22' ry='14'/><ellipse cx='50' cy='26' rx='18' ry='15'/><ellipse cx='44' cy='40' rx='25' ry='12'/><ellipse cx='95' cy='66' rx='20' ry='13'/><ellipse cx='110' cy='60' rx='15' ry='13'/></g></svg>`),
  },
];

export function getBackground(bg) {
  return BACKGROUNDS.find(b => b.key === bg) || BACKGROUNDS[0];
}

// 기본값
const DEFAULT_STATE = {
  config: {
    accent: 'pastel',
    weekRange: 'mon-fri',
    startHour: 8,
    endHour: 16,
    font: 'system',
    dayLang: 'ko',
    bg: 'white',
  },
  timetables: [
    { id: 1, name: '시간표', blocks: [] }
  ],
  activeTT: 1,
  subjects: [],
  tutorialDone: false,
};

function App() {
  // 스플래시 없이 시작 — 저장된 데이터가 있으면 메인, 없으면 첫 설정 화면
  const [boot] = useState(() => {
    const saved = loadData();
    const valid = saved && saved.timetables && saved.timetables.length > 0 && saved.subjects && saved.subjects.length > 0;
    return { data: valid ? saved : DEFAULT_STATE, mode: valid ? 'main' : 'setup' };
  });

  // 화면 모드: setup | main | export
  const [mode, setMode] = useState(boot.mode);

  // 전체 데이터
  const [data, setData] = useState(boot.data);

  // 방금 "시작하기"로 들어온 진짜 첫 진입인지 (이때만 튜토리얼 자동 표시)
  const [justSetup, setJustSetup] = useState(false);

  // 데이터 바뀔 때마다 자동 저장 (설정 완료 후 메인/내보내기에서만)
  useEffect(() => {
    if (mode === 'main' || mode === 'export') {
      saveData(data);
    }
  }, [data, mode]);
  
  // 시작 화면에서 "시작하기" 눌렀을 때 (이름·시간 범위 반영)
  function handleSetupDone(name, startHour, endHour, accent) {
    const config = { ...DEFAULT_STATE.config };
    if (Number.isInteger(startHour) && Number.isInteger(endHour) && endHour > startHour) {
      config.startHour = startHour;
      config.endHour = endHour;
    }
    if (['pastel', 'mono', 'none'].includes(accent)) {
      config.accent = accent;
    }
    setData({
      ...DEFAULT_STATE,
      config,
      timetables: [{ id: 1, name: name || '시간표', blocks: [] }],
      subjects: [
        { id: 101, name: '국어', duration: 60, colorIndex: 0, active: true },
        { id: 102, name: '영어', duration: 60, colorIndex: 1, active: true },
        { id: 103, name: '수학', duration: 60, colorIndex: 2, active: true },
      ],
    });
    setJustSetup(true);
    setMode('main');
  }

  return (
    <>
      {mode === 'setup' && <Setup onDone={handleSetupDone} />}
      {mode === 'main' && (
        <Main
          data={data}
          setData={setData}
          autoTutorial={justSetup}
          onGoExport={() => setMode('export')}
        />
      )}
      {mode === 'export' && (
        <Export
          data={data}
          setData={setData}
          onBack={() => setMode('main')}
        />
      )}
    </>
  );
}

export default App;