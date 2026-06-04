import { useState, useLayoutEffect } from 'react';

// 실제 화면 요소를 스포트라이트로 짚어주는 단계별 안내
const STEPS = [
  { sel: '.tj-add-btn', icon: '➕', title: '과목 추가', text: '여기 + 로 새 과목을 만들어요. 기본으로 국어가 들어 있어요.' },
  { sel: '.tj-grid', icon: '🗓️', title: '드래그로 배치', text: '과목을 끌어다 시간표에 놓으면 10분 단위로 정렬돼요. 놓은 블록은 다시 끌어 옮기거나, 아래 휴지통으로 끌면 삭제. 카드를 길게 누르면 편집!' },
  { sel: '.tj-ttbar', icon: '🗂️', title: '시간표 관리', text: '이름(▾)을 누르면 시간표 목록이 열려요. 선택은 물론 ✎ 이름수정 · ⧉ 복제 · × 삭제, + 새 시간표까지 여기서!' },
  { sel: '.tj-cta-settings', icon: '⚙️', title: '설정', text: '요일 범위·시간·색띠·글씨체·배경까지 여기 ⚙ 설정에서 바꿔요.' },
  { sel: '.tj-cta', icon: '📱', title: '배경화면 만들기', text: '완성한 시간표를 폰 배경화면 이미지(PNG)로 저장해요!' },
];

const TT_W = 270;

export default function Tutorial({ onClose }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const step = STEPS[i];

  useLayoutEffect(() => {
    function measure() {
      const el = document.querySelector(step.sel);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom });
    }
    // 단계가 바뀌면 대상을 화면 안으로 스크롤 (모바일에서 대상이 화면 밖일 수 있음)
    const target = document.querySelector(step.sel);
    if (target) target.scrollIntoView({ block: 'center', inline: 'nearest' });
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.sel]);

  const last = i === STEPS.length - 1;
  function next() { last ? onClose() : setI(i + 1); }

  const PAD = 6;
  const spot = rect ? {
    top: rect.top - PAD, left: rect.left - PAD,
    width: rect.width + PAD * 2, height: rect.height + PAD * 2,
  } : null;

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  let tipStyle = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  let arrowDir = null;
  let arrowLeft = TT_W / 2;
  if (rect) {
    const TT_H = 180; // 말풍선 대략 높이
    const centerX = rect.left + rect.width / 2;
    const left = Math.max(10, Math.min(centerX - TT_W / 2, vw - TT_W - 10));
    arrowLeft = Math.max(18, Math.min(centerX - left, TT_W - 18));
    if (rect.bottom + 16 + TT_H <= vh) {
      // 대상 아래에 공간 있음 → 아래에
      tipStyle = { top: rect.bottom + 16, left };
      arrowDir = 'top';
    } else if (rect.top - 16 - TT_H >= 0) {
      // 아래 공간 없고 위에 공간 있음 → 위에
      tipStyle = { bottom: vh - rect.top + 16, left };
      arrowDir = 'bottom';
    } else {
      // 대상이 화면보다 커서 위아래 다 안 됨 → 화면 하단에 고정 (글 안 잘리게)
      tipStyle = { bottom: 24, left };
      arrowDir = null;
    }
  }

  return (
    <div className="tj-coach-bg">
      {spot && <div className="tj-coach-spot" style={spot} />}
      <div className="tj-coach-tip" style={{ width: TT_W + 'px', ...tipStyle }}>
        {arrowDir && <div className={'tj-coach-arrow ' + arrowDir} style={{ left: arrowLeft + 'px' }} />}
        <div className="tj-coach-head">
          <span className="tj-coach-ic">{step.icon}</span>
          <b>{step.title}</b>
        </div>
        <p>{step.text}</p>
        <div className="tj-coach-actions">
          <div className="tj-coach-dots">
            {STEPS.map((_, k) => (
              <span key={k} className={'tj-coach-dot' + (k === i ? ' on' : '')} />
            ))}
          </div>
          <div className="tj-coach-btns">
            <button className="skip" onClick={onClose}>건너뛰기</button>
            <button className="tj-coach-next" onClick={next}>{last ? '시작!' : '다음'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
