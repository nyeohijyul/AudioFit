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
import { useAuth } from '../contexts/AuthContext';
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
import YoutubeInputModal from './YoutubeInputModal';
import SubtitleEditorModal from './SubtitleEditorModal';
import usePlayerTTS from '../hooks/usePlayerTTS';

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
  const { token, getToken } = useAuth();
  const [activeScreen, setActiveScreen] = useState('home');

  const [ytLink, setYtLink] = useState('');
  const [clips, setClips] = useState(INITIAL_CLIPS);
  const [segSlider, setSegSlider] = useState(60);
  const [translateOn, setTranslateOn] = useState(true);

  const [currentRoutine, setCurrentRoutine] = useState(null);
  const [curEx, setCurEx] = useState(0);
  const [timerSec, setTimerSec] = useState(30);
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

  // TTS 훅
  const { ttsPhase, currentTtsText, ttsProgress, ttsAudioRef, playTTS, stopTTS } = usePlayerTTS(token, getToken);

  // Helper to map routine subtitles to player exercises dynamically
  const activeExercises = useMemo(() => {
    if (!currentRoutine || !currentRoutine.clips || currentRoutine.clips.length === 0) {
      return EXERCISES;
    }

    const exercises = [];
    currentRoutine.clips.forEach((clip) => {
      const grouped = {};
      const orderedNames = [];

      (clip.subtitles || []).forEach((sub) => {
        if (!sub.selected) return;
        const exName = sub.exercise || '준비/기타';
        if (!grouped[exName]) {
          grouped[exName] = [];
          orderedNames.push(exName);
        }
        grouped[exName].push(sub);
      });

      orderedNames.forEach((exName, idx) => {
        const items = grouped[exName];
        const desc = items.map((sub) => sub.translated || sub.original).join(' ');

        const startTimes = items.map((sub) => {
          if (typeof sub.start === 'number') return sub.start;
          const parts = (sub.time || '00:00').split(':').map(Number);
          return (parts[0] || 0) * 60 + (parts[1] || 0);
        });
        const minStart = Math.min(...startTimes);

        let maxEnd = Math.max(...items.map((sub) => {
          if (typeof sub.start === 'number') return sub.start + (sub.duration || 5);
          const parts = (sub.time || '00:00').split(':').map(Number);
          return (parts[0] || 0) * 60 + (parts[1] || 0) + 5;
        }));

        if (idx < orderedNames.length - 1) {
          const nextExName = orderedNames[idx + 1];
          const nextItems = grouped[nextExName];
          const nextStartTimes = nextItems.map((sub) => {
            if (typeof sub.start === 'number') return sub.start;
            const parts = (sub.time || '00:00').split(':').map(Number);
            return (parts[0] || 0) * 60 + (parts[1] || 0);
          });
          maxEnd = Math.min(...nextStartTimes);
        }

        const durationSec = Math.max(5, Math.round(maxEnd - minStart));

        exercises.push({
          name: exName,
          desc: desc || '이 동작에 대한 설명이 없습니다.',
          duration: durationSec,
          next: orderedNames[idx + 1] || '마무리/완료!',
        });
      });
    });

    return exercises.length > 0 ? exercises : EXERCISES;
  }, [currentRoutine]);

  const endVal = useMemo(() => formatEndTime(segSlider), [segSlider]);
  const donutOffset = useMemo(() => {
    const total = activeExercises[curEx]?.duration || 30;
    const circ = 2 * Math.PI * DONUT_RADIUS;
    return circ * (1 - timerSec / total);
  }, [timerSec, curEx, activeExercises]);

  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState(null);

  // const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  // const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  // const [selectedClipId, setSelectedClipId] = useState(null);

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
            onDeleteClip={handleDeleteClip}
            onOpenSubtitleEditor={handleOpenSubtitleEditor}
            segSlider={segSlider}
            setSegSlider={setSegSlider}
            endVal={endVal}
            translateOn={translateOn}
            onToggleTranslate={handleToggleTranslate}
            onSaveRoutine={handleSaveRoutine}
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
            routineName={currentRoutine?.name}
            exercises={activeExercises}
            ttsPhase={ttsPhase}
            currentTtsText={currentTtsText}
            ttsProgress={ttsProgress}
            ttsAudioRef={ttsAudioRef}
            onTTSEnd={() => {
              // TTS 완료 시 타이머 시작
              const ex = activeExercises[curEx];
              setTimerSec(ex?.duration || 30);
              startTimer();
            }}
          />
        );
      case 'library':
        return (
          <LibraryScreen
            onNavigate={showScreen}
            routines={routines}
            deletingId={deletingId}
            onDeleteRoutine={handleDeleteRoutine}
            onPlayRoutine={handlePlayRoutine}
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

  // Play TTS on exercise change when player is active
  useEffect(() => {
    if (activeScreen !== 'player' || !token) return;
    const ex = activeExercises[curEx];
    if (!ex) return;

    stopTTS();
    // playTTS will start audio and onEnded callback will start timer
    playTTS(ex.desc, () => {
      setTimerSec(ex.duration || 30);
      startTimer();
    });
  }, [curEx, activeScreen, activeExercises, token, playTTS, stopTTS, startTimer]);

  /**
   * 타이머가 0이 되면 다음 동작으로 이동 (원본 interval else nextExercise).
   */
  useEffect(() => {
    if (timerSec === 0 && timerRunning) {
      setCurEx((idx) => {
        if (idx < activeExercises.length - 1) {
          return idx + 1;
        }
        return idx;
      });
      const nextDuration = activeExercises[curEx + 1]?.duration || 30;
      setTimerSec(nextDuration);
    }
  }, [timerSec, timerRunning, activeExercises, curEx]);

  /**
   * 동작 인덱스가 바뀌면 타이머를 초기화합니다 (원본 renderExercise).
   */
  useEffect(() => {
    const duration = activeExercises[curEx]?.duration || 30;
    setTimerSec(duration);
  }, [curEx, activeExercises]);

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
    setCurEx((idx) => (idx < activeExercises.length - 1 ? idx + 1 : idx));
  }, [activeExercises.length]);

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
    const total = activeExercises[curEx]?.duration || 30;
    setTimerSec((s) => Math.min(total, s + 10));
  }, [curEx, activeExercises]);

  const handlePlayRoutine = useCallback((routine) => {
    setCurrentRoutine(routine);
    setCurEx(0);
    const firstDuration = routine.clips?.[0]?.subtitles?.filter(s => s.selected)?.length > 0 ? 30 : 30; // computed on state change
    setTimerSec(30);
    showScreen('player');
  }, [showScreen]);

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
    // Open the modal to add a clip (frontend wireframe)
    setShowYoutubeModal(true);
  }, [ytLink]);

  const handleConfirmAddClip = useCallback(async (payload) => {
    const id = payload.id || `clip-${clipIdRef.current++}`;
    const label = payload.label || '새 영상 클립';
    const meta = payload.meta || payload.duration || '전체 구간';
    const url = payload.url;
    const youtube_url = payload.youtube_url;

    // 먼저 clip을 추가 (자막은 로딩 중)
    const newClip = { id, label, meta, url, subtitles: [] };
    setClips((prev) => [...prev, newClip]);
    setShowYoutubeModal(false);

    // youtube_url이 있으면 자막 API 호출
    if (youtube_url && token) {
      try {
        const response = await fetch('http://localhost:8000/api/v1/clips/transcript/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ youtube_url }),
        });

        if (response.ok) {
          const data = await response.json();
          // clip의 subtitles 업데이트
          setClips((prev) =>
            prev.map((c) =>
              c.id === id ? { ...c, subtitles: data.subtitles || [] } : c
            )
          );
        } else {
          console.error('자막 로드 실패:', response.status);
        }
      } catch (error) {
        console.error('자막 API 호출 오류:', error);
      }
    }
  }, [token]);

  const handleDeleteClip = useCallback((id) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleOpenSubtitleEditor = useCallback((clipId) => {
    setSelectedClipId(clipId);
    setShowSubtitleModal(true);
  }, []);

  const handleSaveSubtitles = useCallback(async (subtitles) => {
    setClips((prev) => prev.map((c) => (c.id === selectedClipId ? { ...c, subtitles } : c)));
    setShowSubtitleModal(false);

    const clip = clips.find((c) => c.id === selectedClipId);
    if (clip && token) {
      try {
        const videoIdMatch = clip.url ? clip.url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/) : null;
        const videoId = videoIdMatch ? videoIdMatch[1] : '';

        if (videoId) {
          await fetch('http://localhost:8000/api/v1/clips/save-user-clip/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              video_id: videoId,
              subtitles: subtitles,
              youtube_url: clip.url,
              title: clip.label,
              duration: clip.meta,
            }),
          });
        }
      } catch (error) {
        console.error('자막 서버 저장 중 오류 발생:', error);
      }
    }
  }, [selectedClipId, clips, token]);

  /**
   * 번역 모드 토글 반전.
   */
  const handleToggleTranslate = useCallback(() => {
    setTranslateOn((v) => !v);
  }, []);

  useEffect(() => {
    async function fetchRoutines() {
      if (!token) return;
      try {
        const response = await fetch('http://localhost:8000/api/v1/routines/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const mappedRoutines = data.map((r) => ({
            id: String(r.id),
            thumb: '🧘',
            name: r.name,
            meta: `${r.clips?.length || 0}개 영상 루틴 · 초보자`,
            clips: r.clips,
          }));
          setRoutines(mappedRoutines);
        }
      } catch (error) {
        console.error('루틴 로드 실패:', error);
      }
    }
    fetchRoutines();
  }, [token]);

  const handleSaveRoutine = useCallback(async (name) => {
    const id = `routine-${Date.now()}`;
    const newRoutine = {
      id,
      thumb: '🧘',
      name,
      meta: `${clips.length}개 영상 루틴 · 초보자`,
      clips: clips,
    };
    setRoutines((prev) => [newRoutine, ...prev]);
    showScreen('library');

    if (token) {
      try {
        const response = await fetch('http://localhost:8000/api/v1/routines/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            clips,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setRoutines((prev) =>
            prev.map((r) =>
              r.id === id
                ? {
                  ...r,
                  id: String(data.id),
                }
                : r
            )
          );
        }
      } catch (error) {
        console.error('루틴 서버 저장 실패:', error);
      }
    }
  }, [clips, token, showScreen]);

  /**
   * 보관함 루틴 삭제 + 페이드 아웃 (원본 deleteRoutine).
   * @param {string} id
   */
  const handleDeleteRoutine = useCallback(async (id) => {
    setDeletingId(id);
    setTimeout(() => {
      setRoutines((prev) => prev.filter((r) => r.id !== id));
      setDeletingId(null);
    }, 200);

    if (token && !String(id).startsWith('routine-')) {
      try {
        await fetch(`http://localhost:8000/api/v1/routines/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('루틴 서버 삭제 실패:', error);
      }
    }
  }, [token]);

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

          {showYoutubeModal && (
            <YoutubeInputModal onClose={() => setShowYoutubeModal(false)} onConfirm={handleConfirmAddClip} />
          )}

          {showSubtitleModal && (
            <SubtitleEditorModal
              clip={clips.find((c) => c.id === selectedClipId) || null}
              onClose={() => setShowSubtitleModal(false)}
              onSave={handleSaveSubtitles}
            />
          )}

          <TabBar activeScreen={activeScreen} onNavigate={showScreen} />
        </div>
      </div>
    </div>
  );
}

export default AudioFitWireframe;
