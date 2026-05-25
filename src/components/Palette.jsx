import { t } from '../i18n';
import { getAccents } from '../App';

export default function Palette({
  config,
  subjects,
  onAddSubject,
  onEditSubject,
  onToggleSubject,
  onDeleteSubject,
  onDragStart,
}) {
  const accents = getAccents(config.accent);
  
  function handleMouseDown(e, subject) {
    e.preventDefault();
    if (!subject.active) return;
    onDragStart(subject);
  }
  
  return (
    <div className="tj-palette">
      <div className="tj-pal-head">
        <h3>{t('subjects')}</h3>
        <button className="tj-add-btn" onClick={onAddSubject}>
          {t('addSubject')}
        </button>
      </div>
      <div className="tj-pal-list">
        {subjects.length === 0 ? (
          <div className="tj-empty">{t('emptySubjects')}</div>
        ) : (
          subjects.map(s => {
            const style = {};
            let className = 'tj-pal-item';
            if (!s.active) className += ' inactive';
            if (accents) {
              style.borderLeftColor = accents[s.colorIndex % accents.length];
              className += ' with-accent';
            }
            return (
              <div key={s.id} className={className} style={style}>
                <div 
                  className="tj-pal-info"
                  onMouseDown={(e) => handleMouseDown(e, s)}
                >
                  <div className="tj-pal-name">{s.name}</div>
                  <div className="tj-pal-dur">{s.duration}분</div>
                </div>
                <div className="tj-pal-actions">
                  <button onClick={() => onEditSubject(s.id)} title={t('edit')}>✎</button>
                  <button 
                    onClick={() => onToggleSubject(s.id)}
                    title={s.active ? t('deactivate') : t('activate')}
                  >
                    {s.active ? '◉' : '◌'}
                  </button>
                  <button onClick={() => onDeleteSubject(s.id)} title={t('delete')}>🗑</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}