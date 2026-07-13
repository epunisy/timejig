import { useState } from 'react';
import { t } from '../i18n';
import GoogleIcon from './GoogleIcon';

const FEATURES = [
  '📋 시간표를 복사해 여러 버전으로 비교하기',
  '📷 기존 시간표 사진을 불러와 자동으로 변환하기',
  '🧩 한 번 만든 과목 블록을 드래그로 간편하게 배치하기',
  '🔴 NOW 버튼으로 오늘, 지금 수업 확인하기',
  '📤 이미지로 저장해 친구·가족에게 공유하기',
  '📱 잠금화면에 딱 맞는 배경으로 저장하기',
  '👨‍👩‍👧‍👦 형제·자매 시간표를 잠금화면에 함께 담기',
];

// 첫 진입 화면 — 샤이닝 로고 + 환영 멘트 + 두 갈래(로그인 / 처음 이용)
// onBack 이 있으면 미리보기(설정에서 열어본 것) → 돌아가기 버튼 표시
export default function Setup({ user, onSignIn, onFirstUse, onBack }) {
  const [showAllFeats, setShowAllFeats] = useState(false);
  const visibleFeats = showAllFeats ? FEATURES : FEATURES.slice(0, 3);
  return (
    <div className="tj-setup">
      {onBack && (
        <button className="tj-setup-back" onClick={onBack}>← 돌아가기</button>
      )}
      <span className="tj-setup-logo-wrap">
        <img src="/logo.png" alt={t('appName')} className="tj-setup-logo" />
      </span>
      <div className="tj-setup-greeting">
        <b>드래그로 뚝딱뚝딱!</b>
        엄마들이 상상했던 모든 기능을{'\n'}가장 깔끔하게 담았어요.
      </div>

      {/* 사람들이 긴 소개를 훅 넘겨버려 시작법을 몰라서 — 가장 먼저 '딱 3단계'를 크게 강조 */}
      <div className="tj-setup-start">
        <div className="tj-setup-start-title">딱 3단계면 끝!</div>
        <ol className="tj-setup-start-steps">
          <li>
            <span className="tj-setup-start-no">1</span>
            <span className="tj-setup-start-tx"><b>과목 팔레트</b>의 <span className="tj-setup-start-plus">＋</span> 를 눌러 <b>과목을 추가</b></span>
          </li>
          <li>
            <span className="tj-setup-start-no">2</span>
            <span className="tj-setup-start-tx">만든 과목을 <b>시간표로 드래그</b>해서 배치</span>
          </li>
          <li>
            <span className="tj-setup-start-no">3</span>
            <span className="tj-setup-start-tx">지울 땐 <b>아래 휴지통으로 드래그</b></span>
          </li>
        </ol>
      </div>

      {/* 실제 캡처 두 장(위아래). 밤이라 빨간 현재선이 안 찍혀서, 시간표 위에 NOW선을 임의로 얹음 */}
      <div className="tj-setup-hero">
        <div className="tj-hero-shotwrap">
          <img className="tj-hero-img" src="/preview-shot.jpg" alt="타임지그로 만든 시간표 예시" />
          <span className="tj-hero-nowline">
            <span className="tj-hero-nowtime">16:10</span>
            <span className="tj-hero-nowdot" />
          </span>
        </div>
        <img className="tj-hero-img" src="/preview-shot2.jpg" alt="과목 팔레트와 월 교육비 예시" />
      </div>
      <div className="tj-setup-feats-label">이런 것도 할 수 있어요</div>
      <ul className="tj-setup-feats">
        {visibleFeats.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
      {!showAllFeats && (
        <button className="tj-setup-more" onClick={() => setShowAllFeats(true)}>
          + 기능 더보기 ({FEATURES.length - 3})
        </button>
      )}

      {user ? (
        <>
          <button className="tj-setup-cta" onClick={onFirstUse}>계속하기</button>
          <div className="tj-setup-hint">{user.email}{'\n'}(으)로 로그인되어 있어요.</div>
        </>
      ) : (
        <>
          <button className="tj-setup-cta" onClick={onFirstUse}>로그인 없이 시작하기</button>
          <button className="tj-setup-login-btn" onClick={onSignIn}>
            <GoogleIcon /> Google로 로그인
          </button>
          <div className="tj-setup-hint">로그인은 나중에 해도 돼요.{'\n'}쓰던 게 있으면 로그인해서 불러오세요.</div>
        </>
      )}
    </div>
  );
}
