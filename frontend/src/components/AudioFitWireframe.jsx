/**
 * 1. 컴포넌트의 역할
 *    wireframe 전체를 React로 구현한 루트 컴포넌트입니다.
 *    portrait 환경에서는 phone-wrap 내부 .screen(활성 화면)만 뷰포트에 표시하고,
 *    페이지 타이틀·ScreenNav·노치·상태바는 DOM에만 유지하며 화면에서는 숨깁니다.
 *
 * 2. 상태 관리
 *    useState로 activeScreen, 플레이어, 보관함, 새 루틴, 마이페이지 상태를 한곳에서 관리합니다.
 *    원본 script.js의 전역 변수·DOM 조작을 React 단방향 데이터 흐름으로 옮겼고,
 *    setInterval은 useEffect + useRef로 정리(cleanup)해 메모리 누수를 방지합니다.
 *
 * 3. 최적화 포인트
 *    TabBar는 React.memo로 Screen과 분리. activeScreen에 따라 활성 Screen만 마운트합니다.
 *    donutOffset·endVal은 useMemo로 파생값만 재계산.
 *
 * 4. 확장 방법
 *    React Router로 screen id를 URL과 연동, Context/Zustand로 상태 분리,
 *    Player 전용 usePlayer 훅·Library 전용 useRoutines 훅으로 관심사 분리.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './AudioFitWireframe.css';
import ScreenNav from './ScreenNav';
import TabBar from './TabBar';
import {
  DONUT_RADIUS,
  EXERCISES,
  INITIAL_CLIPS,
  INITIAL_ROUTINES,
  TOTAL_SEC,
} from './constants';
import HomeScreen from './screens/HomeScreen';
import NewRoutineScreen from './screens/NewRoutineScreen';
import PlayerScreen from './screens/PlayerScreen';
import LibraryScreen from './screens/LibraryScreen';
import MyPageScreen from './screens/MyPageScreen';

/**
 * 슬라이더 값(0~max)을 종료 시각 문자열(mm:ss)로 변환합니다 (원본 updateSlider).
 * @param {number} val - range input 값
 * @returns {string} 포맷된 시간
 */
function formatEndTime(val) {
  const mins = Math.round((val * 60) / 100);
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/**
 * 도넛 링 stroke-dashoffset을 계산합니다 (원본 updateDonut).
 * @param {number} timerSec - 남은 초
 * @returns {number}
 */
function calcDonutOffset(timerSec) {
  const circ = 2 * Math.PI * DONUT_RADIUS;
  return circ * (1 - timerSec / TOTAL_SEC);
}

function AudioFitWireframe({ user, onLogout }) {
  const [activeScreen, setActiveScreen] = useState('home');

  const [ytLink, setYtLink] = useState('');
  const [clips, setClips] = useState(INITIAL_CLIPS);
  const [segSlider, setSegSlider] = useState(60);
  const [translateOn, setTranslateOn] = useState(true);

  const [curEx, setCurEx] = useState(2);
  const [timerSec, setTimerSec] = useState(24);
  const [timerRunning, setTimerRunning] = useState(false);
  const [playBtnIcon, setPlayBtnIcon] = useState('⏸');
  const [speed, setSpeed] = useState('1×');

  const [routines, setRoutines] = useState(INITIAL_ROUTINES);
  const [deletingId, setDeletingId] = useState(null);

  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [settingsToggles, setSettingsToggles] = useState({
    t1: true,
    t2: false,
    t3: false,
  });

  const timerIntervalRef = useRef(null);
  const clipIdRef = useRef(1);

  const endVal = useMemo(() => formatEndTime(segSlider), [segSlider]);
  const donutOffset = useMemo(() => calcDonutOffset(timerSec), [timerSec]);

  /**
   * 화면을 전환합니다. TabBar는 유지되고 활성 Screen만 교체됩니다 (원본 showScreen).
   * @param {string} screenId - home | new | player | library | mypage
   */
  const showScreen = useCallback((screenId) => {
    setActiveScreen(screenId);
  }, []);

  /**
   * activeScreen에 해당하는 Screen만 렌더링해 TabBar와 렌더 경계를 분리합니다.
   * @returns {React.ReactElement|null}
   */
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'home':
        return <HomeScreen onNavigate={showScreen} />;
      case 'new':
        return (
          <NewRoutineScreen
            ytLink={ytLink}
            setYtLink={setYtLink}
            clips={clips}
            onAddClip={handleAddClip}
            segSlider={segSlider}
            setSegSlider={setSegSlider}
            endVal={endVal}
            translateOn={translateOn}
            onToggleTranslate={handleToggleTranslate}
          />
        );
      case 'player':
        return (
          <PlayerScreen
            curEx={curEx}
            timerSec={timerSec}
            donutOffset={donutOffset}
            playBtnIcon={playBtnIcon}
            speed={speed}
            onTogglePlay={handleTogglePlay}
            onNextExercise={handleNextExercise}
            onPrevExercise={handlePrevExercise}
            onSeekForward={handleSeekForward}
            onSeekBack={handleSeekBack}
            onSetSpeed={handleSetSpeed}
          />
        );
      case 'library':
        return (
          <LibraryScreen
            onNavigate={showScreen}
            routines={routines}
            deletingId={deletingId}
            onDeleteRoutine={handleDeleteRoutine}
          />
        );
      case 'mypage':
        return (
          <MyPageScreen
            user={user}
            onLogout={onLogout}
            fitnessLevel={fitnessLevel}
            onSetLevel={handleSetLevel}
            settingsToggles={settingsToggles}
            onToggleSetting={handleToggleSetting}
          />
        );
      default:
        return <HomeScreen onNavigate={showScreen} />;
    }
  };

  /**
   * 1초 간격 타이머를 시작합니다 (원본 startTimer).
   */
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setTimerRunning(true);
    setPlayBtnIcon('⏸');
    timerIntervalRef.current = setInterval(() => {
      setTimerSec((prev) => {
        if (prev > 0) {
          return prev - 1;
        }
        return prev;
      });
    }, 1000);
  }, []);

  /**
   * 타이머를 일시정지합니다 (원본 togglePlay 일부).
   */
  const pauseTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);
    setPlayBtnIcon('▶');
  }, []);

  /**
   * 플레이어 화면으로 전환될 때만 타이머 자동 시작 (원본 showScreen — 일시정지 시 재시작 방지).
   */
  useEffect(() => {
    if (activeScreen === 'player') {
      startTimer();
    }
  }, [activeScreen, startTimer]);

  /**
   * 타이머가 0이 되면 다음 동작으로 이동 (원본 interval else nextExercise).
   */
  useEffect(() => {
    if (timerSec === 0 && timerRunning) {
      setCurEx((idx) => {
        if (idx < EXERCISES.length - 1) {
          return idx + 1;
        }
        return idx;
      });
      setTimerSec(TOTAL_SEC);
    }
  }, [timerSec, timerRunning]);

  /**
   * 동작 인덱스가 바뀌면 타이머를 초기화합니다 (원본 renderExercise).
   */
  useEffect(() => {
    setTimerSec(TOTAL_SEC);
  }, [curEx]);

  /**
   * 언마운트 시 interval 정리.
   */
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  /**
   * 재생/일시정지 토글 (원본 togglePlay).
   */
  const handleTogglePlay = useCallback(() => {
    if (timerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }, [timerRunning, pauseTimer, startTimer]);

  /**
   * 다음 동작 (원본 nextExercise).
   */
  const handleNextExercise = useCallback(() => {
    setCurEx((idx) => (idx < EXERCISES.length - 1 ? idx + 1 : idx));
  }, []);

  /**
   * 이전 동작 (원본 prevExercise).
   */
  const handlePrevExercise = useCallback(() => {
    setCurEx((idx) => (idx > 0 ? idx - 1 : idx));
  }, []);

  /**
   * 10초 앞으로 (원본 seekForward — 남은 시간 감소).
   */
  const handleSeekForward = useCallback(() => {
    setTimerSec((s) => Math.max(0, s - 10));
  }, []);

  /**
   * 10초 뒤로 (원본 seekBack).
   */
  const handleSeekBack = useCallback(() => {
    setTimerSec((s) => Math.min(TOTAL_SEC, s + 10));
  }, []);

  /**
   * 배속 칩 선택 (원본 setSpeed).
   * @param {string} label
   */
  const handleSetSpeed = useCallback((label) => {
    setSpeed(label);
  }, []);

  /**
   * 유튜브 클립 추가 (원본 addClip).
   */
  const handleAddClip = useCallback(() => {
    const trimmed = ytLink.trim();
    const label = trimmed ? `${trimmed.slice(0, 28)}…` : '새 영상 클립';
    const id = `clip-${clipIdRef.current}`;
    clipIdRef.current += 1;
    setClips((prev) => [...prev, { id, label, meta: '전체 구간' }]);
    setYtLink('');
  }, [ytLink]);

  /**
   * 번역 모드 토글 반전.
   */
  const handleToggleTranslate = useCallback(() => {
    setTranslateOn((v) => !v);
  }, []);

  /**
   * 보관함 루틴 삭제 + 페이드 아웃 (원본 deleteRoutine).
   * @param {string} id
   */
  const handleDeleteRoutine = useCallback((id) => {
    setDeletingId(id);
    setTimeout(() => {
      setRoutines((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
    }, 200);
  }, []);

  /**
   * 체력 수준 버튼 선택 (원본 setLevel).
   * @param {string} levelId
   */
  const handleSetLevel = useCallback((levelId) => {
    setFitnessLevel(levelId);
  }, []);

  /**
   * 마이페이지 설정 토글 (원본 toggleSwitch).
   * @param {string} key - t1 | t2 | t3
   */
  const handleToggleSetting = useCallback((key) => {
    setSettingsToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="audiofit-wireframe audiofit-portrait">
      {/* [사용하지 않음] 와이어프레임 데모용 페이지 타이틀 — portrait에서 미표시 */}
      <div className="page-title wireframe-unused" aria-hidden="true">
        <h1>🎙 AudioFit</h1>
        <p>나만의 홈트 라디오 — 모바일 UI 와이어프레임</p>
      </div>

      {/* [사용하지 않는 컴포넌트] ScreenNav — portrait에서 미표시, TabBar로 화면 전환 */}
      <div className="wireframe-unused" aria-hidden="true">
        <ScreenNav activeScreen={activeScreen} onNavigate={showScreen} />
      </div>

      <div className="phone-wrap">
        <div className="phone-shell app-shell">
          {/* [사용하지 않음] 폰 목업 크롬 — portrait에서 미표시 */}
          <div className="notch wireframe-unused" aria-hidden="true" />

          <div className="status-bar wireframe-unused" aria-hidden="true">
            <span className="time">9:41</span>
            <div className="icons">
              <span>●●●</span>
              <span>WiFi</span>
              <span>🔋</span>
            </div>
          </div>

          <div className="screen-area" key={activeScreen}>
            {renderActiveScreen()}
          </div>

          <TabBar activeScreen={activeScreen} onNavigate={showScreen} />
        </div>
      </div>
    </div>
  );
}

export default AudioFitWireframe;
