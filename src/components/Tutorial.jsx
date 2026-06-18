import { useState } from 'react';

// 큼직한 글씨가 하나씩 '뙇!' 튀어나오는 풀스크린 튜토리얼
const SLIDES = [
  { emoji: '🗓️', big: '내 시간표를\n잠금화면으로!', sub: '타임지그에 오신 걸 환영해요' },
  { emoji: '➕', big: '과목을\n뙇! 추가', sub: '아래 과목팔레트의 + 로 만들어요' },
  { emoji: '👆', big: '드래그로\n뙇! 배치', sub: '과목을 끌어다 시간표에 톡!' },
  { emoji: '📋', big: '학습계획표\n사진만 올리면', sub: 'AI가 시간표를 자동으로 채워줘요' },
  { emoji: '📝', big: '요일별 메모도\n뙇!', sub: '준비물·알림을 요일마다 적어요' },
  { emoji: '💰', big: '월 교육비\n자동 계산', sub: '과목에 금액만 넣으면 끝' },
  { emoji: '📱', big: '잠금화면으로\n저장!', sub: '완성한 시간표를 배경화면 이미지로' },
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
    <div className="tj-tut" onClick={next}>
      <button
        className="tj-tut-skip"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >건너뛰기</button>

      <div className="tj-tut-slide" key={i}>
        <div className="tj-tut-emoji">{s.emoji}</div>
        <div className="tj-tut-big">{s.big}</div>
        <div className="tj-tut-sub">{s.sub}</div>
      </div>

      <div className="tj-tut-bottom">
        <div className="tj-tut-dots">
          {SLIDES.map((_, k) => (
            <span key={k} className={'tj-tut-dot' + (k === i ? ' on' : '')} />
          ))}
        </div>
        <button
          className="tj-tut-next"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >{last ? '시작! 🚀' : '다음'}</button>
        <div className="tj-tut-tap">화면을 탭해도 넘어가요</div>
      </div>
    </div>
  );
}
