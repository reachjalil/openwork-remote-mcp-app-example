import type { ButtonHTMLAttributes, ReactNode } from "react";

export function AppShell(props: {
  children: ReactNode;
  eyebrow: string;
  state: string;
  subtitle: string;
  title: string;
}) {
  return (
    <main className="app-shell">
      <header className="app-heading">
        <div>
          <p className="eyebrow">{props.eyebrow}</p>
          <h1>{props.title}</h1>
          <p className="subtitle">{props.subtitle}</p>
        </div>
        <StatusPill tone={props.state === "ready" ? "success" : props.state === "error" ? "danger" : "neutral"}>
          {props.state}
        </StatusPill>
      </header>
      {props.children}
    </main>
  );
}

export function StatusPill(props: { children: ReactNode; tone?: "success" | "warning" | "danger" | "info" | "neutral" }) {
  return <span className={`status-pill status-${props.tone ?? "neutral"}`}>{props.children}</span>;
}

export function Panel(props: { children: ReactNode; description?: string; title: string; actions?: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{props.title}</h2>
          {props.description ? <p>{props.description}</p> : null}
        </div>
        {props.actions ? <div className="panel-actions">{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
}

export function MetricCard(props: { label: string; value: string; change?: string; tone?: "success" | "warning" | "info" }) {
  return (
    <article className="metric-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      {props.change ? <small className={`metric-${props.tone ?? "info"}`}>{props.change}</small> : null}
    </article>
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`primary-button ${props.className ?? ""}`.trim()} />;
}

export function SecondaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`secondary-button ${props.className ?? ""}`.trim()} />;
}

export function EmptyState(props: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">◇</div>
      <strong>{props.title}</strong>
      <p>{props.description}</p>
      {props.action}
    </div>
  );
}

export function JsonResult(props: { value: unknown }) {
  return <pre className="json-result" aria-live="polite">{JSON.stringify(props.value, null, 2)}</pre>;
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return <div className="skeleton-list" aria-label="Loading">{Array.from({ length: rows }, (_, index) => <span key={index} />)}</div>;
}
