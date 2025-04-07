export default function SensitivityCard({ icon, title, description }) {
  return (
    <div className="sensitivity-card">
      <img src={`/icons/${icon}.png`} alt={title} className="sensitivity-icon" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
