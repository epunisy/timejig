import { t } from '../i18n';

export default function Tutorial({ onClose }) {
  return (
    <div className="tj-tutorial-bg" onClick={() => onClose(false)}>
      <div className="tj-tutorial" onClick={(e) => e.stopPropagation()}>
        <h3>{t('tutorialTitle')}</h3>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">1</div>
          <div className="tj-tutorial-text">
            <b>{t('tutorialStep1Title')}</b>
            <span className="sub">{t('tutorialStep1')}</span>
          </div>
        </div>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">2</div>
          <div className="tj-tutorial-text">
            <b>{t('tutorialStep2Title')}</b>
            <span className="sub">{t('tutorialStep2')}</span>
          </div>
        </div>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">3</div>
          <div className="tj-tutorial-text">
            <b>{t('tutorialStep3Title')}</b>
            <span className="sub">{t('tutorialStep3')}</span>
          </div>
        </div>
        
        <div className="tj-tutorial-step">
          <div className="tj-tutorial-num">4</div>
          <div className="tj-tutorial-text">
            <b>{t('tutorialStep4Title')}</b>
            <span className="sub">{t('tutorialStep4')}</span>
          </div>
        </div>
        
        <div className="tj-tutorial-actions">
          <button className="skip" onClick={() => onClose(true)}>
            {t('dontShowAgain')}
          </button>
          <button className="tj-cta" onClick={() => onClose(false)}>
            {t('gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}