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

// 기본값
const DEFAULT_STATE = {
  config: {
    accent: 'pastel',
    weekRange: 'mon-fri',
    startHour: 8,
    endHour: 16,
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