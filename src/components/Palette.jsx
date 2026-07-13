import { useRef, useEffect, useState } from 'react';
import { t } from '../i18n';
import { getFontFamily, CATEGORIES, getSubjectColor, getCategoryColors, isFullFill, textColorOn } from '../App';

// 비밀번호 입력칸의 눈 아이콘 같은 표시(보임/숨김)
function Eye({ off }) {
  return off ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 8;

export default function Palette({
  config,
  subjects,
  onAddSubject,
  onEditSubject,
  onDragStart,
  monthlyCost,
  categoryCosts,
  collapsed,
  onToggleCollapse,
  memo,
  onMemoChange,
  onDeleteSubjects,
  hiddenSubjects = [],
  onSetSubjectsHidden,
}) {
  const catColors = getCategoryColors(config);
  const fullFill = isFullFill(config);
  const fontFamily = getFontFamily(config.font);
  const itemRefs = useRef({});
  const [costHidden, setCostHidden] = useState(true);
  const [memoHidden, setMemoHidden] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [sortMode, setSortMode] = useState('time'); // 'time' = 수업 길이순, 'category' = 분류 순서(국영수사과예체능기타)
  const [selected, setSelected] = useState(() => new Set());

  const displaySubjects = sortMode === 'category'
    ? [...subjects].sort((a, b) =>
        (a.colorIndex || 0) - (b.colorIndex || 0) || (a.name || '').localeCompare(b.name || '', 'ko'))
    : [...subjects].sort((a, b) => (a.duration || 0) - (b.duration || 0));
  const editModeRef = useRef(false);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function exitEdit() { setEditMode(false); setSelected(new Set()); }
  function handleBulkDelete() {
    if (!selected.size || !onDeleteSubjects) return;
    onDeleteSubjects([...selected], () => exitEdit());
  }
  function handleBulkHide() {
    if (!selected.size || !onSetSubjectsHidden) return;
    onSetSubjectsHidden([...selected], true, () => exitEdit());
  }
  
  useEffect(() => {
    const cleanups = [];
    
    subjects.forEach(subject => {
      const el = itemRefs.current[subject.id];
      if (!el) return;
      
      let longPressTimer = null;
      let startX = 0, startY = 0;
      let triggered = false;
      
      function getPoint(e) {
        if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        return { x: e.clientX, y: e.clientY };
      }
      
      function startLongPress() {
        if (triggered) return;
        triggered = true;
        el.classList.add('pressed');
        onEditSubject(subject.id);
      }
      
      function handleStart(e) {
        // 편집 모드에선 드래그/롱프레스 없이 선택만
        if (editModeRef.current) return;
        // 버튼(수정/숨김 등)을 누른 경우엔 드래그/롱프레스 시작하지 않음 — 버튼 클릭 중 과목이 움직이는 오작동 방지
        if (e.target.closest && e.target.closest('button')) return;
        if (!subject.active) return;
        e.preventDefault();
        const p = getPoint(e);
        startX = p.x;
        startY = p.y;
        triggered = false;
        
        longPressTimer = setTimeout(startLongPress, LONG_PRESS_MS);
        
        document.addEventListener('mousemove', handleMoveDuringPress);
        document.addEventListener('mouseup', handleEndDuringPress);
        document.addEventListener('touchmove', handleMoveDuringPress, { passive: false });
        document.addEventListener('touchend', handleEndDuringPress);
        document.addEventListener('touchcancel', handleEndDuringPress);
      }
      
      function handleMoveDuringPress(e) {
        if (triggered) return;
        const p = getPoint(e);
        const dx = Math.abs(p.x - startX);
        const dy = Math.abs(p.y - startY);
        
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          clearTimeout(longPressTimer);
          triggered = true;
          cleanupListeners();
          onDragStart(subject);
        }
      }
      
      function handleEndDuringPress() {
        if (longPressTimer) clearTimeout(longPressTimer);
        cleanupListeners();
        el.classList.remove('pressed');
      }
      
      function cleanupListeners() {
        document.removeEventListener('mousemove', handleMoveDuringPress);
        document.removeEventListener('mouseup', handleEndDuringPress);
        document.removeEventListener('touchmove', handleMoveDuringPress);
        document.removeEventListener('touchend', handleEndDuringPress);
        document.removeEventListener('touchcancel', handleEndDuringPress);
      }
      
      el.addEventListener('mousedown', handleStart);
      el.addEventListener('touchstart', handleStart, { passive: false });
      
      cleanups.push(() => {
        el.removeEventListener('mousedown', handleStart);
        el.removeEventListener('touchstart', handleStart);
        cleanupListeners();
        if (longPressTimer) clearTimeout(longPressTimer);
      });
    });
    
    return () => cleanups.forEach(fn => fn());
  }, [subjects, onDragStart, onEditSubject]);
  
  return (
    <div className={'tj-palette' + (collapsed ? ' collapsed' : '')}>
      <div className="tj-pal-head">
        <h3 style={{ cursor: 'pointer' }} onClick={onToggleCollapse} title={collapsed ? '펼치기' : '접기'}>{t('subjects')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {editMode ? (
            <>
              <button className="tj-pal-edit-btn" disabled={!selected.size} onClick={handleBulkHide}>
                숨기기{selected.size ? ` ${selected.size}` : ''}
              </button>
              <button className="tj-pal-del" disabled={!selected.size} onClick={handleBulkDelete}>
                삭제{selected.size ? ` ${selected.size}` : ''}
              </button>
              <button className="tj-pal-edit-btn" onClick={exitEdit}>완료</button>
            </>
          ) : (
            <>
              <span className={'tj-add-wrap' + (subjects.length === 0 ? ' attn' : '')}>
                {subjects.length === 0 && <span className="tj-add-coach">여기부터!</span>}
                <button
                  className={'tj-add-btn' + (subjects.length === 0 ? ' attn' : '')}
                  onClick={onAddSubject}
                  title="새 과목 만들기"
                >+</button>
              </span>
              {subjects.length > 0 && !collapsed && (
                <>
                  <button
                    className="tj-pal-edit-btn"
                    onClick={() => setSortMode(m => (m === 'time' ? 'category' : 'time'))}
                    title="정렬 방식 변경 (시간순 ↔ 과목순: 국·영·수·사·과·예체능·기타)"
                  >{sortMode === 'category' ? '과목순' : '시간순'}</button>
                  <button
                    className="tj-pal-edit-btn"
                    onClick={() => setEditMode(true)}
                  >편집</button>
                </>
              )}
              <button className="tj-eye-btn" onClick={onToggleCollapse} aria-label="과목 숨기기"><Eye off={collapsed} /></button>
            </>
          )}
        </div>
      </div>
      {subjects.length === 0 ? (
        <div className="tj-pal-hint tj-pal-hint-start">
          <b><span className="tj-hint-plus">＋</span> 버튼부터 눌러 과목을 만드세요!</b><br />
          그다음 만든 과목을 <b>시간표로 드래그</b>해 배치하고,<br />
          지울 땐 <b>휴지통으로 드래그</b>하면 돼요.
        </div>
      ) : (
        <div className="tj-pal-hint">
          이곳에 과목을 추가한 뒤, 시간표로 드래그해 보세요.<br />
          요일, 시간 범위, 폰트, 배경 등은 설정에서 자유롭게 변경할 수 있어요.
        </div>
      )}
      <div className="tj-pal-list" style={fontFamily ? { fontFamily } : undefined}>
        {subjects.length === 0 ? (
          <div className="tj-empty">{t('emptySubjects')}</div>
        ) : (
          displaySubjects.map(s => {
            const style = {};
            let className = 'tj-pal-item';
            if (!s.active) className += ' inactive';
            const c = getSubjectColor(config, s);
            if (c) {
              if (fullFill) {
                style.background = c;
                style.color = textColorOn(c);
                className += ' with-fill';
              } else {
                style.borderLeftColor = c;
                className += ' with-accent';
              }
            }
            if (editMode && selected.has(s.id)) className += ' sel';
            return (
              <div
                key={s.id}
                className={className}
                style={style}
                ref={(el) => { if (el) itemRefs.current[s.id] = el; }}
                onClick={editMode ? () => toggleSelect(s.id) : undefined}
              >
                {editMode ? (
                  <span className="tj-pal-check">{selected.has(s.id) ? '✓' : ''}</span>
                ) : (
                  <button
                    className="tj-pal-edit"
                    type="button"
                    title="수정"
                    aria-label="과목 수정"
                    onClick={() => onEditSubject(s.id)}
                  >✎</button>
                )}
                <div className="tj-pal-name">{s.name}</div>
                <div className="tj-pal-dur">{s.duration}분</div>
              </div>
            );
          })
        )}
        {!editMode && (() => {
          // 현재 서식(색띠/색 전체)에 맞춰 블루그레이로 표시 (앱 UI 톤과 어울리게)
          const cardStyle = {};
          let cardClass = 'tj-pal-item tj-pal-hidden-card' + (showHidden ? ' open' : '');
          if (fullFill) { const fill = '#dfe4ec'; cardStyle.background = fill; cardStyle.color = textColorOn(fill); cardClass += ' with-fill'; }
          else { cardStyle.borderLeftColor = '#aeb8c6'; cardClass += ' with-accent'; }
          return (
            <button
              type="button"
              className={cardClass}
              style={cardStyle}
              onClick={() => setShowHidden(v => !v)}
              title="숨긴 과목 보기"
            >
              <div className="tj-pal-name">숨긴 과목</div>
              <div className="tj-pal-dur">{hiddenSubjects.length}개 {showHidden ? '▲' : '▼'}</div>
            </button>
          );
        })()}
        {/* 숨긴 과목을 흐릿한 블록으로 촤르륵 펼침 — 한 번 누르면 숨기기 취소(되살리기) */}
        {!editMode && showHidden && hiddenSubjects.map((s, i) => {
          const style = { animationDelay: (i * 45) + 'ms' };
          let className = 'tj-pal-item tj-pal-hidden-block';
          const c = getSubjectColor(config, s);
          if (c) {
            if (fullFill) { style.background = c; style.color = textColorOn(c); className += ' with-fill'; }
            else { style.borderLeftColor = c; className += ' with-accent'; }
          }
          return (
            <div
              key={s.id}
              className={className}
              style={style}
              onClick={() => onSetSubjectsHidden && onSetSubjectsHidden([s.id], false)}
              title="눌러서 다시 보이기"
            >
              <div className="tj-pal-name">{s.name}</div>
              <div className="tj-pal-dur">{s.duration}분</div>
            </div>
          );
        })}
      </div>
      <div className="tj-edu">
          <div className="tj-edu-head">
            <span style={{ cursor: 'pointer' }} onClick={() => setCostHidden(h => !h)} title={costHidden ? '펼치기' : '접기'}>월 교육비</span>
            <button className="tj-eye-btn" onClick={() => setCostHidden(h => !h)} aria-label="교육비 숨기기"><Eye off={costHidden} /></button>
          </div>
          {!costHidden && catColors && monthlyCost > 0 && (
            <>
              <div className="tj-cost-bar">
                {CATEGORIES.map((cat, i) => {
                  const amt = (categoryCosts && categoryCosts[cat]) || 0;
                  if (!amt) return null;
                  return (
                    <div
                      key={cat}
                      style={{ width: (amt / monthlyCost * 100) + '%', background: catColors[i % catColors.length] }}
                      title={`${cat} ₩${amt.toLocaleString()}`}
                    />
                  );
                })}
              </div>
              <div className="tj-cost-legend">
                {CATEGORIES.map((cat, i) => {
                  const amt = (categoryCosts && categoryCosts[cat]) || 0;
                  if (!amt) return null;
                  return (
                    <span key={cat} className="tj-cost-leg">
                      <span className="dot" style={{ background: catColors[i % catColors.length] }} />
                      {cat} ₩{amt.toLocaleString()}
                    </span>
                  );
                })}
              </div>
            </>
          )}
          <div className="tj-cost-total">{costHidden ? '₩ •••••' : '₩' + monthlyCost.toLocaleString()}</div>
      </div>
      <div className="tj-memo-box">
        <div className="tj-memo-box-head">
          <span style={{ cursor: 'pointer' }} onClick={() => setMemoHidden(h => !h)} title={memoHidden ? '펼치기' : '접기'}>메모</span>
          <button className="tj-eye-btn" onClick={() => setMemoHidden(h => !h)} aria-label="메모 숨기기"><Eye off={memoHidden} /></button>
        </div>
        {!memoHidden && (
          <textarea
            className="tj-memo-input"
            value={memo}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder="메모를 입력하세요 (준비물·할 일 등)"
            rows={3}
          />
        )}
      </div>
    </div>
  );
}