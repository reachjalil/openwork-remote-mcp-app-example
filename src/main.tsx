import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { useEffect, useMemo, useState } from "react";
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

type ConnectionState = "standalone" | "connecting" | "connected" | "ready" | "error" | "closed";

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

const isEmbedded = window.parent !== window;
const mcpApp = new App(
  { name: "Project Atlas", version: __APP_VERSION__ },
  {},
  { autoResize: true, strict: true },
);

function ProjectAtlas() {
  const [payload, setPayload] = useState(initialPayload);
  const [connectionState, setConnectionState] = useState<ConnectionState>(isEmbedded ? "connecting" : "standalone");
  const [query, setQuery] = useState("migration");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const capability = payload.capabilities[0] ?? null;

  useEffect(() => {
    if (!isEmbedded) return;

    mcpApp.ontoolresult = (toolResult) => {
      const next = readLaunchPayload(toolResult.structuredContent);
      if (!next) return;
      setPayload(next);
      setConnectionState("ready");
    };
    mcpApp.onteardown = async () => {
      setConnectionState("closed");
      return {};
    };

    void mcpApp.connect(new PostMessageTransport(window.parent, window.parent))
      .then(() => setConnectionState((current) => current === "connecting" ? "connected" : current))
      .catch(() => setConnectionState("error"));
  }, []);

  const status = useMemo(() => {
    if (connectionState === "standalone") return "Standalone bundle preview — import this page URL into OpenWork.";
    if (connectionState === "connected") return "MCP Apps handshake complete; waiting for launch data.";
    if (connectionState === "ready") return "Launch data received from the host as structuredContent.";
    if (connectionState === "error") return "The MCP Apps handshake could not be completed.";
    if (connectionState === "closed") return "The host closed this app session.";
    return "Connecting to the MCP Apps host…";
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
          <p className="subtitle">Artifact revision {payload.app.version}</p>
        </div>
        <span className={`status status-${connectionState}`}>{connectionState}</span>
      </div>
      <p className="host-status">{status}</p>

      <section>
        <h2>OpenWork Connect</h2>
        <p>{payload.capabilities.length} host-provided capability ready</p>
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
          <p className="empty">Open this app through the local playground or import it into OpenWork to bind Project search.</p>
        )}
      </section>

      {result ? <pre aria-live="polite">{result}</pre> : null}
    </main>
  );
}

const mount = document.getElementById("root");
if (!mount) throw new Error("Project Atlas mount element is missing.");
createRoot(mount).render(<ProjectAtlas />);
