import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ScreenLayout from '../ScreenLayout';

function LoginScreen() {
  const { login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsBusy(true);
    try {
      if (mode === 'signin') {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ScreenLayout screenId="screen-login" title="로그인" subtitle="Firebase로 안전하게 인증합니다">
      <div className="section">
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="form-label">
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              required
            />
          </label>
          <label className="form-label">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8자 이상"
              required
              minLength={8}
            />
          </label>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="primary-btn" disabled={isBusy}>
            {isBusy ? '처리 중...' : mode === 'signin' ? '로그인' : '회원가입'}
          </button>
        </form>
        <div className="auth-toggle-row">
          <span>{mode === 'signin' ? '계정이 없나요?' : '이미 계정이 있나요?'}</span>
          <button type="button" className="link-btn" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? '회원가입' : '로그인'}
          </button>
        </div>
      </div>
    </ScreenLayout>
  );
}

export default LoginScreen;
