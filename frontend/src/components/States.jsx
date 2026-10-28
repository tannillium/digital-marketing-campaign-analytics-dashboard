export function LoadingState() { return <div className="state-message" role="status">Loading data…</div>; }
export function EmptyState({ children = "No data is available for this period." }) { return <div className="state-message">{children}</div>; }
export function ErrorState({ message }) { return <div className="state-message error-message" role="alert">{message}</div>; }

export function ChartCard({ title, description, loading, error, empty, children }) {
  return <section className="plain-card chart-card"><div className="card-heading"><h2>{title}</h2>{description && <p>{description}</p>}</div>{loading ? <LoadingState /> : error ? <ErrorState message={error} /> : empty ? <EmptyState /> : children}</section>;
}
