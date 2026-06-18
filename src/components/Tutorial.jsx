import { useState, Fragment } from 'react';

// 앱 톤의 흰 카드 + 미니 예시 화면(작은 시간표 mock)으로 보여주는 튜토리얼
const COL = ['#B5D4F4', '#9FE1CB', '#FAC775', '#CECBF6', '#C0DD97'];
const DAYS = ['월', '화', '수', '목'];
const CELLS = [
  [0, -1, 2, -1],
  [0, 1, 2, -1],
  [-1, 1, -1, 3],
  [0, -1, 2, 3],
];

function MiniGrid({ memo, cost, drag, plan }) {
  return (
    <div className="ttut-tt">
      <div className="ttut-grid">
        <div className="ttut-corner" />
        {DAYS.map(d => <div key={d} className="ttut-dh">{d}</div>)}
        {CELLS.map((row, r) => (
          <Fragment key={r}>
            <div className="ttut-tl">{9 + r}</div>
            {row.map((c, j) => (
              <div key={j} className="ttut-cell" style={c >= 0 ? { background: COL[c] } : undefined} />
            ))}
          </Fragment>
        ))}
      </div>
      {memo && (
        <div className="ttut-memo">
          <span className="lab">메모</span>
          <span>실내화</span><span>받아쓰기</span><span /><span>준비물</span>
        </div>
      )}
      {cost && (
        <div className="ttut-cost">
          <div className="ttut-bar">
            <i style={{ width: '42%', background: COL[0] }} />
            <i style={{ width: '33%', background: COL[2] }} />
            <i style={{ width: '25%', background: COL[1] }} />
          </div>
          <div className="ttut-won">월 ₩320,000</div>
        </div>
      )}
      {drag && (
        <div className="ttut-drag">
          <div className="ttut-card" style={{ borderLeftColor: COL[1] }}>영어</div>
          <div className="ttut-arrow">⤵</div>
        </div>
      )}
      {plan && <div className="ttut-badge">📋 사진 → AI 자동입력</div>}
    </div>
  );
}

function Phone({ children }) {
  return (
    <div className="ttut-phone">
      <div className="ttut-notch" />
      <div className="ttut-clock">9:41</div>
      {children}
    </div>
  );
}

const SLIDES = [
  { title: '내 시간표를 한눈에', desc: '요일·시간대 그대로, 깔끔한 표로.', view: <MiniGrid /> },
  { title: '과목 만들고 드래그!', desc: '과목을 끌어다 시간표에 톡 놓으면 끝.', view: <MiniGrid drag /> },
  { title: '학습계획표 사진 자동입력', desc: '학교 주간학습계획표 사진만 올리면 AI가 채워줘요.', view: <MiniGrid plan /> },
  { title: '요일 메모 + 월 교육비', desc: '준비물 메모와 한 달 학원비까지 자동으로.', view: <MiniGrid memo cost /> },
  { title: '잠금화면으로 저장', desc: '완성한 시간표를 폰 배경화면 이미지로!', view: <Phone><MiniGrid /></Phone> },
];

export default function Tutorial({ onClose }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];
  function next() {
    if (last) onClose();
    else setI(i + 1);
  }
  return (
    <div className="tj-modal-bg" onClick={onClose}>
      <div className="tj-tut2" onClick={(e) => e.stopPropagation()}>
        <button className="tj-tut2-skip" onClick={onClose}>건너뛰기</button>
        <div className="tj-tut2-view" key={i}>{s.view}</div>
        <div className="tj-tut2-title">{s.title}</div>
        <div className="tj-tut2-desc">{s.desc}</div>
        <div className="tj-tut2-dots">
          {SLIDES.map((_, k) => <span key={k} className={'tj-tut2-dot' + (k === i ? ' on' : '')} />)}
        </div>
        <button className="tj-tut2-next" onClick={next}>{last ? '시작하기' : '다음'}</button>
      </div>
    </div>
  );
}
