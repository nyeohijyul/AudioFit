function Card({ title, description, tags }) {
    return (
        <div className="card featured" onClick={() => showScreen('player', document.querySelector('.screen-nav button:nth-child(3)'))}>
          <div className="card-header">
            <div>
              <div className="card-title">{title}</div>
              <div className="card-sub">{description}</div>
            </div>
            <span className="tag">추천</span>
          </div>
          <div className="tags">
            {tags? tags.map((tag, index) => (
              <span key={index} className={`tag ${tag === '광고 없음' ? 'tag-green' : ''}`}>
                {tag}
              </span>
            )) : null}
          </div>
        </div>
    )
}

export default Card;