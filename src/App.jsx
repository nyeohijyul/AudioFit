import { useEffect, useState } from 'react';
import AudioFitWireframe from './components/AudioFitWireframe';
import SplashScreen from './components/SplashScreen';

/** 스플래시 표시 시간(ms) */
const SPLASH_VISIBLE_MS = 2000;

/** 스플래시 퇴장 애니메이션 시간(ms) */
const SPLASH_EXIT_MS = 450;

/**
 * 앱 루트: 스플래시 후 메인 와이어프레임으로 전환합니다.
 */
function App() {
  const [phase, setPhase] = useState('splash');

  /**
   * 스플래시 표시 → 퇴장 애니메이션 → 메인 앱 순으로 phase를 전환합니다.
   */
  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exiting'), SPLASH_VISIBLE_MS);
    const appTimer = setTimeout(() => setPhase('app'), SPLASH_VISIBLE_MS + SPLASH_EXIT_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(appTimer);
    };
  }, []);

  /**
   * 스플래시 단계인지 여부를 반환합니다.
   */
  const isSplashVisible = phase === 'splash' || phase === 'exiting';

  return (
    <>
      {isSplashVisible && <SplashScreen exiting={phase === 'exiting'} />}
      {phase === 'app' && <AudioFitWireframe />}
    </>
  );
}

export default App;
