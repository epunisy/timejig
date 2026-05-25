import { useState, useRef } from 'react';
import { t } from '../i18n';
import Timetable from './Timetable';
import Palette from './Palette';
import Settings from './Settings';
import SubjectModal from './SubjectModal';
import ConfirmDialog from './ConfirmDialog';
import Tutorial from './Tutorial';

function pad(n) { return String(n).padStart(2, '0'); }

export default function Main({ data, setData, onGoExport }) {
  const [dragSubject, setDragSubject] = useState(null);
  const [internalDragging, setInternalDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showTutorial, setShowTutorial] = useState(!data.tutorialDone);
  const [addingTT, setAddingTT] = useState(false);
  const newTTInputRef = useRef(null);
  const newTTComposingRef = useRef(false);
  
  const activeTT = data.timetables.find(t => t.id === data.activeTT);
  if (!activeTT) return null;
  
  function updateTimetable(updater) {
    setData({
      ...data,
      timetables: data.timetables.map(t =>
        t.id === data.activeTT ? updater(t) : t
      ),
    });
  }
  
  function handleAddTimetable() {
    const name = newTTInputRef.current?.value.trim();
    if (!name) return;
    const newId = Math.max(...data.timetables.map(t => t.id)) + 1;
    setData({
      ...data,
      timetables: [...data.timetables, { id: newId, name, blocks: [] }],
      activeTT: newId,
    });
    setAddingTT(false);
  }
  
  function handleDuplicate(id) {
    const tt = data.timetables.find(t => t.id === id);
    const newId = Math.max(...data.timetables.map(t => t.id)) + 1;
    const newBlocks = tt.blocks.map(b => ({ 
      ...b, 
      id: Date.now() + Math.random() 
    }));
    setData({
      ...data,
      timetables: [...data.timetables, { 
        id: newId, 
        name: tt.name + ' 복사본', 
        blocks: newBlocks 
      }],
      activeTT: newId,
    });
  }
  
  function handleDeleteTimetable(id) {
    const tt = data.timetables.find(t => t.id === id);
    setConfirmDialog({
      title: t('deleteTimetable'),
      message: `${t('timetableDeleteConfirm', tt.name)}<br><span style="color:#888; font-size:12px;">${t('timetableDeleteWarn')}</span>`,
      onYes: () => {
        const newTTs = data.timetables.filter(t => t.id !== id);
        setData({
          ...data,
          timetables: newTTs,
          activeTT: data.activeTT === id ? newTTs[0].id : data.activeTT,
        });
      }
    });
  }
  
  function handleAddSubjectClick() {
    setEditingSubjectId(null);
    setShowSubjectModal(true);
  }
  
  function handleEditSubject(id) {
    setEditingSubjectId(id);
    setShowSubjectModal(true);
  }
  
  function handleToggleSubject(id) {
    setData({
      ...data,
      subjects: data.subjects.map(s =>
        s.id === id ? { ...s, active: !s.active } : s
      ),
    });
  }
  
  function handleDeleteSubject(id) {
    const s = data.subjects.find(x => x.id === id);
    const placedCount = activeTT.blocks.filter(b => b.subjectId === id).length;
    setConfirmDialog({
      title: t('delete'),
      message: t('subjectDeleteConfirm', s.name) + 
        (placedCount > 0 ? `<br><span style="color:#A32D2D; font-size:12px;">${t('subjectDeleteWarn', placedCount)}</span>` : ''),
      onYes: () => {
        setData({
          ...data,
          subjects: data.subjects.filter(x => x.id !== id),
          timetables: data.timetables.map(t => ({
            ...t,
            blocks: t.blocks.filter(b => b.subjectId !== id),
          })),
        });
      }
    });
  }
  
  function handleSubjectSave(subjectData) {
    if (editingSubjectId !== null) {
      setData({
        ...data,
        subjects: data.subjects.map(s =>
          s.id === editingSubjectId ? { ...s, ...subjectData } : s
        ),
      });
    } else {
      setData({
        ...data,
        subjects: [...data.subjects, {
          id: Date.now(),
          ...subjectData,
          active: true,
        }],
      });
    }
    setShowSubjectModal(false);
  }
  
  function handlePaletteDragStart(subject) {
    setDragSubject(subject);
  }
  
  function handleDragEnd(dropInfo) {
    if (dropInfo && dragSubject) {
      updateTimetable(tt => ({
        ...tt,
        blocks: [...tt.blocks, {
          id: Date.now(),
          subjectId: dragSubject.id,
          day: dropInfo.day,
          start: dropInfo.start,
          end: dropInfo.end,
        }],
      }));
    }
    setDragSubject(null);
  }
  
  function handleBlocksChange(newBlocks) {
    updateTimetable(tt => ({ ...tt, blocks: newBlocks }));
  }
  
  function handleConfigChange(newConfig) {
    let newTimetables = data.timetables;
    if (newConfig.weekRange === 'mon-fri' && data.config.weekRange === 'mon-sun') {
      newTimetables = data.timetables.map(t => ({
        ...t,
        blocks: t.blocks.filter(b => !['토', '일'].includes(b.day)),
      }));
    }
    setData({ ...data, config: newConfig, timetables: newTimetables });
  }
  
  function handleTimetableNameChange(name) {
    updateTimetable(tt => ({ ...tt, name: name.trim() || tt.name }));
  }
  
  function handleTutorialClose(dontShowAgain) {
    setShowTutorial(false);
    if (dontShowAgain) {
      setData({ ...data, tutorialDone: true });
    }
  }
  
  const isDragging = dragSubject !== null || internalDragging;
  
  return (
    <div className="tj-app">
      <div className="tj-topbar">
        <div className="tj-tabs">
          {data.timetables.map(tt => (
            <div
              key={tt.id}
              className={'tj-tab' + (tt.id === data.activeTT ? ' active' : '')}
              onClick={() => setData({ ...data, activeTT: tt.id })}
            >
              <span className="tab-name">{tt.name}</span>
              <span 
                className="tab-btn" 
                title={t('duplicate')}
                onClick={(e) => { e.stopPropagation(); handleDuplicate(tt.id); }}
              >⎘</span>
              {data.timetables.length > 1 && (
                <span 
                  className="tab-btn"
                  title={t('delete')}
                  onClick={(e) => { e.stopPropagation(); handleDeleteTimetable(tt.id); }}
                >×</span>
              )}
            </div>
          ))}
          {addingTT ? (
            <span className="tj-inline-add">
              <input
                ref={newTTInputRef}
                type="text"
                placeholder={t('timetableName')}
                autoFocus
                autoComplete="off"
                onCompositionStart={() => { newTTComposingRef.current = true; }}
                onCompositionEnd={() => { newTTComposingRef.current = false; }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !newTTComposingRef.current) handleAddTimetable();
                  if (e.key === 'Escape') setAddingTT(false);
                }}
              />
              <button onClick={handleAddTimetable}>{t('addSubject').replace('+ ', '')}</button>
              <button className="cancel" onClick={() => setAddingTT(false)}>{t('cancel')}</button>
            </span>
          ) : (
            <button className="tj-tab-add" onClick={() => setAddingTT(true)}>+</button>
          )}
        </div>
        <div className="tj-action-row">
          <button className="tj-cta" onClick={onGoExport}>{t('backgroundButton')}</button>
          <button className="tj-icon-btn" onClick={() => setShowSettings(true)}>{t('settingsButton')}</button>
        </div>
      </div>
      
      <div className="tj-meta">
        <span>{data.config.weekRange === 'mon-fri' ? t('monFri') : t('monSun')}</span>
        <span>·</span>
        <span>{pad(data.config.startHour)}:00 – {pad(data.config.endHour)}:00</span>
        <span>·</span>
        <span>색띠: {
          data.config.accent === 'none' ? t('accentNone') :
          data.config.accent === 'pastel' ? t('accentPastel') : t('accentMono')
        }</span>
      </div>
      
      <div className="tj-layout">
        <Timetable
          config={data.config}
          blocks={activeTT.blocks}
          subjects={data.subjects}
          onBlocksChange={handleBlocksChange}
          dragSubject={dragSubject}
          onDragEnd={handleDragEnd}
          onInternalDraggingChange={setInternalDragging}
        />
        <Palette
          config={data.config}
          subjects={data.subjects}
          onAddSubject={handleAddSubjectClick}
          onEditSubject={handleEditSubject}
          onToggleSubject={handleToggleSubject}
          onDeleteSubject={handleDeleteSubject}
          onDragStart={handlePaletteDragStart}
        />
      </div>
      
      {isDragging && (
        <div className="tj-trash-zone" id="trash-zone">
          🗑
        </div>
      )}
      
      {showSubjectModal && (
        <SubjectModal
          subject={editingSubjectId ? data.subjects.find(s => s.id === editingSubjectId) : null}
          config={data.config}
          subjectCount={data.subjects.length}
          onSave={handleSubjectSave}
          onCancel={() => setShowSubjectModal(false)}
          onDelete={editingSubjectId ? () => {
            setShowSubjectModal(false);
            handleDeleteSubject(editingSubjectId);
          } : null}
        />
      )}
      
      {showSettings && (
        <Settings
          config={data.config}
          timetableName={activeTT.name}
          onConfigChange={handleConfigChange}
          onTimetableNameChange={handleTimetableNameChange}
          onShowTutorial={() => { setShowSettings(false); setShowTutorial(true); }}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}
      
      {showTutorial && (
        <Tutorial onClose={handleTutorialClose} />
      )}
    </div>
  );
}