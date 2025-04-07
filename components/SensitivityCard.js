export default function SensitivityCard({ icon, title, description }) {
  return (
    <div className="sensitivity-card">
      <div className="sensitivity-icon">
        <img src={icon} alt={title} />
      </div>
      <div className="sensitivity-content">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
  )
}
