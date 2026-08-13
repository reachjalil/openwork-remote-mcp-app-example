import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

declare const __APP_VERSION__: string;

type RemoteCapability = {
  key: string;
  title: string;
  toolName: string;
  argumentsField?: "arguments";
};

type LaunchPayload = {
  app: {
    name: string;
    version: string;
  };
  capabilities: RemoteCapability[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readLaunchPayload(value: unknown): LaunchPayload | null {
  if (!isRecord(value) || !isRecord(value.app) || !Array.isArray(value.capabilities)) return null;
  if (typeof value.app.name !== "string" || typeof value.app.version !== "string") return null;
  const capabilities = value.capabilities.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    if (typeof candidate.key !== "string" || typeof candidate.toolName !== "string") return [];
    const argumentsField: "arguments" | undefined = candidate.argumentsField === "arguments" ? "arguments" : undefined;
    return [{
      key: candidate.key,
      title: typeof candidate.title === "string" ? candidate.title : candidate.key,
      toolName: candidate.toolName,
      ...(argumentsField ? { argumentsField } : {}),
    }];
  });
  return {
    app: { name: value.app.name, version: value.app.version },
    capabilities,
  };
}

function describeToolResult(value: unknown): string {
  if (!isRecord(value)) return "The capability returned no structured result.";
  if (isRecord(value.structuredContent)) return JSON.stringify(value.structuredContent, null, 2);
  if (!Array.isArray(value.content)) return "The capability returned no displayable result.";
  const text = value.content.flatMap((entry) => isRecord(entry) && typeof entry.text === "string" ? [entry.text] : []);
  return text.join("\n") || "The capability completed.";
}

const initialPayload: LaunchPayload = {
  app: { name: "Project Atlas", version: __APP_VERSION__ },
  capabilities: [],
};

const mcpApp = new App(
  { name: "Project Atlas", version: __APP_VERSION__ },
  {},
  { autoResize: true, strict: true },
);

function ProjectAtlas() {
  const [payload, setPayload] = useState(initialPayload);
  const [connectionState, setConnectionState] = useState(window.parent === window ? "standalone" : "connecting");
  const [query, setQuery] = useState("migration");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const capability = payload.capabilities[0] ?? null;
  const status = useMemo(() => {
    if (connectionState === "standalone") return "Standalone preview — import this page URL into OpenWork.";
    if (connectionState === "ready") return "Loaded from OpenWork's immutable cached revision.";
    if (connectionState === "error") return "The MCP Apps handshake could not be completed.";
    return "Connecting to the OpenWork MCP Apps host…";
  }, [connectionState]);

  const runSearch = async () => {
    if (!capability) return;
    setBusy(true);
    setResult("");
    try {
      const response = await mcpApp.callServerTool({
        name: capability.toolName,
        arguments: capability.argumentsField === "arguments" ? { arguments: { query } } : { query },
      });
      setResult(describeToolResult(response));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "The capability call failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>
      <p className="eyebrow">REMOTE MCP APP</p>
      <div className="heading-row">
        <div>
          <h1>{payload.app.name}</h1>
          <p className="subtitle">Cached revision {payload.app.version}</p>
        </div>
        <span className={`status status-${connectionState}`}>{connectionState}</span>
      </div>
      <p className="host-status">{status}</p>

      <section>
        <h2>OpenWork Connect</h2>
        <p>{payload.capabilities.length} OpenWork Connect capability ready</p>
        {capability ? (
          <div className="capability">
            <label htmlFor="project-query">{capability.title}</label>
            <div className="search-row">
              <input
                id="project-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
              />
              <button type="button" disabled={busy || !query.trim()} onClick={() => void runSearch()}>
                {busy ? "Searching…" : "Search"}
              </button>
            </div>
          </div>
        ) : (
          <p className="empty">Import the app and bind its Project search capability to enable this control.</p>
        )}
      </section>

      {result ? <pre aria-live="polite">{result}</pre> : null}
    </main>
  );
}

const mount = document.getElementById("root");
if (!mount) throw new Error("Project Atlas mount element is missing.");
const root = createRoot(mount);
root.render(<StrictMode><ProjectAtlas /></StrictMode>);

mcpApp.ontoolresult = (toolResult) => {
  const next = readLaunchPayload(toolResult.structuredContent);
  if (!next) return;
  root.render(<StrictMode><ProjectAtlasWithPayload payload={next} /></StrictMode>);
};

function ProjectAtlasWithPayload({ payload }: { payload: LaunchPayload }) {
  const [connectionState] = useState("ready");
  return <ProjectAtlasLoaded payload={payload} connectionState={connectionState} />;
}

function ProjectAtlasLoaded({ payload, connectionState }: { payload: LaunchPayload; connectionState: string }) {
  const [query, setQuery] = useState("migration");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const capability = payload.capabilities[0] ?? null;
  const runSearch = async () => {
    if (!capability) return;
    setBusy(true);
    setResult("");
    try {
      const response = await mcpApp.callServerTool({
        name: capability.toolName,
        arguments: capability.argumentsField === "arguments" ? { arguments: { query } } : { query },
      });
      setResult(describeToolResult(response));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "The capability call failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main>
      <p className="eyebrow">REMOTE MCP APP</p>
      <div className="heading-row">
        <div><h1>{payload.app.name}</h1><p className="subtitle">Cached revision {payload.app.version}</p></div>
        <span className={`status status-${connectionState}`}>{connectionState}</span>
      </div>
      <p className="host-status">Loaded from OpenWork's immutable cached revision.</p>
      <section>
        <h2>OpenWork Connect</h2>
        <p>{payload.capabilities.length} OpenWork Connect capability ready</p>
        {capability ? (
          <div className="capability">
            <label htmlFor="project-query">{capability.title}</label>
            <div className="search-row">
              <input id="project-query" value={query} onChange={(event) => setQuery(event.target.value)} />
              <button type="button" disabled={busy || !query.trim()} onClick={() => void runSearch()}>{busy ? "Searching…" : "Search"}</button>
            </div>
          </div>
        ) : <p className="empty">No bound capability was provided.</p>}
      </section>
      {result ? <pre aria-live="polite">{result}</pre> : null}
    </main>
  );
}

mcpApp.onteardown = async () => {
  root.unmount();
  return {};
};

if (window.parent !== window) {
  void mcpApp.connect(new PostMessageTransport(window.parent, window.parent)).catch((error: unknown) => {
    mount.textContent = error instanceof Error ? error.message : "The MCP Apps handshake failed.";
  });
}
