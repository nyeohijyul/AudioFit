function Button({ text, onClick }) {
    return <button className="btn-wine" onClick={onClick}>{text}</button>
    // <button className="btn-wine" onclick="showScreen('player', document.querySelector('.screen-nav button:nth-child(3)'))">▶ 지금 바로 시작</button>

}
export default Button;