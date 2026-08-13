import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
import { searchMockProjects } from "./mock-data";
import "./playground.css";

const PROXY_TOOL_NAME = "openwork_remote_app_project_search";
const launchPayload = {
  app: {
    name: "Project Atlas",
    version: "local-dev",
  },
  capabilities: [
    {
      key: "projects",
      title: "Project search",
      toolName: PROXY_TOOL_NAME,
      argumentsField: "arguments",
    },
  ],
};

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing playground element: ${selector}`);
  return element;
}

function readQuery(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
  const outer = value as Record<string, unknown>;
  const inner = typeof outer.arguments === "object" && outer.arguments !== null && !Array.isArray(outer.arguments)
    ? outer.arguments as Record<string, unknown>
    : outer;
  return typeof inner.query === "string" ? inner.query : "";
}

const frame = requireElement<HTMLIFrameElement>("#artifact-frame");
const status = requireElement<HTMLElement>("#host-status");
const events = requireElement<HTMLOListElement>("#event-log");

function logEvent(title: string, detail: string) {
  const item = document.createElement("li");
  item.innerHTML = `<strong>${title}</strong><span></span>`;
  const detailNode = item.querySelector("span");
  if (detailNode) detailNode.textContent = detail;
  events.prepend(item);
}

const bridge = new AppBridge(
  null,
  { name: "Project Atlas local host", version: "1.0.0" },
  { serverTools: {} },
  {
    hostContext: {
      theme: "light",
      displayMode: "inline",
      availableDisplayModes: ["inline"],
      locale: "en-GB",
      timeZone: "Europe/London",
      platform: "web",
      userAgent: "OpenWork Remote MCP App local playground",
      containerDimensions: { maxWidth: 720, maxHeight: 640 },
    },
  },
);

bridge.oncalltool = async (params) => {
  if (params.name !== PROXY_TOOL_NAME) {
    logEvent("Blocked tool call", params.name);
    return {
      isError: true,
      content: [{ type: "text", text: `The local host does not expose ${params.name}.` }],
    };
  }

  const query = readQuery(params.arguments);
  const projects = searchMockProjects(query);
  logEvent("Capability called", `${params.name} · query “${query}” · ${projects.length} result(s)`);
  return {
    content: [{ type: "text", text: `Found ${projects.length} mock project(s) for “${query}”.` }],
    structuredContent: {
      source: "local OpenWork Connect mock",
      query,
      projects,
    },
  };
};

bridge.onsizechange = ({ height }) => {
  if (height == null) return;
  frame.style.height = `${Math.min(Math.max(height, 360), 640)}px`;
};

bridge.oninitialized = () => {
  status.textContent = "Connected";
  status.dataset.state = "ready";
  logEvent("Handshake complete", "The app initialized through the official MCP Apps postMessage transport.");
  void bridge.sendToolInput({ arguments: {} })
    .then(() => bridge.sendToolResult({
      content: [{ type: "text", text: "Project Atlas is ready." }],
      structuredContent: launchPayload,
    }))
    .then(() => logEvent("Launch data delivered", "The host sent capability mappings in tool structuredContent."))
    .catch((error: unknown) => {
      status.textContent = "Launch failed";
      status.dataset.state = "error";
      logEvent("Launch failed", error instanceof Error ? error.message : "Unknown error");
    });
};

const targetWindow = frame.contentWindow;
if (!targetWindow) throw new Error("The local app iframe is unavailable.");

logEvent("Host ready", `Generated proxy tool: ${PROXY_TOOL_NAME}`);
void bridge.connect(new PostMessageTransport(targetWindow, targetWindow))
  .then(() => {
    frame.src = new URL("./?embedded=1", window.location.href).toString();
  })
  .catch((error: unknown) => {
    status.textContent = "Host failed";
    status.dataset.state = "error";
    logEvent("Host failed", error instanceof Error ? error.message : "Unknown error");
  });
