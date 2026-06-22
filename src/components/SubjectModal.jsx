import { useState, useRef, useEffect } from 'react';
import { t } from '../i18n';
import { getAccents, CATEGORIES } from '../App';

// 직접선택 색 팔레트 (밝은 톤 위주 — 칸 전체로 채워도 글씨가 보이게)
const CUSTOM_COLORS = [
  '#F4A8A8', '#F6C28B', '#F7E08B', '#BFE3A0', '#9FE1CB', '#9CD3EF',
  '#B5D4F4', '#C9B8F0', '#E7B5DE', '#D8C3A5', '#C9CED4', '#9AA3AD',
];

export default function SubjectModal({ subject, config, onSave, onCancel, onDelete }) {
  const accents = getAccents(config.accent);
  const isCustomColor = config.accent === 'custom';
  const isEdit = subject !== null;
  const [customColor, setCustomColor] = useState(subject?.color || CUSTOM_COLORS[0]);

  // 분류 = 색띠. 기존 데이터 호환: category 없으면 colorIndex로 추정, 그것도 없으면 '기타'
  const initCategory = subject?.category
    || (subject && typeof subject.colorIndex === 'number' ? CATEGORIES[subject.colorIndex] : null)
    || '기타';
  const [category, setCategory] = useState(initCategory);

  const nameInputRef = useRef(null);
  const composingRef = useRef(false);

  const DUR_PRESETS = [60, 120, 180, 240];
  const initDur = subject?.duration || 60;
  const [durMode, setDurMode] = useState(DUR_PRESETS.includes(initDur) ? String(initDur) : 'custom');
  const [customDur, setCustomDur] = useState(String(initDur));

  const [priceType, setPriceType] = useState(subject?.priceType || 'month');
  const [priceStr, setPriceStr] = useState(subject?.price ? String(subject.price) : '');

  useEffect(() => {
    if (nameInputRef.current) nameInputRef.current.focus();
  }, []);

  function handleSave() {
    const name = nameInputRef.current.value.trim();
    if (!name) return;
    const duration = durMode === 'custom' ? (parseInt(customDur, 10) || 60) : parseInt(durMode, 10);
    const price = parseInt(priceStr, 10) || 0;
    const colorIndex = Math.max(0, CATEGORIES.indexOf(category));
    onSave({ name, duration, colorIndex, price, priceType, category, color: customColor });
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !composingRef.current) handleSave();
    if (e.key === 'Escape') onCancel();
  }
  
  return (
    <div className="tj-modal-bg" onClick={onCancel}>
      <div className="tj-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? '과목 편집' : '과목 추가'}</h3>
        
        <label>
          <span>{t('subjectName')}</span>
          <input
            ref={nameInputRef}
            type="text"
            defaultValue={subject?.name || ''}
            placeholder="예: 국어"
            autoComplete="off"
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={() => { composingRef.current = false; }}
            onKeyDown={handleKeyDown}
          />
        </label>
        
        <label>
          <span>{t('subjectDuration')}</span>
          <div className="tj-mode-strip">
            {DUR_PRESETS.map(p => (
              <button
                key={p}
                type="button"
                className={durMode === String(p) ? 'active' : ''}
                onClick={() => setDurMode(String(p))}
              >{p}분</button>
            ))}
            <button
              type="button"
              className={durMode === 'custom' ? 'active' : ''}
              onClick={() => setDurMode('custom')}
            >직접입력</button>
          </div>
          {durMode === 'custom' && (
            <input
              type="number"
              min="10"
              step="10"
              value={customDur}
              placeholder="분"
              onChange={(e) => setCustomDur(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ marginTop: '6px' }}
              autoFocus
            />
          )}
        </label>

        <label>
          <span>학원비 (선택)</span>
          <div className="tj-mode-strip">
            <button type="button" className={priceType === 'month' ? 'active' : ''} onClick={() => setPriceType('month')}>한달치</button>
            <button type="button" className={priceType === 'session' ? 'active' : ''} onClick={() => setPriceType('session')}>회당</button>
          </div>
          <input
            type="number"
            min="0"
            step="1000"
            value={priceStr}
            placeholder="원 (비우면 계산 안 함)"
            onChange={(e) => setPriceStr(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ marginTop: '6px' }}
          />
        </label>
        
        {isCustomColor && (
          <label>
            <span>색 (직접선택)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {CUSTOM_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={'색 ' + c}
                  onClick={() => setCustomColor(c)}
                  style={{
                    height: '28px', background: c, cursor: 'pointer',
                    border: customColor.toLowerCase() === c.toLowerCase() ? '2px solid #222' : '1px solid #ddd',
                  }}
                />
              ))}
            </div>
            <input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              style={{ marginTop: '6px', width: '100%', height: '30px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
            />
          </label>
        )}

        <label>
          <span>분류{accents ? ' (색)' : ' (학원비 묶음)'}</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                style={{
                  minWidth: 0,
                  padding: '8px 4px',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  background: '#fff',
                  border: '1px solid #ccc',
                  borderLeft: accents ? `7px solid ${accents[i % accents.length]}` : '1px solid #ccc',
                  ...(category === cat ? { outline: '2px solid #222', outlineOffset: '1px', fontWeight: 700 } : {})
                }}
              >{cat}</button>
            ))}
          </div>
          <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
            {isCustomColor
              ? '분류는 월 교육비를 묶는 데 쓰여요. 색은 위에서 직접 골라요.'
              : config.accent === 'none'
                ? '‘색: 없음’ 이라 색은 표시되지 않지만 분류는 저장돼요.'
                : '분류에 따라 색이 정해져요.'}
          </div>
        </label>
        
        <div className="tj-modal-actions">
          {isEdit && (
            <button className="danger" onClick={onDelete}>{t('delete')}</button>
          )}
          <button onClick={onCancel}>{t('cancel')}</button>
          <button className="primary" onClick={handleSave}>{t('save')}</button>
        </div>
      </div>
    </div>
  );
}