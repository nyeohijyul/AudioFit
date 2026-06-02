/**
 * 1. 컴포넌트의 역할
 *    유튜브 링크·구간·번역 모드·루틴 이름을 입력하는 "새 루틴 만들기" 화면입니다.
 *
 * 2. 상태 관리
 *    클립 목록·슬라이더·번역 토글은 부모에서 관리하고 setter만 props로 받습니다.
 *    ScreenLayout이 header·스크롤 영역을 담당합니다.
 *
 * 3. 최적화 포인트
 *    TabBar와 분리되어 탭 전환 시 이 Screen만 리렌더됩니다.
 *
 * 4. 확장 방법
 *    react-hook-form·Zod 검증, YouTube oEmbed API 연동, 구간 미리보기 플레이어 추가.
 */

import { useState } from 'react';
import ScreenLayout from '../ScreenLayout';

function formatMeta(meta) {
  if (meta == null) return '';
  if (typeof meta === 'number') {
    const m = Math.floor(meta / 60);
    const s = meta % 60;
    return `${m}분 ${s}초`;
  }
  if (typeof meta === 'string') {
    // already human readable
    if (meta.includes('분') || meta.includes('초')) return meta;
    const parts = meta.split(':').map((p) => Number(p));
    if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      return `${parts[0]}분 ${parts[1]}초`;
    }
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const totalMin = parts[0] * 60 + parts[1];
      return `${totalMin}분 ${parts[2]}초`;
    }
    return meta;
  }
  return String(meta);
}

function NewRoutineScreen({
  clips,
  onAddClip,
  onDeleteClip,
  onOpenSubtitleEditor,
  onSaveRoutine,
  onMenuClick,
}) {
  const [routineName, setRoutineName] = useState('');
  const hasClips = clips.length > 0;

  const renderClipList = () => (
    <div className="clip-list">
      {clips.map((clip) => (
        <div key={clip.id} className="clip-item">
          <div className="clip-dot" />
          <button
            type="button"
            className="clip-main"
            onClick={() => onOpenSubtitleEditor && onOpenSubtitleEditor(clip.id)}
          >
            <span>{clip.label}</span>
            <span className="clip-meta">{formatMeta(clip.meta)}</span>
          </button>
          <button className="clip-delete" onClick={() => onDeleteClip && onDeleteClip(clip.id)}>삭제</button>
        </div>
      ))}
    </div>
  );

  return (
    <ScreenLayout
      screenId="screen-new"
      title="새 루틴 만들기"
      subtitle="유튜브 링크를 붙여 넣으면 AI가 자동 분석해요"
      onMenuClick={onMenuClick}
    >
      <div className="section">
        <div className="section-title-numbered">
          <div className="step-num">1</div>
          영상 리스트 만들기
        </div>
        {renderClipList()}
        <button type="button" className="btn-outline" onClick={onAddClip}>
          + 영상 추가하기
        </button>
      </div>

      <div className="section">
        <div className="section-title-numbered">
          <div className="step-num">2</div>
          자막 편집하기
        </div>
        {hasClips ? (
          renderClipList()
        ) : (
          <div className="routine-empty-state">
            <div className="routine-empty-state__title">먼저 영상을 추가해 주세요</div>
            <div className="routine-empty-state__desc">
              자막 편집은 추가된 영상의 분석 결과를 바탕으로 진행돼요.
            </div>
            <button type="button" className="routine-empty-state__button" onClick={onAddClip}>
              영상 추가하기
            </button>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title-numbered">
          <div className="step-num">3</div>
          루틴 이름 짓기
        </div>
        <input 
          className="input-field" 
          type="text" 
          placeholder="예: 아침 10분 코어 루틴" 
          value={routineName}
          onChange={(e) => setRoutineName(e.target.value)}
        />
        <button 
          type="button" 
          className="btn-wine"
          onClick={() => {
            if (routineName.trim() && onSaveRoutine) {
              onSaveRoutine(routineName.trim());
              setRoutineName('');
            }
          }}
          disabled={!routineName.trim() || !hasClips}
        >
          ✔ 루틴 저장하고 보관함에 추가
        </button>
      </div>
    </ScreenLayout>
  );
}

export default NewRoutineScreen;
