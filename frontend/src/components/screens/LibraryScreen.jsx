/**
 * 1. 컴포넌트의 역할
 *    저장된 루틴 목록(보관함), 검색 입력, 삭제·새 루틴 만들기 버튼을 제공합니다.
 *
 * 2. 상태 관리
 *    routines·deletingId는 부모에서 관리. ScreenLayout이 header·스크롤을 담당합니다.
 *
 * 3. 최적화 포인트
 *    TabBar와 분리되어 탭 전환 시 이 Screen만 리렌더됩니다.
 *
 * 4. 확장 방법
 *    검색어 state·필터링, React Query로 서버 동기화, 스와이프 삭제 UI.
 */

import ScreenLayout from '../ScreenLayout';

function LibraryScreen({ onNavigate, routines, deletingId, onDeleteRoutine, onPlayRoutine, onMenuClick }) {
  /**
   * 새 루틴 만들기 화면으로 이동합니다.
   */
  const goToNew = () => {
    onNavigate('new');
  };

  return (
    <ScreenLayout
      screenId="screen-library"
      title="내 루틴 보관함"
      subtitle={`저장된 루틴 ${routines.length}개`}
      onMenuClick={onMenuClick}
    >
      {/* <div className="section" style={{ paddingBottom: 8 }}>
        <input className="input-field" type="text" placeholder="🔍 루틴 이름 검색..." style={{ marginBottom: 0 }} />
      </div> */}

      <div className="section" style={{ paddingTop: 8 }}>
        <div id="library-list">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className={`routine-item${deletingId === routine.id ? ' deleting' : ''}`}
            >
              <div
                className="routine-clickable"
                onClick={() => onPlayRoutine && onPlayRoutine(routine)}
                style={{ display: 'flex', flex: 1, alignItems: 'center', cursor: 'pointer', gap: '12px' }}
              >
                <div className="routine-thumb">{routine.thumb}</div>
                <div className="routine-info" style={{ flex: 1 }}>
                  <div className="routine-name">{routine.name}</div>
                  <div className="routine-meta">{routine.meta}</div>
                </div>
              </div>
              <div className="routine-actions">
                <div className="icon-btn" title="편집">
                  ✏️
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  title="삭제"
                  onClick={() => onDeleteRoutine(routine.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn-outline" onClick={goToNew}>
          + 새 루틴 만들기
        </button>
      </div>
    </ScreenLayout>
  );
}

export default LibraryScreen;
