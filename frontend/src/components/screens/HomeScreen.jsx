import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ScreenLayout from '../ScreenLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const BACKEND_EXERCISES_URL = `${API_BASE_URL}/api/v1/exercises/`;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || '';
const EXERCISEDB_API_URL = import.meta.env.VITE_EXERCISEDB_API_URL || '';

const QUESTIONS = [
  {
    id: 'goal',
    title: '오늘 운동 목표가 무엇인가요?',
    sub: '목표에 맞춰 맨몸 운동 데이터를 먼저 좁혀요.',
    options: [
      { value: 'fatburn', label: '지방 태우기', desc: '전신과 심폐 자극 위주' },
      { value: 'strength', label: '근력 강화', desc: '상체, 하체, 코어 근력' },
      { value: 'mobility', label: '유연성 회복', desc: '부담 적은 스트레칭' },
    ],
  },
  {
    id: 'duration',
    title: '운동 시간은 어느 정도가 좋나요?',
    sub: '선택한 시간에 맞춰 루틴 클립 길이를 제안해요.',
    options: [
      { value: 'short', label: '10~15분', desc: '가볍게 시작' },
      { value: 'medium', label: '20~30분', desc: '균형 있는 루틴' },
      { value: 'long', label: '35분 이상', desc: '충분한 운동량' },
    ],
  },
  {
    id: 'level',
    title: '현재 운동 난이도는 어느 쪽인가요?',
    sub: 'ExerciseDB 데이터와 앱 내부 난이도 태그를 함께 사용해요.',
    options: [
      { value: 'beginner', label: '초보자', desc: '낮은 충격과 기본 동작' },
      { value: 'intermediate', label: '중급자', desc: '반복과 강도 증가' },
      { value: 'advanced', label: '상급자', desc: '복합 동작 중심' },
    ],
  },
  {
    id: 'focus',
    title: '집중하고 싶은 부위가 있나요?',
    sub: 'ExerciseDB의 bodyPart와 target 필드로 필터링해요.',
    multi: true,
    options: [
      { value: 'waist', label: '코어', desc: '복부와 허리 안정성' },
      { value: 'upper legs', label: '하체', desc: '허벅지와 둔근' },
      { value: 'chest', label: '상체', desc: '가슴, 어깨, 팔' },
      { value: 'cardio', label: '전신', desc: '심폐와 전신 움직임' },
    ],
  },
  {
    id: 'avoid',
    title: '피하고 싶은 부담이 있나요?',
    sub: '해당 키워드가 포함된 동작을 결과에서 낮추거나 제외해요.',
    options: [
      { value: 'none', label: '없음', desc: '전체 맨몸 동작 사용' },
      { value: 'knee', label: '무릎 부담', desc: '점프와 깊은 굽힘 제외' },
      { value: 'wrist', label: '손목 부담', desc: '손 짚는 동작 제외' },
    ],
  },
];

const FALLBACK_EXERCISES = [
  {
    id: '0001',
    name: 'plank',
    koName: '플랭크',
    bodyPart: 'waist',
    target: 'abs',
    equipment: 'body weight',
    level: ['beginner', 'intermediate', 'advanced'],
    goals: ['strength', 'fatburn'],
    avoid: [],
    description: '팔꿈치로 지지하며 몸을 일자로 유지하는 코어 안정화 동작입니다.',
  },
  {
    id: '0002',
    name: 'glute bridge',
    koName: '힙 브리지',
    bodyPart: 'upper legs',
    target: 'glutes',
    equipment: 'body weight',
    level: ['beginner', 'intermediate'],
    goals: ['strength', 'mobility'],
    avoid: [],
    description: '누워서 엉덩이를 들어 올려 둔근과 코어를 깨우는 맨몸 동작입니다.',
  },
  {
    id: '0003',
    name: 'push-up',
    koName: '푸시업',
    bodyPart: 'chest',
    target: 'pectorals',
    equipment: 'body weight',
    level: ['intermediate', 'advanced'],
    goals: ['strength'],
    avoid: ['wrist'],
    description: '가슴과 팔을 쓰며 몸통을 단단히 유지하는 대표적인 상체 운동입니다.',
  },
  {
    id: '0004',
    name: 'mountain climber',
    koName: '마운틴 클라이머',
    bodyPart: 'cardio',
    target: 'cardiovascular system',
    equipment: 'body weight',
    level: ['intermediate', 'advanced'],
    goals: ['fatburn'],
    avoid: ['wrist'],
    description: '플랭크 자세에서 무릎을 번갈아 당기는 전신 심폐 운동입니다.',
  },
  {
    id: '0005',
    name: 'bodyweight squat',
    koName: '맨몸 스쿼트',
    bodyPart: 'upper legs',
    target: 'quads',
    equipment: 'body weight',
    level: ['beginner', 'intermediate', 'advanced'],
    goals: ['strength', 'fatburn'],
    avoid: ['knee'],
    description: '앉았다 일어나며 허벅지와 둔근을 강화하는 기본 하체 운동입니다.',
  },
  {
    id: '0006',
    name: 'dead bug',
    koName: '데드 버그',
    bodyPart: 'waist',
    target: 'abs',
    equipment: 'body weight',
    level: ['beginner', 'intermediate'],
    goals: ['strength', 'mobility'],
    avoid: [],
    description: '누운 자세에서 팔다리를 교차로 뻗어 코어 조절력을 높입니다.',
  },
  {
    id: '0007',
    name: 'jumping jack',
    koName: '점핑 잭',
    bodyPart: 'cardio',
    target: 'cardiovascular system',
    equipment: 'body weight',
    level: ['beginner', 'intermediate', 'advanced'],
    goals: ['fatburn'],
    avoid: ['knee'],
    description: '팔과 다리를 동시에 벌리고 모으며 몸을 빠르게 데우는 전신 동작입니다.',
  },
  {
    id: '0008',
    name: 'cat cow stretch',
    koName: '고양이-소 자세',
    bodyPart: 'back',
    target: 'spine',
    equipment: 'body weight',
    level: ['beginner', 'intermediate'],
    goals: ['mobility'],
    avoid: ['wrist'],
    description: '등을 둥글게 말고 펴며 척추와 호흡을 부드럽게 정리합니다.',
  },
];

const MOCK_VIDEO_TEMPLATES = [
  { channel: 'AudioFit Guide', duration: '10:30', views: '32만회' },
  { channel: 'Home Training Lab', duration: '18:45', views: '21만회' },
  { channel: 'Daily Bodyweight', duration: '07:55', views: '14만회' },
];

function normalizeExercise(exercise) {
  return {
    id: exercise.id || exercise.exerciseId || exercise.name,
    name: exercise.name || '',
    koName: exercise.koName || exercise.ko_name || exercise.name || '',
    bodyPart: exercise.bodyPart || exercise.body_part || '',
    target: exercise.target || '',
    equipment: exercise.equipment || '',
    gifUrl: exercise.gifUrl || exercise.gif_url || '',
    level: exercise.level || ['beginner', 'intermediate', 'advanced'],
    goals: exercise.goals || ['strength'],
    avoid: exercise.avoid || [],
    description:
      exercise.description ||
      exercise.instructions?.[0] ||
      `${exercise.name} 동작을 천천히 따라 하며 자세를 유지합니다.`,
  };
}

function parseYoutubeDuration(isoDuration) {
  const match = isoDuration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const totalMinutes = hours * 60 + minutes;
  return `${totalMinutes}:${String(seconds).padStart(2, '0')}`;
}

function buildMockVideos(exercise) {
  return MOCK_VIDEO_TEMPLATES.map((video, index) => ({
    id: `mock-${exercise.id}-${index}`,
    title: `${exercise.koName} 초보 홈트 가이드 ${index + 1}`,
    channel: video.channel,
    duration: video.duration,
    views: video.views,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.koName} 맨몸 운동`)}`,
    thumbnail: '',
    topPick: index === 0,
  }));
}

function labelFor(questionId, value) {
  const question = QUESTIONS.find((item) => item.id === questionId);
  if (Array.isArray(value)) {
    return value
      .map((entry) => question?.options.find((option) => option.value === entry)?.label || entry)
      .join(', ');
  }
  return question?.options.find((option) => option.value === value)?.label || value;
}

function secondsForDuration(duration) {
  if (duration === 'short') return 30;
  if (duration === 'long') return 60;
  return 45;
}

function HomeScreen({ onMenuClick, onEditRecommendedRoutine }) {
  const { token, getToken } = useAuth();
  const [answers, setAnswers] = useState({
    focus: ['waist', 'cardio'],
  });
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('questions');
  const [exercises, setExercises] = useState([]);
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const [videoMap, setVideoMap] = useState({});
  const [routineClips, setRoutineClips] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const currentQuestion = QUESTIONS[step];
  const activeExercise = exercises.find((exercise) => exercise.id === activeExerciseId) || exercises[0];
  const activeVideos = activeExercise ? videoMap[activeExercise.id] || [] : [];

  const summaryChips = useMemo(
    () =>
      QUESTIONS
        .filter((question) => answers[question.id] != null && answers[question.id].length !== 0)
        .map((question) => labelFor(question.id, answers[question.id])),
    [answers],
  );

  const filteredExercises = useMemo(() => {
    const selectedFocus = answers.focus?.length ? answers.focus : ['waist', 'cardio'];
    const avoid = answers.avoid || 'none';
    return exercises.filter((exercise) => {
      const matchesEquipment = exercise.equipment === 'body weight' || exercise.equipment === 'bodyweight';
      const matchesFocus = selectedFocus.includes(exercise.bodyPart) || selectedFocus.includes(exercise.target);
      const matchesGoal = !answers.goal || exercise.goals.includes(answers.goal);
      const matchesLevel = !answers.level || exercise.level.includes(answers.level);
      const passesAvoid = avoid === 'none' || !exercise.avoid.includes(avoid);
      return matchesEquipment && matchesFocus && matchesGoal && matchesLevel && passesAvoid;
    });
  }, [answers, exercises]);

  const handleAnswer = (value) => {
    if (currentQuestion.multi) {
      setAnswers((prev) => {
        const current = prev[currentQuestion.id] || [];
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        return { ...prev, [currentQuestion.id]: next };
      });
      return;
    }
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const fetchExercises = async () => {
    try {
      const response = await fetch(BACKEND_EXERCISES_URL);
      if (!response.ok) throw new Error(`Backend exercises ${response.status}`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];
      return list.map(normalizeExercise);
    } catch {
      if (!EXERCISEDB_API_URL) {
        setErrorMessage('운동 데이터 로딩에 실패해 샘플 추천을 구성했어요.');
        return FALLBACK_EXERCISES.map(normalizeExercise);
      }

      try {
        const response = await fetch(EXERCISEDB_API_URL);
        if (!response.ok) throw new Error(`ExerciseDB ${response.status}`);
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.data || data.exercises || [];
        return list.map(normalizeExercise);
      } catch {
        setErrorMessage('ExerciseDB 연결이 불안정해 샘플 데이터로 추천을 구성했어요.');
        return FALLBACK_EXERCISES.map(normalizeExercise);
      }
    }
  };

  const fetchExerciseVideosFromBackend = async (exercise) => {
    try {
      const url = new URL(`${API_BASE_URL}/api/v1/exercises/${encodeURIComponent(exercise.id)}/videos/`);
      url.search = new URLSearchParams({ level: answers.level || 'beginner' }).toString();
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Backend videos ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Invalid backend video response');
      return data.map((item, index) => ({
        id: item.id || `backend-${exercise.id}-${index}`,
        title: item.title || `${exercise.koName || exercise.name} 운동 영상`,
        channel: item.channel || 'YouTube',
        duration: item.duration || '영상',
        views: item.views || '조회수 정보 없음',
        url: item.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.koName || exercise.name} 맨몸 운동`)}`,
        thumbnail: item.thumbnail || '',
        topPick: item.topPick ?? item.top_pick ?? index === 0,
      }));
    } catch {
      return null;
    }
  };

  const searchYoutubeVideos = async (exercise) => {
    const query = `${exercise.koName || exercise.name} 맨몸 운동 자세 홈트`;
    if (!YOUTUBE_API_KEY) {
      const backendVideos = await fetchExerciseVideosFromBackend(exercise);
      if (backendVideos && backendVideos.length > 0) {
        return backendVideos;
      }
      return buildMockVideos(exercise);
    }

    try {
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.search = new URLSearchParams({
        key: YOUTUBE_API_KEY,
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: '3',
        videoEmbeddable: 'true',
      }).toString();

      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error(`YouTube search ${searchResponse.status}`);
      const searchData = await searchResponse.json();
      const ids = (searchData.items || []).map((item) => item.id.videoId).filter(Boolean);
      if (ids.length === 0) {
        const backendVideos = await fetchExerciseVideosFromBackend(exercise);
        return backendVideos?.length ? backendVideos : buildMockVideos(exercise);
      }

      const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videosUrl.search = new URLSearchParams({
        key: YOUTUBE_API_KEY,
        part: 'snippet,contentDetails,statistics',
        id: ids.join(','),
      }).toString();

      const videosResponse = await fetch(videosUrl);
      if (!videosResponse.ok) throw new Error(`YouTube videos ${videosResponse.status}`);
      const videosData = await videosResponse.json();

      return (videosData.items || []).slice(0, 3).map((item, index) => ({
        id: item.id,
        title: item.snippet?.title || `${exercise.koName} 운동 영상`,
        channel: item.snippet?.channelTitle || 'YouTube',
        duration: parseYoutubeDuration(item.contentDetails?.duration) || '영상',
        views: item.statistics?.viewCount ? `${Number(item.statistics.viewCount).toLocaleString()}회` : '조회수 정보 없음',
        url: `https://www.youtube.com/watch?v=${item.id}`,
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
        topPick: index === 0,
      }));
    } catch (error) {
      console.error(`YouTube 비디오 검색 실패 (${exercise.koName || exercise.name}):`, error);
      // YouTube 검색 실패 시 빈 배열 반환 - runRecommendation에서 감지
      return [];
    }
  };

  const normalizeVideoMap = (videos) =>
    Object.fromEntries(
      Object.entries(videos || {}).map(([exerciseId, items]) => [
        exerciseId,
        (items || []).map((video) => ({
          id: video.id || `${exerciseId}-${Math.random().toString(36).substr(2, 5)}`,
          title: video.title || video.snippet?.title || `${video.koName || video.name || '추천'} 운동 영상`,
          channel: video.channel || video.snippet?.channelTitle || 'YouTube',
          duration: video.duration || video.contentDetails?.duration || '영상',
          views:
            video.views ||
            (video.statistics?.viewCount ? `${Number(video.statistics.viewCount).toLocaleString()}회` : '조회수 정보 없음'),
          url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
          thumbnail:
            video.thumbnail ||
            video.snippet?.thumbnails?.medium?.url ||
            video.snippet?.thumbnails?.default?.url ||
            '',
          topPick: video.topPick ?? video.top_pick ?? false,
        })),
      ]),
    );

  const tryBackendRecommendation = async () => {
    const authToken = token || (await getToken(true));
    if (!authToken) return null;

    const response = await fetch(`${API_BASE_URL}/api/v1/clips/recommend-routine/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        goal: answers.goal,
        duration: answers.duration,
        level: answers.level,
        focus: answers.focus,
        avoid: answers.avoid,
        limit: 6,
        video_exercise_limit: 3,
      }),
    });

    if (!response.ok) return null;
    return response.json();
  };

  const runRecommendation = async () => {
    setPhase('loading');
    setErrorMessage('');
    setRoutineClips([]);

    try {
      const backendResult = await tryBackendRecommendation();
      if (backendResult) {
        const resultExercises = (backendResult.exercises || []).map(normalizeExercise);
        setExercises(resultExercises);
        setActiveExerciseId(resultExercises[0]?.id || null);
        
        // 항상 YouTube 비디오 조회
        const videos = {};
        const failedExercises = [];
        for (const exercise of resultExercises.slice(0, 6)) {
          const videoResult = await searchYoutubeVideos(exercise);
          if (!videoResult || videoResult.length === 0) {
            failedExercises.push(exercise.koName || exercise.name);
          }
          videos[exercise.id] = videoResult || [];
        }
        
        setVideoMap(videos);
        setPhase('result');
        
        const messages = [...(backendResult.source_notes || [])];
        if (failedExercises.length > 0) {
          messages.push(`${failedExercises.join(', ')} YouTube 영상 조회에 실패했습니다.`);
        }
        if (messages.length) {
          setErrorMessage(messages.join(' '));
        }
        return;
      }
    } catch {
      setErrorMessage('백엔드 추천 API 연결에 실패해 화면용 샘플 추천을 표시했어요.');
    }

    const exerciseData = await fetchExercises();
    setExercises(exerciseData);

    const selected = exerciseData
      .filter((exercise) => {
        const selectedFocus = answers.focus?.length ? answers.focus : ['waist'];
        const avoid = answers.avoid || 'none';
        return (
          (exercise.equipment === 'body weight' || exercise.equipment === 'bodyweight') &&
          (selectedFocus.includes(exercise.bodyPart) || selectedFocus.includes(exercise.target)) &&
          (!answers.goal || exercise.goals.includes(answers.goal)) &&
          (!answers.level || exercise.level.includes(answers.level)) &&
          (avoid === 'none' || !exercise.avoid.includes(avoid))
        );
      })
      .slice(0, 6);

    const resultExercises = selected.length > 0 ? selected : exerciseData.slice(0, 5);
    const videos = {};

    for (const exercise of resultExercises.slice(0, 6)) {
      videos[exercise.id] = await searchYoutubeVideos(exercise);
    }

    setExercises(resultExercises);
    setActiveExerciseId(resultExercises[0]?.id || null);
    setVideoMap(videos);
    setPhase('result');
  };

  const goNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep((prev) => prev + 1);
      return;
    }
    runRecommendation();
  };

  const createClip = (exercise, video) => {
    const duration = secondsForDuration(answers.duration);
    return {
      id: `recommend-${exercise.id}-${video.id}`,
      label: video.title,
      meta: video.duration || `${Math.round(duration / 60)}분`,
      url: video.url,
      youtube_url: video.url,
      aiSimplified: false,
      source: 'recommendation',
      exerciseId: exercise.id,
      subtitles: [],
      duration,
    };
  };

  const toggleRoutineClip = (exercise, video) => {
    const clip = createClip(exercise, video);
    setRoutineClips((prev) => {
      if (prev.some((item) => item.id === clip.id)) {
        return prev.filter((item) => item.id !== clip.id);
      }
      return [...prev, clip];
    });
  };

  const isAnswered = currentQuestion.multi
    ? (answers[currentQuestion.id] || []).length > 0
    : Boolean(answers[currentQuestion.id]);

  const renderQuestions = () => (
    <>
      <div className="recommend-progress" aria-label="추천 진행 단계">
        {QUESTIONS.map((question, index) => (
          <span
            key={question.id}
            className={`recommend-progress__dot${index < step ? ' done' : ''}${index === step ? ' active' : ''}`}
          >
            {index + 1}
          </span>
        ))}
      </div>

      <section className="recommend-chat">
        <div className="recommend-bubble">
          <div className="recommend-bubble__meta">맞춤 루틴 추천</div>
          <div className="recommend-bubble__title">{currentQuestion.title}</div>
          <div className="recommend-bubble__sub">{currentQuestion.sub}</div>
        </div>

        <div className={`recommend-options${currentQuestion.options.length > 3 ? ' two-col' : ''}`}>
          {currentQuestion.options.map((option) => {
            const selected = currentQuestion.multi
              ? (answers[currentQuestion.id] || []).includes(option.value)
              : answers[currentQuestion.id] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`recommend-option${selected ? ' selected' : ''}`}
                onClick={() => handleAnswer(option.value)}
              >
                <span className="recommend-option__text">
                  <strong>{option.label}</strong>
                  <small>{option.desc}</small>
                </span>
                <span className="recommend-option__check">✓</span>
              </button>
            );
          })}
        </div>

        <button type="button" className="btn-wine" onClick={goNext} disabled={!isAnswered}>
          {step === QUESTIONS.length - 1 ? '추천 결과 보기' : '다음 질문'}
        </button>
      </section>
    </>
  );

  const renderLoading = () => (
    <section className="recommend-loading">
      <div className="recommend-spinner" aria-hidden="true" />
      <div className="recommend-loading__title">맞춤 홈트 루틴을 찾고 있어요</div>
      <div className="recommend-loading__sub">
        ExerciseDB 맨몸 운동 필터링 후 YouTube 상위 영상을 검색합니다.
      </div>
      <div className="recommend-loading__steps">
        <div className="recommend-loading__step done">조건 분석 완료</div>
        <div className="recommend-loading__step active">ExerciseDB 데이터 필터링</div>
        <div className="recommend-loading__step">YouTube API 검색</div>
      </div>
    </section>
  );

  const renderResult = () => (
    <div className="recommend-result">
      <section className="recommend-summary">
        <div className="recommend-summary__row">
          <span>선택 조건</span>
          <button type="button" onClick={() => { setStep(0); setPhase('questions'); }}>
            다시 설정
          </button>
        </div>
        <div className="recommend-chip-row">
          {summaryChips.map((chip) => (
            <span key={chip} className="recommend-chip">{chip}</span>
          ))}
          <span className="recommend-chip">맨몸 운동</span>
        </div>
      </section>

      {errorMessage && <div className="recommend-notice">{errorMessage}</div>}

      <section className="recommend-section">
        <div className="recommend-section__head">
          <span>추천 동작 목록 (ExerciseDB)</span>
          <small>{filteredExercises.length || exercises.length}개 필터링</small>
        </div>
        <div className="recommend-exercise-list">
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              className={`recommend-exercise${activeExercise?.id === exercise.id ? ' selected' : ''}`}
              onClick={() => setActiveExerciseId(exercise.id)}
            >
              <span className="recommend-exercise__thumb">
                {exercise.gifUrl ? <img src={exercise.gifUrl} alt="" /> : exercise.koName.slice(0, 1)}
              </span>
              <span className="recommend-exercise__info">
                <strong>{exercise.koName}</strong>
                <span>
                  <em>{exercise.bodyPart}</em>
                  <em>{exercise.target}</em>
                  <em>body weight</em>
                </span>
                <small>{exercise.description}</small>
              </span>
              <span className="recommend-exercise__check">✓</span>
            </button>
          ))}
        </div>
      </section>

      {activeExercise && (
        <section className="recommend-section recommend-section--youtube">
          <div className="recommend-section__head">
            <span>YouTube 추천 영상</span>
            <small>{activeExercise.koName} 상위 3개</small>
          </div>
          <div className="recommend-youtube-exercises">
            {exercises.slice(0, 3).map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                className={activeExercise.id === exercise.id ? 'active' : ''}
                onClick={() => setActiveExerciseId(exercise.id)}
              >
                {exercise.koName}
              </button>
            ))}
          </div>
          <div className="recommend-video-list">
            {activeVideos.map((video) => {
              const added = routineClips.some((clip) => clip.id === `recommend-${activeExercise.id}-${video.id}`);
              return (
                <article key={video.id} className={`recommend-video${video.topPick ? ' top-pick' : ''}`}>
                  <a className="recommend-video__thumb" href={video.url} target="_blank" rel="noreferrer">
                    {video.thumbnail ? <img src={video.thumbnail} alt="" /> : <span>▶</span>}
                    {video.topPick && <b>TOP PICK</b>}
                    <small>{video.duration}</small>
                  </a>
                  <div className="recommend-video__body">
                    <strong>{video.title}</strong>
                    <span>{video.channel}</span>
                    <small>{video.views}</small>
                  </div>
                  <button
                    type="button"
                    className={`recommend-add-btn${added ? ' added' : ''}`}
                    onClick={() => toggleRoutineClip(activeExercise, video)}
                  >
                    {added ? '루틴에 추가됨' : '+ 루틴에 추가'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="recommend-section recommend-routine-box">
        <div className="recommend-section__head">
          <span>편집할 루틴 클립</span>
          <small>{routineClips.length}개 선택</small>
        </div>
        {routineClips.length > 0 ? (
          <div className="clip-list">
            {routineClips.map((clip) => (
              <div key={clip.id} className="clip-item">
                <div className="clip-dot" />
                <div className="clip-main">
                  <span>{clip.label}</span>
                  <span className="clip-meta">{clip.meta}</span>
                </div>
                <button type="button" className="clip-delete" onClick={() => setRoutineClips((prev) => prev.filter((item) => item.id !== clip.id))}>
                  삭제
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="recommend-empty">영상 카드에서 루틴에 추가할 클립을 선택해 주세요.</div>
        )}
        <button
          type="button"
          className="btn-wine"
          disabled={routineClips.length === 0}
          onClick={() =>
            onEditRecommendedRoutine?.({
              id: `recommend-${Date.now()}`,
              name: '추천 루틴',
              clips: routineClips,
            })
          }
        >
          루틴 편집하기
        </button>
      </section>
    </div>
  );

  return (
    <ScreenLayout
      screenId="screen-home"
      title="AudioFit"
      subtitle="질문에 답하면 홈트 루틴과 영상을 추천해요"
      onMenuClick={onMenuClick}
    >
      {phase === 'questions' && renderQuestions()}
      {phase === 'loading' && renderLoading()}
      {phase === 'result' && renderResult()}
    </ScreenLayout>
  );
}

export default HomeScreen;
