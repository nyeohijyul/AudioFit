import { useCallback, useRef, useState } from 'react';

export default function usePlayerTTS(token, getToken) {
  const [ttsPhase, setTtsPhase] = useState('idle'); // idle, playing, paused, done
  const [currentTtsText, setCurrentTtsText] = useState('');
  const [ttsProgress, setTtsProgress] = useState(0);
  const ttsAudioRef = useRef(null);

  const _attachListeners = useCallback((onComplete) => {
    const audio = ttsAudioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (!audio.duration || audio.duration === Infinity) return;
      setTtsProgress(Math.round((audio.currentTime / audio.duration) * 100));
    };

    const onEnded = () => {
      setTtsPhase('done');
      setTtsProgress(100);
      if (typeof onComplete === 'function') onComplete();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const playTTS = useCallback(async (text, onComplete) => {
    if (!text) return;
    setCurrentTtsText(text);
    setTtsPhase('playing');
    setTtsProgress(0);

    try {
      const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:8000';
      const authToken = getToken ? await getToken(true) : token;
      if (!authToken) {
        throw new Error('인증 토큰이 없습니다. 로그인 후 다시 시도해 주세요.');
      }

      const resp = await fetch(`${API_BASE}/api/v1/clips/generate-speech/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg, application/octet-stream, */*',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text, language: 'ko-KR' }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`TTS 생성 실패 ${resp.status} ${txt}`);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      if (ttsAudioRef.current) {
        // cleanup previous listeners
        try { ttsAudioRef.current.pause(); } catch (e) {}
        ttsAudioRef.current.src = url;
        const detach = _attachListeners(onComplete);
        await ttsAudioRef.current.play();
        // return detach for caller if needed
        return detach;
      }
    } catch (err) {
      console.error('playTTS error', err);
      setTtsPhase('idle');
      setCurrentTtsText('');
      setTtsProgress(0);
    }
  }, [token, _attachListeners]);

  const pauseTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      setTtsPhase('paused');
    }
  }, []);

  const resumeTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.play();
      setTtsPhase('playing');
    }
  }, []);

  const stopTTS = useCallback(() => {
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch (e) {}
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current.src = '';
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
