import { useState, useRef } from 'react';
import { t } from '../i18n';
import { clearData } from '../storage';
import { FONTS, BACKGROUNDS } from '../App';

function pad(n) { return String(n).padStart(2, '0'); }

function hourOptions(min, max) {
  const opts = [];
  for (let h = min; h <= max; h++) {
    opts.push({ value: h, label: pad(h) + ':00' });
  }
  return opts;
}

export default function Settings({ 
  config, 
  timetableName,
  onConfigChange,
  onTimetableNameChange,
  onShowTutorial,
  onClose,
}) {
  const ttNameRef = useRef(null);
  const composingRef = useRef(false);
  const fileRef = useRef(null);

  // 사진첩에서 고른 이미지를 줄여서(최대 1280px, JPEG) 배경으로 저장
  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        onConfigChange({ ...config, bg: 'custom', bgImage: dataUrl });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function setWeek(range, lang) {
    onConfigChange({ ...config, weekRange: range, dayLang: lang });
  }
  
  function setAccent(accent) {
    onConfigChange({ ...config, accent });
  }

  function setFont(font) {
    onConfigChange({ ...config, font });
  }

  function setBg(bg) {
    onConfigChange({ ...config, bg });
  }
  
  function setStartHour(h) {
    let endHour = config.endHour;
    if (endHour <= h) endHour = h + 1;
    onConfigChange({ ...config, startHour: h, endHour });
  }
  
  function setEndHour(h) {
    onConfigChange({ ...config, endHour: h });
  }
  
  function handleClose() {
    if (ttNameRef.current) {
      onTimetableNameChange(ttNameRef.current.value);
    }
    onClose();
  }
  
  function handleShowTutorial() {
    if (ttNameRef.current) {
      onTimetableNameChange(ttNameRef.current.value);
    }
    onShowTutorial();
  }
  
  function handleReset() {
    const ok = window.confirm('모든 시간표와 과목이 삭제되고 처음부터 다시 시작됩니다. 정말 진행할까요?');
    if (ok) {
      clearData();
      window.location.reload();
    }
  }
  
  return (
    <div className="tj-modal-bg" onClick={handleClose}>
      <div className="tj-modal lg" onClick={(e) => e.stopPropagation()}>
        <h3>{t('settings')}</h3>
        
        <label>
          <span>{t('timetableName')}</span>
          <input
            ref={ttNameRef}
            type="text"
            defaultValue={timetableName}
            placeholder="예: 민준"
            autoComplete="off"
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={(e) => { 
              composingRef.current = false;
              onTimetableNameChange(e.target.value);
            }}
            onBlur={(e) => onTimetableNameChange(e.target.value)}
          />
        </label>
        
        <label>
          <span>{t('weekRange')}</span>
          <div className="tj-mode-strip">
            <button
              className={config.weekRange === 'mon-fri' && (config.dayLang || 'ko') === 'ko' ? 'active' : ''}
              onClick={() => setWeek('mon-fri', 'ko')}
            >월–금</button>
            <button
              className={config.weekRange === 'mon-sun' && (config.dayLang || 'ko') === 'ko' ? 'active' : ''}
              onClick={() => setWeek('mon-sun', 'ko')}
            >월–일</button>
            <button
              className={config.weekRange === 'mon-fri' && config.dayLang === 'en' ? 'active' : ''}
              onClick={() => setWeek('mon-fri', 'en')}
            >MON–FRI</button>
            <button
              className={config.weekRange === 'mon-sun' && config.dayLang === 'en' ? 'active' : ''}
              onClick={() => setWeek('mon-sun', 'en')}
            >MON–SUN</button>
          </div>
        </label>
        
        <label>
          <span>{t('timeRange')}</span>
          <div className="tj-time-row">
            <select 
              value={config.startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
            >
              {hourOptions(0, 23).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="dash">–</div>
            <select 
              value={config.endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
            >
              {hourOptions(config.startHour + 1, 24).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </label>
        
        <label>
          <span>{t('colorBand')}</span>
          <div className="tj-mode-strip">
            <button
              className={config.accent === 'pastel' ? 'active' : ''}
              onClick={() => setAccent('pastel')}
            >{t('accentPastel')}</button>
            <button
              className={config.accent === 'none' ? 'active' : ''}
              onClick={() => setAccent('none')}
            >{t('accentNone')}</button>
            <button
              className={config.accent === 'mono' ? 'active' : ''}
              onClick={() => setAccent('mono')}
            >{t('accentMono')}</button>
          </div>
        </label>

        <label>
          <span>{t('fontLabel')}</span>
          <div className="tj-font-grid">
            {FONTS.map(f => (
              <button
                key={f.key}
                className={(config.font || 'system') === f.key ? 'active' : ''}
                style={f.family ? { fontFamily: f.family } : undefined}
                onClick={() => setFont(f.key)}
              >{f.label}</button>
            ))}
          </div>
        </label>

        <label>
          <span>배경</span>
          <div className="tj-bg-grid">
            {BACKGROUNDS.map(b => (
              <button
                key={b.key}
                type="button"
                className={'tj-bg-item' + ((config.bg || 'white') === b.key ? ' active' : '')}
                onClick={() => setBg(b.key)}
              >
                <span
                  className="tj-bg-swatch"
                  style={b.image
                    ? { backgroundImage: `url(${b.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: b.css, backgroundSize: b.tile ? Math.round(b.tile * 0.28) + 'px' : undefined }}
                />
                <span className="tj-bg-label">{b.label}</span>
              </button>
            ))}
            <button
              type="button"
              className={'tj-bg-item' + (config.bg === 'custom' ? ' active' : '')}
              onClick={() => {
                if (config.bgImage && config.bg !== 'custom') setBg('custom');
                else fileRef.current && fileRef.current.click();
              }}
            >
              <span
                className="tj-bg-swatch"
                style={config.bgImage
                  ? { backgroundImage: `url(${config.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#bbb' }}
              >{config.bgImage ? '' : '＋'}</span>
              <span className="tj-bg-label">{config.bgImage ? '내 사진' : '사진'}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </label>

        <div style={{ borderTop: '0.5px solid #e5e5e5', paddingTop: '14px', marginTop: '4px' }}>
          <button
            onClick={handleReset}
            style={{
              width: '100%',
              minHeight: '40px',
              boxSizing: 'border-box',
              padding: '0 10px',
              background: 'transparent',
              border: '0.5px solid #E24B4A',
              color: '#A32D2D',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit'
            }}
          >
            🔄 처음부터 다시 시작
          </button>
        </div>
        
        <div className="tj-modal-actions">
          <button onClick={handleShowTutorial} style={{ marginRight: 'auto' }}>
            {t('showTutorial')}
          </button>
          <button className="primary" onClick={handleClose}>{t('done')}</button>
        </div>
      </div>
    </div>
  );
}