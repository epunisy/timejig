import { useState } from 'react';

const ALL_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function DayNotes({ config, dayNotes, onSave, onClose }) {
  const dayCount = config.weekRange === 'mon-fri' ? 5 : config.weekRange === 'mon-sat' ? 6 : 7;
  const days = ALL_DAYS.slice(0, dayCount);
  const [notes, setNotes] = useState(() => {
    const init = {};
    days.forEach(d => {
      init[d] = { supplies: dayNotes?.[d]?.supplies || '', notes: dayNotes?.[d]?.notes || '' };
    });
    return init;
  });

  function update(day, field, value) {
    setNotes(n => ({ ...n, [day]: { ...n[day], [field]: value } }));
  }

  function handleSave() {
    // 빈 요일은 저장에서 제외
    const cleaned = {};
    days.forEach(d => {
      const s = (notes[d].supplies || '').trim();
      const t = (notes[d].notes || '').trim();
      if (s || t) cleaned[d] = { supplies: s, notes: t };
    });
    onSave(cleaned);
    onClose();
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', border: '0.5px solid #d8d8d8',
    borderRadius: 0, padding: '6px 8px', fontSize: '12px', fontFamily: 'inherit',
    background: '#fff', color: '#222', resize: 'vertical', minHeight: '32px',
  };

  return (
    <div className="tj-modal-bg" onClick={onClose}>
      <div className="tj-modal lg" onClick={(e) => e.stopPropagation()}>
        <h3>요일별 메모</h3>
        <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>
          요일마다 준비물과 참고사항을 적어두세요.
        </div>
        <div style={{ maxHeight: '52vh', overflowY: 'auto' }}>
          {days.map(d => (
            <div key={d} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{d}요일</div>
              <input
                type="text"
                placeholder="🎒 준비물"
                value={notes[d].supplies}
                onChange={(e) => update(d, 'supplies', e.target.value)}
                style={{ ...inputStyle, marginBottom: '4px' }}
              />
              <textarea
                placeholder="📌 참고사항"
                value={notes[d].notes}
                onChange={(e) => update(d, 'notes', e.target.value)}
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
