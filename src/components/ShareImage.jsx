import { forwardRef } from 'react';
import { getFontFamily, getFontScale, getSubjectColor, textColorOn, getWeekDays, getDayLabels } from '../App';

function pad(n) { return String(n).padStart(2, '0'); }

// 단일 시간표를 "이미지 공유"용으로 픽셀 기반 렌더 (html2canvas 호환).
// 화면 밖에 숨겨 두고 ref로 캡쳐한다.
// 공유 이미지에서는 배경 서식을 빼고 깔끔한 흰 배경 + 또렷한 격자선 + 앱 홍보 푸터를 넣는다.
const ShareImage = forwardRef(function ShareImage({ data, tt }, ref) {
  if (!tt) return <div ref={ref} />;
  const cfg = tt.config || data.config;
  const days = getWeekDays(cfg);
  const dayLabels = getDayLabels(cfg);
  const startHour = cfg.startHour;
  const endHour = cfg.endHour;
  const hourCount = Math.max(1, endHour - startHour);
  const totalMin = hourCount * 60;
  const fullFill = (cfg.colorFill || 'band') === 'full';
  const fontFamily = getFontFamily(cfg.font);

  // 격자선 — 이미지화하면 얇은 선이 안 보여서 진하고 두껍게.
  // 가로·세로·외곽선·블록 테두리 모두 같은 두께(LINE_W)/색(LINE)으로 통일한다.
  const LINE = '#a8a8a8';
  const LINE_W = 2;

  const hours = [];
  for (let h = startHour; h <= endHour; h++) hours.push(h);

  // 캡쳐 크기 (가로 1080 고정), 좌우/상하 5% 여백
  const CAP_W = 1080;
  const PAD = Math.round(CAP_W * 0.05);
  const contentW = CAP_W - PAD * 2;

  const timeColW = Math.max(28, Math.round(contentW * 0.08));
  const colW = (contentW - timeColW) / days.length;
  const font = Math.max(11, Math.round(colW * 0.18));
  const labelFont = Math.round(font * 1.15);
  const labelH = Math.round(labelFont * 1.6);
  const headFont = font;
  const headH = Math.max(Math.round(headFont * 1.9), timeColW);
  const rowH = Math.round(colW * 0.55);
  const bodyH = hourCount * rowH;
  const schedH = headH + bodyH;
  const blockFont = Math.max(10, Math.round(font * getFontScale(cfg.fontScale)));
  const timeFont = Math.max(8, Math.round(font * 0.78));
  const timeLabelH = Math.round(timeFont * 1.2);
  const accentW = Math.max(4, Math.round(colW * 0.06));

  // 앱 홍보 푸터 (브랜드 / 태그라인 / Google Play 검색 안내 — 3줄)
  const footGap = Math.round(PAD * 0.5);
  const footH = Math.round(labelFont * 3.8);
  const logoH = Math.round(labelFont * 1.5);
  const taglineFont = Math.round(font * 0.92);
  const storeFont = Math.round(font * 0.78);

  const CAP_H = PAD * 2 + labelH + schedH + footGap + footH;

  return (
    <div
      ref={ref}
      style={{
        width: CAP_W + 'px',
        height: CAP_H + 'px',
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...(fontFamily ? { fontFamily } : {}),
      }}
    >
      <div style={{ position: 'absolute', top: PAD + 'px', left: PAD + 'px', width: contentW + 'px' }}>
        {/* 시간표 이름 */}
        <div style={{
          height: labelH + 'px', lineHeight: labelH + 'px',
          fontSize: labelFont + 'px', fontWeight: 500, color: '#333',
          paddingLeft: '3px', overflow: 'hidden', whiteSpace: 'nowrap',
        }}>{tt.name}</div>

        <div style={{
          height: schedH + 'px', boxSizing: 'border-box',
          border: LINE_W + 'px solid ' + LINE, background: '#fff', overflow: 'hidden',
        }}>
          {/* 헤더 — 시간축 코너 + 요일 */}
          <div style={{ display: 'flex', height: headH + 'px' }}>
            <div style={{ width: timeColW + 'px', boxSizing: 'border-box', background: '#ececec', borderRight: LINE_W + 'px solid ' + LINE }} />
            {days.map((d, i) => (
              <div key={d} style={{
                width: colW + 'px', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: headFont + 'px', fontWeight: 600, color: '#444', background: '#ececec',
                borderRight: i < days.length - 1 ? LINE_W + 'px solid ' + LINE : 'none',
                borderBottom: LINE_W + 'px solid ' + LINE,
              }}>{dayLabels[i]}</div>
            ))}
          </div>
          {/* 본문 */}
          <div style={{ display: 'flex', height: bodyH + 'px' }}>
            <div style={{ width: timeColW + 'px', boxSizing: 'border-box', position: 'relative', background: '#ececec', borderRight: LINE_W + 'px solid ' + LINE }}>
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
            {days.map((d, i) => (
              <div key={d} style={{
                width: colW + 'px', boxSizing: 'border-box', position: 'relative',
                borderRight: i < days.length - 1 ? LINE_W + 'px solid ' + LINE : 'none',
              }}>
                {hours.slice(1, hourCount).map((h, j) => (
                  <div key={'l' + h} style={{
                    position: 'absolute', left: 0, right: 0,
                    top: (((j + 1) / hourCount) * bodyH) + 'px', height: LINE_W + 'px', background: LINE,
                  }} />
                ))}
                {tt.blocks.filter(b => b.day === d).map(b => {
                  const subj = data.subjects.find(s => s.id === b.subjectId);
                  if (!subj) return null;
                  const top = (b.start / totalMin) * bodyH;
                  const hgt = ((b.end - b.start) / totalMin) * bodyH;
                  const col = getSubjectColor(cfg, subj);
                  const blkStyle = {
                    position: 'absolute', left: 0, right: 0, top: top + 'px', height: hgt + 'px',
                    boxSizing: 'border-box', background: '#fff', border: LINE_W + 'px solid ' + LINE,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', padding: '0 2px',
                  };
                  let txtColor = '#444';
                  let bandCol = null;
                  if (col) {
                    if (fullFill) {
                      blkStyle.background = col;
                      blkStyle.border = LINE_W + 'px solid rgba(0,0,0,0.18)';
                      txtColor = textColorOn(col);
                    } else {
                      bandCol = col;
                      blkStyle.paddingLeft = (accentW + 3) + 'px';
                    }
                  }
                  return (
                    <div key={b.id} style={blkStyle}>
                      {bandCol && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: accentW + 'px', background: bandCol }} />}
                      <span style={{
                        fontSize: blockFont + 'px', fontWeight: 400, color: txtColor,
                        lineHeight: 1.15, textAlign: 'center', maxWidth: '100%', overflow: 'hidden',
                        wordBreak: 'keep-all', overflowWrap: 'break-word',
                      }}>{subj.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 앱 홍보 푸터 */}
        <div style={{
          marginTop: footGap + 'px', height: footH + 'px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: Math.round(font * 0.25) + 'px',
          borderTop: '1px solid #e5e5e5',
        }}>
          <img src="/logo2.png" alt="타임지그" style={{ height: logoH + 'px', width: 'auto', display: 'block' }} />
          <span style={{ fontSize: taglineFont + 'px', color: '#555', lineHeight: 1.2 }}>예쁘고 편하게 만드는 시간표</span>
          <span style={{ fontSize: storeFont + 'px', color: '#999', lineHeight: 1.2 }}>Google Play <b style={{ color: '#777' }}>'타임지그'</b> 검색 · https://timejig.vercel.app</span>
        </div>
      </div>
    </div>
  );
});

export default ShareImage;
