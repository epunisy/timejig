import { useState, useEffect } from 'react';
import './App.css';
import { saveData, loadData } from './storage';
import Splash from './components/Splash';
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
  // 화면 모드: splash | setup | main | export
  const [mode, setMode] = useState('splash');
  
  // 전체 데이터
  const [data, setData] = useState(DEFAULT_STATE);

  // 방금 "시작하기"로 들어온 진짜 첫 진입인지 (이때만 튜토리얼 자동 표시)
  const [justSetup, setJustSetup] = useState(false);
  
  // 처음 진입 시 저장된 데이터 불러오기
  useEffect(() => {
    const saved = loadData();
    if (saved && saved.timetables && saved.timetables.length > 0 && saved.subjects && saved.subjects.length > 0) {
      // 저장된 데이터 있으면 바로 메인으로
      setData(saved);
      setTimeout(() => setMode('main'), 1000);
    } else {
      // 처음이면 시작 화면으로
      setTimeout(() => setMode('setup'), 1500);
    }
  }, []);
  
  // 데이터 바뀔 때마다 자동 저장
  useEffect(() => {
    if (mode !== 'splash') {
      saveData(data);
    }
  }, [data, mode]);
  
  // 시작 화면에서 "시작하기" 눌렀을 때
  function handleSetupDone(name) {
    setData({
      ...DEFAULT_STATE,
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
      {mode === 'splash' && <Splash />}
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