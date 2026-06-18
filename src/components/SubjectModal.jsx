import { useState, useRef, useEffect } from 'react';
import { t } from '../i18n';
import { getAccents } from '../App';

export default function SubjectModal({ subject, config, subjectCount, onSave, onCancel, onDelete }) {
  const accents = getAccents(config.accent);
  const isEdit = subject !== null;
  
  const [colorIndex, setColorIndex] = useState(
    subject ? subject.colorIndex : 
    (accents ? subjectCount % accents.length : 0)
  );
  
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
    onSave({ name, duration, colorIndex, price, priceType });
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
        
        {accents ? (
          <label>
            <span>{t('colorBand')}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '6px' }}>
              {accents.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  style={{
                    aspectRatio: '1',
                    background: '#fff',
                    border: '1px solid #aaa',
                    borderLeft: `5px solid ${c}`,
                    cursor: 'pointer',
                    minHeight: '38px',
                    ...(colorIndex === i ? { outline: '2px solid #222', outlineOffset: '2px' } : {})
                  }}
                />
              ))}
            </div>
          </label>
        ) : (
          <div style={{ fontSize: '11px', color: '#888' }}>
            색띠는 설정의 [색띠: 없음] 이라 별도 색이 없습니다.
          </div>
        )}
        
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