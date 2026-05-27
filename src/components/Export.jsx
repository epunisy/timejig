import { useState } from 'react';
import { t } from '../i18n';
import { getAccents } from '../App';

const ALL_DAYS = ['월','화','수','목','금','토','일'];

function pad(n) { return String(n).padStart(2, '0'); }

export default function Export({ data, onBack }) {
  const [selection, setSelection] = useState([data.activeTT]);
  const [phone, setPhone] = useState('auto');
  const [showMore, setShowMore] = useState(false);
  const [showTime, setShowTime] = useState(false);
  
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
  
  function handleDownload() {
    if (selection.length === 0) return;
    alert(`실제 앱에선 여기서 PNG가 다운로드돼요!\n선택된 시간표 ${selection.length}개\n비율: ${phone}`);
  }
  
  const W = 200;
  const H = W * getRatio() / 9;
  
  const selectedTTs = selection.map(id => 
    data.timetables.find(t => t.id === id)
  ).filter(Boolean);
  
  return (
    <div className="tj-app">
      <div className="tj-topbar">
        <button className="tj-icon-btn" onClick={onBack}>{t('backButton')}</button>
        <div style={{ fontSize: '14px', fontWeight: 500 }}>{t('backgroundTitle')}</div>
        <div></div>
      </div>
      
      <div className="tj-export">
        <div className="tj-export-controls">
          
          <div className="tj-export-section">
            <h4>{t('section1')}</h4>
            <div className="tj-checklist">
              {data.timetables.map(tt => {
                const sel = selection.includes(tt.id);
                return (
                  <div
                    key={tt.id}
                    className={'tj-check-item' + (sel ? ' sel' : '')}
                    onClick={() => togglePick(tt.id)}
                  >
                    <div className="tj-check-box">{sel ? '✓' : ''}</div>
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
          </div>
          
          <button
            className="tj-setup-cta"
            onClick={handleDownload}
            disabled={selection.length === 0}
            style={selection.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {t('downloadPNG')}
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
                  selectedTTs.map(tt => (
                    <div key={tt.id} className="tj-mini-wrap">
                      <div className="tj-mini-label">{tt.name}</div>
                      <div className="tj-mini-schedule">
                        <div 
                          className="tj-mini-grid"
                          style={{ 
                            gridTemplateRows: 'auto 1fr', 
                            gridTemplateColumns: `repeat(${days.length}, 1fr)` 
                          }}
                        >
                          {days.map(d => (
                            <div key={d} className="tj-mini-day-head">{d}</div>
                          ))}
                          {days.map(d => (
                            <div key={d} className="tj-mini-col">
                              {tt.blocks.filter(b => b.day === d).map(b => {
                                const subj = data.subjects.find(s => s.id === b.subjectId);
                                if (!subj) return null;
                                const topPct = (b.start / totalMin) * 100;
                                const heightPct = ((b.end - b.start) / totalMin) * 100;
                                const style = { 
                                  top: topPct + '%', 
                                  height: heightPct + '%',
                                  padding: '1px 0',
                                  lineHeight: 1.05,
                                };
                                let className = 'tj-mini-block';
                                if (accents) {
                                  style.borderLeftColor = accents[subj.colorIndex % accents.length];
                                  className += ' with-accent';
                                }
                                return (
                                  <div key={b.id} className={className} style={style}>
                                    <div style={{ 
                                      fontSize: '6px', 
                                      fontWeight: 500,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      width: '100%',
                                      textAlign: 'center',
                                    }}>{subj.name}</div>
                                    {showTime && (
                                      <div style={{ 
                                        fontSize: '5px', 
                                        opacity: 0.6,
                                        whiteSpace: 'nowrap',
                                        marginTop: '1px',
                                        textAlign: 'center',
                                      }}>
                                        {fmtTime(b.start)}–{fmtTime(b.end)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}