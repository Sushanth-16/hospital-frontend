function StatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <strong>{value}</strong>
      <span>{subtitle}</span>
    </div>
  );
}

export default StatCard;
