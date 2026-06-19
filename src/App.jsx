import { useState, useEffect, useRef } from 'react';
import './App.css';
import { saveData, loadData } from './storage';
import Setup from './components/Setup';
import Main from './components/Main';
import Export from './components/Export';
import { auth, db, doc, setDoc, onSnapshot, onAuthStateChanged, signInGoogle, signOutGoogle } from './firebase';

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

// 과목 분류(색띠) — 분류 = 색. 색띠 그래프(포션)도 이 분류로 묶는다.
export const CATEGORIES = ['국어', '영어', '수학', '사회', '과학', '예체능', '기타'];

// 글씨체 (시간표/잠금화면에만 적용) — 나중에 골라서 줄일 예정
export const FONTS = [
  { key: 'system', label: '기본', family: null },
  { key: 'jua', label: '주아', family: "'Jua', sans-serif" },
  { key: 'hand', label: '개구', family: "'Gaegu', cursive" },
  { key: 'gowun', label: '고운돋움', family: "'Gowun Dodum', sans-serif" },
  { key: 'nanumgothic', label: '나눔고딕', family: "'Nanum Gothic', sans-serif" },
  { key: 'myeongjo', label: '나눔명조', family: "'Nanum Myeongjo', serif" },
  { key: 'gowunbatang', label: '고운바탕', family: "'Gowun Batang', serif" },
  { key: 'dohyeon', label: '도현', family: "'Do Hyeon', sans-serif" },
  { key: 'gamja', label: '감자꽃', family: "'Gamja Flower', cursive" },
  { key: 'himelody', label: '하이멜로디', family: "'Hi Melody', cursive" },
  { key: 'poorstory', label: '포어스토리', family: "'Poor Story', cursive" },
  { key: 'yeonsung', label: '연성', family: "'Yeon Sung', cursive" },
  { key: 'caveat', label: 'Caveat', family: "'Caveat', 'Apple SD Gothic Neo', 'Noto Sans KR', cursive" },
  { key: 'patrick', label: 'Patrick', family: "'Patrick Hand', 'Apple SD Gothic Neo', 'Noto Sans KR', cursive" },
  { key: 'playfair', label: 'Playfair', family: "'Playfair Display', 'Apple SD Gothic Neo', 'Noto Sans KR', serif" },
  { key: 'courier', label: 'Courier', family: "'Courier Prime', 'Apple SD Gothic Neo', 'Noto Sans KR', monospace" },
];

export function getFontFamily(font) {
  const f = FONTS.find(x => x.key === font);
  return f ? f.family : null; // 기본(시스템 고딕)이면 null
}

// 글씨 크기 배율 (편집 화면 + 내보내기 둘 다 적용)
export const FONT_SCALES = { sm: 0.85, md: 1, lg: 1.2, xl: 1.45 };
export function getFontScale(key) {
  return FONT_SCALES[key] || 1;
}

// 배경 테마 (시간표 표를 제외한 잠금화면 전체에 적용)
function svgBg(svg) {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const NS = "xmlns='http://www.w3.org/2000/svg'";
// 사진 위 글씨 가독용 외곽 그림자 (밝은 배경=검정글씨+흰글로우 / 어두운 배경=흰글씨+검정그림자)
const WHITE_GLOW = '0 0 3px rgba(255,255,255,0.9), 0 1px 2px rgba(255,255,255,0.7)';
const DARK_SHADOW = '0 1px 3px rgba(0,0,0,0.6)';
// 영역 밝기(0~255)에 따라 글씨색/그림자 자동 선택
export function textForLuma(luma) {
  return luma > 150
    ? { text: '#1f1f1f', shadow: WHITE_GLOW }
    : { text: '#ffffff', shadow: DARK_SHADOW };
}
// tile = 무늬 한 칸 크기(1080px 배경 기준). 미리보기/스와치는 비율로 축소해서 그림.
export const BACKGROUNDS = [
  { key: 'white', label: '기본', css: '#ffffff', text: '#444444', tile: 0 },
  { key: 'black', label: '블랙', css: '#1f1f1f', text: '#ededed', tile: 0, dark: true },
  { key: 'cream', label: '크림', css: '#fbf3e4', text: '#7a6a4f', tile: 0 },
  { key: 'pink', label: '핑크', css: '#ffd9e6', text: '#8a5566', tile: 0 },
  { key: 'blue', label: '파랑', css: '#d7e8ff', text: '#3a5a86', tile: 0 },
  { key: 'sky', label: '하늘', image: '/bg-sky.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'softdawn', label: '새벽호수', image: '/bg-softdawn.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'bluepetals', label: '블루꽃', image: '/bg-bluepetals.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'canvas', label: '캔버스', image: '/bg-canvas.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'ku', label: '고려대', image: '/bg-ku.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false, border: '#7c2939' },
  { key: 'ku2', label: '고려대2', image: '/bg-ku2.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'snu', label: '서울대', image: '/bg-snu.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false, border: '#273a73' },
  { key: 'snu2', label: '서울대2', image: '/bg-snu2.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'yu', label: '연세대', image: '/bg-yu.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false, border: '#192f6d' },
  { key: 'yu2', label: '연세대2', image: '/bg-yu2.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  {
    key: 'graph', label: '모눈', text: '#5a5a5a', tile: 30,
    css: svgBg(`<svg ${NS} width='30' height='30'><rect width='30' height='30' fill='#ffffff'/><path d='M30 0H0V30' fill='none' stroke='#dae4f0' stroke-width='1'/></svg>`),
  },
  {
    key: 'check', label: '체크', text: '#8a5566', tile: 48,
    css: svgBg(`<svg ${NS} width='48' height='48'><rect width='48' height='48' fill='#ffe9f0'/><rect width='24' height='24' fill='#ffffff'/><rect x='24' y='24' width='24' height='24' fill='#ffffff'/></svg>`),
  },
  {
    key: 'gingham', label: '깅엄', text: '#5a4a4a', tile: 44,
    css: svgBg(`<svg ${NS} width='44' height='44'><rect width='44' height='44' fill='#ffffff'/><rect width='22' height='44' fill='#f59ab4' opacity='0.4'/><rect width='44' height='22' fill='#f59ab4' opacity='0.4'/></svg>`),
  },
  {
    key: 'ginghamBlack', label: '블랙깅엄', text: '#333333', tile: 44,
    css: svgBg(`<svg ${NS} width='44' height='44'><rect width='44' height='44' fill='#ffffff'/><rect width='22' height='44' fill='#2b2b2b' opacity='0.34'/><rect width='44' height='22' fill='#2b2b2b' opacity='0.34'/></svg>`),
  },
];

export function getBackground(bg) {
  return BACKGROUNDS.find(b => b.key === bg) || BACKGROUNDS[0];
}

// config 기준 배경 해석 (사진 배경 'custom' 처리 포함)
export function resolveBackground(config) {
  if (config && config.bg === 'custom' && config.bgImage) {
    const t = textForLuma(config.bgLuma == null ? 180 : config.bgLuma);
    return { key: 'custom', image: config.bgImage, text: t.text, shadow: t.shadow, tile: 0, dark: false };
  }
  return getBackground(config ? config.bg : 'white');
}

// 배경을 실제 스타일 객체로 (html2canvas 호환 위해 단축속성 대신 개별 속성 사용).
// 무늬 크기는 폭 대비 % 라 어느 화면 폭(에디터/미리보기/PNG)에서도 동일하게 보인다.
export function bgStyle(theme) {
  if (!theme) return {};
  if (theme.image) {
    return {
      backgroundColor: '#777777',
      backgroundImage: `url("${theme.image}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  if (theme.tile) {
    return {
      backgroundImage: theme.css,
      backgroundSize: (theme.tile / 1080 * 100).toFixed(3) + '%',
      backgroundRepeat: 'repeat',
    };
  }
  return { backgroundColor: theme.css };
}

// 기본 표시 설정 — 시간표마다 각자 보유. 전역 config 는 새 시간표용 기본값 + paletteH 보관용.
const DEFAULT_CONFIG = {
  accent: 'pastel',
  weekRange: 'mon-sat',
  startHour: 12,
  endHour: 21,
  font: 'gowun',
  fontScale: 'lg',
  dayLang: 'en',
  bg: 'graph',
  bgImage: null,
  dayNotePos: 'top', // 요일별 메모 위치: top | bottom (표시 여부는 메모보기 토글)
};

// 기본값
const DEFAULT_STATE = {
  config: { ...DEFAULT_CONFIG },
  timetables: [
    { id: 1, name: '시간표1', blocks: [], config: { ...DEFAULT_CONFIG } }
  ],
  activeTT: 1,
  subjects: [],
  tutorialDone: false,
};

// 예전 데이터(시간표별 config 없음) 마이그레이션 — 각 시간표에 전역 config 를 복사해 넣는다.
function normalizeData(data) {
  if (!data || !Array.isArray(data.timetables)) return data;
  const base = data.config || DEFAULT_CONFIG;
  return {
    ...data,
    timetables: data.timetables.map(tt =>
      tt.config ? tt : { ...tt, config: { ...base } }
    ),
  };
}

function App() {
  // 스플래시 없이 시작 — 저장된 데이터가 있으면 메인, 없으면 첫 설정 화면
  const [boot] = useState(() => {
    const saved = loadData();
    const valid = saved && saved.timetables && saved.timetables.length > 0 && Array.isArray(saved.subjects);
    return { data: valid ? normalizeData(saved) : DEFAULT_STATE, mode: valid ? 'main' : 'setup' };
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

  // ===== 구글 로그인 + 클라우드 동기화 =====
  const [user, setUser] = useState(null);
  const dataRef = useRef(data);
  const skipSaveRef = useRef(false);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // 로그인하면: 클라우드 데이터 실시간 구독. 없으면 현재 기기 데이터 업로드.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    let first = true;
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.metadata.hasPendingWrites) return; // 내 쓰기 메아리는 무시
      if (snap.exists() && snap.data().data) {
        skipSaveRef.current = true;
        setData(normalizeData(snap.data().data));
        if (mode === 'setup') setMode('main');
      } else if (first) {
        setDoc(ref, { data: dataRef.current, updatedAt: Date.now() }).catch(() => {});
      }
      first = false;
    }, () => {});
    return unsub;
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // 데이터 변경 시 클라우드에 저장(디바운스). 원격 적용 직후엔 건너뜀.
  useEffect(() => {
    if (!user) return;
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    const id = setTimeout(() => {
      setDoc(doc(db, 'users', user.uid), { data, updatedAt: Date.now() }).catch(() => {});
    }, 800);
    return () => clearTimeout(id);
  }, [data, user]);

  async function handleSignIn() {
    try { await signInGoogle(); }
    catch { alert('로그인에 실패했어요. 잠시 후 다시 시도해 주세요.'); }
  }
  function handleSignOut() { signOutGoogle(); }

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
      timetables: [{ id: 1, name: name || '시간표1', blocks: [], config: { ...config } }],
      subjects: [],
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
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
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