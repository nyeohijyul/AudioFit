# 재생 화면 TTS 및 타이머 동작 구현 계획

## 개요
현재 재생 화면에서 운동 설명을 모두 텍스트로 표시하고 있어서 가독성이 떨어집니다. 이 문제를 개선하기 위해 3가지 기능을 추가합니다:

1. **설명 TTS 제공**: 각 동작의 설명을 음성으로 재생
2. **동적 화면 표시**: 현재 TTS로 나오는 설명만 표시 (가사 자막처럼)
3. **TTS 후 타이머 실행**: 설명 재생 완료 → 타이머 자동 시작

---

## 1단계: 백엔드 TTS 엔드포인트 구현

### 1.1 목표
프론트엔드에서 텍스트를 전송하면 음성 파일(MP3/WAV) 또는 오디오 스트림을 반환하는 API 구현

### 1.2 구현 방법

#### 옵션 A: Google Cloud Text-to-Speech (권장)
- **장점**: 자연스러운 음성, 한국어 지원 우수, 감정 표현 가능
- **단점**: API 비용 발생 (월 100만 글자 무료, 초과 시 비용)
- **설정**:
  ```python
  # backend/apps/utils/tts.py (신규 파일)
  from google.cloud import texttospeech
  from decouple import config
  
  def generate_speech(text, language_code='ko-KR', voice_name='ko-KR-Neural2-A'):
      """Google Cloud TTS로 텍스트를 음성으로 변환"""
      # GOOGLE_APPLICATION_CREDENTIALS 환경변수 설정 필요
      client = texttospeech.TextToSpeechClient()
      
      input_text = texttospeech.SynthesisInput(text=text)
      voice = texttospeech.VoiceSelectionParams(
          language_code=language_code,
          name=voice_name,
          ssml_gender=texttospeech.SsmlVoiceGender.FEMALE  # 여성 음성
      )
      audio_config = texttospeech.AudioConfig(
          audio_encoding=texttospeech.AudioEncoding.MP3
      )
      
      response = client.synthesize_speech(
          input=input_text,
          voice=voice,
          audio_config=audio_config
      )
      
      return response.audio_content  # MP3 바이너리
  ```

#### 옵션 B: Azure Cognitive Services Speech
- **장점**: 엔터프라이즈급 품질, 한국어 지원
- **단점**: 설정 복잡, 비용 (월 50만 자 무료)

#### 옵션 C: 로컬 오픈소스 (pyttsx3, gTTS)
- **장점**: 무료, 추가 API 키 불필요
- **단점**: 음성 자연스러움이 낮음
- **설정**:
  ```python
  # 간단한 대안 (품질 낮음)
  from gtts import gTTS
  import io
  
  def generate_speech_gtts(text):
      tts = gTTS(text=text, lang='ko', slow=False)
      audio_bytes = io.BytesIO()
      tts.write_to_fp(audio_bytes)
      audio_bytes.seek(0)
      return audio_bytes.getvalue()
  ```

### 1.3 백엔드 API 엔드포인트 설계

**POST `/api/v1/clips/generate-speech/`**

요청:
```json
{
    "text": "30초 동안 스쿼트를 하세요",
    "language": "ko-KR"
}
```

응답 (200 OK):
```
Content-Type: audio/mpeg
[MP3 바이너리 데이터]
```

에러 응답 (400):
```json
{
    "error": "텍스트가 비어있습니다"
}
```

---

## 2단계: 프론트엔드 TTS 플레이어 및 타이머 상태 관리

### 2.1 목표
- TTS 음성 재생 및 진행 상황 추적
- 현재 재생 중인 단계(TTS / 타이머)를 구분
- 음성 끝 시 타이머 자동 시작

### 2.2 PlayerScreen 상태 구조

```javascript
// AudioFitWireframe.jsx의 상태 확장

// 기존
const [curEx, setCurEx] = useState(0);
const [timerSec, setTimerSec] = useState(30);
const [timerRunning, setTimerRunning] = useState(false);

// 추가 상태
const [ttsPhase, setTtsPhase] = useState('idle');
// 'idle': 대기 중
// 'playing': TTS 재생 중
// 'done': TTS 완료, 타이머 시작 예정

const [currentTtsText, setCurrentTtsText] = useState('');
// 현재 재생 중인 TTS 텍스트

const ttsAudioRef = useRef(null);
// <audio> 요소 참조

const [ttsProgress, setTtsProgress] = useState(0);
// TTS 재생 진행도 (0 ~ 100%)
```

### 2.3 TTS 플레이어 훅 (`usePlayerTTS`)

새로운 커스텀 훅을 생성하여 TTS 관리 로직 분리:

```javascript
// frontend/src/hooks/usePlayerTTS.js

import { useRef, useState, useCallback } from 'react';

export function usePlayerTTS() {
  const [ttsPhase, setTtsPhase] = useState('idle'); // idle, playing, done
  const [currentTtsText, setCurrentTtsText] = useState('');
  const [ttsProgress, setTtsProgress] = useState(0);
  const ttsAudioRef = useRef(null);

  /**
   * TTS 음성 재생 시작
   * @param {string} text - 변환할 텍스트
   * @param {Function} onComplete - 재생 완료 콜백
   */
  const playTTS = useCallback(async (text, onComplete) => {
    if (!text) return;

    setCurrentTtsText(text);
    setTtsPhase('playing');
    setTtsProgress(0);

    try {
      // 백엔드 TTS API 호출
      const response = await fetch('http://localhost:8000/api/v1/clips/generate-speech/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // 인증 토큰
        },
        body: JSON.stringify({ text, language: 'ko-KR' }),
      });

      if (!response.ok) {
        throw new Error('TTS 생성 실패');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (ttsAudioRef.current) {
        ttsAudioRef.current.src = audioUrl;
        ttsAudioRef.current.play();
      }
    } catch (error) {
      console.error('TTS 재생 중 오류:', error);
      setTtsPhase('idle');
    }
  }, [token]);

  /**
   * TTS 음성 일시정지
   */
  const pauseTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      setTtsPhase('paused');
    }
  }, []);

  /**
   * TTS 음성 재개
   */
  const resumeTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.play();
      setTtsPhase('playing');
    }
  }, []);

  /**
   * TTS 음성 정지 및 초기화
   */
  const stopTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
    }
    setTtsPhase('idle');
    setCurrentTtsText('');
    setTtsProgress(0);
  }, []);

  return {
    ttsPhase,
    currentTtsText,
    ttsProgress,
    ttsAudioRef,
    playTTS,
    pauseTTS,
    resumeTTS,
    stopTTS,
  };
}
```

### 2.4 AudioFitWireframe에 TTS 상태 통합

```javascript
// AudioFitWireframe.jsx

function AudioFitWireframe() {
  // ... 기존 상태
  const [curEx, setCurEx] = useState(0);
  const [timerSec, setTimerSec] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);

  // TTS 훅
  const { ttsPhase, currentTtsText, ttsProgress, ttsAudioRef, playTTS, stopTTS } = usePlayerTTS();

  /**
   * 동작이 바뀔 때 TTS 시작
   */
  useEffect(() => {
    const exercise = activeExercises[curEx];
    if (exercise && activeScreen === 'player') {
      // 기존 TTS 정지
      stopTTS();
      
      // 새로운 설명 TTS 재생
      playTTS(exercise.desc, () => {
        // TTS 완료 콜백: 타이머 자동 시작
        setTtsPhase('done');
        startTimer();
      });
    }
  }, [curEx, activeScreen, activeExercises, playTTS, stopTTS, startTimer]);

  /**
   * PlayerScreen에 TTS 관련 props 추가
   */
  return (
    <PlayerScreen
      curEx={curEx}
      timerSec={timerSec}
      ttsPhase={ttsPhase}
      currentTtsText={currentTtsText}
      ttsProgress={ttsProgress}
      ttsAudioRef={ttsAudioRef}
      // ... 기존 props
    />
  );
}
```

---

## 3단계: PlayerScreen 컴포넌트 수정

### 3.1 현재 구조
```jsx
<div className="action-big">{exercise.name}</div>
<div className="action-desc">{exercise.desc}</div>  {/* 모든 설명이 한번에 표시 */}
```

### 3.2 변경 후 구조

```jsx
<div className="action-big">{exercise.name}</div>

{/* TTS 단계 */}
{ttsPhase === 'playing' && (
  <div className="tts-display">
    <div className="tts-label">설명 재생 중...</div>
    <div className="tts-text">{currentTtsText}</div>
    <div className="tts-progress-bar">
      <div className="tts-progress-fill" style={{ width: `${ttsProgress}%` }} />
    </div>
  </div>
)}

{/* TTS 완료 또는 스킵된 경우 */}
{ttsPhase !== 'playing' && (
  <div className="action-desc">{exercise.desc}</div>
)}

{/* 타이머 표시 */}
{ttsPhase === 'done' || ttsPhase === 'idle' && (
  <div className="timer-display">
    <div className="timer-label">동작 시행 시간</div>
    <div className="timer-progress">{timerSec}초</div>
  </div>
)}

{/* 숨겨진 audio 요소 */}
<audio ref={ttsAudioRef} onEnded={onTTSEnd} />
```

### 3.3 CSS 추가

```css
/* src/components/AudioFitWireframe.css */

.tts-display {
  padding: 20px;
  margin: 15px 0;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border-radius: 12px;
  text-align: center;
  color: white;
  animation: fadeIn 0.3s ease-in;
}

.tts-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.9;
  margin-bottom: 8px;
}

.tts-text {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.5;
  margin-bottom: 12px;
  letter-spacing: -0.3px;
}

.tts-progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: hidden;
}

.tts-progress-fill {
  height: 100%;
  background: white;
  transition: width 0.1s linear;
}

.timer-display {
  text-align: center;
  padding: 20px;
  border-top: 2px solid var(--surface2);
  margin-top: 20px;
}

.timer-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.timer-progress {
  font-size: 24px;
  font-weight: 600;
  color: var(--wine);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 4단계: 타이머 플로우 수정

### 4.1 기존 플로우
```
동작 선택 → 타이머 시작 (30초) → 타이머 끝 → 다음 동작
```

### 4.2 신규 플로우
```
동작 선택 
  ↓
TTS 재생 설명 (2~5초)
  ↓
TTS 완료 → 타이머 자동 시작 (설정된 시간)
  ↓
타이머 카운트다운
  ↓
타이머 끝 → 다음 동작
```

### 4.3 타이머 시작 로직 수정

```javascript
// AudioFitWireframe.jsx

const startTimer = useCallback(() => {
  if (timerIntervalRef.current) {
    clearInterval(timerIntervalRef.current);
  }
  
  // TTS가 진행 중이면 타이머 시작 안 함
  if (ttsPhase === 'playing') {
    return;
  }
  
  setTimerRunning(true);
  setPlayBtnIcon('⏸');
  
  timerIntervalRef.current = setInterval(() => {
    setTimerSec((prev) => {
      if (prev <= 1) {
        clearInterval(timerIntervalRef.current);
        setTimerRunning(false);
        
        // 다음 동작으로 이동
        if (curEx < activeExercises.length - 1) {
          setCurEx(curEx + 1);
        }
        return activeExercises[curEx + 1]?.duration || 30;
      }
      return prev - 1;
    });
  }, 1000);
}, [ttsPhase, timerRunning, curEx, activeExercises]);
```

---

## 5단계: 선택사항 - TTS 제어 UI

### 5.1 일시정지/스킵 버튼 추가

```jsx
{ttsPhase === 'playing' && (
  <div className="tts-controls">
    <button onClick={() => pauseTTS()}>⏸ 일시정지</button>
    <button onClick={() => stopTTS()} className="skip-btn">건너뛰기 →</button>
  </div>
)}
```

### 5.2 음성 속도 조절 (선택사항)
```javascript
// 음성 속도: 0.5배 ~ 2배
<select onChange={(e) => setTtsRate(Number(e.target.value))}>
  <option value={0.5}>느림 (0.5×)</option>
  <option value={1}>보통 (1×)</option>
  <option value={1.5}>빠름 (1.5×)</option>
</select>
```

---

## 6단계: 인증 및 권한 처리

### 6.1 문제점
- 현재 `useAuth()` 훅이 있으나 PlayerScreen에서 사용 안 함
- TTS API 호출 시 인증 토큰 필요

### 6.2 해결방안

```javascript
// PlayerScreen에서 useAuth 활용
import { useAuth } from '../contexts/AuthContext';

function PlayerScreen({ ... }) {
  const { token } = useAuth();  // 인증 토큰 가져오기
  
  const playTTS = useCallback(async (text) => {
    const response = await fetch('/api/v1/clips/generate-speech/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ text, language: 'ko-KR' }),
    });
    // ...
  }, [token]);
}
```

---

## 7단계: 테스트 계획

### 7.1 단위 테스트
- [ ] `usePlayerTTS` 훅: TTS 상태 전환
- [ ] TTS 재생/일시정지/정지 기능
- [ ] 타이머 자동 시작

### 7.2 통합 테스트
- [ ] 동작 선택 → TTS 재생 → 타이머 시작
- [ ] TTS 건너뛰기 → 타이머 즉시 시작
- [ ] 여러 동작 순회

### 7.3 사용성 테스트
- [ ] TTS 음성 품질 (속도, 명확함, 억양)
- [ ] 화면 표시: 현재 TTS 텍스트만 가시성 높은가?
- [ ] 타이머 시간 정확도

---

## 8단계: 배포 체크리스트

### 백엔드
- [ ] `backend/apps/utils/tts.py` 생성 및 TTS 함수 구현
- [ ] `backend/apps/clips/views.py`에 `/api/v1/clips/generate-speech/` 엔드포인트 추가
- [ ] `requirements.txt`에 TTS 라이브러리 추가 (`google-cloud-texttospeech` 또는 `gtts`)
- [ ] `.env.example`에 TTS 관련 환경변수 추가 (필요시)
- [ ] 단위 테스트 작성

### 프론트엔드
- [ ] `frontend/src/hooks/usePlayerTTS.js` 생성
- [ ] `AudioFitWireframe.jsx`에 TTS 상태 및 로직 추가
- [ ] `PlayerScreen.jsx` 수정 (TTS 표시, 타이머 로직)
- [ ] CSS 스타일 추가 / 기존 스타일 조정
- [ ] 반응형 디자인 테스트

### 문서
- [ ] API 문서 업데이트 (TTS 엔드포인트)
- [ ] 사용자 가이드 (TTS 기능 설명)

---

## 예상 타임라인

| 단계 | 소요 시간 | 담당 |
|------|---------|------|
| 1. 백엔드 TTS API | 2~3시간 | 백엔드 |
| 2. 프론트엔드 TTS 훅 | 1~2시간 | 프론트엔드 |
| 3. PlayerScreen 수정 | 2~3시간 | 프론트엔드 |
| 4. 타이머 플로우 | 1시간 | 프론트엔드 |
| 5. 선택사항 UI | 1~2시간 | 프론트엔드 |
| 6. 테스트 및 디버깅 | 2~3시간 | 전체 |
| **총합** | **9~14시간** | |

---

## 주의사항

1. **API 비용**: Google Cloud TTS 사용 시 비용 발생. 무료 대안(`gtts`) 검토 필요
2. **네트워크 지연**: TTS 생성에 시간 소요 → 로딩 UI 필요
3. **접근성**: 음성 재생 실패 시 설명 텍스트 자동 표시
4. **다중 언어**: 현재 한국어만 지원, 다국어 확장 고려
5. **오프라인 모드**: TTS 없이 설명만 표시하도록 폴백 처리

---

## 참고 자료

- [Google Cloud Text-to-Speech Docs](https://cloud.google.com/text-to-speech/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React useRef Hook](https://react.dev/reference/react/useRef)
