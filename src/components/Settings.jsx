import { useRef, useState, Fragment } from 'react';
import { t } from '../i18n';
import { FONTS, BACKGROUNDS, FONT_SCALES, MOODS, MOOD_LIST, WEEK_PARTS, FULL_WEEK, getWeekDays, textColorOn } from '../App';

// 배경 색표 — 가로(같은 계열) 밝은→진한, 세로(색 계열). 톡 누르면 바로 적용
const PRESET_BG_COLORS = [
  // 무채색
  '#FFFFFF', '#ECECEC', '#CFCFCF', '#9E9E9E', '#5C5C5C', '#1F1F1F',
  // 핑크
  '#FFEEF2', '#FFD6E0', '#F7AEC0', '#EE7F9C', '#D85476', '#A83A57',
  // 옐로
  '#FFF8DD', '#FFF0B8', '#FCE183', '#F5CB4E', '#E0A92A', '#B5841C',
  // 그린
  '#EAF6E6', '#D2EEC8', '#AEDDA0', '#84C873', '#5BA84C', '#3E7E33',
  // 블루
  '#E7F1FB', '#CFE3F7', '#A6CCEF', '#74AEE2', '#4A86C6', '#346099',
  // 퍼플
  '#F1ECFA', '#E0D3F3', '#C5AEE8', '#A684D9', '#8460C0', '#644796',
];

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
  onApplyToAll,
  user,
  onClose,
}) {
  const ttNameRef = useRef(null);
  const composingRef = useRef(false);
  const fileRef = useRef(null);
  // 색 채우기 예시용 샘플 색 (현재 무드의 한 색, 없으면 기본 민트)
  const sampleColor = (MOODS[config.accent] && MOODS[config.accent][1]) || '#9DDACF';
  const [colorPickOpen, setColorPickOpen] = useState(false);

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
  
  return (
    <>
    <div className="tj-modal-bg" onClick={handleClose}>
      <div className="tj-modal lg tj-set-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tj-modal-head">
          <h3>{t('settings')}</h3>
          <button className="tj-modal-x" onClick={handleClose} aria-label="닫기">×</button>
        </div>

        <div className="tj-set-section tj-set-section--first">
          <span className="tj-set-section-t">시간표 설정</span>
          <span className="tj-set-section-h">이름 · 요일 · 시간은 지금 보고 있는 시간표에만 적용돼요.</span>
        </div>
        <div className="tj-set-group">

        <label>
          <span>{t('timetableName')}</span>
          <input
            ref={ttNameRef}
            className="tj-underline"
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
              className="tj-underline"
              value={config.startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
            >
              {hourOptions(0, 23).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="dash">–</div>
            <select
              className="tj-underline"
              value={config.endHour}
              onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
            >
              {hourOptions(config.startHour + 1, 24).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </label>
        </div>

        <div className="tj-set-section">
          <span className="tj-set-section-t">꾸밈 (서식)</span>
          <span className="tj-set-section-h">색 · 글씨 · 배경. 아래 ‘모든 시간표에 적용’으로 한 번에 맞출 수 있어요.</span>
        </div>
        <div className="tj-set-group">

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

        {config.accent !== 'none' && (
          <label>
            <span>색 채우기</span>
            <div className="tj-fill-grid">
              <button
                type="button"
                className={'tj-fill-opt' + ((config.colorFill || 'band') === 'band' ? ' active' : '')}
                onClick={() => setColorFill('band')}
              >
                <span className="tj-fill-demo">
                  <span className="tj-fill-band" style={{ background: sampleColor }} />A
                </span>
              </button>
              <button
                type="button"
                className={'tj-fill-opt' + (config.colorFill === 'full' ? ' active' : '')}
                onClick={() => setColorFill('full')}
              >
                <span className="tj-fill-demo" style={{ background: sampleColor, color: textColorOn(sampleColor) }}>A</span>
              </button>
            </div>
          </label>
        )}

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
                      ? (b.repeat
                          ? { backgroundImage: `url(${b.image})`, backgroundSize: '42%', backgroundRepeat: 'repeat', backgroundColor: '#fff' }
                          : { backgroundImage: `url(${b.image})`, backgroundSize: 'cover', backgroundPosition: 'center' })
                      : { background: b.css, backgroundSize: b.tile ? Math.round(b.tile * 0.28) + 'px' : undefined }}
                  />
                  <span className="tj-bg-label">{b.label}</span>
                </button>
                {/* 기본(첫 배경) 다음: 사진 → 컬러 선택 */}
                {idx === 0 && (
                  <>
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
                    <button
                      type="button"
                      className={'tj-bg-item' + (config.bg === 'colorpick' ? ' active' : '')}
                      onClick={() => setColorPickOpen(true)}
                    >
                      <span
                        className="tj-bg-swatch"
                        style={config.bgColor
                          ? { background: config.bgColor }
                          : { background: 'conic-gradient(from 0deg, #ff8a8a, #ffd28a, #f3f08a, #8af0a0, #8ad9ef, #8a9cef, #d98aef, #ff8a8a)' }}
                      />
                      <span className="tj-bg-label">컬러</span>
                    </button>
                  </>
                )}
              </Fragment>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </label>
        </div>

        {user && (
          <div style={{ borderTop: '0.5px solid #e5e5e5', paddingTop: '12px', marginTop: '4px' }}>
            <div style={{ fontSize: '11px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ☁ {user.email} · 동기화 중
            </div>
          </div>
        )}

        <div style={{ borderTop: '0.5px solid #e5e5e5', paddingTop: '12px', marginTop: '4px' }}>
          <div style={{ fontSize: '10px', color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
            글꼴 제공: Google Fonts (SIL Open Font License)
          </div>
          <div style={{ fontSize: '10px', color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
            ✨ 배경은 수시로 업데이트됩니다.
          </div>
        </div>

        <div className="tj-modal-actions">
          {onApplyToAll && (
            <button type="button" onClick={onApplyToAll} title="글씨체·글씨 크기·무드·색 채우기·배경을 모든 시간표에 동일하게 맞춰요 (요일·시간은 안 바뀜)">🎨 모든 시간표를 이와 같이 꾸밈</button>
          )}
          <button className="primary" onClick={handleClose}>{t('done')}</button>
        </div>
      </div>
    </div>

    {colorPickOpen && (
      <div className="tj-modal-bg" style={{ zIndex: 250 }} onClick={() => setColorPickOpen(false)}>
        <div className="tj-modal" style={{ width: '300px' }} onClick={(e) => e.stopPropagation()}>
          <div className="tj-modal-head">
            <h3>배경 색</h3>
            <button className="tj-modal-x" onClick={() => setColorPickOpen(false)} aria-label="닫기">×</button>
          </div>
          {/* 색을 톡 누르면 바로 적용 */}
          <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>원하는 색을 누르면 바로 적용돼요.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
            {PRESET_BG_COLORS.map(c => {
              const sel = (config.bg === 'colorpick') && (config.bgColor || '').toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={'배경색 ' + c}
                  onClick={() => { onConfigChange({ ...config, bg: 'colorpick', bgColor: c }); setColorPickOpen(false); }}
                  style={{
                    height: '32px', background: c, borderRadius: '7px', cursor: 'pointer',
                    border: sel ? '2px solid #222' : '1px solid #e0e0e0',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    )}
    </>
  );
}