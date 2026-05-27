export default function Tutorial({ onClose }) {
  return (
    <div className="tj-tutorial-bg" onClick={() => onClose(false)}>
      <div className="tj-tutorial" onClick={(e) => e.stopPropagation()}>
        <h3>👋 시작하기 전에</h3>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">1</div>
          <div className="tj-tutorial-text">
            <b>과목 추가</b>
            <span className="sub">우측 + 버튼으로 새 과목을 만들어요. 기본으로 국어, 영어, 수학이 있어요.</span>
          </div>
        </div>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">2</div>
          <div className="tj-tutorial-text">
            <b>드래그로 시간표 배치</b>
            <span className="sub">과목 카드를 끌어서 시간표로 놓으면 10분 단위로 자동 정렬돼요.</span>
          </div>
        </div>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">3</div>
          <div className="tj-tutorial-text">
            <b>카드를 길게 누르면 편집</b>
            <span className="sub">과목 카드를 0.5초 이상 누르면 편집 창이 떠요. 이름·시간·색·삭제·복제 가능.</span>
          </div>
        </div>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">4</div>
          <div className="tj-tutorial-text">
            <b>이동·삭제</b>
            <span className="sub">시간표에 놓은 블록도 끌어서 옮길 수 있어요. 하단 휴지통으로 끌면 삭제.</span>
          </div>
        </div>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">5</div>
          <div className="tj-tutorial-text">
            <b>시간표 여러 개 관리</b>
            <span className="sub">상단 + 로 새 시간표, ⎘ 로 복제. 설정에서 요일·시간·색띠 변경.</span>
          </div>
        </div>
        
        <div className="tj-tutorial-actions">
          <button className="skip" onClick={() => onClose(true)}>
            다시 보지 않기
          </button>
          <button className="tj-cta" onClick={() => onClose(false)}>
            알겠어요
          </button>
        </div>
      </div>
    </div>
  );
}