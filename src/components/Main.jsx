import { useState, useRef, useEffect } from 'react';
import { t } from '../i18n';
import Timetable from './Timetable';
import Palette from './Palette';
import Settings from './Settings';
import SubjectModal from './SubjectModal';
import ConfirmDialog from './ConfirmDialog';
import Tutorial from './Tutorial';
import TutorialList from './TutorialList';
import { resolveBackground, bgStyle } from '../App';

export default function Main({ data, setData, onGoExport, autoTutorial }) {
  const [dragSubject, setDragSubject] = useState(null);
  const [internalDragging, setInternalDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [addingTT, setAddingTT] = useState(false);
  const [renamingTT, setRenamingTT] = useState(null);
  const [ttMenuOpen, setTtMenuOpen] = useState(false);
  const newTTInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const newTTComposingRef = useRef(false);
  const renameComposingRef = useRef(false);

  // 설정 완료 직후(진짜 첫 진입)에만, 메인 화면을 잠깐 본 뒤 튜토리얼을 띄운다.
  // 일반 로드(저장된 데이터로 바로 메인) 때는 자동으로 띄우지 않음.
  useEffect(() => {
    if (!autoTutorial || data.tutorialDone) return;
    const id = setTimeout(() => setShowTutorial(true), 700);
    return () => clearTimeout(id);
  }, [autoTutorial, data.tutorialDone]);
  
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
  
  function handleTutorialClose() {
    // 어느 버튼으로 닫든 한 번 본 것으로 기록 → 다음 진입부터 자동으로 안 뜸
    setShowTutorial(false);
    setData({ ...data, tutorialDone: true });
  }
  
  const isDragging = dragSubject !== null || internalDragging;
  
  const bgTheme = resolveBackground(data.config);

  return (
    <div
      className={'tj-app' + (bgTheme.dark ? ' tj-app-dark' : '')}
      style={bgStyle(bgTheme)}
    >
      <div className="tj-topbar">
        <div className="tj-ttbar">
          <button
            className="tj-tt-current"
            onClick={() => setTtMenuOpen(o => !o)}
          >
            <span className="tj-tt-cur-name">{activeTT.name}</span>
            <span className="tj-tt-caret">▾</span>
          </button>
          {ttMenuOpen && (
            <>
              <div
                className="tj-tt-backdrop"
                onClick={() => { setTtMenuOpen(false); setRenamingTT(null); setAddingTT(false); }}
              />
              <div className="tj-tt-menu">
                {data.timetables.map(tt => {
                  const isActive = tt.id === data.activeTT;
                  if (renamingTT === tt.id) {
                    return (
                      <div key={tt.id} className="tj-tt-row editing">
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
                      </div>
                    );
                  }
                  return (
                    <div key={tt.id} className={'tj-tt-row' + (isActive ? ' active' : '')}>
                      <span
                        className="tj-tt-name"
                        onClick={() => { setData({ ...data, activeTT: tt.id }); setTtMenuOpen(false); }}
                      >
                        <span className="tj-tt-check">{isActive ? '✓' : ''}</span>
                        {tt.name}
                      </span>
                      <span className="tj-tt-act" title="이름 수정" onClick={() => setRenamingTT(tt.id)}>✎</span>
                      <span className="tj-tt-act" title="복제" onClick={() => handleDuplicate(tt.id)}>⧉</span>
                      {data.timetables.length > 1 && (
                        <span
                          className="tj-tt-act"
                          title="삭제"
                          onClick={() => { setTtMenuOpen(false); handleDeleteTimetable(tt.id); }}
                        >×</span>
                      )}
                    </div>
                  );
                })}
                {addingTT ? (
                  <div className="tj-tt-row editing">
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
                  </div>
                ) : (
                  <button className="tj-tt-addrow" onClick={() => setAddingTT(true)}>+ 새 시간표</button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="tj-action-row">
          <img src="/logo2.png" alt="TimeJig" className="tj-logo-top" />
          <button className="tj-cta" onClick={onGoExport}>모바일 배경화면</button>
          <button className="tj-settings-btn" onClick={() => setShowSettings(true)} aria-label="설정">⚙ 설정</button>
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
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="1.8"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
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
          onShowTutorial={() => { setShowSettings(false); setShowHelp(true); }}
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

      {showHelp && (
        <TutorialList onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}