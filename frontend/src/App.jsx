import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AudioFitWireframe from './components/AudioFitWireframe';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/screens/LoginScreen';

/** 스플래시 표시 시간(ms) */
const SPLASH_VISIBLE_MS = 2000;

/** 스플래시 퇴장 애니메이션 시간(ms) */
const SPLASH_EXIT_MS = 450;

/**
 * 인증 상태에 따라 로그인 화면 또는 메인 앱을 렌더링합니다.
 */
function AppContent() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div className="auth-loading">인증 상태를 확인하는 중입니다...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AudioFitWireframe user={user} onLogout={logout} />;
}

function App() {
  const [phase, setPhase] = useState('splash');

  useEffect(() => {
    const exitTimer = setTimeout(() => setPhase('exiting'), SPLASH_VISIBLE_MS);
    const appTimer = setTimeout(() => setPhase('app'), SPLASH_VISIBLE_MS + SPLASH_EXIT_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(appTimer);
    };
  }, []);

  const isSplashVisible = phase === 'splash' || phase === 'exiting';

  return (
    <AuthProvider>
      {isSplashVisible && <SplashScreen exiting={phase === 'exiting'} />}
      {phase === 'app' && <AppContent />}
    </AuthProvider>
  );
}

export default App;
