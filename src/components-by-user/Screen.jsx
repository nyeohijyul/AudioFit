import ScreenHeader from "./ScreenHeader";
import Section from "./Section";
import TabBar from "./TabBar";

function Screen({ id }) {
    return (
        <div className="screen active" id={id}>
            <ScreenHeader 
                title="AudioFit" 
                description="좋은 아침이에요 👋 오늘도 같이 운동해요" 
            />
            <Section
                sectionTitle="오늘의 추천 루틴"
                card={{ 
                    title: "🔥 아침 5분 코어 깨우기", 
                    description: "5개 동작 · 15분 · 초보자용", 
                    tags: ["코어 강화", "유산소", "광고 없음"] 
                }} 
                button={{ 
                    text: "▶ 지금 바로 시작", 
                    onClick: () => showScreen('player', document.querySelector('.screen-nav button:nth-child(3)')) 
                }} 
            />
            <TabBar activeTab={id} onTabChange={(tab) => showScreen(tab, document.querySelector(`.screen-nav button:nth-child(${getTabIndex(tab)})`))} />
        </div>
    )
}
export default Screen;