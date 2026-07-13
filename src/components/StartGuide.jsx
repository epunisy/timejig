// 첫 진입 시 딱 한 장짜리 짧은 시작 안내.
// 긴 튜토리얼은 사람들이 그냥 넘겨버려서 "가장 먼저 할 일" 하나만 확실히 각인시킨다.
// ① 과목 팔레트에서 ＋로 과목 추가 → ② 시간표로 드래그.
export default function StartGuide({ onClose }) {
  return (
    <div className="tj-modal-bg" onClick={onClose}>
      <div className="tj-start" onClick={(e) => e.stopPropagation()}>
        <div className="tj-start-eyebrow">가장 먼저 이것만!</div>
        <div className="tj-start-title">과목 추가 → 시간표로 드래그</div>

        <div className="tj-start-flow">
          <div className="tj-start-step">
            <div className="tj-start-vis">
              <span className="tj-start-plusbtn">＋</span>
            </div>
            <div className="tj-start-cap"><b>① 과목 팔레트</b>의 <span className="tj-start-plus-inline">＋</span> 를 눌러<br />과목을 만들고</div>
          </div>

          <div className="tj-start-arrow">→</div>

          <div className="tj-start-step">
            <div className="tj-start-vis">
              <span className="tj-start-chip">영어</span>
              <span className="tj-start-drag">↴</span>
              <span className="tj-start-grid">
                {[0, 1, 2, 3].map(k => <i key={k} className={k === 1 ? 'on' : ''} />)}
              </span>
            </div>
            <div className="tj-start-cap"><b>② 시간표로 드래그</b>하면<br />끝이에요!</div>
          </div>
        </div>

        <div className="tj-start-note">지울 땐 블록을 <b>아래 휴지통으로 드래그</b>하면 돼요.</div>

        <button className="tj-start-cta" onClick={onClose}>바로 시작하기</button>
      </div>
    </div>
  );
}
