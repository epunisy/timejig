import { useState, useRef } from 'react';

const ALL_DAYS = ['월', '화', '수', '목', '금', '토', '일'];

// 이미지를 1600px 이내 JPEG base64 로 줄여 업로드 (서버리스 본문 크기 제한 대비)
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ data: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], mediaType: 'image/jpeg', fileType: 'image' });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function pdfToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ data: reader.result.split(',')[1], mediaType: 'application/pdf', fileType: 'pdf' });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImportPlan({ onClose, onApply }) {
  const [status, setStatus] = useState('idle'); // idle | loading | review | error
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(null);
  const [mode, setMode] = useState('expand'); // expand | new
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (isPdf && file.size > 3 * 1024 * 1024) {
      setStatus('error');
      setError('PDF가 너무 커요(3MB 이하 권장). 사진으로 다시 시도해 보세요.');
      return;
    }

    setStatus('loading');
    setError('');
    try {
      const payload = isPdf ? await pdfToBase64(file) : await imageToBase64(file);
      const res = await fetch('/api/parse-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || '읽기에 실패했어요.');
      const days = (json.parsed.days || []).filter(d => d.periods?.length || d.supplies || d.notes);
      if (days.length === 0) throw new Error('계획표에서 시간표를 찾지 못했어요. 표 전체가 선명하게 나오게 다시 찍어 주세요.');
      setParsed({ ...json.parsed, days });
      setStatus('review');
    } catch (err) {
      setStatus('error');
      setError(String(err.message || err));
    }
  }

  function handleApply() {
    onApply(parsed, mode);
  }

  const orderedDays = parsed
    ? ALL_DAYS.filter(d => parsed.days.some(x => x.day === d)).map(d => parsed.days.find(x => x.day === d))
    : [];

  return (
    <div className="tj-modal-bg" onClick={onClose}>
      <div className="tj-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="tj-modal-head">
          <h3>주간학습계획표 불러오기</h3>
          <button className="tj-modal-x" onClick={onClose} aria-label="닫기">×</button>
        </div>

        {status === 'idle' && (
          <>
            <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6, marginBottom: '12px' }}>
              학교에서 받은 <b>주간학습계획표</b>를 사진이나 PDF로 올리면, AI가 읽어서 오전 학교 시간표와
              요일별 준비물·참고사항을 자동으로 채워줘요.
              <br />
              <span style={{ color: '#999', fontSize: '11px' }}>표 전체가 선명하게 보이도록 찍어주세요.</span>
            </div>
            <button className="tj-setup-cta" onClick={() => fileRef.current && fileRef.current.click()}>
              사진 / PDF 선택
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </>
        )}

        {status === 'loading' && (
          <div style={{ padding: '28px 0', textAlign: 'center', color: '#666', fontSize: '13px' }}>
            AI가 계획표를 읽고 있어요…<br />
            <span style={{ fontSize: '11px', color: '#aaa' }}>10~30초 정도 걸릴 수 있어요.</span>
          </div>
        )}

        {status === 'error' && (
          <>
            <div style={{ padding: '14px 0', color: '#A32D2D', fontSize: '13px', lineHeight: 1.6 }}>{error}</div>
            <div className="tj-modal-actions">
              <button onClick={onClose}>닫기</button>
              <button className="primary" onClick={() => { setStatus('idle'); setError(''); }}>다시 시도</button>
            </div>
          </>
        )}

        {status === 'review' && parsed && (
          <>
            <div style={{ maxHeight: '38vh', overflowY: 'auto', margin: '4px 0 12px', border: '0.5px solid #eee' }}>
              {orderedDays.map(d => (
                <div key={d.day} style={{ padding: '8px 10px', borderBottom: '0.5px solid #f0f0f0' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '3px' }}>{d.day}요일</div>
                  <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5 }}>
                    {(d.periods || []).map((p, i) => (
                      <span key={i} style={{ marginRight: '8px', whiteSpace: 'nowrap' }}>
                        {p.subject}<span style={{ color: '#aaa' }}> {p.start}</span>
                      </span>
                    ))}
                  </div>
                  {d.supplies ? <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>🎒 {d.supplies}</div> : null}
                  {d.notes ? <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>📌 {d.notes}</div> : null}
                </div>
              ))}
            </div>

            <div className="tj-mode-strip" style={{ marginBottom: '4px' }}>
              <button className={mode === 'expand' ? 'active' : ''} onClick={() => setMode('expand')}>내 시간표에 추가</button>
              <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>학교 시간표 새로 만들기</button>
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginBottom: '10px', lineHeight: 1.4 }}>
              {mode === 'expand'
                ? '지금 보는 시간표의 시간 범위를 오전까지 자동으로 넓혀 학교 일정을 함께 표시해요.'
                : '학교 일정만 담은 시간표를 새로 만들어요.'}
            </div>

            <div className="tj-modal-actions">
              <button onClick={onClose}>취소</button>
              <button className="primary" onClick={handleApply}>추가하기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
