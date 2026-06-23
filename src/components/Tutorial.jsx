import { useState, Fragment } from 'react';

// 앱 톤의 흰 카드 + 미니 예시 화면(작은 시간표 mock)으로 보여주는 튜토리얼
const COL = ['#B7D7FF', '#FFD1D8', '#CDECB8', '#FFF0C8', '#D9D0F8'];
const DAYS = ['월', '화', '수', '목'];
const CELLS = [
  [0, -1, 2, -1],
  [0, 1, 2, -1],
  [-1, 1, -1, 3],
  [0, -1, 2, 3],
];

function MiniGrid({ memo, cost, drag, plan, lock }) {
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
          <div className="lab">메모</div>
          <div className="txt">월: 실내화 · 화: 받아쓰기 시험</div>
        </div>
      )}
      {cost && (
        <div className="ttut-cost">
          <div className="ttut-bar">
            <i style={{ width: '42%', background: COL[0] }} />
            <i style={{ width: '33%', background: COL[2] }} />
            <i style={{ width: '25%', background: COL[1] }} />
          </div>
          <div className="ttut-won">월 교육비 ₩320,000</div>
        </div>
      )}
      {drag && (
        <div className="ttut-drag">
          <div className="ttut-card" style={{ borderLeftColor: COL[1] }}>영어</div>
          <div className="ttut-arrow">⤵</div>
        </div>
      )}
      {plan && <div className="ttut-badge">📷 사진 → AI 자동입력</div>}
      {lock && <div className="ttut-badge ttut-badge-lock">🔒 고정됨</div>}
    </div>
  );
}

// 색 무드 미리보기 mock
function MoodPreview() {
  const moods = [
    { name: '크림', cols: ['#FBF6EE', '#DBEFD4', '#FBEFBE', '#FCF7E0', '#EDF8F3', '#DCE8F4'] },
    { name: '캔디', cols: ['#CDB6E6', '#A6E0EC', '#F5B0C6', '#9DDACF', '#F9CDA0', '#FAE9A6'] },
    { name: '소르베', cols: ['#B7D7FF', '#D9D0F8', '#FFD1D8', '#CDECB8', '#FFF0C8', '#FBE3D0'] },
  ];
  return (
    <div className="ttut-moods">
      {moods.map(m => (
        <div key={m.name} className="ttut-mood-row">
          <span className="ttut-mood-name">{m.name}</span>
          <span className="ttut-mood-sw">{m.cols.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
        </div>
      ))}
    </div>
  );
}

// 로그인/클라우드 동기화 mock
function CloudSync() {
  return (
    <div className="ttut-sync">
      <span className="ttut-sync-dev">📱</span>
      <span className="ttut-sync-link">↔</span>
      <span className="ttut-sync-cloud">☁️</span>
      <span className="ttut-sync-link">↔</span>
      <span className="ttut-sync-dev">💻</span>
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

function MiniThumb({ name, cells }) {
  return (
    <div className="ttut-mini">
      <div className="ttut-mini-name">{name}</div>
      <div className="ttut-mini-grid">
        {cells.map((c, i) => (
          <span key={i} style={c >= 0 ? { background: COL[c] } : undefined} />
        ))}
      </div>
    </div>
  );
}

const SLIDES = [
  { title: '과목 만들고 드래그!', desc: '과목을 끌어다 시간표에 톡! 실수하면 ↶ 되돌리기로 한 번에 취소돼요.', view: <MiniGrid drag /> },
  { title: '사진 한 장이면 자동완성', desc: '학교·학원 시간표 사진만 올리면 AI가 알아서 채워줘요.', view: <MiniGrid plan /> },
  { title: '색 무드로 분위기 바꾸기', desc: '크림·캔디·소르베 무드로 색을 한 번에! 배경색도 원하는 대로 골라요.', view: <MoodPreview /> },
  { title: '메모 · 월 교육비 한눈에', desc: '준비물 메모와 한 달 학원비를 과목 아래에서 바로 확인해요.', view: <MiniGrid memo cost /> },
  { title: '실수로 안 움직이게 🔒 고정', desc: '고정을 켜면 시간표가 잠겨 잘못 드래그되지 않아요.', view: <MiniGrid lock /> },
  {
    title: '잠금화면으로 저장 ✨',
    desc: '완성한 시간표를 폰 배경화면 이미지로! 둘이면 한 화면에 함께 담을 수도 있어요.',
    view: (
      <Phone>
        <div className="ttut-collage">
          <MiniThumb name="첫째" cells={[0, -1, 2, 0, 1, 2, -1, 1, -1]} />
          <MiniThumb name="둘째" cells={[1, -1, 3, 1, 3, -1, -1, 3, 4]} />
        </div>
      </Phone>
    ),
  },
  { title: '로그인하면 어디서나 그대로', desc: '구글 로그인 한 번이면 기기를 바꿔도 시간표가 자동으로 따라와요.', view: <CloudSync /> },
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
