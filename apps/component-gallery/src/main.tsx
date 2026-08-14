import { isRecord, structuredContent, useMcpAppSession } from "@openwork-examples/mcp-app-runtime";
import { AppShell, EmptyState, MetricCard, Panel, PrimaryButton, SecondaryButton, SkeletonRows, StatusPill } from "@openwork-examples/ui";
import "@openwork-examples/ui/theme.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

declare const __APP_VERSION__: string;
type GalleryState = "data" | "loading" | "empty" | "error";

function recordsFrom(value: unknown) {
  const gallery = structuredContent(value)?.gallery;
  if (!isRecord(gallery) || !Array.isArray(gallery.records)) return [];
  return gallery.records.filter(isRecord);
}

function ComponentGallery() {
  const session = useMcpAppSession({ name: "MCP App Component Gallery", version: __APP_VERSION__ });
  const [view, setView] = useState<GalleryState>("data");
  const records = recordsFrom(session.launchResult);

  return (
    <AppShell eyebrow="UI PATTERN LIBRARY" title="MCP App Component Gallery" subtitle={`Copyable React patterns · revision ${__APP_VERSION__}`} state={session.state}>
      <Panel title="State switcher" description="Preview deterministic loading, empty, error, and populated states before connecting real tools.">
        <div className="state-switcher">
          {(["data", "loading", "empty", "error"] as GalleryState[]).map((state) => (
            <SecondaryButton key={state} className={view === state ? "active" : ""} onClick={() => setView(state)}>{state}</SecondaryButton>
          ))}
        </div>
      </Panel>

      <Panel title="Metric cards" description="Compact summary elements for structured launch or tool-result data.">
        <div className="metric-grid">
          <MetricCard label="Automations" value="18" change="+3 this week" tone="success" />
          <MetricCard label="Review queue" value="4" change="2 need attention" tone="warning" />
          <MetricCard label="Success rate" value="98.2%" change="Last 30 days" tone="info" />
        </div>
      </Panel>

      <Panel title="Responsive data table" description="Status chips, owners, dates, and row-level actions.">
        {view === "loading" ? <SkeletonRows rows={4} /> : null}
        {view === "empty" ? <EmptyState title="Nothing here yet" description="Use this pattern when a valid query returns no records." action={<PrimaryButton>Create first item</PrimaryButton>} /> : null}
        {view === "error" ? <div className="error-state"><StatusPill tone="danger">Tool error</StatusPill><strong>The provider could not complete this request.</strong><p>Show safe recovery guidance and retain the diagnostic reference supplied by the host.</p><SecondaryButton>Try again</SecondaryButton></div> : null}
        {view === "data" ? (
          <div className="gallery-table" role="table">
            <div className="gallery-row gallery-header" role="row"><span>Name</span><span>Status</span><span>Owner</span><span>Updated</span></div>
            {records.map((record, index) => (
              <div className="gallery-row" role="row" key={String(record.id ?? index)}>
                <span><strong>{String(record.name ?? "Untitled")}</strong><small>{String(record.description ?? "Structured MCP result")}</small></span>
                <span><StatusPill tone={record.status === "Ready" ? "success" : "warning"}>{String(record.status ?? "Unknown")}</StatusPill></span>
                <span>{String(record.owner ?? "Unassigned")}</span>
                <span>{String(record.updated ?? "—")}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel title="Activity timeline" description="A lightweight pattern for execution, approval, and lifecycle events.">
        <ol className="timeline">
          <li><i className="done" /><span><strong>Resource cached</strong><small>Immutable HTML revision verified</small></span><time>09:42</time></li>
          <li><i className="done" /><span><strong>User approved execution</strong><small>Confirmation policy preserved</small></span><time>09:44</time></li>
          <li><i /><span><strong>Capability completed</strong><small>structuredContent delivered to the App</small></span><time>09:45</time></li>
        </ol>
      </Panel>
    </AppShell>
  );
}

const mount = document.getElementById("root");
if (!mount) throw new Error("Component Gallery mount element is missing.");
createRoot(mount).render(<ComponentGallery />);
