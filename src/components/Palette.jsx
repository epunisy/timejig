import { useRef, useEffect } from 'react';
import { t } from '../i18n';
import { getAccents, getFontFamily } from '../App';

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 8;

export default function Palette({
  config,
  subjects,
  onAddSubject,
  onEditSubject,
  onDragStart,
}) {
  const accents = getAccents(config.accent);
  const fontFamily = getFontFamily(config.font);
  const itemRefs = useRef({});
  
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
        // ✎ 수정 버튼을 누른 경우엔 드래그/롱프레스 시작하지 않음 (버튼 클릭으로 편집)
        if (e.target.closest && e.target.closest('.tj-pal-edit')) return;
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
    <div className="tj-palette">
      <div className="tj-pal-head">
        <h3>{t('subjects')}</h3>
        <button className="tj-add-btn" onClick={onAddSubject}>+</button>
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
    </div>
  );
}