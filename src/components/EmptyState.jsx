export default function EmptyState({ title, description, action }) {
  return (
    <div className="state-block">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="mt-24">{action}</div>}
    </div>
  );
}
