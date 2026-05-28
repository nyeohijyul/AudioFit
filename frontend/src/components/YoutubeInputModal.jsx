import { useState } from 'react';

export default function YoutubeInputModal({ onClose, onConfirm }) {
  const sampleUrls = [
    { url: 'https://www.youtube.com/watch?v=abc123', title: '닥터유 — 초보자 전신 20분 루틴', channel: '닥터유 Dr. Yu', duration: '32:14', icon: '🏃' },
    { url: 'https://youtu.be/def456', title: '땅끄부부 — 집에서 칼로리 폭발 HIIT', channel: '땅끄부부', duration: '18:42', icon: '🔥' },
    { url: 'https://www.youtube.com/watch?v=ghi789', title: '피지컬갤러리 — 하체 집중 스쿼트', channel: '피지컬갤러리', duration: '24:08', icon: '🦵' },
  ];

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  function handlePasteSample(idx) {
    const s = sampleUrls[idx];
    setUrl(s.url);
    setLoading(true);
    setPreview(null);
    setTimeout(() => {
      setPreview(s);
      setLoading(false);
    }, 900);
  }

  function handleAdd() {
    if (!preview) return;
    const id = `clip-${Date.now().toString(36).slice(0,6)}`;
    onConfirm && onConfirm({ id, label: preview.title, meta: preview.duration, url: preview.url });
    onClose && onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="youtube-input-modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">📺 유튜브 링크 추가</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="url-section">
            <div className="field-label">유튜브 URL</div>
            <div className="url-input-wrap">
              <input
                className={`url-input ${url ? 'has-value' : ''}`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="링크를 여기에 붙여 넣어요…"
              />
              <button className="btn-paste" onClick={() => handlePasteSample(Math.floor(Math.random()*sampleUrls.length))}>
                <span className="paste-icon">📋</span>붙여넣기
              </button>
            </div>
            <div className={`loading-bar ${loading ? 'active' : ''}`}>
              <div className="loading-fill" />
            </div>

            <div className={`video-preview ${preview ? 'show' : ''}`}>
              {preview && (
                <div className="video-inner">
                  <div className="video-thumb">{preview.icon || '▶'}</div>
                  <div className="video-info">
                    <div className="video-title">{preview.title}</div>
                    <div className="video-channel">{preview.channel} · 구독자 186만</div>
                    <div className="video-meta">
                      <span className="video-duration">⏱ {preview.duration}</span>
                    </div>
                    <div className="verify-badge">✅ 운동 영상 확인됨</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div id="example-section">
            <div className="example-label">또는 추천 채널에서 선택</div>
            <div className="example-chips">
              {sampleUrls.map((s, i) => (
                <div key={s.url} className="example-chip" onClick={() => handlePasteSample(i)}>
                  <span className="example-chip-icon">{s.icon}</span>
                  <span className="example-chip-text">{s.title}</span>
                  <span className="example-chip-duration">{s.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />
        </div>

        <div className="modal-actions">
          <button className="btn-outline-sm" onClick={onClose}>취소</button>
          <button className="btn-wine-full" id="add-btn" disabled={!preview} onClick={handleAdd}>영상 추가하기</button>
        </div>
      </div>
    </div>
  );
}
