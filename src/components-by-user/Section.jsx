import Card from "./Card";
import Button from "./Button";

function Section({ sectionTitle, card = {title, description, tags}, button= {text, onClick} }) {
    return (
      <div className="section">
        <div className="section-title">{sectionTitle}</div>
        {/* <div className="card featured" onclick="showScreen('player', document.querySelector('.screen-nav button:nth-child(3)'))">
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
            <span className="tag-green tag">광고 없음</span>
          </div>
        </div> */}
        {/* <Card title="🔥 아침 5분 코어 깨우기" description="5개 동작 · 15분 · 초보자용" tags={['코어 강화', '유산소', '광고 없음']} /> */}
        <Card title={card.title} description={card.description} tags={card?.tags} />
        {/* <button className="btn-wine" onclick="showScreen('player', document.querySelector('.screen-nav button:nth-child(3)'))">▶ 지금 바로 시작</button> */}
        {/* <Button text="▶ 지금 바로 시작" onClick={() => showScreen('player', document.querySelector('.screen-nav button:nth-child(3)'))} /> */}
        <Button text={button.text} onClick={button.onClick} />
      </div>
    )
}
export default Section;