import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const recommendedVideos = [
  {
    url: 'https://www.youtube.com/watch?v=atSejLAeZ9Y',
    title: '※뱃살, 옆구리살※ 빨리 빼는 10분 운동 - 복부 근력 & 유산소',
    channel: 'YouTube',
    duration: '10:33',
    icon: '🔥',
  },
  {
    url: 'https://www.youtube.com/watch?v=nmlWSMNjCQ8',
    title: '매일 아침 꼭 해야하는 12분 유산소 운동 홈트👑 (2025)',
    channel: 'YouTube',
    duration: '12:29',
    icon: '☀️',
  },
];

export default function YoutubeInputModal({ onClose, onConfirm }) {
  const { token } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  async function fetchVideoInfo(youtubeUrl, fallbackVideo = null) {
    try {
      setLoading(true);
      setError('');

      if (!token) {
        setError('로그인 인증 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
        setPreview(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/clips/transcript/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
        credentials: 'include',
        referrerPolicy: 'no-referrer-when-downgrade',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.detail || '영상 정보를 가져올 수 없습니다.');
        setPreview(null);
        return;
      }

      setPreview({
        url: youtubeUrl,
        title: data.title || fallbackVideo?.title || '제목 없음',
        channel: data.channel || fallbackVideo?.channel || 'YouTube',
        duration: data.duration || fallbackVideo?.duration || '알 수 없음',
        icon: fallbackVideo?.icon || '🎬',
      });
    } catch (err) {
      console.error('Error fetching video info:', err);
      setError('네트워크 오류가 발생했습니다.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }

  function handleUrlChange(newUrl) {
    setUrl(newUrl);
    setError('');

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)/;
    if (newUrl && youtubeRegex.test(newUrl)) {
      const timer = setTimeout(() => {
        fetchVideoInfo(newUrl);
      }, 800);
      return () => clearTimeout(timer);
    }

    setPreview(null);
  }

  function handleSelectRecommended(video) {
    setUrl(video.url);
    setPreview(null);
    setError('');
    fetchVideoInfo(video.url, video);
  }

  function handleAdd() {
    if (!preview) return;

    const id = `clip-${Date.now().toString(36).slice(0, 6)}`;
    onConfirm && onConfirm({
      id,
      label: preview.title,
      meta: preview.duration,
      url: preview.url,
      youtube_url: url,
    });
    onClose && onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="youtube-input-modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">유튜브 링크 추가</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="url-section">
            <div className="field-label">유튜브 URL</div>
            <div className="url-input-wrap">
              <input
                className={`url-input ${url ? 'has-value' : ''}`}
                value={url}
                onChange={(event) => handleUrlChange(event.target.value)}
                placeholder="링크를 여기에 붙여 넣어요"
              />
              <button
                className="btn-paste"
                onClick={() => handleSelectRecommended(recommendedVideos[0])}
              >
                추천 넣기
              </button>
            </div>
            <div className={`loading-bar ${loading ? 'active' : ''}`}>
              <div className="loading-fill" />
            </div>
            {error && (
              <div className="error-message" style={{ color: '#d32f2f', fontSize: '12px', padding: '8px 12px', marginTop: '4px' }}>
                {error}
              </div>
            )}

            <div className={`video-preview ${preview ? 'show' : ''}`}>
              {preview && (
                <div className="video-inner">
                  <div className="video-thumb">{preview.icon || '▶'}</div>
                  <div className="video-info">
                    <div className="video-title">{preview.title}</div>
                    <div className="video-channel">{preview.channel}</div>
                    <div className="video-meta">
                      <span className="video-duration">{preview.duration}</span>
                    </div>
                    <div className="verify-badge">운동 영상 확인됨</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div id="example-section">
            <div className="example-label">추천 영상에서 선택</div>
            <div className="example-chips">
              {recommendedVideos.map((video) => (
                <div key={video.url} className="example-chip" onClick={() => handleSelectRecommended(video)}>
                  <span className="example-chip-icon">{video.icon}</span>
                  <span className="example-chip-text">{video.title}</span>
                  <span className="example-chip-duration">{video.duration}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" />
        </div>

        <div className="modal-actions">
          <button className="btn-outline-sm" onClick={onClose}>취소</button>
          <button className="btn-wine-full" id="add-btn" disabled={!preview || loading} onClick={handleAdd}>영상 추가하기</button>
        </div>
      </div>
    </div>
  );
}
