import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { t } from '../i18n';
import { getFontFamily, getFontScale, resolveBackground, bgStyle, getSubjectColor, textColorOn, getWeekDays, getDayLabels } from '../App';

function pad(n) { return String(n).padStart(2, '0'); }

export default function Export({ data, onBack }) {
  const [selection, setSelection] = useState([data.activeTT]);
  const [phone, setPhone] = useState('auto');
  const [showMore, setShowMore] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [fillTop, setFillTop] = useState(false); // 상단 시계 공간을 시간표로 채울지
  const [downloading, setDownloading] = useState(false);
  const [formatBasis, setFormatBasis] = useState(data.activeTT);
  const captureRef = useRef(null);

  // 서식 기준 — 콜라주에서 '글꼴·배경'만 이 시간표 기준으로 통일 (시간대·요일·색은 각 시간표 그대로).
  const formatTTId = selection.includes(formatBasis) ? formatBasis : (selection[0] ?? data.activeTT);
  const fmtConfig = (data.timetables.find(t => t.id === formatTTId)?.config) || data.config;

  // 배경은 화면 전체에 적용 → 서식 기준 시간표의 배경으로 통일
  const bgTheme = resolveBackground(fmtConfig);

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
  
  const showTimeNow = showTime;
  
  async function handleDownload() {
    if (selection.length === 0 || downloading) return;
    setDownloading(true);
    try {
      const node = captureRef.current;
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement('a');
      const name = selectedTTs.map(tt => tt.name).join('_');
      const d = new Date();
      const yymmdd = String(d.getFullYear()).slice(2)
        + String(d.getMonth() + 1).padStart(2, '0')
        + String(d.getDate()).padStart(2, '0');
      link.download = `${name}_${yymmdd}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('이미지 저장 중 문제가 생겼어요. 다시 시도해 주세요.');
    } finally {
      setDownloading(false);
    }
  }
  
  // 콘텐츠 영역 비율 (좌우 6%, 하단 8% 고정)
  // 상단: 시계 공간 비우면 30%, 시간표로 채우면 6%
  const TOP_RATIO = fillTop ? 0.06 : 0.30;
  const SIDE_RATIO = 0.06;
  const BOTTOM_RATIO = 0.08;

  // 미리보기 폰 크기
  const W = 200;
  const H = W * getRatio() / 9;
  // 미리보기 콘텐츠 영역 (캡쳐와 동일 비율)
  const PREV_TOP = Math.round(H * TOP_RATIO);
  const PREV_SIDE = Math.round(W * SIDE_RATIO);
  const PREV_BOTTOM = Math.round(H * BOTTOM_RATIO);
  const PREV_W = W - PREV_SIDE * 2;
  const PREV_H = H - PREV_TOP - PREV_BOTTOM;
  // 캡쳐용 실제 크기 (가로 1080 기준)
  const CAP_W = 1080;
  const CAP_H = Math.round(CAP_W * getRatio() / 9);
  const CAP_PAD_X = Math.round(CAP_W * SIDE_RATIO);
  const CAP_TOP = Math.round(CAP_H * TOP_RATIO);
  const CAP_CONTENT_W = CAP_W - CAP_PAD_X * 2;
  const CAP_CONTENT_H = Math.round(CAP_H * (1 - TOP_RATIO - BOTTOM_RATIO));

  // 미리보기/캡쳐 공통 — 시간표 콜라주를 "픽셀 기반"으로 렌더.
  // (html2canvas가 grid 1fr·% 높이·0.5px 테두리를 제대로 못 그려서
  //  전부 명시적 px + 1px 테두리로 계산 → 미리보기와 PNG가 동일하게 나옴)
  function renderSchedules(boxW, boxH) {
    const n = selectedTTs.length || 1;
    const gap = Math.round(boxH * 0.03);

    // 1개면 화면을 가능한 한 채우고, 여러 개(콜라주)면 너무 길어지지 않게 높이 제한
    const rawWrapH = (boxH - gap * (n - 1)) / n;
    const maxWrapH = Math.round(boxW * 1.05);
    const wrapH = n === 1 ? rawWrapH : Math.min(rawWrapH, maxWrapH);
    const usedH = wrapH * n + gap * (n - 1);
    const offsetTop = Math.max(0, Math.round((boxH - usedH) / 2));

    // 글꼴만 통일 (서식 기준 시간표 기준)
    const fontFamily = getFontFamily(fmtConfig.font);

    return (
      <div style={{ width: boxW + 'px', height: boxH + 'px', boxSizing: 'border-box', paddingTop: offsetTop + 'px', ...(fontFamily ? { fontFamily } : {}) }}>
        {selectedTTs.map((tt, wi) => {
          // 각 시간표는 자기 서식(시간대·요일·색·색채우기)을 그대로 사용
          const cfg = tt.config || data.config;
          const ttDays = getWeekDays(cfg);
          const ttDayLabels = getDayLabels(cfg);
          const startHour = cfg.startHour;
          const endHour = cfg.endHour;
          const hourCount = endHour - startHour;
          const ttTotalMin = hourCount * 60;
          const hours = [];
          for (let h = startHour; h <= endHour; h++) hours.push(h);
          const fullFill = (cfg.colorFill || 'band') === 'full';
          const fmtT = (min) => { const h = startHour + Math.floor(min / 60); const m = min % 60; return pad(h) + ':' + pad(m); };

          const timeColW = Math.max(10, Math.round(boxW * 0.08));
          const colW = (boxW - timeColW) / ttDays.length;
          const font = Math.max(7, Math.round(colW * 0.18));
          const labelFont = font;
          const labelH = Math.round(labelFont * 1.6);
          const headFont = font;
          const headH = Math.max(Math.round(headFont * 1.8), timeColW);
          const blockFont = Math.max(6, Math.round(font * getFontScale(cfg.fontScale)));
          const timeFont = Math.max(5, Math.round(font * 0.85));
          const timeLabelH = Math.round(timeFont * 1.2);
          const accentW = Math.max(3, Math.round(colW * 0.06));
          const schedH = Math.max(0, wrapH - labelH);
          const bodyH = Math.max(0, schedH - headH);

          return (
            <div key={tt.id} style={{ height: wrapH + 'px', marginBottom: (wi < n - 1 ? gap : 0) + 'px' }}>
              {/* 시간표 이름 — 배경 밝기에 따라 글씨색 자동, 사진 위에선 외곽 그림자로 가독성 */}
              <div style={{
                height: labelH + 'px', lineHeight: labelH + 'px',
                fontSize: labelFont + 'px', fontWeight: 500, color: bgTheme.text,
                textShadow: bgTheme.image ? bgTheme.shadow : undefined,
                paddingLeft: '2px', overflow: 'hidden', whiteSpace: 'nowrap',
              }}>{tt.name}</div>

              <div style={{
                height: schedH + 'px', boxSizing: 'border-box',
                border: '2px solid #a8a8a8', background: '#fff', overflow: 'hidden',
              }}>
                {/* 헤더 — 시간축 코너 + 요일 (찐그레이 글자 + 연그레이 바탕) */}
                <div style={{ display: 'flex', height: headH + 'px' }}>
                  <div style={{
                    width: timeColW + 'px', boxSizing: 'border-box',
                    background: '#ececec', borderRight: '2px solid #a8a8a8',
                  }}></div>
                  {ttDays.map((d, i) => (
                    <div key={d} style={{
                      width: colW + 'px', boxSizing: 'border-box',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: headFont + 'px', fontWeight: 600, color: '#444',
                      background: '#ececec',
                      borderRight: i < ttDays.length - 1 ? '2px solid #a8a8a8' : 'none',
                      borderBottom: '2px solid #a8a8a8',
                    }}>{ttDayLabels[i]}</div>
                  ))}
                </div>
                {/* 본문 — 시간축 + 요일별 컬럼 + 블록 */}
                <div style={{ display: 'flex', height: bodyH + 'px' }}>
                  {/* 왼쪽 시간축 (요일과 동일한 연그레이 바탕) */}
                  <div style={{
                    width: timeColW + 'px', boxSizing: 'border-box', position: 'relative',
                    background: '#ececec', borderRight: '2px solid #a8a8a8',
                  }}>
                    {hours.map((h, i) => {
                      let topPx = (i / hourCount) * bodyH;
                      if (i === hourCount) topPx = bodyH - timeLabelH;
                      return (
                        <div key={h} style={{
                          position: 'absolute', left: 0, right: 0, top: topPx + 'px',
                          height: timeLabelH + 'px', lineHeight: timeLabelH + 'px',
                          textAlign: 'center', fontSize: timeFont + 'px', color: '#444',
                        }}>{pad(h)}</div>
                      );
                    })}
                  </div>
                  {ttDays.map((d, i) => (
                    <div key={d} style={{
                      width: colW + 'px', boxSizing: 'border-box', position: 'relative',
                      borderRight: i < ttDays.length - 1 ? '2px solid #a8a8a8' : 'none',
                    }}>
                      {/* 시간 눈금선 */}
                      {hours.slice(1, hourCount).map((h, j) => (
                        <div key={'l' + h} style={{
                          position: 'absolute', left: 0, right: 0,
                          top: (((j + 1) / hourCount) * bodyH) + 'px',
                          height: '2px', background: '#a8a8a8',
                        }}></div>
                      ))}
                      {tt.blocks.filter(b => b.day === d).map(b => {
                        const subj = data.subjects.find(s => s.id === b.subjectId);
                        if (!subj) return null;
                        const top = (b.start / ttTotalMin) * bodyH;
                        const h = ((b.end - b.start) / ttTotalMin) * bodyH;
                        const col = getSubjectColor(cfg, subj);
                        const blkStyle = {
                          position: 'absolute', left: 0, right: 0,
                          top: top + 'px', height: h + 'px',
                          boxSizing: 'border-box',
                          background: '#fff', border: '2px solid #a8a8a8',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden', padding: '0 1px',
                        };
                        let txtColor = '#444';
                        let bandCol = null;
                        if (col) {
                          if (fullFill) {
                            blkStyle.background = col;
                            blkStyle.border = '2px solid rgba(0,0,0,0.18)';
                            txtColor = textColorOn(col);
                          } else {
                            bandCol = col; // 1px 좌측 선은 유지하고 안쪽에 색띠
                            blkStyle.paddingLeft = (accentW + 2) + 'px';
                          }
                        }
                        return (
                          <div key={b.id} style={blkStyle}>
                            {bandCol && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: accentW + 'px', background: bandCol }} />}
                            {/* 과목명 */}
                            <span style={{
                              fontSize: blockFont + 'px', fontWeight: 400, color: txtColor,
                              lineHeight: 1.15, textAlign: 'center',
                              maxWidth: '100%', overflow: 'hidden',
                              wordBreak: 'keep-all', overflowWrap: 'break-word',
                            }}>{subj.name}</span>
                            {showTimeNow && (
                              <span style={{
                                fontSize: Math.max(4, Math.round(font * 0.8)) + 'px',
                                color: txtColor, lineHeight: 1.2, marginTop: '1px',
                                textAlign: 'center', whiteSpace: 'normal',
                                overflowWrap: 'break-word', maxWidth: '100%',
                              }}>{fmtT(b.start)}~<wbr />{fmtT(b.end)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="tj-app">
      <div className="tj-topbar" style={{ position: 'relative', justifyContent: 'flex-end', border: 'none', background: 'transparent' }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '14px',
          fontWeight: 500
        }}>{t('backgroundTitle')}</div>
        <button className="tj-modal-x" onClick={onBack} aria-label="닫기">×</button>
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
          
          {selection.length > 1 && (
            <div className="tj-export-section">
              <h4>서식 기준</h4>
              <div className="tj-radio-row">
                {selectedTTs.map(tt => (
                  <div
                    key={tt.id}
                    className={'tj-radio-item' + (formatTTId === tt.id ? ' sel' : '')}
                    onClick={() => setFormatBasis(tt.id)}
                  >
                    <div className="tj-radio-circle"></div>
                    <span>{tt.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', lineHeight: 1.4 }}>
                선택한 시간표들의 글꼴·배경만 이 시간표 기준으로 통일해요.<br />시간대·요일·색은 각 시간표 그대로예요.
              </div>
            </div>
          )}

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

          <div className="tj-export-section">
            <h4>{t('section4')}</h4>
            <div className="tj-radio-row">
              <div
                className={'tj-radio-item' + (!fillTop ? ' sel' : '')}
                onClick={() => setFillTop(false)}
              >
                <div className="tj-radio-circle"></div>
                <span>{t('clockKeep')}</span>
              </div>
              <div
                className={'tj-radio-item' + (fillTop ? ' sel' : '')}
                onClick={() => setFillTop(true)}
              >
                <div className="tj-radio-circle"></div>
                <span>{t('clockFill')}</span>
              </div>
            </div>
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
            <div className="tj-phone-screen" style={{ width: W + 'px', height: H + 'px', ...bgStyle(bgTheme) }}>
              <div className="tj-phone-notch"></div>
              {!fillTop && <div className="tj-phone-time" style={{ color: bgTheme.text, textShadow: bgTheme.image ? bgTheme.shadow : undefined }}>9:41</div>}
              {!fillTop && <div className="tj-phone-date" style={{ color: bgTheme.text, opacity: 0.85, textShadow: bgTheme.image ? bgTheme.shadow : undefined }}>10월 14일 화요일</div>}
              <div
                className="tj-phone-content"
                style={{ top: PREV_TOP + 'px', left: PREV_SIDE + 'px', right: PREV_SIDE + 'px', bottom: PREV_BOTTOM + 'px' }}
              >
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
          <div style={{ fontSize: '10px', color: '#888', textAlign: 'center', marginTop: '8px', lineHeight: 1.4 }}>
            미리보기는 실제 이미지와 다를 수 있습니다.
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
            ...bgStyle(bgTheme),
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