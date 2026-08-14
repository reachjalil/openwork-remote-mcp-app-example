import { isRecord, structuredContent, useMcpAppSession } from "@openwork-examples/mcp-app-runtime";
import { AppShell, EmptyState, JsonResult, Panel, PrimaryButton, SecondaryButton, StatusPill } from "@openwork-examples/ui";
import "@openwork-examples/ui/theme.css";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

declare const __APP_VERSION__: string;

type CapabilityMatch = Record<string, unknown> & { name: string };

function CapabilityExplorer() {
  const session = useMcpAppSession({ name: "Capability Explorer", version: __APP_VERSION__ });
  const [query, setQuery] = useState("project status report");
  const [matches, setMatches] = useState<CapabilityMatch[]>([]);
  const [selected, setSelected] = useState<CapabilityMatch | null>(null);
  const [argumentsText, setArgumentsText] = useState('{\n  "query": "migration"\n}');
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState<"search" | "execute" | null>(null);

  const search = async () => {
    if (!session.gateway) return;
    setBusy("search");
    setResult(null);
    try {
      const response = await session.callTool(session.gateway.searchCapabilities, { query, type: "all", limit: 10 });
      const rawMatches = structuredContent(response)?.matches;
      const next = Array.isArray(rawMatches)
        ? rawMatches.filter((entry): entry is CapabilityMatch => isRecord(entry) && typeof entry.name === "string")
        : [];
      setMatches(next);
      setSelected(next[0] ?? null);
    } catch (cause) {
      setMatches([]);
      setSelected(null);
      setResult({ error: cause instanceof Error ? cause.message : "Capability search failed." });
    } finally {
      setBusy(null);
    }
  };

  const execute = async () => {
    if (!session.gateway || !selected) return;
    setBusy("execute");
    try {
      const body: unknown = argumentsText.trim() ? JSON.parse(argumentsText) : {};
      const response = await session.callTool(session.gateway.executeCapability, {
        name: selected.name,
        ...(typeof selected.schemaDigest === "string" ? { schemaDigest: selected.schemaDigest } : {}),
        body,
      });
      setResult(structuredContent(response) ?? response);
    } catch (cause) {
      setResult({ error: cause instanceof Error ? cause.message : "Capability execution failed." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell eyebrow="CAPABILITY SEARCH" title="Capability Explorer" subtitle={`Discover before you execute · revision ${__APP_VERSION__}`} state={session.state}>
      <Panel title="Search authorized capabilities" description="The tool names come from launch structuredContent. Search and execution are ordinary same-server MCP tools/call.">
        <div className="explorer-search">
          <input aria-label="Capability query" value={query} onChange={(event) => setQuery(event.target.value)} />
          <PrimaryButton disabled={!session.gateway || busy !== null || !query.trim()} onClick={() => void search()}>{busy === "search" ? "Searching…" : "Search"}</PrimaryButton>
        </div>
        {!session.gateway ? <p className="gateway-note">Open through the local playground, its MCP server, or an imported OpenWork resource to receive the capability gateway.</p> : null}
      </Panel>

      <div className="explorer-grid">
        <Panel title="Matches" description={`${matches.length} authorized result(s)`}>
          {matches.length === 0 ? <EmptyState title="No capability selected" description="Search by intent, then choose the exact capability to execute." /> : (
            <div className="match-list">
              {matches.map((match) => (
                <button key={match.name} type="button" className={selected?.name === match.name ? "match-card selected" : "match-card"} onClick={() => setSelected(match)}>
                  <span><strong>{String(match.title ?? match.name)}</strong><small>{match.name}</small></span>
                  <StatusPill tone={match.kind === "script" ? "info" : "neutral"}>{String(match.kind ?? match.source ?? "tool")}</StatusPill>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Execute exact match" description="OpenWork preserves underlying authorization and asks for confirmation before this conservative execution tool runs.">
          {selected ? (
            <>
              <div className="selected-capability"><strong>{String(selected.title ?? selected.name)}</strong><code>{selected.name}</code></div>
              <label htmlFor="capability-arguments">Arguments</label>
              <textarea id="capability-arguments" rows={7} value={argumentsText} onChange={(event) => setArgumentsText(event.target.value)} />
              <div className="execute-actions">
                <SecondaryButton onClick={() => setArgumentsText("{}")}>Clear</SecondaryButton>
                <PrimaryButton disabled={busy !== null} onClick={() => void execute()}>{busy === "execute" ? "Executing…" : "Execute with approval"}</PrimaryButton>
              </div>
            </>
          ) : <EmptyState title="Choose a match" description="Schemas and digests stay attached to the exact result selected from search." />}
        </Panel>
      </div>
      {result ? <JsonResult value={result} /> : null}
    </AppShell>
  );
}

const mount = document.getElementById("root");
if (!mount) throw new Error("Capability Explorer mount element is missing.");
createRoot(mount).render(<CapabilityExplorer />);
