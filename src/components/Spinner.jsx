export default function Spinner({ block = true }) {
  if (!block) return <span className="spinner" />;
  return (
    <div className="spinner-block">
      <span className="spinner" />
    </div>
  );
}
