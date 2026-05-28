import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function GoogleLogo() {
  return (
    <svg className="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginScreen() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setIsBusy(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google 로그인에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="auth-login-page" aria-label="AudioFit 로그인">
      <section className="login-screen">
        <div className="login-hero">
          <div className="hero-icon" aria-hidden="true">
            AF
          </div>
          <h1>AudioFit</h1>
          <p className="tagline">
            화면 없이 그대로 따라가는
            <br />
            나만의 스마트 오디오 루틴
          </p>
          <div className="feature-pills" aria-label="주요 기능">
            <span className="pill">유튜브 분석</span>
            <span className="pill">AI 번역</span>
            <span className="pill">음성 코칭</span>
            <span className="pill">광고 없음</span>
          </div>
        </div>

        <div className="login-body">
          <div className="welcome-block">
            <h2>시작해볼까요?</h2>
            <p>
              로그인하면 나만의 루틴을 저장하고
              <br />
              운동 기록을 편하게 관리할 수 있어요.
            </p>
          </div>

          <button type="button" className="btn-google" onClick={handleGoogleLogin} disabled={isBusy}>
            <GoogleLogo />
            {isBusy ? '로그인 중...' : 'Google로 계속하기'}
          </button>

          {error && (
            <div className="login-error-message" role="alert">
              {error}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default LoginScreen;
