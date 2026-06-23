import { t } from '../i18n';
import { getBackground, bgStyle } from '../App';

// 첫 진입 화면 — 샤이닝 로고 + 환영 멘트 + 두 갈래(로그인 / 처음 이용)
// onBack 이 있으면 미리보기(설정에서 열어본 것) → 돌아가기 버튼 표시
export default function Setup({ onSignIn, onFirstUse, onBack }) {
  return (
    <div className="tj-setup" style={bgStyle(getBackground('graph'))}>
      {onBack && (
        <button className="tj-setup-back" onClick={onBack}>← 돌아가기</button>
      )}
      <span className="tj-setup-logo-wrap">
        <img src="/logo.png" alt={t('appName')} className="tj-setup-logo" />
      </span>
      <div className="tj-setup-greeting">{t('welcome')}{'\n'}시작해볼까요?</div>

      <button className="tj-setup-cta" onClick={onFirstUse}>처음 이용하기</button>
      <button className="tj-setup-login-btn" onClick={onSignIn}>
        <span className="tj-g">G</span> 로그인 (이미 만든 시간표 불러오기)
      </button>
      <div className="tj-setup-hint">처음이면 ‘처음 이용하기’,{'\n'}쓰던 게 있으면 로그인하세요.</div>
    </div>
  );
}
