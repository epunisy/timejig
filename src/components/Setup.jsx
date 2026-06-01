import { useState, useRef, useEffect } from 'react';
import { t } from '../i18n';

function pad(n) { return String(n).padStart(2, '0'); }

function hourOptions(min, max) {
  const opts = [];
  for (let h = min; h <= max; h++) {
    opts.push({ value: h, label: pad(h) + ':00' });
  }
  return opts;
}

// 본인 딸들 이름
const NAME_SAMPLES = ['민주', '민정'];

function getRandomName() {
  return NAME_SAMPLES[Math.floor(Math.random() * NAME_SAMPLES.length)];
}

export default function Setup({ onDone }) {
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(16);
  const [accent, setAccent] = useState('pastel');
  const [randomName] = useState(getRandomName);
  
  const inputRef = useRef(null);
  const composingRef = useRef(false);
  
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);
  
  function handleStart() {
    const finalName = inputRef.current.value.trim();
    onDone(finalName, startHour, endHour, accent);
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !composingRef.current) {
      handleStart();
    }
  }
  
  function handleStartHourChange(h) {
    setStartHour(h);
    if (endHour <= h) setEndHour(h + 1);
  }
  
  return (
    <div className="tj-setup">
      <img src="/logo.png" alt={t('appName')} className="tj-setup-logo" />
      <div className="tj-setup-greeting">
        {t('welcome')}{'\n'}{t('setupGuide')}
      </div>
      
      <input
        ref={inputRef}
        type="text"
        className="tj-name-input tj-name-input-small"
        placeholder={`예: ${randomName}`}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
          시간표 시간 범위
        </div>
        <div className="tj-time-row">
          <select
            value={startHour}
            onChange={(e) => handleStartHourChange(parseInt(e.target.value, 10))}
            style={{ minHeight: '40px', boxSizing: 'border-box', padding: '0 12px', border: '0.5px solid #d8d8d8', fontSize: '14px', fontFamily: 'inherit', background: '#fff', color: '#222' }}
          >
            {hourOptions(0, 23).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="dash">–</div>
          <select
            value={endHour}
            onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
            style={{ minHeight: '40px', boxSizing: 'border-box', padding: '0 12px', border: '0.5px solid #d8d8d8', fontSize: '14px', fontFamily: 'inherit', background: '#fff', color: '#222' }}
          >
            {hourOptions(startHour + 1, 24).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
          {t('colorBand')}
        </div>
        <div className="tj-mode-strip">
          <button
            className={accent === 'pastel' ? 'active' : ''}
            onClick={() => setAccent('pastel')}
          >{t('accentPastel')}</button>
          <button
            className={accent === 'none' ? 'active' : ''}
            onClick={() => setAccent('none')}
          >{t('accentNone')}</button>
          <button
            className={accent === 'mono' ? 'active' : ''}
            onClick={() => setAccent('mono')}
          >{t('accentMono')}</button>
        </div>
      </div>

      <button className="tj-setup-cta" onClick={handleStart}>
        {t('start')}
      </button>
      <div className="tj-setup-hint">월–금으로 시작해요.{'\n'}나중에 ⚙ 설정에서 다 바꿀 수 있어요.</div>
    </div>
  );
}