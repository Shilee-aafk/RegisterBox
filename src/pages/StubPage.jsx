export default function StubPage({ title, emoji = '🚧' }) {
  return (
    <div className="page-content">
      <div className="stub-page">
        <span style={{ fontSize: 48 }}>{emoji}</span>
        <h2>{title}</h2>
        <p>Esta sección está disponible próximamente.</p>
      </div>
    </div>
  );
}
