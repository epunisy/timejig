import { useRef, Fragment } from 'react';
import { t } from '../i18n';
import { FONTS, BACKGROUNDS, FONT_SCALES, MOODS, MOOD_LIST, WEEK_PARTS, FULL_WEEK, getWeekDays } from '../App';

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
  user,
  onSignIn,
  onSignOut,
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        // 글씨가 놓이는 윗부분(상단 35%) 평균 밝기 → 글씨색 자동 결정용
        let luma = 180;
        try {
          const region = ctx.getImageData(0, 0, w, Math.max(1, Math.round(h * 0.35))).data;
          let sum = 0;
          for (let p = 0; p < region.length; p += 4) {
            sum += 0.299 * region[p] + 0.587 * region[p + 1] + 0.114 * region[p + 2];
          }
          luma = Math.round(sum / (region.length / 4));
        } catch (err) { /* cross-origin 등 실패 시 기본값 */ }
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        onConfigChange({ ...config, bg: 'custom', bgImage: dataUrl, bgLuma: luma });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  // 월~금 / 토 / 일 조각을 켜고 끄며 조합
  function toggleWeekPart(part) {
    const cur = new Set(getWeekDays(config));
    const allIn = part.days.every(d => cur.has(d));
    if (allIn) part.days.forEach(d => cur.delete(d));
    else part.days.forEach(d => cur.add(d));
    const next = FULL_WEEK.filter(d => cur.has(d));
    if (next.length === 0) return; // 최소 한 조각은 남김
    onConfigChange({ ...config, weekDays: next });
  }

  function setLang(lang) {
    onConfigChange({ ...config, dayLang: lang });
  }
  
  function setAccent(accent) {
    onConfigChange({ ...config, accent });
  }

  function setColorFill(colorFill) {
    onConfigChange({ ...config, colorFill });
  }

  function setFont(font) {
    onConfigChange({ ...config, font });
  }

  function setFontScale(fontScale) {
    onConfigChange({ ...config, fontScale });
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

  
  return (
    <div className="tj-modal-bg" onClick={handleClose}>
      <div className="tj-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="tj-modal-head">
          <h3>{t('settings')}</h3>
          <button className="tj-modal-x" onClick={handleClose} aria-label="닫기">×</button>
        </div>
        
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
            {WEEK_PARTS.map(p => {
              const cur = getWeekDays(config);
              const active = p.days.every(d => cur.includes(d));
              return (
                <button
                  key={p.key}
                  className={active ? 'active' : ''}
                  onClick={() => toggleWeekPart(p)}
                >{config.dayLang === 'en' ? p.labelEn : p.label}</button>
              );
            })}
          </div>
          <div style={{ fontSize: '10px', color: '#999', margin: '4px 0 2px' }}>
            원하는 조각을 골라 조합해요 (예: 월~금 + 일).
          </div>
          <div className="tj-mode-strip" style={{ marginTop: '4px' }}>
            <button
              className={(config.dayLang || 'ko') === 'ko' ? 'active' : ''}
              onClick={() => setLang('ko')}
            >한글</button>
            <button
              className={config.dayLang === 'en' ? 'active' : ''}
              onClick={() => setLang('en')}
            >English</button>
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
          <span>색 (무드)</span>
          <div className="tj-mood-list">
            {MOOD_LIST.map(m => (
              <button
                key={m.key}
                type="button"
                className={'tj-mood' + (config.accent === m.key ? ' active' : '')}
                onClick={() => setAccent(m.key)}
              >
                <span className="tj-mood-info">
                  <span className="tj-mood-name">{m.label}</span>
                  <span className="tj-mood-desc">{m.desc}</span>
                </span>
                <span className="tj-mood-swatches">
                  {MOODS[m.key].map((c, i) => (
                    <span key={i} className="tj-mood-sw" style={{ background: c }} />
                  ))}
                </span>
              </button>
            ))}
            <button
              type="button"
              className={'tj-mood' + (config.accent === 'none' ? ' active' : '')}
              onClick={() => setAccent('none')}
            >
              <span className="tj-mood-info">
                <span className="tj-mood-name">컬러 없음</span>
                <span className="tj-mood-desc">색 없이 깔끔하게</span>
              </span>
            </button>
          </div>
        </label>

        <label>
          <span>색 채우기</span>
          <div className="tj-mode-strip">
            <button
              className={(config.colorFill || 'band') === 'band' ? 'active' : ''}
              onClick={() => setColorFill('band')}
            >색띠</button>
            <button
              className={config.colorFill === 'full' ? 'active' : ''}
              onClick={() => setColorFill('full')}
            >칸 전체</button>
          </div>
          {config.accent === 'none' && (
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
              ‘색: 없음’ 이라 색은 표시되지 않아요.
            </div>
          )}
        </label>

        <label>
          <span>글씨 크기</span>
          <div className="tj-mode-strip">
            {[['sm','작게'],['md','보통'],['lg','크게'],['xl','아주 크게']].map(([key, label]) => (
              <button
                key={key}
                className={(config.fontScale || 'md') === key ? 'active' : ''}
                style={{ fontSize: Math.round(11 * FONT_SCALES[key]) + 'px' }}
                onClick={() => setFontScale(key)}
              >{label}</button>
            ))}
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
            {BACKGROUNDS.map((b, idx) => (
              <Fragment key={b.key}>
                <button
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
                {/* '사진(직접 업로드)' 을 기본(첫 배경) 바로 다음에 배치 */}
                {idx === 0 && (
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
                )}
              </Fragment>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>✨ 배경은 수시로 업데이트됩니다.</div>
        </label>

        <div style={{ borderTop: '0.5px solid #e5e5e5', paddingTop: '12px', marginTop: '4px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                ☁ {user.email} · 동기화 중
              </span>
              <button
                onClick={onSignOut}
                style={{ flexShrink: 0, minHeight: '32px', padding: '0 12px', background: 'transparent', border: '0.5px solid #ccc', color: '#666', fontSize: '11px', fontFamily: 'inherit', cursor: 'pointer' }}
              >로그아웃</button>
            </div>
          ) : (
            <>
              <button
                onClick={onSignIn}
                style={{ width: '100%', minHeight: '40px', boxSizing: 'border-box', background: '#fff', border: '0.5px solid #d8d8d8', color: '#333', fontSize: '12px', fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span style={{ fontWeight: 700, color: '#4285F4' }}>G</span> Google로 로그인 (백업·동기화)
              </button>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '6px', lineHeight: 1.45 }}>
                로그인하면 시간표가 내 계정에 저장돼, 기기를 바꾸거나 앱을 지워도 그대로 불러올 수 있어요.
              </div>
            </>
          )}
        </div>

        <div style={{ borderTop: '0.5px solid #e5e5e5', paddingTop: '12px', marginTop: '4px' }}>
          <div style={{ fontSize: '10px', color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
            글꼴 제공: Google Fonts (SIL Open Font License)
          </div>
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