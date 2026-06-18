import { useState } from 'react';

const ALL_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

function toText(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return [v.supplies, v.notes].filter(Boolean).join(' / ');
}

export default function DayNotes({ config, dayNotes, onSave, onClose }) {
  const dayCount = config.weekRange === 'mon-fri' ? 5 : config.weekRange === 'mon-sat' ? 6 : 7;
  const days = ALL_DAYS.slice(0, dayCount);
  const [notes, setNotes] = useState(() => {
    const init = {};
    days.forEach(d => { init[d] = toText(dayNotes?.[d]); });
    return init;
  });

  function update(day, value) {
    setNotes(n => ({ ...n, [day]: value }));
  }

  function handleSave() {
    const cleaned = {};
    days.forEach(d => {
      const v = (notes[d] || '').trim();
      if (v) cleaned[d] = v;
    });
    onSave(cleaned);
    onClose();
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', border: '0.5px solid #d8d8d8',
    borderRadius: 0, padding: '6px 8px', fontSize: '12px', fontFamily: 'inherit',
    background: '#fff', color: '#222', resize: 'vertical', minHeight: '34px',
  };

  return (
    <div className="tj-modal-bg" onClick={onClose}>
      <div className="tj-modal lg" onClick={(e) => e.stopPropagation()}>
        <h3>요일별 메모</h3>
        <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
          요일마다 메모(준비물·참고 등)를 적어두세요.
        </div>
        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {days.map(d => (
            <div key={d} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{d}요일</div>
              <textarea
                placeholder="메모"
                value={notes[d]}
                onChange={(e) => update(d, e.target.value)}
                style={inputStyle}
                rows={2}
              />
            </div>
          ))}
        </div>
        <div className="tj-modal-actions">
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}
