function ScreenNav({onclick}) {
    // <!-- ───────── SCREEN NAV ───────── -->
    return (<div class="screen-nav">
        /**
         * Todo: onclick 이벤트 핸들러를 props로 받아서 각 버튼에 할당하기
         */
        <button class="active" onclick={onclick.bind(null, 'home')}>🏠 홈</button>
        <button onclick={onclick.bind(null, 'new')}>✚ 새 루틴</button>
        <button onclick={onclick.bind(null, 'player')}>▶ 플레이어</button>
        <button onclick={onclick.bind(null, 'library')}>📁 보관함</button>
        <button onclick="showScreen('mypage',this)">👤 마이페이지</button>
    </div>);
}

export default ScreenNav;