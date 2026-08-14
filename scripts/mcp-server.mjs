import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  EXTENSION_ID,
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export const SEARCH_CAPABILITIES_TOOL = "search_capabilities";
export const EXECUTE_CAPABILITY_TOOL = "execute_capability";
export const PROJECT_ATLAS_SEARCH_TOOL = "search_projects";

export const EXAMPLES = {
  projectAtlas: {
    id: "project-atlas",
    title: "Project Atlas",
    description: "A project portfolio UI that discovers and executes authorized capabilities.",
    openTool: "open_project_atlas",
    resourceUri: "ui://openwork-examples/project-atlas/1.0.0/index.html",
    htmlUrl: new URL("../docs/index.html", import.meta.url),
  },
  capabilityExplorer: {
    id: "capability-explorer",
    title: "Capability Explorer",
    description: "A reference UI for semantic capability search and exact execution.",
    openTool: "open_capability_explorer",
    resourceUri: "ui://openwork-examples/capability-explorer/1.0.0/index.html",
    htmlUrl: new URL("../docs/capability-explorer/index.html", import.meta.url),
  },
  componentGallery: {
    id: "component-gallery",
    title: "MCP App Component Gallery",
    description: "Reusable interface patterns for standard MCP Apps.",
    openTool: "open_component_gallery",
    resourceUri: "ui://openwork-examples/component-gallery/1.0.0/index.html",
    htmlUrl: new URL("../docs/component-gallery/index.html", import.meta.url),
  },
};

async function loadFixtures() {
  return JSON.parse(await readFile(new URL("../fixtures/mock-data.json", import.meta.url), "utf8"));
}

function searchProjects(projects, query) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return projects;
  return projects.filter((project) => [project.name, project.summary, project.status, project.owner]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalized));
}

function searchCapabilities(capabilities, query, type, limit) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return capabilities
    .filter((capability) => type === "all" || capability.kind === type)
    .filter((capability) => {
      if (words.length === 0) return true;
      const searchable = [capability.name, capability.title, capability.description, capability.kind]
        .join(" ")
        .toLocaleLowerCase();
      return words.some((word) => searchable.includes(word));
    })
    .slice(0, limit);
}

function appResultText(title) {
  return [{ type: "text", text: `${title} is ready.` }];
}

const appResourceMeta = {
  ui: {
    csp: { connectDomains: [], resourceDomains: [] },
    prefersBorder: true,
  },
};

function registerExampleResource(server, example, resourceHtml) {
  registerAppResource(
    server,
    `${example.id}-ui`,
    example.resourceUri,
    {
      title: example.title,
      description: example.description,
      _meta: appResourceMeta,
    },
    async () => ({
      contents: [{
        uri: example.resourceUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: resourceHtml,
        _meta: appResourceMeta,
      }],
    }),
  );
}

function registerLaunchTool(server, example, structuredContent) {
  registerAppTool(
    server,
    example.openTool,
    {
      title: `Open ${example.title}`,
      description: example.description,
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: {
          resourceUri: example.resourceUri,
          visibility: ["model", "app"],
        },
      },
    },
    async () => ({
      content: appResultText(example.title),
      structuredContent,
      _meta: { exampleRevision: "1.0.0", exampleId: example.id },
    }),
  );
}

export async function createExampleMcpServer(options = {}) {
  const fixtures = options.fixtures ?? await loadFixtures();
  const resourceHtml = options.resourceHtml ?? Object.fromEntries(await Promise.all(
    Object.values(EXAMPLES).map(async (example) => [example.id, await readFile(example.htmlUrl, "utf8")]),
  ));
  const server = new McpServer(
    { name: "openwork-mcp-app-examples", version: "2.0.0" },
    {
      capabilities: {
        extensions: {
          [EXTENSION_ID]: { mimeTypes: [RESOURCE_MIME_TYPE] },
        },
      },
      instructions: "Open any example with its open_* tool. The attached MCP App may call only app-visible tools on this same server.",
    },
  );

  for (const example of Object.values(EXAMPLES)) {
    registerExampleResource(server, example, resourceHtml[example.id]);
  }

  const gateway = {
    searchCapabilities: SEARCH_CAPABILITIES_TOOL,
    executeCapability: EXECUTE_CAPABILITY_TOOL,
  };
  registerLaunchTool(server, EXAMPLES.projectAtlas, {
    app: { id: EXAMPLES.projectAtlas.id, revision: "1.0.0" },
    serverTools: gateway,
  });
  registerLaunchTool(server, EXAMPLES.capabilityExplorer, {
    app: { id: EXAMPLES.capabilityExplorer.id, revision: "1.0.0" },
    serverTools: gateway,
  });
  registerLaunchTool(server, EXAMPLES.componentGallery, { gallery: fixtures.gallery });

  server.registerTool(
    SEARCH_CAPABILITIES_TOOL,
    {
      title: "Search authorized capabilities",
      description: "Search the tools and durable Programs this example server allows the current app to use.",
      inputSchema: z.object({
        query: z.string().default(""),
        type: z.enum(["all", "mcp", "script"]).default("all"),
        limit: z.number().int().min(1).max(25).default(10),
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ query, type, limit }) => {
      const matches = searchCapabilities(fixtures.capabilities, query, type, limit);
      return {
        content: [{ type: "text", text: `Found ${matches.length} authorized capability match(es).` }],
        structuredContent: { matches },
        _meta: { catalogRevision: "fixtures-v1" },
      };
    },
  );

  server.registerTool(
    EXECUTE_CAPABILITY_TOOL,
    {
      title: "Execute an authorized capability",
      description: "Execute the exact capability selected from search. A host should preserve the underlying capability's authorization and confirmation policy.",
      inputSchema: z.object({
        name: z.string(),
        schemaDigest: z.string().optional(),
        body: z.unknown().optional(),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ name, schemaDigest, body = {} }) => {
      const capability = fixtures.capabilities.find((candidate) => candidate.name === name);
      if (!capability) {
        return { isError: true, content: [{ type: "text", text: `Capability ${name} is not authorized.` }] };
      }
      if (schemaDigest && capability.schemaDigest && schemaDigest !== capability.schemaDigest) {
        return { isError: true, content: [{ type: "text", text: `The schema for ${name} changed. Search again before execution.` }] };
      }
      const query = typeof body === "object" && body !== null && "query" in body && typeof body.query === "string"
        ? body.query
        : "";
      let value;
      if (name === "demo.projects.search") {
        value = { source: "example MCP server", query, projects: searchProjects(fixtures.projects, query) };
      } else if (name === "demo.projects.summary") {
        value = {
          source: "example MCP server",
          total: fixtures.projects.length,
          averageProgress: Math.round(fixtures.projects.reduce((sum, project) => sum + project.progress, 0) / fixtures.projects.length),
        };
      } else {
        value = {
          status: "succeeded",
          value: { title: "Project release brief", query, projects: searchProjects(fixtures.projects, query) },
          receiptId: "example-program-receipt",
        };
      }
      return {
        content: [{ type: "text", text: `Executed ${capability.title}.` }],
        structuredContent: value,
        _meta: { capabilityName: capability.name, catalogRevision: "fixtures-v1" },
      };
    },
  );

  server.registerTool(
    PROJECT_ATLAS_SEARCH_TOOL,
    {
      title: "Search projects",
      description: "Search the Project Atlas catalog directly as a native same-server MCP tool.",
      inputSchema: z.object({ query: z.string().default("") }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ query }) => {
      const projects = searchProjects(fixtures.projects, query);
      return {
        content: [{ type: "text", text: `Found ${projects.length} project(s) for “${query}”.` }],
        structuredContent: { source: "example MCP server", query, projects },
        _meta: { projectAtlasRevision: "1.0.0" },
      };
    },
  );

  return server;
}

export function startExampleMcpServer(options = {}) {
  const port = Number(options.port ?? process.env.PORT ?? 8787);
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  const httpServer = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
    if (pathname !== "/mcp" || request.method !== "POST") {
      response.writeHead(pathname === "/mcp" ? 405 : 404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: pathname === "/mcp" ? "method_not_allowed" : "not_found" }));
      return;
    }
    const mcpServer = await createExampleMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    response.on("close", () => {
      void transport.close();
      void mcpServer.close();
    });
    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(request, response);
    } catch (error) {
      if (!response.headersSent) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Internal server error" } }));
      }
      console.error(error);
    }
  });
  httpServer.listen(port, host, () => {
    console.log(`OpenWork MCP App examples listening on http://${host}:${port}/mcp`);
  });
  return httpServer;
}

export const createProjectAtlasMcpServer = createExampleMcpServer;
export const startProjectAtlasMcpServer = startExampleMcpServer;

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  startExampleMcpServer();
}
