import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { useCallback, useEffect, useMemo, useState } from "react";

export type McpAppConnectionState = "standalone" | "connecting" | "connected" | "ready" | "error" | "closed";

export type CapabilityGateway = {
  searchCapabilities: string;
  executeCapability: string;
};

export type McpAppSession = {
  callTool: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  error: string | null;
  gateway: CapabilityGateway | null;
  launchResult: unknown;
  state: McpAppConnectionState;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function structuredContent(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value) || !isRecord(value.structuredContent)) return null;
  return value.structuredContent;
}

export function capabilityGateway(value: unknown): CapabilityGateway | null {
  const structured = structuredContent(value);
  const tools = structured?.serverTools;
  if (!isRecord(tools)) return null;
  if (typeof tools.searchCapabilities !== "string" || typeof tools.executeCapability !== "string") return null;
  return {
    searchCapabilities: tools.searchCapabilities,
    executeCapability: tools.executeCapability,
  };
}

export function toolResultText(value: unknown): string {
  const structured = structuredContent(value);
  if (structured) return JSON.stringify(structured, null, 2);
  if (!isRecord(value) || !Array.isArray(value.content)) return "The tool returned no displayable result.";
  const text = value.content.flatMap((entry) => (
    isRecord(entry) && typeof entry.text === "string" ? [entry.text] : []
  ));
  return text.join("\n") || "The tool completed.";
}

export function useMcpAppSession(appInfo: { name: string; version: string }): McpAppSession {
  const embedded = window.parent !== window;
  const app = useMemo(() => new App(
    appInfo,
    {},
    { autoResize: true, strict: true },
  ), [appInfo.name, appInfo.version]);
  const [state, setState] = useState<McpAppConnectionState>(embedded ? "connecting" : "standalone");
  const [launchResult, setLaunchResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!embedded) return;
    app.ontoolresult = (result) => {
      setLaunchResult(result);
      setState("ready");
    };
    app.onteardown = async () => {
      setState("closed");
      return {};
    };
    void app.connect(new PostMessageTransport(window.parent, window.parent))
      .then(() => setState((current) => current === "connecting" ? "connected" : current))
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "The MCP Apps handshake failed.");
        setState("error");
      });
  }, [app, embedded]);

  const callTool = useCallback(async (name: string, args: Record<string, unknown> = {}) => (
    app.callServerTool({ name, arguments: args })
  ), [app]);

  return {
    callTool,
    error,
    gateway: capabilityGateway(launchResult),
    launchResult,
    state,
  };
}
