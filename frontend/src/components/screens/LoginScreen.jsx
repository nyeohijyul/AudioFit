import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ScreenLayout from '../ScreenLayout';

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
    <ScreenLayout screenId="screen-login" title="로그인" subtitle="Google로 간편하게 시작하세요">
      <div className="section">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <button
            type="button"
            className="primary-btn"
            onClick={handleGoogleLogin}
            disabled={isBusy}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {isBusy ? '처리 중...' : '🔐 Google로 로그인'}
          </button>
          {error && <div className="error-message" style={{ marginTop: '16px', color: 'red' }}>{error}</div>}
        </div>
      </div>
    </ScreenLayout>
  );
}

export default LoginScreen;
