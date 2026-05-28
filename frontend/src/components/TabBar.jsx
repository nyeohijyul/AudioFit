/**
 * 1. 컴포넌트의 역할
 *    폰 화면 하단 5개 탭(홈·새루틴·재생·보관함·내정보)을 렌더링하고 화면 전환을 트리거합니다.
 *    Screen 컴포넌트와 분리되어 AudioFitWireframe에서 고정 배치됩니다.
 *
 * 2. 상태 관리
 *    activeScreen만 props로 받습니다. 탭 변경 시 active 클래스만 갱신되며 Screen은 부모에서 교체됩니다.
 *
 * 3. 최적화 포인트
 *    React.memo로 감싸 TabBar와 Screen의 렌더 경계를 분리합니다.
 *    activeScreen 변경 시 TabBar만 리렌더되고, 활성 Screen만 마운트/언마운트됩니다.
 *
 * 4. 확장 방법
 *    배지(알림 수), 비활성 탭, 커스텀 아이콘(SVG) props로 확장 가능.
 */

import { memo, useCallback } from 'react';
import { TAB_ITEMS } from './constants';

/**
 * @param {string} activeScreen - 현재 활성 화면 ID
 * @param {(screenId: string) => void} onNavigate - 탭 클릭 시 호출되는 화면 전환 함수
 */
function TabBar({ activeScreen, onNavigate }) {
  /**
   * 탭 항목 클릭 시 해당 화면 ID로 이동을 요청합니다.
   * @param {string} screenId - 이동할 화면 ID
   */
  const handleTabClick = useCallback(
    (screenId) => {
      onNavigate(screenId);
    },
    [onNavigate],
  );

  return (
    <nav className="tab-bar tab-bar--fixed" aria-label="주요 메뉴">
      {TAB_ITEMS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-item${activeScreen === tab.id ? ' active' : ''}`}
          onClick={() => handleTabClick(tab.id)}
          aria-current={activeScreen === tab.id ? 'page' : undefined}
        >
          <span className="tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default memo(TabBar);
