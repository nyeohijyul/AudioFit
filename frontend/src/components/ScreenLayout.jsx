/**
 * 1. 컴포넌트의 역할
 *    각 Screen의 공통 레이아웃: 상단 고정 header, 스크롤 가능한 본문(screen-body)을 제공합니다.
 *    TabBar는 포함하지 않으며, AudioFitWireframe에서 Screen과 분리해 렌더링합니다.
 *
 * 2. 상태 관리
 *    headerCollapsed는 screen-body 스크롤 위치에 따라 로컬 useState로 관리합니다.
 *    화면(screenId)이 바뀔 때 스크롤·접힘 상태를 초기화합니다.
 *
 * 3. 최적화 포인트
 *    스크롤 핸들러는 setState를 임계값(8px) 기준으로만 호출해 불필요한 리렌더를 줄입니다.
 *
 * 4. 확장 방법
 *    collapsed 상태를 Context로 공유하거나, IntersectionObserver로 전환 시점을 세밀하게 조절할 수 있습니다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const SCROLL_COLLAPSE_THRESHOLD = 8;

/**
 * Screen 공통 레이아웃 — 고정 header + 스크롤 body
 * @param {string} screenId - DOM id (예: screen-home)
 * @param {string} [title] - header h2 (headerExtra 없을 때)
 * @param {string} [subtitle] - header p (headerExtra 없을 때)
 * @param {React.ReactNode} [headerExtra] - 플레이어 등 커스텀 header 마크업
 * @param {React.ReactNode} children - screen-body 안에 들어갈 섹션들
 */
function ScreenLayout({ screenId, title, subtitle, headerExtra, onMenuClick, children }) {
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const bodyRef = useRef(null);

  /**
   * 화면 전환 시 스크롤 위치와 header 접힘 상태를 초기화합니다.
   */
  useEffect(() => {
    setHeaderCollapsed(false);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [screenId]);

  /**
   * screen-body 스크롤 시 header를 한 줄(compact) 레이아웃으로 전환합니다.
   */
  const handleBodyScroll = useCallback(() => {
    const scrollTop = bodyRef.current?.scrollTop ?? 0;
    const collapsed = scrollTop > SCROLL_COLLAPSE_THRESHOLD;
    setHeaderCollapsed((prev) => (prev === collapsed ? prev : collapsed));
  }, []);

  const headerClassName = `header screen-header${headerCollapsed ? ' screen-header--collapsed' : ''}`;

  return (
    <div className="screen active" id={screenId}>
      <header className={headerClassName}>
        {headerExtra ?? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
            <div className="screen-header__titles" style={{ flex: 1, minWidth: 0 }}>
              <h2>{title}</h2>
              {subtitle != null && subtitle !== '' && <p>{subtitle}</p>}
            </div>
            {onMenuClick && (
              <button type="button" className="header-menu-btn" onClick={onMenuClick} aria-label="메뉴 열기">
                ☰
              </button>
            )}
          </div>
        )}
      </header>
      <div className="screen-body" ref={bodyRef} onScroll={handleBodyScroll}>
        {children}
      </div>
    </div>
  );
}

export default ScreenLayout;
