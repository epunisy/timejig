import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { t } from '../i18n';
import { getAccents } from '../App';

const ALL_DAYS = ['월','화','수','목','금','토','일'];

function pad(n) { return String(n).padStart(2, '0'); }

export default function Export({ data, onBack }) {
  const [selection, setSelection] = useState([data.activeTT]);
  const [phone, setPhone] = useState('auto');
  const [showMore, setShowMore] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const captureRef = useRef(null);
  
  const days = data.config.weekRange === 'mon-fri' ? ALL_DAYS.slice(0, 5) : ALL_DAYS;
  const totalMin = (data.config.endHour - data.config.startHour) * 60;
  const accents = getAccents(data.config.accent);
  
  function fmtTime(min) {
    const h = data.config.startHour + Math.floor(min / 60);
    const m = min % 60;
    return pad(h) + ':' + pad(m);
  }
  
  function togglePick(id) {
    if (selection.includes(id)) {
      setSelection(selection.filter(x => x !== id));
    } else {
      setSelection([...selection, id]);
    }
  }
  
  function getRatio() {
    if (phone === '9-19.5') return 19.5;
    if (phone === '9-20.5') return 20.5;
    if (phone === '9-16') return 16;
    if (phone === '9-21.6') return 21.6;
    return 19.5;
  }
  
  const selectedTTs = selection.map(id => 
    data.timetables.find(t => t.id === id)
  ).filter(Boolean);
  
  const showTimeNow = showTime && selectedTTs.length === 1;
  
  async function handleDownload() {
    if (selection.length === 0 || downloading) return;
    setDownloading(true);
    try {
      const node = captureRef.current;
      const canvas = await html2canvas(node, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      const name = selectedTTs.map(tt => tt.name).join('_');
      link.download = `시간퍼즐_${name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('이미지 저장 중 문제가 생겼어요. 다시 시도해 주세요.');
    } finally {
      setDownloading(false);
    }
  }
  
  // 미리보기 폰 크기
  const W = 200;
  const H = W * getRatio() / 9;
  // 캡쳐용 실제 크기 (가로 1080 기준)
  const CAP_W = 1080;
  const CAP_H = Math.round(CAP_W * getRatio() / 9);
  
  // 미리보기/캡쳐 공통 — 시간표 콜라주 렌더
  function renderSchedules(scale) {
    return selectedTTs.map(tt => (
      <div key={tt.id} className="tj-mini-wrap">
        <div className="tj-mini-label" style={{ fontSize: (10 * scale) + 'px', paddingLeft: (2 * scale) + 'px' }}>
          {tt.name}
        </div>
        <div className="tj-mini-schedule">
          <div 
            className="tj-mini-grid"
            style={{ 
              gridTemplateRows: 'auto 1fr', 
              gridTemplateColumns: `repeat(${days.length}, 1fr)` 
            }}
          >
            {days.map(d => (
              <div key={d} className="tj-mini-day-head" style={{ fontSize: (7 * scale) + 'px', padding: (2 * scale) + 'px 0' }}>{d}</div>
            ))}
            {days.map(d => (
              <div key={d} className="tj-mini-col">
                {tt.blocks.filter(b => b.day === d).map(b => {
                  const subj = data.subjects.find(s => s.id === b.subjectId);
                  if (!subj) return null;
                  const topPct = (b.start / totalMin) * 100;
                  const heightPct = ((b.end - b.start) / totalMin) * 100;
                  const style = { top: topPct + '%', height: heightPct + '%' };
                  let className = 'tj-mini-block';
                  if (accents) {
                    style.borderLeftColor = accents[subj.colorIndex % accents.length];
                    className += ' with-accent';
                  }
                  return (
                    <div key={b.id} className={className} style={style}>
                      <span className="tj-mini-nm" style={{ fontSize: (6 * scale) + 'px' }}>{subj.name}</span>
                      {showTimeNow && (
                        <span className="tj-mini-tm" style={{ fontSize: (5 * scale) + 'px' }}>
                          {fmtTime(b.start)}~{fmtTime(b.end)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    ));
  }
  
  return (
    <div className="tj-app">
      <div className="tj-topbar" style={{ position: 'relative', justifyContent: 'flex-start' }}>
        <button className="tj-icon-btn" onClick={onBack}>{t('backButton')}</button>
        <div style={{ 
          position: 'absolute', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          fontSize: '14px', 
          fontWeight: 500 
        }}>{t('backgroundTitle')}</div>
      </div>
      
      <div className="tj-export">
        <div className="tj-export-controls">
          
          <div className="tj-export-section">
            <h4>{t('section1')}</h4>
            <div className="tj-radio-row">
              {data.timetables.map(tt => {
                const sel = selection.includes(tt.id);
                return (
                  <div
                    key={tt.id}
                    className={'tj-radio-item tj-pick' + (sel ? ' sel' : '')}
                    onClick={() => togglePick(tt.id)}
                  >
                    <div className="tj-radio-circle"></div>
                    <span>{tt.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="tj-export-section">
            <h4>{t('section2')}</h4>
            <div className="tj-radio-row">
              <div
                className={'tj-radio-item' + (phone === 'auto' ? ' sel' : '')}
                onClick={() => setPhone('auto')}
              >
                <div className="tj-radio-circle"></div>
                <span>{t('autoFit')}</span>
                <span className="tj-radio-sub">{t('recommended')}</span>
              </div>
              {showMore ? (
                <>
                  <div
                    className={'tj-radio-item' + (phone === '9-19.5' ? ' sel' : '')}
                    onClick={() => setPhone('9-19.5')}
                  >
                    <div className="tj-radio-circle"></div>
                    <span>{t('normalPhone')}</span>
                    <span className="tj-radio-sub">9:19.5</span>
                  </div>
                  <div
                    className={'tj-radio-item' + (phone === '9-20.5' ? ' sel' : '')}
                    onClick={() => setPhone('9-20.5')}
                  >
                    <div className="tj-radio-circle"></div>
                    <span>{t('longPhone')}</span>
                    <span className="tj-radio-sub">9:20.5</span>
                  </div>
                  <div
                    className={'tj-radio-item' + (phone === '9-16' ? ' sel' : '')}
                    onClick={() => setPhone('9-16')}
                  >
                    <div className="tj-radio-circle"></div>
                    <span>{t('squarePhone')}</span>
                    <span className="tj-radio-sub">9:16</span>
                  </div>
                  <div
                    className={'tj-radio-item' + (phone === '9-21.6' ? ' sel' : '')}
                    onClick={() => setPhone('9-21.6')}
                  >
                    <div className="tj-radio-circle"></div>
                    <span>{t('foldPhone')}</span>
                    <span className="tj-radio-sub">9:21.6</span>
                  </div>
                </>
              ) : (
                <button className="tj-expand" onClick={() => setShowMore(true)}>
                  {t('showMorePhones')}
                </button>
              )}
            </div>
          </div>
          
          <div className="tj-export-section">
            <h4>{t('section3')}</h4>
            <div className="tj-radio-row">
              <div
                className={'tj-radio-item' + (!showTime ? ' sel' : '')}
                onClick={() => setShowTime(false)}
              >
                <div className="tj-radio-circle"></div>
                <span>{t('subjectOnly')}</span>
              </div>
              <div
                className={'tj-radio-item' + (showTime ? ' sel' : '')}
                onClick={() => setShowTime(true)}
              >
                <div className="tj-radio-circle"></div>
                <span>{t('subjectWithTime')}</span>
              </div>
            </div>
            {showTime && selectedTTs.length > 1 && (
              <div style={{ fontSize: '10px', color: '#888', marginTop: '5px', lineHeight: 1.4 }}>
                시간표를 2개 이상 선택하면 공간이 좁아<br />과목명만 표시돼요.
              </div>
            )}
          </div>
          
          <button
            className="tj-setup-cta"
            onClick={handleDownload}
            disabled={selection.length === 0 || downloading}
            style={(selection.length === 0 || downloading) ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {downloading ? '이미지 만드는 중…' : t('downloadPNG')}
          </button>
          <div style={{ fontSize: '10px', color: '#888', textAlign: 'center', marginTop: '-8px' }}>
            {selection.length === 0 ? t('selectAtLeastOne') : t('selectedCount', selection.length)}
          </div>
        </div>
        
        <div className="tj-phone-preview">
          <div className="tj-phone-frame">
            <div className="tj-phone-screen" style={{ width: W + 'px', height: H + 'px' }}>
              <div className="tj-phone-notch"></div>
              <div className="tj-phone-time">9:41</div>
              <div className="tj-phone-date">10월 14일 화요일</div>
              <div className="tj-phone-content">
                {selectedTTs.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888',
                    fontSize: '10px',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}>
                    왼쪽에서<br />시간표를 선택하면<br />여기 미리보기가 떠요
                  </div>
                ) : (
                  renderSchedules(1)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 캡쳐용 고해상도 화면 — 화면 밖에 숨김 */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }}>
        <div 
          ref={captureRef}
          style={{ 
            width: CAP_W + 'px', 
            height: CAP_H + 'px', 
            background: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: (CAP_H * 0.30) + 'px',
            left: (CAP_W * 0.06) + 'px',
            right: (CAP_W * 0.06) + 'px',
            bottom: (CAP_H * 0.08) + 'px',
            display: 'flex',
            flexDirection: 'column',
            gap: (CAP_W * 0.05) + 'px',
          }}>
            {renderSchedules(8)}
          </div>
        </div>
      </div>
    </div>
  );
}