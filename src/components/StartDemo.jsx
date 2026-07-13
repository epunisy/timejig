// 첫 화면 시작법을 '짧은 영상'처럼 반복 재생하는 가벼운 CSS 애니메이션 데모.
// 흐름: ＋ 탭 → '영어' 과목 카드 생성 → 손가락으로 시간표 칸까지 드래그 → 칸이 채워짐(반복).
// 실제 동영상 파일 없이 구현해 용량/오프라인 부담이 없다.
export default function StartDemo() {
  return (
    <div className="sd-stage" aria-hidden="true">
      <div className="sd-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={'sd-cell' + (i === 1 ? ' sd-target' : '')} />
        ))}
      </div>
      <div className="sd-pal">
        <span className="sd-plus">＋</span>
        <span className="sd-pal-label">과목 추가</span>
      </div>
      <div className="sd-hand">
        <span className="sd-card">영어</span>
        <span className="sd-finger">👆</span>
      </div>
    </div>
  );
}
