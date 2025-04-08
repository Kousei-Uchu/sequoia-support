export default function SensitivityCard({ icon, title, description }) {
  // Check if icon is a Font Awesome class or a local file
  const isFontAwesome = icon.startsWith('fa-');
  const isLocalIcon = !isFontAwesome && !icon.startsWith('http');
  
  return (
    <div className="sensitivity-card">
      <div className="sensitivity-header">
        {isLocalIcon ? (
          <img 
            src={`${icon}`} 
            alt={title} 
            className="sensitivity-icon" 
            onError={(e) => {
              e.target.style.display = 'none';
              console.error('Failed to load icon:', icon);
            }}
          />
        ) : isFontAwesome ? (
          <i className={`fas ${icon} sensitivity-icon`} />
        ) : (
          <img src={icon} alt={title} className="sensitivity-icon" />
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
