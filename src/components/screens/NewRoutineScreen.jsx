/**
 * 1. 컴포넌트의 역할
 *    유튜브 링크·구간·번역 모드·루틴 이름을 입력하는 "새 루틴 만들기" 화면입니다.
 *
 * 2. 상태 관리
 *    클립 목록·슬라이더·번역 토글은 부모에서 관리하고 setter만 props로 받습니다.
 *    ScreenLayout이 header·스크롤 영역을 담당합니다.
 *
 * 3. 최적화 포인트
 *    TabBar와 분리되어 탭 전환 시 이 Screen만 리렌더됩니다.
 *
 * 4. 확장 방법
 *    react-hook-form·Zod 검증, YouTube oEmbed API 연동, 구간 미리보기 플레이어 추가.
 */

import ScreenLayout from '../ScreenLayout';
import Toggle from '../Toggle';

function NewRoutineScreen({
  ytLink,
  setYtLink,
  clips,
  onAddClip,
  segSlider,
  setSegSlider,
  endVal,
  translateOn,
  onToggleTranslate,
}) {
  /**
   * 슬라이더 값 변경 시 부모 state를 갱신합니다.
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleSliderChange = (e) => {
    setSegSlider(Number(e.target.value));
  };

  /**
   * 슬라이더 트랙에 와인색 채움 비율을 인라인 스타일로 적용합니다.
   */
  const sliderStyle = {
    background: `linear-gradient(to right, var(--wine) 0%, var(--wine) ${segSlider}%, var(--surface2) ${segSlider}%)`,
  };

  return (
    <ScreenLayout
      screenId="screen-new"
      title="새 루틴 만들기"
      subtitle="유튜브 링크를 붙여 넣으면 AI가 자동 분석해요"
    >
      <div className="section">
        <div className="section-title-numbered">
          <div className="step-num">1</div>
          유튜브 링크 입력
        </div>
        <input
          className="input-field"
          type="text"
          value={ytLink}
          onChange={(e) => setYtLink(e.target.value)}
          placeholder="youtube.com/watch?v=..."
        />
        <div id="clip-list">
          {clips.map((clip) => (
            <div key={clip.id} className="clip-item">
              <div className="clip-dot" />
              {clip.label}
              <span className="clip-meta">{clip.meta}</span>
            </div>
          ))}
        </div>
        <button type="button" className="btn-outline" onClick={onAddClip}>
          + 영상 추가하기
        </button>
      </div>

      <div className="section">
        <div className="section-title-numbered">
          <div className="step-num">2</div>
          구간 선택
        </div>
        <div className="time-inputs">
          <div className="time-box">
            ⏱ 시작 &nbsp;<strong>00:00</strong>
          </div>
          <div className="time-box">
            🏁 종료 &nbsp;<strong>{endVal}</strong>
          </div>
        </div>
        <input
          className="real-range"
          type="range"
          min="0"
          max="60"
          value={segSlider}
          style={sliderStyle}
          onChange={handleSliderChange}
        />
        <div className="range-labels">
          <span>0:00</span>
          <span>영상 전체 길이 60분</span>
        </div>
      </div>

      <div className="section">
        <div className="section-title-numbered">
          <div className="step-num">3</div>
          번역 모드
        </div>
        <div className="toggle-row">
          <div>
            <div className="toggle-label">초보자 언어로 바꾸기</div>
          </div>
          <Toggle isOn={translateOn} onToggle={onToggleTranslate} />
        </div>
        <div className="translate-example">
          <strong>버피 →</strong> &quot;서서 뛰다가 바닥에 손 짚고 엎드렸다 일어나기&quot;
          <br />
          <strong>플랭크 →</strong> &quot;팔꿈치를 바닥에 대고 몸을 일자로 버티기&quot;
        </div>
      </div>

      <div className="section">
        <div className="section-title-numbered">
          <div className="step-num">4</div>
          루틴 이름 짓기
        </div>
        <input className="input-field" type="text" placeholder="예: 아침 10분 코어 루틴" />
        <button type="button" className="btn-wine">
          ✔ 루틴 저장하고 보관함에 추가
        </button>
      </div>
    </ScreenLayout>
  );
}

export default NewRoutineScreen;
