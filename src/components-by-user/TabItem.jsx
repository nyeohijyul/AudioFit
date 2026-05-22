function TabItem({ isActive, onClick, icon = {emoji, text} }) {
    return (
        // <div class="tab-item active" onclick="showScreen('home',document.querySelector('.screen-nav button:nth-child(1)'))">
        <div className={`tab-item ${isActive ? 'active' : ''}`} onClick={onClick}>
          <span className="tab-icon">{icon.emoji}</span>{icon.text}
        </div>
    )
}
export default TabItem;