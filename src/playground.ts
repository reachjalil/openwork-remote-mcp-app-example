import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
import { searchMockProjects } from "./mock-data";
import "./playground.css";

const SEARCH_TOOL_NAME = "search_projects";

function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing playground element: ${selector}`);
  return element;
}

function readQuery(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
  const outer = value as Record<string, unknown>;
  return typeof outer.query === "string" ? outer.query : "";
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
  if (params.name !== SEARCH_TOOL_NAME) {
    logEvent("Blocked tool call", params.name);
    return {
      isError: true,
      content: [{ type: "text", text: `The local host does not expose ${params.name}.` }],
    };
  }

  const query = readQuery(params.arguments);
  const projects = searchMockProjects(query);
  logEvent("Native MCP tool called", `${params.name} · query “${query}” · ${projects.length} result(s)`);
  return {
    content: [{ type: "text", text: `Found ${projects.length} mock project(s) for “${query}”.` }],
    structuredContent: {
      source: "local standard MCP server mock",
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
      structuredContent: {
        source: "local standard MCP server mock",
        query: "migration",
        projects: searchMockProjects("migration"),
      },
    }))
    .then(() => logEvent("Launch data delivered", "The host sent the launch tool result through standard structuredContent."))
    .catch((error: unknown) => {
      status.textContent = "Launch failed";
      status.dataset.state = "error";
      logEvent("Launch failed", error instanceof Error ? error.message : "Unknown error");
    });
};

const targetWindow = frame.contentWindow;
if (!targetWindow) throw new Error("The local app iframe is unavailable.");

logEvent("Host ready", `Same-server tool: ${SEARCH_TOOL_NAME}`);
void bridge.connect(new PostMessageTransport(targetWindow, targetWindow))
  .then(() => {
    frame.src = new URL("./?embedded=1", window.location.href).toString();
  })
  .catch((error: unknown) => {
    status.textContent = "Host failed";
    status.dataset.state = "error";
    logEvent("Host failed", error instanceof Error ? error.message : "Unknown error");
  });
