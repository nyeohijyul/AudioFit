/**
 * [사용하지 않는 컴포넌트]
 * 핸드폰 portrait 환경에서는 화면에 표시하지 않습니다.
 * 하단 TabBar로만 화면 전환하며, 이 컴포넌트는 와이어프레임 원본 호환을 위해 유지합니다.
 *
 * 1. 컴포넌트의 역할
 *    와이어프레임 데모용 상단 화면 전환 버튼(폰 바깥 네비)을 제공합니다.
 *
 * 2. 상태 관리
 *    activeScreen을 부모에서 받아 active 클래스를 적용합니다.
 *    데모·프로토타입용이므로 라우터 대신 단순 state 전환과 연결됩니다.
 *
 * 3. 최적화 포인트
 *    정적 SCREEN_NAV_ITEMS 배열을 map만 하므로 비용이 매우 작습니다.
 *
 * 4. 확장 방법
 *    실제 앱에서는 React Router NavLink로 대체하거나 이 컴포넌트를 제거할 수 있습니다.
 */

import { SCREEN_NAV_ITEMS } from './constants';

/**
 * @param {string} activeScreen - 현재 활성 화면 ID
 * @param {(screenId: string) => void} onNavigate - 버튼 클릭 시 화면 전환
 */
function ScreenNav({ activeScreen, onNavigate }) {
  /**
   * 네비 버튼 클릭 핸들러
   * @param {string} screenId - 이동할 화면
   */
  const handleNavClick = (screenId) => {
    onNavigate(screenId);
  };

  return (
    <div className="screen-nav">
      {SCREEN_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={activeScreen === item.id ? 'active' : ''}
          onClick={() => handleNavClick(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default ScreenNav;
