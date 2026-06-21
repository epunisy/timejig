import { useRef, useEffect } from 'react';
import { t } from '../i18n';

// 본인 딸들 이름
const NAME_SAMPLES = ['민주', '민정'];

function getRandomName() {
  return NAME_SAMPLES[Math.floor(Math.random() * NAME_SAMPLES.length)];
}

export default function Setup({ onDone, onSignIn, preview, onBack }) {
  const inputRef = useRef(null);
  const composingRef = useRef(false);
  const randomNameRef = useRef(getRandomName());

  useEffect(() => {
    if (!preview && inputRef.current) inputRef.current.focus();
  }, [preview]);

  // 시간 범위·색띠 등은 기본값으로 시작 — 나중에 서식설정에서 변경
  function handleStart() {
    // 미리보기에서는 데이터를 만들지 않고 그냥 돌아감 (기존 데이터 보호)
    if (preview) { if (onBack) onBack(); return; }
    const finalName = inputRef.current.value.trim();
    onDone(finalName);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !composingRef.current) {
      handleStart();
    }
  }

  return (
    <div className="tj-setup">
      {preview && (
        <button className="tj-setup-back" onClick={onBack}>← 돌아가기 (미리보기)</button>
      )}
      <span className="tj-setup-logo-wrap">
        <img src="/logo.png" alt={t('appName')} className="tj-setup-logo" />
      </span>
      <div className="tj-setup-greeting">
        {t('welcome')}{'\n'}{t('setupGuide')}
      </div>

      <input
        ref={inputRef}
        type="text"
        className="tj-name-input tj-name-input-small"
        placeholder={`예: ${randomNameRef.current}`}
        onCompositionStart={() => { composingRef.current = true; }}
        onCompositionEnd={() => { composingRef.current = false; }}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      <button className="tj-setup-cta" onClick={handleStart}>
        {t('start')}
      </button>
      <div className="tj-setup-hint">시간·색·글꼴 등은{'\n'}나중에 ⚙ 서식설정에서 바꿀 수 있어요.</div>

      <div className="tj-setup-login">
        <div className="tj-setup-login-q">이미 만든 시간표가 있나요?</div>
        <button className="tj-setup-login-btn" onClick={onSignIn}>
          <span className="tj-g">G</span> 구글로 로그인해서 불러오기
        </button>
      </div>
    </div>
  );
}
