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
}) {
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
      <div className="action-desc">{exercise.desc}</div>

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
    </ScreenLayout>
  );
}

export default PlayerScreen;
