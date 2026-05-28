/**
 * 1. 컴포넌트의 역할
 *    마이페이지: 운동 통계, 캘린더, 체력 수준, 설정 토글을 표시합니다.
 *
 * 2. 상태 관리
 *    fitnessLevel·settingsToggles는 부모 state. ScreenLayout이 header·스크롤을 담당합니다.
 *
 * 3. 최적화 포인트
 *    TabBar와 분리되어 탭 전환 시 이 Screen만 리렌더됩니다.
 *
 * 4. 확장 방법
 *    캘린더 데이터를 API에서 받아 동적 그리드 생성, 다크모드 시 CSS 변수 전환.
 */

import ScreenLayout from '../ScreenLayout';
import Toggle from '../Toggle';

const LEVEL_OPTIONS = [
  { id: 'beginner', label: '🌱 완전 초보' },
  { id: 'intermediate', label: '🔥 중급자' },
  { id: 'advanced', label: '💪 고급자' },
];

function MyPageScreen({ user, onLogout, fitnessLevel, onSetLevel, settingsToggles, onToggleSetting }) {
  return (
    <ScreenLayout
      screenId="screen-mypage"
      title="마이페이지"
      subtitle={user?.email ? `${user.email} 님, 환영합니다!` : '이번 달 12회 운동했어요 🎉'}
    >
      {user?.email && (
        <div className="section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-title">로그인된 계정</div>
          <button type="button" className="link-btn" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      )}
      <div className="section">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">12</div>
            <div className="stat-label">이번 달 운동</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">4</div>
            <div className="stat-label">저장된 루틴</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">3h</div>
            <div className="stat-label">총 운동 시간</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">5월 운동 기록</div>
        <div className="cal-grid">
          <div className="cal-day hdr">월</div>
          <div className="cal-day hdr">화</div>
          <div className="cal-day hdr">수</div>
          <div className="cal-day hdr">목</div>
          <div className="cal-day hdr">금</div>
          <div className="cal-day hdr">토</div>
          <div className="cal-day hdr">일</div>
          <div className="cal-day" />
          <div className="cal-day done">6</div>
          <div className="cal-day">7</div>
          <div className="cal-day done">8</div>
          <div className="cal-day">9</div>
          <div className="cal-day done">10</div>
          <div className="cal-day">11</div>
          <div className="cal-day done">13</div>
          <div className="cal-day">14</div>
          <div className="cal-day done">15</div>
          <div className="cal-day">16</div>
          <div className="cal-day done">17</div>
          <div className="cal-day">18</div>
          <div className="cal-day today">19</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">나의 체력 수준</div>
        <div className="level-row">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`level-btn${fitnessLevel === opt.id ? ' active' : ''}`}
              onClick={() => onSetLevel(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">설정</div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">용어 쉬운 말로 바꾸기</div>
          </div>
          <Toggle isOn={settingsToggles.t1} onToggle={() => onToggleSetting('t1')} />
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">운동 시작 알림 받기</div>
          </div>
          <Toggle isOn={settingsToggles.t2} onToggle={() => onToggleSetting('t2')} />
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">음성 코칭 속도</div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--wine)', fontWeight: 700, cursor: 'pointer' }}>
            1× 보통 ›
          </div>
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">다크 모드</div>
          </div>
          <Toggle isOn={settingsToggles.t3} onToggle={() => onToggleSetting('t3')} />
        </div>
      </div>
    </ScreenLayout>
  );
}

export default MyPageScreen;
