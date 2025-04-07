export default function SensitivityCard({ icon, title, description }) {
  return (
    <div className="sensitivity-card">
      <div className="sensitivity-header">
        {icon && <img src={icon} alt="" className="sensitivity-icon" />}
        <h3>{title}</h3>
      </div>
      {description && (
        <div className="sensitivity-description">
          <p>{description}</p>
        </div>
      )}
    </div>
  );
}
