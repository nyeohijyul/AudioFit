/**
 * 1. 컴포넌트의 역할
 *    운동 재생 화면: 도넛 타이머, 동작명·설명, 재생 컨트롤, 배속 칩을 표시합니다.
 *
 * 2. 상태 관리
 *    curEx, timerSec 등은 부모에서 관리. ScreenLayout이 header·스크롤을 담당합니다.
 *
 * 3. 최적화 포인트
 *    TabBar와 분리. timerSec 변경 시 이 Screen만 리렌더됩니다.
 *
 * 4. 확장 방법
 *    Web Audio API·TTS 코칭, 실제 경과 시간 progress-fill 연동, useReducer로 플레이어 FSM.
 */

import ScreenLayout from '../ScreenLayout';
import { EXERCISES as DEFAULT_EXERCISES } from '../constants';

const SPEED_OPTIONS = ['0.75×', '1×', '1.25×', '1.5×'];

function PlayerScreen({
  curEx,
  timerSec,
  donutOffset,
  playBtnIcon,
  speed,
  onTogglePlay,
  onNextExercise,
  onPrevExercise,
  onSeekForward,
  onSeekBack,
  onSetSpeed,
  routineName,
  exercises = DEFAULT_EXERCISES,
  ttsPhase,
  currentTtsText,
  ttsProgress,
  ttsAudioRef,
  onTTSEnd,
  isFinished,
  onGoHome,
}) {
  if (isFinished) {
    return (
      <ScreenLayout screenId="screen-player-finished" title="운동 완료! 🎉" subtitle="오늘 하루도 한 단계 더 건강해졌어요!">
        <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '4.5rem' }}>🏆</div>
          <h2 style={{ color: 'var(--wine)', fontWeight: 700, margin: 0 }}>참 잘하셨어요!</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 16px' }}>
            선택한 루틴의 모든 동작을 완료했습니다.<br />
            마이페이지의 <strong>기록된 운동 횟수</strong>가 1회 추가되었습니다.
          </p>
          <button type="button" className="btn-wine" onClick={onGoHome} style={{ width: '100%', maxWidth: '240px' }}>
            홈으로 돌아가기
          </button>
        </div>
      </ScreenLayout>
    );
  }

  const exercise = exercises[curEx] || { name: '완료', desc: '모든 운동이 끝났습니다!', next: '없음', duration: 30 };

  const playerHeader = (
    <div className="header-row screen-header__row">
      <div className="screen-header__titles">
        <h2>{routineName || '아침 5분 코어 깨우기'}</h2>
        <p>
          {curEx + 1} / {exercises.length}번째 동작
        </p>
      </div>
      <span className="header-icon">🔊</span>
    </div>
  );

  return (
    <ScreenLayout screenId="screen-player" headerExtra={playerHeader}>
      <div className="progress-bar-wrap pt">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(timerSec / (exercise.duration || 30)) * 100}%` }} />
        </div>
        <div className="progress-labels">
          <span>{timerSec}초 남음</span>
          <span>{exercise.duration || 30}초 전체</span>
        </div>
      </div>

      <div className="player-donut">
        <svg className="donut-svg" width="148" height="148" viewBox="0 0 148 148">
          <circle cx="74" cy="74" r="58" fill="none" stroke="var(--surface2)" strokeWidth="12" />
          <circle
            cx="74"
            cy="74"
            r="58"
            fill="none"
            stroke="var(--wine)"
            strokeWidth="12"
            strokeDasharray="364"
            strokeDashoffset={donutOffset}
            strokeLinecap="round"
            transform="rotate(-90 74 74)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="donut-center">
          <div className="donut-time">{timerSec}</div>
          <div className="donut-label">초 남음</div>
        </div>
      </div>

      <div className="action-big">{exercise.name}</div>

      {/* TTS 재생 중일 때 현재 텍스트만 보여줌 */}
      {ttsPhase === 'playing' ? (
        <div className="tts-display">
          <div className="tts-label">설명 재생 중...</div>
          <div className="tts-text">{currentTtsText}</div>
          <div className="tts-progress-bar">
            <div className="tts-progress-fill" style={{ width: `${ttsProgress}%` }} />
          </div>
        </div>
      ) : (
        <div className="action-desc">{exercise.desc}</div>
      )}

      <div className="next-hint">
        다음 동작 → <strong>{exercise.next}</strong>
      </div>

      <div className="controls">
        <button type="button" className="ctrl" onClick={onPrevExercise} title="이전">
          ⏮
        </button>
        <button type="button" className="ctrl" onClick={onSeekBack} title="-10초">
          ⏪
        </button>
        <button type="button" className="ctrl main" onClick={onTogglePlay}>
          {playBtnIcon}
        </button>
        <button type="button" className="ctrl" onClick={onSeekForward} title="+10초">
          ⏩
        </button>
        <button type="button" className="ctrl" onClick={onNextExercise} title="다음">
          ⏭
        </button>
      </div>

      <div className="speed-chips">
        {SPEED_OPTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className={`speed-chip${speed === label ? ' active' : ''}`}
            onClick={() => onSetSpeed(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 숨겨진 오디오 엘리먼트: 재생 완료 시 onTTSEnd 호출 */}
      <audio ref={ttsAudioRef} style={{ display: 'none' }} onEnded={onTTSEnd} />
    </ScreenLayout>
  );
}

export default PlayerScreen;
