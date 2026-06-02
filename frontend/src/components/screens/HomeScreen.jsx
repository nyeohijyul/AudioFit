/**
 * 1. 컴포넌트의 역할
 *    AudioFit 앱의 홈 화면(추천·최근·인기 루틴 카드)을 렌더링합니다.
 *
 * 2. 상태 관리
 *    로컬 state 없음. 카드·버튼 클릭 시 onNavigate('player')만 부모에 위임합니다.
 *    레이아웃·스크롤·header 접힘은 ScreenLayout이 담당합니다.
 *
 * 3. 최적화 포인트
 *    TabBar와 분리되어 탭 전환 시 이 Screen만 마운트/리렌더됩니다.
 *
 * 4. 확장 방법
 *    API에서 추천/최근 목록을 fetch해 map 렌더링. Card 하위 컴포넌트 분리 가능.
 */

import ScreenLayout from '../ScreenLayout';

/**
 * @param {(screenId: string) => void} onNavigate - 화면 전환 콜백
 */
function HomeScreen({ onNavigate }) {
  /**
   * 플레이어 화면으로 이동합니다 (카드·시작 버튼 공통).
   */
  const goToPlayer = () => {
    onNavigate('player');
  };

  return (
    <ScreenLayout
      screenId="screen-home"
      title="AudioFit"
      subtitle="좋은 아침이에요 👋 오늘도 같이 운동해요"
    >
      {/* <div className="section">
        <div className="section-title">오늘의 추천 루틴</div>
        <div
          className="card featured"
          onClick={goToPlayer}
          onKeyDown={(e) => e.key === 'Enter' && goToPlayer()}
          role="button"
          tabIndex={0}
        >
          <div className="card-header">
            <div>
              <div className="card-title">🔥 아침 5분 코어 깨우기</div>
              <div className="card-sub">5개 동작 · 15분 · 초보자용</div>
            </div>
            <span className="tag">추천</span>
          </div>
          <div className="tags">
            <span className="tag">코어 강화</span>
            <span className="tag">유산소</span>
            <span className="tag tag-green">광고 없음</span>
          </div>
        </div>
        <button type="button" className="btn-wine" onClick={goToPlayer}>
          ▶ 지금 바로 시작
        </button>
      </div>

      <div className="section">
        <div className="section-title">최근 재생한 루틴</div>
        <div className="card" onClick={goToPlayer} role="button" tabIndex={0}>
          <div className="card-header">
            <div>
              <div className="card-title">💪 전신 홈트 30분</div>
              <div className="card-sub">어제 재생 · 8개 동작 · 30분</div>
            </div>
            <span className="card-chevron">›</span>
          </div>
        </div>
        <div className="card" onClick={goToPlayer} role="button" tabIndex={0}>
          <div className="card-header">
            <div>
              <div className="card-title">🦵 하체 집중 스쿼트</div>
              <div className="card-sub">3일 전 재생 · 6개 동작 · 20분</div>
            </div>
            <span className="card-chevron">›</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">공유된 인기 루틴</div>
        <div className="card">
          <div className="card-title">🧘 자기 전 10분 스트레칭</div>
          <div className="card-sub">❤️ 1,243명 저장 · 초보자 · 10분</div>
          <div className="tags">
            <span className="tag">유연성</span>
            <span className="tag">수면 개선</span>
          </div>
        </div>
      </div> */}
    </ScreenLayout>
  );
}

export default HomeScreen;
