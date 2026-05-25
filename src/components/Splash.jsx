import { t } from '../i18n';

export default function Splash() {
  return (
    <div className="tj-splash">
      <img src="/logo.png" alt={t('appName')} />
      <div className="tj-splash-tagline">{t('appSubtitle')}</div>
    </div>
  );
}