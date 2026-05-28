function ScreenHeader({ title, description }) {
    return (
      <div className="header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    )
}

export default ScreenHeader;