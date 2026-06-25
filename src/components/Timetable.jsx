import { useRef, useState, useEffect } from 'react';
import { getFontFamily, getFontScale, resolveBackground, getSubjectColor, isFullFill, textColorOn, getWeekDays, getDayLabels } from '../App';

const SLOT_MIN = 10;
const HOUR_PX = 50;
const PX_PER_MIN = HOUR_PX / 60;
const COL_W_LABEL = 36;

function pad(n) { return String(n).padStart(2, '0'); }

function getEventPoint(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  if (e.changedTouches && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

export default function Timetable({
  config,
  blocks,
  subjects,
  onBlocksChange,
  dragSubject,
  onDragEnd,
  onInternalDraggingChange,
  locked,
  scrollNowKey,
}) {
  // 오늘 요일 — 항상 강조해서 현재 요일을 한눈에
  const todayKor = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];
  const gridBodyRef = useRef(null);
  const [internalDrag, setInternalDrag] = useState(null);
  // 현재 시각(분) — 타임라인 표시용, 30초마다 갱신
  const [nowMin, setNowMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMin(d.getHours() * 60 + d.getMinutes()); }, 30000);
    return () => clearInterval(id);
  }, []);

  const days = getWeekDays(config);
  const dayLabels = getDayLabels(config);
  const totalMin = (config.endHour - config.startHour) * 60;
  const bodyHeight = (config.endHour - config.startHour) * HOUR_PX;
  const nowFromStart = nowMin - config.startHour * 60;
  const showNowLine = nowFromStart >= 0 && nowFromStart <= totalMin;
  const nowTop = Math.round(nowFromStart * PX_PER_MIN);
  const nowLabel = pad(Math.floor(nowMin / 60)) + ':' + pad(nowMin % 60);
  
  function fmtTime(min) {
    const h = config.startHour + Math.floor(min / 60);
    const m = min % 60;
    return pad(h) + ':' + pad(m);
  }

  // 로고 클릭 시 — 현재 시각(타임라인)이 가운데 오도록 자동 스크롤
  useEffect(() => {
    if (!scrollNowKey) return;
    const el = gridBodyRef.current && gridBodyRef.current.querySelector('.tj-nowline');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [scrollNowKey]);

  useEffect(() => {
    if (!dragSubject) return;
    
    const palColor = getSubjectColor(config, dragSubject) || '#888';

    function handleMove(e) {
      const p = getEventPoint(e);
      showGhost(dragSubject.name, p.x, p.y, palColor);
      const body = gridBodyRef.current;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const x = p.x - rect.left;
      const y = p.y - rect.top;
      const dayColW = (rect.width - COL_W_LABEL) / days.length;
      const inside = x >= COL_W_LABEL && x <= rect.width && y >= 0 && y <= rect.height;

      if (inside) {
        const dayIdx = Math.floor((x - COL_W_LABEL) / dayColW);
        const dur = dragSubject.duration;
        const minutesFromTop = y / PX_PER_MIN;
        let snapped = Math.round((minutesFromTop - dur / 2) / SLOT_MIN) * SLOT_MIN;
        snapped = Math.max(0, Math.min(snapped, totalMin - dur));
        
        const day = days[dayIdx];
        const newStart = snapped;
        const newEnd = snapped + dur;
        const overlap = blocks.some(b => {
          if (b.day !== day) return false;
          return !(newEnd <= b.start || newStart >= b.end);
        });
        
        showDropPreview(day, newStart, newEnd, overlap);
      } else {
        clearDropPreview();
      }
    }
    
    function handleEnd(e) {
      const p = getEventPoint(e);
      clearGhost();
      const body = gridBodyRef.current;
      if (!body) { onDragEnd(null); return; }
      const rect = body.getBoundingClientRect();
      const x = p.x - rect.left;
      const y = p.y - rect.top;
      const dayColW = (rect.width - COL_W_LABEL) / days.length;
      const inside = x >= COL_W_LABEL && x <= rect.width && y >= 0 && y <= rect.height;
      
      let dropInfo = null;
      if (inside) {
        const dayIdx = Math.floor((x - COL_W_LABEL) / dayColW);
        const dur = dragSubject.duration;
        const minutesFromTop = y / PX_PER_MIN;
        let snapped = Math.round((minutesFromTop - dur / 2) / SLOT_MIN) * SLOT_MIN;
        snapped = Math.max(0, Math.min(snapped, totalMin - dur));
        const day = days[dayIdx];
        const newStart = snapped;
        const newEnd = snapped + dur;
        const overlap = blocks.some(b => {
          if (b.day !== day) return false;
          return !(newEnd <= b.start || newStart >= b.end);
        });
        if (!overlap) dropInfo = { day, start: newStart, end: newEnd };
      }
      
      clearDropPreview();
      onDragEnd(dropInfo);
    }
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      clearGhost();
    };
  }, [dragSubject, blocks, days, totalMin]);
  
  function handleBlockStart(e, block) {
    if (locked) return; // 고정 상태면 블록이 안 움직임
    e.preventDefault();
    setInternalDrag(block);
    onInternalDraggingChange(true);
  }
  
  useEffect(() => {
    if (!internalDrag) return;

    const dragSubj = subjects.find(s => s.id === internalDrag.subjectId);
    const dragLabel = dragSubj ? dragSubj.name : '';
    const intColor = getSubjectColor(config, dragSubj) || '#888';

    function handleMove(e) {
      e.preventDefault();
      const p = getEventPoint(e);
      showGhost(dragLabel, p.x, p.y, intColor);
      const body = gridBodyRef.current;
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const x = p.x - rect.left;
      const y = p.y - rect.top;
      const dayColW = (rect.width - COL_W_LABEL) / days.length;
      const inside = x >= COL_W_LABEL && x <= rect.width && y >= 0 && y <= rect.height;
      
      const trash = document.getElementById('trash-zone');
      if (trash) {
        const tRect = trash.getBoundingClientRect();
        const overT = p.x >= tRect.left && p.x <= tRect.right &&
                      p.y >= tRect.top && p.y <= tRect.bottom;
        trash.className = 'tj-trash-zone' + (overT ? ' over' : '');
      }
      
      if (inside) {
        const dayIdx = Math.floor((x - COL_W_LABEL) / dayColW);
        const dur = internalDrag.end - internalDrag.start;
        const minutesFromTop = y / PX_PER_MIN;
        let snapped = Math.round((minutesFromTop - dur / 2) / SLOT_MIN) * SLOT_MIN;
        snapped = Math.max(0, Math.min(snapped, totalMin - dur));
        const day = days[dayIdx];
        const newStart = snapped;
        const newEnd = snapped + dur;
        const overlap = blocks.some(b => {
          if (b.id === internalDrag.id) return false;
          if (b.day !== day) return false;
          return !(newEnd <= b.start || newStart >= b.end);
        });
        showDropPreview(day, newStart, newEnd, overlap);
      } else {
        clearDropPreview();
      }
    }
    
    function handleEnd(e) {
      const p = getEventPoint(e);
      const trash = document.getElementById('trash-zone');
      const overTrash = trash && (() => {
        const tRect = trash.getBoundingClientRect();
        return p.x >= tRect.left && p.x <= tRect.right &&
               p.y >= tRect.top && p.y <= tRect.bottom;
      })();
      
      if (overTrash) {
        onBlocksChange(blocks.filter(b => b.id !== internalDrag.id));
      } else {
        const body = gridBodyRef.current;
        if (body) {
          const rect = body.getBoundingClientRect();
          const x = p.x - rect.left;
          const y = p.y - rect.top;
          const dayColW = (rect.width - COL_W_LABEL) / days.length;
          const inside = x >= COL_W_LABEL && x <= rect.width && y >= 0 && y <= rect.height;
          if (inside) {
            const dayIdx = Math.floor((x - COL_W_LABEL) / dayColW);
            const dur = internalDrag.end - internalDrag.start;
            const minutesFromTop = y / PX_PER_MIN;
            let snapped = Math.round((minutesFromTop - dur / 2) / SLOT_MIN) * SLOT_MIN;
            snapped = Math.max(0, Math.min(snapped, totalMin - dur));
            const day = days[dayIdx];
            const newStart = snapped;
            const newEnd = snapped + dur;
            const overlap = blocks.some(b => {
              if (b.id === internalDrag.id) return false;
              if (b.day !== day) return false;
              return !(newEnd <= b.start || newStart >= b.end);
            });
            if (!overlap) {
              onBlocksChange(blocks.map(b => 
                b.id === internalDrag.id ? { ...b, day, start: newStart, end: newEnd } : b
              ));
            }
          }
        }
      }
      
      clearDropPreview();
      clearGhost();
      if (trash) trash.className = 'tj-trash-zone';
      setInternalDrag(null);
      onInternalDraggingChange(false);
    }
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      clearGhost();
    };
  }, [internalDrag, blocks, days, totalMin, subjects, onBlocksChange, onInternalDraggingChange]);
  
  function showDropPreview(day, start, end, invalid) {
    clearDropPreview();
    const dayCol = document.querySelector(`[data-day="${day}"]`);
    if (!dayCol) return;
    const top = Math.round(start * PX_PER_MIN);
    const bottom = Math.round(end * PX_PER_MIN);
    const div = document.createElement('div');
    div.className = 'tj-drop-preview' + (invalid ? ' invalid' : '');
    div.style.top = top + 'px';
    div.style.height = (bottom - top) + 'px';
    dayCol.appendChild(div);
  }
  
  function clearDropPreview() {
    document.querySelectorAll('.tj-drop-preview').forEach(el => el.remove());
  }

  // 드래그 중 커서를 따라다니는 고스트 (무엇을 옮기는지 보이게)
  function showGhost(text, x, y, color) {
    let g = document.getElementById('drag-ghost');
    if (!g) {
      g = document.createElement('div');
      g.id = 'drag-ghost';
      g.className = 'tj-ghost';
      document.body.appendChild(g);
    }
    g.textContent = text;
    g.style.left = x + 'px';
    g.style.top = y + 'px';
    g.style.borderLeftColor = color || '#888';
  }

  function clearGhost() {
    const g = document.getElementById('drag-ghost');
    if (g) g.remove();
  }
  
  const hours = [];
  for (let h = config.startHour; h <= config.endHour; h++) hours.push(h);
  const colTpl = `${COL_W_LABEL}px repeat(${days.length}, 1fr)`;
  const fullFill = isFullFill(config);

  const fontFamily = getFontFamily(config.font);
  const bgBorder = resolveBackground(config).border;
  const fontScale = getFontScale(config.fontScale);
  const gridStyle = {
    // 과목명 글씨 크기 배율 (CSS 변수로 .nm 에만 적용 — 시간은 고정)
    '--tj-nm': (10 * fontScale).toFixed(1) + 'px',
  };
  if (fontFamily) gridStyle.fontFamily = fontFamily;
  if (bgBorder) gridStyle.borderColor = bgBorder;

  return (
    <div className="tj-grid" style={gridStyle}>
      <div className="tj-grid-header" style={{ gridTemplateColumns: colTpl }}>
        <div className="tj-corner"></div>
        {days.map((d, i) => (
          <div key={d} className={'tj-day-head' + (d === todayKor ? ' tj-today' : '')}>{dayLabels[i]}</div>
        ))}
      </div>
      <div
        className="tj-grid-body"
        ref={gridBodyRef}
        style={{ gridTemplateColumns: colTpl, height: bodyHeight + 'px' }}
      >
        <div className="tj-time-col">
          {hours.map((h, i) => i === hours.length - 1 ? null : (
            <div key={h} style={{
              position: 'absolute',
              top: (i * HOUR_PX + 3) + 'px',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: '10px',
              color: '#444',
            }}>
              {pad(h)}
            </div>
          ))}
        </div>
        {days.map(d => (
          <div key={d} className={'tj-day-col' + (d === todayKor ? ' tj-today' : '')} data-day={d}>
            {hours.map((h, i) => i === 0 ? null : (
              <div 
                key={h}
                className="tj-hour-line" 
                style={{ top: (i * HOUR_PX) + 'px' }}
              />
            ))}
            {blocks.filter(b => b.day === d).map(b => {
              const subj = subjects.find(s => s.id === b.subjectId);
              if (!subj) return null;
              const top = Math.round(b.start * PX_PER_MIN);
              const bottom = Math.round(b.end * PX_PER_MIN);
              const style = {
                top: top + 'px',
                height: (bottom - top + 1) + 'px',
                // 늦게 시작하는 블록일수록 살짝 위로 쌓아 1px 테두리 겹침을 자연스럽게.
                // 단, 모달/튜토리얼 오버레이(z-index 100~300)는 넘지 않도록 시(hour) 단위로 제한.
                zIndex: 2 + Math.floor(b.start / 60),
              };
              let className = 'tj-block';
              const c = getSubjectColor(config, subj);
              let bandColor = null;
              if (c) {
                if (fullFill) {
                  style.background = c;
                  style.color = textColorOn(c);
                  className += ' with-fill';
                } else {
                  bandColor = c;
                  className += ' with-accent';
                }
              }
              return (
                <div
                  key={b.id}
                  className={className}
                  style={style}
                  onMouseDown={(e) => handleBlockStart(e, b)}
                  onTouchStart={(e) => handleBlockStart(e, b)}
                >
                  {bandColor && <span className="tj-block-band" style={{ background: bandColor }} />}
                  <div className="nm">{subj.name}</div>
                  <div className="tm">{fmtTime(b.start)}~<wbr />{fmtTime(b.end)}</div>
                </div>
              );
            })}
          </div>
        ))}
        {showNowLine && (
          <div className="tj-nowline" style={{ top: nowTop + 'px' }} aria-hidden="true">
            <span className="tj-nowline-dot" />
            <span className="tj-nowline-time">{nowLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}