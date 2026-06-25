import { t } from '../i18n';
import GoogleIcon from './GoogleIcon';

// 첫 진입 화면 — 샤이닝 로고 + 환영 멘트 + 두 갈래(로그인 / 처음 이용)
// onBack 이 있으면 미리보기(설정에서 열어본 것) → 돌아가기 버튼 표시
export default function Setup({ user, onSignIn, onFirstUse, onBack }) {
  return (
    <div className="tj-setup">
      {onBack && (
        <button className="tj-setup-back" onClick={onBack}>← 돌아가기</button>
      )}
      <span className="tj-setup-logo-wrap">
        <img src="/logo.png" alt={t('appName')} className="tj-setup-logo" />
      </span>
      <div className="tj-setup-greeting">{t('welcome')}{'\n'}시작해볼까요?</div>

      {/* 실제 캡처 두 장(위아래). 밤이라 빨간 현재선이 안 찍혀서, 시간표 위에 NOW선을 임의로 얹음 */}
      <div className="tj-setup-hero">
        <div className="tj-hero-shotwrap">
          <img className="tj-hero-img" src="/preview-shot.jpg" alt="타임지그로 만든 시간표 예시" />
          <span className="tj-hero-nowline"><span className="tj-hero-nowdot" /></span>
        </div>
        <img className="tj-hero-img" src="/preview-shot2.jpg" alt="과목 팔레트와 월 교육비 예시" />
      </div>
      <div className="tj-setup-hero-cap">드래그로 뚝딱 — 과목·교육비까지 한눈에 ✨</div>

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
