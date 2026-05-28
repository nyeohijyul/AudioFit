/**
 * 1. 컴포넌트의 역할
 *    앱 최초 진입 시 AudioFit 브랜딩(로고·슬로건)을 보여 주는 전체 화면 스플래시입니다.
 *
 * 2. 상태 관리
 *    내부 state 없음. exiting prop으로 퇴장 애니메이션만 제어하며, 표시 시간은 App에서 관리합니다.
 *
 * 3. 최적화 포인트
 *    순수 표시 컴포넌트. CSS 애니메이션만 사용해 JS 부담을 최소화했습니다.
 *
 * 4. 확장 방법
 *    onSkip 클릭 영역, Lottie 로고, localStorage로 최초 1회만 표시 등을 추가할 수 있습니다.
 */

import './SplashScreen.css';

/**
 * 스플래시 화면을 렌더링합니다.
 * @param {boolean} [exiting=false] - true이면 페이드아웃 애니메이션 클래스 적용
 */
function SplashScreen({ exiting = false }) {
  const rootClass = `splash-screen${exiting ? ' splash-screen--exiting' : ''}`;

  return (
    <div className={rootClass} role="presentation" aria-hidden={exiting}>
      <div className="splash-screen__glow" aria-hidden="true" />
      <div className="splash-screen__content">
        <div className="splash-screen__logo-wrap">
          <span className="splash-screen__logo" aria-hidden="true">
            🎙
          </span>
        </div>
        <h1 className="splash-screen__title">AudioFit</h1>
        <p className="splash-screen__tagline">나만의 홈트 라디오</p>
        <div className="splash-screen__loader" aria-label="로딩 중">
          <span className="splash-screen__dot" />
          <span className="splash-screen__dot" />
          <span className="splash-screen__dot" />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
