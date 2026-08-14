import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
import fixtures from "../fixtures/mock-data.json";
import "./styles.css";

type ExampleId = "project-atlas" | "capability-explorer" | "component-gallery";
const gateway = { searchCapabilities: "search_capabilities", executeCapability: "execute_capability" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function queryFrom(value: unknown) {
  if (!isRecord(value)) return "";
  if (typeof value.query === "string") return value.query;
  return isRecord(value.body) && typeof value.body.query === "string" ? value.body.query : "";
}

function projectsFor(query: string) {
  const normalized = query.trim().toLowerCase();
  return fixtures.projects.filter((project) => !normalized || Object.values(project).join(" ").toLowerCase().includes(normalized));
}

function searchCapabilities(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return fixtures.capabilities.filter((capability) => {
    const text = Object.values(capability).join(" ").toLowerCase();
    return words.length === 0 || words.some((word) => text.includes(word));
  });
}

function executeCapability(name: string, body: unknown) {
  const query = queryFrom(body);
  if (name === "demo.projects.search") return { source: "local Connect mock", query, projects: projectsFor(query) };
  if (name === "demo.projects.summary") {
    return { source: "local Connect mock", total: fixtures.projects.length, averageProgress: Math.round(fixtures.projects.reduce((sum, project) => sum + project.progress, 0) / fixtures.projects.length) };
  }
  if (name === "demo.program.release_brief") return { status: "succeeded", value: { title: "Project release brief", query, projects: projectsFor(query) }, receiptId: "local-program-receipt" };
  throw new Error(`Unknown local capability ${name}.`);
}

function launchResult(example: ExampleId) {
  if (example === "component-gallery") return { gallery: fixtures.gallery };
  return { app: { id: example, revision: "local" }, serverTools: gateway };
}

function log(container: HTMLElement, title: string, detail: string) {
  const item = document.createElement("li");
  item.innerHTML = `<strong></strong><span></span>`;
  const strong = item.querySelector("strong");
  const span = item.querySelector("span");
  if (strong) strong.textContent = title;
  if (span) span.textContent = detail;
  container.prepend(item);
}

async function mountExample(card: HTMLElement, example: ExampleId) {
  const frame = card.querySelector<HTMLIFrameElement>("iframe");
  const status = card.querySelector<HTMLElement>("[data-status]");
  const events = card.querySelector<HTMLElement>("[data-log]");
  if (!frame || !status || !events || !frame.contentWindow) throw new Error(`Incomplete playground card for ${example}.`);
  const bridge = new AppBridge(
    null,
    { name: `${example} local host`, version: "1.0.0" },
    { serverTools: {} },
    { hostContext: { theme: "light", displayMode: "inline", availableDisplayModes: ["inline"], locale: "en-GB", timeZone: "Europe/London", platform: "web", containerDimensions: { maxWidth: 820, maxHeight: 900 } } },
  );
  bridge.oncalltool = async ({ name, arguments: args }) => {
    log(events, "tools/call", name);
    try {
      if (name === gateway.searchCapabilities) {
        return { content: [{ type: "text", text: "Authorized capabilities found." }], structuredContent: { matches: searchCapabilities(queryFrom(args)) } };
      }
      if (name === gateway.executeCapability && isRecord(args) && typeof args.name === "string") {
        return { content: [{ type: "text", text: `Executed ${args.name}.` }], structuredContent: executeCapability(args.name, args.body) };
      }
      if (name === "search_projects") return { content: [{ type: "text", text: "Projects found." }], structuredContent: { projects: projectsFor(queryFrom(args)) } };
      return { isError: true, content: [{ type: "text", text: `The local host does not expose ${name}.` }] };
    } catch (cause) {
      return { isError: true, content: [{ type: "text", text: cause instanceof Error ? cause.message : "Local tool failed." }] };
    }
  };
  bridge.onsizechange = ({ height }) => {
    if (height != null) frame.style.height = `${Math.min(Math.max(height, 420), 900)}px`;
  };
  bridge.oninitialized = () => {
    status.textContent = "Connected";
    status.dataset.ready = "true";
    log(events, "Handshake complete", "ui/initialize → ui/notifications/initialized");
    void bridge.sendToolInput({ arguments: {} })
      .then(() => bridge.sendToolResult({ content: [{ type: "text", text: `${example} is ready.` }], structuredContent: launchResult(example) }))
      .then(() => log(events, "Launch delivered", "ordinary structuredContent"));
  };
  await bridge.connect(new PostMessageTransport(frame.contentWindow, frame.contentWindow));
  frame.src = example === "project-atlas" ? "/index.html" : `/${example}/index.html`;
}

for (const card of document.querySelectorAll<HTMLElement>("[data-example]")) {
  const example = card.dataset.example as ExampleId;
  void mountExample(card, example).catch((cause: unknown) => {
    const status = card.querySelector<HTMLElement>("[data-status]");
    if (status) status.textContent = cause instanceof Error ? cause.message : "Host failed";
  });
}
