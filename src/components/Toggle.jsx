/**
 * 1. 컴포넌트의 역할
 *    ON/OFF 스위치 UI를 렌더링합니다. 새 루틴·마이페이지 설정 등에서 재사용합니다.
 *
 * 2. 상태 관리
 *    내부 state 없음. isOn·onToggle을 부모가 관리합니다(제어 컴포넌트).
 *    여러 화면에서 같은 토글 패턴을 쓰므로 상태는 각 화면/루트에서 두고 UI만 분리했습니다.
 *
 * 3. 최적화 포인트
 *    props가 boolean·함수 두 개뿐이라 memo 적용 시 이득이 작습니다.
 *    필요 시 React.memo로 감쌀 수 있습니다.
 *
 * 4. 확장 방법
 *    disabled, aria-label, 크기 variant props 추가.
 *    접근성을 위해 role="switch"·aria-checked 연결 가능.
 */

/**
 * 토글 스위치를 렌더링합니다.
 * @param {boolean} isOn - 켜짐 여부 (false면 .off 클래스)
 * @param {() => void} onToggle - 클릭 시 부모가 상태를 뒤집도록 호출
 * @param {string} [className] - 추가 클래스
 */
function Toggle({ isOn, onToggle, className = '' }) {
  /**
   * 버튼 클릭 시 부모 onToggle을 호출해 isOn을 반전시킵니다.
   */
  const handleClick = () => {
    onToggle();
  };

  return (
    <button
      type="button"
      className={`toggle${isOn ? '' : ' off'}${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      aria-pressed={isOn}
    />
  );
}

export default Toggle;
