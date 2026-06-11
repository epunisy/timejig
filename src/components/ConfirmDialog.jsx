import { t } from '../i18n';

export default function ConfirmDialog({ title, message, onYes, onClose, confirmText, infoOnly }) {
  function handleYes() {
    if (onYes) onYes();
    onClose();
  }

  return (
    <div className="tj-modal-bg" onClick={onClose}>
      <div className="tj-modal" onClick={(e) => e.stopPropagation()} style={{ width: '320px' }}>
        <h3>{title}</h3>
        <div
          className="tj-confirm-msg"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <div className="tj-modal-actions">
          {infoOnly ? (
            <button className="primary" onClick={onClose}>확인</button>
          ) : (
            <>
              <button onClick={onClose}>{t('cancel')}</button>
              <button
                className="primary"
                onClick={handleYes}
                style={{ background: '#A32D2D', borderColor: '#A32D2D' }}
              >
                {confirmText || t('confirmDelete')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}