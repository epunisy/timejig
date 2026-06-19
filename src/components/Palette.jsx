import { useRef, useEffect, useState } from 'react';
import { t } from '../i18n';
import { getAccents, getFontFamily, CATEGORIES } from '../App';

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
}) {
  const accents = getAccents(config.accent);
  const fontFamily = getFontFamily(config.font);
  const itemRefs = useRef({});
  const [costHidden, setCostHidden] = useState(false);
  
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
        <h3>{t('subjects')}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button className="tj-add-btn" onClick={onAddSubject}>+</button>
          <button className="tj-eye-btn" onClick={onToggleCollapse} aria-label="과목 숨기기"><Eye off={collapsed} /></button>
        </div>
      </div>
      <div className="tj-pal-hint">
        이곳에 과목을 추가한 뒤, 시간표로 드래그해 보세요.<br />
        요일, 시간 범위, 폰트, 배경 등은 설정에서 자유롭게 변경할 수 있어요.
      </div>
      <div className="tj-pal-list" style={fontFamily ? { fontFamily } : undefined}>
        {subjects.length === 0 ? (
          <div className="tj-empty">{t('emptySubjects')}</div>
        ) : (
          subjects.map(s => {
            const style = {};
            let className = 'tj-pal-item';
            if (!s.active) className += ' inactive';
            if (accents) {
              style.borderLeftColor = accents[s.colorIndex % accents.length];
              className += ' with-accent';
            }
            return (
              <div 
                key={s.id} 
                className={className} 
                style={style}
                ref={(el) => { if (el) itemRefs.current[s.id] = el; }}
              >
                <button
                  className="tj-pal-edit"
                  type="button"
                  title="수정"
                  aria-label="과목 수정"
                  onClick={() => onEditSubject(s.id)}
                >✎</button>
                <div className="tj-pal-name">{s.name}</div>
                <div className="tj-pal-dur">{s.duration}분</div>
              </div>
            );
          })
        )}
      </div>
      <div className="tj-edu">
          <div className="tj-edu-head">
            <span>월 교육비</span>
            <button className="tj-eye-btn" onClick={() => setCostHidden(h => !h)} aria-label="교육비 숨기기"><Eye off={costHidden} /></button>
          </div>
          {!costHidden && accents && monthlyCost > 0 && (
            <>
              <div className="tj-cost-bar">
                {CATEGORIES.map((cat, i) => {
                  const amt = (categoryCosts && categoryCosts[cat]) || 0;
                  if (!amt) return null;
                  return (
                    <div
                      key={cat}
                      style={{ width: (amt / monthlyCost * 100) + '%', background: accents[i % accents.length] }}
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
                      <span className="dot" style={{ background: accents[i % accents.length] }} />
                      {cat} ₩{amt.toLocaleString()}
                    </span>
                  );
                })}
              </div>
            </>
          )}
          <div className="tj-cost-total">{costHidden ? '₩ •••••' : '₩' + monthlyCost.toLocaleString()}</div>
      </div>
    </div>
  );
}