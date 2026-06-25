// '튜토리얼 다시 보기' — 한눈에 보는 리스트형 사용법
const STEPS = [
  ['과목 추가 · 정렬', '과목 옆 + 로 새 과목을 만들어요. 정렬 버튼으로 시간순↔과목순, 편집으로 여러 개 한 번에 삭제.'],
  ['드래그로 시간표 배치', '과목 카드를 끌어서 시간표로 놓으면 10분 단위로 자동 정렬돼요.'],
  ['길게 누르면 편집', '카드를 0.5초 이상 누르면 편집 창. 이름·시간·색·삭제·복제 가능.'],
  ['이동·삭제', '시간표에 놓은 블록도 끌어서 옮길 수 있어요. 하단 휴지통으로 끌면 삭제.'],
  ['🔴 NOW — 오늘·지금', '상단 NOW를 켜면 오늘 요일이 강조되고, 진행 중인 수업이 빨갛게 표시돼요.'],
  ['시간표 관리 — 상단 이름(▾)', '이름을 누르면 목록이 열려요. ✎ 이름 수정 · ⧉ 복제 · × 삭제, + 새 시간표 추가.'],
  ['설정 — 우측 ⚙', "'시간표 설정'(요일·시간)과 '꾸밈'(색·글씨·배경)으로 나뉘어요. '모든 시간표를 이와 같이 꾸밈'으로 한 번에 통일도 가능."],
  ['잠금화면 · 공유', "'모바일 잠금화면'으로 PNG 저장, '시간표 공유하기'로 이미지를 바로 공유해요."],
  ['처음부터 다시 시작', '상단 왼쪽 로고를 누르면 모든 시간표를 지우고 처음부터 시작해요. (실수 방지로 한 번 더 확인해요)'],
];

export default function TutorialList({ onClose }) {
  return (
    <div className="tj-tutorial-bg" onClick={onClose}>
      <div className="tj-tutorial" onClick={(e) => e.stopPropagation()}>
        <h3>👋 사용법</h3>
        {STEPS.map(([title, sub], i) => (
          <div key={i} className="tj-tutorial-step">
            <div className="tj-tutorial-num">{i + 1}</div>
            <div className="tj-tutorial-text">
              <b>{title}</b>
              <span className="sub">{sub}</span>
            </div>
          </div>
        ))}
        <div className="tj-tutorial-actions" style={{ justifyContent: 'flex-end' }}>
          <button className="tj-coach-next" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
