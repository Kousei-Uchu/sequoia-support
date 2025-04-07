export default function SensitivityCard({ icon, title, description }) {
  const isFontAwesome = !icon.startsWith('http');
  
  return (
    <div className="sensitivity-card">
      <div className="sensitivity-header">
        {isFontAwesome ? (
          <i className={`fas fa-${icon} sensitivity-icon`} />
        ) : (
          <img src={icon} alt="" className="sensitivity-icon" />
        )}
        <h3 className="sensitivity-title">{title}</h3>
      </div>
      {description && (
        <div className="sensitivity-description">
          <p>{description}</p>
        </div>
      )}
    </div>
  );
}
