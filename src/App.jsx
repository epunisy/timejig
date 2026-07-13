import { useState, useEffect, useRef } from 'react';
import './App.css';
import { saveData, loadData, clearData } from './storage';
import Setup from './components/Setup';
import Main from './components/Main';
import Export from './components/Export';
import ConfirmDialog from './components/ConfirmDialog';
import { auth, db, doc, setDoc, onSnapshot, onAuthStateChanged, signInGoogle, signOutGoogle, checkRedirect } from './firebase';
import { Analytics } from '@vercel/analytics/react';

// 무드 팔레트 — 8가지 분류(국·영·수·사·과·예체능·기타·FreeTime)에 1:1로 매핑되는 색 조합
export const MOODS = {
  // 순서 = 분류: 국어·영어·수학·사회·과학·예체능·기타·FreeTime
  cream:  ['#FBF6EE', '#DBEFD4', '#FBEFBE', '#FCF7E0', '#EDF8F3', '#DCE8F4', '#EAE4F3', '#ECECEC'],
  candy:  ['#CDB6E6', '#A6E0EC', '#F5B0C6', '#9DDACF', '#F9CDA0', '#FAE9A6', '#F7B6BB', '#C8E5A6'],
  sorbet: ['#B7D7FF', '#D9D0F8', '#FFD1D8', '#CDECB8', '#FFF0C8', '#FBE3D0', '#E2E7FF', '#F0F0F0'],
};
export const MOOD_LIST = [
  { key: 'cream', label: '크림', desc: '따뜻하고 포근한 크림톤' },
  { key: 'candy', label: '캔디', desc: '발랄하고 경쾌한 비비드' },
  { key: 'sorbet', label: '소르베', desc: '산뜻하고 달콤한 파스텔' },
];

export function getAccents(accent) {
  return MOODS[accent] || null; // sky/pink/cozy → 8색, none → null
}

// 과목 하나의 색 — 분류(colorIndex)에 해당하는 무드 색. '없음'이면 색 없음.
export function getSubjectColor(config, subject) {
  if (!subject) return null;
  const pal = MOODS[config.accent];
  if (!pal) return null;
  return pal[(subject.colorIndex || 0) % pal.length];
}

// 색 없음일 때 포션 그래프용 흑백 8단계 (진한 블랙 → 그레이 → 화이트)
export const GRAY_SCALE = ['#2b2b2b', '#525252', '#737373', '#949494', '#b0b0b0', '#cccccc', '#e0e0e0', '#efefef'];

// 월 교육비 분류별 띠그래프 색 — 무드 팔레트. '색 없음'이면 흑백 단계로 구분.
export function getCategoryColors(config) {
  const acc = config && config.accent;
  if (acc === 'none') return GRAY_SCALE;
  return MOODS[acc] || GRAY_SCALE;
}

// 색 채우기 방식: true=칸 전체, false=왼쪽 색띠
export function isFullFill(config) {
  return (config.colorFill || 'band') === 'full';
}

// 색을 칸 전체로 채울 때 글씨색 — 배경이 밝으면 진회색, 어두우면 흰색
export function textColorOn(hex) {
  if (!hex || hex[0] !== '#') return '#444';
  const h = hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex;
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#333' : '#fff';
}

// 요일 — 월~금/토/일 세 조각을 자유롭게 조합 (예: 월~금+일 → 토요일만 빠짐)
export const FULL_WEEK = ['월', '화', '수', '목', '금', '토', '일'];
export const FULL_WEEK_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const WEEK_PARTS = [
  { key: 'wd', label: '월~금', labelEn: 'MON–FRI', days: ['월', '화', '수', '목', '금'] },
  { key: 'sat', label: '토', labelEn: 'SAT', days: ['토'] },
  { key: 'sun', label: '일', labelEn: 'SUN', days: ['일'] },
];

// 설정에서 켜진 요일들을 주(週) 순서대로 반환 (비연속도 지원)
export function getWeekDays(config) {
  if (config && Array.isArray(config.weekDays) && config.weekDays.length) {
    return FULL_WEEK.filter(d => config.weekDays.includes(d));
  }
  // 구버전 weekRange 폴백
  const r = config && config.weekRange;
  if (r === 'mon-fri') return ['월', '화', '수', '목', '금'];
  if (r === 'mon-sun') return ['월', '화', '수', '목', '금', '토', '일'];
  return ['월', '화', '수', '목', '금', '토']; // mon-sat 기본
}

// 표시용 요일 라벨 (한글/영문) — getWeekDays 와 같은 순서
export function getDayLabels(config) {
  const en = config && config.dayLang === 'en';
  return getWeekDays(config).map(d => (en ? FULL_WEEK_EN[FULL_WEEK.indexOf(d)] : d));
}

// 과목 분류 — 무드 8색에 1:1 매핑. 월 교육비 포션(띠그래프)도 이 분류로 묶는다.
export const CATEGORIES = ['국어', '영어', '수학', '사회', '과학', '예체능', '기타', 'FreeTime'];

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
// 헥스 색 → 휘도(0~255)
export function hexLuma(hex) {
  if (!hex || hex[0] !== '#') return 180;
  const h = hex.length === 4 ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] : hex;
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
// tile = 무늬 한 칸 크기(1080px 배경 기준). 미리보기/스와치는 비율로 축소해서 그림.
export const BACKGROUNDS = [
  { key: 'white', label: '기본', css: '#ffffff', text: '#444444', tile: 0 },
  { key: 'sky', label: '하늘', image: '/bg-sky.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'bluepetals', label: '블루꽃', image: '/bg-bluepetals.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  { key: 'canvas', label: '캔버스', image: '/bg-canvas.jpg', text: '#1f1f1f', shadow: WHITE_GLOW, tile: 0, dark: false },
  {
    key: 'graph', label: '모눈', text: '#5a5a5a', tile: 30,
    css: svgBg(`<svg ${NS} width='30' height='30'><rect width='30' height='30' fill='#ffffff'/><path d='M30 0H0V30' fill='none' stroke='#b3c6dd' stroke-width='1'/></svg>`),
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
  if (config && config.bg === 'colorpick' && config.bgColor) {
    const luma = hexLuma(config.bgColor);
    const t = textForLuma(luma);
    return { key: 'colorpick', css: config.bgColor, text: t.text, tile: 0, dark: luma <= 150 };
  }
  return getBackground(config ? config.bg : 'white');
}

// 배경을 실제 스타일 객체로 (html2canvas 호환 위해 단축속성 대신 개별 속성 사용).
// 무늬 크기는 폭 대비 % 라 어느 화면 폭(에디터/미리보기/PNG)에서도 동일하게 보인다.
export function bgStyle(theme) {
  if (!theme) return {};
  if (theme.image) {
    // 로고 등 반복 배경 — 폭 대비 %로 타일링해 어느 화면에서도 동일한 크기로 반복
    if (theme.repeat) {
      return {
        backgroundColor: '#ffffff',
        backgroundImage: `url("${theme.image}")`,
        backgroundSize: ((theme.tile || 216) / 1080 * 100).toFixed(3) + '%',
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
      };
    }
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
  accent: 'cream',
  weekDays: ['월', '화', '수', '목', '금', '토'],
  startHour: 9,
  endHour: 21,
  font: 'gowun',
  fontScale: 'lg',
  dayLang: 'en',
  bg: 'graph',
  bgImage: null,
  colorFill: 'band', // 색 채우기: band(왼쪽 띠) | full(칸 전체)
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

// 설정 보정 — 빠진 키는 기본값으로 채우고, 없어진 옵션(흑백)은 파스텔로 옮긴다.
function fixConfig(c) {
  const src = c || {};
  const cfg = { ...DEFAULT_CONFIG, ...src };
  // 옛 색 옵션(pastel/mono/custom/sky/pink/cozy)은 새 무드로 이전 → 기본 무드 'cream'
  if (!['cream', 'candy', 'sorbet', 'none'].includes(cfg.accent)) cfg.accent = 'cream';
  if (cfg.colorFill !== 'full') cfg.colorFill = 'band';
  // 요일: weekDays 없으면 구버전 weekRange 에서 도출
  if (!Array.isArray(src.weekDays) || !src.weekDays.length) {
    cfg.weekDays = getWeekDays(src.weekRange ? { weekRange: src.weekRange } : DEFAULT_CONFIG);
  }
  return cfg;
}

// 예전 데이터 마이그레이션 — 각 시간표에 config 를 채우고, 설정값을 보정한다.
function normalizeData(data) {
  if (!data || !Array.isArray(data.timetables)) return data;
  const base = fixConfig(data.config);
  return {
    ...data,
    config: base,
    timetables: data.timetables.map(tt => ({ ...tt, config: fixConfig(tt.config || base) })),
  };
}

function App() {
  // 저장된 데이터가 있으면 그걸로, 없으면 기본 서식 시간표(DEFAULT_STATE)로 시작.
  // 화면은 항상 스플래시부터 → 로딩이 끝나면 메인으로 넘어간다.
  const [boot] = useState(() => {
    const saved = loadData();
    const valid = saved && saved.timetables && saved.timetables.length > 0 && Array.isArray(saved.subjects);
    // 저장된 데이터가 있으면 바로 메인, 없으면 첫 화면(로그인/처음이용 선택)
    return { data: valid ? normalizeData(saved) : DEFAULT_STATE, mode: valid ? 'main' : 'welcome', fresh: !valid };
  });

  // 화면 모드: welcome | main | export
  const [mode, setMode] = useState(boot.mode);

  // 전체 데이터
  const [data, setData] = useState(boot.data);

  // 로그아웃 확인 (로그아웃하면 이 기기의 로컬 데이터를 비움 — 클라우드 백업은 유지)
  const [confirmLogout, setConfirmLogout] = useState(false);

  // 첫 화면 미리보기 (설정에서 열어보기 — 데이터 변경 없음)
  const [welcomePreview, setWelcomePreview] = useState(false);

  // 데이터 바뀔 때마다 자동 저장 (메인/내보내기에서만)
  useEffect(() => {
    if (mode === 'main' || mode === 'export') {
      saveData(data);
    }
  }, [data, mode]);

  // ===== 되돌리기 / 되살리기 (실수 변경 대비) =====
  const histRef = useRef({ past: [], future: [] });
  const prevDataRef = useRef(data);
  const histSkipRef = useRef(false); // 클라우드 적용·undo/redo 시엔 히스토리 기록 건너뜀
  const [, setHistTick] = useState(0);

  useEffect(() => {
    if (histSkipRef.current) { histSkipRef.current = false; prevDataRef.current = data; return; }
    const prev = prevDataRef.current;
    prevDataRef.current = data;
    if (prev && prev !== data) {
      const h = histRef.current;
      h.past.push(prev);
      if (h.past.length > 60) h.past.shift();
      h.future = [];
      setHistTick(t => t + 1);
    }
  }, [data]);

  function handleUndo() {
    const h = histRef.current;
    if (!h.past.length) return;
    const prev = h.past.pop();
    h.future.push(data);
    histSkipRef.current = true;
    setData(prev);
    setHistTick(t => t + 1);
  }
  function handleRedo() {
    const h = histRef.current;
    if (!h.future.length) return;
    const next = h.future.pop();
    h.past.push(data);
    histSkipRef.current = true;
    setData(next);
    setHistTick(t => t + 1);
  }
  const canUndo = histRef.current.past.length > 0;
  const canRedo = histRef.current.future.length > 0;

  // ===== 구글 로그인 + 클라우드 동기화 =====
  const [user, setUser] = useState(null);
  const dataRef = useRef(data);
  const skipSaveRef = useRef(false);
  // 클라우드 첫 동기화(서버 응답)를 받기 전엔 업로드 금지 — 빈 데이터로 클라우드를 덮어쓰는 사고 방지
  const cloudReadyRef = useRef(false);
  // 마지막으로 클라우드와 일치했던 데이터(JSON) — 충돌 감지의 기준점
  const syncedRef = useRef(null);
  // 양쪽이 서로 다르게 바뀌었을 때 띄우는 충돌 안내 ({ remote, remoteStr })
  const [conflict, setConflict] = useState(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  // 이미 로그인된 상태면(또는 로그인 직후 user가 잡히면) 첫 화면을 건너뛰고 메인으로
  useEffect(() => { if (user && mode === 'welcome') setMode('main'); }, [user, mode]);
  // 리디렉트 로그인 결과 확인 — 로그인되어 돌아왔으면 바로 메인으로
  useEffect(() => {
    checkRedirect()
      .then((res) => { if (res && res.user) setMode('main'); })
      .catch((e) => alert('로그인 오류(redirect): ' + (e?.code || e?.message || e)));
  }, []);

  // 로그인하면: 클라우드 데이터 실시간 구독. 없으면(서버가 '문서 없음' 확인 시) 현재 기기 데이터 업로드.
  useEffect(() => {
    if (!user) return;
    cloudReadyRef.current = false;
    syncedRef.current = null;
    const ref = doc(db, 'users', user.uid);
    let first = true;
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.metadata.hasPendingWrites) return; // 내 쓰기 메아리는 무시
      if (snap.exists() && snap.data().data) {
        const remote = normalizeData(snap.data().data);
        const remoteStr = JSON.stringify(remote);
        cloudReadyRef.current = true;
        if (remoteStr === syncedRef.current) return; // 기준점과 같음 → 새로운 변경 없음
        const localStr = JSON.stringify(dataRef.current);
        if (syncedRef.current === null || localStr === syncedRef.current) {
          // 이 기기엔 따로 바꾼 게 없음 → 클라우드 최신을 그대로 반영
          syncedRef.current = remoteStr;
          skipSaveRef.current = true;
          histSkipRef.current = true;
          setData(remote);
        } else {
          // 양쪽이 서로 다르게 바뀜 → 덮어쓰기 전에 사용자에게 물어봄
          setConflict({ remote, remoteStr });
        }
      } else if (!snap.metadata.fromCache) {
        // 서버가 '문서 없음'을 확인해줬을 때만 최초 업로드 — 캐시 단계의 빈 상태로 덮어쓰지 않음
        if (first) {
          setDoc(ref, { data: dataRef.current, updatedAt: Date.now() }).catch(() => {});
          syncedRef.current = JSON.stringify(dataRef.current);
        }
        cloudReadyRef.current = true;
      }
      first = false;
    }, () => {});
    return () => { cloudReadyRef.current = false; unsub(); };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // 데이터 변경 시 클라우드에 저장(디바운스). 원격 적용 직후/충돌 대기 중엔 건너뜀.
  useEffect(() => {
    if (!user) return;
    if (!cloudReadyRef.current) return; // 첫 동기화 전엔 업로드 금지 (빈 데이터로 덮어쓰기 방지)
    if (conflict) return; // 충돌 해결 전엔 업로드 보류
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    const localStr = JSON.stringify(data);
    if (localStr === syncedRef.current) return; // 바뀐 게 없으면 업로드 안 함
    const id = setTimeout(() => {
      setDoc(doc(db, 'users', user.uid), { data, updatedAt: Date.now() }).catch(() => {});
      syncedRef.current = localStr;
    }, 800);
    return () => clearTimeout(id);
  }, [data, user, conflict]);

  // 충돌 해결 — 다른 기기(클라우드) 최신을 사용
  function resolveUseRemote() {
    if (!conflict) return;
    syncedRef.current = conflict.remoteStr;
    skipSaveRef.current = true;
    histSkipRef.current = true;
    setData(conflict.remote);
    setConflict(null);
  }
  // 충돌 해결 — 이 기기 내용을 유지하고 클라우드에 덮어씀
  function resolveKeepMine() {
    const local = dataRef.current;
    const localStr = JSON.stringify(local);
    syncedRef.current = localStr; // 기준점을 내 것으로 → 서버 메아리를 충돌로 오인하지 않음
    setConflict(null);
    if (user) setDoc(doc(db, 'users', user.uid), { data: local, updatedAt: Date.now() }).catch(() => {});
  }

  // 로고 클릭 — 최신 앱(코드)과 최신 시간표를 함께 불러옴
  async function handleLogoSync() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));
      }
    } catch { /* 무시하고 새로고침 */ }
    window.location.reload();
  }

  async function handleSignIn() {
    if (user) { setMode('main'); return; } // 이미 로그인돼 있으면 다시 로그인 없이 바로 메인으로
    try { await signInGoogle(); setMode('main'); } // 팝업 로그인 성공 시 바로 메인으로
    catch (e) { alert('로그인 오류: ' + (e?.code || e?.message || e)); }
  }
  function handleSignOut() { setConfirmLogout(true); }
  async function doSignOut() {
    setConfirmLogout(false);
    try { await signOutGoogle(); } catch { /* 무시 */ }
    clearData();            // 이 기기의 로컬 데이터 비움 (클라우드 백업은 그대로)
    window.location.reload(); // 새로고침 → 첫 화면
  }

  // 첫 화면에서 "처음 이용하기" — 기본 서식 시간표(DEFAULT_STATE)로 바로 메인 진입
  function handleFirstUse() { setMode('main'); }

  return (
    <>
      {mode === 'welcome' && <Setup user={user} onSignIn={handleSignIn} onFirstUse={handleFirstUse} />}
      {mode === 'main' && welcomePreview && (
        <Setup
          user={user}
          onSignIn={() => { setWelcomePreview(false); handleSignIn(); }}
          onFirstUse={() => setWelcomePreview(false)}
          onBack={() => setWelcomePreview(false)}
        />
      )}
      {mode === 'main' && !welcomePreview && (
        <Main
          data={data}
          setData={setData}
          onGoExport={() => setMode('export')}
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          onLogoSync={handleLogoSync}
          onPreviewWelcome={() => setWelcomePreview(true)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      )}
      {mode === 'export' && (
        <Export
          data={data}
          setData={setData}
          onBack={() => setMode('main')}
        />
      )}

      {confirmLogout && (
        <ConfirmDialog
          title="로그아웃"
          message={'로그아웃하면 이 기기에서 시간표가 사라져요.<br><span style="color:#888; font-size:11px;">클라우드 백업은 남아 있어, 다시 로그인하면 그대로 불러와요.</span>'}
          confirmText="로그아웃"
          onYes={doSignOut}
          onClose={() => setConfirmLogout(false)}
        />
      )}

      {conflict && (
        <div className="tj-modal-bg">
          <div className="tj-modal" onClick={(e) => e.stopPropagation()} style={{ width: '340px' }}>
            <h3>다른 기기의 최신 변경</h3>
            <div className="tj-confirm-msg">
              다른 기기에서 시간표를 바꿨어요.<br />
              어느 내용을 사용할까요?
              <br /><span style={{ color: '#888', fontSize: '11px' }}>선택하지 않은 쪽 변경은 사라집니다.</span>
            </div>
            <div className="tj-modal-actions" style={{ flexDirection: 'column', gap: '8px' }}>
              <button className="primary" style={{ width: '100%' }} onClick={resolveUseRemote}>
                최신으로 불러오기 (다른 기기 내용)
              </button>
              <button style={{ width: '100%' }} onClick={resolveKeepMine}>
                이 기기 내용 유지
              </button>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </>
  );
}

export default App;