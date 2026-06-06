import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const BRACKET_ONLY_SUBTITLE_PATTERN = /^\s*\[[^\]]+\]\s*$/;

function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function formatSecondsToTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function convertTranscriptToSubtitles(transcript) {
  if (!transcript || transcript.length === 0) return [];

  return transcript.map((item, idx) => {
    const startSec = Math.floor(item.start || 0);
    const minutes = Math.floor(startSec / 60);
    const seconds = startSec % 60;
    const time = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    let tag = '본문';
    if (idx === 0) tag = '준비';
    else if (idx === transcript.length - 1) tag = '마무리';

    return {
      time,
      tag,
      original: item.text || '',
      translated: item.text || '',
      start: item.start || 0,
      duration: item.duration || 0,
    };
  });
}

function getInitialSubtitles(rawSubtitles) {
  const isYouTubeFormat = rawSubtitles.length > 0 && rawSubtitles[0].text && !rawSubtitles[0].time;

  if (isYouTubeFormat) {
    return convertTranscriptToSubtitles(rawSubtitles);
  }

  if (rawSubtitles.length > 0) {
    return rawSubtitles;
  }

  return [];
}

function isAutoExcludedSubtitle(subtitle) {
  const text = subtitle.original || subtitle.text || subtitle.translated || '';
  return BRACKET_ONLY_SUBTITLE_PATTERN.test(text);
}

function getInitialSelectedIndexes(subtitles) {
  const hasSavedSelection = subtitles.some((subtitle) => typeof subtitle.selected === 'boolean');
  return new Set(
    subtitles
      .map((subtitle, idx) => {
        if (hasSavedSelection) {
          return subtitle.selected ? idx : null;
        }
        return isAutoExcludedSubtitle(subtitle) ? null : idx;
      })
      .filter((idx) => idx !== null)
  );
}

export default function SubtitleEditorModal({ clip, onClose, onSave }) {
  const { token, getToken } = useAuth();
  const [mode, setMode] = useState('original');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [subtitles, setSubtitles] = useState(() => getInitialSubtitles(clip?.subtitles || []));
  const [selectedIndexes, setSelectedIndexes] = useState(() => getInitialSelectedIndexes(subtitles));
  const [collapsedExercises, setCollapsedExercises] = useState(() => new Set());

  // 자막 로드 (YouTube URL에서 자막이 없을 때)
  useEffect(() => {
    if (!clip?.youtube_url) return;
    if (Array.isArray(clip.subtitles) && clip.subtitles.length > 0) return;

    const loadSubtitles = async () => {
      setIsLoadingSubtitles(true);
      setLoadError('');

      try {
        const authToken = token || (await getToken(true));
        if (!authToken) {
          setLoadError('인증 정보가 준비되지 않았습니다.');
          setIsLoadingSubtitles(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/clips/transcript/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ youtube_url: clip.youtube_url }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '자막 로드에 실패했습니다.');
        }

        const loadedSubtitles = getInitialSubtitles(data.subtitles || []);
        setSubtitles(loadedSubtitles);
        setSelectedIndexes(getInitialSelectedIndexes(loadedSubtitles));
      } catch (error) {
        setLoadError(error.message || '자막 로드 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingSubtitles(false);
      }
    };

    loadSubtitles();
  }, [clip?.youtube_url, clip?.subtitles, token, getToken]);

  const selectedCount = selectedIndexes.size;
  const isAllSelected = subtitles.length > 0 && selectedCount === subtitles.length;
  const selectedSubtitles = useMemo(
    () => subtitles.filter((_, idx) => selectedIndexes.has(idx)),
    [subtitles, selectedIndexes]
  );

  function toggleSubtitle(idx) {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIndexes(() => (
      isAllSelected ? new Set() : new Set(subtitles.map((_, idx) => idx))
    ));
  }

  async function handleSimplifySelected() {
    const authToken = token || (await getToken(true));
    if (!authToken) {
      setAiError('로그인 인증 정보가 아직 준비되지 않았습니다.');
      return;
    }

    if (selectedSubtitles.length === 0) {
      setAiError('쉬운 말로 바꿀 자막을 선택해 주세요.');
      return;
    }

    setIsAiLoading(true);
    setAiError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/clips/simplify-subtitles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ subtitles: selectedSubtitles }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'AI 변환에 실패했습니다.');
      }

      const simplifiedSubtitles = data.subtitles || [];
      setSubtitles((prev) => {
        let simplifiedIdx = 0;
        return prev.map((subtitle, idx) => {
          if (!selectedIndexes.has(idx)) return subtitle;

          const simplified = simplifiedSubtitles[simplifiedIdx] || {};
          simplifiedIdx += 1;

          return {
            ...subtitle,
            translated: simplified.translated || subtitle.translated,
            exercise: simplified.exercise || subtitle.exercise,
          };
        });
      });
      setMode('result');
    } catch (error) {
      setAiError(error.message || 'AI 변환 중 오류가 발생했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  }

  const groupedSubtitles = useMemo(() => {
    const orderedGroups = [];
    const groupMap = {};
    subtitles.forEach((subtitle, idx) => {
      const exName = subtitle.exercise || '준비/기타';
      if (!groupMap[exName]) {
        groupMap[exName] = { name: exName, items: [] };
        orderedGroups.push(groupMap[exName]);
      }
      groupMap[exName].items.push({ subtitle, idx });
    });

    orderedGroups.forEach((group) => {
      if (group.items.length === 0) return;

      const startTimes = group.items.map(({ subtitle }) => {
        if (typeof subtitle.start === 'number' && subtitle.start > 0) return subtitle.start;
        return parseTimeToSeconds(subtitle.time);
      });

      group.startTime = Math.min(...startTimes);
    });

    orderedGroups.forEach((group, idx) => {
      if (group.items.length === 0) return;

      let endTime;
      if (idx < orderedGroups.length - 1) {
        const nextGroup = orderedGroups[idx + 1];
        endTime = nextGroup.startTime;
      } else {
        const lastItem = group.items[group.items.length - 1].subtitle;
        const lastStart = typeof lastItem.start === 'number' && lastItem.start > 0 
          ? lastItem.start 
          : parseTimeToSeconds(lastItem.time);
        endTime = lastStart + (lastItem.duration || 5);
      }

      if (endTime < group.startTime) {
        endTime = group.startTime + 5;
      }

      const customDur = group.items.find(({ subtitle }) => typeof subtitle.customDuration === 'number')?.subtitle.customDuration;
      const durationSec = typeof customDur === 'number' && customDur > 0 ? customDur : Math.max(0, Math.round(endTime - group.startTime));

      group.startTimeStr = formatSecondsToTime(Math.round(group.startTime));
      group.endTimeStr = formatSecondsToTime(Math.round(endTime));
      group.durationSec = durationSec;
    });

    return orderedGroups;
  }, [subtitles]);

  function toggleCollapse(exName) {
    setCollapsedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exName)) {
        next.delete(exName);
      } else {
        next.add(exName);
      }
      return next;
    });
  }

  function handleDurationChange(exName, newDurationStr) {
    const newDuration = parseInt(newDurationStr, 10);
    setSubtitles((prev) =>
      prev.map((sub) => {
        if (sub.exercise === exName) {
          return { ...sub, customDuration: isNaN(newDuration) ? '' : newDuration };
        }
        return sub;
      })
    );
  }

  function toggleExerciseGroup(exName, selectAll) {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      const group = groupedSubtitles.find((g) => g.name === exName);
      if (group) {
        group.items.forEach(({ idx, subtitle }) => {
          if (selectAll) {
            if (!isAutoExcludedSubtitle(subtitle)) {
              next.add(idx);
            }
          } else {
            next.delete(idx);
          }
        });
      }
      return next;
    });
  }

  function handleSave() {
    const subtitlesWithSelection = subtitles.map((subtitle, idx) => ({
      ...subtitle,
      selected: selectedIndexes.has(idx),
    }));
    const aiSimplified = mode === 'result' || subtitles.some(s => s.exercise && s.exercise !== '준비/기타');
    onSave && onSave(subtitlesWithSelection, aiSimplified);
    onClose && onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="subtitle-modal">
        <div className="subtitle-modal__header">
          <div className="subtitle-modal__header-row">
            <button className="subtitle-modal__back" onClick={onClose}>←</button>
            <h2>자막 편집</h2>
            {isLoadingSubtitles && <span style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>자막 로드 중...</span>}
          </div>
          <div className="subtitle-modal__video-chip">
            <div className="subtitle-modal__thumb">YT</div>
            <div className="subtitle-modal__video-info">
              <div className="subtitle-modal__video-title">{clip?.label || '무제 영상'}</div>
              <div className="subtitle-modal__video-meta">
                구간 {subtitles.length > 0 ? subtitles[0].time : '00:00'} ~ {subtitles.length > 0 ? subtitles[subtitles.length - 1].time : '전체'} · 총 {subtitles.length}개 자막
              </div>
            </div>
          </div>
        </div>

        {loadError && (
          <div style={{ 
            padding: '12px', 
            margin: '12px 12px 0 12px', 
            background: '#ffe0e0', 
            border: '1px solid #ffcccc', 
            borderRadius: '6px', 
            color: '#c00',
            fontSize: '13px',
            fontWeight: 'bold'
          }}>
            ⚠️ {loadError}
          </div>
        )}

        <div className="subtitle-modal__controls">
          <div className="subtitle-mode-bar">
            <button className={`subtitle-mode-btn ${mode === 'original' ? 'active' : ''}`} onClick={() => setMode('original')}>원본 자막</button>
            <button className={`subtitle-mode-btn ${mode === 'compare' ? 'active' : ''}`} onClick={() => setMode('compare')}>원본 + 번역</button>
            <button className={`subtitle-mode-btn ${mode === 'result' ? 'active' : ''}`} onClick={() => setMode('result')}>결과창</button>
          </div>

          <div className="subtitle-ai-banner">
            <div className="subtitle-ai-banner__row">
              <div className="subtitle-ai-banner__icon">AI</div>
              <div>
                <div className="subtitle-ai-banner__title">AI 초보자 모드 변환</div>
                <div className="subtitle-ai-banner__sub">선택한 자막만 전문 용어를 쉽게 풀어 쓰고 운동 루틴에 맞게 정리해요</div>
              </div>
            </div>
            <button
              className="subtitle-ai-banner__button"
              onClick={handleSimplifySelected}
              disabled={isAiLoading || isLoadingSubtitles || selectedCount === 0}
            >
              {isAiLoading ? 'AI 변환 중...' : 'AI로 선택 자막 쉽게 바꾸기'}
            </button>
            {aiError && <div className="subtitle-ai-banner__error">{aiError}</div>}
          </div>
        </div>

        <div className="subtitle-list-wrap">
          {isLoadingSubtitles ? (
            <div style={{ 
              padding: '40px 20px', 
              textAlign: 'center', 
              color: '#999' 
            }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>자막을 불러오는 중입니다...</div>
              <div style={{ fontSize: '12px', color: '#bbb' }}>YouTube에서 자막을 추출하고 있어요</div>
            </div>
          ) : subtitles.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999'
            }}>
              <div style={{ fontSize: '14px' }}>자막이 없습니다</div>
              <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px' }}>이 영상은 자막을 불러올 수 없습니다</div>
            </div>
          ) : mode === 'result' ? (
            groupedSubtitles.map((group) => {
              const nonExcludedItems = group.items.filter(({ subtitle }) => !isAutoExcludedSubtitle(subtitle));
              const allSelected = nonExcludedItems.length > 0 && nonExcludedItems.every(({ idx }) => selectedIndexes.has(idx));
              const isCollapsed = collapsedExercises.has(group.name);
              return (
                <div className="exercise-group" key={group.name} style={{ marginBottom: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '12px', background: '#fff' }}>
                  <div className="exercise-group__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isCollapsed ? 'none' : '1px solid #f0f0f0', paddingBottom: '8px' }}>
                    <span
                      className="exercise-group__title"
                      onClick={() => toggleCollapse(group.name)}
                      style={{ fontWeight: 'bold', fontSize: '15px', color: '#1a1a1a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', userSelect: 'none' }}
                    >
                      <span>{isCollapsed ? '▶' : '▼'}</span> 🏃 {group.name}
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '6px' }}>
                        ({group.startTimeStr} ~ {group.endTimeStr}, {group.durationSec}초)
                      </span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <label style={{ fontSize: '11px', color: '#666' }}>동작 시간:</label>
                        <input
                          type="number"
                          min="1"
                          value={group.durationSec || ''}
                          onChange={(e) => handleDurationChange(group.name, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '56px', padding: '3px 6px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', color: 'var(--wine)' }}
                        />
                        <span style={{ fontSize: '12px', color: '#666' }}>초</span>
                      </div>
                      <button
                        className="exercise-group__select-btn"
                        onClick={() => toggleExerciseGroup(group.name, !allSelected)}
                        style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', background: '#f9f9f9', cursor: 'pointer' }}
                      >
                        {allSelected ? '동작 해제' : '동작 선택'}
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="exercise-group__items" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {group.items.map(({ subtitle, idx }) => {
                        const isSelected = selectedIndexes.has(idx);
                        const isAutoExcluded = isAutoExcludedSubtitle(subtitle);
                        return (
                          <div
                            key={`${subtitle.time}-${idx}`}
                            className={`sub-item ${isSelected ? 'selected' : ''} ${isAutoExcluded ? 'auto-excluded' : ''}`}
                            role="checkbox"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onClick={() => toggleSubtitle(idx)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                toggleSubtitle(idx);
                              }
                            }}
                          >
                            <div className="sub-check">{isSelected ? '✓' : ''}</div>
                            <div className="sub-content">
                              <div className="sub-time">
                                {subtitle.time} <span className="action-tag">{subtitle.tag}</span>
                                {isAutoExcluded && <span className="action-tag muted">자동 제외</span>}
                              </div>
                              <div className="sub-translated show">{subtitle.translated || subtitle.original}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            subtitles.map((subtitle, idx) => {
              const isSelected = selectedIndexes.has(idx);
              const isAutoExcluded = isAutoExcludedSubtitle(subtitle);

              return (
                <div
                  key={`${subtitle.time}-${idx}`}
                  className={`sub-item ${isSelected ? 'selected' : ''} ${isAutoExcluded ? 'auto-excluded' : ''}`}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onClick={() => toggleSubtitle(idx)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      toggleSubtitle(idx);
                    }
                  }}
                >
                  <div className="sub-check">{isSelected ? '✓' : ''}</div>
                  <div className="sub-content">
                    <div className="sub-time">
                      {subtitle.time} <span className="action-tag">{subtitle.tag}</span>
                      {isAutoExcluded && <span className="action-tag muted">자동 제외</span>}
                    </div>
                    <div className="sub-original">{subtitle.original}</div>
                    <div className={`translate-arrow ${mode !== 'original' ? 'show' : ''}`}>쉬운 말로</div>
                    <div className={`sub-translated ${mode !== 'original' ? 'show' : ''}`}>{subtitle.translated}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bottom-bar">
          <div className="bottom-bar-row">
            <span className="select-count"><strong id="sel-count">{selectedCount}</strong> / {subtitles.length}개 자막 선택됨</span>
            <button className="select-all-btn" onClick={toggleSelectAll} disabled={isLoadingSubtitles || subtitles.length === 0}>{isAllSelected ? '전체 해제' : '전체 선택'}</button>
          </div>
          <button className="btn-save" onClick={handleSave} disabled={selectedCount === 0 || isLoadingSubtitles}>선택한 자막으로 루틴 만들기</button>
        </div>
      </div>
    </div>
  );
}
