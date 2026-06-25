import { t } from '../i18n';
import GoogleIcon from './GoogleIcon';

// 첫 화면 미리보기용 미니 시간표 (4일 x 4행, -1 = 빈칸)
const HERO_COLS = ['#B7D7FF', '#FFD1D8', '#CDECB8', '#FFF0C8', '#D9D0F8'];
const HERO_DAYS = ['월', '화', '수', '목'];
const HERO_CELLS = [
  0, -1, 2, 3,
  0, 1, 2, -1,
  -1, 1, 4, 3,
  0, -1, 4, -1,
];

function HeroGrid({ phone }) {
  return (
    <div className={'tj-hero-grid' + (phone ? ' is-phone' : '')}>
      {HERO_CELLS.map((c, i) => (
        <i key={i} style={c >= 0 ? { background: HERO_COLS[c] } : undefined} />
      ))}
    </div>
  );
}

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

      {/* 한눈에 보는 사용 흐름 — 드래그로 만든 시간표가 그대로 폰 잠금화면으로 */}
      <div className="tj-setup-hero">
        <div className="tj-hero-tt">
          <div className="tj-hero-days">{HERO_DAYS.map(d => <span key={d}>{d}</span>)}</div>
          <HeroGrid />
        </div>
        <span className="tj-hero-arrow">→</span>
        <div className="tj-hero-phone">
          <span className="tj-hero-phone-time">9:41</span>
          <div className="tj-hero-phone-tt"><HeroGrid phone /></div>
        </div>
      </div>
      <div className="tj-setup-hero-cap">끌어다 놓으면 완성 — 그대로 폰 잠금화면까지 ✨</div>

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
