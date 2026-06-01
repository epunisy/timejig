import { t } from '../i18n';

export default function Splash({ onTap, ready }) {
  return (
    <div
      className="tj-splash"
      onClick={onTap}
      style={{ cursor: ready ? 'pointer' : 'default' }}
    >
      <img src="/logo.png" alt={t('appName')} />
      <div className="tj-splash-tagline">{t('appSubtitle')}</div>
      {ready && <div className="tj-splash-tap">화면을 터치하세요</div>}
    </div>
  );
}
