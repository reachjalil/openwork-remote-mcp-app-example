import { isRecord, structuredContent, toolResultText, useMcpAppSession } from "@openwork-examples/mcp-app-runtime";
import { AppShell, EmptyState, JsonResult, MetricCard, Panel, PrimaryButton, StatusPill } from "@openwork-examples/ui";
import "@openwork-examples/ui/theme.css";
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

declare const __APP_VERSION__: string;

type Project = {
  id: string;
  name: string;
  owner: string;
  status: string;
  summary: string;
  progress: number;
};

function findProjects(value: unknown, depth = 0): Project[] {
  if (depth > 5) return [];
  if (Array.isArray(value)) {
    const records = value.filter(isRecord);
    if (records.length > 0 && records.every((entry) => typeof entry.name === "string")) {
      return records.map((entry, index) => ({
        id: typeof entry.id === "string" ? entry.id : `project-${index}`,
        name: String(entry.name),
        owner: typeof entry.owner === "string" ? entry.owner : "Unassigned",
        status: typeof entry.status === "string" ? entry.status : "Active",
        summary: typeof entry.summary === "string" ? entry.summary : "No summary supplied.",
        progress: typeof entry.progress === "number" ? entry.progress : 0,
      }));
    }
  }
  if (!isRecord(value)) return [];
  for (const child of Object.values(value)) {
    const projects = findProjects(child, depth + 1);
    if (projects.length > 0) return projects;
  }
  return [];
}

function ProjectAtlas() {
  const session = useMcpAppSession({ name: "Project Atlas", version: __APP_VERSION__ });
  const [query, setQuery] = useState("migration");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const selected = projects.find((project) => project.id === selectedId) ?? projects[0] ?? null;
  const averageProgress = useMemo(() => (
    projects.length === 0 ? 0 : Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
  ), [projects]);

  const search = async () => {
    if (session.state !== "ready") return;
    setBusy(true);
    setResult(null);
    try {
      let response: unknown;
      if (session.gateway) {
        const searchResult = await session.callTool(session.gateway.searchCapabilities, {
          query: `${query} projects status owner`,
          type: "all",
          limit: 8,
        });
        const matches = structuredContent(searchResult)?.matches;
        const candidates = Array.isArray(matches) ? matches.filter(isRecord) : [];
        const match = candidates.find((entry) => /project|program|search/i.test(String(entry.name ?? ""))) ?? candidates[0];
        if (!match || typeof match.name !== "string") throw new Error("No authorized project capability matched this search.");
        response = await session.callTool(session.gateway.executeCapability, {
          name: match.name,
          ...(typeof match.schemaDigest === "string" ? { schemaDigest: match.schemaDigest } : {}),
          body: { query },
        });
      } else {
        response = await session.callTool("search_projects", { query });
      }
      const nextProjects = findProjects(response);
      setProjects(nextProjects);
      setSelectedId(nextProjects[0]?.id ?? null);
      setResult(structuredContent(response) ?? toolResultText(response));
    } catch (cause) {
      setProjects([]);
      setResult({ error: cause instanceof Error ? cause.message : "Project search failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell eyebrow="STANDARD MCP APP" title="Project Atlas" subtitle={`Portfolio dashboard · revision ${__APP_VERSION__}`} state={session.state}>
      <Panel title="Portfolio pulse" description="Metrics and table rows arrive from a same-server MCP tool result.">
        <div className="metric-grid">
          <MetricCard label="Matching projects" value={String(projects.length)} change={projects.length ? "Live result" : "Awaiting search"} />
          <MetricCard label="Average progress" value={`${averageProgress}%`} change="Across current result" tone="success" />
          <MetricCard label="Needs attention" value={String(projects.filter((project) => /risk|blocked/i.test(project.status)).length)} change="Policy-owned status" tone="warning" />
        </div>
      </Panel>

      <Panel title="Project search" description={session.gateway ? "OpenWork supplied capability search and execution through launch structuredContent." : "The native server exposes search_projects on this same MCP connection."}>
        <div className="search-bar">
          <input aria-label="Project query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" />
          <PrimaryButton disabled={busy || session.state !== "ready" || !query.trim()} onClick={() => void search()}>
            {busy ? "Searching…" : "Search"}
          </PrimaryButton>
        </div>
        {session.state === "standalone" ? <p className="standalone-note">Open this bundle through the local playground, its MCP server, or OpenWork to connect the UI.</p> : null}
      </Panel>

      <Panel title="Results" description="Select a row to inspect a compact detail panel.">
        {projects.length === 0 ? (
          <EmptyState title={busy ? "Searching capabilities" : "No projects loaded"} description="Run a search after the MCP Apps handshake completes." />
        ) : (
          <div className="project-layout">
            <div className="project-table" role="table" aria-label="Projects">
              {projects.map((project) => (
                <button key={project.id} type="button" className={selected?.id === project.id ? "project-row selected" : "project-row"} onClick={() => setSelectedId(project.id)}>
                  <span><strong>{project.name}</strong><small>{project.owner}</small></span>
                  <StatusPill tone={/risk|blocked/i.test(project.status) ? "warning" : "success"}>{project.status}</StatusPill>
                  <span className="progress-value">{project.progress}%</span>
                </button>
              ))}
            </div>
            {selected ? (
              <aside className="project-detail">
                <p className="eyebrow">SELECTED PROJECT</p>
                <h3>{selected.name}</h3>
                <p>{selected.summary}</p>
                <dl><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Progress</dt><dd>{selected.progress}%</dd></div></dl>
              </aside>
            ) : null}
          </div>
        )}
      </Panel>
      {result ? <JsonResult value={result} /> : null}
    </AppShell>
  );
}

const mount = document.getElementById("root");
if (!mount) throw new Error("Project Atlas mount element is missing.");
createRoot(mount).render(<ProjectAtlas />);
