import { useState } from 'react';

export default function SubtitleEditorModal({ clip, onClose, onSave }) {
  const [mode, setMode] = useState('original');
  const [subtitles] = useState(
    clip?.subtitles || [
      { time: '14:32', tag: '준비', original: '자, 오늘은 코어 근육군을 집중적으로 타겟팅하는 루틴을 진행할 거예요.', translated: '자, 오늘은 배와 허리 근육을 집중적으로 단련하는 루틴을 할 거예요.' },
      { time: '15:04', tag: '동작', original: '첫 번째 동작은 버피 테스트입니다. 전신 복합 운동으로...', translated: '첫 번째 동작은 버피입니다. 서서 뛰다가...' },
    ]
  );

  function toggleMode(m) { setMode(m); }
  function handleSave() { onSave && onSave(subtitles); onClose && onClose(); }

  return (
    <div className="modal-overlay">
      <div className="subtitle-modal">
        <div className="subtitle-modal__header">
          <div className="subtitle-modal__header-row">
            <button className="subtitle-modal__back" onClick={onClose}>←</button>
            <h2>자막 편집</h2>
          </div>
          <div className="subtitle-modal__video-chip">
            <div className="subtitle-modal__thumb">▶</div>
            <div className="subtitle-modal__video-info">
              <div className="subtitle-modal__video-title">{clip?.label || '무제 영상'}</div>
              <div className="subtitle-modal__video-meta">구간 14:32 ~ 28:00 · 총 {subtitles.length}개 자막</div>
            </div>
          </div>
        </div>

        <div className="subtitle-modal__controls">
          <div className="subtitle-mode-bar">
            <button className={`subtitle-mode-btn ${mode==='original' ? 'active':''}`} onClick={()=>toggleMode('original')}>원본 자막</button>
            <button className={`subtitle-mode-btn ${mode==='compare' ? 'active':''}`} onClick={()=>toggleMode('compare')}>원본 + 번역 비교</button>
            <button className={`subtitle-mode-btn ${mode==='easy' ? 'active':''}`} onClick={()=>toggleMode('easy')}>쉬운 말만</button>
          </div>

          <div className="subtitle-ai-banner">
            <div className="subtitle-ai-banner__row">
              <div className="subtitle-ai-banner__icon">🤖</div>
              <div>
                <div className="subtitle-ai-banner__title">AI 초보자 모드 변환</div>
                <div className="subtitle-ai-banner__sub">전문 용어를 일상 언어로 바꾸고 광고·잡담 구간을 자동으로 제거해요</div>
              </div>
            </div>
            <button className="subtitle-ai-banner__button" onClick={()=>{ /* stub */ }}>✨ AI로 초보자 모드 변환하기</button>
          </div>
        </div>

        <div className="subtitle-list-wrap">
          {subtitles.map((s, i) => (
            <div key={i} className={`sub-item ${i===0? 'selected':''}`}>
              <div className={`sub-check`}>{i===0? '✓':''}</div>
              <div className="sub-content">
                <div className="sub-time">{s.time} <span className="action-tag">{s.tag}</span></div>
                <div className="sub-original">{s.original}</div>
                <div className={`translate-arrow ${mode!=='original' ? 'show' : ''}`}>↓ 쉬운 말로</div>
                <div className={`sub-translated ${mode!=='original' ? 'show' : ''}`}>{s.translated}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bottom-bar">
          <div className="bottom-bar-row">
            <span className="select-count"><strong id="sel-count">{subtitles.length}</strong> / {subtitles.length}개 자막 선택됨</span>
            <button className="select-all-btn" onClick={()=>{}}>전체 선택</button>
          </div>
          <button className="btn-save" onClick={handleSave}>✔ 선택한 자막으로 루틴 만들기</button>
        </div>
      </div>
    </div>
  );
}
