import { useRef, useState, useEffect } from 'react';
import { getAccents } from '../App';

const ALL_DAYS = ['월','화','수','목','금','토','일'];
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
}) {
  const gridBodyRef = useRef(null);
  const [internalDrag, setInternalDrag] = useState(null);
  
  const days = config.weekRange === 'mon-fri' ? ALL_DAYS.slice(0, 5) : ALL_DAYS;
  const totalMin = (config.endHour - config.startHour) * 60;
  const bodyHeight = (config.endHour - config.startHour) * HOUR_PX;
  
  function fmtTime(min) {
    const h = config.startHour + Math.floor(min / 60);
    const m = min % 60;
    return pad(h) + ':' + pad(m);
  }
  
  useEffect(() => {
    if (!dragSubject) return;
    
    function handleMove(e) {
      const p = getEventPoint(e);
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
    };
  }, [dragSubject, blocks, days, totalMin]);
  
  function handleBlockStart(e, block) {
    e.preventDefault();
    setInternalDrag(block);
    onInternalDraggingChange(true);
  }
  
  useEffect(() => {
    if (!internalDrag) return;
    
    function handleMove(e) {
      e.preventDefault();
      const p = getEventPoint(e);
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
    };
  }, [internalDrag, blocks, days, totalMin, onBlocksChange, onInternalDraggingChange]);
  
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
  
  const hours = [];
  for (let h = config.startHour; h <= config.endHour; h++) hours.push(h);
  const colTpl = `${COL_W_LABEL}px repeat(${days.length}, 1fr)`;
  const accents = getAccents(config.accent);
  
  return (
    <div className="tj-grid">
      <div className="tj-grid-header" style={{ gridTemplateColumns: colTpl }}>
        <div className="tj-corner"></div>
        {days.map(d => <div key={d} className="tj-day-head">{d}</div>)}
      </div>
      <div 
        className="tj-grid-body" 
        ref={gridBodyRef}
        style={{ gridTemplateColumns: colTpl, height: bodyHeight + 'px' }}
      >
        <div className="tj-time-col">
          {hours.map((h, i) => (
            <div key={h} style={{
              position: 'absolute',
              top: (i * HOUR_PX + 3) + 'px',
              right: '4px',
              fontSize: '10px',
              color: '#888',
            }}>
              {pad(h)}
            </div>
          ))}
        </div>
        {days.map(d => (
          <div key={d} className="tj-day-col" data-day={d}>
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
              const style = { top: top + 'px', height: (bottom - top) + 'px' };
              let className = 'tj-block';
              if (accents) {
                style.borderLeftColor = accents[subj.colorIndex % accents.length];
                className += ' with-accent';
              }
              return (
                <div
                  key={b.id}
                  className={className}
                  style={style}
                  onMouseDown={(e) => handleBlockStart(e, b)}
                  onTouchStart={(e) => handleBlockStart(e, b)}
                >
                  <div className="nm">{subj.name}</div>
                  <div className="tm">{fmtTime(b.start)}–{fmtTime(b.end)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}