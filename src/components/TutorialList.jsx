// '튜토리얼 다시 보기' — 한눈에 보는 리스트형 사용법
const STEPS = [
  ['과목 추가', '과목 옆 + 버튼으로 새 과목을 만들어요. 기본으로 국어가 들어 있어요.'],
  ['드래그로 시간표 배치', '과목 카드를 끌어서 시간표로 놓으면 10분 단위로 자동 정렬돼요.'],
  ['길게 누르면 편집', '카드를 0.5초 이상 누르면 편집 창. 이름·시간·색·삭제·복제 가능.'],
  ['이동·삭제', '시간표에 놓은 블록도 끌어서 옮길 수 있어요. 하단 휴지통으로 끌면 삭제.'],
  ['시간표 관리 — 상단 이름(▾)', '이름을 누르면 목록이 열려요. ✎ 이름 수정 · ⧉ 복제 · × 삭제, + 새 시간표 추가.'],
  ['전체 설정', '우측 ⚙ 톱니바퀴 → 요일 범위, 시간, 색띠, 글씨체 변경.'],
  ['잠금화면 만들기', "상단 '모바일 잠금화면' → 시간표를 폰 잠금화면 이미지(PNG)로 저장해요."],
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
