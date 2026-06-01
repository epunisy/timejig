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
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      const name = selectedTTs.map(tt => tt.name).join('_');
      link.download = `타임지그_${name}.png`;
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
  // 미리보기 콘텐츠 영역 (.tj-phone-content: 상120 하30 좌우12)
  const PREV_W = W - 24;
  const PREV_H = H - 150;
  // 캡쳐용 실제 크기 (가로 1080 기준)
  const CAP_W = 1080;
  const CAP_H = Math.round(CAP_W * getRatio() / 9);
  // 캡쳐 콘텐츠 영역 (상30% 하8% 좌우6%)
  const CAP_PAD_X = Math.round(CAP_W * 0.06);
  const CAP_TOP = Math.round(CAP_H * 0.30);
  const CAP_CONTENT_W = CAP_W - CAP_PAD_X * 2;
  const CAP_CONTENT_H = Math.round(CAP_H * 0.62);

  // 미리보기/캡쳐 공통 — 시간표 콜라주를 "픽셀 기반"으로 렌더.
  // (html2canvas가 grid 1fr·% 높이·0.5px 테두리를 제대로 못 그려서
  //  전부 명시적 px + 1px 테두리로 계산 → 미리보기와 PNG가 동일하게 나옴)
  function renderSchedules(boxW, boxH) {
    const n = selectedTTs.length || 1;
    const colW = boxW / days.length;
    const gap = Math.round(boxH * 0.03);
    const wrapH = (boxH - gap * (n - 1)) / n;

    // 요일·과목명·시간표 이름 모두 동일한 폰트 크기 (요일 글자 기준)
    const font = Math.max(6, Math.round(colW * 0.16));
    const labelFont = font;
    const labelH = Math.round(labelFont * 1.6);
    const headFont = font;
    const headH = Math.round(headFont * 1.8);
    const blockFont = font;
    const accentW = Math.max(2, Math.round(colW * 0.03));
    const schedH = Math.max(0, wrapH - labelH);
    const bodyH = Math.max(0, schedH - headH);

    return (
      <div style={{ width: boxW + 'px', height: boxH + 'px' }}>
        {selectedTTs.map((tt, wi) => (
          <div key={tt.id} style={{ marginBottom: (wi < n - 1 ? gap : 0) + 'px' }}>
            {/* 시간표 이름 — 찐그레이, 과목명과 동일 크기 */}
            <div style={{
              height: labelH + 'px', lineHeight: labelH + 'px',
              fontSize: labelFont + 'px', fontWeight: 500, color: '#444',
              paddingLeft: '2px', overflow: 'hidden', whiteSpace: 'nowrap',
            }}>{tt.name}</div>

            <div style={{
              height: schedH + 'px', boxSizing: 'border-box',
              border: '1px solid #ddd', background: '#fff', overflow: 'hidden',
            }}>
              {/* 요일 헤더 — 찐그레이 글자 + 연그레이 바탕 */}
              <div style={{ display: 'flex', height: headH + 'px' }}>
                {days.map((d, i) => (
                  <div key={d} style={{
                    width: colW + 'px', boxSizing: 'border-box',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: headFont + 'px', fontWeight: 600, color: '#444',
                    background: '#ececec',
                    borderRight: i < days.length - 1 ? '1px solid #fff' : 'none',
                  }}>{d}</div>
                ))}
              </div>
              {/* 본문 — 요일별 컬럼 + 블록 */}
              <div style={{ display: 'flex', height: bodyH + 'px' }}>
                {days.map((d, i) => (
                  <div key={d} style={{
                    width: colW + 'px', boxSizing: 'border-box', position: 'relative',
                    borderRight: i < days.length - 1 ? '1px solid #ececec' : 'none',
                  }}>
                    {tt.blocks.filter(b => b.day === d).map(b => {
                      const subj = data.subjects.find(s => s.id === b.subjectId);
                      if (!subj) return null;
                      const top = (b.start / totalMin) * bodyH;
                      const h = ((b.end - b.start) / totalMin) * bodyH;
                      const blkStyle = {
                        position: 'absolute', left: 0, right: 0,
                        top: top + 'px', height: h + 'px',
                        boxSizing: 'border-box',
                        background: '#fff', border: '1px solid #bbb',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden', padding: '0 1px',
                      };
                      if (accents) {
                        blkStyle.borderLeft = accentW + 'px solid ' + accents[subj.colorIndex % accents.length];
                      }
                      return (
                        <div key={b.id} style={blkStyle}>
                          {/* 과목명 — 찐그레이 */}
                          <span style={{
                            fontSize: blockFont + 'px', fontWeight: 400, color: '#444',
                            lineHeight: 1.1, textAlign: 'center',
                            maxWidth: '100%', overflow: 'hidden',
                          }}>{subj.name}</span>
                          {showTimeNow && (
                            <span style={{
                              fontSize: Math.max(4, Math.round(blockFont * 0.8)) + 'px',
                              color: '#444', background: '#ececec', borderRadius: '2px',
                              padding: '0 2px', lineHeight: 1.3, whiteSpace: 'nowrap', marginTop: '1px',
                            }}>{fmtTime(b.start)}~{fmtTime(b.end)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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
                  renderSchedules(PREV_W, PREV_H)
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
            top: CAP_TOP + 'px',
            left: CAP_PAD_X + 'px',
            width: CAP_CONTENT_W + 'px',
            height: CAP_CONTENT_H + 'px',
          }}>
            {renderSchedules(CAP_CONTENT_W, CAP_CONTENT_H)}
          </div>
        </div>
      </div>
    </div>
  );
}