import { useState, useRef } from 'react';
import { t } from '../i18n';
import Timetable from './Timetable';
import Palette from './Palette';
import Settings from './Settings';
import SubjectModal from './SubjectModal';
import ConfirmDialog from './ConfirmDialog';
import Tutorial from './Tutorial';

export default function Main({ data, setData, onGoExport }) {
  const [dragSubject, setDragSubject] = useState(null);
  const [internalDragging, setInternalDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showTutorial, setShowTutorial] = useState(!data.tutorialDone);
  const [addingTT, setAddingTT] = useState(false);
  const [renamingTT, setRenamingTT] = useState(null);
  const newTTInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const newTTComposingRef = useRef(false);
  const renameComposingRef = useRef(false);
  
  const activeTT = data.timetables.find(t => t.id === data.activeTT);
  if (!activeTT) return null;
  
  const accentClass = 'accent-' + data.config.accent;
  
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
  
  function handleRenameTimetable(id) {
    const name = renameInputRef.current?.value.trim();
    if (!name) { setRenamingTT(null); return; }
    setData({
      ...data,
      timetables: data.timetables.map(t =>
        t.id === id ? { ...t, name } : t
      ),
    });
    setRenamingTT(null);
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
      title: '시간표 삭제',
      message: `${tt.name} 시간표를 삭제할까요?<br><span style="color:#888; font-size:11px;">배치된 블록도 함께 사라집니다.</span>`,
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
  
  function handleDeleteSubject(id) {
    const s = data.subjects.find(x => x.id === id);
    const placedCount = activeTT.blocks.filter(b => b.subjectId === id).length;
    setConfirmDialog({
      title: '과목 삭제',
      message: `${s.name} 과목을 삭제할까요?` + 
        (placedCount > 0 ? `<br><span style="color:#C77575; font-size:11px;">배치된 ${placedCount}개의 블록도 사라집니다.</span>` : ''),
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
  
  function handleSubjectDuplicate(subjectData) {
    setData({
      ...data,
      subjects: [...data.subjects, {
        id: Date.now(),
        name: subjectData.name + ' 복사본',
        duration: subjectData.duration,
        colorIndex: subjectData.colorIndex,
        active: true,
      }],
    });
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
          {data.timetables.map(tt => {
            const isActive = tt.id === data.activeTT;
            let cls = 'tj-tab';
            if (isActive) cls += ' active ' + accentClass;
            
            if (renamingTT === tt.id) {
              return (
                <span key={tt.id} className="tj-inline-add">
                  <input
                    ref={renameInputRef}
                    type="text"
                    defaultValue={tt.name}
                    autoFocus
                    autoComplete="off"
                    onCompositionStart={() => { renameComposingRef.current = true; }}
                    onCompositionEnd={() => { renameComposingRef.current = false; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !renameComposingRef.current) handleRenameTimetable(tt.id);
                      if (e.key === 'Escape') setRenamingTT(null);
                    }}
                  />
                  <button onClick={() => handleRenameTimetable(tt.id)}>저장</button>
                  <button className="cancel" onClick={() => setRenamingTT(null)}>취소</button>
                </span>
              );
            }
            
            return (
              <div
                key={tt.id}
                className={cls}
                onClick={() => setData({ ...data, activeTT: tt.id })}
              >
                <span className="tab-name">{tt.name}</span>
                <span 
                  className="tab-btn" 
                  title="이름 수정"
                  onClick={(e) => { e.stopPropagation(); setRenamingTT(tt.id); }}
                >✎</span>
                <span 
                  className="tab-btn" 
                  title="복제"
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(tt.id); }}
                >⧉</span>
                {data.timetables.length > 1 && (
                  <span 
                    className="tab-btn"
                    title="삭제"
                    onClick={(e) => { e.stopPropagation(); handleDeleteTimetable(tt.id); }}
                  >×</span>
                )}
              </div>
            );
          })}
          {addingTT ? (
            <span className="tj-inline-add">
              <input
                ref={newTTInputRef}
                type="text"
                placeholder="시간표 이름"
                autoFocus
                autoComplete="off"
                onCompositionStart={() => { newTTComposingRef.current = true; }}
                onCompositionEnd={() => { newTTComposingRef.current = false; }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !newTTComposingRef.current) handleAddTimetable();
                  if (e.key === 'Escape') setAddingTT(false);
                }}
              />
              <button onClick={handleAddTimetable}>추가</button>
              <button className="cancel" onClick={() => setAddingTT(false)}>취소</button>
            </span>
          ) : (
            <button className="tj-tab-add" onClick={() => setAddingTT(true)}>+</button>
          )}
        </div>
        <div className="tj-action-row">
          <svg className="tj-logo-top" viewBox="0 0 130 30" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="22" fontFamily="-apple-system, 'Apple SD Gothic Neo', sans-serif" fontSize="22" fontWeight="900" fill="#1A1A1A" letterSpacing="-1">T</text>
            <text x="14" y="22" fontFamily="-apple-system, 'Apple SD Gothic Neo', sans-serif" fontSize="22" fontWeight="900" fill="#1A1A1A" letterSpacing="-1">i</text>
            <rect x="17" y="3" width="3.5" height="3.5" fill="#D5D5D0"/>
            <rect x="17" y="8" width="3.5" height="3.5" fill="#A5A5A0"/>
            <rect x="17" y="13" width="3.5" height="3.5" fill="#1A1A1A"/>
            <text x="22" y="22" fontFamily="-apple-system, 'Apple SD Gothic Neo', sans-serif" fontSize="22" fontWeight="900" fill="#1A1A1A" letterSpacing="-1">me</text>
            <text x="58" y="26" fontFamily="-apple-system, 'Apple SD Gothic Neo', sans-serif" fontSize="22" fontWeight="900" fill="#5B8FE0" letterSpacing="-1">J</text>
            <text x="71" y="26" fontFamily="-apple-system, 'Apple SD Gothic Neo', sans-serif" fontSize="22" fontWeight="900" fill="#5B8FE0" letterSpacing="-1">i</text>
            <rect x="74" y="7" width="3.5" height="3.5" fill="#D5E3F5"/>
            <rect x="74" y="12" width="3.5" height="3.5" fill="#9DBFE8"/>
            <rect x="74" y="17" width="3.5" height="3.5" fill="#5B8FE0"/>
            <text x="79" y="26" fontFamily="-apple-system, 'Apple SD Gothic Neo', sans-serif" fontSize="22" fontWeight="900" fill="#5B8FE0" letterSpacing="-1">g</text>
          </svg> />
          <button className="tj-cta" onClick={onGoExport}>모바일 배경화면</button>
          <button className="tj-icon-btn" onClick={() => setShowSettings(true)}>⚙</button>
        </div>
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
          onDuplicate={handleSubjectDuplicate}
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