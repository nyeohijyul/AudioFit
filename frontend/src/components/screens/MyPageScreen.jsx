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

function MyPageScreen({ user, onLogout, fitnessLevel, onSetLevel, settingsToggles, onToggleSetting, isDrawer, workoutCount = 0, routinesCount = 4 }) {
  const subtitleText = user?.email ? `${user.email} 님, 환영합니다!` : `이번 달 ${workoutCount}회 운동했어요 🎉`;

  const content = (
    <>
      {/* {isDrawer && (
        <div className="section" style={{ background: 'var(--wine-xlight)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--wine)' }}>마이페이지</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '4px' }}>
            {subtitleText}
          </div>
        </div>
      )} */}

      {user?.email && (
        <div className="section mypage-account-section">
          <div>
            <div className="section-title">로그인된 계정</div>
            <div className="mypage-account-email">{user.email}</div>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      )}

      {/* 이번 달 운동 개별 섹션 -> 나의 운동 섹션 */}
      <div className="section">
        <div className="section-title">나의 운동</div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text2)' }}>기록된 운동 횟수</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--wine)' }}>{workoutCount}회</span>
        </div>
      </div>

      {/* 저장된 루틴 개별 섹션 */}
      <div className="section">
        <div className="section-title">저장된 루틴</div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text2)' }}>저장된 마이 루틴</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--wine)' }}>{routinesCount}개</span>
        </div>
      </div>

      {/* 총 운동 시간 개별 섹션 */}
      {/* <div className="section">
        <div className="section-title">총 운동 시간</div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text2)' }}>누적 운동 시간</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--wine)' }}>3시간</span>
        </div>
      </div> */}

      {/* <div className="section">
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
      </div> */}

      {/* <div className="section">
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
      </div> */}
    </>
  );

  if (isDrawer) {
    return <div className="screen-body" style={{ height: '100%', overflowY: 'auto' }}>{content}</div>;
  }

  return (
    <ScreenLayout
      screenId="screen-mypage"
      title="마이페이지"
      subtitle={user?.email ? `${user.email} 님, 환영합니다!` : '이번 달 12회 운동했어요 🎉'}
    >
      {content}
    </ScreenLayout>
  );
}

export default MyPageScreen;
