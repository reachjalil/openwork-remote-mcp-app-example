import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

declare const __APP_VERSION__: string;

type ConnectionState = "standalone" | "connecting" | "connected" | "ready" | "error" | "closed";
const SEARCH_TOOL_NAME = "search_projects";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeToolResult(value: unknown): string {
  if (!isRecord(value)) return "The capability returned no structured result.";
  if (isRecord(value.structuredContent)) return JSON.stringify(value.structuredContent, null, 2);
  if (!Array.isArray(value.content)) return "The capability returned no displayable result.";
  const text = value.content.flatMap((entry) => isRecord(entry) && typeof entry.text === "string" ? [entry.text] : []);
  return text.join("\n") || "The capability completed.";
}

const isEmbedded = window.parent !== window;
const mcpApp = new App(
  { name: "Project Atlas", version: __APP_VERSION__ },
  {},
  { autoResize: true, strict: true },
);

function ProjectAtlas() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(isEmbedded ? "connecting" : "standalone");
  const [query, setQuery] = useState("migration");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEmbedded) return;

    mcpApp.ontoolresult = (toolResult) => {
      setResult(describeToolResult(toolResult));
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
    if (connectionState === "standalone") return "Standalone bundle preview — add the MCP server through OpenWork Connect, or import this page as a static Library app.";
    if (connectionState === "connected") return "MCP Apps handshake complete; waiting for launch data.";
    if (connectionState === "ready") return "Launch data received from the host as structuredContent.";
    if (connectionState === "error") return "The MCP Apps handshake could not be completed.";
    if (connectionState === "closed") return "The host closed this app session.";
    return "Connecting to the MCP Apps host…";
  }, [connectionState]);

  const runSearch = async () => {
    if (connectionState !== "ready") return;
    setBusy(true);
    setResult("");
    try {
      const response = await mcpApp.callServerTool({
        name: SEARCH_TOOL_NAME,
        arguments: { query },
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
          <h1>Project Atlas</h1>
          <p className="subtitle">MCP App revision {__APP_VERSION__}</p>
        </div>
        <span className={`status status-${connectionState}`}>{connectionState}</span>
      </div>
      <p className="host-status">{status}</p>

      <section>
        <h2>Same-server MCP tool</h2>
        <p>The app calls the native <code>{SEARCH_TOOL_NAME}</code> tool on the MCP server that served this resource.</p>
        {connectionState === "ready" ? (
          <div className="capability">
            <label htmlFor="project-query">Project search</label>
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
          <p className="empty">Open this app through the local playground or its standard MCP server to enable Project search.</p>
        )}
      </section>

      {result ? <pre aria-live="polite">{result}</pre> : null}
    </main>
  );
}

const mount = document.getElementById("root");
if (!mount) throw new Error("Project Atlas mount element is missing.");
createRoot(mount).render(<ProjectAtlas />);
