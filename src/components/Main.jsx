import { useState, useRef, useEffect } from 'react';
import Timetable from './Timetable';
import Palette from './Palette';
import Settings from './Settings';
import SubjectModal from './SubjectModal';
import ConfirmDialog from './ConfirmDialog';
import Tutorial from './Tutorial';
import ImportPlan from './ImportPlan';
import { resolveBackground, bgStyle, CATEGORIES, getWeekDays, FULL_WEEK } from '../App';

function timeToMin(t) {
  const parts = String(t).split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h)) return NaN;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

export default function Main({ data, setData, onGoExport, autoTutorial, user, onSignIn, onSignOut, onLogoSync, onPreviewWelcome, onUndo, onRedo, canUndo, canRedo }) {
  const [dragSubject, setDragSubject] = useState(null);
  const [internalDragging, setInternalDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [addingTT, setAddingTT] = useState(false);
  const [renamingTT, setRenamingTT] = useState(null);
  const [ttMenuOpen, setTtMenuOpen] = useState(false);
  const [showImportPlan, setShowImportPlan] = useState(false);
  const [palCollapsed, setPalCollapsed] = useState(false);
  const [locked, setLocked] = useState(false);
  const newTTInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const newTTComposingRef = useRef(false);
  const renameComposingRef = useRef(false);

  // 모바일에서 시간표/팔레트 경계선을 드래그해 팔레트 높이를 조절 (기기마다 화면이 달라서)
  const layoutRef = useRef(null);
  const paletteHRef = useRef(data.config.paletteH || null);
  const [paletteH, setPaletteH] = useState(data.config.paletteH || null);

  function handleDividerDown(e) {
    e.preventDefault();
    const layout = layoutRef.current;
    if (!layout) return;
    function move(ev) {
      if (ev.cancelable) ev.preventDefault();
      const cy = ev.touches && ev.touches[0] ? ev.touches[0].clientY : ev.clientY;
      const rect = layout.getBoundingClientRect();
      // 팔레트는 아래쪽 → 높이 = 레이아웃 바닥 - 포인터 위치
      let h = rect.bottom - cy;
      h = Math.max(70, Math.min(h, rect.height - 160)); // 시간표 영역은 최소 160px 남김
      paletteHRef.current = h;
      setPaletteH(h);
    }
    function end() {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', end);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.body.classList.remove('tj-resizing');
      if (paletteHRef.current != null) {
        const h = Math.round(paletteHRef.current);
        setData(d => ({ ...d, config: { ...d.config, paletteH: h } }));
      }
    }
    document.body.classList.add('tj-resizing');
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  // 설정 완료 직후(진짜 첫 진입)에만, 메인 화면을 잠깐 본 뒤 튜토리얼을 띄운다.
  // 일반 로드(저장된 데이터로 바로 메인) 때는 자동으로 띄우지 않음.
  useEffect(() => {
    if (!autoTutorial || data.tutorialDone) return;
    const id = setTimeout(() => setShowTutorial(true), 700);
    return () => clearTimeout(id);
  }, [autoTutorial, data.tutorialDone]);
  
  const activeTT = data.timetables.find(t => t.id === data.activeTT);
  if (!activeTT) return null;

  // 현재 보고 있는 시간표의 표시 설정(시간표마다 각자 보유). 예전 데이터 대비 전역 config 로 폴백.
  const config = activeTT.config || data.config;

  // 로고를 누르면 앱을 최신 버전으로 업데이트(새로고침). 기기 간 시간표 동기화는 자동이라 여기선 다루지 않음.
  function handleLogoClick() {
    setConfirmDialog({
      title: '최신 버전으로 업데이트',
      message: '앱을 최신 버전으로 업데이트할까요?<br><span style="color:#888; font-size:11px;">저장된 시간표는 그대로예요. 잠깐 새로고침돼요.</span>',
      confirmText: '업데이트',
      onYes: () => { if (onLogoSync) onLogoSync(); },
    });
  }

  function updateTimetable(updater) {
    setData({
      ...data,
      timetables: data.timetables.map(t =>
        t.id === data.activeTT ? updater(t) : t
      ),
    });
  }
  
  function handleAddTimetable() {
    const name = newTTInputRef.current?.value.trim();
    if (!name) return;
    const newId = Math.max(...data.timetables.map(t => t.id)) + 1;
    setData({
      ...data,
      timetables: [...data.timetables, { id: newId, name, blocks: [], config: { ...config } }],
      activeTT: newId,
    });
    setAddingTT(false);
  }
  
  function handleRenameTimetable(id) {
    const name = renameInputRef.current?.value.trim();
    if (!name) { setRenamingTT(null); return; }
    setData({
      ...data,
      timetables: data.timetables.map(t =>
        t.id === id ? { ...t, name } : t
      ),
    });
    setRenamingTT(null);
  }
  
  function handleDuplicate(id) {
    const tt = data.timetables.find(t => t.id === id);
    const newId = Math.max(...data.timetables.map(t => t.id)) + 1;
    const newBlocks = tt.blocks.map(b => ({
      ...b,
      id: Date.now() + Math.random()
    }));
    // 복사본 이름: 원본 이름(전체) 뒤에 _2, _3 … (이미 있으면 다음 번호로)
    const baseName = tt.name;
    const existing = data.timetables.map(t => t.name);
    let copyN = 2;
    while (existing.includes(`${baseName}_${copyN}`)) copyN++;
    setData({
      ...data,
      timetables: [...data.timetables, {
        id: newId,
        name: `${baseName}_${copyN}`,
        blocks: newBlocks,
        config: { ...(tt.config || config) },
      }],
      activeTT: newId,
    });
  }
  
  function handleDeleteTimetable(id) {
    const tt = data.timetables.find(t => t.id === id);
    setConfirmDialog({
      title: '시간표 삭제',
      message: `${tt.name} 시간표를 삭제할까요?<br><span style="color:#888; font-size:11px;">배치된 블록도 함께 사라집니다.</span>`,
      onYes: () => {
        const newTTs = data.timetables.filter(t => t.id !== id);
        setData({
          ...data,
          timetables: newTTs,
          activeTT: data.activeTT === id ? newTTs[0].id : data.activeTT,
        });
      }
    });
  }
  
  function handleAddSubjectClick() {
    setEditingSubjectId(null);
    setShowSubjectModal(true);
  }
  
  function handleEditSubject(id) {
    setEditingSubjectId(id);
    setShowSubjectModal(true);
  }
  
  function handleDeleteSubject(id) {
    const s = data.subjects.find(x => x.id === id);
    const placedCount = activeTT.blocks.filter(b => b.subjectId === id).length;
    setConfirmDialog({
      title: '과목 삭제',
      message: `${s.name} 과목을 삭제할까요?` + 
        (placedCount > 0 ? `<br><span style="color:#C77575; font-size:11px;">배치된 ${placedCount}개의 블록도 사라집니다.</span>` : ''),
      onYes: () => {
        setData({
          ...data,
          subjects: data.subjects.filter(x => x.id !== id),
          timetables: data.timetables.map(t => ({
            ...t,
            blocks: t.blocks.filter(b => b.subjectId !== id),
          })),
        });
      }
    });
  }
  
  function handleDeleteSubjects(ids, onDone) {
    if (!ids || !ids.length) return;
    const totalPlaced = data.timetables.reduce(
      (n, t) => n + t.blocks.filter(b => ids.includes(b.subjectId)).length, 0
    );
    setConfirmDialog({
      title: '과목 삭제',
      message: `선택한 ${ids.length}개 과목을 삭제할까요?` +
        (totalPlaced > 0 ? `<br><span style="color:#C77575; font-size:11px;">배치된 ${totalPlaced}개 블록도 함께 사라집니다.</span>` : ''),
      onYes: () => {
        setData({
          ...data,
          subjects: data.subjects.filter(s => !ids.includes(s.id)),
          timetables: data.timetables.map(t => ({ ...t, blocks: t.blocks.filter(b => !ids.includes(b.subjectId)) })),
        });
        if (onDone) onDone();
      },
    });
  }

  function handleSubjectSave(subjectData) {
    if (editingSubjectId !== null) {
      setData({
        ...data,
        subjects: data.subjects.map(s =>
          s.id === editingSubjectId ? { ...s, ...subjectData } : s
        ),
      });
    } else {
      setData({
        ...data,
        subjects: [...data.subjects, {
          id: Date.now(),
          ...subjectData,
          active: true,
        }],
      });
    }
    setShowSubjectModal(false);
  }
  
  function handleSubjectDuplicate(subjectData) {
    setData({
      ...data,
      subjects: [...data.subjects, {
        id: Date.now(),
        name: subjectData.name + ' 복사본',
        duration: subjectData.duration,
        colorIndex: subjectData.colorIndex,
        price: subjectData.price || 0,
        priceType: subjectData.priceType || 'month',
        active: true,
      }],
    });
    setShowSubjectModal(false);
  }
  
  function handlePaletteDragStart(subject) {
    setDragSubject(subject);
  }
  
  function handleDragEnd(dropInfo) {
    if (locked) { setDragSubject(null); return; }
    if (dropInfo && dragSubject) {
      updateTimetable(tt => ({
        ...tt,
        blocks: [...tt.blocks, {
          id: Date.now(),
          subjectId: dragSubject.id,
          day: dropInfo.day,
          start: dropInfo.start,
          end: dropInfo.end,
        }],
      }));
    }
    setDragSubject(null);
  }
  
  function handleBlocksChange(newBlocks) {
    updateTimetable(tt => ({ ...tt, blocks: newBlocks }));
  }
  
  function handleConfigChange(newConfig) {
    // 설정은 시간표마다 따로 — 지금 보고 있는 시간표(activeTT)의 config 와 블록만 다룬다.
    const old = config;
    const startChanged = newConfig.startHour !== old.startHour;
    const endChanged = newConfig.endHour !== old.endHour;
    const oldDays = getWeekDays(old);
    const newDays = getWeekDays(newConfig);
    const weekChanged = oldDays.join() !== newDays.join();

    // 시간 범위(시작/끝) 변경 — 새 범위 밖으로 잘려나갈 블록이 하나라도 있으면 변경을 막는다.
    if (startChanged || endChanged) {
      // 블록 start/end는 startHour 기준 분 단위라, 시작 시각이 바뀌면 그만큼 평행이동해야
      // 원래의 '절대 시각'이 유지된다.
      const delta = (old.startHour - newConfig.startHour) * 60;
      const newTotalMin = (newConfig.endHour - newConfig.startHour) * 60;
      const cutCount = activeTT.blocks.filter(b => (b.start + delta) < 0 || (b.end + delta) > newTotalMin).length;

      if (cutCount > 0) {
        // 변경하지 않고 안내만 → config 그대로라 설정창의 선택값도 원위치된다.
        setConfirmDialog({
          title: '시간 범위를 바꿀 수 없어요',
          message: `바꾸려는 시간 범위 밖에 과목 블록 <b>${cutCount}개</b>가 있어요.<br>` +
            `<span style="color:#888; font-size:11px;">그 블록을 먼저 옮기거나 지운 뒤에 시간 범위를 바꿔주세요.</span>`,
          infoOnly: true,
        });
        return;
      }

      // 통과 — 이 시간표의 블록만 평행이동해 원래 시각을 그대로 유지.
      updateTimetable(tt => ({
        ...tt,
        config: newConfig,
        blocks: tt.blocks.map(b => ({ ...b, start: b.start + delta, end: b.end + delta })),
      }));
      return;
    }

    // 요일 조합 변경 — 빠진 요일의 블록은 제거한다.
    if (weekChanged) {
      updateTimetable(tt => ({
        ...tt,
        config: newConfig,
        blocks: tt.blocks.filter(b => newDays.includes(b.day)),
      }));
      return;
    }

    // 그 외 설정(폰트·배경·색·글씨 크기 등)
    updateTimetable(tt => ({ ...tt, config: newConfig }));
  }
  
  function handleTimetableNameChange(name) {
    updateTimetable(tt => ({ ...tt, name: name.trim() || tt.name }));
  }

  function handleMemoChange(memo) {
    updateTimetable(tt => ({ ...tt, memo }));
  }

  // 주간학습계획표 파싱 결과를 시간표에 반영 (addToPalette=false면 인식 과목을 팔레트에서 숨김)
  function handlePlanImport(parsed, mode, addToPalette = true) {
    const days = (parsed.days || []).filter(d => (d.periods || []).length || d.supplies || d.notes);

    // 모든 교시의 절대 분 범위
    let minStart = Infinity, maxEnd = -Infinity;
    days.forEach(d => (d.periods || []).forEach(p => {
      const s = timeToMin(p.start), e = timeToMin(p.end);
      if (Number.isFinite(s)) minStart = Math.min(minStart, s);
      if (Number.isFinite(e)) maxEnd = Math.max(maxEnd, e);
    }));

    // 등장 요일
    const presentDays = days.map(d => d.day);

    // 과목 이름 → id (기존 재사용, 없으면 생성)
    const subjects = [...data.subjects];
    const nameToId = {};
    subjects.forEach(s => { nameToId[s.name] = s.id; });
    let colorSeed = subjects.length;
    let idSeed = Math.max(0, ...data.subjects.map(s => s.id),
      ...data.timetables.flatMap(t => (t.blocks || []).map(b => b.id)));
    function ensureSubject(name, durationMin) {
      if (nameToId[name]) return nameToId[name];
      const id = ++idSeed;
      subjects.push({ id, name, duration: durationMin || 40, colorIndex: colorSeed++, active: true, hidden: !addToPalette });
      nameToId[name] = id;
      return id;
    }
    function buildBlocks(startHour) {
      const base = startHour * 60;
      const blocks = [];
      days.forEach(d => (d.periods || []).forEach(p => {
        const s = timeToMin(p.start), e = timeToMin(p.end);
        if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return;
        const subjectId = ensureSubject((p.subject || '').trim() || '수업', e - s);
        blocks.push({ id: ++idSeed, subjectId, day: d.day, start: s - base, end: e - base });
      }));
      return blocks;
    }

    // 메모 (요일별 준비물·참고를 한 메모로 합침 — "월: …" 형태로 줄바꿈)
    const memoLines = days.map(d => {
      const m = [(d.supplies || '').trim(), (d.notes || '').trim()].filter(Boolean).join(' / ');
      return m ? `${d.day}: ${m}` : null;
    }).filter(Boolean).join('\n');

    const hasTimes = Number.isFinite(minStart) && Number.isFinite(maxEnd);
    const schoolStartHour = hasTimes ? Math.floor(minStart / 60) : config.startHour;
    const schoolEndHour = hasTimes ? Math.ceil(maxEnd / 60) : config.endHour;

    if (mode === 'new') {
      const startHour = schoolStartHour;
      const endHour = Math.max(schoolEndHour, startHour + 1);
      const present = FULL_WEEK.filter(d => presentDays.includes(d));
      const weekDays = present.length ? present : getWeekDays(config);
      const newConfig = { ...config, startHour, endHour, weekDays };
      const blocks = buildBlocks(startHour);
      const newId = Math.max(0, ...data.timetables.map(t => t.id)) + 1;
      setData({
        ...data,
        subjects,
        timetables: [...data.timetables, {
          id: newId, name: '불러온 시간표', blocks, config: newConfig, memo: memoLines,
        }],
        activeTT: newId,
      });
    } else {
      const oldStart = config.startHour;
      const newStartHour = Math.min(oldStart, schoolStartHour);
      const newEndHour = Math.max(config.endHour, schoolEndHour);
      const dset = new Set(getWeekDays(config));
      presentDays.forEach(d => dset.add(d));
      const weekDays = FULL_WEEK.filter(d => dset.has(d));
      const delta = (oldStart - newStartHour) * 60;
      const schoolBlocks = buildBlocks(newStartHour);
      const mergedMemo = [(activeTT.memo || '').trim(), memoLines].filter(Boolean).join('\n');
      setData({
        ...data,
        subjects,
        timetables: data.timetables.map(tt => tt.id === data.activeTT ? {
          ...tt,
          config: { ...tt.config, startHour: newStartHour, endHour: newEndHour, weekDays },
          blocks: [...tt.blocks.map(b => ({ ...b, start: b.start + delta, end: b.end + delta })), ...schoolBlocks],
          memo: mergedMemo,
        } : tt),
      });
    }
    setShowImportPlan(false);
  }

  function handleTutorialClose() {
    // 어느 버튼으로 닫든 한 번 본 것으로 기록 → 다음 진입부터 자동으로 안 뜸
    setShowTutorial(false);
    setData({ ...data, tutorialDone: true });
  }
  
  const isDragging = dragSubject !== null || internalDragging;

  // 한 달 학원비 — 회당: 금액 × 주간 배치횟수 × 4주, 한달치: 과목당 1회 합산. 분류별로도 합산.
  const { monthlyCost, categoryCosts } = (() => {
    const counts = {};
    activeTT.blocks.forEach(b => { counts[b.subjectId] = (counts[b.subjectId] || 0) + 1; });
    let total = 0;
    const cats = {};
    data.subjects.forEach(s => {
      const cnt = counts[s.id];
      if (!cnt || !s.price) return;
      const amt = s.priceType === 'session' ? s.price * cnt * 4 : s.price;
      let cat = s.category || (typeof s.colorIndex === 'number' ? CATEGORIES[s.colorIndex] : '기타') || '기타';
      if (cat === '예능' || cat === '체능') cat = '예체능'; // 예전 분류 통합
      if (!CATEGORIES.includes(cat)) cat = '기타';
      cats[cat] = (cats[cat] || 0) + amt;
      total += amt;
    });
    return { monthlyCost: total, categoryCosts: cats };
  })();

  const bgTheme = resolveBackground(config);

  return (
    <div
      className={'tj-app tj-app-main' + (bgTheme.dark ? ' tj-app-dark' : '')}
      style={bgStyle(bgTheme)}
    >
      <div className="tj-topbar">
        <img
          src="/logo2.png"
          alt="TimeJig"
          className="tj-logo-top"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        />
        <div className="tj-topbar-main">
        <div className="tj-topbar-r1">
        <div className="tj-ttbar">
          <button
            className="tj-tt-current"
            onClick={() => setTtMenuOpen(o => !o)}
          >
            <span className="tj-tt-cur-name">{activeTT.name}</span>
            <span className="tj-tt-caret">▾</span>
          </button>
          {ttMenuOpen && (
            <>
              <div
                className="tj-tt-backdrop"
                onClick={() => { setTtMenuOpen(false); setRenamingTT(null); setAddingTT(false); }}
              />
              <div className="tj-tt-menu">
                {data.timetables.map(tt => {
                  const isActive = tt.id === data.activeTT;
                  if (renamingTT === tt.id) {
                    return (
                      <div key={tt.id} className="tj-tt-row editing">
                        <input
                          ref={renameInputRef}
                          type="text"
                          defaultValue={tt.name}
                          autoFocus
                          autoComplete="off"
                          onCompositionStart={() => { renameComposingRef.current = true; }}
                          onCompositionEnd={() => { renameComposingRef.current = false; }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !renameComposingRef.current) handleRenameTimetable(tt.id);
                            if (e.key === 'Escape') setRenamingTT(null);
                          }}
                        />
                        <button onClick={() => handleRenameTimetable(tt.id)}>저장</button>
                        <button className="cancel" onClick={() => setRenamingTT(null)}>취소</button>
                      </div>
                    );
                  }
                  return (
                    <div key={tt.id} className={'tj-tt-row' + (isActive ? ' active' : '')}>
                      <span
                        className="tj-tt-name"
                        onClick={() => { setData({ ...data, activeTT: tt.id }); setTtMenuOpen(false); }}
                      >
                        <span className="tj-tt-check">{isActive ? '✓' : ''}</span>
                        {tt.name}
                      </span>
                      <span className="tj-tt-act" title="이름 수정" onClick={() => setRenamingTT(tt.id)}>✎</span>
                      <span className="tj-tt-act" title="복제" onClick={() => handleDuplicate(tt.id)}>⧉</span>
                      {data.timetables.length > 1 && (
                        <span
                          className="tj-tt-act"
                          title="삭제"
                          onClick={() => { setTtMenuOpen(false); handleDeleteTimetable(tt.id); }}
                        >×</span>
                      )}
                    </div>
                  );
                })}
                {addingTT ? (
                  <div className="tj-tt-row editing">
                    <input
                      ref={newTTInputRef}
                      type="text"
                      placeholder="시간표 이름"
                      autoFocus
                      autoComplete="off"
                      onCompositionStart={() => { newTTComposingRef.current = true; }}
                      onCompositionEnd={() => { newTTComposingRef.current = false; }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !newTTComposingRef.current) handleAddTimetable();
                        if (e.key === 'Escape') setAddingTT(false);
                      }}
                    />
                    <button onClick={handleAddTimetable}>추가</button>
                    <button className="cancel" onClick={() => setAddingTT(false)}>취소</button>
                  </div>
                ) : (
                  <button className="tj-tt-addrow" onClick={() => setAddingTT(true)}>+ 새 시간표</button>
                )}
              </div>
            </>
          )}
        </div>
        <button className="tj-cta tj-login" onClick={user ? onSignOut : onSignIn}>
          {user ? '로그아웃' : '로그인'}
        </button>
        </div>
        <div className="tj-topbar-r2">
          <button className="tj-cta" onClick={() => setShowImportPlan(true)}>
            📷 사진 불러오기
          </button>
          <button className="tj-cta" onClick={onGoExport}>
            📱 모바일 잠금화면
          </button>
          <button className="tj-cta tj-cta-settings" onClick={() => setShowSettings(true)} aria-label="서식설정">
            ⚙️ 서식설정
          </button>
          <div className="tj-undoredo">
            <button onClick={onUndo} disabled={!canUndo} aria-label="되돌리기" title="되돌리기">↶</button>
            <button onClick={onRedo} disabled={!canRedo} aria-label="되살리기" title="되살리기">↷</button>
          </div>
          <button
            className={'tj-locktoggle' + (locked ? ' on' : '')}
            onClick={() => setLocked(l => !l)}
            aria-pressed={locked}
            title={locked ? '고정됨 (눌러서 해제)' : '눌러서 고정'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              {locked
                ? <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
                : <path d="M8 11V7.5a4 4 0 0 1 7-2.4" />}
            </svg>
          </button>
        </div>
        </div>
      </div>

      <div
        className={'tj-layout' + (palCollapsed ? ' pal-collapsed' : '')}
        ref={layoutRef}
        style={paletteH ? { '--tj-pal-h': paletteH + 'px' } : undefined}
      >
        <Timetable
          config={config}
          blocks={activeTT.blocks}
          subjects={data.subjects}
          onBlocksChange={handleBlocksChange}
          dragSubject={dragSubject}
          onDragEnd={handleDragEnd}
          onInternalDraggingChange={setInternalDragging}
          locked={locked}
        />
        <div
          className="tj-divider"
          onMouseDown={handleDividerDown}
          onTouchStart={handleDividerDown}
          role="separator"
          aria-label="시간표와 과목 영역 크기 조절"
        >
          <span className="tj-divider-grip" />
        </div>
        <Palette
          config={config}
          subjects={data.subjects.filter(s => !s.hidden)}
          onAddSubject={handleAddSubjectClick}
          onEditSubject={handleEditSubject}
          onDragStart={handlePaletteDragStart}
          monthlyCost={monthlyCost}
          categoryCosts={categoryCosts}
          collapsed={palCollapsed}
          onToggleCollapse={() => setPalCollapsed(c => !c)}
          memo={activeTT.memo || ''}
          onMemoChange={handleMemoChange}
          onDeleteSubjects={handleDeleteSubjects}
        />
      </div>
      
      {isDragging && (
        <div className="tj-trash-zone" id="trash-zone">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.8"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </div>
      )}
      
      {showSubjectModal && (
        <SubjectModal
          subject={editingSubjectId ? data.subjects.find(s => s.id === editingSubjectId) : null}
          config={config}
          subjectCount={data.subjects.length}
          onSave={handleSubjectSave}
          onCancel={() => setShowSubjectModal(false)}
          onDelete={editingSubjectId ? () => {
            setShowSubjectModal(false);
            handleDeleteSubject(editingSubjectId);
          } : null}
          onDuplicate={handleSubjectDuplicate}
        />
      )}
      
      {showSettings && (
        <Settings
          config={config}
          timetableName={activeTT.name}
          onConfigChange={handleConfigChange}
          onTimetableNameChange={handleTimetableNameChange}
          onShowTutorial={() => { setShowSettings(false); setShowTutorial(true); }}
          onPreviewWelcome={() => { setShowSettings(false); onPreviewWelcome && onPreviewWelcome(); }}
          user={user}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      {showImportPlan && (
        <ImportPlan
          onClose={() => setShowImportPlan(false)}
          onApply={handlePlanImport}
        />
      )}

      {showTutorial && (
        <Tutorial onClose={handleTutorialClose} />
      )}
    </div>
  );
}